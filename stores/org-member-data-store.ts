import { create } from "zustand";
import type { Group, Member } from "./edu-store";





// ***************** Note ****************************
// this file is no longer in use anywhere 
// but is kept for reference purposes only
export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

// Generic item type that can be either Group or Member
export type DataItem = Group | Member;

interface PageData {
  groups: Group[];
  members: Member[];
}

interface ViewData {
  pages: {
    [pageNum: number]: PageData;
  };
  currentPage: number;
  meta: Meta | null;
}

interface CurrentView {
  type: "root" | "seat-type" | "group";
  seatType: "faculty" | "student" | null;
  groupId: string | null;
}

// ========== STORE INTERFACE ==========

interface OrgMemberDataState {
  // ========== CURRENT VIEW CONTEXT ==========
  currentView: CurrentView;

  // ========== CACHED DATA ==========
  data: {
    faculty: ViewData;
    student: ViewData;
    nestedGroups: {
      [groupId: string]: ViewData;
    };
  };

  // ========== ACTIONS: NAVIGATION ==========
  setCurrentView: (view: CurrentView) => void;

  // ========== ACTIONS: SET PAGE DATA ==========
  setRootPageData: (
    seatType: "faculty" | "student",
    page: number,
    groups: Group[],
    members: Member[],
    meta: Meta
  ) => void;

  setGroupPageData: (
    groupId: string,
    page: number,
    groups: Group[],
    members: Member[],
    meta: Meta
  ) => void;

  // ========== ACTIONS: PAGINATION ==========
  setCurrentPage: (page: number) => void;

  // ========== GETTERS ==========
  getCurrentPageData: () => {
    groups: Group[];
    members: Member[];
    meta: Meta | null;
    isCached: boolean;
  };

  hasPageCached: (page: number) => boolean;

  // ========== MUTATIONS: UPDATE DATA IN CACHE ==========
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;

  addMember: (member: Member) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  deleteMember: (memberId: string) => void;

  // ========== UTILITY ==========
  clearCurrentViewCache: () => void;
  resetStore: () => void;
}

// ========== STORE IMPLEMENTATION ==========

export const useOrgMemberDataStore = create<OrgMemberDataState>((set, get) => ({
  // ========== INITIAL STATE ==========
  currentView: {
    type: "root",
    seatType: null,
    groupId: null,
  },

  data: {
    faculty: {
      pages: {},
      currentPage: 1,
      meta: null,
    },
    student: {
      pages: {},
      currentPage: 1,
      meta: null,
    },
    nestedGroups: {},
  },

  // ========== SET CURRENT VIEW ==========
  setCurrentView: (view) => {
    set({ currentView: view });
  },

  // ========== SET ROOT PAGE DATA ==========
  setRootPageData: (seatType, page, groups, members, meta) => {
    set((state) => ({
      data: {
        ...state.data,
        [seatType]: {
          ...state.data[seatType],
          pages: {
            ...state.data[seatType].pages,
            [page]: { groups, members },
          },
          currentPage: page,
          meta,
        },
      },
    }));
  },

  // ========== SET GROUP PAGE DATA ==========
  setGroupPageData: (groupId, page, groups, members, meta) => {
    set((state) => ({
      data: {
        ...state.data,
        nestedGroups: {
          ...state.data.nestedGroups,
          [groupId]: {
            pages: {
              ...(state.data.nestedGroups[groupId]?.pages || {}),
              [page]: { groups, members },
            },
            currentPage: page,
            meta,
          },
        },
      },
    }));
  },

  // ========== SET CURRENT PAGE ==========
  setCurrentPage: (page) => {
    const { currentView } = get();

    if (currentView.seatType) {
      set((state) => ({
        data: {
          ...state.data,
          [currentView.seatType!]: {
            ...state.data[currentView.seatType!],
            currentPage: page,
          },
        },
      }));
    } else if (currentView.groupId) {
      set((state) => ({
        data: {
          ...state.data,
          nestedGroups: {
            ...state.data.nestedGroups,
            [currentView.groupId!]: {
              ...state.data.nestedGroups[currentView.groupId!],
              currentPage: page,
            },
          },
        },
      }));
    }
  },

  // ========== GET CURRENT PAGE DATA ==========
  getCurrentPageData: () => {
    const { currentView, data } = get();

    // Root view - no data, show hardcoded folders
    if (currentView.type === "root") {
      return { groups: [], members: [], meta: null, isCached: false };
    }

    // Seat type view (Faculty or Students)
    if (currentView.seatType) {
      const viewData = data[currentView.seatType];
      const pageData = viewData.pages[viewData.currentPage];
      return {
        groups: pageData?.groups || [],
        members: pageData?.members || [],
        meta: viewData.meta,
        isCached: !!pageData,
      };
    }

    // Nested group view
    if (currentView.groupId) {
      const viewData = data.nestedGroups[currentView.groupId];
      const pageData = viewData?.pages[viewData?.currentPage];
      return {
        groups: pageData?.groups || [],
        members: pageData?.members || [],
        meta: viewData?.meta || null,
        isCached: !!pageData,
      };
    }

    return { groups: [], members: [], meta: null, isCached: false };
  },

  // ========== CHECK IF PAGE IS CACHED ==========
  hasPageCached: (page) => {
    const { currentView, data } = get();

    if (currentView.seatType) {
      return !!data[currentView.seatType].pages[page];
    }

    if (currentView.groupId) {
      return !!data.nestedGroups[currentView.groupId]?.pages[page];
    }

    return false;
  },

  // ========== ADD GROUP ==========
  addGroup: (group) => {
    const { currentView } = get();

    set((state) => {
      // Add to seat type view
      if (currentView.seatType) {
        const viewData = state.data[currentView.seatType];
        const currentPageData = viewData.pages[viewData.currentPage];

        // Create page data if it doesn't exist
        if (!currentPageData) {
          return {
            data: {
              ...state.data,
              [currentView.seatType]: {
                ...viewData,
                pages: {
                  ...viewData.pages,
                  [viewData.currentPage]: {
                    groups: [group],
                    members: [],
                  },
                },
              },
            },
          };
        }

        // Existing logic for when page data exists
        return {
          data: {
            ...state.data,
            [currentView.seatType]: {
              ...viewData,
              pages: {
                ...viewData.pages,
                [viewData.currentPage]: {
                  ...currentPageData,
                  groups: [...currentPageData.groups, group],
                },
              },
            },
          },
        };
      }

      // Add to nested group view
      if (currentView.groupId) {
        const viewData = state.data.nestedGroups[currentView.groupId];
        const currentPageData = viewData?.pages[viewData.currentPage];

        // Create nested group structure if it doesn't exist
        if (!viewData) {
          return {
            data: {
              ...state.data,
              nestedGroups: {
                ...state.data.nestedGroups,
                [currentView.groupId]: {
                  pages: {
                    [1]: { // Default to page 1
                      groups: [group],
                      members: [],
                    },
                  },
                  currentPage: 1,
                  meta: null,
                },
              },
            },
          };
        }

        // Create page data if it doesn't exist
        if (!currentPageData) {
          return {
            data: {
              ...state.data,
              nestedGroups: {
                ...state.data.nestedGroups,
                [currentView.groupId]: {
                  ...viewData,
                  pages: {
                    ...viewData.pages,
                    [viewData.currentPage]: {
                      groups: [group],
                      members: [],
                    },
                  },
                },
              },
            },
          };
        }

        // Existing logic for when both viewData and currentPageData exist
        return {
          data: {
            ...state.data,
            nestedGroups: {
              ...state.data.nestedGroups,
              [currentView.groupId]: {
                ...viewData,
                pages: {
                  ...viewData.pages,
                  [viewData.currentPage]: {
                    ...currentPageData,
                    groups: [...currentPageData.groups, group],
                  },
                },
              },
            },
          },
        };
      }

      return state;
    });
  },

  // ========== UPDATE GROUP ==========
  updateGroup: (groupId, updates) => {
    const { currentView } = get();

    set((state) => {
      // Update in seat type view
      if (currentView.seatType) {
        const viewData = state.data[currentView.seatType];
        const updatedPages = { ...viewData.pages };

        // Update group in all cached pages
        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            groups: pageData.groups.map((g: Group) =>
              g.id.toString() === groupId ? { ...g, ...updates } : g
            ),
          };
        });

        return {
          data: {
            ...state.data,
            [currentView.seatType]: {
              ...viewData,
              pages: updatedPages,
            },
          },
        };
      }

      // Update in nested group view
      if (currentView.groupId) {
        const viewData = state.data.nestedGroups[currentView.groupId];
        if (!viewData) return state;

        const updatedPages = { ...viewData.pages };

        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            groups: pageData.groups.map((g: Group) =>
              g.id.toString() === groupId ? { ...g, ...updates } : g
            ),
          };
        });

        return {
          data: {
            ...state.data,
            nestedGroups: {
              ...state.data.nestedGroups,
              [currentView.groupId]: {
                ...viewData,
                pages: updatedPages,
              },
            },
          },
        };
      }

      return state;
    });
  },

  // ========== DELETE GROUP ==========
  deleteGroup: (groupId) => {
    const { currentView } = get();

    set((state) => {
      // Delete from seat type view
      if (currentView.seatType) {
        const viewData = state.data[currentView.seatType];
        const updatedPages = { ...viewData.pages };

        // Remove from all cached pages
        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            groups: pageData.groups.filter(
              (g: Group) => g.id.toString() !== groupId
            ),
          };
        });

        return {
          data: {
            ...state.data,
            [currentView.seatType]: {
              ...viewData,
              pages: updatedPages,
            },
          },
        };
      }

      // Delete from nested group view
      if (currentView.groupId) {
        const viewData = state.data.nestedGroups[currentView.groupId];
        if (!viewData) return state;

        const updatedPages = { ...viewData.pages };

        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            groups: pageData.groups.filter(
              (g: Group) => g.id.toString() !== groupId
            ),
          };
        });

        return {
          data: {
            ...state.data,
            nestedGroups: {
              ...state.data.nestedGroups,
              [currentView.groupId]: {
                ...viewData,
                pages: updatedPages,
              },
            },
          },
        };
      }

      return state;
    });
  },

  // ========== ADD MEMBER ==========
  addMember: (member) => {
    const { currentView } = get();

    set((state) => {
      // Add to seat type view
      if (currentView.seatType) {
        const viewData = state.data[currentView.seatType];
        const currentPageData = viewData.pages[viewData.currentPage];

        if (currentPageData) {
          return {
            data: {
              ...state.data,
              [currentView.seatType]: {
                ...viewData,
                pages: {
                  ...viewData.pages,
                  [viewData.currentPage]: {
                    ...currentPageData,
                    members: [...currentPageData.members, member],
                  },
                },
              },
            },
          };
        }
      }

      // Add to nested group view
      if (currentView.groupId) {
        const viewData = state.data.nestedGroups[currentView.groupId];
        const currentPageData = viewData?.pages[viewData.currentPage];

        if (currentPageData && viewData) {
          return {
            data: {
              ...state.data,
              nestedGroups: {
                ...state.data.nestedGroups,
                [currentView.groupId]: {
                  ...viewData,
                  pages: {
                    ...viewData.pages,
                    [viewData.currentPage]: {
                      ...currentPageData,
                      members: [...currentPageData.members, member],
                    },
                  },
                },
              },
            },
          };
        }
      }

      return state;
    });
  },

  // ========== UPDATE MEMBER ==========
  updateMember: (memberId, updates) => {
    const { currentView } = get();

    set((state) => {
      // Update in seat type view
      if (currentView.seatType) {
        const viewData = state.data[currentView.seatType];
        const updatedPages = { ...viewData.pages };

        // Update member in all cached pages
        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            members: pageData.members.map((m: Member) =>
              m.id.toString() === memberId ? { ...m, ...updates } : m
            ),
          };
        });

        return {
          data: {
            ...state.data,
            [currentView.seatType]: {
              ...viewData,
              pages: updatedPages,
            },
          },
        };
      }

      // Update in nested group view
      if (currentView.groupId) {
        const viewData = state.data.nestedGroups[currentView.groupId];
        if (!viewData) return state;

        const updatedPages = { ...viewData.pages };

        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            members: pageData.members.map((m: Member) =>
              m.id.toString() === memberId ? { ...m, ...updates } : m
            ),
          };
        });

        return {
          data: {
            ...state.data,
            nestedGroups: {
              ...state.data.nestedGroups,
              [currentView.groupId]: {
                ...viewData,
                pages: updatedPages,
              },
            },
          },
        };
      }

      return state;
    });
  },

  // ========== DELETE MEMBER ==========
  deleteMember: (memberId) => {
    const { currentView } = get();

    set((state) => {
      // Delete from seat type view
      if (currentView.seatType) {
        const viewData = state.data[currentView.seatType];
        const updatedPages = { ...viewData.pages };

        // Remove from all cached pages
        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            members: pageData.members.filter(
              (m: Member) => m.id.toString() !== memberId
            ),
          };
        });

        return {
          data: {
            ...state.data,
            [currentView.seatType]: {
              ...viewData,
              pages: updatedPages,
            },
          },
        };
      }

      // Delete from nested group view
      if (currentView.groupId) {
        const viewData = state.data.nestedGroups[currentView.groupId];
        if (!viewData) return state;

        const updatedPages = { ...viewData.pages };

        Object.keys(updatedPages).forEach((pageNum) => {
          const pageData = updatedPages[Number(pageNum)];
          updatedPages[Number(pageNum)] = {
            ...pageData,
            members: pageData.members.filter(
              (m: Member) => m.id.toString() !== memberId
            ),
          };
        });

        return {
          data: {
            ...state.data,
            nestedGroups: {
              ...state.data.nestedGroups,
              [currentView.groupId]: {
                ...viewData,
                pages: updatedPages,
              },
            },
          },
        };
      }

      return state;
    });
  },

  // ========== CLEAR CURRENT VIEW CACHE ==========
  clearCurrentViewCache: () => {
    const { currentView } = get();

    if (currentView.seatType) {
      set((state) => ({
        data: {
          ...state.data,
          [currentView.seatType!]: {
            pages: {},
            currentPage: 1,
            meta: null,
          },
        },
      }));
    } else if (currentView.groupId) {
      set((state) => {
        const { [currentView.groupId!]: _, ...rest } = state.data.nestedGroups;
        return {
          data: {
            ...state.data,
            nestedGroups: rest,
          },
        };
      });
    }
  },

  // ========== RESET STORE ==========
  resetStore: () => {
    set({
      currentView: { type: "root", seatType: null, groupId: null },
      data: {
        faculty: { pages: {}, currentPage: 1, meta: null },
        student: { pages: {}, currentPage: 1, meta: null },
        nestedGroups: {},
      },
    });
  },
}));

