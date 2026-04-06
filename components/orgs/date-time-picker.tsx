"use client";
import React from "react";
import type { DatePickerProps } from "antd";
import { DatePicker, ConfigProvider } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useTheme } from "next-themes";

interface CustomDatePickerProps {
    value?: Date | null;
    onChange: (date: Date | null, dateString: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    minDate?: Date;
    maxDate?: Date;
    allowPastDates?: boolean; // Allow selection of past dates, defaults to false
}

export default function CustomDatePicker({
    value,
    onChange,
    placeholder = "Select date",
    disabled = false,
    className = "",
    minDate,
    maxDate,
    allowPastDates = false,
}: CustomDatePickerProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const handleChange: DatePickerProps["onChange"] = (date, dateString) => {
        const dateValue = date ? date.toDate() : null;
        onChange(dateValue, dateString as string);
    };

    const disabledDate = (current: Dayjs) => {
        if (!current) return false;

        const currentDate = current.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Only disable past dates if allowPastDates is false
        if (!allowPastDates && currentDate < today) {
            return true;
        }

        if (minDate && currentDate < minDate) {
            return true;
        }

        if (maxDate && currentDate > maxDate) {
            return true;
        }

        return false;
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: isDark ? "#525252" : "#0e0d0d",
                    colorBgContainer: isDark ? "#212121" : "#fff",
                    colorBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                    colorText: isDark ? "#fcfbfb" : "#0e0d0d",
                    colorTextPlaceholder: isDark ? "#a3a3a3" : "#737373",
                    colorBgElevated: isDark ? "#2f2f2f" : "#ffffff",
                    colorTextDisabled: isDark ? "#525252" : "#a3a3a3",
                    controlOutline: "transparent",
                    colorPrimaryHover: isDark ? "#737373" : "#0e0d0d",
                    colorTextLightSolid: isDark ? "#fcfbfb" : "#ffffff",
                },
                components: {
                    DatePicker: {
                        cellHoverBg: isDark ? "#424242" : "rgba(233, 231, 231, 0.664)",
                        cellActiveWithRangeBg: isDark ? "#424242" : "#f4f4f4",
                        cellRangeBorderColor: "transparent",
                        activeBorderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                        hoverBorderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
                    },
                },
            }}
        >
            <DatePicker
                value={value ? dayjs(value) : undefined}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
                disabledDate={disabledDate}
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
            />
        </ConfigProvider>
    );
}
