"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useClassGroupCourses } from "@/hooks/use-org-course";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import CoursesList, { CourseData } from "@/components/orgs/courses/courses-list";

export default function ClassCoursesPage() {
    const params = useParams();
    const classSlug = params.classSlug as string;

    // Use the new hook to fetch courses for this specific class group
    const { data: coursesData, isLoading } = useClassGroupCourses(classSlug);

    const rawCourses = coursesData?.data;
    const courses = (
        Array.isArray(rawCourses)
            ? rawCourses
            : rawCourses
                ? Object.values(rawCourses)
                : []
    ) as CourseData[];

    const setPreSelectedClassSlug = useCoursesSessionsStore(
        (state) => state.setPreSelectedClassSlug
    );
    const setShowSearchInput = useCoursesSessionsStore(
        (state) => state.setShowSearchInput
    );
    const setLoadingCourses = useCoursesSessionsStore(
        (state) => state.setLoadingCourses
    );

    // Sync loading state and ensure search input is visible
    useEffect(() => {
        setLoadingCourses(isLoading);
        setShowSearchInput(true);
    }, [isLoading, setLoadingCourses, setShowSearchInput]);

    // Set the pre-selected class slug in the store when this page mounts
    // This ensures that if the user clicks "Add Course", the modal knows which class to pre-fill
    useEffect(() => {
        if (classSlug) {
            setPreSelectedClassSlug(classSlug);
        }
        return () => {
            // Optional: Clear it when leaving the page if we want strict isolation
            // But the store persistence might be desired. 
            // For now, let's leave it or maybe clear it on unmount if we want "View Class" to be ephemeral context.
            // The user asked for persistence, so maybe we DON'T clear it on unmount immediately,
            // but rely on explicit navigation or the clear function.
            // However, if I navigate back to "All Courses", I might want to clear it?
            // actually "All Courses" page doesn't set it, so it might remain stuck.
            // Let's safe guard: update it whenever we are on a page.
        };
    }, [classSlug, setPreSelectedClassSlug]);

    return (
        <CoursesList
            courses={courses}
            isLoading={isLoading}
            initialClassSlug={classSlug}
            hideClassFilter={true}
        />
    );
}
