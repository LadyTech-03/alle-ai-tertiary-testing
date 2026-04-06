"use client";

import { createContext, useContext, ReactNode } from "react";
import { authApi } from "@/lib/api/auth";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, useProjectStore } from "@/stores";
import { useCoursesSessionsStore } from "@/stores/courses-sessions-store";
import { useEduLoginStore } from "@/stores/edu-store";
import {
  useHistoryStore,
  useContentStore,
  useUsageRestrictionsStore,
  usePendingChatStateStore,
} from "@/stores";

import { useOrgMemberStore, useOrgPaymentStore } from "@/stores/edu-store";

import { toast } from "sonner";

// Add this function to clear localStorage directly for specific stores
const clearSpecificStores = () => {
  // Clear audio category selection store
  localStorage.removeItem("audio-category-selection-store");

  // Clear content store
  localStorage.removeItem("content-storage");

  // Clear generated images store
  localStorage.removeItem("generated-images-storage");

  // Clear generated audio store
  localStorage.removeItem("generated-audio-storage");

  // Clear video generation store
  localStorage.removeItem("video-generation-store");

  // Reset specific stores using their APIs
  // useWebSearchStore.getState().setIsWebSearch(false);
  // useCombinedModeStore.getState().setIsCombinedMode(false);
  // useCompareModeStore.getState().setIsCompareMode(false);

  // Reset usage restrictions
  const restrictionsStore = useUsageRestrictionsStore.getState();
  restrictionsStore.clearRestriction("chat");
  restrictionsStore.clearRestriction("image");
  restrictionsStore.clearRestriction("audio");
  restrictionsStore.clearRestriction("video");
  restrictionsStore.clearRestriction("combine");
  restrictionsStore.clearRestriction("compare");

  // Reset sidebar section IDs
  // const sidebarStore = useSidebarStore.getState();
  // sidebarStore.setSectionId('chatId', null);
  // sidebarStore.setSectionId('imageId', null);
  // sidebarStore.setSectionId('audioId', null);
  // sidebarStore.setSectionId('videoId', null);
};

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  ip_address: string;
  user_agent: string;
  registration_type: string;
  email_verified_at?: string | null;
}

interface RegisterResponse {
  status: boolean;
  error?: string;
  message?: string;
  data: {
    to: string;
    token: string;
    user: User;
  };
}

interface OrganizationDetails {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  organisation_plan: string;
  user_role: string;
  is_owner: boolean;
  user_permissions: string[];
}

interface VerificationResponse {
  data: {
    user: User;
    to: string;
    token: string;
    organisationDetails?: OrganizationDetails | null;
    exchange_code?: string;
  };
  is_valid: boolean;
  message: string;
  error?: string;
  status: boolean;
  success?: boolean;
}

interface LoginResponse {
  status: boolean;
  error?: string;
  data: {
    to: string;
    token: string;
    user: User;
    exchange_code?: string;
  };
}

interface DeleteAccountResponse {
  status: boolean;
  message: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<RegisterResponse["data"] | void>;
  logout: () => Promise<void>;
  verifyEmail: (
    code: string,
    loginType: "org" | "client",
    email: string
  ) => Promise<void>;
  deleteAccount: (password: string) => Promise<DeleteAccountResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    setAuth,
    clearAuth,
    isLoading,
    setLoading,
    refreshPlan,
    isAuthenticated,
    setOrganizationDetails,
  } = useAuthStore();

  const { pending } = usePendingChatStateStore();
  // useEffect(()=>{
  //   refreshPlan();
  // },[])

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      const response = await authApi.login({ email, password });

      // Always set the basic auth state
      setAuth(response.data.user, response.data.token, response.data.plan);

      // Handle routing based on response
      if (response.data.to === "verify-email") {
        // Handling of email verification will happen on the sign-in form.
        return response;
      }

      // Check for return URL
      const returnUrl = sessionStorage.getItem("returnUrl");

      // User is verified, check where to redirect
      if (response.data.to === "chat") {
        if (returnUrl) {
          sessionStorage.removeItem("returnUrl");
          router.push(returnUrl);
        } else {
          // Check if it's a custom plan and redirect accordingly
          if (response.data.plan && response.data.plan.startsWith("custom_")) {
            const planParts = response.data.plan.split("_");
            // Find the first content type (skip 'custom' and billing cycle parts)
            const contentTypes = planParts.filter((part) =>
              ["chat", "image", "audio", "video"].includes(part)
            );

            if (contentTypes.length > 0) {
              // Redirect to the first content type
              router.push(`/${contentTypes[0]}`);
            } else {
              // Fallback to chat if no valid content type found
              router.push("/chat");
            }
          } else {
            if (!isAuthenticated && pending) {
              router.push(pending.link || "/chat");
            } else {
              router.push("/chat");
            }
          }
          refreshPlan();
        }
      } else if (response.data.to === "plans") {
        router.push("/plans");
      }

      return response;
    } catch (error: any) {
      // toast.error(error.response?.data?.error || error.response?.data?.message || 'Login failed, please try again');
      throw error;
    }
  };

  const register = async (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<RegisterResponse["data"] | void> => {
    try {
      const response = await authApi.register(data);

      if (!response.status) {
        throw new Error(
          response.message || "Registration failed, please try again"
        );
      }

      // Set initial auth state
      setAuth(response.data.user, response.data.token);

      // New registrations always need verification
      return response.data;
    } catch (error: any) {
      // toast.error(error.response?.data?.error || error.response?.data?.message || 'Registration failed, please try again');
      // console.log(error, 'registration error from provider')
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Set loading state first
      setLoading(true);

      // Call logout API
      await authApi.logout();

      // Clear auth state and redirect in one go
      clearAuth();
      clearSpecificStores();

      useHistoryStore.getState().clearHistory(); // Clear history
      useProjectStore.getState().clearProjects();
      useOrgMemberStore.getState().clearBreadcrumb(); // Clear org navigation
      useOrgPaymentStore.getState().resetPaymentStore(); // Clear payment store
      useCoursesSessionsStore.getState().clearCourseAndClassData(); // Clear courses and sessions store
      useEduLoginStore.getState().clearLoginData();
      router.replace("/auth");
      setLoading(false);
    } catch (error: any) {
      // toast.error(error.response?.data?.message || 'Logout failed, please try again');
      // console.log(error, 'logout error from provider')
      setLoading(false);
      throw error;
    }
  };

  const verifyEmail = async (
    code: string,
    loginType: "org" | "client",
    email: string
  ): Promise<void> => {
    try {
      const response: VerificationResponse = await authApi.verifyEmail(
        {
          code: code,
          email: email,
        },
        loginType
      );
      // for org logins
      if (loginType === "org") {
        if (!response.success) {
          throw new Error(
            response.error || "Verification failed, please try again"
          );
        }

        if (response.success) {
          if (response.data.to === "edu_device_chat") {
            const orgId = response.data.organisationDetails?.id;
            const exchangeCode = response.data.exchange_code;
            const redirectUrl = `http://localhost:3001/auth?org_id=${orgId}&aiptotp=${exchangeCode}`;
            window.location.href = redirectUrl;
            return;
          }

          setAuth(response.data.user, response.data.token);
          setOrganizationDetails(response.data.organisationDetails ?? null);
          router.replace("/chat");
          return;
        } else {
          throw new Error(response.message || "Invalid verification code");
        }
      }

      // *******************************************************************

      // client side --nothing changes - just as you implemented
      if (!response.status && response.error) {
        throw new Error(
          response.error || "Verification failed, please try again"
        );
      }

      if (!response.is_valid) {
        throw new Error(response.message || "Invalid verification code");
      }

      if (response.is_valid) {
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
          throw new Error("No authentication token found");
        }
        setAuth(response.data.user, currentToken);
        console.log("client verification success redirect here ");
        router.push("/plans");
        return;
      } else {
        throw new Error(response.message || "Invalid verification code");
      }
    } catch (error: any) {
      // toast.error(error.response?.data?.error || error.response?.data?.message || 'Verification failed, please try again');
      // console.log(error, 'verification error from provider')
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      const response = await authApi.deleteAccount(password);
      if (!response.status) {
        throw new Error(
          response.message || "Delete account failed, please try again"
        );
      }

      if (response.status) {
        logout();
        toast.success(response.message || "Account deleted successfully");
      }
      return response;
    } catch (error: any) {
      // toast.error(error.response?.data?.error || error.response?.data?.message || 'Delete account failed, please try again');
      // console.log(error, 'delete account error from provider')
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: useAuthStore.getState().user,
        isLoading,
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        login,
        register,
        logout,
        verifyEmail,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
