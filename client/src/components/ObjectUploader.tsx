import { useState, useRef } from "react";
import type { ReactNode, ChangeEvent } from "react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Loader2, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("progress", (prog) => {
        setProgress(prog);
      })
      .on("complete", (result) => {
        setSuccess(true);
        setUploading(false);
        onComplete?.(result);
        setTimeout(() => {
          setShowModal(false);
          setFiles([]);
          setSuccess(false);
          setProgress(0);
        }, 1500);
      })
      .on("error", (err) => {
        setError(err.message || "Upload failed");
        setUploading(false);
      })
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    for (const file of files) {
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    }

    await uppy.upload();
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={(open) => {
        if (!uploading) {
          setShowModal(open);
          if (!open) {
            setFiles([]);
            setError(null);
            setSuccess(false);
            setProgress(0);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {success ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm font-medium">Upload Complete!</p>
              </div>
            ) : (
              <>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {maxNumberOfFiles} file(s), {Math.round(maxFileSize / 1024 / 1024)}MB each
                  </p>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple={maxNumberOfFiles > 1}
                  onChange={handleFileChange}
                  data-testid="input-file-upload"
                />

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        {!uploading && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Uploading... {Math.round(progress)}%
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    data-testid="button-upload"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
