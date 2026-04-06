"use client";

import { useState } from "react";
import {
  CreditCard,
  Calendar,
  Users,
  FileText,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BillingModal } from "../modals/billing-modal";
import { PaymentConfirmationModal } from "../modals/payment-confirmation";
import { PaymentMethodsModal } from "@/components/ui/modals/payment-methods-modal";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/stores";
import { useOrgPaymentStore } from "@/stores/edu-store";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { useOrgPaymentMethods } from "@/hooks/use-org-queries";
import { getOrganizationViewMode } from "@/lib/org-utils";

export default function OrgBillings() {
  const { organizationDetails } = useAuthStore();
  const { nextBillingDate } = useOrgPaymentStore();
  const queryClient = useQueryClient();
  const orgId = organizationDetails?.id?.toString();

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isPaymentMethodsModalOpen, setIsPaymentMethodsModalOpen] =
    useState(false);
  const [isPaymentConfirmationOpen, setIsPaymentConfirmationOpen] =
    useState(false);
  const [paymentConfirmationData, setPaymentConfirmationData] = useState<{
    studentSeats: number;
    facultySeats: number;
    studentPrice: number;
    facultyPrice: number;
  } | null>(null);
  const [autoRenewal, setAutoRenewal] = useState(true);

  // Fetch all payment methods using the centralized hook
  const { data: paymentMethodsData, isLoading: isLoadingPayment } =
    useOrgPaymentMethods({
      staleTime: 1000 * 60 * 10, // 10 minutes
      placeholderData: (previousData) => previousData,
    });

  // Smart display logic: show default, or first card, or null
  const displayCard =
    paymentMethodsData?.find((pm) => pm.default) ||
    paymentMethodsData?.[0] ||
    null;

  const canUpdateBilling =
    organizationDetails?.is_owner ||
    organizationDetails?.user_permissions?.includes("update_billing");

  // Use shared logic for determining view mode if needed
  const viewMode = getOrganizationViewMode(
    organizationDetails?.seats_info as any
  );
  const seatInfo = organizationDetails?.seats_info || {};

  // Dynamic Seat Data Calculation
  // We'll map each key in seats_info to a normalized object
  const seatsMap = Object.entries(seatInfo).reduce((acc, [key, info]) => {
    const purchased = Number(info.purchased_seats || 0);
    const remaining = Number(info.remaining_seats || 0);
    return {
      ...acc,
      [key]: {
        purchased,
        remaining,
        used: purchased - remaining,
        percentage:
          purchased > 0 ? ((purchased - remaining) / purchased) * 100 : 0,
      },
    };
  }, {} as Record<string, { purchased: number; remaining: number; used: number; percentage: number }>);

  const adminsCount = organizationDetails?.admins_count || 0;

  // Get dynamic billing data
  const billingDetails =
    organizationDetails?.subscription_info?.billing_details;
  const actualCycle = organizationDetails?.subscription_info?.cycle || "yearly";

  // Helper to get price for a specific seat type
  const getPrice = (type: string, defaultYearly: number) => {
    const details = billingDetails?.[type];
    if (details?.amount) {
      const amount = parseFloat(details.amount as string);
      const isYearly = details.cycle === "yearly";
      return {
        monthly: isYearly ? amount / 12 : amount,
        yearly: isYearly ? amount : amount * 12,
      };
    }
    return {
      monthly: defaultYearly / 12,
      yearly: defaultYearly,
    };
  };

  // Calculate pricing for all seat types found in seats_info
  const pricing = Object.keys(seatsMap).reduce((acc, key) => {
    // Default fallback pricing logic logic if needed (e.g. device vs human)
    const defaultPrice = key.includes("device")
      ? 50
      : key === "student"
      ? 80
      : 100;
    return {
      ...acc,
      [key]: getPrice(key, defaultPrice),
    };
  }, {} as Record<string, { monthly: number; yearly: number }>);

  // Current plan data
  const currentPlan = {
    // We can just keep the billingCycle here, seats are in seatsMap
    billingCycle: actualCycle as "monthly" | "yearly",
  };

  // Calculate total costs dynamically
  let totalSubscriptionCost = 0;
  Object.keys(seatsMap).forEach((key) => {
    const seatCost =
      seatsMap[key].purchased * pricing[key][currentPlan.billingCycle];
    totalSubscriptionCost += seatCost;
  });

  const cycleLabel = currentPlan.billingCycle === "monthly" ? "month" : "year";

  // Calculate monthly equivalent for display (as requested)
  // If cycle is yearly, this is total / 12. If monthly, it's just total.
  const monthlyEquivalentTotal =
    currentPlan.billingCycle === "yearly"
      ? totalSubscriptionCost / 12
      : totalSubscriptionCost;
  const nextRenewalDate = new Date(2025, 11, 6); // December 6, 2025

  // Calculate overall usage
  let totalSeats = 0;
  let totalUsed = 0;

  Object.values(seatsMap).forEach((seat) => {
    totalSeats += seat.purchased;
    totalUsed += seat.used;
  });

  // Add admins to used count (assuming they take a 'seat' globally or just tracked separately?)
  // The original code added adminsCount to totalUsed. Let's keep that behavior if consistent.
  totalUsed += adminsCount;

  const totalUsagePercentage =
    totalSeats > 0 ? (totalUsed / totalSeats) * 100 : 0;

  return (
    <div className="min-h-screen  pt-5 ">
      <h1 className="text-3xl font-bold ">Billing</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your organization&apos;s billing information, subscriptions, and
        payment history.
      </p>
      <Separator className="mt-6" />

      {/* Payment Method Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 " />
          <h2 className="text-xl font-semibold ">Payment Method</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage or change your payment method
        </p>

        <Card
          className="max-w-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br 
    dark:from-blue-950 
    dark:to-indigo-900 
    dark:border-blue-900 border-blue-200"
        >
          <CardContent className="p-8">
            {isLoadingPayment ? (
              // Skeleton Loading State
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-8 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ) : !displayCard ? (
              // No Payment Method State
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No payment method on file
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={!canUpdateBilling}
                          onClick={() => setIsPaymentMethodsModalOpen(true)}
                        >
                          Add Payment Method
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canUpdateBilling && (
                      <TooltipContent>
                        <p>
                          You don't have permission to update billing. Contact
                          your administrator.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              // Payment Method Data
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase">
                        {displayCard.brand}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        •••• •••• •••• {displayCard.last4}
                      </p>
                      {displayCard.default && (
                        <p className="text-sm text-muted-foreground">
                          Primary payment method
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Expires</p>
                      <p className="text-muted-foreground">
                        {String(displayCard.exp_month).padStart(2, "0")}/
                        {displayCard.exp_year}
                      </p>
                    </div>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={!canUpdateBilling}
                          onClick={() => setIsPaymentMethodsModalOpen(true)}
                        >
                          Change
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canUpdateBilling && (
                      <TooltipContent>
                        <p>
                          You don't have permission to update billing. Contact
                          your administrator.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="mt-6" />

      {/* Current Subscription Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 " />
          <h2 className="text-xl font-semibold ">Current Subscription</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          View and edit your subscription details
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Enhanced Seats Card */}
          <Card className="bg-background">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5   text-muted-foreground" />
                    <h3 className="font-semibold ">Seat Management</h3>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsBillingModalOpen(true)}
                            disabled={!canUpdateBilling}
                          >
                            Add More Seats
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canUpdateBilling && (
                        <TooltipContent>
                          <p>
                            You don't have permission to update billing. Contact
                            your administrator.
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Overall Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold ">{totalSeats}</span>
                    <Badge
                      variant="outline"
                      className={`${
                        totalUsagePercentage > 80
                          ? "border-orange-500 text-orange-600"
                          : "border-green-500 text-green-600"
                      }`}
                    >
                      {Math.round(totalUsagePercentage)}% Used
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalUsed} seats used • {totalSeats - totalUsed} available
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        totalUsagePercentage > 80
                          ? "bg-orange-500"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${totalUsagePercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium ">Seat Breakdown</h4>

                  {/* Dynamic Seat Rows */}
                  {Object.entries(seatsMap).map(([key, data]) => {
                    // Determine labels and icons based on key
                    let label = key.charAt(0).toUpperCase() + key.slice(1);
                    let Icon = Users;
                    let colorClass = "text-gray-600";
                    let bgClass = "bg-gray-600";

                    if (key.includes("student")) {
                      label = "Students";
                      Icon = GraduationCap;
                      colorClass = "text-blue-600";
                      bgClass = "bg-blue-600";
                    } else if (key.includes("faculty")) {
                      label = "Faculty";
                      Icon = UserCheck;
                      colorClass = "text-purple-600";
                      bgClass = "bg-purple-600";
                    } else if (key.includes("device")) {
                      label = "Devices";
                      Icon = CreditCard; // Or Laptop/Device icon if imported
                      colorClass = "text-green-600";
                      bgClass = "bg-green-600";
                    }

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${colorClass}`} />
                          <span className="text-sm font-medium text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {data.used}/{data.purchased}
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`${bgClass} h-1.5 rounded-full`}
                                style={{ width: `${data.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(data.percentage)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {/* Admins (Free) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 " />
                      <span className="text-sm text-muted-foreground">
                        Administrators
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm ">{adminsCount}/10</div>
                        <div className="text-xs text-muted-foreground">
                          Free
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-300 text-gray-500"
                      >
                        Included
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Renewal Card */}
          <Card className="bg-background">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold ">Subscription Details</h3>
                </div>

                {/* Renewal Date */}
                <div>
                  <p className="text-xl text-muted-foreground font-bold">
                    Next Billing:{" "}
                    {nextBillingDate
                      ? new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(new Date(nextBillingDate.replace(" ", "T")))
                      : "Not available"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Seat Purchase •{" "}
                    {currentPlan.billingCycle.charAt(0).toUpperCase() +
                      currentPlan.billingCycle.slice(1)}
                  </p>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-medium ">Billing Breakdown</h4>

                  <div className="space-y-1 text-muted-foreground text-sm">
                    {Object.entries(seatsMap).map(([key, data]) => {
                      const cost =
                        data.purchased * pricing[key][currentPlan.billingCycle];
                      let label = key.charAt(0).toUpperCase() + key.slice(1);
                      if (key.includes("student")) label = "Student";
                      else if (key.includes("faculty")) label = "Faculty";
                      else if (key.includes("device")) label = "Device";

                      return (
                        <div key={key} className="flex justify-between">
                          <span className="">
                            {data.purchased} {label} seats (£
                            {pricing[key][currentPlan.billingCycle]}/
                            {cycleLabel})
                          </span>
                          <span className="font-medium">£{cost}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-muted-foreground">
                      <span>10 Admin seats</span>
                      <span>Free</span>
                    </div>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold ">Total</span>
                    <div className="text-right">
                      <p className="text-lg font-bold ">
                        £{totalSubscriptionCost.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per {cycleLabel}
                      </p>
                    </div>
                  </div>
                  {/* Monthly Equivalent Display for Yearly Plans */}
                  {currentPlan.billingCycle === "yearly" && (
                    <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                      <span>Monthly equivalent:</span>
                      <span className="font-medium">
                        £{monthlyEquivalentTotal.toFixed(2)} / month
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="mt-5 " />

      {/* Billing History Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 " />
          <h2 className="text-xl font-semibold ">Billing History</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          View and download your past invoices
        </p>

        <Card className="bg-background">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black dark:text-white">
                    Invoice
                  </TableHead>
                  <TableHead className="text-black dark:text-white">
                    Date
                  </TableHead>
                  <TableHead className="text-black dark:text-white">
                    Amount
                  </TableHead>
                  <TableHead className="text-black dark:text-white">
                    Status
                  </TableHead>
                  <TableHead className="text-black dark:text-white">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No transactions found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your billing history will appear here
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Billing Modal for Adding Seats */}
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        mode="topup"
        currentPlan={{
          ...currentPlan,
          // Reconstruct plain seats count object for the modal if needed
          studentSeats: seatsMap["student"]?.purchased || 0,
          facultySeats: seatsMap["faculty"]?.purchased || 0,
          // Pass full map if modal supports it, otherwise fallback to known keys
        }}
        organizationName="Acme University"
        onProceed={(data) => {
          setPaymentConfirmationData(data);
          setIsBillingModalOpen(false);
          setIsPaymentConfirmationOpen(true);
        }}
      />

      {/* Payment Confirmation Modal */}
      {paymentConfirmationData && (
        <PaymentConfirmationModal
          isOpen={isPaymentConfirmationOpen}
          onClose={() => setIsPaymentConfirmationOpen(false)}
          checkoutData={paymentConfirmationData}
          onSuccess={() => {
            // Refresh data or show success message if needed
            // The modal itself handles the success toast
            setIsPaymentConfirmationOpen(false);
          }}
        />
      )}

      {/* Payment Methods Modal */}
      <PaymentMethodsModal
        isOpen={isPaymentMethodsModalOpen}
        onClose={() => {
          setIsPaymentMethodsModalOpen(false);
          // Invalidate payment methods query to refetch updated data
          queryClient.invalidateQueries({
            queryKey: queryKeys.orgPaymentMethods(orgId || ""),
          });
        }}
        isOrganization={true}
      />
    </div>
  );
}
