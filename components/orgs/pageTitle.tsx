"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function OrgPageTitle() {
  const pathname = usePathname();
  const { organizationDetails } = useAuthStore();

  useEffect(() => {
    // Only handle organization routes
    if (!pathname.startsWith("/orgs/")) return;

    const baseTitle = "Alle-AI";
    let pageTitle = "Organization";

    const parts = pathname.split("/");
    // /orgs/[slug]/[section]
    if (parts.length >= 3) {
      const orgSlug = parts[2];
      const section = parts[3] || "overview";

      let orgName = orgSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      if (organizationDetails?.slug === orgSlug && organizationDetails?.name) {
        orgName = organizationDetails.name;
      }

      let sectionName = section.charAt(0).toUpperCase() + section.slice(1);
      if (section === "usage") sectionName = "Usage & Activity";

      // Option 2: Organization First
      pageTitle = `${orgName} - ${sectionName}`;
    }

    document.title = `${pageTitle} - ${baseTitle}`;
  }, [pathname, organizationDetails]);

  return null;
}
