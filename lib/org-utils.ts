export type OrganizationViewMode = "people" | "devices" | "hybrid";

export interface SeatInfo {
    purchased_seats: string;
    remaining_seats: number;
    for_system: boolean;
}

export const getOrganizationViewMode = (
    seatsInfo?: Record<string, SeatInfo>
): OrganizationViewMode => {
    if (!seatsInfo) return "people";

    const seats = Object.values(seatsInfo);
    if (seats.length === 0) return "people";

    const hasSystemSeats = seats.some((seat) => seat.for_system === true);
    const hasPeopleSeats = seats.some((seat) => seat.for_system === false);

    if (hasSystemSeats && !hasPeopleSeats) {
        return "devices";
    } else if (hasSystemSeats && hasPeopleSeats) {
        return "hybrid";
    }

    return "people";
};
