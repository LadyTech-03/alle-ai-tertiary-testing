import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Folder, Loader } from "lucide-react";
import { useRenameGroup } from "@/hooks/use-org-member-mutations";
import { useAuthStore } from "@/stores";
import type { Group } from "@/stores/edu-store";

interface RenameGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Group | null;
  // Optional props for TypeScript compatibility only
  isLoading?: boolean;
  onRename?: (newName: string) => void;
}

export default function RenameGroupModal({
  isOpen,
  onClose,
  data,
}: RenameGroupModalProps) {
  const [newName, setNewName] = useState("");
  const [isError, setIsError] = useState(false);

  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id.toString() ?? "";
  const renameGroupMutation = useRenameGroup(orgId);

  const getFolderIconColor = () => {
    if (!data) return "text-blue-600";

    const seatType = data.seat_type.toLowerCase();

    if (seatType === "faculty") {
      return "text-purple-600";
    } else if (seatType === "student") {
      return "text-blue-600";
    } else {
      return "text-blue-600";
    }
  };

  const handleRename = () => {
    if (!newName.trim()) {
      setIsError(true);
      return;
    }

    if (!data || !organizationDetails) {
      return;
    }

    setIsError(false);

    renameGroupMutation.mutate(
      {
        groupId: data.id,
        newName: newName,
        groupData: {
          description: data.description || "",
          parent_id: data.parent_id,
          seat_type: data.seat_type,
          expiry_date: data.expiry_date,
          features: data.features || [],
        },
        seatType: data.seat_type,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);

    if (isError && e.target.value.trim()) {
      setIsError(false);
    }
  };

  const handleClose = () => {
    setIsError(false);
    setNewName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Group</DialogTitle>
          <DialogDescription>Enter a new name for this group</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="relative">
            <Folder
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${getFolderIconColor()}`}
            />
            <Input
              value={newName}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
              placeholder={data?.name.toUpperCase() || "Enter group name"}
              className={`pl-10 ${
                isError
                  ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                  : ""
              }`}
              disabled={renameGroupMutation.isPending}
            />
          </div>
          {isError && (
            <p className="text-red-500 text-sm mt-2">
              Please enter a name for rename or choose to cancel
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={renameGroupMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={renameGroupMutation.isPending}
            onClick={handleRename}
          >
            {renameGroupMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" />
                <span>Please wait...</span>
              </div>
            ) : (
              "Rename"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
