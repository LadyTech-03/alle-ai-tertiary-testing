import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Check,
  LogOut,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import { TransferOwnershipModal } from "./modals/transfer-ownership-modal";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Message {
  type: "success" | "error" | "";
  text: string;
}

export default function PasswordSecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<Message>({
    type: "",
    text: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ type: "", text: "" });
  };

  const handlePasswordChange = () => {
    if (!formData.currentPassword) {
      setMessage({ type: "error", text: "Please enter your current password" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }

    setMessage({ type: "success", text: "Password changed successfully!" });
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleCancel = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage({ type: "", text: "" });
  };

  const handle2FAToggle = (checked: boolean) => {
    setTwoFactorEnabled(checked);
    setMessage({
      type: "success",
      text: checked
        ? "Two-factor authentication enabled"
        : "Two-factor authentication disabled",
    });
  };

  const handleLogoutAllDevices = () => {
    setMessage({
      type: "success",
      text: "Successfully logged out from all devices",
    });
  };

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  return (
    <div className="p-5 bg-background flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  flex items-center gap-3">
            <Lock className="w-8 h-8" />
            Security
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security settings
          </p>
        </div>


        {/* Danger Zone */}
        <div className="mt-10 pt-10 border-t border-red-200">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold dark:text-red-600 text-red-900">Danger Zone</h2>
          </div>

          <div className="space-y-6">
            {/* Transfer Ownership */}
            <div className="bg-red-50 dark:bg-red-300 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">
                      Transfer Ownership
                    </h3>
                  </div>
                  <p className="text-red-700 text-sm mb-4">
                    Transfer ownership Permission of this organization to another member.
                    You will become a regular admin after the transfer.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className=""
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  <Users className="h-4 w-4" />
                  Transfer
                </Button>
              </div>
            </div>

            {/* Delete Organization */}
            {/* <div className="bg-red-50 dark:bg-red-300 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">
                      Delete Organization
                    </h3>
                  </div>
                  <p className="text-red-700 text-sm mb-4">
                    Permanently delete this organization and all associated
                    data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="ml-4 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Organization
                </Button>
              </div>
            </div> */}
          </div>
        </div>

        <TransferOwnershipModal
          open={isTransferModalOpen}
          onOpenChange={setIsTransferModalOpen}
        />
      </div>
    </div>
  );
}
