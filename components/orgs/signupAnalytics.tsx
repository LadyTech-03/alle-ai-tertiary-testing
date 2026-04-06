"use client";
import { Card } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, Loader } from "lucide-react";

interface SignupDataPoint {
    date: string;
    count: number;
}

interface SignupAnalyticsProps {
    data: SignupDataPoint[];
    isLoading?: boolean;
    isFetching?: boolean;
}

export function SignupAnalytics({ data, isLoading, isFetching }: SignupAnalyticsProps) {
    // Format date for display (e.g., "2025-11-23" -> "Nov 23")
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Transform backend data to chart format
    const chartData = data.map((item) => ({
        date: formatDate(item.date),
        signups: item.count,
    }));

    // Calculate total signups
    const totalSignups = data.reduce((sum, item) => sum + item.count, 0);

    // Empty state
    if (!isLoading && !isFetching && data.length === 0) {
        return (
            <Card className="w-full bg-background">
                <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="p-4 bg-accent rounded-full mb-4">
                        <TrendingUp className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Signup Data Available</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                        There are no member signups recorded for the selected period. Check back later or adjust your time range.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Showing last 30 days</span>
                    </div>
                </div>
            </Card>
        );
    }

    // Loading state - only show spinner on initial load when there's no data
    if (isLoading && data.length === 0) {
        return (
            <Card className="w-full bg-background">
                <div className="flex flex-col items-center justify-center py-16 px-6">
                    <Loader className="h-10 animate-spin w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading analytics data...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full bg-background" style={{ padding: "5px" }}>
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="signupGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-200 dark:stroke-gray-800"
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                        />
                        <RechartsTooltip
                            contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                boxShadow: "0 10px 25px rgb(0 0 0 / 0.1)",
                                fontSize: "13px",
                            }}
                            formatter={(value: any) => [
                                `${value} members`,
                                "Signups",
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="signups"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#signupGradient)"
                            fillOpacity={1}
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: "#3b82f6",
                                stroke: "#ffffff",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Optional: Show total count */}
            {totalSignups > 0 && (
                <div className="px-6 pb-4 pt-2 border-t mt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Signups (Last 30 Days)</span>
                        <span className="text-lg font-semibold text-primary">{totalSignups}</span>
                    </div>
                </div>
            )}
        </Card>
    );
}
