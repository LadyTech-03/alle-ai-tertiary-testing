"use client";

import React from "react";
import { Calendar, Clock, PlayCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: number;
  sessionId: string;
  userName: string;
  userImage: string;
  className: string;
  course: string;
  device: string;
  status: string;
  duration: string;
  endedAt: string;
  createdAt: string;
}

interface HistorySessionTabContentProps {
  sessions: Session[];
  isLoading: boolean;
}

// Skeleton Loading Component for List
const SessionTableSkeleton = () => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Session ID</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Ended</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-14 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function HistorySessionTabContent({
  sessions,
  isLoading,
}: HistorySessionTabContentProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!isLoading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium">No session history</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Once past sessions are completed, they will appear here for review
            and reporting.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <SessionTableSkeleton />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Session ID</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Ended</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.sessionId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.userImage}
                      alt={session.userName}
                    />
                    <AvatarFallback>
                      {getInitials(session.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{session.userName}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{session.className}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {session.sessionId.slice(0, 8)}...
              </TableCell>
              <TableCell className="text-sm">
                {formatDistanceToNow(new Date(session.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-sm">
                {formatDistanceToNow(new Date(session.endedAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{session.duration}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground">
                  Ended
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
