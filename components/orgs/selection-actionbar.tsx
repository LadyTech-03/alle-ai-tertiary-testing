import {
  Download,
  Pencil,
  FolderInput,
  Settings,
  Trash2,
  UserPen,
  X,
  Undo2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrgMemberSelectionStore } from "@/stores/edu-store";
import { useAuthStore } from "@/stores";
interface SelectionActionBarProps {
  onExport?: (selectedData: any) => void;
  onRename?: (selectedData: any, type: "rename" | "manage") => void;
  onEditMember?: (selectedData: any) => void;
  onMove?: (selectedData: any) => void;
  onDelete?: (selectedData: any) => void;
  onManage?: (selectedData: any, type: "rename" | "manage") => void;
  onRestore?: (selectedData: any) => void;
  onPermanentDelete?: (selectedData: any) => void;
  isDeletedView?: boolean;
}

export const SelectionActionBar = ({
  onExport,
  onRename,
  onEditMember,
  onDelete,
  onMove,
  onManage,
  onRestore,
  onPermanentDelete,
  isDeletedView = false,
}: SelectionActionBarProps) => {
  const { hasSelection, getSelectionMetadata, clearSelection } =
    useOrgMemberSelectionStore();
  const { organizationDetails } = useAuthStore();
  // Don't render if no selection
  if (!hasSelection()) return null;

  const metadata = getSelectionMetadata();
  const { totalSelected, groupsCount, membersCount, actions, selectedData } =
    metadata;

  // Build actions array based on selection type
  const allActions = [];
  // console.log(selectedData)
  // Restore Action
  if (actions.canRestore) {
    allActions.push({
      icon: Undo2,
      label: "Restore",
      onClick: () => onRestore?.(selectedData.map((item) => item.data)),
      show: true,
    });
  }

  // Permanent Delete Action
  if (actions.canPermanentDelete) {
    allActions.push({
      icon: Trash2,
      label: "Delete Forever",
      onClick: () => onPermanentDelete?.(selectedData.map((item) => item.data)),
      show: true,
      variant: "destructive",
    });
  }

  // Export
  if (!isDeletedView) {
    allActions.push({
      icon: Download,
      label: "Export",
      onClick: () => onExport?.(selectedData.map((item) => item.data)),
      show: true,
    });
  }

  // Rename - single group (requires update_groups permission)
  if (
    actions.canRename &&
    (organizationDetails?.is_owner ||
      organizationDetails?.user_permissions?.includes("update_groups"))
  ) {
    allActions.push({
      icon: Pencil,
      label: "Rename",
      onClick: () => onRename?.(selectedData[0].data, "rename"),
      show: true,
    });
  }

  // Edit - single member (requires update_members permission)
  if (
    actions.canEdit &&
    (organizationDetails?.is_owner ||
      organizationDetails?.user_permissions?.includes("update_members"))
  ) {
    allActions.push({
      icon: UserPen,
      label: "Edit Information",
      onClick: () => onEditMember?.(selectedData[0].data),
      show: true,
    });
  }

  // Move - any selection (requires update_members or update_groups)
  if (
    actions.canMove &&
    (organizationDetails?.is_owner ||
      organizationDetails?.user_permissions?.includes("update_members") ||
      organizationDetails?.user_permissions?.includes("update_groups"))
  ) {
    allActions.push({
      icon: FolderInput,
      label: "Move",
      onClick: () => onMove?.(selectedData.map((item) => item.data)),
      show: true,
    });
  }

  // Delete - any selection (requires remove_members or remove_groups)
  if (
    actions.canDelete &&
    (organizationDetails?.is_owner ||
      organizationDetails?.user_permissions?.includes("remove_members") ||
      organizationDetails?.user_permissions?.includes("remove_groups"))
  ) {
    allActions.push({
      icon: Trash2,
      label: "Delete",
      onClick: () => onDelete?.(selectedData.map((item) => item.data)),
      show: true,
    });
  }

  // Manage - single group (requires update_groups permission)
  if (
    actions.canManage &&
    (organizationDetails?.is_owner ||
      organizationDetails?.user_permissions?.includes("update_groups"))
  ) {
    allActions.push({
      icon: Settings,
      label: "Manage",
      onClick: () => onManage?.(selectedData[0].data, "manage"),
      show: true,
    });
  }

  // Filter to only show applicable actions
  const visibleActions = allActions.filter((action) => action.show);

  const buildInfoText = () => {
    // Simple: just selected count
    return `${totalSelected} selected`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-backgroundSecondary dark:border-background border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        {/* Selection Info Badge */}
        <Badge
          variant="secondary"
          className="text-sm bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium px-3 py-1.5"
        >
          {buildInfoText()}
        </Badge>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            {visibleActions.map((action, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={action.onClick}
                  >
                    <action.icon
                      className={`h-4 w-4 ${
                        action.label === "Delete" ||
                        action.label === "Delete Forever"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

        {/* Close/Cancel Button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={clearSelection}
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear selection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
