"use client";

import { PlatformChatPreview } from "@/components/features/auth/PlatformChatPreview";
import { PlatformImagePreview } from "@/components/features/auth/PlatformImagePreview";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore, usePendingChatStateStore } from "@/stores";
import { authApi } from "@/lib/api/auth";
import { LoadingScreen } from "@/components/features/auth/LoadingScreen";
import useChatAPIStore from "@/stores/developer-benchmark";
import { orgMemberApi } from "@/lib/api/orgs/members";
import { useOrgPaymentStore } from "@/stores/edu-store";
import { orgPaymentsApi } from "@/lib/api/orgs/payments";
// Define the slides interface
interface Slide {
  id: number;
  component: React.ReactNode;
}

// Add a new background component
const AnimatedBackground = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) return null;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Monochromatic gradient mesh background */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-600/20 to-white/20 animate-gradient" /> */}

      {/* Multiple gradient layers for depth */}
      {/* <div className="absolute inset-0 bg-gradient-radial from-gray-800/10 via-transparent to-transparent animate-pulse-slow" /> */}
      {/* <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent animate-pulse-slower" /> */}

      {/* Floating AI model logos - distributed across the space */}
      <div className="absolute inset-0">
        {[
          "stability-ai",
          "qwen",
          "anthropic",
          "claude-3",
          "deepseek",
          "copilot",
          "dream",
          "gemini",
          "gpt-3-5",
          "gpt-4",
          "grok",
          "kling",
          "luma",
          "meta",
          "mistral-ai",
          "perplexity-ai",
          "amazon",
          "midjourney",
        ].map((logo, index) => (
          <motion.div
            key={logo}
            className="absolute"
            initial={{
              x: Math.random() * (dimensions.width / 2),
              y: Math.random() * dimensions.height,
              opacity: 0.8,
              scale: 0.8 + Math.random() * 0.4,
            }}
            animate={{
              x: [
                Math.random() * (dimensions.width / 2),
                Math.random() * (dimensions.width / 2),
              ],
              y: [
                Math.random() * dimensions.height,
                Math.random() * dimensions.height,
              ],
              opacity: [0.6, 0.8, 0.6],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <div className="relative group">
              <div className="absolute inset-0 rounded-full blur-xs group-hover:blur-sm transition-all duration-300" />
              <Image
                src={`/models/${logo}.webp`}
                alt={logo}
                width={48}
                height={48}
                className="rounded-full opacity-100 dark:opacity-100 group-hover:opacity-100 transition-all duration-300 relative z-10"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced grid pattern */}
      {/* <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" /> */}

      {/* Floating particles with varied sizes */}
      {/* <motion.div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              i % 3 === 0
                ? "bg-gray-300"
                : i % 3 === 1
                ? "bg-gray-400"
                : "bg-white"
            }`}
            style={{
              width: 2 + Math.random() * 3 + "px",
              height: 2 + Math.random() * 3 + "px",
            }}
            initial={{
              x: Math.random() * (dimensions.width / 2),
              y: Math.random() * dimensions.height,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              x: Math.random() * (dimensions.width / 2),
              y: Math.random() * dimensions.height,
              scale: [0, 1, 0],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: Math.random() * 3,
            }}
          />
        ))}
      </motion.div> */}

      {/* Enhanced glowing orbs */}
      {/* <div className="absolute inset-0">
        <motion.div
          className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-72 h-72 bg-gray-800/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-56 h-56 bg-gray-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div> */}
    </div>
  );
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFirstAnimationComplete, setIsFirstAnimationComplete] =
    useState(false);
  const [isSecondAnimationComplete, setIsSecondAnimationComplete] =
    useState(false);
  const router = useRouter();
  const { setNextBillingInfo } = useOrgPaymentStore();
  const {
    token,
    setAuth,
    clearAuth,
    setOrganizationDetails,
    updateOrganizationDetails,
    organizationDetails,
  } = useAuthStore();
  const [authState, setAuthState] = useState<
    "checking" | "show-auth" | "redirect"
  >("checking");
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const { userId, setUserId } = useChatAPIStore();
  const { pending } = usePendingChatStateStore();
  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // console.log(" making api call inide aut layout")
          // console.log(useAuthStore.getState().organizationDetails)
          // console.log("Token exists, checking authentication...");
          const response = await authApi.getUser();
          // console.log("Auth check response:", response);
          console.log("layout auth response", response);
          setAuth(response.data.user, token, response.plan);
          setOrganizationDetails(response.organisationDetails || null);
          const orgId = response.organisationDetails?.id;
          // Handle specific redirects from API
          if (response.data.to === "verify-email") {
            // Stay on auth page but switch to verification mode
            setAuthState("show-auth");

            // Update URL to include verification parameters
            const url = new URL(window.location.href);
            url.searchParams.set("mode", "verify-email");
            url.searchParams.set("email", response.data.user.email);
            window.history.replaceState({}, "", url.toString());
          } else if (response.data.to === "admin-dashboard") {
            // console.log("Redirecting to admin dashboard", response.data);
            // check his permission if empty return him to chat
            const orgslud = response.organisationDetails?.slug;

            if (orgslud) {
              // console.log("org id", orgId);
              try {
                const response = await orgMemberApi.getOrganization(orgId!);
                // console.log(response);
                // Update the organization details in the store
                updateOrganizationDetails(response);

                // Only fetch nextBilling if user is owner (check from store)
                if (organizationDetails?.is_owner) {
                  try {
                    const nextBilling =
                      await orgPaymentsApi.getNextBillingDate();
                    if (nextBilling.status) {
                      setNextBillingInfo(nextBilling.next_billing_date);
                    }
                  } catch (billingError) {
                    // Non-critical error, continue
                  }
                }

                router.replace(`/orgs/${orgslud}/overview`);
                setAuthState("redirect");
              } catch (er) {
                // console.error("Access check failed:", er);
                clearAuth();
                setAuthState("show-auth");
              }
            }
          }
           else if (response.data.to === "member-dashboard") {
            // Redirect to subscription ended page
            const orgslug = response.organisationDetails?.slug;
            if (orgslug) {
              router.replace(`/orgs/${orgslug}/subscription-ended`);
              setAuthState("redirect");
            } else {
              // Fallback if no org slug
              clearAuth();
              setAuthState("show-auth");
            }
          } else if (response.data.to === "chat" && response.plan) {
            // this is to make sure different users dont share same history cached data
            if (!userId) {
              setUserId(response.data.user.email);
            }
            const returnUrl = sessionStorage.getItem("returnUrl");

            if (returnUrl) {
              sessionStorage.removeItem("returnUrl");
              router.replace(returnUrl);
            } else {
              // Handle custom plan redirection
              if (response.plan && response.plan.startsWith("custom_")) {
                const planParts = response.plan.split("_");
                // Find the first content type (skip 'custom' and billing cycle parts)
                const contentTypes = planParts.filter((part) =>
                  ["chat", "image", "audio", "video"].includes(part)
                );

                if (contentTypes.length > 0) {
                  // Redirect to the first content type
                  router.replace(`/${contentTypes[0]}`);
                } else {
                  // Fallback to chat if no valid content type found
                  router.replace("/chat");
                }
              } else {
                // Default behavior for non-custom plans
                if (pending && pending.link) {
                  router.replace(pending.link || "/chat");
                } else {
                  router.replace("/chat");
                }
              }
            }
            setAuthState("redirect");
          } else if (!response.plan) {
            // User needs to select a plan
            if (!userId) {
              setUserId(response.data.user.email);
            }
            router.replace("/plans");
            setAuthState("redirect");
          }
        } catch (error: any) {
          // toast.error(error.response.data.error || error.response.data.message || 'Failed to load your data');
          // console.error("Failed to load your data:", error);
          clearAuth();
          setAuthState("show-auth");
        }
      } else {
        setAuthState("show-auth");
      }
    };

    checkAuth();
  }, []);

  // Define your slides with the new prop
  const slides: Slide[] = [
    {
      id: 0,
      component: (
        <PlatformChatPreview
          onAnimationComplete={() => {
            setIsFirstAnimationComplete(true);
          }}
        />
      ),
    },
    {
      id: 1,
      component: (
        <PlatformImagePreview
          onAnimationComplete={() => {
            setIsSecondAnimationComplete(true);
          }}
        />
      ),
    },
  ];

  // Modify the effect to handle both animations
  useEffect(() => {
    if (isFirstAnimationComplete && currentSlide === 0) {
      // First animation is done, move to second slide
      const timer = setTimeout(() => {
        setCurrentSlide(1);
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (isSecondAnimationComplete && currentSlide === 1) {
      // Both animations are done, start the loop
      const timer = setTimeout(() => {
        setCurrentSlide(0);
        // Reset animation states for next loop
        setIsFirstAnimationComplete(false);
        setIsSecondAnimationComplete(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFirstAnimationComplete, isSecondAnimationComplete, currentSlide]);

  // Don't render anything while checking auth
  if (authState === "checking" || authState === "redirect") {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth Forms */}
      <div className="w-full xl:w-1/3 2xl:w-1/2 p-6 xs:p-10 md:mt-10">
        {children}
      </div>

      {/* Updated right side - hidden on mobile */}
      <div className="hidden md:block xl:w-2/3 relative overflow-hidden bg-background pointer-events-none">
        <AnimatedBackground />

        {/* Content wrapper with glassmorphism */}
        <div className="absolute inset-0 backdrop-blur-[1px]">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="h-full w-full absolute top-0 left-0"
              >
                {slides[currentSlide].component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Updated navigation dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(slide.id)}
              className={`w-2 h-2 rounded-full transition-all duration-300 backdrop-blur-sm ${currentSlide === slide.id
                  ? "bg-white/90 w-4"
                  : "bg-white/50 hover:bg-white/70"
                }`}
              aria-label={`Go to slide ${slide.id + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
