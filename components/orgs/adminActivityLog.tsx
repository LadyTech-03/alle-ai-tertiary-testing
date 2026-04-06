"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores";
import { useOrgAdminActivity } from "@/hooks/use-org-queries";
import type { ActivityLogsResponse } from "@/lib/types/org-members";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";

export default function AdminActivityLog() {
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id?.toString();
  const [page, setPage] = useState(1);

  const { data: activityLogs, isLoading } = useOrgAdminActivity(page);

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60)
        );
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
      }
    } catch {
      return dateString;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "SYS";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial || "U";
  };

  // Skeleton loader component
  const ActivityLogSkeleton = () => (
    <TableRow className="transition-colors border-b">
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4">
      <Card className="min-h-[calc(100vh-280px)] bg-background">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Admin Activity Logs</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Recent user management activities by organization administrators
              </p>
            </div>
            {/* <Input placeholder="Search logs..." className="w-64" /> */}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          {isLoading ? (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b">
                  <TableHead className="h-10 px-4 font-medium text-xs uppercase tracking-wide">
                    Admin
                  </TableHead>
                  <TableHead className="h-10 px-4 font-medium text-xs uppercase tracking-wide">
                    Email
                  </TableHead>
                  <TableHead className="h-10 px-4 font-medium text-xs uppercase tracking-wide">
                    Action
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right font-medium text-xs uppercase tracking-wide">
                    Created At
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <ActivityLogSkeleton key={index} />
                ))}
              </TableBody>
            </Table>
          ) : activityLogs?.data && activityLogs.data.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b">
                  <TableHead className="h-10 px-4 font-medium text-xs uppercase tracking-wide">
                    Admin
                  </TableHead>
                  <TableHead className="h-10 px-4 font-medium text-xs uppercase tracking-wide">
                    Email
                  </TableHead>
                  <TableHead className="h-10 px-4 font-medium text-xs uppercase tracking-wide">
                    Action
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right font-medium text-xs uppercase tracking-wide">
                    Created At
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.data.map((log, index) => (
                  <TableRow
                    key={`${log.user?.id || "system"}-${index}`}
                    className="transition-colors border-b"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={log.user?.photo_url || undefined}
                            alt={
                              log.user
                                ? `${log.user.first_name} ${log.user.last_name}`
                                : "System"
                            }
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                            {getInitials(
                              log.user?.first_name,
                              log.user?.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {log.user
                              ? `${log.user.first_name} ${log.user.last_name}`
                              : "System"}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {log.user?.role || "System"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="text-sm">{log.user?.email || "—"}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-sm">{log.action}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(log.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="font-medium text-sm">
                        {formatRelativeTime(log.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">No Activity Logs</div>
                <div className="text-sm text-muted-foreground">
                  There are no recent admin activities to display.
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>

      {activityLogs?.data &&
        activityLogs.data.length > 0 &&
        activityLogs.meta.last_page > 1 && (
          <div className="flex items-center justify-end gap-4">
            <div className="text-sm text-muted-foreground">
              Page {activityLogs.meta.current_page}/
              {activityLogs.meta.last_page}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!activityLogs.links.prev || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!activityLogs.links.next || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
