"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader, Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";
import { useOrgAdmins } from "@/hooks/use-org-queries";
import { useTransferOwnership } from "@/hooks/use-org-member-mutations";
import type { Administrator } from "@/lib/types/org-members";

interface TransferOwnershipModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransferOwnershipModal({
    open,
    onOpenChange,
}: TransferOwnershipModalProps) {
    const { organizationDetails, user } = useAuthStore();
    const { logout } = useAuth();
    const orgId = organizationDetails?.id?.toString() || "";
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null);

    const transferMutation = useTransferOwnership();
    const isTransferring = transferMutation.isPending;

    const { data: adminsResponse, isLoading } = useOrgAdmins();

    const allAdmins = (adminsResponse?.data as unknown as Administrator[]) || [];

    // Filter out current user
    const eligibleAdmins = allAdmins
        .filter((admin) => admin.email !== user?.email)
        .filter((admin) => {
            if (!searchQuery) return true;
            const fullName = `${admin.first_name} ${admin.last_name}`.toLowerCase();
            return (
                fullName.includes(searchQuery.toLowerCase()) ||
                admin.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });

    const handleTransferClick = () => {
        if (!selectedAdminId) return;

        // Find the selected admin details
        const admin = allAdmins.find(a => a.id.toString() === selectedAdminId);
        if (admin) {
            setSelectedAdmin(admin);
            onOpenChange(false); // Close the selection dialog first
            setShowConfirmation(true); // Then open confirmation dialog
        }
    };

    const handleConfirmTransfer = async () => {
        if (!selectedAdminId) return;

        transferMutation.mutate(Number(selectedAdminId), {
            onSuccess: () => {
                setShowConfirmation(false);
                logout();
            },
            onError: () => {
                setShowConfirmation(false);
                onOpenChange(true);
            }
        });
    };

    const handleClose = () => {
        if (!isTransferring) {
            onOpenChange(false);
            setSelectedAdminId(null);
            setSearchQuery("");
            setSelectedAdmin(null);
        }
    };

    const getInitials = (first: string, last: string) => {
        return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(val) => {
                    if (!isTransferring) {
                        handleClose();
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Transfer Ownership</DialogTitle>
                        <DialogDescription>
                            Select an administrator to transfer ownership to. This action cannot
                            be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search admins..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="border rounded-md">
                            <ScrollArea className="h-[300px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full py-8">
                                        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : eligibleAdmins.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        {searchQuery
                                            ? "No administrators found matching your search"
                                            : "No other administrators found to transfer ownership to"}
                                    </div>
                                ) : (
                                    <RadioGroup
                                        value={selectedAdminId || ""}
                                        onValueChange={setSelectedAdminId}
                                        className="p-2"
                                    >
                                        {eligibleAdmins.map((admin) => (
                                            <Label
                                                key={admin.id}
                                                htmlFor={`admin-${admin.id}`}
                                                className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${selectedAdminId === admin.id.toString()
                                                    ? "bg-muted"
                                                    : ""
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={admin.photo_url || ""} />
                                                        <AvatarFallback>
                                                            {getInitials(admin.first_name, admin.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {admin.first_name} {admin.last_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {admin.email}
                                                        </span>
                                                    </div>
                                                </div>
                                                <RadioGroupItem
                                                    value={admin.id.toString()}
                                                    id={`admin-${admin.id}`}
                                                />
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                )}
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isTransferring}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleTransferClick}
                            disabled={!selectedAdminId || isTransferring}
                        >
                            Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <AlertDialogTitle>Confirm Ownership Transfer</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 pt-2">
                                <p>
                                    You are about to transfer ownership Permissions of <strong>{organizationDetails?.name}</strong> to:
                                </p>
                                {selectedAdmin && (
                                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={selectedAdmin.photo_url || ""} />
                                            <AvatarFallback>
                                                {getInitials(selectedAdmin.first_name, selectedAdmin.last_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">
                                                {selectedAdmin.first_name} {selectedAdmin.last_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {selectedAdmin.email}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
                                    <p className="font-semibold text-destructive">Warning:</p>
                                    <ul className="text-sm space-y-1 list-disc list-inside">
                                        <li>You will lose owner privileges immediately</li>
                                        <li>You will become a regular administrator</li>
                                        <li>This action cannot be undone</li>
                                        <li>You will be logged out after transfer</li>
                                    </ul>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowConfirmation(false);
                                // Reopen selection dialog if user cancels
                                onOpenChange(true);
                            }}
                            disabled={isTransferring}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmTransfer}
                            disabled={isTransferring}
                        >
                            {isTransferring ? (
                                <>
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    Please Wait...
                                </>
                            ) : (
                                "Confirm Transfer"
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
