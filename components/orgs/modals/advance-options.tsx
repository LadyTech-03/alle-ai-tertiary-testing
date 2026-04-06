"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Users,
  Edit3,
  GitMerge,
  Shield,
  BarChart3,
  Trash2,
  Archive,
  UserCheck,
  Settings,
  ChevronRight,
  AlertTriangle,
  Plus,
  Minus,
  Check,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addMonths, addYears } from "date-fns";

// Types
interface SelectedGroup {
  id: string;
  name: string;
  memberCount: number;
  subscriptionEnds: string;
  admin: string;
  currentSeats: number;
}

interface SelectedUser {
  id: string;
  name: string;
  email: string;
}

interface AdvancedOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  selectionType: "groups-only" | "mixed-selection";
  selectedGroups: SelectedGroup[];
  selectedUsers?: SelectedUser[];
  onAction: (action: string, data: any) => void;
}

type ActionType =
  | "extend-subscriptions"
  | "allocate-seats"
  | "rename-groups"
  | "merge-groups"
  | "change-permissions"
  | "assign-admin"
  | "generate-reports"
  | "archive-groups"
  | "delete-groups";

export default function AdvancedOptions({
  isOpen,
  onClose,
  selectionType,
  selectedGroups,
  selectedUsers = [],
  onAction,
}: AdvancedOptionsProps) {
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [loading, setLoading] = useState(false);

  // Action-specific states
  const [subscriptionData, setSubscriptionData] = useState({
    extensionType: "months",
    duration: 3,
    applyToAll: true,
    customDates: {} as Record<string, string>,
  });

  const [seatsData, setSeatsData] = useState({
    allocationType: "uniform",
    uniformSeats: 10,
    customSeats: {} as Record<string, number>,
  });

  const [renameData, setRenameData] = useState({
    prefix: "",
    suffix: "",
    customNames: {} as Record<string, string>,
  });

  const [mergeData, setMergeData] = useState({
    targetGroupName: "",
    deleteOriginal: true,
    newAdmin: "",
  });

  const [permissionsData, setPermissionsData] = useState({
    permissions: {
      canCreateSubGroups: false,
      canInviteMembers: false,
      canManageSubscriptions: false,
      canViewReports: false,
      canExportData: false,
    },
    applyToAll: true,
  });

  const [adminData, setAdminData] = useState({
    newAdminEmail: "",
    transferOwnership: false,
    notifyCurrentAdmin: true,
  });

  const [reportData, setReportData] = useState({
    reportType: "usage",
    includeUsageDetails: true,
    includeSubscriptionInfo: true,
    includeMemberActivity: true,
    format: "pdf",
    dateRange: "last-30-days",
  });

  const [archiveData, setArchiveData] = useState({
    reason: "",
    notifyMembers: true,
    retentionPeriod: "90-days",
  });

  // Helper functions
  const handleActionClick = (action: ActionType) => {
    setCurrentAction(action);
  };

  const handleBack = () => {
    setCurrentAction(null);
  };

  const handleExecuteAction = async () => {
    setLoading(true);

    try {
      let actionData;

      switch (currentAction) {
        case "extend-subscriptions":
          actionData = subscriptionData;
          break;
        case "allocate-seats":
          actionData = seatsData;
          break;
        case "rename-groups":
          actionData = renameData;
          break;
        case "merge-groups":
          actionData = mergeData;
          break;
        case "change-permissions":
          actionData = permissionsData;
          break;
        case "assign-admin":
          actionData = adminData;
          break;
        case "generate-reports":
          actionData = reportData;
          break;
        case "archive-groups":
          actionData = archiveData;
          break;
        case "delete-groups":
          actionData = { confirmed: true };
          break;
        default:
          actionData = {};
      }

      await onAction(currentAction!, {
        ...actionData,
        selectedGroups,
        selectedUsers,
      });

      onClose();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Main action menu
  const renderMainMenu = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {/* Subscription Management */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("extend-subscriptions")}
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium">Extend Subscriptions</div>
              <div className="text-xs text-gray-500">
                Bulk extend subscription periods
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Seat Allocation */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("allocate-seats")}
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium">Allocate More Seats</div>
              <div className="text-xs text-gray-500">
                Increase seat limits for groups
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Rename Groups */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("rename-groups")}
        >
          <div className="flex items-center gap-3">
            <Edit3 className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-medium">Rename Groups</div>
              <div className="text-xs text-gray-500">
                Batch rename selected groups
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Merge Groups */}
        {selectedGroups.length > 1 && (
          <Button
            variant="ghost"
            className="justify-between h-auto p-4 text-left"
            onClick={() => handleActionClick("merge-groups")}
          >
            <div className="flex items-center gap-3">
              <GitMerge className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium">Merge Groups</div>
                <div className="text-xs text-gray-500">
                  Combine multiple groups into one
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Change Permissions */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("change-permissions")}
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-600" />
            <div>
              <div className="font-medium">Change Permissions</div>
              <div className="text-xs text-gray-500">
                Bulk update group permissions
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Assign New Admin */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("assign-admin")}
        >
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-cyan-600" />
            <div>
              <div className="font-medium">Assign New Admin</div>
              <div className="text-xs text-gray-500">
                Change group administrators
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Generate Reports */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("generate-reports")}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="font-medium">Generate Reports</div>
              <div className="text-xs text-gray-500">
                Create detailed group analytics
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Separator className="my-2" />

        {/* Archive Groups */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left"
          onClick={() => handleActionClick("archive-groups")}
        >
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="font-medium">Archive Groups</div>
              <div className="text-xs text-gray-500">
                Archive selected groups temporarily
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Delete Groups */}
        <Button
          variant="ghost"
          className="justify-between h-auto p-4 text-left text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleActionClick("delete-groups")}
        >
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5" />
            <div>
              <div className="font-medium">Delete Groups</div>
              <div className="text-xs text-red-500">
                Permanently delete selected groups
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Extend Subscriptions Form
  const renderExtendSubscriptions = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Extension Type</Label>
          <Select
            value={subscriptionData.extensionType}
            onValueChange={(value) =>
              setSubscriptionData((prev) => ({ ...prev, extensionType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
              <SelectItem value="custom">Custom Dates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {subscriptionData.extensionType !== "custom" && (
          <div>
            <Label className="text-sm font-medium">
              Duration ({subscriptionData.extensionType})
            </Label>
            <Input
              type="number"
              min="1"
              max={subscriptionData.extensionType === "months" ? 24 : 5}
              value={subscriptionData.duration}
              onChange={(e) =>
                setSubscriptionData((prev) => ({
                  ...prev,
                  duration: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            checked={subscriptionData.applyToAll}
            onCheckedChange={(checked) =>
              setSubscriptionData((prev) => ({ ...prev, applyToAll: checked }))
            }
          />
          <Label className="text-sm">Apply same extension to all groups</Label>
        </div>

        {!subscriptionData.applyToAll && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Extensions</Label>
            {selectedGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <span className="text-sm min-w-[120px]">{group.name}</span>
                <Input
                  type="number"
                  min="1"
                  placeholder="Duration"
                  className="flex-1"
                  onChange={(e) =>
                    setSubscriptionData((prev) => ({
                      ...prev,
                      customDates: {
                        ...prev.customDates,
                        [group.id]: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Preview:</strong> Extending {selectedGroups.length} group
          {selectedGroups.length > 1 ? "s" : ""} by {subscriptionData.duration}{" "}
          {subscriptionData.extensionType}
        </div>
      </div>
    </div>
  );

  // Allocate Seats Form
  const renderAllocateSeats = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Allocation Method</Label>
          <Select
            value={seatsData.allocationType}
            onValueChange={(value) =>
              setSeatsData((prev) => ({ ...prev, allocationType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uniform">Same for all groups</SelectItem>
              <SelectItem value="custom">Custom per group</SelectItem>
              <SelectItem value="percentage">Percentage increase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {seatsData.allocationType === "uniform" && (
          <div>
            <Label className="text-sm font-medium">Additional Seats</Label>
            <Input
              type="number"
              min="1"
              value={seatsData.uniformSeats}
              onChange={(e) =>
                setSeatsData((prev) => ({
                  ...prev,
                  uniformSeats: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>
        )}

        {seatsData.allocationType === "custom" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Custom Seat Allocation
            </Label>
            {selectedGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <span className="text-sm min-w-[120px]">{group.name}</span>
                <span className="text-xs text-gray-500 min-w-[80px]">
                  Current: {group.currentSeats}
                </span>
                <Input
                  type="number"
                  min="1"
                  placeholder="Add seats"
                  className="flex-1"
                  onChange={(e) =>
                    setSeatsData((prev) => ({
                      ...prev,
                      customSeats: {
                        ...prev.customSeats,
                        [group.id]: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-sm text-green-800">
          <strong>Summary:</strong> Adding seats to {selectedGroups.length}{" "}
          group{selectedGroups.length > 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );

  // Get current action details
  const getCurrentActionConfig = () => {
    switch (currentAction) {
      case "extend-subscriptions":
        return {
          title: "Extend Group Subscriptions",
          description: "Extend subscription periods for selected groups",
          content: renderExtendSubscriptions(),
        };
      case "allocate-seats":
        return {
          title: "Allocate More Seats",
          description: "Increase seat limits for selected groups",
          content: renderAllocateSeats(),
        };
      case "rename-groups":
        return {
          title: "Rename Groups",
          description: "Batch rename selected groups",
          content: <div>Rename form coming soon...</div>,
        };
      case "merge-groups":
        return {
          title: "Merge Groups",
          description: "Combine multiple groups into one",
          content: <div>Merge form coming soon...</div>,
        };
      case "change-permissions":
        return {
          title: "Change Group Permissions",
          description: "Update permissions for selected groups",
          content: <div>Permissions form coming soon...</div>,
        };
      case "assign-admin":
        return {
          title: "Assign New Admin",
          description: "Change administrators for selected groups",
          content: <div>Admin assignment form coming soon...</div>,
        };
      case "generate-reports":
        return {
          title: "Generate Group Reports",
          description: "Create detailed analytics reports",
          content: <div>Report generation form coming soon...</div>,
        };
      case "archive-groups":
        return {
          title: "Archive Groups",
          description: "Archive selected groups temporarily",
          content: <div>Archive form coming soon...</div>,
        };
      case "delete-groups":
        return {
          title: "Delete Groups",
          description: "Permanently delete selected groups",
          content: (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Warning</div>
                  <div className="text-sm text-red-700">
                    This action cannot be undone. All group data, member
                    associations, and subscription information will be
                    permanently deleted.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Groups to be deleted:
                </Label>
                {selectedGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{group.name}</span>
                    <span className="text-sm text-gray-500">
                      {group.memberCount} members
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ),
        };
      default:
        return null;
    }
  };

  const actionConfig = getCurrentActionConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {currentAction ? actionConfig?.title : "Advanced Options"}
              </DialogTitle>
              <DialogDescription>
                {currentAction
                  ? actionConfig?.description
                  : `Managing ${selectedGroups.length} selected group${
                      selectedGroups.length > 1 ? "s" : ""
                    }`}
              </DialogDescription>
            </div>
            {currentAction && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                ← Back
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {currentAction ? actionConfig?.content : renderMainMenu()}
        </div>

        {currentAction && (
          <div className="flex-shrink-0 flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button onClick={handleExecuteAction} disabled={loading}>
              {loading ? "Processing..." : "Execute"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
