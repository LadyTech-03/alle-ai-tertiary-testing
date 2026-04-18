"use client";
import { useState } from "react";
import {
  Users,
  GraduationCap,
  CreditCard,
  CalendarIcon,
  LaptopMinimalCheck,
  Ticket,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores";
import { useOrgPaymentStore } from "@/stores/edu-store";

import { MoreVertical, Info, User } from "lucide-react";
import { BillingModal } from "../modals/billing-modal";

import { SignupAnalytics } from "../signupAnalytics";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgSignupActivity, useOrgPreview } from "@/hooks/use-org-queries";
import { Skeleton } from "@/components/ui/skeleton";
import AdminActivityLog from "../adminActivityLog";
import { LiveUsersMonitoring } from "../LiveUsersMonitoring";
import { useRouter } from "next/navigation";
import { getOrganizationViewMode } from "@/lib/org-utils";
export default function OrgOverview() {

  const { organizationDetails } = useAuthStore();
  const router = useRouter();
  // Date range state for analytics
  const [dateRangeType, setDateRangeType] = useState<string>("last-30-days");
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [shouldFetchCustom, setShouldFetchCustom] = useState(false);
  const [signupType, setSignupType] = useState<"all" | "member" | "device">(
    "all"
  );

  // Helper function to calculate preset date ranges
  const handleDateRangeChange = (value: string) => {
    setDateRangeType(value);
    setShouldFetchCustom(false); // Reset custom fetch flag
    const today = new Date();

    switch (value) {
      case "last-30-days":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setStartDate(thirtyDaysAgo);
        setEndDate(today);
        break;
      case "this-week":
        const startOfWeek = new Date();
        startOfWeek.setDate(today.getDate() - today.getDay());
        setStartDate(startOfWeek);
        setEndDate(today);
        break;
      case "last-month":
        const startOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        setStartDate(startOfLastMonth);
        setEndDate(endOfLastMonth);
        break;
      case "custom":
        // Keep current dates, user will select via calendar
        setIsCalendarOpen(true);
        break;
    }
  };

  // Format dates for API
  const formatDateForAPI = (date: Date | undefined) => {
    return date ? format(date, "yyyy-MM-dd") : undefined;
  };

  // Determine if we should pass date params to API
  const shouldPassDateParams =
    dateRangeType !== "last-30-days" &&
    (dateRangeType === "custom" ? shouldFetchCustom : true);

  // Fetch signup analytics data using the centralized hook
  const {
    data: signupAnalyticsData = [],
    isFetching: isAnalyticsFetching,
    isLoading,
  } = useOrgSignupActivity({
    startDate: shouldPassDateParams ? formatDateForAPI(startDate) : undefined,
    endDate: shouldPassDateParams ? formatDateForAPI(endDate) : undefined,
  });

  const { data: previewData, isLoading: isPreviewLoading } = useOrgPreview();
  const topModels = previewData?.top_models || [];

  const { nextBillingDate, nextBillingMessage } = useOrgPaymentStore();
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // Determine subscription status based on nextBillingDate
  const isSubscribed = !!nextBillingDate;
  // console.log(organizationDetails);
  const seatInfo = organizationDetails?.seats_info || {};
  const memberInfo = organizationDetails?.user_status_info;
  const totalMembers = Object.values(memberInfo || {}).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  // Helper to determine view mode
  const viewMode = getOrganizationViewMode(
    organizationDetails?.seats_info as any
  );

  // Analytics Description Logic
  const getAnalyticsDescription = () => {
    switch (viewMode) {
      case "devices":
        return "Organization device activations over the selected period";
      case "hybrid":
        return "Organization account creation and device activations";
      case "people":
      default:
        return "Organization member signups over the selected period";
    }
  };

  // Calculate totals for the first card
  let totalPurchased = 0;
  let totalRemaining = 0;

  Object.values(seatInfo).forEach((seat) => {
    totalPurchased += Number(seat.purchased_seats || 0);
    totalRemaining += Number(seat.remaining_seats || 0);
  });

  // Helper for progress bar colors
  const getProgressBarColor = (key: string) => {
    if (key.includes("student")) return "bg-purple-600";
    if (key.includes("faculty")) return "bg-blue-600";
    if (key.includes("device")) return "bg-orange-600"; // New color for devices
    return "bg-slate-600"; // Fallback
  };

  // Helper for formatting seat labels
  const formatSeatLabel = (key: string) => {
    // Handle specific keys like device_edu
    if (key === "device_edu") return "Devices";
    // Replace underscores with spaces and capitalize
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Configuration for the Second Card (Members/Devices)
  const getSecondCardConfig = () => {
    switch (viewMode) {
      case "devices":
        return {
          title: "Devices",
          icon: <LaptopMinimalCheck className="h-6 w-6 text-green-600" />,
          labels: {
            total: "Total Devices",
            active: "Active",
            accessed: "Connected",
            notAccessed: "Never Connected",
            inactive: "Inactive",
          },
        };
      case "hybrid":
        return {
          title: "Accounts & Devices",
          icon: <Users className="h-6 w-6 text-blue-600" />,
          labels: {
            total: "Total Accounts",
            active: "Active",
            accessed: "Accessed",
            notAccessed: "Not Accessed",
            inactive: "Inactive",
          },
        };
      case "people":
      default:
        return {
          title: "Members",
          icon: <GraduationCap className="h-6 w-6 text-green-600" />,
          labels: {
            total: "Total Added",
            active: "Active",
            accessed: "Accessed",
            notAccessed: "Not Accessed",
            inactive: "Inactive",
          },
        };
    }
  };

  const cardConfig = getSecondCardConfig();

  return (
    <>
      <TooltipProvider>
        <main className="">
          {/* kpi cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* First Card - Seats */}
            <Card className="bg-background ">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg">
                    <Ticket className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Seats Usage</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Total Seats */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Seats:
                  </span>
                  <span className="font-semibold text-lg">
                    {totalPurchased}
                  </span>
                </div>

                {/* Dynamic Seats Progress Bars */}
                {Object.entries(seatInfo).map(([key, seat]) => {
                  const purchased = Number(seat.purchased_seats || 0);
                  const remaining = Number(seat.remaining_seats || 0);
                  const used = purchased - remaining;
                  const usagePercentage =
                    purchased > 0 ? (used / purchased) * 100 : 0;

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium ">
                          {formatSeatLabel(key)}
                        </span>
                        <span className="text-sm font-medium">
                          {used.toString()}/{purchased.toString()}
                        </span>
                      </div>
                      <Progress
                        value={usagePercentage}
                        className="h-2"
                        indicatorClassName={getProgressBarColor(key)}
                      />
                    </div>
                  );
                })}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 " />
                    <span className="text-sm ">Administrators</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm ">
                        {organizationDetails?.admins_count}/10
                      </div>
                      {/* <div className="text-xs text-gray-500">Free</div> */}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-300 dark:border-gray-500 "
                    >
                      Included
                    </Badge>
                  </div>
                </div>

                {/* Remaining Seats */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    Remaining:
                  </span>
                  <span className="font-medium text-green-600">
                    {totalRemaining.toString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Second Card - Dynamic (Members/Devices/Accounts) */}
            <Card className="bg-background">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg">
                    {cardConfig.icon}
                  </div>
                  <CardTitle className="text-lg">{cardConfig.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {cardConfig.labels.total}:
                  </span>
                  <span className="font-medium">{totalMembers}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {cardConfig.labels.active}:
                  </span>
                  <span className="font-medium">
                    {memberInfo?.active_users_count}{" "}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {cardConfig.labels.accessed}:
                  </span>
                  <span className="font-medium">
                    {memberInfo?.accessed_users_count}{" "}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {cardConfig.labels.notAccessed}:
                  </span>
                  <span className="font-medium">
                    {memberInfo?.unaccessed_users_count}{" "}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {cardConfig.labels.inactive}:
                  </span>
                  <span className="font-medium text-orange-600">
                    {memberInfo?.inactive_users_count}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Third Card - Billing */}
            <Card className="bg-background">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Billing</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {!isSubscribed ? (
                  // Not Subscribed State
                  <>
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        No active subscription
                      </div>
                      <div className="text-xs text-muted-foreground mb-4">
                        Get started with a plan to add members to your
                        organization
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => setIsBillingModalOpen(true)}
                              className="w-full"
                              size="sm"
                              variant="default"
                              disabled={
                                !(
                                  (organizationDetails?.user_permissions?.includes(
                                    "view_billing"
                                  ) &&
                                    organizationDetails?.user_permissions?.includes(
                                      "update_billing"
                                    )) ||
                                  organizationDetails?.is_owner
                                )
                              }
                            >
                              Buy Seats
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!(
                          (organizationDetails?.user_permissions?.includes(
                            "view_billing"
                          ) &&
                            organizationDetails?.user_permissions?.includes(
                              "update_billing"
                            )) ||
                          organizationDetails?.is_owner
                        ) && (
                          <TooltipContent>
                            <p>
                              You don&apos;t have permission to update billing.
                              Contact your administrator.
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </>
                ) : (
                  // Subscribed State
                  <>
                    <div className="flex justify-between mt-6 items-center">
                      <span className="text-sm text-muted-foreground">
                        Next Billing:
                      </span>
                      <span className="font-medium">
                        {nextBillingDate
                          ? format(new Date(nextBillingDate), "MMM d, yyyy")
                          : "N/A"}
                      </span>
                    </div>

                    {nextBillingMessage && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        <span className="font-medium text-xs">
                          {nextBillingMessage}
                        </span>
                      </div>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => {
                                router.push(
                                  `/orgs/${organizationDetails?.slug}/billing`
                                );
                                // setIsBillingModalOpen(true);
                              }}
                              className="w-full mt-3"
                              size="sm"
                              variant="default"
                              disabled={
                                !(
                                  organizationDetails?.is_owner ||
                                  organizationDetails?.user_permissions?.includes(
                                    "update_billing"
                                  )
                                )
                              }
                            >
                              Manage Subscription
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!(
                          organizationDetails?.is_owner ||
                          organizationDetails?.user_permissions?.includes(
                            "update_billing"
                          )
                        ) && (
                          <TooltipContent>
                            <p>
                              You don&apos;t have permission to update billing.
                              Contact your administrator.
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics & Top Models Section */}
          <div className="grid grid-cols-12 gap-6 mt-8">
            {/* Signup Analytics (70%) */}
            <div className="col-span-12 lg:col-span-8">
              <Card className="h-full bg-background">
                <CardHeader className="pl-6 pr-6 pt-6 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold">
                        Analytics
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getAnalyticsDescription()}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Hybrid Mode Filter */}
                      {viewMode === "hybrid" && (
                        <Select
                          value={signupType}
                          onValueChange={(value: any) => setSignupType(value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="member">Members</SelectItem>
                            <SelectItem value="device">Devices</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <Select
                        value={dateRangeType}
                        onValueChange={handleDateRangeChange}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="last-30-days">
                            Last 30 days
                          </SelectItem>
                          <SelectItem value="this-week">This week</SelectItem>
                          <SelectItem value="last-month">Last month</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Date inputs for Custom Date Range */}
                      {dateRangeType === "custom" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={
                              startDate ? format(startDate, "yyyy-MM-dd") : ""
                            }
                            onChange={(e) =>
                              setStartDate(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined
                              )
                            }
                            className="px-3 py-2 text-sm border rounded-md bg-background"
                            placeholder="Start date"
                            disabled={isLoading}
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="date"
                            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                            onChange={(e) =>
                              setEndDate(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined
                              )
                            }
                            min={
                              startDate ? format(startDate, "yyyy-MM-dd") : ""
                            }
                            className="px-3 py-2 text-sm border rounded-md bg-background"
                            placeholder="End date"
                            disabled={isLoading}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              setShouldFetchCustom(true);
                            }}
                            disabled={
                              !startDate || !endDate || isAnalyticsFetching
                            }
                          >
                            {isAnalyticsFetching ? "Loading..." : "Apply"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SignupAnalytics
                    data={signupAnalyticsData}
                    isLoading={isLoading}
                    isFetching={isAnalyticsFetching}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Top Models Card (30%) */}
            <div className="col-span-12 lg:col-span-4">
              <Card className="bg-background h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-semibold">
                    Top Models
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm pb-3 border-b text-muted-foreground">
                      <span>Source</span>
                      <span>Api calls</span>
                    </div>

                    {isPreviewLoading ? (
                      // Skeleton Loading State
                      Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-4 w-8" />
                        </div>
                      ))
                    ) : topModels.length > 0 ? (
                      // Real Data List
                      topModels.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            {/* Model Avatar */}
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                              {item.modelInstance.photo_url ? (
                                <img
                                  src={item.modelInstance.photo_url}
                                  alt={item.modelInstance.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    // Fallback if image fails
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement!.innerText =
                                      item.modelInstance.name.charAt(0);
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {item.modelInstance.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium">
                              {item.modelInstance.name}
                            </span>
                          </div>
                          <span className="font-semibold text-sm">
                            {item.ApiCalls}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Empty State
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No usage data available yet.</p>
                        <p className="text-xs mt-1">
                          Top models will appear here once your organization
                          starts using the API.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hidden Sections (Top Pages & Active Users) */}
          <div className="hidden">
            {/* Top Pages Card */}
            {/* <Card className="bg-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-semibold">
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm  pb-3 border-b">
                    <span>Source</span>
                    <span>Pageview</span>
                  </div>
                  {pagesData.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="">{item.source}</span>
                      <span className=" font-medium">{item.pageviews}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}

            {/* Active Users Card */}
            {/* <LiveUsersMonitoring /> */}
          </div>

          {/* Admin Activity Logs Section */}
          <div className="mt-8">
            <AdminActivityLog />
          </div>
        </main>
      </TooltipProvider>
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        // mode for topup later
      />
    </>
  );
}
