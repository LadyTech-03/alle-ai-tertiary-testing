import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { orgUsageApi, type UsageActivityResponse } from "@/lib/api/orgs/usage";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { orgPaymentsApi, type PaymentMethod } from "@/lib/api/orgs/payments";
import { orgOverviewApi } from "@/lib/api/orgs/overview";
import { useAuthStore } from "@/stores";
import type {
  AdminResponse,
  Permission,
  ActivityLogsResponse,
  OrgPreviewResponse,
} from "@/lib/types/org-members";

// ========== ORG USAGE ==========

export function useOrgUsage() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;

  return useQuery<UsageActivityResponse>({
    queryKey: queryKeys.orgUsage(orgId?.toString() || ""),
    queryFn: () => orgUsageApi.getUsageActivity(orgId!),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

// ========== ORG ADMINS ==========
export function useOrgAdmins() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id?.toString() || "";

  return useQuery<AdminResponse>({
    queryKey: queryKeys.orgAdmins(orgId),
    queryFn: () => orgMemberApi.getAdmins(Number(orgId)),
    enabled: !!orgId,
  });
}

// ========== ORG PAYMENT METHODS ==========

interface UseOrgPaymentMethodsOptions {
  enabled?: boolean;
  staleTime?: number;
  placeholderData?: (previousData: any) => any;
}

export function useOrgPaymentMethods(options?: UseOrgPaymentMethodsOptions) {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id?.toString() || "";
  const isEnabled = options?.enabled ?? true;

  return useQuery<PaymentMethod[]>({
    queryKey: queryKeys.orgPaymentMethods(orgId),
    queryFn: async () => {
      const response = await orgPaymentsApi.getPaymentMethods();
      return response.payment_methods || [];
    },
    enabled: !!orgId && isEnabled,
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // Default 5 minutes
    placeholderData: options?.placeholderData,
  });
}

// ========== GLOBAL ADMIN PERMISSIONS ==========

interface UseGlobalAdminPermissionsOptions {
  enabled?: boolean;
}

export function useGlobalAdminPermissions(
  options?: UseGlobalAdminPermissionsOptions
) {
  const isEnabled = options?.enabled ?? true;

  return useQuery<{ data: Permission[] }>({
    queryKey: queryKeys.globalAdminPermissions,
    queryFn: () => orgMemberApi.getAdminPermsions(),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 10, //- permissions rarely change
    // will implement fetching only ones and invalidating only after there is a change later
    // 
  });
}
// ========== ORG API CALLS ==========

interface UseOrgApiCallsOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useOrgApiCalls(options?: UseOrgApiCallsOptions) {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;
  const isEnabled =
    options?.enabled ?? (!!options?.startDate && !!options?.endDate);

  return useQuery<Record<string, number>>({
    queryKey: queryKeys.orgApiCalls(
      orgId?.toString() || "",
      options?.startDate || "",
      options?.endDate || ""
    ),
    queryFn: () =>
      orgUsageApi.getApiCalls(orgId!, options?.startDate!, options?.endDate!),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ========== ORG SIGNUP ACTIVITY ==========

interface UseOrgSignupActivityOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useOrgSignupActivity(options?: UseOrgSignupActivityOptions) {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;
  const isEnabled = options?.enabled ?? true;

  return useQuery<any[]>({
    queryKey: queryKeys.signupActivity(
      orgId?.toString() || "",
      options?.startDate,
      options?.endDate
    ),
    queryFn: () =>
      orgOverviewApi.getSignUPsActivity(
        orgId?.toString() || "",
        options?.startDate,
        options?.endDate
      ),
    enabled: !!orgId && isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

// ========== ORG ADMIN ACTIVITY ==========

export function useOrgAdminActivity(page: number = 1) {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;

  return useQuery<ActivityLogsResponse>({
    queryKey: queryKeys.adminActivityLogs(orgId?.toString() || "", page),
    queryFn: () => orgMemberApi.getAdminActivity(Number(orgId), page),
    enabled: !!orgId,
    // staleTime: 5 * 60 * 1000,
  });
}

// ========== ORG PREVIEW ==========

export function useOrgPreview() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;

  return useQuery<OrgPreviewResponse>({
    queryKey: queryKeys.orgPreview(orgId?.toString() || ""),
    queryFn: () => orgOverviewApi.getPreview(orgId!),
    enabled: !!orgId,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
