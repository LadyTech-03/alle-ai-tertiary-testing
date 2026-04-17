"use client";
import React, { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useOrgMemberStore,
  useOrgMemberSelectionStore,
} from "@/stores/edu-store";
import { useAuthStore } from "@/stores";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { toast } from "sonner";
import { useBreadcrumbUrlSync } from "@/hooks/use-breadcrumb-url-sync";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ManageGroupDialog from "../modals/manage-modal";
import RenameGroupModal from "../modals/rename-group";
import MoveItemsModal from "../modals/move-modal";
import { OrgGroupsInfo } from "../org-sheet-info";
import { SelectionActionBar } from "../selection-actionbar";
import RenderOrgMembersTables from "../render-org-membersTables";
import CreateGroups from "../modals/create-groups";
import AddMemberOrg from "../modals/add-member";
import { triggerCsvImport } from "@/components/orgs/helpers/import-csv";
import OnCsvImports from "@/components/orgs/modals/on-csv-imports";
import type { Group, Member } from "@/stores/edu-store";
import OrgMemberBreadcrumb from "../member-management-breadcum";
import DeleteSelected from "../modals/DeleteSelected";
import { useOrgMemberData } from "@/hooks/use-org-member-data";
import { useRenameGroup } from "@/hooks/use-org-member-mutations";
import { Loader } from "lucide-react";
import { useRestoreDeletedMembers } from "@/hooks/use-org-member-mutations";
import { usePermanentDeleteMembers } from "@/hooks/use-org-member-mutations";
// import RemoveMembersModal from "../modals/DeleteSelected";

export default function OrganizationMembersPage() {
  // Sync breadcrumb to URL path in browser
  useBreadcrumbUrlSync();
  const restoreDeletedMembers = useRestoreDeletedMembers();
  const permanentDeleteMembers = usePermanentDeleteMembers();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showOrgInfoSheet, setShowOrgInfoSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [trashIds, setTrashIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [actionType, setActionType] = useState<"restore" | "delete">("delete");
  const queryClient = useQueryClient();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameData, setRenameData] = useState<Group | null>(null);
  const [showMMoveItemsModal, setShowMoveItemsModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editMemberData, setEditMemberData] = useState<Member | null>(null);
  const [csvImportData, setCsvImportData] = useState<{
    fileName: string;
    memberCount: number;
  } | null>(null);
  const [csvData, setCsvData] = useState<Array<{
    email: string;
    firstname: string;
    lastname: string;
  }> | null>(null);
  const { organizationDetails } = useAuthStore();
  const {
    addBreadcrumbItem,
    setIsSearching,
    breadcrumbPath,
    setBreadcrumbPath,
    truncateBreadcrumb,
    updateBreadcrumbItem,
    isSearching,
  } = useOrgMemberStore();

  const { clearSelection } = useOrgMemberSelectionStore();

  // ========== PAGE STATE ==========
  const [page, setPage] = useState(1);

  // Get organization ID
  const orgId = organizationDetails?.id?.toString() || "1"; // Fallback to "1" for testing

  // Check if we're in root view
  const isRootView = breadcrumbPath.length === 0;

  // Check if we are in deleted view
  const isDeletedView =
    breadcrumbPath.length > 0 &&
    (breadcrumbPath[0].id === 3 || breadcrumbPath[0].seat_type === "system");

  // ========== TANSTACK QUERY DATA FETCHING ==========
  const {
    groups,
    members,
    meta,
    isLoading,
    isFetching,
    hasNextPage,
    hasPreviousPage,
    refetch,
  } = useOrgMemberData({ orgId, breadcrumbPath, page });

  // ========== MUTATIONS ==========
  const renameGroupMutation = useRenameGroup(orgId);

  // ========== PAGINATION HANDLERS ==========
  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((p) => p + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setPage((p) => p - 1);
    }
  };

  // function to handle renaming
  const handleShowRenameAndManageModal = (
    data: Group,
    type: "rename" | "manage"
  ) => {
    setRenameData(data);
    if (type === "manage") {
      setShowManageModal(true);
      return;
    }
    setShowRenameModal(true);
  };

  // function to handle edit member
  const handleShowEditMemberModal = (data: Member) => {
    setEditMemberData(data);
    setShowEditMemberModal(true);
  };

  // function to handle move items
  const handleShowMoveModal = (data?: Group) => {
    // Can be called from breadcrumb (with folder) or selection action bar (without folder)
    setShowMoveItemsModal(true);
  };
  // delete members permanantly
  const handleDeleteMembers = async (data: any) => {
    // console.log(data);
    setActionType("delete");
    setActionMessage(
      `Are you sure you want to permanently delete ${data.length} member(s)?`
    );
    setTrashIds(data.map((i: any) => i.id));
    setShowConfirmationModal(true);
  };

  // handle restore users

  const handleRestoreMembers = async (data: any) => {
    setActionType("restore");
    setActionMessage(
      `Are you sure you want to restore ${data.length} member(s)?`
    );
    const userIds = data.map((i: any) => i.id);
    setTrashIds(userIds);
    setShowConfirmationModal(true);
  };

  const onConfirmDeleteRestore = async (method: "restore" | "delete") => {
    setActionLoading(true);
    if (method === "restore") {
      restoreDeletedMembers.mutateAsync(trashIds, {
        onSuccess: () => {
          setActionLoading(false);
          setShowConfirmationModal(false);
          clearSelection();
        },
        onError: () => {
          setActionLoading(false);
          setShowConfirmationModal(false);
        },
      });
      return;
    }
    permanentDeleteMembers.mutateAsync(trashIds, {
      onSuccess: () => {
        setActionLoading(false);
        setShowConfirmationModal(false);
        clearSelection();
        // Remove permanently deleted members from search results
        if (isSearching) {
          removeFromSearchResults(trashIds, []);
        }
      },
      onError: () => {
        setActionLoading(false);
        setShowConfirmationModal(false);
      },
    });
  };
  // actual on renaming call
  const onRenameGroup = async (newName: string) => {
    if (!renameData) return;

    renameGroupMutation.mutate(
      {
        groupId: renameData.id,
        newName,
        groupData: {
          description: renameData.description,
          parent_id: renameData.parent_id,
          seat_type: renameData.seat_type,
          expiry_date: renameData.expiry_date,
          features: renameData.features || [],
        },
        seatType: renameData.seat_type,
      },
      {
        onSuccess: () => {
          // Update breadcrumb if this group is in the path
          updateBreadcrumbItem(renameData.id, { name: newName });
          setShowRenameModal(false);
          setRenameData(null);
        },
      }
    );
  };

  // ========== SEARCH STATE ==========
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");


  const removeFromSearchResults = useCallback(
    (memberIds: number[], groupIds: number[]) => {
      setSearchResults((prev) =>
        prev.filter((member) => !memberIds.includes(member.id))
      );
    },
    []
  );


  const updateOrRemoveSearchResult = useCallback(
    (memberId: number, updatedMember: Member) => {
      const query = currentSearchQuery.toLowerCase().trim();

      // Check if updated member still matches search query
      const stillMatches =
        updatedMember.first_name?.toLowerCase().includes(query) ||
        updatedMember.last_name?.toLowerCase().includes(query) ||
        updatedMember.email?.toLowerCase().includes(query);

      if (stillMatches) {
        setSearchResults((prev) =>
          prev.map((m) => (m.id === memberId ? updatedMember : m))
        );
      } else {
        setSearchResults((prev) => prev.filter((m) => m.id !== memberId));
      }
    },
    [currentSearchQuery]
  );

  const handleDebouncedSearch = useCallback(
    async (
      query: string,
      searchInCurrentFolder: boolean,
      isTrashFolder?: boolean
    ) => {
      setCurrentSearchQuery(query);

      if (query.trim() !== "") {
        setIsSearching(true);
        setIsSearchLoading(true);

        try {
          const response = await orgMemberApi.searchQuery(
            orgId,
            query,
            isTrashFolder
          );
          setSearchResults(response.data || []);
        } catch (error) {
          // console.error("Search error:", error);
          toast.error("Search failed. Please try again.");
          setSearchResults([]);
        } finally {
          setIsSearchLoading(false);
        }
      } else {
        setIsSearching(false);
        setSearchResults([]);
        clearSelection(); // Clear selection when search is cleared
      }
    },
    [orgId, setIsSearching, clearSelection]
  );

  // handle move items
  const handleMoveSuccess = useCallback(
    (
      user_ids: number[],
      _group_ids: number[],
      newPath: Array<{ name: string; id: number | null }>
    ) => {
      if (!isSearching) return;

      setSearchResults((prev) =>
        prev.map((member) => {
          if (user_ids.includes(member.id)) {
            return { ...member, path: newPath };
          }
          return member;
        })
      );
    },
    [isSearching]
  );

  // Handle CSV import
  const handleCsvImport = async () => {
    // Clear previous data first

    setCsvData(null);
    setCsvImportData(null);

    try {
      const result = await triggerCsvImport();

      if (result.success && result.data && result.fileName) {
        // Store the actual parsed data
        setCsvData(result.data);

        // Store metadata about the import
        setCsvImportData({
          fileName: result.fileName,
          memberCount: result.data.length,
        });

        setShowCsvImportModal(true);
      }
    } catch (error) {
      console.error("CSV import failed:", error);
    }
  };

  // ========== DOUBLE CLICK HANDLER (ROOT & NESTED GROUPS) ==========
  const handleDoubleClick = (item: Group, isRoot?: boolean) => {
    setIsSearching(false);
    addBreadcrumbItem(item);
    setPage(1); // Reset to page 1 when navigating
    clearSelection();
  };

  // handle move items

  return (
    <main className="min-h-screen ">
      {/* Header with title and filters toggle */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <h1 className="text-base font-semibold ">
            Manage your organization members
          </h1>
          {/* <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button> */}
        </div>
      </div>

      <div
        className={`mb-4 overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="pb-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                View
              </label>
              <Select defaultValue="groups">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groups">Groups</SelectItem>
                  <SelectItem value="all">All Members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Status
              </label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Seat Type
              </label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Created By
              </label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="student">System</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* breadcrumb */}
      <div className="">
        <OrgMemberBreadcrumb
          organizationName=""
          onInfoClick={() => {
            if (showOrgInfoSheet) return;
            setShowOrgInfoSheet(true);
          }}
          isFetching={isLoading}
          onBreadcrumbClick={(item: Group | null, index: number) => {
            // Handle breadcrumb navigation
            if (item === null) {
              // Organization clicked - go to root
              setBreadcrumbPath([]);
              clearSelection();
              setPage(1);
            } else {
              // Folder clicked - navigate to that level
              truncateBreadcrumb(index);
              setPage(1); // Reset to page 1
              clearSelection();
            }
          }}
          onManage={(currentfolder) => {
            setRenameData(currentfolder);
            setShowManageModal(true);
          }}
        />
      </div>

      {/* members table here  */}
      <div>
        <RenderOrgMembersTables
          onImportCSV={handleCsvImport}
          onAddMember={() => setShowAddMemberModal(true)}
          onCreateGroup={() => setShowCreateGroupModal(true)}
          isfetching={isSearching ? isSearchLoading : isLoading}
          groups={isSearching ? [] : groups}
          members={isSearching ? searchResults : members}
          onOpenFolder={handleDoubleClick}
          onDebouncedSearch={handleDebouncedSearch}
          onRootFolder={isRootView}
          isDeletedView={isDeletedView}
          // Pagination props (hide during search)
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          hasNextPage={isSearching ? false : hasNextPage}
          hasPreviousPage={isSearching ? false : hasPreviousPage}
          isFetchingNextPage={isFetching}
          isFetchingPreviousPage={isFetching}
          currentPage={meta?.current_page || 1}
          totalPages={meta?.last_page || 1}
          onPageOne={() => setPage(1)}
          searchQuery={currentSearchQuery}
        />
      </div>

      {/* Selection Action Bar */}
      <SelectionActionBar
        onExport={() => { }}
        onRename={handleShowRenameAndManageModal}
        onEditMember={handleShowEditMemberModal}
        onMove={handleShowMoveModal}
        onDelete={() => setShowDeleteSelectedModal(true)}
        onManage={handleShowRenameAndManageModal}
        onRestore={handleRestoreMembers}
        onPermanentDelete={handleDeleteMembers}
        isDeletedView={isDeletedView}
      />

      {/* Modals */}
      {showAddMemberModal && (
        <AddMemberOrg
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroups
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
        />
      )}

      {showCsvImportModal && (
        <OnCsvImports
          isOpen={showCsvImportModal}
          onClose={() => setShowCsvImportModal(false)}
          fileName={csvImportData!.fileName}
          memberCount={csvImportData!.memberCount}
          data={csvData}
          onRefetch={refetch}
        />
      )}

      {showOrgInfoSheet && (
        <OrgGroupsInfo
          open={showOrgInfoSheet}
          onOpenChange={setShowOrgInfoSheet}
        />
      )}

      {showRenameModal && renameData && (
        <RenameGroupModal
          isOpen={showRenameModal}
          onClose={() => {
            setShowRenameModal(false);
            setRenameData(null);
          }}
          onRename={onRenameGroup}
          data={renameData}
          isLoading={renameGroupMutation.isPending}
        />
      )}

      {showMMoveItemsModal && (
        <MoveItemsModal
          isOpen={showMMoveItemsModal}
          onOpenChange={setShowMoveItemsModal}
          onMoveSuccess={handleMoveSuccess}
        />
      )}

      {showDeleteSelectedModal && (
        <DeleteSelected
          isOpen={showDeleteSelectedModal}
          onOpenChange={setShowDeleteSelectedModal}
          onRemoveFromSearch={isSearching ? removeFromSearchResults : undefined}
        />
      )}

      {showManageModal && (
        <ManageGroupDialog
          isOpen={showManageModal}
          onOpenChange={setShowManageModal}
          data={renameData}
        />
      )}

      {showEditMemberModal && editMemberData && (
        <AddMemberOrg
          isOpen={showEditMemberModal}
          onClose={() => {
            setShowEditMemberModal(false);
            setEditMemberData(null);
          }}
          memberData={editMemberData}
          onUpdateSearchResult={
            isSearching ? updateOrRemoveSearchResult : undefined
          }
        />
      )}
      <Dialog
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete User?</DialogTitle>
            <DialogDescription>
              {actionMessage}{" "}
              <strong>
                {actionType === "delete"
                  ? "This action cannot be undone."
                  : "This will restore the user and make the account active again.."}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmationModal(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                onConfirmDeleteRestore(actionType);
              }}
              disabled={actionLoading}
            >
              {actionLoading && (
                <div className="flex gap-2">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              {!actionLoading &&
                (actionType === "delete"
                  ? "Permanently Delete"
                  : "Restore Members")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
