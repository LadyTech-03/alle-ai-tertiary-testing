import api from "../axios";
import type {
  Group,
  Member,
  Meta,
  Links,
  BulkUsersPayload,
  MoveItemsPayload,
  CreateUserPayload,
  ApiResponse,
  RootGroupType,
  UpdateOrganizationInfo,
  AdminResponse,
  AssignPermissionsPayload,
  Permission,
} from "@/lib/types/org-members";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

// Re-export for backward compatibility
export type { BulkUsersPayload as AddBulkUsers } from "@/lib/types/org-members";

// will do proper replacement so wont have to pass id as props
// since organization id barely changes
const orgId = useAuthStore.getState().organizationDetails?.id;

// Legacy interface kept for API compatibility
interface OrgUser extends CreateUserPayload { }

interface GetGroups {
  status: boolean;
  message: string;
  data: Group[];
  meta: Meta;
}

interface QueryResponse {
  data: Member[];
  links: Links;
  meta: Meta;
}

interface getGroupMembersResponse {
  data: Member[];
  links: Links;
  meta: Meta;
}

interface GetGroupsResponse {
  data: Group[];
  links: Links;
  meta: Meta;
}
// Type alias for AddBulkUsers used in function signatures
type AddBulkUsers = BulkUsersPayload;

// Type alias for createGroupResponse
type createGroupResponse = ApiResponse<Group>;

// Type alias for AssignPermissions
type AssignPermissions = AssignPermissionsPayload;
export const orgMemberApi = {
  addUser: async (orgId: number, userData: OrgUser): Promise<any> => {
    // console.log("user data", userData);
    const response = await api.post(`/organisations/${orgId}/users`, userData);
    return response.data;
  },
  deactivateUser: async (orgId: number, userId: number): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/deactivate-user`,
      { user_id: userId }
    );
    return response.data;
  },
  activateUser: async (orgId: number, userId: number): Promise<any> => {
    const response = await api.post(`/organisations/${orgId}/activate-user`, {
      user_id: userId,
    });
    return response.data;
  },
  addBulkUsers: async (
    orgId: number,
    bulkUserData: BulkUsersPayload
  ): Promise<any> => {
    // console.log("bulk user data", bulkUserData);
    const response = await api.post(
      `/organisations/${orgId}/users/bulk`,
      bulkUserData
    );
    return response.data;
  },
  removeBulkUsers: async (orgId: number, userIds: number[]): Promise<any> => {
    try {
      const response = await api.post(`/organisations/${orgId}/remove-users`, {
        users: userIds,
      });

      // toast.success(
      //   response.data.message ||
      //   `${userIds.length > 0 ? "Users" : "User"} removed successfully.`
      // );
    } catch (error) {
      toast.error("Failed to remove bulk users.");
    }
  },
  createGroup: async (
    orgId: number,
    groupData: {
      name: string;
      description?: string;
      parent_id: number | null;
      seat_type: RootGroupType;
      expiry_date: string | null;
      features: string[];
    }
  ): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/groups`,
      groupData
    );
    return response.data;
  },
  updateGroup: async (
    groupId: number,
    groupData: {
      name?: string;
      description?: string;
      parent_id?: number | null;
      seat_type?: RootGroupType;
      expiry_date?: string | null;
      features: string[];
    }
  ): Promise<createGroupResponse> => {
    
    const response = await api.post(
      `/organisation_groups/${groupId}/update`,
      groupData
    );
    return response.data;
  },
  moveGroup: async (
    groupId: number,
    newParentId: number | null
  ): Promise<createGroupResponse> => {
    const response = await api.post(
      `/organisation_groups/${groupId}/change-parent`,
      { parent_id: newParentId }
    );
    return response.data;
  },
  moveGroupMembers: async (groupId: number): Promise<any> => {
    const response = await api.post(
      `/organisation_groups/${groupId}/move-users`,
      { organisation_group_id: groupId }
    );
    return response.data;
  },
  removeGroupMembers: async (groupId: number): Promise<any> => {
    const response = await api.post(
      `/organisation_groups/${groupId}/remove-users`
    );
    return response.data;
  },
  deleteGroup: async (groupId: number): Promise<any> => {
    const response = await api.post(`/organisation_groups/${groupId}/delete`);
    return response.data;
  },
  getGroups: async (
    orgId: number,
    seat_type: RootGroupType
  ): Promise<GetGroups> => {
    const response = await api.get(
      `/organisations/${orgId}/groups/${seat_type}`
    );
    return response.data;
  },
  getGroupSubGroups: async (
    groupId: number,
    page?: number
  ): Promise<GetGroups> => {
    const url = page
      ? `/organisation_groups/${groupId}/subgroups?page=${page}`
      : `/organisation_groups/${groupId}/subgroups`;
    const response = await api.get(url);
    return response.data;
  },
  getGroupMembers: async (
    groupId: number,
    page?: number
  ): Promise<getGroupMembersResponse> => {
    const url = page
      ? `/organisation_groups/${groupId}/users?page=${page}`
      : `/organisation_groups/${groupId}/users`;
    const response = await api.get(url);
    return response.data;
  },
  getRootMembers: async (
    orgId: number,
    seat_type: RootGroupType,
    page?: number
  ): Promise<getGroupMembersResponse> => {
    const url = page
      ? `/organisations/${orgId}/root-members/${seat_type}?page=${page}`
      : `/organisations/${orgId}/root-members/${seat_type}`;
    const response = await api.get(url);
    return response.data;
  },
  getRootGroups: async (
    orgId: number,
    seat_type: RootGroupType,
    page?: number
  ): Promise<GetGroupsResponse> => {
    const url = page
      ? `/organisations/${orgId}/root-groups/${seat_type}?page=${page}`
      : `/organisations/${orgId}/root-groups/${seat_type}`;
    try {
      const response = await api.get(url);
      return response.data;
    } catch (er) {
      throw er;
    }
  },
  updateUser: async (
    orgId: number,
    user_id: number,
    userData: {
      first_name: string;
      last_name: string;
      email: string;
      expiry_date: string | null;
    }
  ): Promise<any> => {
    const response = await api.post(`/organisations/${orgId}/update-user`, {
      user_id: user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      expiry_date: userData.expiry_date || null,
    });
    return response.data;
  },
  searchQuery: async (
    orgId: string,
    query: string,
    only_trashed?: boolean
  ): Promise<QueryResponse> => {
    const params: Record<string, any> = { query };

    if (only_trashed !== undefined) {
      params.only_trashed = only_trashed;
    }
    const response = await api.get(`/organisations/${orgId}/search-user`, {
      params,
    });
    return response.data;
  },
  assignRole: async (
    orgId: number,
    userId: number,
    role: "admin" | "member"
  ): Promise<any> => {
    const response = await api.post(`/organisations/${orgId}/assign-role`, {
      user_id: userId,
      role: role,
    });
    return response.data;
  },
  detachRole: async (orgId: number, userId: number): Promise<any> => {
    const response = await api.post(`/organisations/${orgId}/detach-role`, {
      user_id: userId,
    });
    return response.data;
  },
  getAdminActivity: async (orgId: number, page?: number): Promise<any> => {
    const url = page
      ? `/organisations/${orgId}/activity-logs?page=${page}`
      : `/organisations/${orgId}/activity-logs`;
    const response = await api.get(url);
    return response.data;
  },
  updateOrganizationInfo: async (
    orgId: number,
    updateData: FormData | UpdateOrganizationInfo
  ): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/update`,
      updateData
    );
    return response.data;
  },
  transferOwnership: async (orgId: number, user_id: number): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/transfer-ownership`,
      { user_id }
    );
    return response.data;
  },
  getOrganization: async (orgId: number): Promise<any> => {
    const response = await api.get(`/organisations/${orgId}`);
    return response.data;
  },
  getAdmins: async (orgId: number): Promise<AdminResponse> => {
    const response = await api.get(`/organisations/${orgId}/admins`);
    return response.data;
  },
  getAdminPermsions: async (): Promise<{ data: Permission[] }> => {
    const response = await api.get(`/organisations/permissions`);
    return response.data;
  },
  assignPermissions: async (
    orgId: number,
    permissionsData: AssignPermissions
  ): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/assign-permissions`,
      {
        user_id: permissionsData.user_id,
        permissions: permissionsData.permissions,
      }
    );
    return response.data;
  },
  detachPermissions: async (
    orgId: number,
    permissionsData: AssignPermissions
  ): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/detach-permissions`,
      {
        user_id: permissionsData.user_id,
        permissions: permissionsData.permissions,
      }
    );
    return response.data;
  },
  getOrgRootFoldersByType: async (
    orgId: number,
    seat_type: RootGroupType
  ): Promise<any> => {
    const response = await api.get(
      `/organisations/${orgId}/group_tree/${seat_type}`
    );
    return response.data;
  },
  moveItems: async (data: MoveItemsPayload): Promise<any> => {
    const response = await api.post(`/organisations/${orgId}/move-items`, data);
    return response.data;
  },
  getTrashedUsers: async (page?: number): Promise<QueryResponse> => {
    const url = page
      ? `/organisations/${orgId}/trashed-users?page=${page}`
      : `/organisations/${orgId}/trashed-users`;
    const response = await api.get(url);
    return response.data;
  },
  restoreTrashUser: async (users: number[]): Promise<any> => {
    const response = await api.post(`/organisations/${orgId}/restore-users`, {
      users: users,
    });
    return response.data;
  },
  permanentDeleteUsers: async (users: number[]): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/permanent-delete-users`,
      {
        users: users,
      }
    );
    return response.data;
  },
};
