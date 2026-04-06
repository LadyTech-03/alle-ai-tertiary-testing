"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal, Edit, UserX, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrgAdmins } from "@/hooks/use-org-queries";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { queryKeys } from "@/lib/query/queryKeys";
import { useAuthStore } from "@/stores";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  PermissionsDialog,
} from "./modals/permissions-dialog";
import { type Administrator } from "@/lib/types/org-members";
import { useRevokeAdmin } from "@/hooks/use-org-member-mutations";

export default function AdministratorsTable() {
  const { organizationDetails, user, } = useAuthStore();
  const orgId = organizationDetails?.id?.toString() || "";
  const currentUserId = user?.id;

  const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [adminToRevoke, setAdminToRevoke] = useState<Administrator | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const canAssignRoles = organizationDetails?.is_owner || organizationDetails?.user_permissions?.includes("assign_roles");

  // Fetch Admins using centralized hook
  const { data: adminsResponse, isLoading } = useOrgAdmins();

  const allAdmins = (adminsResponse?.data as unknown as Administrator[]) || [];

  // Sort admins to put current user first
  const admins = [...allAdmins].sort((a, b) => {
    const aIsCurrentUser = a.email === user?.email;
    const bIsCurrentUser = b.email === user?.email;
    if (aIsCurrentUser) return -1;
    if (bIsCurrentUser) return 1;
    return 0;
  });

  // Mutation for revoking admin access using centralized hook
  const revokeAccessMutation = useRevokeAdmin();

  const handleEditPermissions = (admin: Administrator) => {
    setSelectedAdmin(admin);
    setIsPermissionsDialogOpen(true);
  };

  const handleRevokeAccess = (admin: Administrator) => {
    setAdminToRevoke(admin);
    setIsRevokeDialogOpen(true);
  };

  const confirmRevokeAccess = () => {
    if (adminToRevoke) {
      revokeAccessMutation.mutate(adminToRevoke.id, {
        onSuccess: () => {
          setIsRevokeDialogOpen(false);
          setAdminToRevoke(null);
        },
      });
    }
  };

  const truncateEmail = (email: string, maxLength: number = 24) => {
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength - 3) + "...";
  };

  const getInitials = (first: string, last: string) => {
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <>
      <Card className="p-6 bg-background border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Organization Administrators
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage administrators and their permissions for your organization
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Note: You can view your own permissions but cannot edit them
          </p>
        </div>
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-semibold text-black dark:text-white">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-black dark:text-white">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-black dark:text-white">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-black dark:text-white w-[80px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No administrators found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => {
                  const isOwner =
                    admin.email === organizationDetails?.owner_email;
                  const roleLabel = isOwner ? "Owner" : "Admin";
                  const badgeVariant = isOwner ? "destructive" : "default";

                  return (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={admin.photo_url || ""} />
                            <AvatarFallback>
                              {getInitials(
                                admin.first_name,
                                admin.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-muted-foreground">
                            {admin.first_name} {admin.last_name}
                            {admin.email === user?.email && (
                              <span className="text-primary font-semibold"> (You)</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {truncateEmail(admin.email)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant}>{roleLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        {admin.email === user?.email ? (
                          // Current user - show view-only option
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              className="bg-sideBarBackground"
                              align="end"
                            >
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleEditPermissions(admin);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                View Your Permissions
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          // Other admins - show full options
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isOwner}>
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      className="bg-sideBarBackground"
                                      align="end"
                                    >
                                      {/* Edit Permissions - always show, but disable if no permission */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div>
                                              <DropdownMenuItem
                                                onSelect={(e) => {
                                                  if (!canAssignRoles) {
                                                    e.preventDefault();
                                                    return;
                                                  }
                                                  e.preventDefault();
                                                  handleEditPermissions(admin);
                                                }}
                                                disabled={!canAssignRoles}
                                                className="flex items-center gap-2"
                                              >
                                                <Edit className="h-4 w-4" />
                                                Edit Permissions
                                              </DropdownMenuItem>
                                            </div>
                                          </TooltipTrigger>
                                          {!canAssignRoles && (
                                            <TooltipContent>
                                              <p>{`You don't have permission to assign roles. Contact your administrator.`}</p>
                                            </TooltipContent>
                                          )}
                                        </Tooltip>
                                      </TooltipProvider>

                                      {/* Revoke Access - only for owners, and not for other owners */}
                                      {organizationDetails?.is_owner && !isOwner && (
                                        <DropdownMenuItem
                                          onSelect={(e) => {
                                            e.preventDefault();
                                            handleRevokeAccess(admin);
                                          }}
                                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                                        >
                                          <UserX className="h-4 w-4" />
                                          Revoke Access
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TooltipTrigger>
                              {isOwner && (
                                <TooltipContent>
                                  <p>Owner permissions cannot be modified</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Edit Permissions Dialog */}
      <PermissionsDialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        admin={selectedAdmin}
        viewOnly={selectedAdmin?.email === user?.email}
      />

      {/* Revoke Access Confirmation Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Admin Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke admin access for{" "}
              <span className="font-semibold">
                {adminToRevoke?.first_name} {adminToRevoke?.last_name}
              </span>?
              <br />
              <br />
              This user will become a regular member of the organization and will
              lose all administrative permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsRevokeDialogOpen(false)}
              disabled={revokeAccessMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevokeAccess}
              disabled={revokeAccessMutation.isPending}
              className="flex items-center gap-2"
            >
              {revokeAccessMutation.isPending && (
                <Loader className="h-4 w-4 animate-spin" />
              )}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}