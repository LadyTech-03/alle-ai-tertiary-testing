"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip,
    YAxis,
} from "recharts";
import { motion } from "framer-motion";

export function LiveUsersMonitoring() {
    // Generate initial data covering the last 2 hours (120 minutes)
    // Create a "Mountain" trend: starting low (C) and rising to high (B)
    const generateInitialData = () => {
        return Array.from({ length: 24 }, (_, i) => {
            const minutesAgo = (23 - i) * 5; // 5-minute intervals

            // Create an upward trend
            // i goes from 0 to 23
            // Base value starts at ~150 and grows to ~400
            const trend = i * 12;
            const noise = Math.random() * 40 - 20; // +/- 20 fluctuation
            const value = Math.max(100, 150 + trend + noise);

            return {
                time: minutesAgo === 0 ? "Now" : `${minutesAgo}m ago`,
                minutesAgo,
                value: value,
            };
        });
    };

    const [data, setData] = useState(generateInitialData());
    const [liveCount, setLiveCount] = useState(420); // Matches roughly the end of the trend

    // Simulate live data updates
    useEffect(() => {
        const interval = setInterval(() => {
            setData((prevData) => {
                // Shift everything left
                const shifted = prevData.slice(1);

                // Add new point at the end, maintaining the "high" level of the mountain top
                // We want it to stay relatively high to keep the "B" point elevated
                const trendHigh = 23 * 12; // The max trend value we reached
                const noise = Math.random() * 40 - 20;
                const newValue = Math.max(100, 150 + trendHigh + noise);

                const newPoint = {
                    time: "Now",
                    minutesAgo: 0,
                    value: newValue,
                };

                return [...shifted, newPoint];
            });

            // Fluctuate live count around the current high value
            setLiveCount((prev) => {
                const change = Math.floor(Math.random() * 7) - 3;
                return prev + change;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="bg-background border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-semibold">Active Users</CardTitle>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Live Indicator & Count */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                            <motion.span
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"
                            />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                        </div>
                        <div>
                            <span className="text-4xl font-bold tracking-tight text-foreground">
                                {liveCount}
                            </span>
                            <span className="ml-2 text-sm text-muted-foreground font-medium">
                                Live visitors
                            </span>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            {payload[0].payload.time}
                                                        </span>
                                                        <span className="font-bold text-foreground">
                                                            {Math.round(payload[0].value as number)} Users
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <YAxis hide domain={[0, 'auto']} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    isAnimationActive={true}
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">224</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Avg. Daily
                            </div>
                        </div>
                        <div className="text-center border-l border-border/50">
                            <div className="text-2xl font-bold text-foreground">1.4K</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Avg. Weekly
                            </div>
                        </div>
                        <div className="text-center border-l border-border/50">
                            <div className="text-2xl font-bold text-foreground">22.1K</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Avg. Monthly
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
