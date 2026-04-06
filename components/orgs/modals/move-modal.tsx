import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import CreateGroups from "./create-groups";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Search,
  Loader,
  FolderRoot,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrgMemberSelectionStore, Member, Group } from "@/stores/edu-store";
import Image from "next/image";
import { queryKeys } from "@/lib/query/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { useAuthStore } from "@/stores";
import { useMoveItems } from "@/hooks/use-org-member-mutations";
import { useOrgMemberStore } from "@/stores/edu-store";

interface TreeNodeData {
  id: number;
  name: string;
  path: string;
  children: TreeNodeData[];
  isRoot?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

interface TreeNodeProps {
  node: TreeNodeData;
  level?: number;
  activeTab?: "students" | "faculty";
  onSelect: (node: TreeNodeData) => void;
  selectedPath?: string;
  expandedNodes: Set<string>;
  onToggleExpand: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level = 0,
  onSelect,
  selectedPath,
  expandedNodes,
  onToggleExpand,
  activeTab,
}) => {
  const isOpen = expandedNodes.has(node.path);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;
  const isInvalid = node.disabled || false;

  // Separate handlers for expansion vs selection
  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.path);
    }
  };

  const handleRowClick = () => {
    if (isInvalid) return; // Don't select if invalid
    onSelect(node);
  };

  const nodeContent = (
    <div
      className="flex items-center"
      style={{ paddingLeft: `${level * 20}px` }}
    >
      {hasChildren ? (
        <span
          className="mr-1 text-gray-600 cursor-pointer hover:text-gray-900"
          onClick={handleChevronClick}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      ) : (
        <span className="w-5" />
      )}
      {node.isRoot ? (
        <FolderRoot
          className={`w-4 h-4 mr-2 ${activeTab === "students" ? "text-blue-600" : "text-purple-600"
            }`}
        />
      ) : (
        <Folder
          className={`w-4 h-4 mr-2 ${activeTab === "students" ? "text-blue-600" : "text-purple-600"
            }`}
        />
      )}
      <span className="text-sm font-medium">{node.name}</span>
    </div>
  );

  // Wrap in tooltip if invalid
  const wrappedContent =
    isInvalid && node.disabledReason ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            <p className="text-xs">{node.disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      nodeContent
    );

  return (
    <>
      <TableRow
        className={`
          ${isInvalid ? "opacity-50" : "cursor-pointer hover:bg-accent/50"}
          ${isSelected && !isInvalid ? "bg-accent" : ""}
        `}
        onClick={handleRowClick}
      >
        <TableCell>{wrappedContent}</TableCell>
      </TableRow>
      {isOpen &&
        hasChildren &&
        node.children.map((child, idx) => (
          <TreeNode
            key={idx}
            node={child}
            level={level + 1}
            onSelect={onSelect}
            selectedPath={selectedPath}
            expandedNodes={expandedNodes}
            onToggleExpand={onToggleExpand}
            activeTab={activeTab}
          />
        ))}
    </>
  );
};

interface MoveItemsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveSuccess?: (
    user_ids: number[],
    group_ids: number[],
    newPath: Array<{ name: string; id: number | null }>
  ) => void;
}

export default function MoveItemsModal({
  isOpen,
  onOpenChange,
  onMoveSuccess,
}: MoveItemsModalProps) {
  const [activeTab, setActiveTab] = useState<"students" | "faculty">(
    "students"
  );
  const [selectedFolder, setSelectedFolder] = useState<TreeNodeData | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["/root"])
  );
  const [createInSelected, setCreateInSelected] = useState<boolean>(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const { getSelectionMetadata, clearSelection } = useOrgMemberSelectionStore();
  const metadata = getSelectionMetadata();
  const { organizationDetails } = useAuthStore();
  const { breadcrumbPath } = useOrgMemberStore();

  const getSelectedSeatType = (): "student" | "faculty" | null => {
    const { selectedData } = metadata;
    if (selectedData.length === 0) return null;
    const firstItem = selectedData[0].data;
    return firstItem.seat_type === "student" ? "student" : "faculty";
  };

  const selectedSeatType = getSelectedSeatType();

  useEffect(() => {
    if (selectedSeatType && isOpen) {
      setActiveTab(selectedSeatType === "student" ? "students" : "faculty");
    }
  }, [selectedSeatType, isOpen]);

  const isTabDisabled = (tab: "students" | "faculty") => {
    if (!selectedSeatType) return false;
    const requiredTab = selectedSeatType === "student" ? "students" : "faculty";
    return tab !== requiredTab;
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedFolder(null);
      setSearchQuery("");
      setExpandedNodes(new Set(["/root"]));
      setCreateInSelected(true);
    }
  }, [isOpen]);

  const {
    data: groupsData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.organisationGroups(
      organizationDetails!.id.toString(),
      activeTab === "students" ? "student" : "faculty"
    ),
    queryFn: () =>
      orgMemberApi.getOrgRootFoldersByType(
        organizationDetails!.id,
        activeTab === "students" ? "student" : "faculty"
      ),
    enabled: !!organizationDetails?.id && isOpen,
    staleTime: 0,
    refetchOnMount: true,
  });

  const moveItemsMutation = useMoveItems(organizationDetails!.id.toString());

  // Get selected group IDs and current parent
  const selectedGroupIds = metadata.selectedData
    .filter((item) => item.type === "group")
    .map((item) => (item.data as Group).id);

  const currentParentId =
    breadcrumbPath.length > 1
      ? breadcrumbPath[breadcrumbPath.length - 1].id
      : null;

  // We're at root when breadcrumbPath.length === 1 (inside root folder like "Students" or "Faculty")
  const isAtRoot =
    breadcrumbPath.length === 1 && breadcrumbPath[0]?.parent_id === null;

  const treeData = React.useMemo(() => {
    if (!groupsData) return [];

    // Transform API response to tree nodes
    const transformToTreeNodes = (groups: any[]): TreeNodeData[] => {
      if (!groups || groups.length === 0) return [];
      return groups.map((group) => ({
        name: group.name,
        path: `/${group.id}`,
        id: group.id,
        children: group.children ? transformToTreeNodes(group.children) : [],
      }));
    };

    // Helper: Recursively collect all descendant IDs from selected groups
    const getAllDescendantIds = (
      selectedIds: number[],
      nodes: TreeNodeData[]
    ): Set<number> => {
      const descendants = new Set<number>();

      const collectDescendants = (node: TreeNodeData) => {
        if (!node.isRoot) {
          descendants.add(node.id);
        }
        node.children.forEach((child) => collectDescendants(child));
      };

      const findAndCollect = (nodes: TreeNodeData[]) => {
        for (const node of nodes) {
          if (selectedIds.includes(node.id)) {
            // Found a selected group, collect all its descendants
            node.children.forEach((child) => collectDescendants(child));
          }
          if (node.children.length > 0) {
            findAndCollect(node.children);
          }
        }
      };

      findAndCollect(nodes);
      return descendants;
    };

    // Process tree: filter out selected groups and mark invalid nodes
    const processTreeData = (
      nodes: TreeNodeData[],
      selectedIds: number[],
      currentParent: number | null,
      atRoot: boolean
    ): TreeNodeData[] => {
      // First, collect all descendant IDs of selected groups
      const descendantIds = getAllDescendantIds(selectedIds, nodes);

      const processNodes = (nodeList: TreeNodeData[]): TreeNodeData[] => {
        return nodeList
          .filter((node) => {
            // Always keep root node
            if (node.isRoot) return true;
            // Filter out selected groups themselves
            return !selectedIds.includes(node.id);
          })
          .map((node) => {
            let disabled = false;
            let disabledReason = "";

            // Check if this node is an invalid destination
            const hasGroupsSelected = selectedIds.length > 0;

            if (hasGroupsSelected) {
              if (node.isRoot && atRoot) {
                disabled = true;
                disabledReason = `At least one group is already in root ${activeTab}`;
              } else if (!node.isRoot && node.id === currentParent) {
                disabled = true;
                disabledReason = "At least one group is already in this folder";
              } else if (!node.isRoot && descendantIds.has(node.id)) {
                disabled = true;
                disabledReason = "Cannot move a group into its own subgroup";
              }
            }

            return {
              ...node,
              disabled,
              disabledReason,
              children:
                node.children.length > 0 ? processNodes(node.children) : [],
            };
          });
      };

      return processNodes(nodes);
    };

    const actualGroups = transformToTreeNodes(groupsData);
    const rootNode: TreeNodeData = {
      id: -1,
      name: `Root ${activeTab === "students" ? "Students" : "Faculty"}`,
      path: "/root",
      children: actualGroups,
      isRoot: true,
    };

    let processedTree = processTreeData(
      [rootNode],
      selectedGroupIds,
      currentParentId,
      isAtRoot
    );

    // Apply search filtering if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filterNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
        return nodes.reduce<TreeNodeData[]>((acc, node) => {
          const matches = node.name.toLowerCase().includes(query);
          const filteredChildren = filterNodes(node.children);

          // Keep node if it matches OR has matching children OR is root
          if (matches || filteredChildren.length > 0 || node.isRoot) {
            acc.push({
              ...node,
              children: filteredChildren,
            });
          }
          return acc;
        }, []);
      };

      processedTree = filterNodes(processedTree);
    }

    return processedTree;
  }, [
    groupsData,
    activeTab,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(selectedGroupIds),
    currentParentId,
    isAtRoot,
    searchQuery,
  ]);

  // Effect to auto-expand nodes when searching
  useEffect(() => {
    if (searchQuery.trim() && treeData.length > 0) {
      const getAllPaths = (nodes: TreeNodeData[]): string[] => {
        let paths: string[] = [];
        nodes.forEach((node) => {
          paths.push(node.path);
          if (node.children.length > 0) {
            paths = [...paths, ...getAllPaths(node.children)];
          }
        });
        return paths;
      };
      const allPaths = getAllPaths(treeData);
      setExpandedNodes(new Set(allPaths));
    } else if (!searchQuery.trim()) {
      setExpandedNodes(new Set(["/root"]));
    }
  }, [searchQuery, treeData]);

  const handleToggleExpand = (path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleTabChange = (tab: "students" | "faculty") => {
    if (isTabDisabled(tab)) return;
    setActiveTab(tab);
    setSelectedFolder(null);
    setCreateInSelected(true);
    setExpandedNodes(new Set(["/root"]));
    setSearchQuery("");
  };

  const getBreadcrumbPath = () => {
    if (!selectedFolder) return [activeTab];
    if (selectedFolder.isRoot) return [activeTab];

    const buildFullPath = (
      nodes: TreeNodeData[],
      targetPath: string,
      currentPath: string[] = []
    ): string[] | null => {
      for (const node of nodes) {
        if (node.isRoot) {
          const found = buildFullPath(node.children, targetPath, currentPath);
          if (found) return found;
          continue;
        }
        const newPath = [...currentPath, node.name];
        if (node.path === targetPath) return newPath;
        if (node.children.length > 0) {
          const found = buildFullPath(node.children, targetPath, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    const folderPath = buildFullPath(treeData, selectedFolder.path);
    if (folderPath) return [activeTab, ...folderPath];
    return [activeTab, selectedFolder.name];
  };

  const getSelectedFolderPathObjects = () => {
    const rootName = activeTab === "students" ? "Students" : "Faculty";
    const rootItem = { name: rootName, id: null as number | null };

    if (!selectedFolder || selectedFolder.isRoot) return [rootItem];

    const findPath = (
      nodes: TreeNodeData[],
      targetPath: string,
      currentPath: Array<{ name: string; id: number | null }> = []
    ): Array<{ name: string; id: number | null }> | null => {
      for (const node of nodes) {
        if (node.isRoot) {
          const found = findPath(node.children, targetPath, currentPath);
          if (found) return found;
          continue;
        }
        const newPath = [...currentPath, { name: node.name, id: node.id }];
        if (node.path === targetPath) return newPath;
        if (node.children.length > 0) {
          const found = findPath(node.children, targetPath, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    const folderPath = findPath(treeData, selectedFolder.path);
    if (folderPath) return [rootItem, ...folderPath];
    return [rootItem, { name: selectedFolder.name, id: selectedFolder.id }];
  };

  const getDisplayBreadcrumb = () => {
    const fullPath = getBreadcrumbPath();
    if (fullPath.length <= 4) return fullPath;
    return [fullPath[0], "...", ...fullPath.slice(-2)];
  };

  const getMoveTitle = () => {
    const { totalSelected, membersCount, groupsCount, isMixed } = metadata;
    if (isMixed) {
      return `Move ${membersCount} ${membersCount === 1 ? "member" : "members"
        } and ${groupsCount} ${groupsCount === 1 ? "group" : "groups"}`;
    }
    if (membersCount > 0) {
      return `Move ${membersCount} ${membersCount === 1 ? "member" : "members"
        }`;
    }
    if (groupsCount > 0) {
      return `Move ${groupsCount} ${groupsCount === 1 ? "group" : "groups"}`;
    }
    return "Move items";
  };

  const handleMove = () => {
    const { selectedData } = metadata;
    const user_ids = selectedData
      .filter((item) => item.type === "member")
      .map((item) => (item.data as Member).id);
    const group_ids = selectedData
      .filter((item) => item.type === "group")
      .map((item) => (item.data as Group).id);
    const sourceGroupId =
      breadcrumbPath.length > 0
        ? breadcrumbPath[breadcrumbPath.length - 1].id
        : null;
    const parent_id =
      selectedFolder?.id === -1 ? null : selectedFolder?.id ?? null;

    moveItemsMutation.mutate(
      {
        parent_id,
        user_ids,
        group_ids,
        seatType: activeTab === "students" ? "student" : "faculty",
        sourceGroupId,
      },
      {
        onSuccess: () => {
          if (onMoveSuccess) {
            onMoveSuccess(user_ids, group_ids, getSelectedFolderPathObjects());
          }
          clearSelection();
          onOpenChange(false);
        },
      }
    );
  };

  const handleCreateGroupClose = () => {
    setIsCreateGroupOpen(false);
    // Invalidate to refresh tree
    queryClient.invalidateQueries({
      queryKey: queryKeys.organisationGroups(
        organizationDetails!.id.toString(),
        activeTab === "students" ? "student" : "faculty"
      ),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Move Items</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-40 md:w-48 border-r bg-muted/30 p-3 md:p-4 flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleTabChange("students")}
                    className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all ${isTabDisabled("students")
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                      } ${activeTab === "students"
                        ? "bg-secondary text-secondary-foreground border-2 border-border"
                        : "bg-background border-2 border-border hover:bg-accent/50"
                      }`}
                  >
                    <Image
                      alt="students"
                      height={30}
                      width={30}
                      src={"/svgs/student_svg.svg"}
                    />
                    <span className="text-xs md:text-sm font-medium">
                      Students
                    </span>
                  </div>
                </TooltipTrigger>
                {isTabDisabled("students") && (
                  <TooltipContent side="bottom" align="center">
                    <p className="text-xs">
                      Cannot move faculty items to student groups
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleTabChange("faculty")}
                    className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all ${isTabDisabled("faculty")
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                      } ${activeTab === "faculty"
                        ? "bg-secondary text-secondary-foreground border-2 border-border"
                        : "bg-background border-2 border-border hover:bg-accent/50"
                      }`}
                  >
                    <Image
                      alt="faculty"
                      height={30}
                      width={30}
                      src={"/svgs/faculty_svg.svg"}
                    />
                    <span className="text-xs md:text-sm font-medium">
                      Faculty
                    </span>
                  </div>
                </TooltipTrigger>
                {isTabDisabled("faculty") && (
                  <TooltipContent side="bottom" align="center">
                    <p className="text-xs">
                      Cannot move student items to faculty groups
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
            <div className="mb-4 flex items-center mt-4 gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                {getMoveTitle()}
              </h3>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 border rounded-lg bg-background overflow-hidden flex flex-col min-h-0 mb-4">
              <div className="border-b">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-muted/50 z-10">
                        Name
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <ScrollArea className="flex-1 relative">
                {isFetching && !isLoading && (
                  <div className="absolute top-2 right-2 z-20">
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                <Table>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div
                              className="flex items-center"
                              style={{ paddingLeft: `${(index % 3) * 20}px` }}
                            >
                              <Skeleton className="w-5 h-5 mr-2" />
                              <Skeleton className="w-4 h-4 mr-2" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : treeData.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground py-8">
                          No groups found
                        </TableCell>
                      </TableRow>
                    ) : (
                      treeData.map((node) => (
                        <TreeNode
                          key={node.id}
                          node={node}
                          level={0}
                          onSelect={setSelectedFolder}
                          selectedPath={selectedFolder?.path}
                          expandedNodes={expandedNodes}
                          onToggleExpand={handleToggleExpand}
                          activeTab={activeTab}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="p-3 md:p-4">
                <div className="text-sm font-semibold text-foreground mb-2">
                  Destination
                </div>
                <div className="flex items-center text-sm text-muted-foreground flex-wrap">
                  {getDisplayBreadcrumb().map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span className="capitalize">{part}</span>
                      {index < arr.length - 1 && (
                        <ChevronRight className="w-4 h-4 mx-1" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="border-t px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="text-sm w-fit"
              onClick={() => setIsCreateGroupOpen(true)}
            >
              New Group
            </Button>
            {selectedFolder && !selectedFolder.isRoot && (
              <div className="flex items-center gap-2 text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={createInSelected}
                          onCheckedChange={setCreateInSelected}
                          id="create-in-folder"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center">
                      <p className="text-xs">
                        {createInSelected
                          ? `When enabled, new groups are created inside "${selectedFolder.name}" (${activeTab})`
                          : `When disabled, new groups are created in the root folder (${activeTab})`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              disabled={
                !selectedFolder ||
                selectedFolder.disabled ||
                moveItemsMutation.isPending
              }
              onClick={handleMove}
              className="text-sm flex-1 sm:flex-none"
            >
              {moveItemsMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Move"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      <CreateGroups
        isOpen={isCreateGroupOpen}
        onClose={handleCreateGroupClose}
        parentFolderId={
          createInSelected && selectedFolder && !selectedFolder.isRoot
            ? selectedFolder.id
            : null
        }
        seatType={activeTab}
      />
    </Dialog>
  );
}
