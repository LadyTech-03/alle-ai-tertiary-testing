"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BookOpen,
    Monitor,
    StopCircle,
    MoreVertical,
} from "lucide-react";

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
}

interface ActiveSessionTabContentProps {
    sessions: Session[];
    viewMode: "grid" | "list";
    isLoading: boolean;
    onEndSession: (sessionId: string) => void;
}

// Skeleton Loading Component
const SessionCardSkeleton = () => {
    return (
        <Card className="bg-background">
            <CardContent className="p-5">
                <div className="flex flex-col items-center space-y-3 mb-3">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="text-center w-full space-y-2">
                        <Skeleton className="h-4 w-24 mx-auto" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                </div>
                <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2 pt-3 border-t">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardContent>
        </Card>
    );
};

export default function ActiveSessionTabContent({
    sessions,
    viewMode,
    isLoading,
    onEndSession,
}: ActiveSessionTabContentProps) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <SessionCardSkeleton key={index} />
                ))}
            </div>
        );
    }

    return (
        <>
            {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sessions.map((session) => (
                        <Card
                            key={session.id}
                            className="group bg-background relative transition-all duration-200 hover:shadow-lg hover:border-primary/50"
                        >
                            <CardContent className="p-5">
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-full"
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-background" align="end">
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => onEndSession(session.sessionId)}
                                            >
                                                <StopCircle className="h-4 w-4 mr-2" />
                                                End Session
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex flex-col items-center space-y-2.5 mb-3">
                                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                                        <AvatarImage src={session.userImage} alt={session.userName} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                            {getInitials(session.userName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-sm leading-none">
                                            {session.userName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {session.className}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <div className="flex items-start gap-2 text-xs">
                                        <BookOpen className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                        <span className="line-clamp-2">{session.course}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Monitor className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{session.device}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 pt-2.5 border-t">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                            Active
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            • {session.duration}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {viewMode === "list" && (
                <div className="rounded-lg border">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[200px] py-4">User</TableHead>
                                    <TableHead className="py-4">Class</TableHead>
                                    <TableHead className="py-4">Course</TableHead>
                                    <TableHead className="py-4">Device</TableHead>
                                    <TableHead className="py-4">Status</TableHead>
                                    <TableHead className="py-4">Duration</TableHead>
                                    <TableHead className="text-right py-4">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow
                                        key={session.id}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarImage
                                                        src={session.userImage}
                                                        alt={session.userName}
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                        {getInitials(session.userName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{session.userName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm py-4">{session.className}</TableCell>
                                        <TableCell className="text-sm py-4">{session.course}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground py-4">
                                            {session.device}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                    Active
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground py-4">
                                            {session.duration}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => onEndSession(session.sessionId)}
                                                    >
                                                        <StopCircle className="h-4 w-4 mr-2" />
                                                        End Session
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </>
    );
}
