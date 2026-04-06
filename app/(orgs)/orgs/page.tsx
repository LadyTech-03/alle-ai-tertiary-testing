"use client";
import { useAuthStore } from "@/stores";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generateOrgSlug } from "@/lib/utils";
import { useOrgRefetch } from "@/lib/contexts/org-refetch-context";
import { LoadingScreen } from "@/components/features/auth/LoadingScreen";

export default function Page() {
  const router = useRouter();
  const { organizationDetails } = useAuthStore();
  const { refetchOrgData } = useOrgRefetch();
  const [isRefetching, setIsRefetching] = useState(true);

  const slug = generateOrgSlug(
    organizationDetails?.name,
    organizationDetails?.slug,
    organizationDetails?.id
  );

  useEffect(() => {
    const redirectToOverview = async () => {
      const targetUrl = `/orgs/${slug}/overview`;

      window.history.replaceState(null, "", targetUrl);

      await refetchOrgData();

      setIsRefetching(false);
      router.replace(targetUrl);
    };

    redirectToOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRefetching) {
    return <LoadingScreen />;
  }

  return null;
}
