// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Info,
  FileDown,
  FileSpreadsheet,
  FileText,

  Settings,
  InfoIcon,
  MoreHorizontal,
} from "lucide-react";
import { useOrgMemberStore } from "@/stores/edu-store";
import { Button } from "@/components/ui/button";
import { Group } from "@/stores/edu-store";
import { useAuthStore } from "@/stores";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgBreadcrumbProps {
  organizationName: string;
  onBreadcrumbClick: (item: Group | null, index: number) => void; // null for organization
  onInfoClick?: () => void;
  onExport?: (type: "csv" | "excel", currentFolder: Group) => void;

  onManage?: (currentFolder: Group) => void;
  isFetching: boolean;
}

const OrgMemberBreadcrumb: React.FC<OrgBreadcrumbProps> = ({
  organizationName,
  onBreadcrumbClick,
  onInfoClick,
  onExport,

  onManage,
  isFetching,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState<Group[]>([]);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { breadcrumbPath } = useOrgMemberStore();
  const { organizationDetails } = useAuthStore();

  const isTrashFolder = breadcrumbPath.length > 0 && breadcrumbPath[breadcrumbPath.length - 1].seat_type === "system";

  // Get current (last) folder
  const currentFolder =
    breadcrumbPath.length > 0
      ? breadcrumbPath[breadcrumbPath.length - 1]
      : null;

  // Check if breadcrumb needs to be collapsed
  useEffect(() => {
    const checkOverflow = () => {
      if (
        !breadcrumbRef.current ||
        !containerRef.current ||
        breadcrumbPath.length === 0
      )
        return;

      const breadcrumbWidth = breadcrumbRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth - 200;

      if (breadcrumbPath.length > 3 && breadcrumbWidth > containerWidth) {
        setIsCollapsed(true);
        const itemsToCollapse = breadcrumbPath.slice(
          1,
          breadcrumbPath.length - 2
        );
        setCollapsedItems(itemsToCollapse);
      } else {
        setIsCollapsed(false);
        setCollapsedItems([]);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [breadcrumbPath]);

  const handleBreadcrumbItemClick = (item: Group | null, index: number) => {
    // Don't navigate if clicking the last item (it has dropdown instead)
    if (index === breadcrumbPath.length) return; // For organization click
    if (index === breadcrumbPath.length - 1) return; // For last folder
    if (isFetching) return;

    // Pass the item data to parent for truncation and fetching
    onBreadcrumbClick(item, index);
  };

  const handleOrganizationClick = () => {
    if (isFetching) return;
    // Pass null to indicate organization click (return to root)
    onBreadcrumbClick(null, -1);
  };

  const renderActionsMenu = () => {
    if (!currentFolder) return null;

    // Check if current folder is a root folder (Faculty/Students)
    // Root folders are at index 0 in breadcrumb path
    const isRootFolder =
      breadcrumbPath.length > 0 && breadcrumbPath.indexOf(currentFolder) === 0;

    return (
      <DropdownMenuContent align="start" className="w-56 bg-background">
        {/* Show Export only for nested groups (not root folders) and if has view_members permission */}
        {!isRootFolder &&
          (organizationDetails?.is_owner ||
            organizationDetails?.user_permissions?.includes(
              "view_members"
            )) && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>Export</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background">
                  <DropdownMenuItem
                    onClick={() => onExport?.("csv", currentFolder)}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Export as CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onExport?.("excel", currentFolder)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Export as Excel</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}





        {/* Show Manage only if has update_groups permission */}
        {!isRootFolder &&
          (organizationDetails?.is_owner ||
            organizationDetails?.user_permissions?.includes(
              "update_groups"
            )) && (
            <DropdownMenuItem onClick={() => onManage?.(currentFolder)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Manage</span>
            </DropdownMenuItem>
          )}

        {/* Always show Info with separator */}
        <DropdownMenuSeparator />
        {/* will implement later - the work was too much lol */}
        {/* <DropdownMenuItem onClick={onInfoClick}>
        <InfoIcon className="mr-2 h-4 w-4" />
        <span>Info</span>
      </DropdownMenuItem> */}
      </DropdownMenuContent>
    );
  };

  const renderBreadcrumbItems = () => {
    // Always show organization name as first breadcrumb item
    const hasFolders = breadcrumbPath.length > 0;

    if (!isCollapsed) {
      // Render all items normally
      return (
        <>
          {/* Organization name - always shown first */}
          <Button
            variant="ghost"
            disabled={isFetching}
            onClick={handleOrganizationClick}
            className="h-auto p-1.5 px-2 rounded-md"
          >
            <span
              className={`text-sm capitalize ${hasFolders
                ? "text-muted-foreground hover:text-foreground"
                : "text-foreground font-medium"
                }`}
            >
              {organizationDetails?.slug || "ORG"}
            </span>
          </Button>

          {/* Render folder items */}
          {breadcrumbPath.map((item, index) => {
            const isLast = index === breadcrumbPath.length - 1;
            const isRootFolder = index === 0; // Root folders are at index 0

            return (
              <React.Fragment key={`breadcrumb-${item.id}-${index}`}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />

                {isLast ? (
                  // If it's a root folder, show as non-clickable button without dropdown
                  isRootFolder ? (
                    <Button
                      disabled={isFetching}
                      variant="ghost"
                      className="h-auto p-1.5 px-2 rounded-md cursor-default"
                    >
                      <span className={`text-sm ${isTrashFolder ? "text-red-600" : "text-foreground font-medium"}`}>
                        {item.name}
                      </span>
                    </Button>
                  ) : (
                    // For nested folders, show dropdown menu
                    <DropdownMenu
                      open={isDropdownOpen}
                      onOpenChange={setIsDropdownOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={isFetching}
                          variant="ghost"
                          className="h-auto p-1.5 px-2 rounded-md flex items-center gap-1"
                        >
                          <span className="text-sm text-foreground font-medium">
                            {item.name}
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      {renderActionsMenu()}
                    </DropdownMenu>
                  )
                ) : (
                  <Button
                    variant="ghost"
                    disabled={isFetching}
                    onClick={() => handleBreadcrumbItemClick(item, index)}
                    className="h-auto p-1.5 px-2 rounded-md"
                  >
                    <span className="text-sm text-muted-foreground hover:text-foreground">
                      {item.name}
                    </span>
                  </Button>
                )}
              </React.Fragment>
            );
          })}
        </>
      );
    }

    // Collapsed view: Show organization, ..., last 2 items
    const lastTwoItems = breadcrumbPath.slice(-2);

    return (
      <>
        {/* Organization name */}
        <Button
          disabled={isFetching}
          variant="ghost"
          onClick={handleOrganizationClick}
          className="h-auto p-1.5 px-2 rounded-md"
        >
          <span
            className={`text-sm capitalize ${hasFolders
              ? "text-muted-foreground hover:text-foreground"
              : "text-foreground font-medium"
              }`}
          >
            {organizationDetails?.slug || "ORG"}
          </span>
        </Button>

        {/* Only show chevron and menu if we have folders */}
        {hasFolders && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isFetching}
                  variant="ghost"
                  className="h-auto p-1.5 px-2 rounded-md"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {collapsedItems.map((item, idx) => {
                  const itemIndex = breadcrumbPath.findIndex(
                    (i) => i.id === item.id
                  );
                  return (
                    <DropdownMenuItem
                      key={`collapsed-menu-${item.id}-${idx}`}
                      onClick={() => handleBreadcrumbItemClick(item, itemIndex)}
                      className="cursor-pointer"
                    >
                      <span className="text-sm">{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {lastTwoItems.map((item, idx) => {
              const actualIndex = breadcrumbPath.length - 2 + idx;
              const isLast = actualIndex === breadcrumbPath.length - 1;
              const isRootFolder = actualIndex === 0; // Root folders are at index 0

              return (
                <React.Fragment
                  key={`breadcrumb-collapsed-${item.id}-${actualIndex}`}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />

                  {isLast ? (
                    // If it's a root folder, show as non-clickable button without dropdown
                    isRootFolder ? (
                      <Button
                        disabled={isFetching}
                        variant="ghost"
                        className="h-auto p-1.5 px-2 rounded-md cursor-default"
                      >
                        <span className="text-sm text-foreground font-medium">
                          {item.name}
                        </span>
                      </Button>
                    ) : (
                      // For nested folders, show dropdown menu
                      <DropdownMenu
                        open={isDropdownOpen}
                        onOpenChange={setIsDropdownOpen}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            disabled={isFetching}
                            variant="ghost"
                            className="h-auto p-1.5 px-2 rounded-md flex items-center gap-1"
                          >
                            <span className="text-sm text-foreground font-medium">
                              {item.name}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        {renderActionsMenu()}
                      </DropdownMenu>
                    )
                  ) : (
                    <Button
                      disabled={isFetching}
                      variant="ghost"
                      onClick={() =>
                        handleBreadcrumbItemClick(item, actualIndex)
                      }
                      className="h-auto p-1.5 px-2 rounded-md"
                    >
                      <span className="text-sm text-muted-foreground hover:text-foreground">
                        {item.name}
                      </span>
                    </Button>
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}
      </>
    );
  };

  return (
    <div className="mb-4" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div
          className="flex items-center gap-1.5 flex-wrap overflow-hidden"
          ref={breadcrumbRef}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <Building2 className="h-5 w-5" />
          </div>

          {renderBreadcrumbItems()}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* disabled for now will implement later */}
          {/* <Button
            disabled={isFetching}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onInfoClick}
          >
            <Info className="h-4 w-4" />
          </Button> */}
        </div>
      </div>
    </div>
  );
};

export default OrgMemberBreadcrumb;
