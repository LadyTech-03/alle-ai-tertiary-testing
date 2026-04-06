import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { queryKeys } from "@/lib/query/queryKeys";
import type {
  RootGroupType,
  UpdateGroupPayload,
  CreateGroupPayload,
  CreateUserPayload,
  UpdateUserPayload,
  BulkUsersPayload,
  MoveItemsPayload,
  UpdateOrganizationInfo,
} from "@/lib/types/org-members";
import { toast } from "sonner";
import { useOrgRefetch } from "@/lib/contexts/org-refetch-context";
import { useAuthStore } from "@/stores";

interface RenameGroupParams {
  groupId: number;
  newName: string;
  groupData: Omit<UpdateGroupPayload, "name"> & { description: string };
  seatType: RootGroupType;
}

// ========== RENAME GROUP ==========
export function useRenameGroup(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, newName, groupData }: RenameGroupParams) => {
      return orgMemberApi.updateGroup(groupId, {
        name: newName,
        ...groupData,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.allRootData(orgId, variables.seatType),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.allGroupData(orgId, variables.groupId.toString()),
      });
      toast.success(`Group renamed to "${variables.newName}"`);
    },
    onError: (error) => {
      toast.error("Failed to rename group. Please try again.");
    },
  });
}

// ========== UPDATE GROUP ==========
interface UpdateGroupParams {
  groupId: number;
  groupData: UpdateGroupPayload & { seat_type: RootGroupType };
}

export function useUpdateGroup(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, groupData }: UpdateGroupParams) => {
      return orgMemberApi.updateGroup(groupId, groupData);
    },
    onSuccess: (data, variables) => {
      // Invalidate all queries that might contain this group
      queryClient.invalidateQueries({
        queryKey: queryKeys.allRootData(orgId, variables.groupData.seat_type),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.allGroupData(orgId, variables.groupId.toString()),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organisationGroups(
          orgId,
          variables.groupData.seat_type
        ),
      });
      toast.success("Group  updated successfully");
      // refetchOrgData();
    },
    onError: (error) => {
      toast.error("Failed to update group. Please try again.");
    },
  });
}

// ========== ADD GROUP ==========
interface AddGroupParams {
  orgId: number;
  groupData: CreateGroupPayload;
}

export function useAddGroup(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId: orgIdParam, groupData }: AddGroupParams) => {
      return orgMemberApi.createGroup(orgIdParam, groupData);
    },
    onSuccess: (data, variables) => {
      // Invalidate the appropriate queries based on where the group was added
      if (variables.groupData.parent_id === null) {
        // Root group - invalidate root queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.allRootData(orgId, variables.groupData.seat_type),
        });
      } else {
        // Nested group - invalidate parent group queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.allGroupData(
            orgId,
            variables.groupData.parent_id.toString()
          ),
        });
      }
      toast.success("Group created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create group. Please try again.");
    },
  });
}

// ========== DELETE GROUP ==========
interface DeleteGroupParams {
  groupId: number;
  seatType: RootGroupType;
  parentId: number | null;
}

export function useDeleteGroup(orgId: string) {
  const queryClient = useQueryClient();
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ groupId }: DeleteGroupParams) => {
      return orgMemberApi.deleteGroup(groupId);
    },
    onSuccess: async (data, variables) => {
      // Invalidate queries based on where the group was deleted from
      if (variables.parentId === null) {
        // Root group - use refetchQueries to force immediate refetch
        await queryClient.refetchQueries({
          queryKey: queryKeys.allRootData(orgId, variables.seatType),
        });
      } else {
        // Nested group
        await queryClient.refetchQueries({
          queryKey: queryKeys.allGroupData(
            orgId,
            variables.parentId.toString()
          ),
        });
      }
      toast.success("Group deleted successfully");
      refetchOrgData();
    },
    onError: (error) => {
      toast.error("Failed to delete group. Please try again.");
    },
  });
}

// ========== ADD MEMBER ==========
interface AddMemberParams {
  orgId: number;
  userData: CreateUserPayload;
}

export function useAddMember(orgId: string) {
  const queryClient = useQueryClient();
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ orgId: orgIdParam, userData }: AddMemberParams) => {
      return orgMemberApi.addUser(orgIdParam, userData);
    },
    onSuccess: (data, variables) => {
      // Invalidate member queries
      // Delay invalidation to allow backend to process
      setTimeout(() => {
        if (variables.userData.organisation_group_id) {
          // Member added to a group
          queryClient.invalidateQueries({
            queryKey: queryKeys.allGroupData(
              orgId,
              variables.userData.organisation_group_id.toString()
            ),
          });
        } else {
          // Member added to root
          queryClient.invalidateQueries({
            queryKey: queryKeys.allRootMembers(
              orgId,
              variables.userData.seat_type
            ),
          });
        }
      }, 500); //
      // Use backend message if available
      toast.success(data?.message || "Member added successfully");
      refetchOrgData();
    },
    onError: (error: any, variables) => {
      const responseMessage = error?.response?.data?.message;
      // Check if message is a string and contains "scheduled"
      if (
        typeof responseMessage === "string" &&
        responseMessage?.toLowerCase().includes("scheduled")
      ) {
        toast.success(responseMessage);

        setTimeout(() => {
          if (variables.userData.organisation_group_id) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.allGroupData(
                orgId,
                variables.userData.organisation_group_id.toString()
              ),
            });
          } else {
            queryClient.invalidateQueries({
              queryKey: queryKeys.allRootMembers(
                orgId,
                variables.userData.seat_type
              ),
            });
          }
        }, 2000);
        return; // Don't show error toast
      }

      // Generic error message - error details available via mutation.error
      toast.error("Failed to add member");
    },
  });
}

// ========== ADD BULK USERS ==========
interface AddBulkUsersParams {
  orgId: number;
  bulkUserData: BulkUsersPayload;
}

export function useAddBulkUsers(orgId: string, onRefetch?: () => void) {
  const queryClient = useQueryClient();
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({
      orgId: orgIdParam,
      bulkUserData,
    }: AddBulkUsersParams) => {
      return orgMemberApi.addBulkUsers(orgIdParam, bulkUserData);
    },
    onSuccess: (data, variables) => {
      if (data?.message) {
        toast.success(data.message);
      }
      refetchOrgData();
      const invalidate = async () => {
        if (onRefetch) {
          onRefetch();
        }
        if (variables.bulkUserData.organisation_group_id) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allGroupData(
              orgId,
              variables.bulkUserData.organisation_group_id.toString()
            ),
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allRootMembers(
              orgId,
              variables.bulkUserData.seat_type
            ),
          });
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allRootData(
              orgId,
              variables.bulkUserData.seat_type
            ),
          });
        }
      };

      // Immediate -.I observed backend delays most times (maybe local development problem)
      // but this refctch and delay makes things work out faster
      invalidate();

      setTimeout(invalidate, 1000);
      setTimeout(invalidate, 3000);
    },
    onError: (error: any, variables) => {
      toast.error("Failed to add members");
    },
  });
}

// ========== DELETE MEMBER ==========
interface DeleteMemberParams {
  memberId: number;
  seatType: RootGroupType;
  groupId?: number | null;
}

export function useDeleteMember(orgId: string) {
  const queryClient = useQueryClient();
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ memberId }: DeleteMemberParams) => {
      return orgMemberApi.removeBulkUsers(Number(orgId), [memberId]);
    },
    onSuccess: async (data, variables) => {
      if (variables.groupId) {
        await queryClient.refetchQueries({
          queryKey: queryKeys.allGroupData(orgId, variables.groupId.toString()),
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: queryKeys.allRootMembers(orgId, variables.seatType),
        });
      }
      toast.success("Member removed successfully");
      refetchOrgData();
    },
    onError: (error) => {
      toast.error("Failed to remove member. Please try again.");
    },
  });
}

// ========== BULK DELETE ==========
interface BulkDeleteParams {
  memberIds: number[];
  groupIds: number[];
  seatType: RootGroupType;
  groupId?: number | null;
}

export function useBulkDelete(orgId: string) {
  const queryClient = useQueryClient();
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ memberIds, groupIds }: BulkDeleteParams) => {
      const deletePromises: Promise<any>[] = [];

      if (memberIds.length > 0) {
        deletePromises.push(
          orgMemberApi.removeBulkUsers(Number(orgId), memberIds)
        );
      }

      groupIds.forEach((groupId) => {
        deletePromises.push(orgMemberApi.deleteGroup(groupId));
      });

      return Promise.all(deletePromises);
    },
    onSuccess: async (data, variables) => {
      const invalidate = async () => {
        if (variables.groupId) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allGroupData(
              orgId,
              variables.groupId.toString()
            ),
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allRootMembers(orgId, variables.seatType),
          });
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allRootData(orgId, variables.seatType),
          });
        }
      };

      // Immediate invalidation
      await invalidate();

      // Delayed invalidation for eventual consistency
      setTimeout(async () => {
        await invalidate();
      }, 1000);

      const membersCount = variables.memberIds.length;
      const groupsCount = variables.groupIds.length;
      const totalDeleted = membersCount + groupsCount;

      // Build descriptive message
      let message = "";
      if (membersCount > 0 && groupsCount > 0) {
        message = `${membersCount} ${
          membersCount === 1 ? "member" : "members"
        } and ${groupsCount} ${
          groupsCount === 1 ? "group" : "groups"
        } removed successfully`;
      } else if (membersCount > 0) {
        message = `${membersCount} ${
          membersCount === 1 ? "member" : "members"
        } removed successfully`;
      } else if (groupsCount > 0) {
        message = `${groupsCount} ${
          groupsCount === 1 ? "group" : "groups"
        } removed successfully`;
      }

      toast.success(message);
      refetchOrgData();
    },
    onError: (error) => {
      toast.error("Failed to remove selected items. Please try again.");
    },
  });
}

// ========== ASSIGN ROLE ==========
interface AssignRoleParams {
  userId: number;
  role: "admin" | "member";
  seatType?: RootGroupType;
  groupId?: number | null;
}

export function useAssignRole(orgId: string) {
  const queryClient = useQueryClient();
  // const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ userId, role }: AssignRoleParams) => {
      return orgMemberApi.assignRole(Number(orgId), userId, role);
    },
    onSuccess: (data, variables) => {
      if (variables.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.allGroupData(orgId, variables.groupId.toString()),
        });
      } else if (variables.seatType) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.allRootMembers(orgId, variables.seatType),
        });
      }

      // Always invalidate admin list
      queryClient.invalidateQueries({
        queryKey: queryKeys.orgAdmins(orgId),
      });
      // refetchOrgData();
    },
    onError: (error) => {
      toast.error("Failed to update admin role");
    },
  });
}

// ========== REVOKE ADMIN ACCESS ==========
export function useRevokeAdmin() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id.toString() || "";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return orgMemberApi.detachRole(Number(orgId), userId);
    },
    onSuccess: () => {
      toast.success("Admin access revoked successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.orgAdmins(orgId),
      });
    },
    onError: (error) => {
      toast.error("Failed to revoke admin access");
    },
  });
}

// ========== UPDATE ADMIN PERMISSIONS ==========
interface UpdateAdminPermissionsParams {
  adminId: number;
  permissionsToAdd: number[];
  permissionsToRemove: number[];
}

export function useUpdateAdminPermissions() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      adminId,
      permissionsToAdd,
      permissionsToRemove,
    }: UpdateAdminPermissionsParams) => {
      const promises = [];

      // Add permissions
      if (permissionsToAdd.length > 0 && orgId) {
        promises.push(
          orgMemberApi.assignPermissions(orgId, {
            user_id: adminId,
            permissions: permissionsToAdd,
          })
        );
      }

      // Remove permissions
      if (permissionsToRemove.length > 0 && orgId) {
        promises.push(
          orgMemberApi.detachPermissions(orgId, {
            user_id: adminId,
            permissions: permissionsToRemove,
          })
        );
      }

      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Permissions updated successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.orgAdmins(orgId?.toString() || ""),
      });
    },
    onError: (error) => {
      toast.error("Failed to update permissions");
    },
  });
}

// ========== UPDATE ORGANIZATION INFO ==========
interface UpdateOrganizationParams {
  updateData: FormData | UpdateOrganizationInfo;
}

export function useUpdateOrganization() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ updateData }: UpdateOrganizationParams) => {
      if (!orgId) throw new Error("Organization ID not found");
      return orgMemberApi.updateOrganizationInfo(orgId, updateData);
    },
    onSuccess: () => {
      toast.success("Organization info updated successfully");
      refetchOrgData();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update organization info");
    },
  });
}

// ========== TRANSFER OWNERSHIP ==========
export function useTransferOwnership() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;
  // const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async (userId: number) => {
      if (!orgId) throw new Error("Organization ID not found");
      return orgMemberApi.transferOwnership(orgId, userId);
    },
    onSuccess: () => {
      toast.success("Ownership transferred successfully");
      // refetchOrgData();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to transfer ownership");
    },
  });
}

// ========== UPDATE MEMBER ==========
interface UpdateMemberParams {
  userId: number;
  userData: UpdateUserPayload;
  seatType: RootGroupType;
  groupId?: number | null;
}

export function useUpdateMember(orgId: string) {
  const queryClient = useQueryClient();
  // const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async ({ userId, userData }: UpdateMemberParams) => {
      return orgMemberApi.updateUser(Number(orgId), userId, userData);
    },
    onSuccess: (data, variables) => {
      if (variables.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.allGroupData(orgId, variables.groupId.toString()),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.allRootMembers(orgId, variables.seatType),
        });
      }
      toast.success("Member updated successfully");
      // refetchOrgData();
    },
    onError: (error) => {
      toast.error("Failed to update member. Please try again.");
    },
  });
}

// ========== MOVE ITEMS ==========
interface MoveItemsParams extends MoveItemsPayload {
  seatType: "student" | "faculty";
  sourceGroupId?: number | null;
}

export function useMoveItems(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MoveItemsParams) => {
      return orgMemberApi.moveItems({
        parent_id: params.parent_id,
        user_ids: params.user_ids,
        group_ids: params.group_ids,
      });
    },
    onSuccess: async (data, variables) => {
      // Refetch all queries related to this organization
      // This ensures all views (current page, other pages, tree structure) update correctly
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey as any[];
          return key.includes(orgId);
        },
      });

      const totalMoved = variables.user_ids.length + variables.group_ids.length;
      toast.success(`${totalMoved} item(s) moved successfully`);
    },
    onError: (error) => {
      toast.error("Failed to move items. Please try again.");
    },
  });
}

// permanantely delete members
export function usePermanentDeleteMembers() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id.toString() || "";
  // const { refetchOrgData } = useOrgRefetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberIds: number[]) => {
      return orgMemberApi.permanentDeleteUsers(memberIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.allRootMembers(orgId, "system"),
      });
      // refetchOrgData();
      toast.success("Members permanently deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to permanently delete members. ");
    },
  });
}
// restore deleted users

export function useRestoreDeletedMembers() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id.toString() || "";
  const queryClient = useQueryClient();
  const { refetchOrgData } = useOrgRefetch();

  return useMutation({
    mutationFn: async (memberIds: number[]) => {
      return orgMemberApi.restoreTrashUser(memberIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.allRootMembers(orgId, "system"),
      });
      toast.success("Members restored successfully");
      refetchOrgData();
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to restore members. ");
    },
  });
}
