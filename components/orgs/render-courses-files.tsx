"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn, formatFileSize } from "@/lib/utils";
import {
  Grid3x3,
  List,
  Trash2,
  Edit3,
  MoreVertical,
  FileText,
  Sheet,
  Image,
  Video,
  Music,
  File,
  ChevronDown,
  Filter,
  FileX,
  Loader,
} from "lucide-react";

// Types
interface CourseFile {
  id: number;
  name: string;
  type: string;
  size: number;
  created: string;
}

interface RenderCoursesFilesProps {
  files: CourseFile[];
  isLoading?: boolean;
}

// File type categories
const FILE_TYPE_FILTERS = [
  { label: "All Types", value: "all" },
  { label: "Images", value: "images" },
  { label: "Videos", value: "videos" },
  { label: "Audios", value: "audios" },
  { label: "PDFs", value: "pdfs" },
  { label: "Documents", value: "documents" },
  { label: "Spreadsheets", value: "spreadsheets" },
  { label: "Others", value: "others" },
];

// Icon mapper with colors
const getFileIcon = (type: string) => {
  const iconMap: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: "text-red-500" },
    doc: { icon: FileText, color: "text-blue-500" },
    docx: { icon: FileText, color: "text-blue-500" },
    xls: { icon: Sheet, color: "text-green-500" },
    xlsx: { icon: Sheet, color: "text-green-500" },
    csv: { icon: Sheet, color: "text-green-600" },
    jpg: { icon: Image, color: "text-purple-500" },
    jpeg: { icon: Image, color: "text-purple-500" },
    png: { icon: Image, color: "text-purple-500" },
    gif: { icon: Image, color: "text-pink-500" },
    mp4: { icon: Video, color: "text-orange-500" },
    mov: { icon: Video, color: "text-orange-500" },
    avi: { icon: Video, color: "text-orange-600" },
    mp3: { icon: Music, color: "text-cyan-500" },
    wav: { icon: Music, color: "text-cyan-600" },
    default: { icon: File, color: "text-gray-500" },
  };

  return iconMap[type] || iconMap.default;
};

export default function RenderCoursesFiles({
  files,
  isLoading = false,
}: RenderCoursesFilesProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  const toggleFileSelection = (id: number) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  const selectedSize = files
    .filter((file) => selectedFiles.includes(file.id))
    .reduce((total, file) => total + file.size, 0);

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="border-t" />

      {/* Filters / Selection Actions Bar */}
      <div className="flex items-center justify-between">
        {/* Left: Filters or Selection Info and Actions */}
        {selectedFiles.length > 0 ? (
          // Selection Actions
          <div className="flex items-center gap-3">
            {/* Selection Count and Size */}
            <Badge
              variant="destructive"
              className="text-sm font-medium bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
            >
              {selectedFiles.length} selected • {formatFileSize(selectedSize)}
            </Badge>

            {/* Divider */}
            <div className="h-5 w-px bg-border" />

            {/* Action Icons */}
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => console.log("Rename")}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rename</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => console.log("Delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        ) : (
          // Filters
          <div className="flex items-center gap-2">
            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 bg-background"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">
                    {FILE_TYPE_FILTERS.find(
                      (f) => f.value === selectedTypeFilter
                    )?.label || "All Types"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-background">
                {FILE_TYPE_FILTERS.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => setSelectedTypeFilter(filter.value)}
                    className={cn(
                      "cursor-pointer",
                      selectedTypeFilter === filter.value && "bg-accent"
                    )}
                  >
                    {filter.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Right: View Mode Toggle */}
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

      {/* Content Area */}
      <div className="mt-4">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Loader className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Fetching files...</p>
          </div>
        ) : files.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FileX className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Upload your first file to get started. Files will appear here once
              uploaded.
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {files.map((file) => {
                  const { icon: Icon, color } = getFileIcon(file.type);
                  const isSelected = selectedFiles.includes(file.id);

                  return (
                    <Card
                      key={file.id}
                      className={cn(
                        "group relative bg-background cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                        isSelected && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <CardContent className="p-3 flex flex-col items-center justify-center space-y-2">
                        {/* Checkbox - Shows on hover or when selected */}
                        <div
                          className={cn(
                            "absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity",
                            isSelected && "opacity-100"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Actions Menu - Shows on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* File Icon */}
                        <Icon className={cn("h-12 w-12", color)} />

                        {/* File Name */}
                        <p className="text-xs font-medium text-center line-clamp-2 w-full">
                          {file.name}
                        </p>

                        {/* File Size */}
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* List/Table View */}
            {viewMode === "list" && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedFiles.length === files.length &&
                            files.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => {
                      const { icon: Icon, color } = getFileIcon(file.type);
                      const isSelected = selectedFiles.includes(file.id);

                      return (
                        <TableRow
                          key={file.id}
                          className={cn(
                            "cursor-pointer",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleFileSelection(file.id)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Icon className={cn("h-8 w-8", color)} />
                              <span className="font-medium text-sm">
                                {file.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm uppercase text-muted-foreground">
                            {file.type}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {file.created}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
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
      </div>
    </div>
  );
}
