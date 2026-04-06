"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Grid3x3, List, ChevronLeft, ChevronRight } from "lucide-react";
import ActiveSessionTabContent from "@/components/orgs/active-session-tab-content";
import HistorySessionTabContent from "@/components/orgs/history-session-tab-content";
import {
  useActiveSessions,
  useDeviceSessionsHistory,
  useTerminateSession,
} from "@/hooks/use-org-course";

export default function Page() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sessionType, setSessionType] = useState<"live" | "history">("live");
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Fetch active sessions
  const {
    data: activeSessionsData,
    isLoading: isLoadingActive,
    isFetching: isFetchingActive,
  } = useActiveSessions(activePage);

  // Fetch history sessions
  const {
    data: historySessionsData,
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
  } = useDeviceSessionsHistory(historyPage);

  // Transform active sessions data
  const activeSessions =
    activeSessionsData?.data.map((session, index) => ({
      id: index + 1,
      sessionId: session.device_session,
      userName: session.session_user.name,
      userImage: "",
      className: session.session_user.class_group,
      course: "",
      device: "",
      status: session.is_active ? "active" : "inactive",
      duration: session.time_spent || "0 min",
      endedAt: session.ended_at || "",
      createdAt: session.created_at,
    })) || [];

  // Transform history sessions data
  const historySessions =
    historySessionsData?.data.map((session, index) => ({
      id: index + 1,
      sessionId: session.device_session,
      userName: session.session_user.name,
      userImage: "",
      className: session.session_user.class_group,
      course: "",
      device: "",
      status: session.is_active ? "active" : "inactive",
      duration: session.time_spent || "0 min",
      endedAt: session.ended_at || "",
      createdAt: session.created_at,
    })) || [];

  // Terminate session mutation
  const terminateSessionMutation = useTerminateSession();

  // Handle end session
  const handleEndSession = (sessionId: string) => {
    terminateSessionMutation.mutate(sessionId);
  };

  return (
    <div className="space-y-8 mt-5 ">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Sessions</h2>
            <div className="flex gap-1 p-1 bg-muted/40 backdrop-blur-sm border rounded-xl">
              <Button
                variant="ghost"
                onClick={() => setSessionType("live")}
                className={cn(
                  "px-4 py-1.5 h-auto rounded-lg text-xs font-medium transition-all duration-200",
                  sessionType === "live"
                    ? "bg-background shadow-[0_2px_8px_rgba(0,0,0,0.1)] text-foreground border-b-2 border-primary hover:bg-background"
                    : "hover:bg-background/40 text-muted-foreground hover:text-foreground"
                )}
              >
                Active
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSessionType("history")}
                className={cn(
                  "px-4 py-1.5 h-auto rounded-lg text-xs font-medium transition-all duration-200",
                  sessionType === "history"
                    ? "bg-background shadow-[0_2px_8px_rgba(0,0,0,0.1)] text-foreground border-b-2 border-primary hover:bg-background"
                    : "hover:bg-background/40 text-muted-foreground hover:text-foreground"
                )}
              >
                History
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {sessionType === "live"
              ? isLoadingActive
                ? "Loading sessions..."
                : `${activeSessionsData?.meta.total || 0
                } active sessions running`
              : isLoadingHistory
                ? "Loading history..."
                : `${historySessionsData?.meta.total || 0} past sessions`}
          </p>
        </div>

        <TooltipProvider>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 w-8 p-0 rounded-md transition-all",
                    viewMode === "grid"
                      ? "bg-background shadow-sm hover:bg-background"
                      : "hover:bg-background/50 text-muted-foreground"
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 w-8 p-0 rounded-md transition-all",
                    viewMode === "list"
                      ? "bg-background shadow-sm hover:bg-background"
                      : "hover:bg-background/50 text-muted-foreground"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>List View</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Content Area - Takes full viewport height */}
      <div className="flex flex-col h-[calc(100vh-240px)]">
        <ScrollArea className="flex-1 pr-4">
          {sessionType === "live" ? (
            <>
              {!isLoadingActive && activeSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Grid3x3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Active Sessions
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    There are currently no active sessions running. Sessions
                    will appear here when users start using the system.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {isFetchingActive && !isLoadingActive && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
                      <div className="h-full bg-primary animate-[shimmer_1s_infinite]" />
                    </div>
                  )}
                  <ActiveSessionTabContent
                    sessions={activeSessions}
                    viewMode={viewMode}
                    isLoading={isLoadingActive}
                    onEndSession={handleEndSession}
                  />
                </div>
              )}
            </>
          ) : (
            <HistorySessionTabContent
              sessions={historySessions}
              isLoading={isLoadingHistory}
            />
          )}
        </ScrollArea>

        {/* Pagination Controls - Active Sessions */}
        {sessionType === "live" &&
          activeSessionsData &&
          activeSessionsData.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {activeSessionsData.meta.from} to{" "}
                {activeSessionsData.meta.to} of {activeSessionsData.meta.total}{" "}
                sessions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  disabled={!activeSessionsData.links.prev || isFetchingActive}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: activeSessionsData.meta.last_page },
                    (_, i) => {
                      const pageNum = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === activeSessionsData.meta.last_page ||
                        Math.abs(pageNum - activePage) <= 1
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              activePage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setActivePage(pageNum)}
                            disabled={isFetchingActive}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        pageNum === activePage - 2 ||
                        pageNum === activePage + 2
                      ) {
                        return (
                          <span
                            key={pageNum}
                            className="px-1 text-muted-foreground"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActivePage((p) =>
                      Math.min(activeSessionsData.meta.last_page, p + 1)
                    )
                  }
                  disabled={!activeSessionsData.links.next || isFetchingActive}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

        {/* Pagination Controls - History Sessions */}
        {sessionType === "history" &&
          historySessionsData &&
          historySessionsData.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {historySessionsData.meta.from} to{" "}
                {historySessionsData.meta.to} of{" "}
                {historySessionsData.meta.total} sessions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={
                    !historySessionsData.links.prev || isFetchingHistory
                  }
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: historySessionsData.meta.last_page },
                    (_, i) => {
                      const pageNum = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === historySessionsData.meta.last_page ||
                        Math.abs(pageNum - historyPage) <= 1
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              historyPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setHistoryPage(pageNum)}
                            disabled={isFetchingHistory}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        pageNum === historyPage - 2 ||
                        pageNum === historyPage + 2
                      ) {
                        return (
                          <span
                            key={pageNum}
                            className="px-1 text-muted-foreground"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setHistoryPage((p) =>
                      Math.min(historySessionsData.meta.last_page, p + 1)
                    )
                  }
                  disabled={
                    !historySessionsData.links.next || isFetchingHistory
                  }
                  className="h-8"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
