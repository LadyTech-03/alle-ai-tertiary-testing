import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import {
  orgCoursesApi,
  type CreateCoursePayload,
  type CoursesResponse,
  type ClassGroupsResponse,
  type CreateCourseResponse,
  type CreateClassGroupsBody,
  type CreateClassGroupsResponse,
  type UpdateClassGroupPayload,
  type UpdateClassGroupResponse,
  type CourseFilesResponse,
  type UploadCourseFileResponse,
  type ActiveSessionsResponse,
  type TerminateSessionResponse,
  type DeviceProjectsResponse,
  type SystemUserResponse,
} from "@/lib/api/orgs/courses";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

// Fetch courses
export const useOrgCourses = () => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<CoursesResponse>({
    queryKey: queryKeys.orgCourses(orgId!),
    queryFn: () => orgCoursesApi.getCourses(orgId!),
    enabled: !!orgId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Fetch class groups
export const useOrgClassGroups = () => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<ClassGroupsResponse>({
    queryKey: queryKeys.orgClassGroups(orgId!),
    queryFn: () => orgCoursesApi.getClassGroups(orgId!),
    enabled: !!orgId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Fetch course files
export const useOrgCourseFiles = (courseUuid: string) => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<CourseFilesResponse>({
    queryKey: queryKeys.courseFiles(orgId!, courseUuid),
    queryFn: () => orgCoursesApi.getCourseFiles(orgId!, courseUuid),
    enabled: !!orgId && !!courseUuid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Fetch courses for a specific class group
export const useClassGroupCourses = (slug: string) => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<CoursesResponse>({
    queryKey: queryKeys.classGroupCourses(orgId!, slug),
    queryFn: () => orgCoursesApi.getClassGroupCourses(orgId!, slug),
    enabled: !!orgId && !!slug,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Create course mutation
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<CreateCourseResponse, Error, CreateCoursePayload>({
    mutationFn: (payload: CreateCoursePayload) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.createCourse(orgId, payload);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all courses queries for this org
      queryClient.invalidateQueries({
        queryKey: queryKeys.allOrgCourses(orgId),
      });

      // Invalidate class group courses
      queryClient.invalidateQueries({
        queryKey: queryKeys.allClassGroupCourses(orgId),
      });

      toast.success(data.message || "Course created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create course");
    },
  });
};

// Update course mutation
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<
    CreateCourseResponse,
    Error,
    { courseId: string; payload: CreateCoursePayload }
  >({
    mutationFn: ({ courseId, payload }) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.updateCourse(orgId, courseId, payload);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all courses queries for this org
      queryClient.invalidateQueries({
        queryKey: queryKeys.allOrgCourses(orgId),
      });

      // Invalidate class group courses
      queryClient.invalidateQueries({
        queryKey: queryKeys.allClassGroupCourses(orgId),
      });

      toast.success(data.message || "Course updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update course");
    },
  });
};

// Delete course mutation
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<CreateCourseResponse, Error, string>({
    mutationFn: (courseUuid: string) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.deleteCourse(orgId, courseUuid);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all courses queries for this org
      queryClient.invalidateQueries({
        queryKey: queryKeys.allOrgCourses(orgId),
      });

      // Invalidate class group courses
      queryClient.invalidateQueries({
        queryKey: queryKeys.allClassGroupCourses(orgId),
      });

      toast.success(data.message || "Course deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete course");
    },
  });
};

// Delete class group mutation
export const useDeleteClassGroup = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<
    { status: boolean; message: string },
    Error,
    string
  >({
    mutationFn: (slug: string) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.deleteClassGroup(orgId, slug);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all class groups queries for this org
      queryClient.invalidateQueries({
        queryKey: queryKeys.orgClassGroups(orgId),
      });

      // Invalidate all courses queries for this org (in case of cascade delete)
      queryClient.invalidateQueries({
        queryKey: queryKeys.allOrgCourses(orgId),
      });

      // Invalidate class group courses
      queryClient.invalidateQueries({
        queryKey: queryKeys.allClassGroupCourses(orgId),
      });

      toast.success(data.message || "Class group deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete class group");
    },
  });
};

// Create class groups mutation
export const useCreateClassGroups = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<CreateClassGroupsResponse, Error, CreateClassGroupsBody>({
    mutationFn: (payload: CreateClassGroupsBody) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.createClassGroups(orgId, payload);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all class groups queries for this org
      queryClient.invalidateQueries({
        queryKey: queryKeys.orgClassGroups(orgId),
      });

      toast.success(data.message || "Class groups created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create class groups");
    },
  });
};

// Update class group mutation
export const useUpdateClassGroup = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<
    UpdateClassGroupResponse,
    Error,
    { slug: string; payload: UpdateClassGroupPayload }
  >({
    mutationFn: ({ slug, payload }) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.updateClassGroup(orgId, slug, payload);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all class groups queries for this org
      queryClient.invalidateQueries({
        queryKey: queryKeys.orgClassGroups(orgId),
      });

      toast.success(data.message || "Class group updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update class group");
    },
  });
};

// Upload course file mutation
export const useUploadCourseFile = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<
    UploadCourseFileResponse,
    Error,
    { courseUuid: string; file: File }
  >({
    mutationFn: ({ courseUuid, file }) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.uploadCourseFile(orgId, courseUuid, file);
    },
    onSuccess: (data, variables) => {
      if (!orgId) return;

      // Invalidate course files for this specific course
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseFiles(orgId, variables.courseUuid),
      });

      toast.success(data.message || "File uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });
};

// Fetch active sessions with pagination
export const useActiveSessions = (page: number = 1) => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<ActiveSessionsResponse>({
    queryKey: queryKeys.activeSessions(orgId!, page),
    queryFn: () => orgCoursesApi.getActiveSessions(orgId!, page),
    enabled: !!orgId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

// Fetch device sessions history with pagination
export const useDeviceSessionsHistory = (page: number = 1) => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<ActiveSessionsResponse>({
    queryKey: queryKeys.deviceSessionsHistory(orgId!, page),
    queryFn: () => orgCoursesApi.getDeviceSessionsHistory(orgId!, page),
    enabled: !!orgId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Fetch device projects with pagination
export const useDeviceProjects = (page: number = 1) => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<DeviceProjectsResponse>({
    queryKey: queryKeys.deviceProjects(orgId!, page),
    queryFn: () => orgCoursesApi.getDeviceProjects(orgId!, page),
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Terminate single session mutation
export const useTerminateSession = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<TerminateSessionResponse, Error, string>({
    mutationFn: (sessionId: string) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.terminateSession(orgId, sessionId);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all active sessions queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.allActiveSessions(orgId),
      });

      toast.success(data.message || "Session terminated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to terminate session");
    },
  });
};

// Terminate all sessions mutation
export const useTerminateAllSessions = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<TerminateSessionResponse, Error, void>({
    mutationFn: () => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.terminateAllSessions(orgId);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate all active sessions queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.allActiveSessions(orgId),
      });

      toast.success(data.message || "All sessions terminated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to terminate all sessions");
    },
  });
};

// Fetch system user
export const useSystemUser = () => {
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useQuery<SystemUserResponse>({
    queryKey: queryKeys.systemUser(orgId!),
    queryFn: () => orgCoursesApi.getSystemUser(orgId!),
    enabled: !!orgId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Update system user mutation
export const useUpdateSystemUser = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<
    { status: boolean; message: string },
    Error,
    { email?: string; first_name?: string; last_name?: string }
  >({
    mutationFn: (payload) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.updateSystemUser(orgId, payload);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate system user query
      queryClient.invalidateQueries({
        queryKey: queryKeys.systemUser(orgId),
      });

      toast.success(data.message || "System user updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update system user");
    },
  });
};

// Update device verification code mutation
export const useUpdateDeviceVerificationCode = () => {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((state) =>
    state.organizationDetails?.id?.toString()
  );

  return useMutation<{ status: boolean; message: string }, Error, string>({
    mutationFn: (verificationCode: string) => {
      if (!orgId) throw new Error("Organization not found");
      return orgCoursesApi.updateDeviceVerificationCode(orgId, verificationCode);
    },
    onSuccess: (data) => {
      if (!orgId) return;

      // Invalidate system user query/verification code
      queryClient.invalidateQueries({
        queryKey: queryKeys.systemUser(orgId),
      });

      toast.success(data.message || "Verification code updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update verification code");
    },
  });
};
