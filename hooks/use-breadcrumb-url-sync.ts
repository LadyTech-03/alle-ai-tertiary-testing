import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useOrgMemberStore } from "@/stores/edu-store";

export function useBreadcrumbUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const { breadcrumbPath } = useOrgMemberStore();

  useEffect(() => {
    if (breadcrumbPath.length === 0) {
      router.replace(pathname, { scroll: false });
      return;
    }

    const pathSegments = breadcrumbPath.map((item, index) => {
      if (index === 0) {
        return item.seat_type;
      }
      return item.id.toString();
    });

    const pathString = pathSegments.join(".");

    // Update URL with path
    router.replace(`${pathname}?path=${pathString}`, { scroll: false });
  }, [breadcrumbPath, pathname, router]);
}
