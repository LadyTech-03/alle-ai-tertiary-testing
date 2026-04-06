"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader, CreditCard, Plus, AlertCircle, Check, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { orgPaymentsApi } from "@/lib/api/orgs/payments";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { CardPaymentMethodModal } from "@/components/ui/modals";
import { useOrgRefetch } from "@/lib/contexts/org-refetch-context";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { useOrgPaymentMethods } from "@/hooks/use-org-queries";
import type { PaymentMethod } from "@/lib/api/orgs/payments";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutData: {
    studentSeats: number;
    facultySeats: number;
    deviceSeats?: number;
    studentPrice: number;
    facultyPrice: number;
    devicePrice?: number;
  };
  onSuccess: () => void;
}

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  checkoutData,
  onSuccess,
}: PaymentConfirmationModalProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const { refetchOrgData } = useOrgRefetch();
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id?.toString();

  const {
    studentSeats, facultySeats, studentPrice, facultyPrice,
    deviceSeats = 0, devicePrice = 0
  } = checkoutData;

  const totalAmount = (studentSeats * studentPrice) + (facultySeats * facultyPrice) + (deviceSeats * devicePrice);

  // Fetch payment methods using centralized hook
  const { data: paymentMethods = [], isLoading } = useOrgPaymentMethods({
    enabled: isOpen,
  });

  // Set default selected method when data loads
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethodId) {
      const defaultMethod = paymentMethods.find((pm) => pm.default);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
      } else {
        setSelectedMethodId(paymentMethods[0].id);
      }
    }
  }, [paymentMethods, selectedMethodId]);

  const handleConfirmPayment = async () => {
    if (!selectedMethodId) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    try {
      const { organizationDetails } = useAuthStore.getState();
      const orgId = organizationDetails?.id?.toString();

      if (!orgId) {
        throw new Error("Organization ID not found");
      }

      const getCurrentSeats = (key: string, isSystem: boolean) => {
        const info = organizationDetails?.seats_info || {};
        if (info[key]?.purchased_seats) return parseInt(info[key].purchased_seats);
        const found = Object.values(info).find(s => s.for_system === isSystem);
        return found?.purchased_seats ? parseInt(found.purchased_seats) : 0;
      }

      const currentStudentSeats = getCurrentSeats('student', false);
      const currentFacultySeats = getCurrentSeats('faculty', false);
      const currentDeviceSeats = getCurrentSeats('device_edu', true);

      const checkoutPayload = {
        seat_types: [] as string[],
        seats_number: [] as number[],
      };

      if (studentSeats > 0) {
        checkoutPayload.seat_types.push("student");
        checkoutPayload.seats_number.push(currentStudentSeats + studentSeats);
      }
      if (facultySeats > 0) {
        checkoutPayload.seat_types.push("faculty");
        checkoutPayload.seats_number.push(currentFacultySeats + facultySeats);
      }
      if (deviceSeats > 0) {
        checkoutPayload.seat_types.push("device_edu");
        checkoutPayload.seats_number.push(currentDeviceSeats + deviceSeats);
      }

      const response = await orgPaymentsApi.subscriptionUpdate(
        orgId,
        checkoutPayload
      );
      if (response.status) {
        toast.success(response.message || "Payment successful! Seats added.");

        // Refetch org data in background (fire-and-forget)
        refetchOrgData();

        // Invalidate payment methods cache
        queryClient.invalidateQueries({
          queryKey: queryKeys.orgPaymentMethods(orgId),
        });

        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Payment failed. Please try again.");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed. Please try again.");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const cardBrandLabel = (brand?: string) =>
    brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Card";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto flex flex-col gap-0 p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Review your top-up details and select a payment method.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3 border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                {studentSeats > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-slate-600 dark:text-slate-400">
                        <span className="text-blue-600 dark:text-blue-400">
                          +{studentSeats} Student Seats
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        New Total:{" "}
                        {parseInt(
                          useAuthStore.getState().organizationDetails
                            ?.seats_info?.student?.purchased_seats || "0"
                        ) + studentSeats}
                      </span>
                    </div>
                    <span className="font-medium">
                      £{(studentSeats * studentPrice).toLocaleString()}
                    </span>
                  </div>
                )}
                {facultySeats > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-slate-600 dark:text-slate-400">
                        <span className="text-purple-600 dark:text-purple-400">
                          +{facultySeats} Faculty Seats
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        New Total:{" "}
                        {parseInt(
                          useAuthStore.getState().organizationDetails
                            ?.seats_info?.faculty?.purchased_seats || "0"
                        ) + facultySeats}
                      </span>
                    </div>
                    <span className="font-medium">
                      £{(facultySeats * facultyPrice).toLocaleString()}
                    </span>
                  </div>
                )}
                {deviceSeats > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-slate-600 dark:text-slate-400">
                        <span className="text-orange-600 dark:text-orange-400">
                          +{deviceSeats} Device Seats
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        New Total:{" "}
                        {parseInt(
                          useAuthStore.getState().organizationDetails
                            ?.seats_info?.device_edu?.purchased_seats ||
                          Object.values(useAuthStore.getState().organizationDetails?.seats_info || {}).find(s => s.for_system === true)?.purchased_seats ||
                          "0"
                        ) + deviceSeats}
                      </span>
                    </div>
                    <span className="font-medium">
                      £{(deviceSeats * devicePrice).toLocaleString()}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-base">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Top-Up Amount
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    £{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Payment Method
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setShowAddCardModal(true)}
                >
                  <Plus className="h-3 w-3" />
                  Add New
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8 border rounded-lg border-dashed">
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-xs text-red-600">{error}</div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-6 border rounded-lg border-dashed">
                  <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No payment methods found
                  </p>
                  <Button size="sm" onClick={() => setShowAddCardModal(true)}>
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        selectedMethodId === method.id
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500 ring-1 ring-indigo-600 dark:ring-indigo-500"
                          : "border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                      )}
                    >
                      <div className="h-8 w-8 bg-white dark:bg-slate-950 rounded border flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {cardBrandLabel(method.brand)}
                          </span>
                          {method.default && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          •••• {method.last4} • Expires {method.exp_month}/
                          {method.exp_year}
                        </p>
                      </div>
                      {selectedMethodId === method.id && (
                        <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayment}
                className="flex-1"
                disabled={isProcessing || !selectedMethodId}
              >
                {isProcessing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay £${totalAmount.toLocaleString()}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CardPaymentMethodModal
        isOrganization={true}
        isOpen={showAddCardModal}
        onClose={() => {
          setShowAddCardModal(false);
          // Invalidate query to refetch payment methods
          queryClient.invalidateQueries({
            queryKey: queryKeys.orgPaymentMethods(orgId || ""),
          });
        }}
        mode="add"
      />
    </>
  );
}
