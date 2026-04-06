"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAssignRole,
  useAddMember,
  useUpdateMember,
} from "@/hooks/use-org-member-mutations";

import type { Member } from "@/stores/edu-store";
import { useAuthStore } from "@/stores";
import { useOrgMemberStore } from "@/stores/edu-store";
import { orgMemberApi } from "@/lib/api/orgs/members";

interface AddMemberOrgProps {
  isOpen: boolean;
  onClose: () => void;
  memberData?: Member | null;
  onUpdateSearchResult?: (memberId: number, updatedMember: Member) => void;
}

export default function AddMemberOrg({
  isOpen,
  onClose,
  memberData,
  onUpdateSearchResult,
}: AddMemberOrgProps) {
  const isEditMode = !!memberData;
  const { breadcrumbPath } = useOrgMemberStore();

  // Utility to parse ISO date string to Date object (extract date only)
  const parseExpiryDate = (
    dateString: string | null | undefined
  ): Date | null => {
    if (!dateString) return null;
    // Extract date portion from ISO timestamp: 2025-12-02T11:22:42.000000Z -> 2025-12-02
    const datePart = dateString.split("T")[0];
    return new Date(datePart);
  };

  const [firstName, setFirstName] = useState(memberData?.first_name || "");
  const [lastName, setLastName] = useState(memberData?.last_name || "");
  const [email, setEmail] = useState(memberData?.email || "");
  const [expiry, setExpiry] = useState<Date | null>(
    parseExpiryDate(memberData?.expiry_date)
  );
  const [makeAdmin, setMakeAdmin] = useState(
    memberData?.role === "admin" || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { organizationDetails } = useAuthStore();

  // Use the mutation hook for role assignment
  const assignRoleMutation = useAssignRole(
    organizationDetails?.id.toString() || ""
  );

  // Use the mutation hook for adding members
  const addMemberMutation = useAddMember(
    organizationDetails?.id.toString() || ""
  );

  // Use the mutation hook for updating email
  const updateMemberMutation = useUpdateMember(
    organizationDetails?.id.toString() || ""
  );

  // Get current folder from breadcrumb and extract seat type
  const lastBreadcrumbIndex = breadcrumbPath.length - 1;

  const currentFolder =
    breadcrumbPath.length > 0
      ? breadcrumbPath[breadcrumbPath.length - 1]
      : null;
  const seatType = currentFolder?.seat_type;
  // console.log(memberData)
  const parentId = lastBreadcrumbIndex === 0 ? null : currentFolder?.id;

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, firstName, lastName, email, expiry]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    // Expiry date is required only for student seat type
    if (seatType === "student" && !expiry) {
      newErrors.expiry = "Expiry date is required for students";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle admin role toggle - calls API immediately
  const handleAdminToggle = async (checked: boolean) => {
    if (!isEditMode || !memberData) return;

    const previousState = makeAdmin;

    try {
      // Optimistically update UI
      setMakeAdmin(checked);

      // Call mutation
      await assignRoleMutation.mutateAsync({
        userId: memberData.id,
        role: checked ? "admin" : "member",
        seatType: memberData.seat_type as any,
        groupId: memberData.path?.[memberData.path.length - 1]?.id || null,
      });

      // Success - mutation hook handles invalidation and no toast
    } catch (error) {
      // Revert on error
      setMakeAdmin(previousState);
      // Error toast is handled by mutation hook
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isEditMode) {
        // Update member data in edit mode
        const hasChanges =
          email !== memberData?.email ||
          firstName !== memberData?.first_name ||
          lastName !== memberData?.last_name ||
          expiry?.toISOString().split("T")[0] !==
            memberData?.expiry_date?.split("T")[0];

        if (hasChanges) {
          updateMemberMutation.mutate(
            {
              userId: memberData!.id,
              userData: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                expiry_date: expiry ? expiry.toISOString().split("T")[0] : null,
              },
              seatType: memberData!.seat_type as any,
              groupId: parentId,
            },
            {
              onSuccess: () => {
                // Update search results if in search mode - construct from form data
                if (onUpdateSearchResult) {
                  const updatedMember: Member = {
                    ...memberData!,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    expiry_date: expiry
                      ? expiry.toISOString().split("T")[0]
                      : null,
                  };
                  onUpdateSearchResult(memberData!.id, updatedMember);
                }
                onClose();
              },
              onSettled: () => {
                setIsLoading(false);
              },
            }
          );
          return;
        } else {
          toast.info("No changes to save");
          setIsLoading(false);
        }
      } else {
        // Add new member using mutation hook
        addMemberMutation.mutate(
          {
            orgId: organizationDetails!.id,
            userData: {
              email: email,
              first_name: firstName,
              last_name: lastName,
              seat_type: seatType || "student",
              organisation_group_id: parentId,
              role: makeAdmin ? "admin" : "member",
              expiry_date: expiry ? expiry.toISOString().split("T")[0] : null,
            },
          },
          {
            onSuccess: () => {
              // Mutation hook handles toast and invalidation
              onClose();
            },
            onSettled: () => {
              setIsLoading(false);
            },
          }
        );
        return; // Prevent the setIsLoading(false) at the end
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? "update" : "add"} member`);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setErrors({});
    setFirstName("");
    setLastName("");
    setEmail("");
    setExpiry(null);
    setMakeAdmin(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            {isEditMode ? "Edit Member " : "Add New Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update member information including expiry date."
              : "Add a new member to your organization with an expiry date."}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-4 py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Name Fields - Show in both add and edit mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name *
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) {
                    setErrors((prev) => ({ ...prev, firstName: "" }));
                  }
                }}
                className={errors.firstName ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.firstName && (
                <motion.p
                  className="text-xs text-red-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  {errors.firstName}
                </motion.p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name *
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) {
                    setErrors((prev) => ({ ...prev, lastName: "" }));
                  }
                }}
                className={errors.lastName ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.lastName && (
                <motion.p
                  className="text-xs text-red-500"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  {errors.lastName}
                </motion.p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              className={errors.email ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.email && (
              <motion.p
                className="text-xs text-red-500"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Expiry Date Field - Required */}
          <div className="space-y-2">
            <Label htmlFor="expiry" className="text-sm font-medium">
              Expiry Date{" "}
              {seatType === "faculty" ? (
                <span className="text-gray-400">(Optional)</span>
              ) : (
                "*"
              )}
            </Label>
            <CustomDatePicker
              value={expiry}
              onChange={(date, dateString) => {
                setExpiry(date);
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
              >
                {errors.expiry}
              </motion.p>
            )}
          </div>

          {/* Make Admin Section - Only for Faculty in add mode */}
          {/* {!isEditMode && seatType === "faculty" && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="makeAdmin" className="text-sm font-medium">
                  Make Admin
                </Label>
              </div>
              <Switch
                id="makeAdmin"
                checked={makeAdmin}
                onCheckedChange={setMakeAdmin}
                disabled={isLoading}
              />
            </div>
          )} */}

          {/* Make Admin Section - Only for Faculty in edit mode */}
          {isEditMode && memberData?.seat_type === "faculty" && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex flex-col gap-1">
                <Label htmlFor="makeAdminEdit" className="text-sm font-medium">
                  Admin Role
                </Label>
                <p className="text-xs text-muted-foreground">
                  {makeAdmin
                    ? "This user has admin privileges"
                    : "Grant admin access to this user"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {assignRoleMutation.isPending && (
                  <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  id="makeAdminEdit"
                  checked={makeAdmin}
                  onCheckedChange={handleAdminToggle}
                  disabled={assignRoleMutation.isPending || isLoading}
                />
              </div>
            </div>
          )}
        </motion.div>

        <DialogFooter className="flex gap-2 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {isEditMode ? "Update User" : "Add Member"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
