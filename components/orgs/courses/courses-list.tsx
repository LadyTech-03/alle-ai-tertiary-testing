"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteCourse } from "@/hooks/use-org-course";
import { Loader } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
    MoreVertical,
    Grid3x3,
    List,
    Folder,
    FolderOpen,
    FileText,
    Trash2,
    Edit3,
    FolderOpenDot,
    Filter,
    Check,
} from "lucide-react";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import type { Course, ClassGroup } from "@/lib/api/orgs/courses";

// Extended Course type
export interface CourseData extends Course {
    created_at?: string | null;
    files_count?: number | null;
    class?: string;
}

// Props for the reused component
interface CoursesListProps {
    courses: CourseData[];
    isLoading: boolean;
    uniqueClasses?: { name: string; slug: string }[]; // For filter dropdown
    initialClassSlug?: string; // If provided, pre-selects/locks this class
    hideClassFilter?: boolean; // If true, hides the class filter dropdown
    onRefresh?: () => void; // Optional callback after actions
}

// Skeleton Loading Component
const CourseCardSkeleton = () => {
    return (
        <Card className="bg-background">
            <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                    <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardContent>
        </Card>
    );
};

export default function CoursesList({
    courses,
    isLoading,
    uniqueClasses = [],
    initialClassSlug = "all",
    hideClassFilter = false,
    onRefresh,
}: CoursesListProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedClass, setSelectedClass] =
        useState<string>(initialClassSlug);
    const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
    const [showSelectionBar, setShowSelectionBar] = useState(false);
    const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);

    // Rename Dialog State
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [courseToRename, setCourseToRename] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [newCourseName, setNewCourseName] = useState("");

    // Delete Confirmation State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteContext, setDeleteContext] = useState<{
        uuids: string[];
        name?: string;
    } | null>(null);

    // Mutations
    const deleteCourseMutation = useDeleteCourse();

    const router = useRouter();
    const params = useParams();
    const orgSlug = params.orgslug as string;
    const setCurrentCourse = useCoursesSessionsStore(
        (state) => state.setCurrentCourse
    );

    // Effect to update selected class if initial prop changes (e.g. searching/navigating)
    useEffect(() => {
        if (initialClassSlug) {
            setSelectedClass(initialClassSlug);
        }
    }, [initialClassSlug]);

    // Filter courses based on selected class slug
    const filteredCourses =
        selectedClass === "all"
            ? courses
            : courses.filter(
                (course) => (course.class_group || course.class) === selectedClass
            );

    // Calculate total files in selected courses
    const selectedFilesCount = courses
        .filter((course) => selectedCourses.includes(course.id))
        .reduce((acc, course) => acc + (course.files_count || 0), 0);

    // Intent-aware selection bar visibility
    useEffect(() => {
        if (selectedCourses.length === 0) {
            setShowSelectionBar(false);
            return;
        }

        if (selectedCourses.length === 1 && !showSelectionBar) {
            const timer = setTimeout(() => {
                setShowSelectionBar(true);
            }, 250);
            return () => clearTimeout(timer);
        } else {
            setShowSelectionBar(true);
        }
    }, [selectedCourses.length, showSelectionBar]);

    // Format date helper
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const createSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const toggleCourseSelection = (id: number) => {
        setSelectedCourses((prev) =>
            prev.includes(id)
                ? prev.filter((courseId) => courseId !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCourses.length === filteredCourses.length) {
            setSelectedCourses([]);
        } else {
            setSelectedCourses(filteredCourses.map((course) => course.id));
        }
    };

    const handleRenameClick = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setCourseToRename({ id, name });
        setNewCourseName(name);
        setIsRenameDialogOpen(true);
    };

    const handleRenameSave = () => {
        setIsRenameDialogOpen(false);
        // Add rename logic here later
        if (onRefresh) onRefresh();
    };

    const handleDeleteClick = (
        e: React.MouseEvent,
        uuid: string,
        name: string
    ) => {
        e.stopPropagation();
        setDeleteContext({ uuids: [uuid], name });
        setIsDeleteDialogOpen(true);
    };

    const handleBulkDeleteClick = () => {
        if (selectedCourses.length === 0) return;

        const selectedUUIDs = courses
            .filter((c) => selectedCourses.includes(c.id))
            .map((c) => c.uuid);

        if (selectedCourses.length === 1) {
            const course = courses.find((c) => c.id === selectedCourses[0]);
            setDeleteContext({ uuids: selectedUUIDs, name: course?.name });
        } else {
            setDeleteContext({ uuids: selectedUUIDs });
        }
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (deleteContext?.uuids.length) {
            deleteContext.uuids.forEach((uuid) => {
                deleteCourseMutation.mutate(uuid, {
                    onSuccess: () => {
                        // Optional: trigger refresh if parent needs to know
                        if (onRefresh) onRefresh();
                    }
                });
            });

            if (deleteContext.uuids.length > 1) {
                setSelectedCourses([]);
            }
        }
        setIsDeleteDialogOpen(false);
    };

    const handleDoubleClick = (courseId: number, courseName: string) => {
        const course = courses.find((c) => c.id === courseId);

        if (course) {
            setCurrentCourse({
                id: course.id.toString(),
                uuid: course.uuid,
                name: course.name,
                class: course.class_group,
                description: course.description || "",
                instructions: course.instructions || undefined,
            });
        }

        const slug = createSlug(courseName);
        router.push(`/orgs/${orgSlug}/courses/${courseId}-${slug}`);
    };

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {hideClassFilter && selectedClass !== "all"
                            ? `${uniqueClasses.find(c => c.slug === selectedClass)?.name || selectedClass} Courses`
                            : "All Courses"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {filteredCourses.length} courses available
                        {!hideClassFilter && selectedClass !== "all" && ` in ${selectedClass}`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Class Filter Dropdown */}
                    {!hideClassFilter && (
                        <DropdownMenu
                            open={isClassFilterOpen}
                            onOpenChange={setIsClassFilterOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 h-9 border-dashed"
                                    disabled={isLoading}
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="text-sm">
                                        {selectedClass === "all"
                                            ? "All Classes"
                                            : uniqueClasses.find((c) => c.slug === selectedClass)
                                                ?.name || selectedClass}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-background">
                                <DropdownMenuItem
                                    onClick={() => setSelectedClass("all")}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "h-4 w-4 mr-2",
                                            selectedClass === "all" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    All Classes
                                </DropdownMenuItem>

                                {uniqueClasses.length > 0 ? (
                                    uniqueClasses.map((cls) => (
                                        <DropdownMenuItem
                                            key={cls.slug}
                                            onClick={() => setSelectedClass(cls.slug)}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 mr-2",
                                                    selectedClass === cls.slug
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {cls.name}
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                        No classes available
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* View Mode Toggle */}
                    <TooltipProvider>
                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={cn(
                                            "p-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === "grid"
                                                ? "bg-background shadow-sm"
                                                : "hover:bg-background/50 text-muted-foreground"
                                        )}
                                    >
                                        <Grid3x3 className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Grid View</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={cn(
                                            "p-2 rounded-md text-sm font-medium transition-all",
                                            viewMode === "list"
                                                ? "bg-background shadow-sm"
                                                : "hover:bg-background/50 text-muted-foreground"
                                        )}
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>List View</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                </div>
            </div>

            {/* Selection Actions Bar */}
            <div className="flex items-center justify-between pb-2 min-h-[40px]">
                {showSelectionBar ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="select-all"
                                checked={selectedCourses.length === filteredCourses.length}
                                onCheckedChange={toggleSelectAll}
                                disabled={isLoading || courses.length === 0}
                            />
                            <Label
                                htmlFor="select-all"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Select All
                            </Label>
                        </div>

                        <div className="h-4 w-px bg-border mx-1" />

                        <Badge
                            variant="secondary"
                            className="h-7 px-2.5 text-xs font-semibold bg-red-50 text-red-700 border-red-100"
                        >
                            {selectedCourses.length} selected · {selectedFilesCount} files
                        </Badge>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={handleBulkDeleteClick}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Delete</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="select-all-empty"
                            checked={false}
                            onCheckedChange={toggleSelectAll}
                            disabled={isLoading || courses.length === 0}
                        />
                        <Label
                            htmlFor="select-all-empty"
                            className="text-sm font-medium cursor-pointer"
                        >
                            Select All
                        </Label>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Scrollable Content Area */}
            <ScrollArea className="h-[calc(100vh-280px)] pr-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <CourseCardSkeleton key={index} />
                        ))}
                    </div>
                ) : !isLoading && courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Folder className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Get started by creating your first course. Add materials, assignments, and resources for your students.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Grid View */}
                        {viewMode === "grid" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredCourses.map((course) => {
                                    const isSelected = selectedCourses.includes(course.id);
                                    return (
                                        <div
                                            key={course.id}
                                            onClick={(e) => {
                                                if (e.detail === 1) {
                                                    toggleCourseSelection(course.id);
                                                }
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                handleDoubleClick(course.id, course.name);
                                            }}
                                            className="cursor-pointer relative"
                                        >
                                            <Card
                                                className={cn(
                                                    "group bg-background relative transition-all duration-200 hover:shadow-lg hover:border-primary/50",
                                                    isSelected &&
                                                    "ring-2 ring-primary border-primary shadow-md"
                                                )}
                                            >
                                                <CardContent className="p-5">
                                                    {/* Selection Checkbox */}
                                                    <div
                                                        className={cn(
                                                            "absolute top-3 left-3 z-10 transition-opacity duration-200",
                                                            isSelected
                                                                ? "opacity-100"
                                                                : "opacity-0 group-hover:opacity-100"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                toggleCourseSelection(course.id)
                                                            }
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>

                                                    {/* Actions Menu - Shows on hover */}
                                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-full"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                className="bg-background"
                                                                align="end"
                                                            >
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDoubleClick(course.id, course.name)
                                                                    }
                                                                >
                                                                    <FolderOpenDot className="h-4 w-4 mr-2" />
                                                                    Open
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) =>
                                                                        handleRenameClick(e, course.id, course.name)
                                                                    }
                                                                >
                                                                    <Edit3 className="h-4 w-4 mr-2" />
                                                                    Rename Course
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={(e) =>
                                                                        handleDeleteClick(
                                                                            e,
                                                                            course.uuid,
                                                                            course.name
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete Course
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Folder Icon and Course Name */}
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="relative flex-shrink-0">
                                                            <Folder className="h-10 w-10 text-yellow-500 transition-opacity duration-200 group-hover:opacity-0" />
                                                            <FolderOpen className="h-10 w-10 text-yellow-500 absolute top-0 left-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 ml-4">
                                                            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                                                                {course.name}
                                                            </h3>
                                                            {course.created_at && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Created: {formatDate(course.created_at)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Course Details */}
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="font-medium">Class:</span>
                                                            <span>{course.class_group}</span>
                                                        </div>
                                                        {course.files_count !== null &&
                                                            course.files_count !== undefined && (
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    <span>{course.files_count} files</span>
                                                                </div>
                                                            )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {viewMode === "list" && (
                            <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-12 text-center">
                                                <Checkbox
                                                    checked={
                                                        selectedCourses.length === filteredCourses.length &&
                                                        filteredCourses.length > 0
                                                    }
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead className="font-medium">Course Name</TableHead>
                                            <TableHead className="font-medium hidden md:table-cell">
                                                Created
                                            </TableHead>
                                            <TableHead className="font-medium">Class</TableHead>
                                            <TableHead className="font-medium hidden sm:table-cell">
                                                Files
                                            </TableHead>
                                            <TableHead className="font-medium text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCourses.map((course) => {
                                            const isSelected = selectedCourses.includes(course.id);
                                            return (
                                                <TableRow
                                                    key={course.id}
                                                    onClick={(e) => {
                                                        if (e.detail === 1) {
                                                            toggleCourseSelection(course.id);
                                                        }
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDoubleClick(course.id, course.name);
                                                    }}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        isSelected
                                                            ? "bg-primary/5 hover:bg-primary/10"
                                                            : "hover:bg-muted/30"
                                                    )}
                                                >
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                toggleCourseSelection(course.id)
                                                            }
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative flex-shrink-0">
                                                                <Folder className="h-8 w-8 text-yellow-500" />
                                                            </div>
                                                            <span className="font-medium">{course.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground hidden md:table-cell">
                                                        {course.created_at
                                                            ? formatDate(course.created_at)
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>{course.class_group}</TableCell>
                                                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                                                        {course.files_count !== null &&
                                                            course.files_count !== undefined ? (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-3.5 w-3.5" />
                                                                {course.files_count}
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDoubleClick(course.id, course.name)
                                                                    }
                                                                >
                                                                    <FolderOpenDot className="h-4 w-4 mr-2" />
                                                                    Open
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) =>
                                                                        handleRenameClick(e, course.id, course.name)
                                                                    }
                                                                >
                                                                    <Edit3 className="h-4 w-4 mr-2" />
                                                                    Rename Course
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={(e) =>
                                                                        handleDeleteClick(
                                                                            e,
                                                                            course.uuid,
                                                                            course.name
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete Course
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </>
                )}
            </ScrollArea>

            {/* Rename Course Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename Course</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the course.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Course Name</Label>
                            <Input
                                id="name"
                                value={newCourseName}
                                onChange={(e) => setNewCourseName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRenameDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRenameSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-background border-red-100 dark:border-red-900/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete Course
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            {deleteContext?.name ? (
                                <>
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold text-foreground">
                                        &quot;{deleteContext.name}&quot;
                                    </span>
                                    ? This action cannot be undone and all associated files will be
                                    removed.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold text-foreground">
                                        {deleteContext?.uuids.length} items
                                    </span>
                                    ? This action cannot be undone and all associated files will be
                                    removed.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={deleteCourseMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteConfirm}
                            disabled={deleteCourseMutation.isPending}
                        >
                            {deleteCourseMutation.isPending ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
