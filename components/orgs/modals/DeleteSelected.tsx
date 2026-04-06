import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import {
  useOrgMemberSelectionStore,
  useOrgMemberStore,
} from "@/stores/edu-store";
import { useAuthStore } from "@/stores";
import { useBulkDelete } from "@/hooks/use-org-member-mutations";

interface DeleteWarningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveFromSearch?: (memberIds: number[], groupIds: number[]) => void;
}

export default function DeleteSelected({
  isOpen,
  onOpenChange,
  onRemoveFromSearch,
}: DeleteWarningModalProps) {
  const { getSelectionMetadata, clearSelection } = useOrgMemberSelectionStore();
  const { breadcrumbPath } = useOrgMemberStore();
  const { organizationDetails } = useAuthStore();

  const metadata = getSelectionMetadata();
  const currentFolder = breadcrumbPath[breadcrumbPath.length - 1];
  const bulkDeleteMutation = useBulkDelete(organizationDetails!.id.toString());

  if (!organizationDetails) {
    return null;
  }

  const handleDelete = async () => {
    const selectedItems = metadata.selectedData;

    // Extract member IDs from data objects
    const memberIds = selectedItems
      .filter((item) => item.type === "member")
      .map((item) => (item.data as any).id);

    // Extract group IDs from data objects
    const groupIds = selectedItems
      .filter((item) => item.type === "group")
      .map((item) => (item.data as any).id);

    bulkDeleteMutation.mutate(
      {
        memberIds,
        groupIds,
        seatType: currentFolder?.seat_type || "student",
        groupId: breadcrumbPath.length === 1 ? null : currentFolder?.id || null,
      },
      {
        onSuccess: () => {
          if (onRemoveFromSearch) {
            onRemoveFromSearch(memberIds, groupIds);
          }
          clearSelection();
          onOpenChange(false);
        },
      }
    );
  };

  const { membersCount, groupsCount, isMixed } = metadata;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Remove selected items</DialogTitle>
          <DialogDescription asChild>
            <div className="text-base pt-2 text-center text-foreground">
              Remove{" "}
              {membersCount > 0 && (
                <span className="font-semibold text-black">
                  {membersCount} {membersCount === 1 ? "member" : "members"}
                </span>
              )}
              {isMixed && " and "}
              {groupsCount > 0 && (
                <span className="font-semibold text-black">
                  {groupsCount} {groupsCount === 1 ? "group" : "groups"}
                </span>
              )}{" "}
              from your organization?
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogDescription className="py-2 text-sm text-muted-foreground text-center">
          {`They'll lose access to premium features and switch to basic accounts.
          You can re-add them anytime.`}
        </DialogDescription>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkDeleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            {bulkDeleteMutation.isPending ? (
              <>
                <Loader className="animate-spin mr-2 h-4 w-4" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
