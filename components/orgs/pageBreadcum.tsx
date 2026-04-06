"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface PageBreadcrumbProps {
  excludePages: string[];
}

export default function PageBreadcrumb({ excludePages }: PageBreadcrumbProps) {
  const [dateRange, setDateRange] = useState("This Week");
  const router = useRouter();
  const { organizationDetails } = useAuthStore();
  const dateRangeOptions = [
    "This Week",
    "Last Month",
    "Last 3 Months",
    "This Year",
    "Custom",
  ];

  const { setOrganizationDetails } = useAuthStore();

  // Format date range display
  const getDateRangeDisplay = () => {
    const currentDate = new Date();
    const startOfWeek = new Date(
      currentDate.setDate(currentDate.getDate() - currentDate.getDay())
    );
    const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    switch (dateRange) {
      case "This Week":
        return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
      case "Last Month":
        return "Oct 1st - Oct 31st";
      case "Last 3 Months":
        return "Aug 1st - Oct 31st";
      case "This Year":
        return "Jan 1st - Dec 31st";
      case "Custom":
        return "Jan 4th - Nov 20th";
      default:
        return "Jan 4th - Nov 20th";
    }
  };

  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentPage = segments[segments.length - 1] || "overview";

  // Exclude breadcrumb for classes, devices, courses, and sessions pages
  if (
    excludePages.includes(currentPage) ||
    currentPage === "classes" ||
    currentPage === "devices" ||
    currentPage === "courses" ||
    currentPage === "sessions" ||
    pathname.includes("/classes") ||
    pathname.includes("/devices") ||
    pathname.includes("/courses") ||
    pathname.includes("/sessions")
  ) {
    return null;
  }

  // Check if organization has student or faculty seats
  const hasNonDeviceSeats = () => {
    if (!organizationDetails?.seats_info) return false;

    const seatsInfo = organizationDetails.seats_info;

    // Check if student seats exist and are greater than 0
    const studentSeats = seatsInfo.student?.purchased_seats;
    const hasStudentSeats = studentSeats && parseInt(studentSeats) > 0;

    // Check if faculty seats exist and are greater than 0
    const facultySeats = seatsInfo.faculty?.purchased_seats;
    const hasFacultySeats = facultySeats && parseInt(facultySeats) > 0;

    // Show button if EITHER student OR faculty seats exist
    // Hide button if BOTH are zero/null (only device_edu)
    return hasStudentSeats || hasFacultySeats;
  };

  // Function to get action buttons based on current route
  const getActionButtons = () => {
    switch (currentPage) {
      case "overview":
        // Only show Manage Members button if there are non-device seats
        if (!hasNonDeviceSeats()) {
          return null;
        }
        return (
          <Button
            onClick={() => {
              router.push(`/orgs/${organizationDetails?.slug}/members`);
            }}
            size="sm"
            variant="outline"
            className="text-sm"
          >
            <Plus className="h-3 w-3 mr-2" />
            Manage Members
          </Button>
        );
      case "members":
        return null;
      case "usage":
        return null;
      case "billing":
        return null;
      case "settings":
        return null;
      case "support":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        {/* Dynamic Breadcrumb/Welcome */}
        <div className="flex items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-medium capitalize text-foreground">
              {organizationDetails?.name}
            </span>
            <span className="mx-2">/</span>
            <span className="capitalize">{currentPage.replace("-", " ")}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">{getActionButtons()}</div>
      </div>
    </div>
  );
}
