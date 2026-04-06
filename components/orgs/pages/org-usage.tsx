"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  UserPlus,
  MessageSquare,
  Bot,
  Calendar,
  Loader,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useAuthStore } from "@/stores";
import type { UsageActivityResponse } from "@/lib/api/orgs/usage";
import { useOrgApiCalls } from "@/hooks/use-org-queries";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import CustomDatePicker from "@/components/orgs/date-time-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrgUsageProps {
  data: UsageActivityResponse;
  onDateRangeChange?: (startDate: string, endDate: string, preset: string) => void;
}

export default function OrgUsage({ data, onDateRangeChange }: OrgUsageProps) {
  const { user, organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id;
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("Last 30 Days");
  const [selectedModelType, setSelectedModelType] = useState("All");
  const [dateFilter, setDateFilter] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Date range selector for page header
  const [pageDateRangePreset, setPageDateRangePreset] = useState("Last 30 Days");
  const [pageStartDate, setPageStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [pageEndDate, setPageEndDate] = useState<Date | null>(new Date());
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // Get user's first name
  const firstName = user?.first_name || "User";

  // Query for filtered API calls (only when filter is applied)
  const { data: filteredApiCalls, isLoading: isApiCallsLoading } = useOrgApiCalls({
    startDate: dateFilter?.start,
    endDate: dateFilter?.end,
    enabled: !!dateFilter,
  });

  // Helper function to calculate date ranges
  const calculateDateRange = (
    duration: string
  ): { start: string; end: string } | null => {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (duration) {
      case "This Week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        break;
      case "Last Month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
        break;
      case "Last 30 Days":
        return null; // Use default data from API
      case "Custom":
        // For now, return null. You can implement a date picker later
        return null;
      default:
        return null;
    }

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };
  };

  // Handle duration change
  const handleDurationChange = (value: string) => {
    setSelectedDuration(value);
    if (value === "Custom") {
      setIsCustomDateOpen(true);
      return;
    }
    const range = calculateDateRange(value);
    setDateFilter(range);
  };

  // Handle custom date apply
  const handleApplyCustomDate = () => {
    if (customDateRange.from && customDateRange.to) {
      const formatDate = (date: Date) => date.toISOString().split("T")[0];
      setDateFilter({
        start: formatDate(customDateRange.from),
        end: formatDate(customDateRange.to),
      });
      setIsCustomDateOpen(false);
    }
  };

  // Handle custom date cancel
  const handleCancelCustomDate = () => {
    setIsCustomDateOpen(false);
    setCustomDateRange({ from: undefined, to: undefined });
    setSelectedDuration("Last 30 Days");
  };

  // Handle page date range preset change
  const handlePageDateRangeChange = (value: string) => {
    setPageDateRangePreset(value);
    const today = new Date();

    // Always show modal when Custom is selected, even if already selected
    if (value === "Custom") {
      setShowCustomDateModal(true);
      return;
    }

    let calculatedStartDate: Date;
    let calculatedEndDate: Date;

    switch (value) {
      case "Last 30 Days":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        calculatedStartDate = thirtyDaysAgo;
        calculatedEndDate = today;
        break;
      case "Last Month":
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        calculatedStartDate = startOfLastMonth;
        calculatedEndDate = endOfLastMonth;
        break;
      case "This Year":
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        calculatedStartDate = startOfYear;
        calculatedEndDate = today;
        break;
      default:
        return;
    }

    setPageStartDate(calculatedStartDate);
    setPageEndDate(calculatedEndDate);

    // Call callback if provided
    if (onDateRangeChange) {
      const formatDate = (date: Date) => date.toISOString().split("T")[0];
      onDateRangeChange(
        formatDate(calculatedStartDate),
        formatDate(calculatedEndDate),
        value
      );
    }
  };

  // Handle custom date modal close
  const handleCustomDateModalClose = () => {
    setShowCustomDateModal(false);
    if (!pageStartDate || !pageEndDate) {
      // Reset to Last 30 Days if no dates selected
      setPageDateRangePreset("Last 30 Days");
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(new Date().getDate() - 30);
      setPageStartDate(thirtyDaysAgo);
      setPageEndDate(new Date());
    }
  };

  // Format date range for display
  const getPageDateRangeDisplay = () => {
    if (!pageStartDate || !pageEndDate) return "Select date range";
    return `${format(pageStartDate, "MMM d")} - ${format(pageEndDate, "MMM d, yyyy")}`;
  };

  // Transform API data for models table
  const modelsData = useMemo(() => {
    if (!data?.model_usage || !Array.isArray(data.model_usage)) {
      return [];
    }
    return data.model_usage.map((model) => ({
      id: model.modelInstance.id,
      name: model.modelInstance.name,
      type: model.modelInstance.type,
      usage: parseFloat(model.precentage),
      apiCalls: model.ApiCalls,
      photo_url: model.modelInstance.photo_url,
    }));
  }, [data.model_usage]);

  // Filter models based on selected type
  const filteredModels = useMemo(() => {
    if (selectedModelType === "All") {
      return modelsData;
    }
    return modelsData.filter(
      (model) => model.type.toLowerCase() === selectedModelType.toLowerCase()
    );
  }, [modelsData, selectedModelType]);

  const modelTypes = ["All", "Chat", "Image", "Audio", "Video"];

  // Type badge colors
  const getTypeBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "chat":
        return { bg: "bg-blue-100", text: "text-blue-800" };
      case "image":
        return { bg: "bg-purple-100", text: "text-purple-800" };
      case "audio":
        return { bg: "bg-green-100", text: "text-green-800" };
      case "video":
        return { bg: "bg-red-100", text: "text-red-800" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800" };
    }
  };

  const seatData = [
    { name: "Lecturers", value: 75, color: "#3B82F6" },
    { name: "Students", value: 60, color: "#10B981" },
    { name: "Departments", value: 45, color: "#F59E0B" },
    { name: "Available", value: 20, color: "#E5E7EB" },
  ];

  // Get seat data from store
  const seatsInfo = organizationDetails?.seats_info;

  // Helper to determine view mode
  const seats = seatsInfo ? Object.values(seatsInfo) : [];
  const hasSystemSeats = seats.some((seat) => seat.for_system === true);
  const hasPeopleSeats = seats.some((seat) => seat.for_system === false);

  let viewMode: "devices" | "hybrid" | "people" = "people";
  if (hasSystemSeats && !hasPeopleSeats) {
    viewMode = "devices";
  } else if (hasSystemSeats && hasPeopleSeats) {
    viewMode = "hybrid";
  }

  // Determine KPI Labels
  const kpiLabels = useMemo(() => {
    switch (viewMode) {
      case "devices":
        return {
          newJoiners: "New Activations",
          activeUsers: "Active Devices",
          avgPrompts: "Avg Prompts/Device",
        };
      case "hybrid":
        return {
          newJoiners: "New Signups",
          activeUsers: "Active Accounts",
          avgPrompts: "Avg Prompts/Account",
        };
      case "people":
      default:
        return {
          newJoiners: "New Comers",
          activeUsers: "Active Users",
          avgPrompts: "Avg Prompts/User",
        };
    }
  }, [viewMode]);

  // Calculate seat utilization
  const seatUtilization = useMemo(() => {
    if (!seatsInfo) {
      return [];
    }

    return Object.entries(seatsInfo).map(([key, info]) => {
      const total = parseInt(info.purchased_seats);
      const used = total - info.remaining_seats;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      // Determine Name
      let name = key.charAt(0).toUpperCase() + key.slice(1);
      if (key.toLowerCase().includes("student")) name = "Students";
      else if (key.toLowerCase().includes("faculty")) name = "Faculty";
      else if (key.toLowerCase().includes("device")) name = "Devices";

      // Determine Color
      let color = "#9CA3AF"; // Default Gray
      if (key.toLowerCase().includes("student"))
        color = "#3B82F6"; // Blue-500
      else if (key.toLowerCase().includes("faculty"))
        color = "#EC4899"; // Pink-500
      else if (key.toLowerCase().includes("device"))
        color = "#16A34A"; // Green-600

      return {
        name,
        value: parseFloat(percentage.toFixed(1)),
        color,
        used,
        total,
      };
    });
  }, [seatsInfo]);

  // Calculate total seats
  const totalSeatsUsed = seatUtilization.reduce(
    (sum, seat) => sum + seat.used,
    0
  );
  const totalSeatsAvailable = seatUtilization.reduce(
    (sum, seat) => sum + seat.total,
    0
  );

  // Transform API calls data for chart
  const apiCallsData = useMemo(() => {
    const dataToUse =
      dateFilter && filteredApiCalls ? filteredApiCalls : data.api_calls;

    // Safety check for null/undefined data
    if (!dataToUse || typeof dataToUse !== 'object') {
      return [];
    }

    return Object.entries(dataToUse).map(([date, calls]) => {
      const dateObj = new Date(date);
      // Check for invalid date
      const month = isNaN(dateObj.getTime())
        ? "Invalid"
        : dateObj.toLocaleDateString("en-US", { month: "short" });
      return { month, calls, date };
    });
  }, [data.api_calls, dateFilter, filteredApiCalls]);

  // Calculate total API calls from model usage
  const totalApiCalls = useMemo(() => {
    if (!data?.model_usage || !Array.isArray(data.model_usage)) {
      return 0;
    }
    return data.model_usage.reduce((sum, model) => sum + (model.ApiCalls || 0), 0);
  }, [data.model_usage]);

  // Get total number of active models
  const totalModels = data?.model_usage?.length || 0;

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + "k";
    }
    return value.toString();
  };

  const filters = useMemo(() => {
    if (viewMode === "hybrid") {
      return ["All", "Members", "Devices"];
    }
    return ["All", "Lecturers", "Students", "Departments"];
  }, [viewMode]);

  const durations = ["Last 30 Days", "This Week", "Last Month", "Custom"];

  return (
    <main className="min-h-screen  ">
      <div className="">
        {/* Page Header with Controls */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">
              Hi {firstName},
            </h1>
            <p className="text-lg text-muted-foreground">
              {`Here are your organization's full usage statistics for this period.`}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <Select value={pageDateRangePreset} onValueChange={handlePageDateRangeChange}>
              <SelectTrigger className="w-[240px]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{getPageDateRangeDisplay()}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Report Button */}
            <Button size="sm" variant="outline" className="text-sm">
              Export Report
            </Button>
          </div>
        </div>

        {/* Custom Date Modal */}
        <Dialog open={showCustomDateModal} onOpenChange={handleCustomDateModalClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Custom Date Range</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <CustomDatePicker
                  value={pageStartDate}
                  onChange={(date) => setPageStartDate(date)}
                  placeholder="Select start date"
                  maxDate={pageEndDate || undefined}
                  allowPastDates={true}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <CustomDatePicker
                  value={pageEndDate}
                  onChange={(date) => setPageEndDate(date)}
                  placeholder="Select end date"
                  minDate={pageStartDate || undefined}
                  maxDate={new Date()}
                  allowPastDates={true}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCustomDateModalClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (pageStartDate && pageEndDate) {
                      setShowCustomDateModal(false);
                      // Call callback if provided
                      if (onDateRangeChange) {
                        const formatDate = (date: Date) => date.toISOString().split("T")[0];
                        onDateRangeChange(
                          formatDate(pageStartDate),
                          formatDate(pageEndDate),
                          "Custom"
                        );
                      }
                    }
                  }}
                  disabled={!pageStartDate || !pageEndDate}
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="">
          <div className="flex gap-6">
            {/* KPI Cards - 60% width */}
            <div className="w-[60%] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* New Joiners */}
                <Card className="p-4 bg-background">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col space-y-1">
                      <h3 className="text-sm font-medium dark:text-muted-foreground ">
                        {kpiLabels.newJoiners}
                      </h3>
                      <p className="text-xl dark:text-gray-50 font-extrabold">
                        {data.new_joiners.count}
                      </p>
                      <span className="text-xs dark:bg-lime-900 dark:text-lime-400 bg-green-100 text-green-700 px-2 py-1 rounded w-fit">
                        +{data.new_joiners.percentage}%
                      </span>
                    </div>
                    <CardHeader className="bg-accent p-2 rounded-md ">
                      <UserPlus className="h-5 w-5    text-blue-600" />
                    </CardHeader>
                  </div>
                </Card>

                {/* Total Queries */}
                <Card className="p-4 bg-background">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col space-y-1">
                      <h3 className="text-sm font-medium dark:text-muted-foreground  ">
                        Total Prompt
                      </h3>
                      <p className="text-xl font-bold">
                        {formatNumber(data.total_queries.count)}
                      </p>
                      <span className="text-xs dark:bg-lime-900 dark:text-lime-400 bg-green-100 text-green-700 px-2 py-1 rounded w-fit">
                        +{data.total_queries.percentage}%
                      </span>
                    </div>
                    <CardHeader className="bg-accent p-2 rounded-md">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                  </div>
                </Card>

                {/* Active Users */}
                <Card className="p-4 bg-background">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col space-y-1">
                      <h3 className="text-sm font-medium dark:text-muted-foreground ">
                        {kpiLabels.activeUsers}
                      </h3>
                      <p className="text-xl font-bold">
                        {data.active_users.count}
                      </p>
                      <span className="text-xs dark:bg-lime-900 dark:text-lime-400 bg-green-100 text-green-700 px-2 py-1 rounded w-fit">
                        +{data.active_users.percentage}%
                      </span>
                    </div>
                    <CardHeader className="bg-accent p-2 rounded-md">
                      <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                  </div>
                </Card>

                {/* Average Prompt per User */}
                <Card className="p-4 bg-background">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col space-y-1">
                      <h3 className="text-sm font-medium dark:text-muted-foreground ">
                        {kpiLabels.avgPrompts}
                      </h3>
                      <p className="text-xl font-bold">
                        {parseFloat(
                          data.average_prompts_per_user.average
                        ).toFixed(0)}
                      </p>
                      <span className="text-xs bg-green-100 dark:bg-lime-900 dark:text-lime-400 text-green-700 px-2 py-1 rounded w-fit">
                        +{data.average_prompts_per_user.percentage}%
                      </span>
                    </div>
                    <CardHeader className="bg-accent p-2 rounded-md">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                  </div>
                </Card>
              </div>

              {/* API Calls Chart Card */}
              <Card
                className="p-4 bg-background"
                style={{ minHeight: "300px" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">API Calls </h3>

                  {/* Dropdown Filters */}
                  <div className="flex space-x-3">
                    {/* Type Filter Dropdown - Only for Hybrid Mode */}
                    {viewMode === "hybrid" && (
                      <Select
                        value={selectedFilter}
                        onValueChange={setSelectedFilter}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {filters.map((filter) => (
                            <SelectItem key={filter} value={filter}>
                              {filter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Duration Filter Dropdown */}
                    <Select
                      value={selectedDuration}
                      onValueChange={handleDurationChange}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration} value={duration}>
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Custom Date Range Popover */}
                    <Popover
                      open={isCustomDateOpen}
                      onOpenChange={setIsCustomDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-fit justify-start text-left font-normal",
                            !customDateRange.from &&
                            !customDateRange.to &&
                            "text-muted-foreground",
                            selectedDuration !== "Custom" && "hidden"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {customDateRange.from && customDateRange.to ? (
                            <>
                              {format(customDateRange.from, "MMM dd")} -{" "}
                              {format(customDateRange.to, "MMM dd, yyyy")}
                            </>
                          ) : (
                            <span>Pick date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <div className="p-3">
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={customDateRange.from}
                            selected={{
                              from: customDateRange.from,
                              to: customDateRange.to,
                            }}
                            onSelect={(range) => {
                              setCustomDateRange({
                                from: range?.from,
                                to: range?.to,
                              });
                            }}
                            numberOfMonths={2}
                          />
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelCustomDate}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleApplyCustomDate}
                              disabled={
                                !customDateRange.from || !customDateRange.to
                              }
                              className="flex-1"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Area Chart */}
                <div className="h-56 relative">
                  {isApiCallsLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                      <Loader className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  )}
                  {!isApiCallsLoading && apiCallsData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <BarChart3 className="w-12 h-12 text-gray-400" />
                        <p className="text-sm text-muted-foreground">
                          No API calls data found for this period
                        </p>
                      </div>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={apiCallsData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 10,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        tickFormatter={formatNumber}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className=" p-3 border  rounded-lg shadow-lg">
                                <p className="text-sm font-medium ">{label}</p>
                                <p className="text-sm text-blue-600">
                                  <span className="font-medium">
                                    API Calls:{" "}
                                  </span>
                                  {formatNumber(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="linear"
                        dataKey="calls"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#3B82F6", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Seats Utilization Card - 40% width */}
            <div className="w-[40%]">
              <Card
                className="p-4 h-full bg-background"
                style={{ minHeight: "500px" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Seats Utilization</h3>
                  <span className="text-sm font-medium">
                    Total: {totalSeatsAvailable}
                  </span>
                </div>

                {/* Donut Chart */}
                <div className="h-48 mb-6 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={seatUtilization}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {seatUtilization.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalSeatsUsed}</div>
                      <div className="text-sm">Used</div>
                    </div>
                  </div>
                </div>

                {/* Group Buttons */}
                <div className="space-y-2">
                  {seatUtilization.map((group, index) => (
                    <button
                      key={index}
                      className="w-full flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:hover:bg-hoverColorPrimary
                       hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        ></div>
                        <span className="text-sm font-medium">
                          {group.name} ({group.used}/{group.total})
                        </span>
                      </div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: group.color }}
                      >
                        {group.value}%
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Row - Models Usage Table */}
          <div className="mt-6">
            <Card className="p-4 bg-background" style={{ minHeight: "400px" }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Models Usage</h3>
                  <p className="text-sm text-muted-foreground  mt-1">
                    <span className="font-bold ">
                      {formatNumber(totalApiCalls)}
                    </span>{" "}
                    total API calls distributed across{" "}
                    <span className="font-bold ">{totalModels}</span> active{" "}
                    {totalModels === 1 ? "model" : "models"}
                  </p>
                </div>

                {/* Model Type Filter */}
                <Select
                  value={selectedModelType}
                  onValueChange={setSelectedModelType}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Models Table */}
              <Table>
                <TableHeader className="">
                  <TableRow>
                    <TableHead className="text-black dark:text-white">
                      Model Name
                    </TableHead>
                    <TableHead className="text-black dark:text-white">
                      Type
                    </TableHead>
                    <TableHead className="text-black dark:text-white">
                      Usage
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-muted-foreground">
                  {filteredModels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Bot className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-muted-foreground">
                            No{" "}
                            {selectedModelType === "All"
                              ? ""
                              : selectedModelType.toLowerCase()}{" "}
                            models found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModels.map((model) => {
                      const badgeStyle = getTypeBadgeStyle(model.type);
                      return (
                        <TableRow key={model.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={model.photo_url} />
                                <AvatarFallback className="bg-blue-100 flex items-center justify-center">
                                  <Bot className="w-4 h-4 text-blue-600" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{model.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text}`}
                            >
                              {model.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 text-muted-foreground rounded-full transition-all duration-300"
                                  style={{ width: `${model.usage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold">
                                {model.usage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
