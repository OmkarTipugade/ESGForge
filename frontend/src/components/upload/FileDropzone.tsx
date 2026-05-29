import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isUploading?: boolean;
  accept?: Record<string, string[]>;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  isUploading = false,
  accept = {
    "text/csv": [".csv"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "text/tab-separated-values": [".tsv"],
  },
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: isUploading,
  });

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {!isUploading && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all",
        isDragActive
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
        isUploading && "pointer-events-none opacity-50",
      )}
    >
      <input {...getInputProps()} />
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        {isDragActive ? "Drop file here…" : "Drag & drop a file here"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        CSV, XLSX, XLS, TSV — up to 50 MB
      </p>
    </div>
  );
};

export default FileDropzone;
