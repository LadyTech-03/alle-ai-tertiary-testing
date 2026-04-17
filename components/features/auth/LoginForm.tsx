"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { GoogleButton } from "./GoogleButton";
import { motion } from "framer-motion";
import { formVariants } from "@/lib/utils";
import { Loader } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

import { sendGAEvent } from "@next/third-parties/google";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Zod schema for login validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    // .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchMode: () => void;
  onForgotPassword: () => void;
  onVerify: (email: string, type: "client" | "org") => void;
  onSwitchToOrgLogin?: () => void;
}

export function LoginForm({
  onSwitchMode,
  onForgotPassword,
  onVerify,
  onSwitchToOrgLogin,
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);

      sendGAEvent("formSubmission", "submit", {
        authType: "loginForm",
        status: "success",
      });

      // Only handle verification if needed
      if (result.data.to === "verify-email") {
        onVerify(data.email, "client");
        setIsLoading(false);
        return;
      }
      // Login function will handle other redirects
      // The loading state will be maintained until the page actually changes
    } catch (error: any) {
      form.setValue("password", "");
      // console.log(error, 'login error')
      sendGAEvent("formSubmission", "submit", {
        authType: "loginForm",
        status: "failed",
      });
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Social login group */}
      <div className="space-y-2">
        <GoogleButton />
        <Button
          variant="outline"
          onClick={onSwitchToOrgLogin}
          className="w-full flex items-center justify-center gap-2 rounded-md py-2 px-4 transition-all duration-200 bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-sm hover:shadow-md dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 dark:border-zinc-700 dark:text-zinc-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="13" x="4" y="8" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 13v3"/><path d="M8 13h8"/></svg>
          <span>Login with organization account</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">OR</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="border-borderColorPrimary focus-visible:outline-none"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="border-borderColorPrimary focus-visible:outline-none"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-password"
                checked={showPassword}
                onCheckedChange={(checked) =>
                  setShowPassword(checked as boolean)
                }
                className="border-borderColorPrimary focus-visible:outline-none"
              />
              <label
                htmlFor="show-password"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Show password
              </label>
            </div>
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:underline"
              onClick={onForgotPassword}
            >
              Forgot Password?
            </Button>
          </div>

          <Button
            variant="secondary"
            type="submit"
            className="w-full bg-black text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
      {/* Register Link */}
      <div className="text-center text-sm ">
        <span className="text-muted-foreground">
          Don&apos;t have an account yet?{" "}
        </span>
        <Button
          variant="link"
          onClick={onSwitchMode}
          className="text-foreground underline font-medium p-0"
        >
          Register
        </Button>
      </div>

      {/* Terms */}
      <div className="text-center text-xs text-muted-foreground">
        By continuing, you agree to Alle-AI&apos;s{" "}
        <Link href="/terms-of-service" target="_blank" className="underline">
          Terms of Service
        </Link>{" "}
        &{" "}
        <Link href="/privacy-policy" target="_blank" className="underline">
          Privacy Policy
        </Link>
      </div>
    </motion.div>
  );
}
