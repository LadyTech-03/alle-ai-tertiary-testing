"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/features/auth/LoadingScreen";
import PageBreadcrumb from "@/components/orgs/pageBreadcum";
import OrgLayout from "@/components/layout/org-layout";
import { useAuthStore } from "@/stores";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { useRouter, usePathname } from "next/navigation";
import { useOrgPaymentStore } from "@/stores/edu-store";
import { orgPaymentsApi } from "@/lib/api/orgs/payments";
import OrgPageTitle from "@/components/orgs/pageTitle";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationDetails, updateOrganizationDetails } = useAuthStore();
  const [accessLevel, setAccessLevel] = useState<
    "checking" | "passed" | "failed"
  >("checking");
  const router = useRouter();
  const pathname = usePathname();
  const { setNextBillingInfo } = useOrgPaymentStore();

  // Check if current route is subscription-ended
  const isSubscriptionEndedPage = pathname?.includes("/subscription-ended");

  useEffect(() => {
    // Skip access checks for subscription-ended page
    if (isSubscriptionEndedPage) {
      setAccessLevel("passed");
      return;
    }

    if (!organizationDetails) {
      router.push("/auth");
      setAccessLevel("failed");
      return;
    }

    const checkAccess = async () => {
      const orgId = organizationDetails.id;
      // backend did not combined the data during login which excludes organization details
      // if there is email meaning its already been cached
      if (
        (organizationDetails?.is_owner ||
          organizationDetails?.user_role === "admin") &&
        organizationDetails?.email
      ) {
        setAccessLevel("passed");
        return;
      }

      const isAdmin = organizationDetails.user_role === "admin";
      const isOwner = organizationDetails.is_owner;

      if (!isAdmin && !isOwner) {
        setAccessLevel("failed");
        router.replace("/chat");
        return;
      }

      try {
        const response = await orgMemberApi.getOrganization(orgId);
        updateOrganizationDetails(response);

        // Only fetch nextBilling if user is owner
        if (organizationDetails.is_owner) {
          try {
            const nextBilling = await orgPaymentsApi.getNextBillingDate();
            if (nextBilling.status) {
              setNextBillingInfo(nextBilling.next_billing_date);
            }
          } catch (billingError) {
            // Non-critical error, continue
          }
        }

        setAccessLevel("passed");
        return;
      } catch (er) {
        setAccessLevel("failed");
        router.replace("/chat");
        return;
      }
    };
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscriptionEndedPage]);

  // If on subscription-ended page, render without layout
  if (isSubscriptionEndedPage) {
    return <>{children}</>;
  }

  if (
    !organizationDetails ||
    accessLevel === "checking" ||
    accessLevel === "failed"
  ) {
    return <LoadingScreen />;
  }

  return (
    <OrgLayout>
      <OrgPageTitle />
      <PageBreadcrumb excludePages={["members"]} />
      {children}
    </OrgLayout>
  );
}
