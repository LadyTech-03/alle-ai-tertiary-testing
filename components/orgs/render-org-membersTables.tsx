"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrgSearchInput } from "./org-search-input";
import {
  Search,
  Folder,
  Users,
  Plus,
  UserPlus,
  FileUp,
  Upload,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Info,
} from "lucide-react";
import { useOrgMemberSelectionStore } from "@/stores/edu-store";
import { useOrgMemberStore } from "@/stores/edu-store";
import type { Group, Member, isGroup, isMember } from "@/stores/edu-store";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { RootFolderView } from "./rootFolders";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface renderProps {
  groups?: Group[];
  members?: Member[];
  isfetching: boolean;
  onCreateGroup?: () => void;
  onAddMember?: () => void;
  onImportCSV?: () => void;
  onOpenFolder?: (item: Group, isRoot?: boolean) => void;
  onDebouncedSearch: (query: string, searchInCurrentFolder: boolean) => void;
  debounceMs?: number;
  onRootFolder: boolean;
  // Pagination props
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isFetchingNextPage?: boolean;
  isFetchingPreviousPage?: boolean;
  searchQuery?: string;
  currentPage?: number;
  totalPages?: number;
  onPageOne?: () => void;
  isDeletedView?: boolean;
}

export default function RenderOrgMembersTables({
  groups = [],
  members = [],
  isfetching = false,
  onCreateGroup,
  onAddMember,
  onImportCSV,
  onOpenFolder,
  onDebouncedSearch,
  debounceMs,
  onRootFolder = true,
  // Pagination props
  onNextPage,
  onPreviousPage,
  hasNextPage = false,
  hasPreviousPage = false,
  isFetchingNextPage = false,
  isFetchingPreviousPage = false,
  currentPage = 1,
  totalPages = 1,
  onPageOne,
  searchQuery = "",
  isDeletedView = false,
}: renderProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const { breadcrumbPath, isSearching } = useOrgMemberStore();
  const { organizationDetails, user } = useAuthStore();
  const { toggleItem, isSelected, selectAll, clearSelection } =
    useOrgMemberSelectionStore();

  const isTrashFolder =
    breadcrumbPath.length > 0 &&
    breadcrumbPath[breadcrumbPath.length - 1].seat_type === "system";

  // Store callback refs to avoid re-adding event listener on every render
  const callbacksRef = useRef({ onCreateGroup, onAddMember, onImportCSV });
  useEffect(() => {
    callbacksRef.current = { onCreateGroup, onAddMember, onImportCSV };
  }, [onCreateGroup, onAddMember, onImportCSV]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea or if any modal/dialog is open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Only work when inside a folder (not root) and not in deleted view
      if (breadcrumbPath.length === 0 || isDeletedView || isfetching) {
        return;
      }

      // Ctrl+G - Create Group
      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "g" &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (
          organizationDetails?.is_owner ||
          organizationDetails?.user_permissions?.includes("create_groups")
        ) {
          e.preventDefault();
          callbacksRef.current.onCreateGroup?.();
        }
      }

      // Ctrl+M - Add Member
      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "m" &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (
          organizationDetails?.is_owner ||
          organizationDetails?.user_permissions?.includes("add_members")
        ) {
          e.preventDefault();
          callbacksRef.current.onAddMember?.();
        }
      }

      // Ctrl+I - Import CSV
      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "i" &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (
          organizationDetails?.is_owner ||
          organizationDetails?.user_permissions?.includes("add_members")
        ) {
          e.preventDefault();
          callbacksRef.current.onImportCSV?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [breadcrumbPath.length, isDeletedView, isfetching, organizationDetails]);

  // Helper to check if a member is restricted (current user or owner)
  const isRestrictedMember = (member: Member): boolean => {
    if (!organizationDetails) return false;
    const currentUserEmail = user?.email;
    const ownerEmail = organizationDetails.owner_email;
    return member.email === currentUserEmail || member.email === ownerEmail;
  };

  // Get restriction reason for tooltip
  const getRestrictionReason = (member: Member): string | null => {
    if (!organizationDetails) return null;
    if (member.email === user?.email) {
      return "You cannot modify your own entry here. Please go to Profile Settings to update your personal information.";
    }
    if (member.email === organizationDetails.owner_email) {
      return "This user is protected and cannot be modified.";
    }
    return null;
  };

  // Combine groups and members for rendering
  const allItems = [...groups, ...members];

  const badgeClass = (type: string, isDeleted: boolean = false) => {
    const base =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-150";
    if (isDeleted) {
      const deletedStyles: Record<string, string> = {
        faculty:
          "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
        student:
          "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
        member:
          "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
        admin:
          "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
        group:
          "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
      };

      const fallback =
        "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400";

      return `${base} ${deletedStyles[type] ?? fallback}`;
    }
    const styles: Record<string, string> = {
      faculty:
        "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:hover:bg-pink-800",
      student:
        "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800",
      group:
        "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:hover:bg-violet-800",
      member:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      admin:
        "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800",
    };

    // default gray for unknown types
    const fallback =
      "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";

    return `${base} ${styles[type] ?? fallback}`;
  };

  // Helper function to highlight text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span
              key={i}
              className="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white font-medium rounded-[2px] px-0.5"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Handle select all in current view (exclude restricted members)
  const handleSelectAll = () => {
    if (allItems.length === 0) return;

    // Filter out restricted members
    const selectableItems = allItems.filter((item) => {
      if ("email" in item) {
        return !isRestrictedMember(item as Member);
      }
      return true; // All groups are selectable
    });

    const selectionItems = selectableItems.map((item) => ({
      id: ("email" in item
        ? `member-${item.id}`
        : `group-${item.id}`
      ).toString(),
      name:
        "first_name" in item
          ? `${item.first_name} ${item.last_name}`
          : item.name,
      type: "email" in item ? ("member" as const) : ("group" as const),
      data: item,
    }));

    // Check if all selectable items are selected
    const allSelected = selectableItems.every((item) =>
      isSelected(
        ("email" in item ? `member-${item.id}` : `group-${item.id}`).toString()
      )
    );

    if (allSelected) {
      clearSelection();
    } else {
      selectAll(selectionItems);
    }
  };

  // Handle single click with delay
  const handleRowClick = (
    itemId: string,
    name: string,
    type: "group" | "member",
    data: any
  ) => {
    // Clear any existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
      return; // This is part of a double-click, ignore
    }

    // Set a timer for single click action
    const timer = setTimeout(() => {
      toggleItem(itemId, name, type, data);
      setClickTimer(null);
    }, 200); // 200ms delay

    setClickTimer(timer);
  };

  // Handle double click - only opens groups (not members)
  const handleDoubleClick = (item: Group | Member, isRoot: boolean = false) => {
    // Clear the single click timer to prevent selection
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
    }

    // Only trigger for groups, not members
    if ("email" in item) return;

    // Pass the group to parent component to fetch nested data with isRoot flag
    onOpenFolder?.(item, isRoot);
  };

  const areAllItemsSelected = () => {
    if (allItems.length === 0) return false;
    // Only check selectable items (exclude restricted members)
    const selectableItems = allItems.filter((item) => {
      if ("email" in item) {
        return !isRestrictedMember(item as Member);
      }
      return true;
    });
    if (selectableItems.length === 0) return false;
    return selectableItems.every((item) =>
      isSelected(
        ("email" in item ? `member-${item.id}` : `group-${item.id}`).toString()
      )
    );
  };

  // Render table rows
  const renderTableRows = () => {
    if (allItems.length === 0) return null;

    return allItems.map((item, index) => {
      const isItemGroup = "email" in item ? false : true;
      const itemId = item.id.toString();

      if (isItemGroup) {
        const group = item as Group;
        const selected = isSelected(`group-${itemId}`);
        return (
          <TableRow
            key={`group-${itemId}`}
            className={`hover:bg-gray-100 dark:hover:bg-muted ${selected ? "bg-gray-50 dark:bg-backgroundSecondary" : ""
              }`}
            onMouseEnter={() => setHoveredRow(itemId)}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() =>
              handleRowClick(`group-${itemId}`, group.name, "group", group)
            }
            onDoubleClick={() => handleDoubleClick(group, false)}
          >
            <TableCell className="w-16">
              {(hoveredRow === itemId || selected) && (
                <Checkbox
                  checked={selected}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => {
                    toggleItem(`group-${itemId}`, group.name, "group", group);
                  }}
                  className="cursor-pointer data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 dark:data-[state=checked]:bg-gray-500 dark:data-[state=checked]:border-gray-500"
                />
              )}
            </TableCell>
            <TableCell className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Folder
                  className={`w-4 h-4 ${group.seat_type === "faculty"
                    ? "text-pink-600"
                    : "text-blue-600"
                    }`}
                />
                <span>{highlightText(group.name, searchQuery)}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={badgeClass(group.seat_type, isTrashFolder)}>
                {group.seat_type}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {group.created_at
                ? new Date(group.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : "-"}
            </TableCell>
            <TableCell>
              <Badge className={badgeClass("group", isTrashFolder)}>
                Group
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {group.expiry_date
                ? new Date(group.expiry_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : "-"}
            </TableCell>
          </TableRow>
        );
      } else {
        const member = item as Member;
        const fullName = `${member.first_name} ${member.last_name}`;
        const selected = isSelected(`member-${itemId}`);
        const isOwner = member.email === organizationDetails?.owner_email;

        return (
          <TableRow
            key={`member-${itemId}-${index}`}
            className={`${isRestrictedMember(member)
              ? "cursor-not-allowed opacity-60"
              : isTrashFolder
                ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                : "hover:bg-gray-100 dark:hover:bg-muted"
              } ${selected
                ? isTrashFolder
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-gray-50 dark:bg-backgroundSecondary"
                : ""
              }`}
            onMouseEnter={() => setHoveredRow(itemId)}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() => {
              if (!isRestrictedMember(member)) {
                handleRowClick(`member-${itemId}`, fullName, "member", member);
              }
            }}
          >
            <TableCell className="w-16">
              {(hoveredRow === itemId || selected) &&
                !isRestrictedMember(member) && (
                  <Checkbox
                    checked={selected}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => {
                      toggleItem(
                        `member-${itemId}`,
                        fullName,
                        "member",
                        member
                      );
                    }}
                    className="cursor-pointer data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 dark:data-[state=checked]:bg-gray-500 dark:data-[state=checked]:border-gray-500"
                  />
                )}
              {(hoveredRow === itemId || selected) &&
                isRestrictedMember(member) && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full flex justify-center cursor-not-allowed p-2">
                          <Checkbox
                            checked={false}
                            disabled={true}
                            className="cursor-not-allowed opacity-50"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        className="z-50"
                        side="right"
                        align="center"
                      >
                        <p>{getRestrictionReason(member)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={member.photo_url || ""} />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-800 dark:text-muted-foreground text-xs font-medium">
                    {member.first_name?.[0]}
                    {member.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div>
                    {highlightText(fullName, searchQuery)}
                    {member.email === user?.email && (
                      <span className="ml-2 text-xs text-muted-foreground font-medium">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {highlightText(member.email, searchQuery)}
                  </div>

                  {/* Search Path Context */}
                  {isSearching && member.path && member.path.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] opacity-85 select-none animate-in fade-in slide-in-from-left-1 duration-300">
                      <span className="font-bold text-[8px] text-muted-foreground/60 tracking-wider">
                        LOCATION
                      </span>
                      <Folder
                        className={`w-2.5 h-2.5 ${member.seat_type === "faculty"
                            ? "text-pink-600 dark:text-pink-400"
                            : "text-blue-600 dark:text-blue-400"
                          }`}
                      />
                      <div className="flex items-center gap-0.5 text-muted-foreground/80">
                        {(() => {
                          const path = member.path;
                          const showEllipsis = path.length > 3;
                          const itemsToDisplay = showEllipsis
                            ? [path[0], { name: "...", id: -99 }, ...path.slice(-2)]
                            : path;

                          return itemsToDisplay.map((folder, idx) => (
                            <React.Fragment key={idx}>
                              <span
                                className={`
                                  ${folder.id !== -99 && idx === itemsToDisplay.length - 1
                                    ? "font-medium text-muted-foreground"
                                    : ""
                                  }
                                `}
                              >
                                {folder.id === null
                                  ? `Root ${folder.name}`
                                  : folder.name}
                              </span>
                              {idx < itemsToDisplay.length - 1 && (
                                <ChevronRight className="w-2 h-2 opacity-50" />
                              )}
                            </React.Fragment>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={badgeClass(member.seat_type, isTrashFolder)}>
                {member.seat_type}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {member.created_at
                ? new Date(member.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : "-"}
            </TableCell>
            <TableCell>
              <Badge
                className={badgeClass(
                  isOwner ? "admin" : member.role,
                  isTrashFolder
                )}
              >
                {isOwner ? "Owner" : member.role}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {member.expiry_date
                ? new Date(member.expiry_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                : member.deleted_at
                  ? new Date(member.deleted_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                  : "-"}
            </TableCell>
          </TableRow>
        );
      }
    });
  };
  return (
    <>
      <div></div>
      <Card className="min-h-[calc(100vh-200px)] bg-background">
        {/* buttons appearance will be base on tooltip store so it dont render
         on root folders
        */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <OrgSearchInput
                onDebouncedSearch={onDebouncedSearch}
                debounceMs={debounceMs}
                disabled={isfetching}
              />
            </div>

            {breadcrumbPath.length > 0 && !isDeletedView ? (
              <div className="flex items-center gap-2">
                {/* Create Group - only show if has create_groups permission */}
                {(organizationDetails?.is_owner ||
                  organizationDetails?.user_permissions?.includes(
                    "create_groups"
                  )) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isfetching}
                            onClick={onCreateGroup}
                            className=" h-8 w-8 "
                            variant="default"
                            size="icon"
                          >
                            <FolderPlus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create Group</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                {/* Add Member - only show if has add_members permission */}
                {(organizationDetails?.is_owner ||
                  organizationDetails?.user_permissions?.includes(
                    "add_members"
                  )) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isfetching}
                            className="h-8 w-8"
                            onClick={onAddMember}
                            variant="outline"
                            size="icon"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Member</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                {/* Import CSV - only show if has add_members permission */}
                {(organizationDetails?.is_owner ||
                  organizationDetails?.user_permissions?.includes(
                    "add_members"
                  )) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={isfetching}
                            className="h-8 w-8"
                            onClick={onImportCSV}
                            variant="outline"
                            size="icon"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Import CSV</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                {/* Keyboard Shortcuts Info */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isfetching}
                        className="h-8 w-8"
                        variant="ghost"
                        size="icon"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="bottom">
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold mb-2">
                          Keyboard Shortcuts:
                        </p>
                        <div className="flex justify-between gap-4">
                          <span>Create Group</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            Ctrl+G
                          </kbd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Add Member</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            Ctrl+M
                          </kbd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Import CSV</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                            Ctrl+I
                          </kbd>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : null}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          {isfetching ? (
            // Show skeleton loading for both root and folder views
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b-2 ">
                  <TableHead className="w-16">
                    <Skeleton className="h-5 w-5 rounded" />
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Name/Email
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Seat Type
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Date added
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Type/Role
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    {isTrashFolder ? "Deleted At" : "Valid Until"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="w-16">
                      <Skeleton className="h-5 w-5 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : onRootFolder && !isSearching ? (
            <RootFolderView
              isGrid={true}
              onItemDoubleClick={(item) => onOpenFolder?.(item, true)}
            />
          ) : allItems.length === 0 && !isSearching ? (
            <div className="flex justify-center py-16">
              <div className="text-center max-w-md">
                {isDeletedView ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-base font-medium mb-1">
                      Recycle Bin is empty
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      No deleted accounts found.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>

                    <h3 className="text-base font-medium mb-1">No data yet</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Get started by adding your first entry
                    </p>

                    <div className="flex justify-center gap-2 mb-3">
                      {/* Create Group - only show if has create_groups permission */}
                      {(organizationDetails?.is_owner ||
                        organizationDetails?.user_permissions?.includes(
                          "create_groups"
                        )) && (
                          <Button
                            onClick={onCreateGroup}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Create Group
                          </Button>
                        )}

                      {/* Add Member - only show if has add_members permission */}
                      {(organizationDetails?.is_owner ||
                        organizationDetails?.user_permissions?.includes(
                          "add_members"
                        )) && (
                          <Button onClick={onAddMember} size="sm">
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add Member
                          </Button>
                        )}
                    </div>

                    {/* Import CSV - only show if has add_members permission */}
                    {(organizationDetails?.is_owner ||
                      organizationDetails?.user_permissions?.includes(
                        "add_members"
                      )) && (
                        <Button onClick={onImportCSV} variant="outline" size="sm">
                          <FileUp className="w-4 h-4 mr-1" />
                          Import CSV
                        </Button>
                      )}
                  </>
                )}
              </div>
            </div>
          ) : allItems.length === 0 && isSearching ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nothing found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No results match your search. Try different keywords or check
                  your spelling.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b-2 ">
                  <TableHead className="w-16">
                    <Checkbox
                      className="cursor-pointer h-5 w-5 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 dark:data-[state=checked]:bg-gray-500 dark:data-[state=checked]:border-gray-500"
                      disabled={isfetching}
                      checked={allItems.length > 0 && areAllItemsSelected()}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Name/Email
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Seat Type
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Date added
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    Type/Role
                  </TableHead>
                  <TableHead className="text-sm text-black dark:text-white">
                    {isTrashFolder ? "Deleted At" : "Valid Until"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isfetching
                  ? Array.from({ length: 8 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="w-16">
                        <Skeleton className="h-5 w-5 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                  : renderTableRows()}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Pagination Controls */}
        {(hasNextPage || hasPreviousPage) && (
          <div className="flex justify-end items-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={!hasPreviousPage || isFetchingPreviousPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentPage > 2 && onPageOne && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPageOne}
                  disabled={isfetching}
                  className="hidden sm:flex"
                >
                  <span className="mr-1">&laquo;</span> 1
                </Button>
              )}
            </div>

            <span className="text-sm text-muted-foreground font-medium">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!hasNextPage || isFetchingNextPage}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
