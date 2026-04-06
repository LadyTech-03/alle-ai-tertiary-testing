"use client";

import { useEffect } from "react";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import { useOrgCourseFiles } from "@/hooks/use-org-course";
import RenderCoursesFiles from "@/components/orgs/render-courses-files";

export default function Page() {
  const setShowSearchInput = useCoursesSessionsStore(
    (state) => state.setShowSearchInput
  );

  // Extract course data from store
  const currentCourse = useCoursesSessionsStore((state) => state.currentCourse);
  const courseUuid = currentCourse?.uuid || "";

  // Fetch course files
  const { data: courseFilesData, isLoading } = useOrgCourseFiles(courseUuid);
  const files = courseFilesData?.data || [];

  useEffect(() => {
    setShowSearchInput(false);

    return () => {
      setShowSearchInput(true);
    };
  }, [setShowSearchInput]);

  // Transform API data to component format
  const transformedFiles = files.map((file) => ({
    id: parseInt(file.uuid.substring(0, 8), 16), // Generate numeric ID from uuid
    name: file.file_name,
    type: file.file_extension?.replace(".", "") || "unknown",
    size: parseInt(file.file_size) || 0,
    created: new Date(file.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));

  return <RenderCoursesFiles files={transformedFiles} isLoading={isLoading} />;
}
