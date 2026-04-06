// ============ SEAT TYPES ============
export type SeatType = "faculty" | "student" | "system";
export type RootGroupType = SeatType;

// ============ PATH TYPES ============
export interface PathItem {
    name: string;
    id: number | null;
}

// ============ CORE ENTITIES ============

export interface Group {
    id: number;
    name: string;
    description: string;
    parent_id: number | null;
    seat_type: SeatType;
    expiry_date: string | null;
    features: string[] | null;
    organisation_id: number;
    hasSubGroups: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

/**
 * Represents an organization member/user.
 */
export interface Member {
    id: number;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    path: PathItem[];
    email: string;
    role: "member" | "admin";
    seat_type: SeatType;
    created_at?: string;
    updated_at?: string;
    expiry_date?: string | null;
    deleted_at?: string | null;
}


export type FolderItem = Group | Member;

// ============ TYPE GUARDS ============

/**
 * Type guard to check if an item is a Group.
 */
export const isGroup = (item: FolderItem): item is Group => {
    return "seat_type" in item && "parent_id" in item;
};

/**
 * Type guard to check if an item is a Member.
 */
export const isMember = (item: FolderItem): item is Member => {
    return "first_name" in item && "last_name" in item;
};

// ============ PAGINATION TYPES ============

export interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Links {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
}

export interface Meta {
    current_page: number;
    from: number;
    last_page: number;
    links?: PageLink[];
    path?: string;
    per_page: number;
    to: number;
    total: number;
}

// ============ API PAYLOADS: USER OPERATIONS ============

export interface CreateUserPayload {
    email: string;
    first_name: string;
    last_name: string;
    seat_type: RootGroupType;
    role?: "admin" | "member";
    organisation_group_id?: number | null;
    expiry_date: string | null;
}

/**
 * Payload for updating an existing user.
 */
export interface UpdateUserPayload {
    first_name: string;
    last_name: string;
    email: string;
    expiry_date: string | null;
}

/**
 * Single user entry for bulk operations.
 */
export interface BulkUserEntry {
    email: string;
    first_name: string;
    last_name: string;
    expiry_date?: string | null;
}

/**
 * Payload for bulk user creation.
 */
export interface BulkUsersPayload {
    seat_type: RootGroupType;
    organisation_group_id?: number | null;
    usersDetails: BulkUserEntry[];
}

// ============ API PAYLOADS: GROUP OPERATIONS ============

/**
 * Payload for creating a new group.
 */
export interface CreateGroupPayload {
    name: string;
    description?: string;
    parent_id: number | null;
    seat_type: RootGroupType;
    expiry_date: string | null;
    features: string[];
}

/**
 * Payload for updating an existing group.
 */
export interface UpdateGroupPayload {
    name?: string;
    description?: string;
    parent_id?: number | null;
    seat_type?: RootGroupType;
    expiry_date?: string | null;
    features: string[];
}

/**
 * Payload for moving items between groups.
 */
export interface MoveItemsPayload {
    parent_id: number | null;
    user_ids: number[];
    group_ids: number[];
}

// ============ API RESPONSES ============

/**
 * Generic paginated response from the API.
 */
export interface PaginatedResponse<T> {
    data: T[];
    links: Links;
    meta: Meta;
}

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

/**
 * Paginated response containing groups.
 */
export type GroupsResponse = PaginatedResponse<Group>;

/**
 * Paginated response containing members.
 */
export type MembersResponse = PaginatedResponse<Member>;

// ============ ORGANIZATION TYPES ============

export interface SeatDetails {
    purchased_seats: string;
    remaining_seats: number;
    for_system: boolean;
}

export interface SeatsInfo {
    [key: string]: SeatDetails;
}

export interface UserStatusInfo {
    active_users_count: number;
    inactive_users_count: number;
    accessed_users_count: number;
    unaccessed_users_count: number;
}

export interface GroupsInfo {
    [key: string]: number;
}

/**
 * Full organization details from API response.
 */
export interface OrganizationDetails {
    id: number;
    name: string;
    slug: string;
    email: string;
    logo_url: string | null;
    website_url: string | null;
    subscribed_plan: string;
    created_by: string;
    support_email: string[] | null;
    support_phone: string[] | null;
    allowed_domains: string[] | null;
    pm_type: string | null;
    pm_last_four: string | null;
    trial_ends_at: string | null;
    seat_types: string[];
    seats_info: SeatsInfo;
    admins_count: number;
    user_status_info: UserStatusInfo;
    groups_info: GroupsInfo;
    owner_email?: string;
    subscription_info?: {
        plan: string;
        plan_logo: string | null;
        cycle: string;
        billing_details: {
            [key: string]: {
                amount: string | number;
                number_purchased: number;
                total: number;
                cycle: string;
            };
        };
        total_cost: number;
    };
}

// ============ SELECTION TYPES ============

export interface SelectionItem {
    id: string;
    name: string;
    type: "group" | "member";
    data: Group | Member;
}

export interface SelectionMetadata {
    totalSelected: number;
    groupsCount: number;
    membersCount: number;
    isMixed: boolean;
    selectedData: SelectionItem[];
    actions: {
        canRename: boolean;
        canEdit: boolean;
        canMove: boolean;
        canDelete: boolean;
        canManage?: boolean;
        canRestore: boolean;
        canPermanentDelete: boolean;
    };
}

// ============ ADMIN TYPES ============

export interface Permission {
    id: number;
    name: string;
    category: string;
    level: string;
    slug: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Administrator {
    id: number;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    email: string;
    role: string;
    seat_type: string;
    permissions: Permission[];
    created_at: string;
}

export interface AdminResponse {
    status: string;
    data: Member[];
}

export interface AssignPermissionsPayload {
    user_id: number;
    permissions: number[];
}

// ============ UPDATE ORGANIZATION TYPES ============

export interface UpdateOrganizationPayload {
    name: string;
    slug: string;
    logo_file?: File | null;
    website_url: string;
    support_email: string[];
    support_phone: string[];
    features: string[];
    allowed_domains: string[];
}

export interface UpdateOrganizationInfo {
    name?: string;
    slug?: string;
    logo_url?: string | null;
    website_url?: string;
    support_email?: string[];
    support_phone?: string[];
    features?: string[];
    allowed_domains?: string[];
}

// ============ ACTIVITY LOG TYPES ============

export interface ActivityLogUser {
    id: number;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    path: Array<{ name: string; id: number | null }>;
    email: string;
    role: string;
    seat_type: string;
    expiry_date: string | null;
    created_at: string;
}

export interface ActivityLog {
    user: ActivityLogUser | null;
    action: string;
    created_at: string;
}

export interface ActivityLogsResponse {
    data: ActivityLog[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

// ============ AUTH TYPES ============

export interface OrgLoginCodeResponse {
    success: boolean;
    organisation_name: string;
    organisation_logo: string;
    user_name: string;
    message: string;
}

export interface TopModelItem {
    ApiCalls: number;
    modelInstance: {
        id: number;
        name: string;
        photo_url: string;
        uid: string;
    };
}

export interface OrgPreviewResponse {
    date: string;
    top_models: TopModelItem[];
    sign_up_analytics: any[];
    sign_in_analytics: {
        average_daily: number;
        average_weekly: number;
        average_monthly: number;
    };
    last_update_today: string;
}
