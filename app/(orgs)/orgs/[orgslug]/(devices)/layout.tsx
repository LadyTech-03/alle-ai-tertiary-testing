"use client";

import { useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Calendar,
  BookOpen,
  Plus,
  Search,
  PlayCircle,
  FolderOpen,
  Upload,
  FileQuestion,
  ArrowLeft,
  Users,
  Settings,
  ShieldAlert,
  Loader,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import AddCourseProject from "@/components/orgs/modals/add-course-project";
import {
  FileSelector,
  UploadProgressWidget,
  UploadFile,
} from "@/components/orgs/upload-files-loader";
import {
  useCreateCourse,
  useUpdateCourse,
  useUploadCourseFile,
  useTerminateAllSessions,
  useOrgClassGroups,
} from "@/hooks/use-org-course";

export default function DevicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgslug as string;
  const openAddClassModal = useCoursesSessionsStore(
    (state) => state.openAddClassModal
  );
  const showSearchInput = useCoursesSessionsStore(
    (state) => state.showSearchInput
  );
  const setShowSearchInput = useCoursesSessionsStore(
    (state) => state.setShowSearchInput
  );
  const currentCourse = useCoursesSessionsStore((state) => state.currentCourse);
  const clearCourseAndClassData = useCoursesSessionsStore(
    (state) => state.clearCourseAndClassData
  );

  // Fetch class groups to resolve class name for breadcrumbs
  const { data: classGroupsData } = useOrgClassGroups();
  const classSlug = params.classSlug as string;
  const isClassSpecificView =
    pathname.includes("/classes/") && !pathname.endsWith("/classes");

  const rawClassGroups = classGroupsData?.data;
  const classGroups = Array.isArray(rawClassGroups)
    ? rawClassGroups
    : rawClassGroups
      ? Object.values(rawClassGroups)
      : [];

  const className = isClassSpecificView
    ? (classGroups.find((c: any) => c.slug === classSlug) as any)?.name || classSlug
    : null;

  // Get loading states from store
  const isLoadingCourses = useCoursesSessionsStore(
    (state) => state.isLoadingCourses
  );
  const isLoadingClasses = useCoursesSessionsStore(
    (state) => state.isLoadingClasses
  );
  const isLoadingSessions = useCoursesSessionsStore(
    (state) => state.isLoadingSessions
  );

  // Course mutations
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const uploadFileMutation = useUploadCourseFile();
  const terminateAllSessionsMutation = useTerminateAllSessions();

  // Use course name from store instead of extracting from URL
  const courseName = currentCourse?.name;

  // Determine active tab based on pathname
  // Extract the segment after orgslug to determine which tab is active
  const pathSegments = pathname.split("/").filter(Boolean);
  const orgSlugIndex = pathSegments.indexOf(orgSlug as string);
  const currentSection = pathSegments[orgSlugIndex + 1];

  // Determine active tab based on current section
  const activeTab =
    pathname.includes(`/${orgSlug}/courses`)
      ? "courses"
      : pathname.includes(`/${orgSlug}/classes`)
        ? "classes"
        : pathname.includes(`/${orgSlug}/configurations`)
          ? "configurations"
          : "sessions";

  const handleTabChange = (value: string) => {
    // If navigating to All Courses or Sessions, clear the pre-selected context
    if (value === "courses" || value === "sessions") {
      useCoursesSessionsStore.getState().clearCourseAndClassData();
    }
    router.push(`/orgs/${orgSlug}/${value}`);
  };

  const handleCoursesClick = () => {
    setShowSearchInput(true);
    clearCourseAndClassData();
    router.push(`/orgs/${orgSlug}/courses`);
  };

  const handleBackToClasses = () => {
    clearCourseAndClassData();
    router.push(`/orgs/${orgSlug}/classes`);
  };

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    if (!currentCourse?.uuid) {
      console.error("No course UUID available");
      return;
    }

    // Create upload file objects
    const newUploadFiles: UploadFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadFiles]);

    // Upload each file using the mutation
    newUploadFiles.forEach((uploadFile) => {
      uploadFileMutation.mutate(
        {
          courseUuid: currentCourse.uuid,
          file: uploadFile.file,
        },
        {
          onSuccess: () => {
            // Mark as completed
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, progress: 100, status: "completed" }
                  : f
              )
            );
          },
          onError: () => {
            // Mark as failed
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, status: "error" } : f
              )
            );
          },
        }
      );

      // Simulate progress for UI (since we don't have real progress events)
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 95) {
          clearInterval(interval);
          progress = 95; // Stop at 95%, mutation will complete to 100%
        }
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
        );
      }, 300);
    });
  };

  // Cancel individual file
  const handleCancelFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Cancel all uploads
  const handleCancelAll = () => {
    setUploadingFiles([]);
  };

  // Close upload widget
  const handleCloseWidget = () => {
    setUploadingFiles([]);
  };

  // Handle course creation
  const handleCreateCourse = (data: {
    name: string;
    class: string;
    description: string;
    instructions: string;
  }) => {
    createCourseMutation.mutate(
      {
        name: data.name,
        class_group: data.class,
        description: data.description || null,
        instructions: data.instructions || null,
      },
      {
        onSuccess: () => {
          setIsAddCourseOpen(false);
        },
      }
    );
  };

  // Handle course update
  const handleUpdateCourse = (data: {
    name: string;
    class: string;
    description: string;
    instructions: string;
  }) => {
    if (!currentCourse?.uuid) return;

    updateCourseMutation.mutate(
      {
        courseId: currentCourse.uuid,
        payload: {
          name: data.name,
          class_group: data.class,
          description: data.description || null,
          instructions: data.instructions || null,
        },
      },
      {
        onSuccess: () => {
          setIsEditCourseOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Back to Courses Button - Only show when inside a course */}
      {!showSearchInput && (
        <Button
          onClick={handleCoursesClick}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground -mb-2 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Courses
        </Button>
      )}

      {/* Back to Classes Button - Show when in a specific class */}
      {isClassSpecificView && (
        <Button
          onClick={handleBackToClasses}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground -mb-2 group w-fit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Classes
        </Button>
      )}

      {/* Modern Card-Style Navigation with Action Button */}
      <div className="flex items-center justify-between gap-4">
        {showSearchInput && !isClassSpecificView ? (
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => handleTabChange("classes")}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "classes"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50 text-muted-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Classes
            </button>
            <button
              onClick={() => handleTabChange("courses")}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "courses"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50 text-muted-foreground"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Courses
            </button>
            <button
              onClick={() => handleTabChange("sessions")}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "sessions"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50 text-muted-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              Sessions
            </button>
            <button
              onClick={() => handleTabChange("configurations")}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === "configurations"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50 text-muted-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Configurations
            </button>
          </div>
        ) : isClassSpecificView ? (
          <div className="flex items-center gap-2 text-lg">
            <button
              onClick={handleBackToClasses}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-5 w-5" />
              <span className="font-semibold">{className}</span>
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">Courses</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-lg">
            <button
              onClick={handleCoursesClick}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderOpen className="h-5 w-5" />
              <span className="font-semibold">Courses</span>
            </button>
            {courseName && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-semibold">
                  {courseName}
                </span>
              </>
            )}
          </div>
        )}

        {/* Conditional Action Buttons */}
        {!showSearchInput ? (
          <div className="flex gap-2">
            <FileSelector onFilesSelected={handleFilesSelected}>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={isLoadingCourses}
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
            </FileSelector>
            <Button
              onClick={() => {
                setIsEditCourseOpen(true);
              }}
              size="sm"
              className="gap-2"
              disabled={isLoadingCourses}
            >
              <FolderOpen className="h-4 w-4" />
              Edit Course
            </Button>
          </div>
        ) : activeTab === "classes" ? (
          isClassSpecificView ? (
            <Button
              onClick={() => setIsAddCourseOpen(true)}
              size="sm"
              className="gap-2"
              disabled={isLoadingCourses}
            >
              <Plus className="h-4 w-4" />
              Add New Course
            </Button>
          ) : (
            <Button
              onClick={openAddClassModal}
              size="sm"
              className="gap-2"
              disabled={isLoadingClasses}
            >
              <Plus className="h-4 w-4" />
              Add Classes
            </Button>
          )
        ) : activeTab === "courses" ? (
          <Button
            onClick={() => setIsAddCourseOpen(true)}
            size="sm"
            className="gap-2"
            disabled={isLoadingCourses}
          >
            <Plus className="h-4 w-4" />
            Add New Course
          </Button>
        ) : activeTab === "sessions" ? (
          <Button
            onClick={() => {
              setIsRevokeAllOpen(true);
            }}
            size="sm"
            variant="destructive"
            className="gap-2"
            disabled={isLoadingSessions}
          >
            <PlayCircle className="h-4 w-4" />
            Revoke All Sessions
          </Button>
        ) : null}
      </div>

      {/* Enhanced Search Input with Focus Animation */}
      {showSearchInput && activeTab !== "configurations" && (
        <div className="relative max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="search"
            placeholder={
              activeTab === "classes"
                ? "Search classes..."
                : activeTab === "courses" || (pathname.includes("/classes/") && !pathname.endsWith("/classes"))
                  ? "Search courses..."
                  : activeTab === "sessions"
                    ? "Search sessions..."
                    : "Search configurations..."
            }
            className="pl-9 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary hover:border-muted-foreground/50"
          />
        </div>
      )}

      {/* Content */}
      <div className="min-h-screen mb-4 mt-7">{children}</div>

      {/* Add Course Dialog */}
      <AddCourseProject
        mode="add"
        open={isAddCourseOpen}
        onOpenChange={setIsAddCourseOpen}
        onSubmit={handleCreateCourse}
        isSubmitting={createCourseMutation.isPending}
      />

      {/* Edit Course Dialog */}
      <AddCourseProject
        mode="edit"
        open={isEditCourseOpen}
        onOpenChange={setIsEditCourseOpen}
        initialData={
          currentCourse
            ? {
              name: currentCourse.name,
              class: currentCourse.class,
              description: currentCourse.description,
              instructions: currentCourse.instructions,
            }
            : undefined
        }
        onSubmit={handleUpdateCourse}
        isSubmitting={updateCourseMutation.isPending}
      />

      <UploadProgressWidget
        files={uploadingFiles}
        onCancelFile={handleCancelFile}
        onCancelAll={handleCancelAll}
        onClose={handleCloseWidget}
      />

      {/* Revoke All Sessions Confirmation Dialog */}
      <Dialog open={isRevokeAllOpen} onOpenChange={setIsRevokeAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Revoke All Sessions
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke all active device sessions?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                This will affect all active  devices currently using
                the system.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevokeAllOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                terminateAllSessionsMutation.mutate(undefined, {
                  onSuccess: () => {
                    setIsRevokeAllOpen(false);
                  },
                });
              }}
              disabled={terminateAllSessionsMutation.isPending}
            >
              {terminateAllSessionsMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Yes, Revoke All"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
