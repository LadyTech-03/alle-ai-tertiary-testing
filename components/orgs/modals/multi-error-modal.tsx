import React from "react";
import { AlertCircle, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// TypeScript types
interface ValidationError {
  message: {
    [key: string]: string[];
  };
}

interface ValidationErrorDialogProps {
  error: ValidationError | null;
  open: boolean;
  onClose: (open: boolean) => void;
}

const ValidationErrorDialog: React.FC<ValidationErrorDialogProps> = ({
  error,
  open,
  onClose,
}) => {
  if (!error?.message) return null;

  const errorEntries = Object.entries(error.message);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold">
                  Validation Errors
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500 mt-1">
                  {errorEntries.length} field
                  {errorEntries.length !== 1 ? "s" : ""} failed validation
                </AlertDialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onClose(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3 mt-4">
            {errorEntries.map(([field, messages], index) => (
              <div
                key={index}
                className="rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="font-medium text-sm text-red-900 mb-2">
                  {field}
                </div>
                <ul className="space-y-1">
                  {messages.map((message, msgIndex) => (
                    <li
                      key={msgIndex}
                      className="text-sm text-red-700 flex items-start gap-2"
                    >
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onClose(false)}>
            Dismiss
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ValidationErrorDialog;
export type { ValidationError, ValidationErrorDialogProps };
