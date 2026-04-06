"use client";
import { useEffect } from "react";
import { useOrgUsage } from "@/hooks/use-org-queries";
import OrgUsage from "@/components/orgs/pages/org-usage";
import UsagePageSkeleton from "@/components/orgs/pages/usagePage-skeleton";

export default function Page() {
  const { data, isLoading, refetch } = useOrgUsage();

  useEffect(() => {
    if (data?.action === "refresh") {
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data, refetch]);

  if ((isLoading && !data) || (data?.action === "refresh")) {
    return <UsagePageSkeleton />;
  }

  if (!data) {
    return <UsagePageSkeleton />;
  }

  return <OrgUsage data={data} />;
}
