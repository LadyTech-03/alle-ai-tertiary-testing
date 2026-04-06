"use client";

import QueryProvider from "@/components/providers/QueryProvider";
import { OrgRefetchProvider } from "@/lib/contexts/org-refetch-context";
import { useAuthStore } from "@/stores";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { orgPaymentsApi } from "@/lib/api/orgs/payments";
import { useOrgPaymentStore } from "@/stores/edu-store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { updateOrganizationDetails } = useAuthStore();
  const { setNextBillingInfo } = useOrgPaymentStore();

  // Refetch organization data (silent background update)
  const refetchOrgData = async () => {
    const { organizationDetails } = useAuthStore.getState();
    if (!organizationDetails?.id) return;

    try {
      const orgId = organizationDetails.id;
      const [response, nextBilling] = await Promise.all([
        orgMemberApi.getOrganization(orgId),
        orgPaymentsApi.getNextBillingDate(),
      ]);
      updateOrganizationDetails(response);

      if (nextBilling.status) {
        setNextBillingInfo(nextBilling.next_billing_date);
      }
    } catch (error) {
      // Silent fail - don't disrupt user experience
      return;
    }
  };

  return (
    <QueryProvider>
      <OrgRefetchProvider value={{ refetchOrgData }}>
        {children}
      </OrgRefetchProvider>
    </QueryProvider>
  );
}
