"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "framer-motion";
import { formVariants } from "@/lib/utils";
import { Loader, Building2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useEduLoginStore } from "@/stores/edu-store";

// Zod schema for organization login validation with consumer domain blocking
const orgLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Organization email is required")
    .email("Please enter a valid email address")
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        const consumerDomains = [
          "gmail.com",
          "yahoo.com",
          "hotmail.com",
          "outlook.com",
          "icloud.com",
          "aol.com",
          "mail.com",
          "protonmail.com",
          "live.com",
          "msn.com",
          "yandex.com",
        ];
        return !consumerDomains.includes(domain);
      },
      {
        message:
          "Please use your organization email address, not a personal email",
      }
    ),
});

type OrgLoginFormData = z.infer<typeof orgLoginSchema>;

interface OrganizationLoginFormProps {
  onSwitchToStandardLogin: () => void;
  onVerify?: (
    email: string,
    type: "client" | "org",
    organisation_name?: string,
    organisation_logo?: string,
    user_name?: string
  ) => void;
}

export function OrganizationLoginForm({
  onSwitchToStandardLogin,
  onVerify,
}: OrganizationLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setLoginData } = useEduLoginStore();

  const form = useForm<OrgLoginFormData>({
    resolver: zodResolver(orgLoginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: OrgLoginFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      // await sleep(3000);
      // onVerify(data.email, "org");
      // setIsLoading(false);
      // toast.success(
      //   "A login code has been sent to the email address you provided. Please check your inbox"
      // );

      // Reset form after success
      const response = await authApi.requestOrgCode({ email: data.email });
      if (response.success) {
        toast.success(
          response.message ||
            "A login code has been sent to your organization email address. Please check your inbox."
        );
        // console.log('org login response',response);
        onVerify?.(
          data.email,
          "org",
          response.organisation_name,
          response.organisation_logo,
          response.user_name
        );

        setLoginData({
          organisation_name: response.organisation_name,
          organisation_logo: response.organisation_logo,
          user_name: response.user_name,
        });

        form.reset();
        setIsLoading(false);
      } else {
        throw new Error(
          response.message ||
            "We could not complete your login request. Please try again."
        );
      }
    } catch (error: any) {
      form.reset();
      toast.error(
        error?.message ||
          "We could not complete your login request. Please try again."
      );
    } finally {
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
      {/* Organization Icon/Badge */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-accent p-4 rounded-full">
          <Building2 className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-sm text-muted-foreground">
        Enter your organization email address to receive a secure, one-time
        login code
      </p>

      {/* Email Form */}
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
                    placeholder="your.name@company.com"
                    className="border-borderColorPrimary focus-visible:outline-none"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              "Continue"
            )}
          </Button>
        </form>
      </Form>

      {/* Switch to Standard Login */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          Not part of an organization?{" "}
        </span>
        <Button
          variant="link"
          onClick={onSwitchToStandardLogin}
          className="text-foreground underline font-medium p-0"
        >
          Login here
        </Button>
      </div>
    </motion.div>
  );
}
