import { create } from "zustand";

// Course data interface
export interface CourseData {
  id: string;
  uuid: string;
  name: string;
  class: string;
  description: string;
  instructions?: string;
}

// Class data interface
export interface ClassData {
  name: string;
  slug: string;
  free_chat: boolean;
}

import { persist, createJSONStorage } from "zustand/middleware";

interface CoursesSessionsState {
  showSearchInput: boolean;
  setShowSearchInput: (show: boolean) => void;

  // Loading states for different contexts
  isLoadingCourses: boolean;
  isLoadingClasses: boolean;
  isLoadingSessions: boolean;
  setLoadingCourses: (loading: boolean) => void;
  setLoadingClasses: (loading: boolean) => void;
  setLoadingSessions: (loading: boolean) => void;

  // Current course being viewed/edited
  currentCourse: CourseData | null;
  setCurrentCourse: (course: CourseData | null) => void;

  // Pre-selected class for Add Course modal (used in dynamic class views)
  preSelectedClassSlug: string | null;
  setPreSelectedClassSlug: (slug: string | null) => void;

  // Class modal state
  isClassModalOpen: boolean;
  classModalMode: "add" | "edit";
  selectedClass: ClassData | null;
  openAddClassModal: () => void;
  openEditClassModal: (classData: ClassData) => void;
  closeClassModal: () => void;

  // Clear all data
  clearCourseAndClassData: () => void;
}

export const useCoursesSessionsStore = create<CoursesSessionsState>()(
  persist(
    (set) => ({
      showSearchInput: true,
      setShowSearchInput: (show) => set({ showSearchInput: show }),

      // Loading states
      isLoadingCourses: false,
      isLoadingClasses: false,
      isLoadingSessions: false,
      setLoadingCourses: (loading) => set({ isLoadingCourses: loading }),
      setLoadingClasses: (loading) => set({ isLoadingClasses: loading }),
      setLoadingSessions: (loading) => set({ isLoadingSessions: loading }),

      currentCourse: null,
      setCurrentCourse: (course) => set({ currentCourse: course }),

      preSelectedClassSlug: null,
      setPreSelectedClassSlug: (slug) => set({ preSelectedClassSlug: slug }),

      // Class modal
      isClassModalOpen: false,
      classModalMode: "add",
      selectedClass: null,
      openAddClassModal: () =>
        set({
          isClassModalOpen: true,
          classModalMode: "add",
          selectedClass: null,
        }),
      openEditClassModal: (classData) =>
        set({
          isClassModalOpen: true,
          classModalMode: "edit",
          selectedClass: classData,
        }),
      closeClassModal: () =>
        set({ isClassModalOpen: false, selectedClass: null }),

      clearCourseAndClassData: () =>
        set({
          currentCourse: null,
          preSelectedClassSlug: null,
          selectedClass: null,
        }),
    }),
    {
      name: "courses-sessions-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentCourse: state.currentCourse,
        preSelectedClassSlug: state.preSelectedClassSlug,
        // We persist these so they survive refresh
      }),
    }
  )
);
