"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/stores";

export default function ProjectsPage() {
  const router = useRouter();
  const { currentProject } = useProjectStore();

  // If there's a current project, redirect to it
  useEffect(() => {
    if (currentProject) {
      router.push(`/project/${currentProject.uuid}`);
    }
  }, [currentProject, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold">Select a project</h1>
      <p className="text-muted-foreground">
        Choose a project from the sidebar or create a new one
      </p>
    </div>
  );
}