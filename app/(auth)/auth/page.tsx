"use client";

import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";
import { ResetPasswordSuccess } from "@/components/features/auth/ResetPasswordSuccess";
import { VerificationCodeForm } from "@/components/features/auth/VerificationCodeForm";
import { useTheme } from "next-themes";
import { OrganizationLoginForm } from "@/components/features/auth/OrganizationLoginForm";

// import { useAuthCheck } from "@/hooks/use-auth-check";

import { LoadingScreen } from "@/components/features/auth/LoadingScreen";
import { usePendingChatStateStore } from "@/stores";
import { sendGAEvent } from "@next/third-parties/google";

type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-success"
  | "verify-email"
  | "org-login";

// Heading texts moved outside component to avoid useEffect dependency warning
const headingTexts = [
  "Your All-in-One AI Platform",
  "Combine & Compare AI models",
  "Goodbye to AI Hallucinations",
  "Fact-Check AI Response",
];

// Create an inner component for the auth page logic
function AuthPageInner() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [resetEmail, setResetEmail] = useState<string>("");
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const { theme, resolvedTheme } = useTheme();
  const router = useRouter();
  const { setPending } = usePendingChatStateStore();
  const [loginType, setLoginType] = useState<"client" | "org">("client");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;
    let currentChar = 0;

    const typeText = () => {
      if (currentChar <= headingTexts[currentTextIndex].length) {
        setDisplayText(headingTexts[currentTextIndex].slice(0, currentChar));
        currentChar++;
        timeout = setTimeout(typeText, 50); // Adjust typing speed here
      } else {
        // Wait before starting to erase
        timeout = setTimeout(eraseText, 5000);
      }
    };

    const eraseText = () => {
      if (currentChar > 0) {
        setDisplayText(headingTexts[currentTextIndex].slice(0, currentChar));
        currentChar--;
        timeout = setTimeout(eraseText, 30); // Adjust erasing speed here
      } else {
        // Move to next text
        setCurrentTextIndex((prev) => (prev + 1) % headingTexts.length);
      }
    };

    typeText();

    return () => clearTimeout(timeout);
  }, [currentTextIndex]);

  useEffect(() => {
    setMounted(true);

    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const emailParam = params.get("email");
    const redirectUrl =
      params.get("redirect") || params.get("returnUrl") || params.get("return");

    // Store redirect URL if provided
    if (redirectUrl) {
      setPending({
        link: redirectUrl,
      });
      // Also store in sessionStorage as backup
      sessionStorage.setItem("returnUrl", redirectUrl);
    }

    // Set auth mode based on URL parameter
    if (mode === "verify-email" && emailParam) {
      setAuthMode("verify-email");
      setEmail(emailParam);
    } else if (mode === "login") {
      setAuthMode("login");
    } else if (mode === "signup" || mode === "register") {
      setAuthMode("register");
    } else if (mode === "forgot-password") {
      setAuthMode("forgot-password");
    } else if (mode === "organization") {
      setAuthMode("org-login");
    }
  }, [setPending]);

  const updateUrlMode = (mode: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", mode);
    // Preserve redirect parameter if it exists
    const redirectUrl =
      new URLSearchParams(window.location.search).get("redirect") ||
      new URLSearchParams(window.location.search).get("returnUrl") ||
      new URLSearchParams(window.location.search).get("return");
    if (redirectUrl && !url.searchParams.has("redirect")) {
      url.searchParams.set("redirect", redirectUrl);
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleSwitchToLogin = () => {
    setAuthMode("login");
    updateUrlMode("login");
  };

  const handleSwitchToRegister = () => {
    setAuthMode("register");
    updateUrlMode("signup");
  };

  const handleForgotPassword = () => {
    setAuthMode("forgot-password");
    updateUrlMode("forgot-password");
    sendGAEvent("formSubmission", "forgottenPassword", {
      formType: "loginForm",
    });
  };

  const handleResetSuccess = (email: string) => {
    setResetEmail(email);
    setAuthMode("reset-success");
    updateUrlMode("reset-success");
  };

  const handleVerification = (
    email: string,
    type: "client" | "org",
    organisation_name?: string,
    organisation_logo?: string,
    user_name?: string
  ) => {
    setEmail(email);
    setLoginType(type);
    // console.log(organisation_logo,organisation_name,user_name);

    // console.log('useTempdata in auth page',useTempdata);
    setAuthMode("verify-email");

    const url = new URL(window.location.href);
    url.searchParams.set("mode", "verify-email");
    url.searchParams.set("email", email);
    window.history.replaceState({}, "", url.toString());
  };

  const handleRegister = (email: string) => {
    setEmail(email);
    setAuthMode("verify-email");
    const url = new URL(window.location.href);
    url.searchParams.set("mode", "verify-email");
    url.searchParams.set("email", email);
    window.history.replaceState({}, "", url.toString());
  };

  const handleSwitchToOrgLogin = () => {
    setAuthMode("org-login");
    updateUrlMode("organization");
  };

  const renderAuthContent = () => {
    switch (authMode) {
      case "login":
        return (
          <LoginForm
            onSwitchMode={handleSwitchToRegister}
            onForgotPassword={handleForgotPassword}
            onVerify={handleVerification}
            onSwitchToOrgLogin={handleSwitchToOrgLogin}
          />
        );
      case "register":
        return (
          <RegisterForm
            onSwitchMode={handleSwitchToLogin}
            onRegister={handleRegister}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onSwitchMode={handleSwitchToLogin}
            onSuccess={handleResetSuccess}
          />
        );
      case "reset-success":
        return (
          <ResetPasswordSuccess
            onBackToLogin={handleSwitchToLogin}
            email={resetEmail}
          />
        );
      case "verify-email":
        return (
          <VerificationCodeForm
            email={email}
            onSuccess={() => {
              // Handle successful verification
            }}
            onBackToLogin={handleSwitchToLogin}
            loginType={loginType}
          />
        );
      case "org-login":
        return (
          <OrganizationLoginForm
            onSwitchToStandardLogin={handleSwitchToLogin}
            onVerify={handleVerification}
          />
        );
    }
  };

  // Modify the logo section
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/svgs/logo-desktop-full.webp"
      : "/svgs/logo-desktop-dark-full.webp";

  // Preload both logo variants
  useEffect(() => {
    const preloadImages = () => {
      const lightLogo = new window.Image();
      const darkLogo = new window.Image();
      lightLogo.src = "/svgs/logo-desktop-full.webp";
      darkLogo.src = "/svgs/logo-desktop-dark-full.webp";
    };

    if (typeof window !== "undefined") {
      preloadImages();
    }
  }, []);

  return (
    <div className="max-w-md mx-auto">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <Image
          src={logoSrc}
          alt="alle-ai"
          width={120}
          height={120}
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEwPENrLzA7YWNpPqRYXmWBgoaUaWpslmyChpmjj5qoj4+v/9j/"
          className="transition-opacity duration-300"
        />
      </div>

      {/* Heading */}
      <h1 className="text-center text-lg font-semibold mb-6 min-h-[28px]">
        {displayText}
        <span className="animate-blink">|</span>
      </h1>

      {/* Auth form container */}
      <div>
        <h2 className="text-muted-foreground mb-6 text-center">
          {authMode === "login" && "Login to your account"}
          {authMode === "register" && "Create new account"}
          {authMode === "forgot-password" && "Reset your password"}
          {authMode === "reset-success" && "Check your email"}
          {authMode === "verify-email" && "Verify your email"}
        </h2>

        <AnimatePresence mode="wait">{renderAuthContent()}</AnimatePresence>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthPageInner />
    </Suspense>
  );
}
