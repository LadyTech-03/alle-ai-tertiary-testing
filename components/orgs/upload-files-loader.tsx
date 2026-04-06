"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    Upload,
    X,
    ChevronDown,
    ChevronUp,
    FileText,
    Image as ImageIcon,
    File,
    Check,
} from "lucide-react";

// Supported file types
const ACCEPTED_FILE_TYPES = {
    // Images
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    // Documents
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    // Text
    "text/plain": [".txt"],
    // Spreadsheets
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "text/csv": [".csv"],
};

// File upload status type
export interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: "uploading" | "completed" | "error";
    error?: string;
}

// File Selector Props
interface FileSelectorProps {
    onFilesSelected: (files: File[]) => void;
    multiple?: boolean;
    className?: string;
    children?: React.ReactNode;
}

// Upload Progress Widget Props
interface UploadProgressWidgetProps {
    files: UploadFile[];
    onCancelFile: (fileId: string) => void;
    onCancelAll: () => void;
    onClose: () => void;
}

// Get file icon based on type
const getFileIcon = (file: File) => {
    const type = file.type;

    if (type.startsWith("image/")) {
        return { icon: ImageIcon, color: "text-purple-500" };
    }
    if (type === "application/pdf") {
        return { icon: FileText, color: "text-red-500" };
    }
    if (type.includes("word") || type.includes("document")) {
        return { icon: FileText, color: "text-blue-500" };
    }
    if (type.includes("sheet") || type.includes("excel") || type === "text/csv") {
        return { icon: FileText, color: "text-green-500" };
    }

    return { icon: File, color: "text-gray-500" };
};

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Component 1: File Selector
export function FileSelector({
    onFilesSelected,
    multiple = true,
    className,
    children,
}: FileSelectorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            onFilesSelected(files);
        }
        // Reset input so same file can be selected again
        event.target.value = "";
    };

    // Build accept string from ACCEPTED_FILE_TYPES
    const acceptString = Object.values(ACCEPTED_FILE_TYPES).flat().join(",");

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={acceptString}
                onChange={handleFileChange}
                className="hidden"
            />
            {children ? (
                <div onClick={handleClick} className={className}>
                    {children}
                </div>
            ) : (
                <Button onClick={handleClick} className={className}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                </Button>
            )}
        </>
    );
}

// Component 2: Upload Progress Widget
export function UploadProgressWidget({
    files,
    onCancelFile,
    onCancelAll,
    onClose,
}: UploadProgressWidgetProps) {
    const [isMinimized, setIsMinimized] = useState(false);

    // Auto-close when all files are completed
    useEffect(() => {
        if (files.length === 0) return;

        const allCompleted = files.every((f) => f.status === "completed");
        const hasErrors = files.some((f) => f.status === "error");

        if (allCompleted && !hasErrors) {
            // Close after 2 seconds to let user see completion
            const timer = setTimeout(() => {
                onClose();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [files, onClose]);

    if (files.length === 0) return null;

    const uploadingCount = files.filter((f) => f.status === "uploading").length;
    const completedCount = files.filter((f) => f.status === "completed").length;
    const errorCount = files.filter((f) => f.status === "error").length;

    return (
        <Card className="fixed bottom-4 right-4 w-80 shadow-2xl z-50 bg-background border-2">
            {/* Header */}
            <CardHeader className="p-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">
                            {uploadingCount > 0
                                ? `Uploading ${uploadingCount} file${uploadingCount > 1 ? "s" : ""}`
                                : completedCount === files.length
                                    ? "Upload complete"
                                    : "Uploading files"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? (
                                <ChevronUp className="h-3 w-3" />
                            ) : (
                                <ChevronDown className="h-3 w-3" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={onClose}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* File List */}
            {!isMinimized && (
                <CardContent className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {files.map((uploadFile) => {
                        const { icon: Icon, color } = getFileIcon(uploadFile.file);
                        const isCompleted = uploadFile.status === "completed";
                        const isError = uploadFile.status === "error";

                        return (
                            <div
                                key={uploadFile.id}
                                className="flex items-center gap-2 text-xs"
                            >
                                {/* File Icon */}
                                <Icon className={cn("h-4 w-4 flex-shrink-0", color)} />

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium truncate">
                                            {uploadFile.file.name}
                                        </span>
                                        {!isCompleted && !isError && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 flex-shrink-0"
                                                onClick={() => onCancelFile(uploadFile.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Progress Bar or Status */}
                                    {isCompleted ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <Check className="h-3 w-3" />
                                            <span className="text-[10px]">Done</span>
                                        </div>
                                    ) : isError ? (
                                        <span className="text-[10px] text-red-600">
                                            {uploadFile.error || "Upload failed"}
                                        </span>
                                    ) : (
                                        <div className="space-y-1">
                                            <Progress value={uploadFile.progress} className="h-1" />
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span>{uploadFile.progress}%</span>
                                                <span>{formatFileSize(uploadFile.file.size)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Cancel All Button */}
                    {uploadingCount > 0 && (
                        <>
                            <div className="border-t pt-2 mt-2" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-7 text-xs text-destructive hover:text-destructive"
                                onClick={onCancelAll}
                            >
                                <X className="h-3 w-3 mr-1" />
                                Cancel all
                            </Button>
                        </>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
