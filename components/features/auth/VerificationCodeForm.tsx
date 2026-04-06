"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader, LogOut, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { formVariants } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useEduLoginStore } from "@/stores/edu-store";
import { Building } from "lucide-react";
interface VerificationCodeFormProps {
  email: string;
  onSuccess: () => void;
  onBackToLogin: () => void;
  loginType: "client" | "org";
  organisation_name?: string;
  organisation_logo?: string;
  user_name?: string;
}

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
}

interface VerificationResponse {
  data: {
    user: User;
    to: string;
  };
  is_valid: boolean;
  message: string;
  status: boolean;
}

// Zod schema for verification code validation
const verificationCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

type VerificationCodeFormData = z.infer<typeof verificationCodeSchema>;

export function VerificationCodeForm({
  email,
  onSuccess,
  onBackToLogin,
  loginType,
  organisation_logo,
  organisation_name,
  user_name,
}: VerificationCodeFormProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { token } = useAuthStore();
  const { loginData } = useEduLoginStore();
  // Add useAuth to handle verification state
  const { user, verifyEmail, logout } = useAuth();

  // Use store data if available, otherwise fallback to props
  const displayOrgName = loginData?.organisation_name || organisation_name;
  const displayOrgLogo = loginData?.organisation_logo || organisation_logo;
  const displayUserName = loginData?.user_name || user_name;

  const router = useRouter();

  const form = useForm<VerificationCodeFormData>({
    resolver: zodResolver(verificationCodeSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });

  // Add beforeunload event handler
  // useEffect(() => {
  //   // Function to handle beforeunload event
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     // Cancel the event
  //     e.preventDefault();
  //     // Chrome requires returnValue to be set
  //     e.returnValue = '';
  //     // Custom message (note: most modern browsers show their own generic message instead)
  //     return 'You have a pending verification. Are you sure you want to leave?';
  //   };

  //   // Add event listener
  //   window.addEventListener('beforeunload', handleBeforeUnload);

  //   // Clean up event listener on component unmount
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, []);

  // Handle countdown timer
  useEffect(() => {
    // console.log(organisation_logo,organisation_name,user_name);
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleInput = (index: number, value: string) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Update form value
    form.setValue("code", newCode.join(""), { shouldValidate: true });

    // Move to next input if value is entered
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Submit automatically if all digits are filled
    if (value && index === 5 && newCode.every((digit) => digit)) {
      handleVerify(newCode.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Extract only digits from pasted content
    const digits = pastedData.replace(/\D/g, "");

    if (digits.length === 0) return;

    // Take only first 6 digits
    const codeDigits = digits.slice(0, 6).split("");

    const newCode = [...code];
    codeDigits.forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });

    setCode(newCode);

    // Update form value
    form.setValue("code", newCode.join(""), { shouldValidate: true });

    // Focus on the next empty input or the last input if all filled
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      inputs.current[nextEmptyIndex]?.focus();
    } else {
      inputs.current[5]?.focus();
      // Auto-submit if all 6 digits are filled
      if (newCode.every((digit) => digit)) {
        handleVerify(newCode.join(""));
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    // Validate with Zod first
    const validation = verificationCodeSchema.safeParse({
      code: verificationCode,
    });

    if (!validation.success) {
      const errorMessage =
        validation.error.errors[0]?.message || "Invalid verification code";
      form.setError("code", { message: errorMessage });
      return;
    }

    setIsVerifying(true);

    try {
      const formattedCode =
        loginType === "org" ? verificationCode : `A-${verificationCode}`;
      await verifyEmail(formattedCode, loginType, email);
      toast.success("Email verified");
      onSuccess();
      
    } catch (error: any) {
      // console.error('Verification error:', error);
      // toast.error(`${error.message || "Please check your code and try again"}`)

      setCode(["", "", "", "", "", ""]);
      form.setValue("code", "");
      form.clearErrors();
      inputs.current[0]?.focus();
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: VerificationCodeFormData) => {
    await handleVerify(data.code);
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      // also logic to differentiate org vs client if needed
      if (loginType === "org") {
        await authApi.requestOrgCode({ email });
      } else {
        await authApi.resendVerification();
      }
      // const response = await authApi.resendVerification();
      // console.log(token);
      setCountdown(30);
      toast.success("Verification code sent");

      setCode(["", "", "", "", "", ""]);
      form.setValue("code", "");
      form.clearErrors();
      inputs.current[0]?.focus();
      setIsResending(false);
    } catch (error: any) {
      // toast.error(`${error.response?.data?.message || "Failed to send code. Please try again."}`);
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onBackToLogin();
    } catch (error) {
      // do nothing just go back
      // toast.error("Failed to log out. Please try again.");
      onBackToLogin();
    }
  };

  return (
    <Form {...form}>
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`space-y-8 ${loginType === "org" ? "!space-y-6" : ""}`}
      >
        <div className="text-center space-y-2">
          <h2 className="text-xl xs:text-2xl font-semibold text-foreground">
            {loginType === "org" ? (
              <div className="flex flex-col items-center gap-3">
                {/* Organization Logo & Name */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border shadow-sm bg-white flex items-center justify-center p-1">
                    {/* Mock Logo - In real implementation this would be a prop */}
                    {displayOrgLogo !== "" && displayOrgLogo ? (
                      <img
                        src={displayOrgLogo}
                        alt="Organization Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="hidden">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-lg font-bold text-center leading-tight max-w-[280px]"
                    title={displayOrgName}
                  >
                    {displayOrgName}
                  </span>
                </div>

                {/* User Greeting */}
                <div className="flex flex-col items-center gap-0.5 mt-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Welcome back,
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {displayUserName}
                  </span>
                </div>
              </div>
            ) : (
              "Enter Verification Code"
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification code to
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Code Input Section */}
          <FormField
            control={form.control}
            name="code"
            render={() => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center justify-center gap-2">
                    {/* Prefix */}
                    <div className="flex items-center">
                      <span className="text-lg xs:text-xl font-semibold text-foreground">
                        A -
                      </span>
                    </div>

                    {/* Code Inputs */}
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInput(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`text-center text-lg font-semibold border border-borderColorPrimary rounded-lg 
                          focus:outline-none transition-colors
                          bg-background text-foreground
                          ${loginType === "org"
                            ? "w-8 h-10 xs:w-10 xs:h-12" // Compact size for Org
                            : "w-8 h-10 xs:w-12 xs:h-14" // Standard size
                          }`}
                      />
                    ))}
                  </div>
                </FormControl>
                <div className="text-center">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Verify Button */}
          <Button
            variant="secondary"
            type="submit"
            disabled={code.some((digit) => !digit) || isVerifying}
            className="w-full bg-black text-white"
          >
            {isVerifying ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>

        {/* Resend Code Section */}
        <div className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            {countdown > 0 ? (
              <span>Resend in {countdown}s</span>
            ) : (
              <Button
                variant="link"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-foreground underline font-medium p-0"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="mt-4 text-sm"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Use a different account
          </Button>
        </div>
      </motion.div>
    </Form>
  );
}
