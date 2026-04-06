"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Users, Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAddBulkUsers } from "@/hooks/use-org-member-mutations";
import { useOrgMemberStore } from "@/stores/edu-store";
import { useAuthStore } from "@/stores";
import CustomDatePicker from "../date-time-picker";
import { Label } from "@/components/ui/label";
import ValidationErrorDialog, {
  type ValidationError,
} from "./multi-error-modal";

interface CsvMember {
  email: string;
  firstname: string;
  lastname: string;
}

interface OnCsvImportsProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string | null;
  memberCount: number | null;
  data: CsvMember[] | null;
  onRefetch?: () => void;
}

export default function OnCsvImports({
  isOpen,
  onClose,
  fileName,
  memberCount,
  data,
  onRefetch,
}: OnCsvImportsProps) {
  const { organizationDetails } = useAuthStore();
  const { breadcrumbPath } = useOrgMemberStore();
  const orgId = organizationDetails?.id?.toString() || "";
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Get current folder from breadcrumb (last item is the active folder)
  const currentFolder = breadcrumbPath[breadcrumbPath.length - 1];
  const seatType = currentFolder?.seat_type as
    | "faculty"
    | "student"
    | undefined;

  const addBulkUsersMutation = useAddBulkUsers(orgId, onRefetch);

  const handleApply = async () => {
    if (!data || data.length === 0) return;

    if (!currentFolder) {
      // Should not happen - user must be in a folder to import
      return;
    }

    if (seatType === "student" && !expiryDate) {
      return; // Validation handled by disabled button state
    }

    // If breadcrumbPath.length === 1, we're at root level (Faculty/Student folder)
    // If breadcrumbPath.length > 1, we're inside a group
    const organisationGroupId =
      breadcrumbPath.length === 1 ? null : currentFolder.id;

    // Transform CSV data to API format (only basic user info)
    const usersDetails = data.map((member) => ({
      email: member.email,
      first_name: member.firstname,
      last_name: member.lastname,
      expiry_date: expiryDate ? expiryDate.toISOString() : null,
    }));

    // Call mutation
    addBulkUsersMutation.mutate(
      {
        orgId: Number(orgId),
        bulkUserData: {
          seat_type: seatType ?? "student", // Fallback to student if undefined
          organisation_group_id: organisationGroupId, // All users go to this group
          usersDetails,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error: any) => {
          // Extract validation errors from response
          const errorMessage = error?.response?.data?.message;

          // Check if it's an object with validation errors
          if (
            errorMessage &&
            typeof errorMessage === "object" &&
            !Array.isArray(errorMessage)
          ) {
            setValidationError({ message: errorMessage });
            setShowErrorDialog(true);
            // Don't close CSV dialog - let user close it after viewing errors
          }
        },
      }
    );
  };

  const handleClose = () => {
    if (addBulkUsersMutation.isPending) return;
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showErrorDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              CSV Import Successful
            </DialogTitle>
            <DialogDescription>
              Configure group assignment and admin settings for the imported
              members.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            className="space-y-4 py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Import Summary */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Import Summary
                </span>
              </div>
              <div className="text-sm text-green-700">
                <p>
                  <span className="font-medium">File:</span> {fileName}
                </p>
                <p>
                  <span className="font-medium">Members found:</span>{" "}
                  {memberCount} individuals
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Set Expiry Date{" "}
                {seatType === "student" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <CustomDatePicker
                value={expiryDate}
                onChange={setExpiryDate}
                placeholder="Select expiry date"
                className="w-full"
                minDate={new Date()}
              />
              {seatType === "faculty" && (
                <p className="text-xs text-muted-foreground">
                  Optional for faculty members.
                </p>
              )}
              {seatType === "student" && !expiryDate && (
                <p className="text-xs text-red-500">
                  Expiry date is required for student accounts.
                </p>
              )}
            </div>
          </motion.div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={addBulkUsersMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={
                addBulkUsersMutation.isPending ||
                (seatType === "student" && !expiryDate)
              }
              className="min-w-[100px]"
            >
              {addBulkUsersMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Members"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Error Dialog */}
      <ValidationErrorDialog
        error={validationError}
        open={showErrorDialog}
        onClose={setShowErrorDialog}
      />
    </>
  );
}
