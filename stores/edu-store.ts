import { create } from "zustand";
import { persist } from "zustand/middleware";

export type {
  Group,
  Member,
  FolderItem,
  SeatType,
} from "@/lib/types/org-members";

export { isGroup, isMember } from "@/lib/types/org-members";

// Import types for use within this file
import type { Group, Member } from "@/lib/types/org-members";

// Response types for API calls
export interface GroupsResponse {
  groups: Group[];
}

export interface FolderContentsResponse {
  groups: Group[];
  members: Member[];
}

export interface SearchResponse {
  groups: Group[];
  members: Member[];
}
interface OrgMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

interface OrgState {
  breadcrumbPath: Group[];
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  setBreadcrumbPath: (newPath: Group[]) => void;
  addBreadcrumbItem: (item: Group) => void;
  truncateBreadcrumb: (index: number) => void;
  updateBreadcrumbItem: (groupId: number, updates: Partial<Group>) => void;
  clearBreadcrumb: () => void;
  orgMetadata?: OrgMetadata;
  setOrgMetadata: (metadata: OrgMetadata) => void;
}

// selections

interface SelectionItem {
  id: string;
  name: string;
  type: "group" | "member";
  data: Group | Member;
}

interface SelectionMetadata {
  totalSelected: number;
  groupsCount: number;
  membersCount: number;
  isMixed: boolean;
  selectedData: SelectionItem[];
  actions: {
    canRename: boolean;
    canEdit: boolean;
    canMove: boolean;
    canDelete: boolean;
    canManage?: boolean;
    canRestore: boolean;
    canPermanentDelete: boolean;
  };
}

interface SelectionStore {
  // State
  selectedItems: Map<string, SelectionItem>;

  // Actions
  selectItem: (
    id: string,
    name: string,
    type: "group" | "member",
    fullData: Group | Member
  ) => void;
  deselectItem: (id: string) => void;
  toggleItem: (
    id: string,
    name: string,
    type: "group" | "member",
    fullData: Group | Member
  ) => void;
  selectAll: (items: SelectionItem[]) => void;
  clearSelection: () => void;

  // Computed/Getters
  getSelectionMetadata: () => SelectionMetadata;
  isSelected: (id: string) => boolean;
  hasSelection: () => boolean;
}

export const useOrgMemberStore = create<OrgState>()(
  persist(
    (set) => ({
      // Breadcrumb
      breadcrumbPath: [],
      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),
      setBreadcrumbPath: (newPath) => set({ breadcrumbPath: newPath }),
      addBreadcrumbItem: (item) =>
        set((state) => ({ breadcrumbPath: [...state.breadcrumbPath, item] })),
      truncateBreadcrumb: (index) =>
        set((state) => ({
          breadcrumbPath: state.breadcrumbPath.slice(0, index + 1),
        })),
      updateBreadcrumbItem: (groupId, updates) =>
        set((state) => ({
          breadcrumbPath: state.breadcrumbPath.map((item) =>
            item.id === groupId ? { ...item, ...updates } : item
          ),
        })),
      clearBreadcrumb: () => set({ breadcrumbPath: [], isSearching: false }),

      orgMetadata: undefined,
      setOrgMetadata: (metadata) => set({ orgMetadata: metadata }),
    }),
    {
      name: "org-member-navigation",
      partialize: (state) => ({ breadcrumbPath: state.breadcrumbPath }),
    }
  )
);

// org member selections

export const useOrgMemberSelectionStore = create<SelectionStore>(
  (set, get) => ({
    // Initial state
    selectedItems: new Map(),

    // Select a single item
    selectItem: (id, name, type, fullData) => {
      set((state) => {
        const newMap = new Map(state.selectedItems);
        newMap.set(id, {
          id,
          name,
          type,
          data: fullData,
        });
        return { selectedItems: newMap };
      });
    },

    // Deselect a single item
    deselectItem: (id) => {
      set((state) => {
        const newMap = new Map(state.selectedItems);
        newMap.delete(id);
        return { selectedItems: newMap };
      });
    },

    // Toggle item selection
    toggleItem: (id, name, type, fullData) => {
      const { selectedItems } = get();
      if (selectedItems.has(id)) {
        get().deselectItem(id);
      } else {
        get().selectItem(id, name, type, fullData);
      }
    },

    // Select all items
    selectAll: (items) => {
      set(() => {
        const newMap = new Map<string, SelectionItem>();
        items.forEach((item) => {
          newMap.set(item.id, item);
        });
        return { selectedItems: newMap };
      });
    },

    // Clear all selections
    clearSelection: () => {
      set({ selectedItems: new Map() });
    },

    // Get selection metadata
    getSelectionMetadata: () => {
      const { selectedItems } = get();
      const items = Array.from(selectedItems.values());
      const totalSelected = items.length;

      // Count by type
      const groups = items.filter((item) => item.type === "group");
      const members = items.filter((item) => item.type === "member");

      // Determine available actions based on selection
      const canRename = totalSelected === 1 && groups.length === 1;
      const canEdit = totalSelected === 1 && members.length === 1;
      const canMove = totalSelected > 0; // Any selection
      const canDelete = totalSelected > 0; // Any selection
      const canManage = totalSelected === 1 && groups.length === 1;

      // Check if selection has mixed types
      const isMixed = groups.length > 0 && members.length > 0;

      // Check for deleted items (using deleted_at presence)
      // deleted_at will be null/undefined for active items and a date string for deleted items
      const hasDeletedItems = items.some(
        (item) =>
          (item.type === "member" &&
            (item.data as Member).deleted_at != null) ||
          (item.type === "group" && (item.data as Group).deleted_at != null)
      );

      // Restore / Permanent Delete only if ALL selected items are deleted items
      const allDeleted =
        items.length > 0 &&
        items.every(
          (item) =>
            (item.type === "member" &&
              (item.data as Member).deleted_at != null) ||
            (item.type === "group" && (item.data as Group).deleted_at != null)
        );

      const canRestore = allDeleted;
      const canPermanentDelete = allDeleted;

      // Disable standard actions if any deleted item is selected
      const standardActionsEnabled = !hasDeletedItems;

      return {
        totalSelected,
        groupsCount: groups.length,
        membersCount: members.length,
        isMixed,
        selectedData: items,
        actions: {
          canRename: standardActionsEnabled && canRename,
          canEdit: standardActionsEnabled && canEdit,
          canMove: standardActionsEnabled && canMove,
          canDelete: standardActionsEnabled && canDelete,
          canManage: standardActionsEnabled && canManage,
          canRestore,
          canPermanentDelete,
        },
      };
    },

    // Check if an item is selected
    isSelected: (id) => {
      const { selectedItems } = get();
      return selectedItems.has(id);
    },

    // Check if any items are selected
    hasSelection: () => {
      const { selectedItems } = get();
      return selectedItems.size > 0;
    },
  })
);

// Organization Payment Store (Simplified - only stores billing date info)
interface OrgPaymentStore {
  nextBillingDate?: string | null;
  nextBillingMessage?: string | null;

  setNextBillingInfo: (date?: string | null, message?: string | null) => void;
  resetPaymentStore: () => void;
}

export const useOrgPaymentStore = create<OrgPaymentStore>()(
  persist(
    (set) => ({
      nextBillingDate: null,
      nextBillingMessage: null,

      setNextBillingInfo: (date, message) =>
        set({ nextBillingDate: date, nextBillingMessage: message }),

      resetPaymentStore: () =>
        set({
          nextBillingDate: null,
          nextBillingMessage: null,
        }),
    }),
    {
      name: "org-payment-store",
      partialize: (state) => ({
        nextBillingDate: state.nextBillingDate,
        nextBillingMessage: state.nextBillingMessage,
      }),
    }
  )
);

// ============ EDU LOGIN STORE Temporal ============
export interface EduLoginData {
  organisation_name: string;
  organisation_logo: string;
  user_name: string;
}

interface EduLoginState {
  loginData: EduLoginData | null;
  setLoginData: (data: EduLoginData) => void;
  clearLoginData: () => void;
}

export const useEduLoginStore = create<EduLoginState>()(
  persist(
    (set) => ({
      loginData: null,
      setLoginData: (loginData) => set({ loginData }),
      clearLoginData: () => set({ loginData: null }),
    }),
    {
      name: "edu-login-storage",
    }
  )
);
