import type { RootGroupType } from "@/lib/types/org-members";
export type { RootGroupType } from "@/lib/types/org-members";

export const queryKeys = {
  // Root level (student/faculty) with pagination
  rootSubgroups: (
    orgId: string,
    groupType: RootGroupType,
    page: number = 1
  ) => ["org", orgId, "root-subgroups", groupType, { page }],
  rootMembers: (orgId: string, groupType: RootGroupType, page: number = 1) => [
    "org",
    orgId,
    "root-members",
    groupType,
    { page },
  ],

  // Nested groups (any depth) with pagination
  groupSubgroups: (orgId: string, groupId: string, page: number = 1) => [
    "org",
    orgId,
    "group",
    groupId,
    "subgroups",
    { page },
  ],
  groupMembers: (orgId: string, groupId: string, page: number = 1) => [
    "org",
    orgId,
    "group",
    groupId,
    "members",
    { page },
  ],

  // for fetching organisation groups
  organisationGroups: (
    orgId: string,
    seat_type: "student" | "faculty" | "system"
  ) => ["org", orgId, "groups", seat_type],

  // Wildcard keys for cache invalidation
  allRootData: (orgId: string, groupType: RootGroupType) => [
    "org",
    orgId,
    "root-subgroups",
    groupType,
  ],
  allRootMembers: (orgId: string, groupType: RootGroupType) => [
    "org",
    orgId,
    "root-members",
    groupType,
  ],
  allGroupData: (orgId: string, groupId: string) => [
    "org",
    orgId,
    "group",
    groupId,
  ],

  // Signup analytics
  signupActivity: (orgId: string, fromDate?: string, toDate?: string) => [
    "org",
    orgId,
    "signup-activity",
    ...(fromDate && toDate ? [{ fromDate, toDate }] : []),
  ],

  // Admin activity logs
  adminActivityLogs: (orgId: string, page: number = 1) => [
    "org",
    orgId,
    "admin-activity-logs",
    { page },
  ],

  // Org Administrators
  orgAdmins: (orgId: string) => ["org", orgId, "administrators"],

  // Admin Permissions
  adminPermissions: (orgId: string, adminId: string) => [
    "org",
    orgId,
    "administrator",
    adminId,
    "permissions",
  ],
  globalAdminPermissions: ["adminPermissions"],

  // Org Usage Statistics (full data, fetched once)
  orgUsage: (orgId: string) => ["org", orgId, "usage"],

  // Org API Calls (with date range and customization filters)
  orgApiCalls: (
    orgId: string,
    fromDate?: string,
    toDate?: string,
    filters?: Record<string, any>
  ) => [
      "org",
      orgId,
      "api-calls",
      ...(fromDate && toDate ? [{ fromDate, toDate }] : []),
      ...(filters ? [filters] : []),
    ],

  // Org Payment Method
  orgPaymentMethod: (orgId: string) => ["org", orgId, "payment-method"],

  // Org Payment Methods (all)
  orgPaymentMethods: (orgId: string) => ["org", orgId, "payment-methods"],

  // Courses with pagination
  orgCourses: (orgId: string) => ["org", orgId, "courses"],

  // Class Groups
  orgClassGroups: (orgId: string) => ["org", orgId, "class-groups"],
  classGroupCourses: (orgId: string, classGroupSlug: string) => [
    "org",
    orgId,
    "class-group",
    classGroupSlug,
    "courses",
  ],

  // Specific course
  orgCourse: (orgId: string, courseId: string) => [
    "org",
    orgId,
    "course",
    courseId,
  ],

  // Course files/content with pagination
  courseFiles: (orgId: string, courseId: string) => [
    "org",
    orgId,
    "course",
    courseId,
    "files",
  ],

  // Active device sessions with pagination
  activeSessions: (orgId: string, page: number = 1) => [
    "org",
    orgId,
    "active-sessions",
    { page },
  ],

  // Device sessions history with pagination
  deviceSessionsHistory: (orgId: string, page: number = 1) => [
    "org",
    orgId,
    "device-sessions-history",
    { page },
  ],

  // Device projects with pagination
  deviceProjects: (orgId: string, page: number = 1) => [
    "org",
    orgId,
    "device-projects",
    { page },
  ],

  // Wildcard keys for cache invalidation
  allOrgCourses: (orgId: string) => ["org", orgId, "courses"],
  allCourseFiles: (orgId: string, courseId: string) => [
    "org",
    orgId,
    "course",
    courseId,
    "files",
  ],
  allActiveSessions: (orgId: string) => ["org", orgId, "active-sessions"],
  allDeviceSessionsHistory: (orgId: string) => [
    "org",
    orgId,
    "device-sessions-history",
  ],

  allDeviceProjects: (orgId: string) => ["org", orgId, "device-projects"],
  allClassGroupCourses: (orgId: string) => ["org", orgId, "class-group"],

  // Org Preview Data (Top Models, etc.)
  orgPreview: (orgId: string) => ["org", orgId, "preview"],

  // System User
  systemUser: (orgId: string) => ["org", orgId, "system-user"],
};
