"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsagePageSkeleton() {
    return (
        <main className="min-h-screen">
            <div>
                {/* Page Header */}
                <div className="flex items-center justify-between pb-6">
                    <div className="flex flex-col space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-5 w-96" />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                </div>

                <div>
                    <div className="flex gap-6">
                        {/* KPI Cards - 60% width */}
                        <div className="w-[60%] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Card key={i} className="p-4 bg-background">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-5 w-14 rounded-full" />
                                            </div>
                                            <Skeleton className="h-9 w-9 rounded-md" />
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* API Calls Chart Card */}
                            <Card className="p-4 bg-background" style={{ minHeight: "300px" }}>
                                <div className="flex justify-between items-center mb-4">
                                    <Skeleton className="h-6 w-32" />
                                    <div className="flex space-x-3">
                                        <Skeleton className="h-9 w-32" />
                                        <Skeleton className="h-9 w-36" />
                                    </div>
                                </div>
                                <Skeleton className="h-56 w-full rounded-md" />
                            </Card>
                        </div>

                        {/* Seats Utilization Card - 40% width */}
                        <div className="w-[40%]">
                            <Card className="p-4 h-full bg-background" style={{ minHeight: "500px" }}>
                                <div className="flex justify-between items-center mb-4">
                                    <Skeleton className="h-6 w-36" />
                                    <Skeleton className="h-5 w-20" />
                                </div>

                                {/* Donut Chart */}
                                <div className="h-48 mb-6 flex items-center justify-center">
                                    <Skeleton className="h-40 w-40 rounded-full" />
                                </div>

                                {/* Group Buttons */}
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Bottom Row - Models Usage Table */}
                    <div className="mt-6">
                        <Card className="p-4 bg-background" style={{ minHeight: "400px" }}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <Skeleton className="h-9 w-32" />
                            </div>

                            {/* Table Header */}
                            <div className="space-y-3">
                                <div className="flex gap-4 pb-3 border-b">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>

                                {/* Table Rows */}
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex gap-4 items-center py-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-2 w-24 rounded-full" />
                                            <Skeleton className="h-4 w-10" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
