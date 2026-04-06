"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Loader } from "lucide-react";
import { useOrgClassGroups } from "@/hooks/use-org-course";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import { usePathname } from "next/navigation";

interface AddCourseProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit";
  initialData?: {
    name?: string;
    class?: string;
    description?: string;
    instructions?: string;
  };
  onSubmit?: (data: {
    name: string;
    class: string;
    description: string;
    instructions: string;
  }) => void;
  isSubmitting?: boolean; // Loading state for form submission
}

export default function AddCourseProject({
  open,
  onOpenChange,
  mode = "add",
  initialData,
  onSubmit,
  isSubmitting = false,
}: AddCourseProjectProps) {
  const [courseName, setCourseName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  // Fetch class groups from API
  const { data: classGroupsData, isLoading: isLoadingClasses } =
    useOrgClassGroups();
  const classes = classGroupsData?.data || [];

  const preSelectedClassSlug = useCoursesSessionsStore(
    (state) => state.preSelectedClassSlug
  );
  const pathname = usePathname();

  // Populate form with initial data in edit mode
  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setCourseName(initialData.name || "");
      setSelectedClass(initialData.class || "");
      setDescription(initialData.description || "");
      setInstructions(initialData.instructions || "");
    } else if (open && mode === "add") {
      setCourseName("");
      // Pre-fill if we are on a class-specific page
      const isClassView = pathname.includes("/classes/") && !pathname.endsWith("/classes");
      setSelectedClass(isClassView ? preSelectedClassSlug || "" : "");
      setDescription("");
      setInstructions("");
    }
  }, [open, mode, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        name: courseName,
        class: selectedClass,
        description,
        instructions,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setCourseName("");
    setSelectedClass("");
    setDescription("");
    setInstructions("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Course" : "Create New Course"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the course details below."
              : "Add a new course to your organization. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="courseName"
                  placeholder="Course Name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              {isLoadingClasses ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                  <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Retrieving your classes...
                  </span>
                </div>
              ) : classes.length > 0 ? (
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  required
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classGroup) => (
                      <SelectItem key={classGroup.slug} value={classGroup.slug}>
                        {classGroup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                  <span className="text-sm text-muted-foreground">
                    No classes available
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter course description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Enter specific instructions for this course..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoadingClasses ||
                !courseName ||
                !selectedClass ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : mode === "edit" ? (
                "Update Course"
              ) : (
                "Create Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
