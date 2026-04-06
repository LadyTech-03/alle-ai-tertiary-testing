import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { orgMemberApi } from "@/lib/api/orgs/members";
import type { Group, Member, Meta } from "@/lib/types/org-members";

interface UseOrgMemberDataParams {
    orgId: string;
    breadcrumbPath: Group[];
    page: number;
}

interface UseOrgMemberDataReturn {
    groups: Group[];
    members: Member[];
    meta: Meta | null;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    refetch: () => Promise<void>;
}


export function useOrgMemberData({
    orgId,
    breadcrumbPath,
    page,
}: UseOrgMemberDataParams): UseOrgMemberDataReturn {
    const isRoot = breadcrumbPath.length === 0;
    const currentFolder = breadcrumbPath[breadcrumbPath.length - 1];

    // Determine view type
    const isSeatTypeView = breadcrumbPath.length === 1; // Faculty or Student folder Or System (Deleted Users)
    const isNestedGroup = breadcrumbPath.length > 1; // Inside a group

    // ========== FETCH GROUPS ==========
    const groupsQuery = useQuery({
        queryKey: isSeatTypeView
            ? queryKeys.rootSubgroups(orgId, currentFolder.seat_type, page)
            : isNestedGroup
                ? queryKeys.groupSubgroups(orgId, currentFolder.id.toString(), page)
                : [],
        queryFn: async () => {
            if (isSeatTypeView) {
                // If it's the system folder (Deleted Users), return empty groups
                if (currentFolder.seat_type === "system") {
                    return { data: [], meta: null };
                }

                // Only pass page parameter if page > 1
                return orgMemberApi.getRootGroups(
                    Number(orgId),
                    currentFolder.seat_type,
                    page > 1 ? page : undefined
                );
            } else if (isNestedGroup) {
                // Only pass page parameter if page > 1
                return orgMemberApi.getGroupSubGroups(
                    currentFolder.id,
                    page > 1 ? page : undefined
                );
            }
            return { data: [], meta: null };
        },
        enabled: !isRoot, // Don't fetch if we're at root (showing Faculty/Student folders)
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // ========== FETCH MEMBERS ==========
    const membersQuery = useQuery({
        queryKey: isSeatTypeView
            ? queryKeys.rootMembers(orgId, currentFolder.seat_type, page)
            : isNestedGroup
                ? queryKeys.groupMembers(orgId, currentFolder.id.toString(), page)
                : [],
        queryFn: async () => {
            if (isSeatTypeView) {
                // If it's the system folder (Deleted Users), fetch trashed users
                if (currentFolder.seat_type === "system") {
                    return orgMemberApi.getTrashedUsers(
                        page > 1 ? page : undefined
                    );
                }

                // Only pass page parameter if page > 1
                return orgMemberApi.getRootMembers(
                    Number(orgId),
                    currentFolder.seat_type,
                    page > 1 ? page : undefined
                );
            } else if (isNestedGroup) {
                // Only pass page parameter if page > 1
                return orgMemberApi.getGroupMembers(
                    currentFolder.id,
                    page > 1 ? page : undefined
                );
            }
            return { data: [], meta: null };
        },
        enabled: !isRoot,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // ========== COMPUTE DERIVED STATE ==========
    const membersMeta = membersQuery.data?.meta || null;
    const groupsMeta = groupsQuery.data?.meta || null;

    // Check if either list has a next page
    const membersHasNext = membersMeta ? page < membersMeta.last_page : false;
    const groupsHasNext = groupsMeta ? page < groupsMeta.last_page : false;

    const hasNextPage = membersHasNext || groupsHasNext;
    const hasPreviousPage = page > 1;

    return {
        groups: (groupsQuery.data?.data as Group[]) || [],
        members: (membersQuery.data?.data as Member[]) || [],
        meta: membersMeta || groupsMeta,
        isLoading: groupsQuery.isLoading || membersQuery.isLoading,
        isFetching: groupsQuery.isFetching || membersQuery.isFetching,
        error: (groupsQuery.error || membersQuery.error) as Error | null,
        hasNextPage,
        hasPreviousPage,

        refetch: async () => {
            await Promise.all([groupsQuery.refetch(), membersQuery.refetch()]);
        },
    };
}
