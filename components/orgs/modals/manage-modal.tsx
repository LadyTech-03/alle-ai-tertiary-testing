import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import { useOrgMemberStore } from "@/stores/edu-store";
import CustomDatePicker from "@/components/orgs/date-time-picker";
import { useUpdateGroup } from "@/hooks/use-org-member-mutations";
import { useAuthStore } from "@/stores";
import type { Group } from "@/stores/edu-store";
import { useOrgMemberSelectionStore } from "@/stores/edu-store";
interface ManageGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: Group | null;
  groupName?: string;
  initialData?: {
    seatType: "student" | "faculty" | "system";
    expiryType: "never" | "date";
    expiryDay?: string;
    expiryMonth?: string;
    expiryYear?: string;
    features: {
      chat: boolean;
      image: boolean;
      video: boolean;
      audio: boolean;
    };
    excludedModels: string[];
  };
  onSave?: (data: any) => void;
}

export default function ManageGroupDialog({
  isOpen,
  onOpenChange,
  groupName = "Students",
  initialData,
  data,
  onSave,
}: ManageGroupDialogProps) {
  const { organizationDetails } = useAuthStore();
  const updateGroupMutation = useUpdateGroup(
    organizationDetails?.id.toString() || ""
  );

  const [seatType, setSeatType] = useState<"student" | "faculty" | "system">(
    initialData?.seatType || "student"
  );
  const [expiryType, setExpiryType] = useState<"never" | "date">(
    initialData?.expiryType || "never"
  );
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [features, setFeatures] = useState({
    chat: initialData?.features.chat ?? true,
    image: initialData?.features.image ?? true,
    video: initialData?.features.video ?? true,
    audio: initialData?.features.audio ?? true,
  });
  const [excludedModels, setExcludedModels] = useState<string[]>(
    initialData?.excludedModels || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const { breadcrumbPath } = useOrgMemberStore();
  const activeGroup = breadcrumbPath[breadcrumbPath.length - 1];

  useEffect(() => {
    // Use data prop if available, otherwise fall back to activeGroup
    const groupToUse = data || activeGroup;

    if (isOpen && groupToUse) {
      // Set seat type
      setSeatType(groupToUse.seat_type);

      // Set expiry
      if (groupToUse.expiry_date) {
        setExpiryType("date");
        setExpiryDate(new Date(groupToUse.expiry_date));
      } else {
        setExpiryType("never");
        setExpiryDate(null);
      }

      // Set features
      if (groupToUse.features) {
        setFeatures({
          chat: groupToUse.features.includes("chat"),
          image: groupToUse.features.includes("image"),
          video: groupToUse.features.includes("video"),
          audio: groupToUse.features.includes("audio"),
        });
      }
    }
  }, [isOpen, data, activeGroup]);

  const handleSave = async () => {
    if (!organizationDetails || !activeGroup) return;

    // Validation: Students must have an expiry date
    if (seatType === "student" && expiryType === "never") {
      return; // Should not happen due to UI disabled state, but double-check
    }

    setIsLoading(true);

    try {
      // Prepare the group data
      const activeFeatures = Object.entries(features)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key);

      const groupData = {
        name: data!.name,
        description: data?.description,
        parent_id: data?.parent_id,
        seat_type: data?.seat_type || "student",
        expiry_date:
          expiryType === "date" && expiryDate
            ? expiryDate.toISOString().split("T")[0]
            : null,
        features: activeFeatures,
      };
      // console.log(groupData,activeGroup.id)
      await updateGroupMutation.mutateAsync({
        groupId: data!.id,
        groupData: groupData,
      });

      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background p-0 max-h-screen overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Manage {groupName}</DialogTitle>
          <DialogDescription>
            Settings here apply to all members in this group.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-6 pb-4">
          {/* Group Seat Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Group Seat Type</Label>
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border rounded-md text-sm capitalize text-gray-700 dark:text-gray-300">
              {seatType}
            </div>
          </div>

          {/* Group Expiry */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Subscription Duration</Label>
            <RadioGroup
              value={expiryType}
              onValueChange={(value: "never" | "date") => setExpiryType(value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="never"
                  id="never"
                  disabled={seatType === "student"}
                />
                <Label
                  htmlFor="never"
                  className={`text-sm font-normal ${
                    seatType === "student"
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  Never expires
                  {seatType === "student" && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Not available for students)
                    </span>
                  )}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label
                  htmlFor="date"
                  className="text-sm font-normal cursor-pointer"
                >
                  Expires on:
                </Label>
              </div>
            </RadioGroup>

            {expiryType === "date" && (
              <div className="space-y-4">
                <CustomDatePicker
                  value={expiryDate}
                  onChange={(date) => setExpiryDate(date)}
                  placeholder="Select expiry date"
                  minDate={new Date()}
                />

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md text-xs">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    {`On the selected expiration date, all members within this group will be automatically removed and will lose access to the organization's premium features.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            {/* Feature Access Control */}
            <div className="space-y-4">
              {/* Feature Switches implement later */}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 dark:bg-zinc-900/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            disabled={
              (expiryType === "date" && !expiryDate) ||
              (seatType === "student" && expiryType === "never") ||
              isLoading
            }
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
