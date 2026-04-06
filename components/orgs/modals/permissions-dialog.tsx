"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { useGlobalAdminPermissions } from "@/hooks/use-org-queries";
import { useUpdateAdminPermissions } from "@/hooks/use-org-member-mutations";
import type { Permission, Administrator } from "@/lib/types/org-members";

interface PermissionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: Administrator | null;
    viewOnly?: boolean;
}

export function PermissionsDialog({
    open,
    onOpenChange,
    admin,
    viewOnly = false,
}: PermissionsDialogProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(
        new Set()
    );
    const { organizationDetails } = useAuthStore();
    const orgId = organizationDetails?.id;

    // Fetch all available permissions
    const { data: permissionsResponse, isLoading } = useGlobalAdminPermissions({
        enabled: open, // Only fetch when dialog is open
    });

    const allPermissions = permissionsResponse?.data || [];

    // Mutation for updating permissions using centralized hook
    const updatePermissionsMutation = useUpdateAdminPermissions();

    // Reset and close dialog on success
    useEffect(() => {
        if (updatePermissionsMutation.isSuccess) {
            onOpenChange(false);
            updatePermissionsMutation.reset();
        }
    }, [updatePermissionsMutation.isSuccess, onOpenChange, updatePermissionsMutation]);

    // Initialize selected permissions based on admin's existing permissions
    useEffect(() => {
        if (admin && admin.permissions) {
            const adminPermissionIds = new Set(admin.permissions.map((p) => p.id));
            setSelectedPermissions(adminPermissionIds);
        } else {
            setSelectedPermissions(new Set());
        }
    }, [admin]);

    const handlePermissionToggle = (permissionId: number) => {
        const newSelected = new Set(selectedPermissions);
        if (newSelected.has(permissionId)) {
            newSelected.delete(permissionId);
        } else {
            newSelected.add(permissionId);
        }
        setSelectedPermissions(newSelected);
    };

    const handleCategoryToggle = (categoryPerms: Permission[]) => {
        const allSelected = categoryPerms.every((p) => selectedPermissions.has(p.id));
        const newSelected = new Set(selectedPermissions);

        if (allSelected) {
            // Deselect all
            categoryPerms.forEach((p) => newSelected.delete(p.id));
        } else {
            // Select all
            categoryPerms.forEach((p) => newSelected.add(p.id));
        }
        setSelectedPermissions(newSelected);
    };

    const handleSave = () => {
        if (!admin || !orgId) return;

        const currentPermissions = new Set(admin.permissions?.map(p => p.id) || []);
        const newPermissions = selectedPermissions;

        // Find permissions to add (in new but not in current)
        const permissionsToAdd = Array.from(newPermissions).filter(
            permissionId => !currentPermissions.has(permissionId)
        );

        // Find permissions to remove (in current but not in new)
        const permissionsToRemove = Array.from(currentPermissions).filter(
            permissionId => !newPermissions.has(permissionId)
        );

        if (permissionsToAdd.length === 0 && permissionsToRemove.length === 0) {
            toast.info("No changes to save");
            onOpenChange(false);
            return;
        }

        if (admin) {
            updatePermissionsMutation.mutate({
                adminId: admin.id,
                permissionsToAdd,
                permissionsToRemove
            });
        }
    };

    // Group permissions by category
    const groupedPermissions = allPermissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>
                        {viewOnly ? "Your Permissions" : "Edit Administrator Permissions"}
                    </DialogTitle>
                    <DialogDescription>
                        {viewOnly
                            ? "View your current permissions for this organization"
                            : `Manage permissions for ${admin?.first_name} ${admin?.last_name} (${admin?.email})`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 min-h-0">
                    <div className="space-y-6 py-4 pr-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            Object.entries(groupedPermissions).map(([category, perms]) => (
                                <div key={category} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold capitalize text-lg tracking-tight">
                                            {category.replace("_", " ")}
                                        </h3>
                                        {perms.length > 1 && (
                                            <div className="flex items-center gap-2">
                                                <Label
                                                    htmlFor={`cat-${category}`}
                                                    className="text-sm text-muted-foreground"
                                                >
                                                    {perms.every((p) =>
                                                        selectedPermissions.has(p.id)
                                                    )
                                                        ? "Deselect All"
                                                        : "Select All"}
                                                </Label>
                                                <Switch
                                                    id={`cat-${category}`}
                                                    checked={perms.every((p) =>
                                                        selectedPermissions.has(p.id)
                                                    )}
                                                    onCheckedChange={() =>
                                                        handleCategoryToggle(perms)
                                                    }
                                                    disabled={viewOnly}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid gap-4 border rounded-lg p-4">
                                        {perms.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="space-y-0.5">
                                                    <Label
                                                        htmlFor={`perm-${permission.id}`}
                                                        className="text-base font-medium"
                                                    >
                                                        {permission.name}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                                <Switch
                                                    id={`perm-${permission.id}`}
                                                    checked={selectedPermissions.has(permission.id)}
                                                    onCheckedChange={() =>
                                                        handlePermissionToggle(permission.id)
                                                    }
                                                    disabled={viewOnly}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6 pt-4">
                    {viewOnly ? (
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={updatePermissionsMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updatePermissionsMutation.isPending}
                                className="flex items-center gap-2"
                            >
                                {updatePermissionsMutation.isPending && (
                                    <Loader className="h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}