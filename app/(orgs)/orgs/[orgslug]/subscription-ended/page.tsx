"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

export default function SubscriptionEndedPage() {
  const router = useRouter();
  const { user, organizationDetails } = useAuthStore();
  const { logout } = useAuth();

  // Get owner info if available
  const ownerEmail =
    organizationDetails?.owner_email || organizationDetails?.email;
  const ownerName = organizationDetails?.created_by || "Administrator";

  const handleContactAdmin = () => {
    if (ownerEmail) {
      window.location.href = `mailto:${ownerEmail}?subject=Request to Restore Organization Access&body=Hello ${ownerName},%0D%0A%0D%0AI would like to request access to the organization workspace. Please let me know what steps I need to take.%0D%0A%0D%0AThank you.`;
    } else {
      toast.error("No administrator contact information available");
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-background border border-borderColorPrimary rounded-2xl shadow-2xl overflow-hidden">
          {/* Organization Header */}
          {organizationDetails && (
            <div className="bg-backgroundSecondary/50 p-6 border-b border-borderColorPrimary flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={organizationDetails.logo_url}
                  alt={organizationDetails.name}
                />
                <AvatarFallback className="text-xl font-semibold bg-primary/10">
                  {organizationDetails.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  {organizationDetails.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Organization Workspace
                </p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="p-8 text-center space-y-6">
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                initial: { delay: 0.2, type: "spring", stiffness: 200 }
              }}
              className="flex justify-center"
            >
              <div className="rounded-full bg-amber-500/10 p-4 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              </div>
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Renewal Required
              </h1>
              <div className="w-20 h-1 bg-amber-500 mx-auto rounded-full" />
            </div>

            {/* Description */}
            <div className="space-y-4 text-muted-foreground">
              <p className="text-base leading-relaxed">
                Access to this organization workspace is currently paused.
              </p>
              <p className="text-base leading-relaxed">
                Please contact your administrator to renew the subscription.
              </p>
            </div>

            {/* Admin Contact Info */}
            {ownerEmail && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-backgroundSecondary/50 rounded-xl p-6 space-y-2 border border-borderColorPrimary"
              >
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Administrator Contact</span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    {ownerName}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {ownerEmail}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleContactAdmin}
                disabled={!ownerEmail}
                className="flex-1"
                variant="default"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Admin
              </Button>
              <Button
                onClick={handleSignOut}
                className="flex-1"
                variant="outline"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>

            {/* User Info Footer */}
            {user && (
              <div className="pt-6 border-t border-borderColorPrimary">
                <p className="text-xs text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">
                    {user.email}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Need help?{" "}
          <a href="/faq" className="text-primary hover:underline font-medium">
            Visit our FAQ
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
