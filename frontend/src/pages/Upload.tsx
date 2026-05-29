import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload as UploadIcon } from "lucide-react";
import FileDropzone from "@/components/upload/FileDropzone";
import UploadHistory from "@/components/upload/UploadHistory";
import ValidationSummary from "@/components/upload/ValidationSummary";
import { useUpload } from "@/hooks/useSources";
import { useSources } from "@/hooks/useSources";
import toast from "react-hot-toast";
import type { SourceType, DataSource } from "@/types";

/* ── Sample format previews ── */
const SAP_SAMPLE = [
  { column: "WERKS", meaning: "Plant Code", confidence: "98%", confidenceColor: "text-emerald-600" },
  { column: "MATNR", meaning: "Material ID", confidence: "92%", confidenceColor: "text-emerald-600" },
  { column: "MENGE", meaning: "Quantity", confidence: "100%", confidenceColor: "text-emerald-600" },
  { column: "MEINS", meaning: "Unit of Measure", confidence: "95%", confidenceColor: "text-emerald-600" },
  { column: "BUDAT", meaning: "Posting Date", confidence: "97%", confidenceColor: "text-emerald-600" },
  { column: "BWART", meaning: "Movement Type", confidence: "88%", confidenceColor: "text-amber-600" },
];

const UTILITY_SAMPLE = [
  { column: "meter_id", meaning: "Meter Identifier", confidence: "100%", confidenceColor: "text-emerald-600" },
  { column: "billing_start", meaning: "Billing Period Start", confidence: "96%", confidenceColor: "text-emerald-600" },
  { column: "billing_end", meaning: "Billing Period End", confidence: "96%", confidenceColor: "text-emerald-600" },
  { column: "consumption_kwh", meaning: "Energy Consumption", confidence: "100%", confidenceColor: "text-emerald-600" },
  { column: "unit", meaning: "Unit (kWh/MWh)", confidence: "95%", confidenceColor: "text-emerald-600" },
];

const TRAVEL_SAMPLE = [
  { column: "employee_id", meaning: "Employee ID", confidence: "100%", confidenceColor: "text-emerald-600" },
  { column: "travel_type", meaning: "Travel Category", confidence: "94%", confidenceColor: "text-emerald-600" },
  { column: "origin", meaning: "Origin Airport", confidence: "92%", confidenceColor: "text-emerald-600" },
  { column: "destination", meaning: "Destination Airport", confidence: "92%", confidenceColor: "text-emerald-600" },
  { column: "cabin_class", meaning: "Cabin Class", confidence: "97%", confidenceColor: "text-emerald-600" },
  { column: "hotel_nights", meaning: "Hotel Nights", confidence: "100%", confidenceColor: "text-emerald-600" },
];

const SOURCE_CONFIGS: Record<
  string,
  { type: SourceType; label: string; samples: typeof SAP_SAMPLE; warnings: string[] }
> = {
  sap: {
    type: "SAP_FUEL",
    label: "SAP Fuel & Procurement",
    samples: SAP_SAMPLE,
    warnings: [
      "German headers will be auto-detected and mapped",
      "Unknown plant codes generate warnings",
      "Unit normalization: LTR → L, KGM → kg",
    ],
  },
  utility: {
    type: "UTILITY_ELECTRICITY",
    label: "Utility Electricity",
    samples: UTILITY_SAMPLE,
    warnings: [
      "Billing periods are extracted automatically",
      "kWh/MWh unit conversion is handled",
      "Missing meter IDs will be flagged",
    ],
  },
  travel: {
    type: "TRAVEL",
    label: "Corporate Travel",
    samples: TRAVEL_SAMPLE,
    warnings: [
      "Distance estimation uses IATA airport codes",
      "Unknown airports will be flagged for review",
      "Hotel stays use region-specific emission factors",
    ],
  },
};

const UploadPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("sap");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastUpload, setLastUpload] = useState<DataSource | null>(null);
  const uploadMutation = useUpload();

  const config = SOURCE_CONFIGS[activeTab];

  // Fetch upload history for this source type
  const { data: sourcesData, isLoading: sourcesLoading } = useSources({
    source_type: config.type,
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      { file: selectedFile, sourceType: config.type },
      {
        onSuccess: (data) => {
          toast.success(
            `Uploaded ${data.original_filename} — ${data.successful_rows} rows processed`,
          );
          setSelectedFile(null);
          setLastUpload(data);
        },
        onError: (err: any) => {
          if (err.response?.status === 409) {
            toast.error("This file has already been uploaded.");
          } else {
            toast.error(
              err.response?.data?.error ||
                err.response?.data?.file?.[0] ||
                "Upload failed",
            );
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedFile(null); setLastUpload(null); }}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="sap" className="text-xs font-semibold">
            SAP Fuel
          </TabsTrigger>
          <TabsTrigger value="utility" className="text-xs font-semibold">
            Utility
          </TabsTrigger>
          <TabsTrigger value="travel" className="text-xs font-semibold">
            Travel
          </TabsTrigger>
        </TabsList>

        {Object.entries(SOURCE_CONFIGS).map(([key, cfg]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            {/* Upload section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Dropzone */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Upload {cfg.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileDropzone
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClear={() => setSelectedFile(null)}
                    isUploading={uploadMutation.isPending}
                  />

                  {selectedFile && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {uploadMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadIcon className="mr-2 h-4 w-4" />
                      )}
                      {uploadMutation.isPending
                        ? "Processing…"
                        : "Upload & Process"}
                    </Button>
                  )}

                  {/* Warnings */}
                  <div className="space-y-1.5">
                    {cfg.warnings.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {w}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Validation result or sample preview */}
              {lastUpload ? (
                <ValidationSummary source={lastUpload} />
              ) : (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Expected Column Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px]">
                              Column
                            </TableHead>
                            <TableHead className="text-[10px]">
                              Detected Meaning
                            </TableHead>
                            <TableHead className="text-[10px] text-right">
                              Confidence
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cfg.samples.map((s) => (
                            <TableRow key={s.column} className="text-xs">
                              <TableCell className="font-mono font-medium">
                                {s.column}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {s.meaning}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-semibold ${s.confidenceColor}`}
                                >
                                  {s.confidence}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Upload history for this source type */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Upload History — {cfg.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadHistory
                  sources={sourcesData?.results || []}
                  isLoading={sourcesLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UploadPage;
