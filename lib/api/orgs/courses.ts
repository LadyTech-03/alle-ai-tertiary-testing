import api from "../axios";

export interface CreateCoursePayload {
  name: string;
  description: string | null;
  instructions: string | null;
  class_group: string;
}

export interface CourseIdentifiers {
  id: number;
  uuid: string;
}

export type Course = CreateCoursePayload & CourseIdentifiers;

export interface CreateCourseResponse {
  status: boolean;
  message: string;
  data: Course;
}

export interface CoursesResponse {
  data: Course[];
}

export interface ClassGroup {
  name: string;
  slug: string;
  admin_id: number;
}

export interface ClassGroupsResponse {
  status: boolean;
  data: ClassGroup[];
}

export interface CreateClassGroupPayload {
  name: string;
  free_chat: boolean;
  slug?: string;
  admin_id?: number;
}

export interface CreateClassGroupsBody {
  class_groups: CreateClassGroupPayload[];
}

export interface CreateClassGroupsResponse {
  status: boolean;
  message: string;
  data?: ClassGroup[];
}

export interface UpdateClassGroupPayload {
  name: string;
  free_chat: boolean;
}

export interface UpdateClassGroupResponse {
  status: boolean;
  message: string;
  data?: ClassGroup;
}

export interface DeleteClassGroupResponse {
  status: boolean;
  message: string;
}

export interface UploadCourseFileResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface CourseFile {
  uuid: string;
  file_name: string;
  file_size: string;
  file_type: string | null;
  file_extension: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseFilesResponse {
  status: boolean;
  data: CourseFile[];
}

export interface SessionUser {
  name: string;
  class_group: string;
}

export interface DeviceSession {
  device_session: string;
  organisation_id: number;
  session_user: SessionUser;
  ended_at: string | null;
  created_at: string;
  is_active: boolean;
  time_spent: string | null;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface ActiveSessionsResponse {
  data: DeviceSession[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface TerminateSessionResponse {
  status: boolean;
  message: string;
}

export interface DeviceProject {
  id: number;
  uuid: string;
  name: string;
  instructions: string | null;
  color_code: string | null;
  description: string | null;
  shared: boolean;
  shared_at: string | null;
  last_share: string | null;
}

export interface DeviceProjectsResponse {
  data: DeviceProject[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface SystemUserResponse {
  status: boolean;
  message: string;
  data: {
    email: string;
    first_name: string;
    last_name: string;
    device_verification_code: string;
  };
}

export const orgCoursesApi = {
  getCourses: async (orgId: string): Promise<CoursesResponse> => {
    const response = await api.get(`/organisations/${orgId}/courses`);
    return response.data;
  },
  createCourse: async (
    orgId: string,
    payload: CreateCoursePayload
  ): Promise<CreateCourseResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/create-course`,
      payload
    );
    return response.data;
  },
  getClassGroups: async (orgId: string): Promise<ClassGroupsResponse> => {
    const response = await api.get(`/organisations/${orgId}/class-groups`);
    return response.data;
  },
  createClassGroups: async (
    orgId: string,
    payload: CreateClassGroupsBody
  ): Promise<CreateClassGroupsResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/class-groups`,
      payload
    );
    return response.data;
  },
  updateClassGroup: async (
    orgId: string,
    slug: string,
    payload: UpdateClassGroupPayload
  ): Promise<UpdateClassGroupResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/class-groups/${slug}/update`,
      payload
    );
    return response.data;
  },
  deleteClassGroup: async (
    orgId: string,
    slug: string
  ): Promise<DeleteClassGroupResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/class-groups/${slug}/delete`
    );
    return response.data;
  },
  getClassGroupCourses: async (
    orgId: string,
    slug: string
  ): Promise<CoursesResponse> => {
    const response = await api.get(
      `/organisations/${orgId}/class-group/${slug}/courses`
    );
    return response.data;
  },
  updateCourse: async (
    orgId: string,
    courseId: string,
    payload: CreateCoursePayload
  ): Promise<CreateCourseResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/update-course/${courseId}`,
      payload
    );
    return response.data;
  },
  deleteCourse: async (
    orgId: string,
    courseUuid: string
  ): Promise<CreateCourseResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/delete-course/${courseUuid}`
    );
    return response.data;
  },
  uploadCourseFile: async (
    orgId: string,
    courseUuid: string,
    file: File
  ): Promise<UploadCourseFileResponse> => {
    const formData = new FormData();
    formData.append("course_uuid", courseUuid);
    formData.append("file", file);

    const response = await api.post(
      `/organisations/${orgId}/upload-course-file`,
      formData
    );
    return response.data;
  },
  getCourseFiles: async (
    orgId: string,
    courseUuid: string
  ): Promise<CourseFilesResponse> => {
    const response = await api.get(
      `/organisations/${orgId}/course-files/${courseUuid}`
    );
    return response.data;
  },
  getActiveSessions: async (
    orgId: string,
    page?: number
  ): Promise<ActiveSessionsResponse> => {
    const response = await api.get(
      `/organisations/${orgId}/active-device-sessions`,
      {
        params: { page },
      }
    );
    return response.data;
  },
  getDeviceSessionsHistory: async (
    orgId: string,
    page?: number
  ): Promise<ActiveSessionsResponse> => {
    const response = await api.get(`/organisations/${orgId}/device-sessions`, {
      params: { page },
    });
    return response.data;
  },
  terminateSession: async (
    orgId: string,
    sessionId: string
  ): Promise<TerminateSessionResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/terminate-device-sessions/${sessionId}`
    );
    return response.data;
  },
  terminateAllSessions: async (
    orgId: string
  ): Promise<TerminateSessionResponse> => {
    const response = await api.post(
      `/organisations/${orgId}/terminate-device-sessions`
    );
    return response.data;
  },
  getDeviceProjects: async (
    orgId: string,
    page?: number
  ): Promise<DeviceProjectsResponse> => {
    const response = await api.get(`/organisations/${orgId}/device-projects`, {
      params: { page },
    });
    return response.data;
  },
  updateDeviceVerificationCode: async (
    orgId: string,
    verificationCode: string
  ): Promise<{ status: boolean; message: string }> => {
    const response = await api.post(
      `/organisations/${orgId}/update-device-verification`,
      { device_verification_code: verificationCode }
    );
    return response.data;
  },
  updateSystemUser: async (
    orgId: string,
    payload: {
      email?: string;
      first_name?: string;
      last_name?: string;
    }
  ): Promise<{ status: boolean; message: string }> => {
    const response = await api.post(
      `/organisations/${orgId}/system-user/update`,
      payload
    );
    return response.data;
  },
  getSystemUser: async (orgId: string): Promise<SystemUserResponse> => {
    const response = await api.get(`/organisations/${orgId}/system-user`);
    return response.data;
  },
};
