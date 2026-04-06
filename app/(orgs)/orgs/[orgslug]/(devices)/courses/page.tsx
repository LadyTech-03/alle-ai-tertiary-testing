"use client";

import React, { useEffect } from "react";
import {
  useOrgCourses,
  useOrgClassGroups,
} from "@/hooks/use-org-course";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import type { ClassGroup } from "@/lib/api/orgs/courses";
import CoursesList, { CourseData } from "@/components/orgs/courses/courses-list";

export default function Page() {
  // Fetch courses from backend
  const { data: coursesData, isLoading } = useOrgCourses();
  const rawCourses = coursesData?.data;
  const courses = (
    Array.isArray(rawCourses)
      ? rawCourses
      : rawCourses
        ? Object.values(rawCourses)
        : []
  ) as CourseData[];

  // Fetch class groups
  const { data: classGroupsData } = useOrgClassGroups();

  const setLoadingCourses = useCoursesSessionsStore(
    (state) => state.setLoadingCourses
  );
  const setShowSearchInput = useCoursesSessionsStore(
    (state) => state.setShowSearchInput
  );

  // Sync loading state to store for layout buttons
  useEffect(() => {
    setLoadingCourses(isLoading);
  }, [isLoading, setLoadingCourses]);

  // Ensure search input is visible on this page
  useEffect(() => {
    setShowSearchInput(true);
  }, [setShowSearchInput]);

  // Get unique classes from class groups API
  const rawClassGroups = classGroupsData?.data;
  const classGroups = (Array.isArray(rawClassGroups)
    ? rawClassGroups
    : rawClassGroups
      ? Object.values(rawClassGroups)
      : []) as ClassGroup[];

  const uniqueClasses = classGroups
    .map((group: ClassGroup) => ({ name: group.name, slug: group.slug }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <CoursesList
      courses={courses}
      isLoading={isLoading}
      uniqueClasses={uniqueClasses}
    />
  );
}
