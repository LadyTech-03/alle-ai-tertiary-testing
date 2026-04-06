"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Copy, Check, User, Key, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUpdateSystemUser,
  useUpdateDeviceVerificationCode,
  useSystemUser,
} from "@/hooks/use-org-course";

export default function ConfigurationsPage() {
  const { data: systemUserData, isLoading } = useSystemUser();
  const systemUser = systemUserData?.data;

  // Verification Code State
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [isChangeCodeOpen, setIsChangeCodeOpen] = useState(false);

  // Copy State
  const [copiedCode, setCopiedCode] = useState(false);

  // Edit User Dialog State
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
  });

  // Change Code Dialog State
  const [newCode, setNewCode] = useState("");
  const [generateMode, setGenerateMode] = useState<"auto" | "manual">("auto");

  // Mutations
  const updateSystemUserMutation = useUpdateSystemUser();
  const updateVerificationCodeMutation = useUpdateDeviceVerificationCode();

  // Initialize edit form when dialog opens
  const handleOpenEditUser = () => {
    if (systemUser) {
      setEditForm({
        email: systemUser.email,
        first_name: systemUser.first_name,
        last_name: systemUser.last_name,
      });
    }
    setIsEditUserOpen(true);
  };

  // Copy to Clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle Edit User
  const handleEditUser = () => {
    updateSystemUserMutation.mutate(
      {
        email: editForm.email || undefined,
        first_name: editForm.first_name || undefined,
        last_name: editForm.last_name || undefined,
      },
      {
        onSuccess: () => {
          setIsEditUserOpen(false);
        },
      }
    );
  };

  // Handle Change Verification Code
  const handleChangeCode = () => {
    updateVerificationCodeMutation.mutate(newCode, {
      onSuccess: () => {
        setNewCode("");
        setIsChangeCodeOpen(false);
      },
    });
  };

  // Generate Random Code (6 digits)
  const generateRandomCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setNewCode(randomCode);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="border-t" />

        {/* System User Credentials Card Skeleton */}
        <Card className="bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 text-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-9 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Device Verification Code Card Skeleton */}
        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          System Configurations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system user credentials and device verification codes
        </p>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* System User Credentials Card */}
      <Card className="bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            System User Credentials
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleOpenEditUser}>
            Edit Credentials
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                First Name
              </Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md border text-sm">
                {systemUser?.first_name}
              </div>
            </div>
            {/* Last Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Last Name
              </Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md border text-sm">
                {systemUser?.last_name}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Email Address
            </Label>
            <div className="px-3 py-2 bg-muted/50 rounded-md border text-sm">
              {systemUser?.email}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Verification Code Card */}
      <Card className="bg-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Device Verification Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="text-sm font-medium">
              Verification Code
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="verification-code"
                  type={showVerificationCode ? "text" : "password"}
                  value={systemUser?.device_verification_code || ""}
                  readOnly
                  placeholder="No code set. Set a code to connect devices"
                  className="bg-muted/50 cursor-not-allowed pr-10 font-mono"
                />
                {systemUser?.device_verification_code && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() =>
                      setShowVerificationCode(!showVerificationCode)
                    }
                  >
                    {showVerificationCode ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={!systemUser?.device_verification_code}
                onClick={() => copyToClipboard(systemUser?.device_verification_code || "")}
                className="flex-shrink-0"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => setIsChangeCodeOpen(true)}
                className="flex-shrink-0 min-w-32"
              >
                {systemUser?.device_verification_code ? "Change Code" : "Set Code"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This code is used by devices to authenticate and connect to the
              system
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit System Credentials</DialogTitle>
            <DialogDescription>
              Update the system user's email and name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={
                updateSystemUserMutation.isPending ||
                !editForm.email ||
                !editForm.first_name ||
                !editForm.last_name
              }
            >
              {updateSystemUserMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Verification Code Dialog */}
      <Dialog open={isChangeCodeOpen} onOpenChange={setIsChangeCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {systemUser?.device_verification_code ? "Change Verification Code" : "Set Verification Code"}
            </DialogTitle>
            <DialogDescription>
              {systemUser?.device_verification_code
                ? "Generate a new verification code or enter a custom one. This will affect all connected devices."
                : "Enter a 6-digit verification code to allow devices to connect to this organization."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setGenerateMode("auto")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  generateMode === "auto"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50 text-muted-foreground"
                )}
              >
                Auto Generate
              </button>
              <button
                onClick={() => setGenerateMode("manual")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  generateMode === "manual"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50 text-muted-foreground"
                )}
              >
                Manual Input
              </button>
            </div>

            {/* Auto Generate Mode */}
            {generateMode === "auto" && (
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Preview of new code:
                  </p>
                  <p className="font-mono text-sm font-medium">
                    {newCode || "Click generate to preview"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={generateRandomCode}
                  className="w-full"
                >
                  Generate New Code
                </Button>
              </div>
            )}

            {/* Manual Input Mode */}
            {generateMode === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="manual-code">Custom Verification Code</Label>
                <Input
                  id="manual-code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Enter custom verification code"
                  className="font-mono"
                />
              </div>
            )}

            {/* Warning */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-400">
                ⚠️ Changing the verification code will require all devices to
                re-authenticate with the new code.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeCodeOpen(false);
                setNewCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeCode}
              disabled={!newCode || updateVerificationCodeMutation.isPending}
            >
              {updateVerificationCodeMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                systemUser?.device_verification_code ? "Confirm Change" : "Set Verification Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
