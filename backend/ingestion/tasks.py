"""
Celery tasks for async file processing.

When a file is uploaded via the API, the view creates a DataSource row
and dispatches process_upload to Celery. This task:
  1. Reads the file using the appropriate parser
  2. Creates EmissionRecords for each successfully parsed row
  3. Runs validation and auto-flags suspicious records
  4. Updates the DataSource with processing stats
"""

import logging
from datetime import date
from decimal import Decimal

from celery import shared_task
from django.utils import timezone

from company.models import Facility
from dataSource.models import DataSource
from emissionRecord.models import EmissionRecord
from auditLog.models import AuditLog

from .parsers import get_parser
from .validators import validate_record

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_upload(self, data_source_id: int, user_id: int | None = None):
    """
    Main ingestion task. Parses the uploaded file, creates EmissionRecords,
    validates them, and updates the DataSource status.
    """
    try:
        ds = DataSource.objects.select_related("company").get(pk=data_source_id)
    except DataSource.DoesNotExist:
        logger.error(f"DataSource {data_source_id} not found")
        return

    # Mark as processing
    ds.status = "PROCESSING"
    ds.save(update_fields=["status"])

    try:
        # Get the right parser for this source type
        parser = get_parser(ds.source_type)

        # Parse the file
        file_path = ds.raw_file.path
        parsed_records, parse_errors = parser.parse(file_path)

        ds.total_rows = len(parsed_records) + len(parse_errors)
        ds.failed_rows = len(parse_errors)

        # Build facility lookup for this company (SAP plant code → Facility)
        facility_map = {}
        for facility in Facility.objects.filter(company=ds.company):
            if facility.sap_plant_code:
                facility_map[facility.sap_plant_code] = facility

        # Create EmissionRecords in bulk
        created_records = []
        for pr in parsed_records:
            try:
                # Resolve facility from SAP plant code
                facility = facility_map.get(pr.facility_sap_code) if pr.facility_sap_code else None

                record = EmissionRecord(
                    company=ds.company,
                    source=ds,
                    source_row_number=pr.row_number,
                    scope=pr.scope,
                    scope_3_category=pr.scope_3_category,
                    activity_type=pr.activity_type,
                    raw_quantity=pr.raw_quantity,
                    raw_unit=pr.raw_unit,
                    normalized_quantity=pr.normalized_quantity,
                    normalized_unit=pr.normalized_unit,
                    emission_factor=pr.emission_factor,
                    emission_factor_source=pr.emission_factor_source,
                    co2e_kg=pr.co2e_kg,
                    activity_start_date=date.fromisoformat(pr.activity_start_date),
                    activity_end_date=(
                        date.fromisoformat(pr.activity_end_date)
                        if pr.activity_end_date
                        else None
                    ),
                    facility=facility,
                    raw_data=pr.raw_data,
                    status="PENDING",
                )
                created_records.append(record)
            except Exception as exc:
                ds.failed_rows += 1
                logger.warning(
                    f"Failed to create record for row {pr.row_number}: {exc}"
                )

        # Bulk create for performance (one INSERT instead of N)
        EmissionRecord.objects.bulk_create(created_records, batch_size=500)

        ds.successful_rows = len(created_records)

        # Run validation on each created record and auto-flag suspicious ones
        flagged_count = 0
        for record in created_records:
            # Re-fetch to get the PK assigned by bulk_create
            pass

        # Refresh PKs — bulk_create on PostgreSQL returns PKs
        for record in created_records:
            flags = validate_record(record)
            if flags:
                record.status = "FLAGGED"
                record.flag_reasons = flags
                record.save(update_fields=["status", "flag_reasons"])
                flagged_count += 1

        # Store error summary
        error_dict = {}
        for pe in parse_errors:
            error_dict[str(pe.row_number)] = pe.error
        ds.error_summary = error_dict

        # Set final status
        if ds.failed_rows == 0:
            ds.status = "COMPLETED"
        elif ds.successful_rows == 0:
            ds.status = "FAILED"
        else:
            ds.status = "PARTIALLY_FAILED"

        ds.processed_at = timezone.now()
        ds.save()

        logger.info(
            f"Processed DataSource {data_source_id}: "
            f"{ds.successful_rows} ok, {ds.failed_rows} failed, "
            f"{flagged_count} flagged"
        )

    except Exception as exc:
        logger.exception(f"Fatal error processing DataSource {data_source_id}")
        ds.status = "FAILED"
        ds.error_summary = {"fatal": str(exc)}
        ds.processed_at = timezone.now()
        ds.save()
        raise self.retry(exc=exc)
