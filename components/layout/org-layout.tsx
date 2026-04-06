"use client";
import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  Settings,
  PanelLeft,
  Home,
  Users,
  BarChart3,
  CreditCard,
  HelpCircle,
  X,
  LaptopMinimalCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import OrgProfileDropdown from "../orgs/profile-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores";

// Mock organization data - will be replaced with props later
interface OrganizationData {
  name: string;
  logo?: string;
  initial: string;
  tier: string;
  color: string;
}

const mockOrgData: OrganizationData = {
  name: "Kwame Nkrumah University of Science and Technology",
  initial: "K",
  tier: "alle-ai edu",
  color: "from-blue-600 to-purple-600",
  logo: "/knust_logo.png",
};

interface SidebarItem {
  title: string;
  icon: ReactNode;
  isActive?: boolean;
  href?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Overview",
    icon: <Home className="h-5 w-5" />,
    href: "overview",
  },
  {
    title: "Members",
    icon: <Users className="h-5 w-5" />,
    href: "members",
  },
  {
    title: "Workspace",
    icon: <LaptopMinimalCheck className="h-5 w-5" />,
    href: "classes",
  },
  {
    title: "Usage & Activity",
    icon: <BarChart3 className="h-5 w-5" />,
    href: "usage",
  },
  {
    title: "Billing",
    icon: <CreditCard className="h-5 w-5" />,
    href: "billing",
  },
  {
    title: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "settings",
  },
  {
    title: "Support",
    icon: <HelpCircle className="h-5 w-5" />,
    href: "support",
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function OrgLayout({ children }: DashboardLayoutProps) {
  const [notifications] = useState(5);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { organizationDetails } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Function to check if a nav item is active
  const isNavItemActive = (href: string) => {
    // Get the last segment of current pathname
    const currentPath = pathname.split("/").pop() || "overview";

    // Special case: classes (workspace) should be active for classes, configurations, courses, AND sessions routes
    if (href === "classes") {
      return (
        currentPath === "sessions" ||
        currentPath === "classes" ||
        currentPath === "configurations" ||
        currentPath === "courses" ||
        pathname.includes("/sessions") ||
        pathname.includes("/classes") ||
        pathname.includes("/configurations") ||
        pathname.includes("/courses")
      );
    }

    // Check if current path matches the href or if we're on the default route
    return currentPath === href || (currentPath === "" && href === "overview");
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col border-r">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`flex aspect-square size-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white border border-border shadow-md overflow-hidden p-1`}
              >
                {organizationDetails?.logo_url ? (
                  <Image
                    src={organizationDetails.logo_url}
                    alt={organizationDetails.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {organizationDetails?.slug}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm leading-tight line-clamp-2">
                  {organizationDetails?.name}
                </h2>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 mt-1">
                  {organizationDetails?.subscribed_plan}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-border" />

          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {sidebarItems
                .filter((item) => {
                  // Hide Members if user doesn't have view_members permission OR no faculty/student seats
                  if (item.href === "members") {
                    const hasPermission =
                      organizationDetails?.is_owner ||
                      organizationDetails?.user_permissions?.includes(
                        "view_members"
                      ) ||
                      false;

                    if (!hasPermission) return false;

                    // Check if faculty or students seat types exist with purchased seats > 0
                    if (
                      !organizationDetails?.seat_types ||
                      !organizationDetails?.seats_info
                    ) {
                      return false;
                    }

                    const hasFaculty =
                      organizationDetails.seat_types.includes("faculty") &&
                      organizationDetails.seats_info["faculty"] &&
                      parseInt(
                        organizationDetails.seats_info["faculty"]
                          .purchased_seats
                      ) > 0;

                    const hasStudents =
                      organizationDetails.seat_types.includes("students") &&
                      organizationDetails.seats_info["students"] &&
                      parseInt(
                        organizationDetails.seats_info["students"]
                          .purchased_seats
                      ) > 0;

                    // Check if at least one seat has for_system: false
                    const hasNonSystemSeat = Object.values(
                      organizationDetails.seats_info
                    ).some((seat) => seat.for_system === false);

                    return (hasFaculty || hasStudents) && hasNonSystemSeat;
                  }

                  // Owners can see everything else
                  if (organizationDetails?.is_owner) {
                    return true;
                  }

                  // Hide billing if user doesn't have view_billing permission
                  if (item.href === "billing") {
                    return (
                      organizationDetails?.user_permissions?.includes(
                        "view_billing"
                      ) || false
                    );
                  }

                  // Hide Workspace (classes) if no system seat is available
                  if (item.href === "classes") {
                    if (!organizationDetails?.seats_info) return false;
                    return Object.values(organizationDetails.seats_info).some(
                      (seat) => seat.for_system === true
                    );
                  }

                  return true;
                })
                .map((item) => (
                  <button
                    key={item.title}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.href) {
                        router.push(item.href);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-left",
                      isNavItemActive(item.href || "")
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </button>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden transform border-r bg-background dark:bg-sideBarBackground transition-all duration-300 ease-in-out md:block",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          <div className={cn("p-4", !sidebarOpen && "px-2")}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div
                  className={`flex aspect-square size-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white border border-border shadow-md overflow-hidden p-1`}
                >
                  {organizationDetails?.logo_url ? (
                    <Image
                      src={organizationDetails.logo_url}
                      alt={organizationDetails.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-lg font-bold">
                      {organizationDetails?.slug}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm leading-tight line-clamp-2">
                    {organizationDetails?.name}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 mt-1"
                  >
                    {organizationDetails?.subscribed_plan}
                  </Badge>
                </div>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <div
                        className={`flex aspect-square size-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white border border-border shadow-md overflow-hidden p-1`}
                      >
                        {organizationDetails?.logo_url ? (
                          <Image
                            src={organizationDetails.logo_url}
                            alt={organizationDetails.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-sm font-bold">
                            {organizationDetails?.slug}
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-xs bg-background"
                  >
                    <div>
                      <p className="font-semibold text-sm leading-tight">
                        {organizationDetails?.name}
                      </p>
                      {/* <p className="text-xs text-muted-foreground mt-1">
                        {organizationDetails?.subscribed_plan}
                      </p> */}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Divider */}
          <div
            className={cn(
              "border-t border-border",
              sidebarOpen ? "mx-4" : "mx-2"
            )}
          />

          <ScrollArea
            className={cn("flex-1 py-4", sidebarOpen ? "px-3" : "px-2")}
          >
            <div className="space-y-2">
              {sidebarItems
                .filter((item) => {
                  // Hide Members if user doesn't have view_members permission OR no faculty/student seats
                  if (item.href === "members") {
                    const hasPermission =
                      organizationDetails?.is_owner ||
                      organizationDetails?.user_permissions?.includes(
                        "view_members"
                      ) ||
                      false;

                    if (!hasPermission) return false;

                    // Check if faculty or students seat types exist with purchased seats > 0
                    if (
                      !organizationDetails?.seat_types ||
                      !organizationDetails?.seats_info
                    ) {
                      return false;
                    }

                    const hasFaculty =
                      organizationDetails.seat_types.includes("faculty") &&
                      organizationDetails.seats_info["faculty"] &&
                      parseInt(
                        organizationDetails.seats_info["faculty"]
                          .purchased_seats
                      ) > 0;

                    const hasStudents =
                      organizationDetails.seat_types.includes("students") &&
                      organizationDetails.seats_info["students"] &&
                      parseInt(
                        organizationDetails.seats_info["students"]
                          .purchased_seats
                      ) > 0;

                    // Check if at least one seat has for_system: false
                    const hasNonSystemSeat = Object.values(
                      organizationDetails.seats_info
                    ).some((seat) => seat.for_system === false);

                    return (hasFaculty || hasStudents) && hasNonSystemSeat;
                  }

                  // Owners can see everything else
                  if (organizationDetails?.is_owner) {
                    return true;
                  }

                  // Hide billing if user doesn't have view_billing permission
                  if (item.href === "billing") {
                    return (
                      organizationDetails?.user_permissions?.includes(
                        "view_billing"
                      ) || false
                    );
                  }

                  // Hide Workspace (classes) if no system seat is available
                  if (item.href === "classes") {
                    if (!organizationDetails?.seats_info) return false;
                    return Object.values(organizationDetails.seats_info).some(
                      (seat) => seat.for_system === true
                    );
                  }

                  return true;
                })
                .map((item) =>
                  sidebarOpen ? (
                    <button
                      key={item.title}
                      onClick={(e) => {
                        e.preventDefault();
                        if (item.href) {
                          router.push(item.href);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors text-left",
                        isNavItemActive(item.href || "")
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </button>
                  ) : (
                    <TooltipProvider key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (item.href) {
                                router.push(item.href);
                              }
                            }}
                            className={cn(
                              "flex w-full items-center justify-center rounded-2xl p-3 text-sm font-medium transition-colors",
                              isNavItemActive(item.href || "")
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            {item.icon}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background" side="right">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:pl-64" : "md:pl-16"
        )}
      >
        <header className="sticky top-0 z-10 flex h-12 dark:bg-sideBarBackground items-center gap-2 border-b bg-background/95 px-4 md:px-4 lg:px-6 xl:px-8 backdrop-blur">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex h-8 w-8 p-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold"></h1>
            <div className="flex items-center gap-2">
              {/* <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl relative h-8 w-8 p-0"
                    >
                      <Bell className="h-4 w-4" />
                      {notifications > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {notifications}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Organization Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider> */}

              <ThemeToggle />

              <OrgProfileDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-screens bg-gray-50 dark:bg-sideBarBackground px-3 md:px-4 lg:px-6 xl:px-8 pt-3 pb-4">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
