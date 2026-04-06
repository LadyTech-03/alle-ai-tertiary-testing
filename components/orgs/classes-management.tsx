"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Info, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import ClassModal from "@/components/orgs/modals/class-modal";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";

import {
  useOrgClassGroups,
  useUpdateClassGroup,
  useDeleteClassGroup,
} from "@/hooks/use-org-course";
import { Loader, FolderOpen } from "lucide-react";
import type { ClassGroup } from "@/lib/api/orgs/courses";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function ClasseManagement() {
  // Track which class is being updated
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Fetch classes from backend
  // Fetch classes from backend
  const { data: classGroupsData, isLoading } = useOrgClassGroups();

  // Safe-guard: Ensure classes is always an array, even if backend returns an object
  const rawData = classGroupsData?.data;
  const classes: (ClassGroup & { free_chat?: boolean })[] = Array.isArray(rawData)
    ? rawData
    : rawData
      ? Object.values(rawData)
      : [];

  // Mutation for updating class
  const updateClassGroupMutation = useUpdateClassGroup();
  const deleteClassGroupMutation = useDeleteClassGroup();

  // Use store for modal state
  const isOpen = useCoursesSessionsStore((state) => state.isClassModalOpen);
  const mode = useCoursesSessionsStore((state) => state.classModalMode);
  const selectedClass = useCoursesSessionsStore((state) => state.selectedClass);
  const openEditModal = useCoursesSessionsStore(
    (state) => state.openEditClassModal
  );
  const closeModal = useCoursesSessionsStore((state) => state.closeClassModal);
  const setLoadingClasses = useCoursesSessionsStore(
    (state) => state.setLoadingClasses
  );

  // Sync loading state to store for layout buttons
  useEffect(() => {
    setLoadingClasses(isLoading);
  }, [isLoading, setLoadingClasses]);

  const handleToggleFreeChat = (slug: string) => {
    const classToUpdate = classes.find((cls) => cls.slug === slug);
    if (!classToUpdate) return;

    setTogglingSlug(slug);

    updateClassGroupMutation.mutate(
      {
        slug: slug,
        payload: {
          name: classToUpdate.name,
          free_chat: !classToUpdate.free_chat,
        },
      },
      {
        onSuccess: () => {
          setTogglingSlug(null);
        },
        onError: () => {
          setTogglingSlug(null);
        },
      }
    );
  };

  const handleEditClass = (slug: string) => {
    const classToEdit = classes.find((cls) => cls.slug === slug);
    if (classToEdit) {
      openEditModal({
        name: classToEdit.name,
        slug: classToEdit.slug,
        free_chat: classToEdit.free_chat ?? false,
      });
    }
  };

  const confirmDelete = (slug: string) => {
    setClassToDelete(slug);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClass = () => {
    if (!classToDelete) return;

    deleteClassGroupMutation.mutate(classToDelete, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setClassToDelete(null);
      },
    });
  };

  return (
    <div className="space-y-8 mt-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight">Classes</h2>
        <p className="text-sm text-muted-foreground mt-3">
          Manage class groups and open chat settings
        </p>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="border-t"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ transformOrigin: "left" }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-[calc(100vh-280px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading classes...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && classes.length === 0 && (
        <div className="flex items-center justify-center h-[calc(100vh-280px)]">
          <div className="flex flex-col items-center gap-3 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="text-base font-medium text-muted-foreground">
                No Classes Available
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add new classes to see them here
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      {!isLoading && classes.length > 0 && (
        <ScrollArea className="h-[calc(100vh-280px)] pr-4">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {classes.map((cls, index) => (
              <motion.div key={cls.slug} variants={cardVariants}>
                <motion.div
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Card className="hover:shadow-lg transition-shadow hover:border-primary/50 h-full bg-background">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold line-clamp-2">
                          {cls.name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 -mr-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const orgSlug = window.location.pathname.split("/")[2];
                                router.push(`/orgs/${orgSlug}/classes/${cls.slug}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Class
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClass(cls.slug)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => confirmDelete(cls.slug)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Open Chat
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="max-w-xs text-xs">
                                  Allow students to use open chat features
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                        >
                          {togglingSlug === cls.slug ? (
                            <Loader className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Switch
                              checked={cls.free_chat}
                              onCheckedChange={() =>
                                handleToggleFreeChat(cls.slug)
                              }
                              className="scale-90"
                            />
                          )}
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </ScrollArea>
      )}

      {/* Class Modal */}
      <ClassModal
        mode={mode}
        open={isOpen}
        onOpenChange={closeModal}
        initialData={mode === "edit" ? selectedClass || undefined : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class
              group and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteClassGroupMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteClass();
              }}
              disabled={deleteClassGroupMutation.isPending}
            >
              {deleteClassGroupMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Class"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
