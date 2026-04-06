"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Loader, GraduationCap, UserCheck, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { orgPaymentsApi } from "@/lib/api/orgs/payments";
import { useAuthStore } from "@/stores";
import { getOrganizationViewMode } from "@/lib/org-utils";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationName?: string;
  mode?: "new" | "topup";
  currentPlan?: {
    studentSeats?: number;
    facultySeats?: number;
    deviceSeats?: number;
    [key: string]: any;
  };
  onProceed?: (data: {
    studentSeats: number;
    facultySeats: number;
    deviceSeats: number;
    studentPrice: number;
    facultyPrice: number;
    devicePrice: number;
  }) => void;
}

export function BillingModal({
  isOpen,
  onClose,
  mode = "new",
  currentPlan,
  onProceed,
}: BillingModalProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { organizationDetails } = useAuthStore();

  // Determine View Mode from Store
  const viewMode = useMemo(() => {
    return getOrganizationViewMode(organizationDetails?.seats_info);
  }, [organizationDetails]);

  // Extract from Store or Props
  // Helper to find existing count of a type in store
  const getExistingCount = (isSystem: boolean, key?: string) => {
    if (!organizationDetails?.seats_info) return 0;
    const info = organizationDetails.seats_info;
    if (key && info[key]) return info[key].purchased_seats ? parseInt(info[key].purchased_seats) : 0;

    // Fallback search
    const found = Object.values(info).find(seat => seat.for_system === isSystem);
    return found?.purchased_seats ? parseInt(found.purchased_seats) : 0;
  };

  const [studentSeats, setStudentSeats] = useState(0);
  const [facultySeats, setFacultySeats] = useState(0);
  const [deviceSeats, setDeviceSeats] = useState(0);

  const [additionalStudentSeats, setAdditionalStudentSeats] = useState(0);
  const [additionalFacultySeats, setAdditionalFacultySeats] = useState(0);
  const [additionalDeviceSeats, setAdditionalDeviceSeats] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setIsLoading(false);

      // Initialize Logic
      if (mode === "new") {
        // Defaults for NEW setup based on viewMode
        if (viewMode === "people" || viewMode === "hybrid") {
          setStudentSeats(currentPlan?.studentSeats || 100);
          setFacultySeats(currentPlan?.facultySeats || 10);
        }
        if (viewMode === "devices" || viewMode === "hybrid") {
          setDeviceSeats(currentPlan?.deviceSeats || 50);
        }
      } else {
        // Top-up: reset additionals to 0
        setAdditionalStudentSeats(0);
        setAdditionalFacultySeats(0);
        setAdditionalDeviceSeats(0);
      }
    }
  }, [isOpen, mode, viewMode, currentPlan]);

  // Extract dynamic pricing from organizationDetails
  const getDynamicPrice = (type: string, defaultPrice: number): number => {
    if (!organizationDetails?.subscription_info?.billing_details?.[type]?.amount) {
      return defaultPrice;
    }
    return parseFloat(organizationDetails.subscription_info.billing_details[type].amount as string);
  };

  const pricing = {
    student: getDynamicPrice("student", 80),
    faculty: getDynamicPrice("faculty", 100),
    device: getDynamicPrice("device_edu", 50),
    adminSeats: 10, // free
  };

  const cycleLabel = organizationDetails?.subscription_info?.cycle || "year";

  // Calculate totals
  const studentTotal = (mode === "new" ? studentSeats : additionalStudentSeats) * pricing.student;
  const facultyTotal = (mode === "new" ? facultySeats : additionalFacultySeats) * pricing.faculty;
  const deviceTotal = (mode === "new" ? deviceSeats : additionalDeviceSeats) * pricing.device;

  const grandTotal = studentTotal + facultyTotal + deviceTotal;

  // Existing totals for display
  const existingStudent = currentPlan?.studentSeats || getExistingCount(false, "student");
  const existingFaculty = currentPlan?.facultySeats || getExistingCount(false, "faculty");
  const existingDevice = currentPlan?.deviceSeats || getExistingCount(true, "device_edu");

  const recurringTotal =
    ((existingStudent + additionalStudentSeats) * pricing.student) +
    ((existingFaculty + additionalFacultySeats) * pricing.faculty) +
    ((existingDevice + additionalDeviceSeats) * pricing.device);


  const adjustSeats = (type: "student" | "faculty" | "device", increment: boolean) => {
    if (mode === "new") {
      if (type === "student") {
        setStudentSeats(prev => increment ? prev + 1 : Math.max(1, prev - 1));
      } else if (type === "faculty") {
        setFacultySeats(prev => increment ? prev + 1 : Math.max(1, prev - 1));
      } else {
        setDeviceSeats(prev => increment ? prev + 1 : Math.max(1, prev - 1));
      }
    } else {
      // Topup
      if (type === "student") {
        setAdditionalStudentSeats(prev => increment ? prev + 1 : Math.max(0, prev - 1));
      } else if (type === "faculty") {
        setAdditionalFacultySeats(prev => increment ? prev + 1 : Math.max(0, prev - 1));
      } else {
        setAdditionalDeviceSeats(prev => increment ? prev + 1 : Math.max(0, prev - 1));
      }
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      const { organizationDetails } = useAuthStore.getState();
      const orgId = organizationDetails?.id?.toString();

      if (!orgId) throw new Error("Organization ID not found");

      // Prepare checkout data
      const checkoutData = {
        seat_types: [] as string[],
        seats_number: [] as number[],
      };

      const sSeats = mode === "new" ? studentSeats : additionalStudentSeats;
      const fSeats = mode === "new" ? facultySeats : additionalFacultySeats;
      const dSeats = mode === "new" ? deviceSeats : additionalDeviceSeats;

      if (sSeats > 0 && viewMode !== 'devices') {
        checkoutData.seat_types.push("student");
        checkoutData.seats_number.push(sSeats);
      }
      if (fSeats > 0 && viewMode !== 'devices') {
        checkoutData.seat_types.push("faculty");
        checkoutData.seats_number.push(fSeats);
      }
      if (dSeats > 0 && viewMode !== 'people') {
        checkoutData.seat_types.push("device_edu");
        checkoutData.seats_number.push(dSeats);
      }

      // Validations
      if (checkoutData.seat_types.length === 0) {
        throw new Error("Please select at least one seat type");
      }

      if (mode === "new") {
        const response = await orgPaymentsApi.checkout(orgId, checkoutData);
        if (response.status && response.to) {
          window.location.href = response.to;
        } else {
          throw new Error("Failed to create checkout session");
        }
      } else {
        // Topup
        if (onProceed) {
          onProceed({
            studentSeats: additionalStudentSeats,
            facultySeats: additionalFacultySeats,
            deviceSeats: additionalDeviceSeats,
            studentPrice: pricing.student,
            facultyPrice: pricing.faculty,
            devicePrice: pricing.device,
          });
          onClose();
        } else {
          const response = await orgPaymentsApi.subscriptionUpdate(orgId, checkoutData);
          if (response.status && response.to) {
            window.location.href = response.to;
          } else {
            throw new Error("Failed to create subscription update session");
          }
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      setIsLoading(false);
    }
  };

  // Can submit check
  const hasSelection = (
    (mode === "new" ? studentSeats : additionalStudentSeats) > 0 ||
    (mode === "new" ? facultySeats : additionalFacultySeats) > 0 ||
    (mode === "new" ? deviceSeats : additionalDeviceSeats) > 0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "mx-auto max-h-[90vh] overflow-y-auto flex bg-background flex-col",
          mode === "topup" ? "max-w-2xl w-[95vw] sm:w-full" : "max-w-md"
        )}
      >
        <DialogHeader className="pb-4 flex-shrink-0">
          <div className="relative flex items-center">
            {/* Logo */}
            <div className="absolute left-0">
              {mounted && (
                <Image
                  src={
                    resolvedTheme === "dark"
                      ? "/svgs/logo-desktop-full.webp"
                      : "/svgs/logo-desktop-dark-full.webp"
                  }
                  alt="Alle-AI Logo"
                  width={80}
                  height={24}
                  className="rounded object-contain"
                  priority
                />
              )}
            </div>
            {/* Title */}
            <DialogTitle className="flex-1 text-center text-lg font-semibold">
              {mode === "new" ? "Billing Setup" : "Add More Seats"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4 min-h-0">
          {/* Top-up: Current Plan Overview */}
          {mode === "topup" && (
            <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background to-secondary/50 dark:from-muted/50 dark:to-accent/20 p-5 shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <GraduationCap className="w-24 h-24 text-indigo-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Current Plan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Active Subscription
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-border px-3 py-1">
                    {cycleLabel.charAt(0).toUpperCase() + cycleLabel.slice(1)} Cycle
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Students / Faculty if not device only */}
                  {viewMode !== 'devices' && (
                    <>
                      <div className="bg-background/60 dark:bg-card/40 backdrop-blur-sm rounded-lg p-3 border border-border flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Students</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{existingStudent}</p>
                        </div>
                      </div>
                      <div className="bg-background/60 dark:bg-card/40 backdrop-blur-sm rounded-lg p-3 border border-border flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Faculty</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{existingFaculty}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Devices if not people only */}
                  {viewMode !== 'people' && (
                    <div className="bg-background/60 dark:bg-card/40 backdrop-blur-sm rounded-lg p-3 border border-border flex items-center gap-3 col-span-2 sm:col-span-1">
                      <div className="w-10 h-10 bg-orange-500/10 dark:bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Laptop className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Device Seats</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{existingDevice}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seats Configuration */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {mode === "new" ? "Configure Seats" : "Add More Seats"}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Students Input */}
              {viewMode !== 'devices' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-sm">Student Seats</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">£{pricing.student}</span>
                      <span className="text-xs text-slate-500 ml-1">
                        {mode === "topup" ? "/ seat" : `/ ${cycleLabel}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => adjustSeats("student", false)}
                      disabled={mode === "new" ? studentSeats <= 1 : additionalStudentSeats <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center font-mono text-lg font-medium relative">
                      <Input
                        type="number"
                        value={mode === "new" ? studentSeats : additionalStudentSeats}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (mode === 'new') setStudentSeats(val);
                          else setAdditionalStudentSeats(val);
                        }}
                        className="border-0 bg-transparent text-center h-8 p-0 w-full"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => adjustSeats("student", true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Faculty Input */}
              {viewMode !== 'devices' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                        <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-medium text-sm">Faculty Seats</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">£{pricing.faculty}</span>
                      <span className="text-xs text-slate-500 ml-1">
                        {mode === "topup" ? "/ seat" : `/ ${cycleLabel}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => adjustSeats("faculty", false)}
                      disabled={mode === "new" ? facultySeats <= 1 : additionalFacultySeats <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center font-mono text-lg font-medium relative">
                      <Input
                        type="number"
                        value={mode === "new" ? facultySeats : additionalFacultySeats}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (mode === 'new') setFacultySeats(val);
                          else setAdditionalFacultySeats(val);
                        }}
                        className="border-0 bg-transparent text-center h-8 p-0 w-full"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => adjustSeats("faculty", true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Device Input */}
              {viewMode !== 'people' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                        <Laptop className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium text-sm">Device Seats</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">£{pricing.device}</span>
                      <span className="text-xs text-slate-500 ml-1">
                        {mode === "topup" ? "/ seat" : `/ ${cycleLabel}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md"
                      onClick={() => adjustSeats("device", false)}
                      disabled={mode === "new" ? deviceSeats <= 1 : additionalDeviceSeats <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center font-mono text-lg font-medium relative">
                      <Input
                        type="number"
                        value={mode === "new" ? deviceSeats : additionalDeviceSeats}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (mode === 'new') setDeviceSeats(val);
                          else setAdditionalDeviceSeats(val);
                        }}
                        className="border-0 bg-transparent text-center h-8 p-0 w-full"
                      />
                      {mode === "topup" && additionalDeviceSeats > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-1/2 -translate-y-1/2 left-4 text-xs font-bold text-green-600 dark:text-green-400"
                        >
                          +
                        </motion.span>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => adjustSeats("device", true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {mode === "new" && (
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">Free</Badge>
                  <span>Includes up to {pricing.adminSeats} Administrator seats</span>
                </div>
              )}
            </div>
          </div>

          {/* Top-up Summary */}
          {mode === "topup" && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Summary</h3>

                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  {additionalStudentSeats > 0 && (
                    <div className="flex justify-between">
                      <span>{additionalStudentSeats} × Student Seats</span>
                      <span>£{(additionalStudentSeats * pricing.student).toLocaleString()}</span>
                    </div>
                  )}
                  {additionalFacultySeats > 0 && (
                    <div className="flex justify-between">
                      <span>{additionalFacultySeats} × Faculty Seats</span>
                      <span>£{(additionalFacultySeats * pricing.faculty).toLocaleString()}</span>
                    </div>
                  )}
                  {additionalDeviceSeats > 0 && (
                    <div className="flex justify-between">
                      <span>{additionalDeviceSeats} × Device Seats</span>
                      <span>£{(additionalDeviceSeats * pricing.device).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Total Due Now</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      £{(
                        (additionalStudentSeats * pricing.student) +
                        (additionalFacultySeats * pricing.faculty) +
                        (additionalDeviceSeats * pricing.device)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 text-xs text-slate-500">
                  <span>New Yearly Total (Recurring)</span>
                  <span className="font-medium">
                    £{recurringTotal.toLocaleString()} / {cycleLabel}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* New Mode Total */}
          {mode === "new" && (
            <div className="mt-4 p-5 rounded-xl shadow-lg bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Total per {cycleLabel}</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">
                  Billed Annually
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-xs text-slate-400">
                  {[
                    studentSeats > 0 && `${studentSeats} Students`,
                    facultySeats > 0 && `${facultySeats} Faculty`,
                    deviceSeats > 0 && `${deviceSeats} Devices`
                  ].filter(Boolean).join(' • ')}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">£{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t pt-4 mt-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-11 relative overflow-hidden"
              disabled={isLoading || !hasSelection}
            >
              {isLoading ? (
                <div className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" />Processing...</div>
              ) : (
                <span>{mode === "new" ? "Confirm & Continue" : "Proceed"}</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
