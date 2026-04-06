"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface ImportCsvResult {
  success: boolean;
  data?: Array<{
    email: string;
    firstname: string;
    lastname: string;
  }>;
  fileName?: string;
}

export const useImportCsv = () => {
  const [isImporting, setIsImporting] = useState(false);

  const importCsv = (): Promise<ImportCsvResult> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.style.display = "none";

      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
          toast.error("No file selected");
          resolve({ success: false });
          return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
          toast.error("Please select a CSV file only");
          resolve({ success: false });
          return;
        }

        setIsImporting(true);
        toast.loading("Reading CSV file...", { id: "csv-import" });

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csvContent = e.target?.result as string;
            const lines = csvContent.split("\n").filter((line) => line.trim());

            if (lines.length < 2) {
              throw new Error("CSV must have headers and at least one row");
            }

            // Parse headers
            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

            // Find column indices
            const emailIdx = headers.findIndex((h) => h === "email");
            const firstNameIdx = headers.findIndex(
              (h) => h === "firstname" || h === "first name"
            );
            const lastNameIdx = headers.findIndex(
              (h) => h === "lastname" || h === "last name"
            );

            if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
              throw new Error(
                "CSV must contain 'email', 'firstname', and 'lastname' columns"
              );
            }

            // Parse data rows
            const data = lines.slice(1).map((line) => {
              const cells = line
                .split(",")
                .map((c) => c.trim().replace(/^"|"$/g, ""));
              return {
                email: cells[emailIdx] || "",
                firstname: cells[firstNameIdx] || "",
                lastname: cells[lastNameIdx] || "",
              };
            });

            setIsImporting(false);
            toast.dismiss("csv-import");
            toast.success(`Imported ${data.length} members successfully`);

            resolve({
              success: true,
              data,
              fileName: file.name,
            });
          } catch (error) {
            setIsImporting(false);
            toast.dismiss("csv-import");
            toast.error(
              error instanceof Error ? error.message : "Failed to parse CSV"
            );
            resolve({ success: false });
          }
        };

        reader.onerror = () => {
          setIsImporting(false);
          toast.dismiss("csv-import");
          toast.error("Failed to read file");
          resolve({ success: false });
        };

        reader.readAsText(file);
      };

      input.oncancel = () => {
        toast.info("Import cancelled");
        resolve({ success: false });
      };

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  };

  return {
    importCsv,
    isImporting,
  };
};

// Standalone function
export const triggerCsvImport = (): Promise<ImportCsvResult> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.style.display = "none";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (!file) {
        toast.error("No file selected");
        resolve({ success: false });
        return;
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please select a CSV file only");
        resolve({ success: false });
        return;
      }

      toast.loading("Reading CSV file...", { id: "csv-import" });

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const lines = csvContent.split("\n").filter((line) => line.trim());

          if (lines.length < 2) {
            throw new Error("CSV must have headers and at least one row");
          }

          // Parse headers
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

          // Find column indices
          const emailIdx = headers.findIndex((h) => h === "email");
          const firstNameIdx = headers.findIndex(
            (h) => h === "firstname" || h === "first name"
          );
          const lastNameIdx = headers.findIndex(
            (h) => h === "lastname" || h === "last name"
          );

          if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
            throw new Error(
              "CSV must contain 'email', 'firstname', and 'lastname' columns"
            );
          }

          // Parse data rows
          const data = lines.slice(1).map((line) => {
            const cells = line
              .split(",")
              .map((c) => c.trim().replace(/^"|"$/g, ""));
            return {
              email: cells[emailIdx] || "",
              firstname: cells[firstNameIdx] || "",
              lastname: cells[lastNameIdx] || "",
            };
          });

          toast.dismiss("csv-import");
          toast.success(`Imported ${data.length} members successfully`);

          resolve({
            success: true,
            data,
            fileName: file.name,
          });
        } catch (error) {
          toast.dismiss("csv-import");
          toast.error(
            error instanceof Error ? error.message : "Failed to parse CSV"
          );
          resolve({ success: false });
        }
      };

      reader.onerror = () => {
        toast.dismiss("csv-import");
        toast.error("Failed to read file");
        resolve({ success: false });
      };

      reader.readAsText(file);
    };

    input.oncancel = () => {
      toast.info("Import cancelled");
      resolve({ success: false });
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};
