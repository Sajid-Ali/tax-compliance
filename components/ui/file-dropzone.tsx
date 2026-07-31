"use client";

import { useId, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drag-and-drop file input with a filename/size preview — replaces a bare
 * `<input type="file">`. Still a real file input under the hood (native
 * `name` attr), so it drops straight into an existing server-action <form>.
 */
export function FileDropzone({
  name,
  accept,
  className,
}: {
  name: string;
  accept?: string;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function setFromList(list: FileList | null) {
    const next = list?.[0] ?? null;
    setFile(next);
    if (inputRef.current && next) {
      const dt = new DataTransfer();
      dt.items.add(next);
      inputRef.current.files = dt.files;
    }
  }

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-border bg-surface-secondary px-2.5 py-1.5 text-xs",
          className
        )}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium text-foreground">{file.name}</span>
        <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
        <button
          type="button"
          onClick={clear}
          className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="h-3 w-3" />
        </button>
        <input ref={inputRef} type="file" name={name} accept={accept} className="hidden" />
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        setFromList(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors",
        dragging ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40",
        className
      )}
    >
      <Upload className="h-3.5 w-3.5 shrink-0" />
      <span>Drop a file or click to browse</span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={(e) => setFromList(e.target.files)}
      />
    </label>
  );
}
