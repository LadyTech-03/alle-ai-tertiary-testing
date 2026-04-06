"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Loader } from "lucide-react";
import CustomDatePicker from "@/components/orgs/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


import { useAddGroup } from "@/hooks/use-org-member-mutations";
import { useOrgMemberStore } from "@/stores/edu-store";
import { useAuthStore } from "@/stores";

interface CreateGroupsProps {
  isOpen: boolean;
  onClose: () => void;
  parentFolderId?: number | null;
  seatType?: "faculty" | "students";
}

export default function CreateGroups({
  isOpen,
  onClose,
  parentFolderId,
  seatType
}: CreateGroupsProps) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { breadcrumbPath } = useOrgMemberStore();
  const { organizationDetails } = useAuthStore();
  const addGroupMutation = useAddGroup(organizationDetails!.id.toString());

  // Use provided props if available, otherwise fall back to breadcrumb
  const lastBreadcrumbIndex = breadcrumbPath.length - 1;
  const currentFolder =
    breadcrumbPath.length > 0
      ? breadcrumbPath[breadcrumbPath.length - 1]
      : null;

  // Determine parent ID: use provided parentFolderId, otherwise use breadcrumb logic
  const parentId = parentFolderId !== undefined
    ? parentFolderId
    : (lastBreadcrumbIndex === 0 ? null : currentFolder?.id);

  // Determine seat type: use provided seatType, otherwise use breadcrumb logic  
  const seat_type = (seatType === "students" ? "student" : seatType) || currentFolder?.seat_type || "student";
  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleApply();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, groupName, expiry]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!groupName.trim()) {
      newErrors.groupName = "Group name is required";
    }

    // Expiry date is required only for student seat type
    if (seat_type === "student" && !expiry) {
      newErrors.expiry = "Expiry date is required for student groups";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    const parentId = lastBreadcrumbIndex === 0 ? null : currentFolder?.id;

    addGroupMutation.mutate(
      {
        orgId: organizationDetails!.id,
        groupData: {
          name: groupName,
          description: description,
          parent_id: parentId || null,
          seat_type: seat_type || "student",
          expiry_date: expiry ? expiry.toISOString().split("T")[0] : null,
          features: [],
        },
      },
      {
        onSuccess: () => {
          // Reset form
          setGroupName("");
          setDescription("");
          setExpiry(null);
          setErrors({});
          onClose();
        },
        onSettled: () => {
          setIsLoading(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (isLoading) return;

    // Reset form when closing
    setGroupName("");
    setDescription("");
    setExpiry(null);
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "groupName") {
      setGroupName(value);
    } else if (field === "description") {
      setDescription(value);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Create New Group
          </DialogTitle>
          <DialogDescription>Create a new group with an expiry date</DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-4 py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Group Name Field */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium">
              Group Name *
            </Label>
            <Input
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => handleInputChange("groupName", e.target.value)}
              className={errors.groupName ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.groupName && (
              <motion.p
                className="text-xs text-red-500"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {errors.groupName}
              </motion.p>
            )}
          </div>

          {/* Description Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-gray-400">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter group description"
              value={description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Expiry Date Field - Now Required */}
          <div className="space-y-2">
            <Label htmlFor="expiry" className="text-sm font-medium">
              Expiry Date {seat_type === "faculty" ? <span className="text-gray-400">(Optional)</span> : "*"}
            </Label>
            <CustomDatePicker
              value={expiry}
              onChange={(date, dateString) => {
                setExpiry(date);
                // Clear error when user selects a date
                if (errors.expiry && date) {
                  setErrors((prev) => ({ ...prev, expiry: "" }));
                }
              }}
              placeholder="Select expiry date"
              disabled={isLoading}
              className={errors.expiry ? "border-red-500" : ""}
            />
            {errors.expiry && (
              <motion.p
                className="text-xs text-red-500"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {errors.expiry}
              </motion.p>
            )}
          </div>
        </motion.div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Please wait...
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
