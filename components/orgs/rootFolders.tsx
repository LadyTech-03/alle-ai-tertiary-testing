import React from "react";
import Image from "next/image";
import { Folder } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Group } from "@/stores/edu-store";

interface FolderViewProps {
  isGrid?: boolean;
  data?: Group[];
  onItemDoubleClick?: (item: Group) => void;
}

export const RootFolderView: React.FC<FolderViewProps> = ({
  isGrid = false,
  data,
  onItemDoubleClick,
}) => {
  // Create root folder data that matches Group type with icon paths
  const mockData: Group[] = [
    {
      id: 1,
      name: "Faculty",
      description: "Faculty members group",
      parent_id: null,
      seat_type: "faculty",
      expiry_date: null,
      features: ["feature1", "feature2"],
      organisation_id: 1,
      hasSubGroups: true
    },
    {
      id: 2,
      name: "Students",
      description: "Students group",
      parent_id: null,
      seat_type: "student",
      expiry_date: null,
      features: ["feature1", "feature2"],
      organisation_id: 1,
      hasSubGroups: true
    },
    {
      id: 3,
      name: "Deleted Accounts",
      description: "Deactivated and soft-deleted organization members",
      parent_id: null,
      seat_type: "system",
      expiry_date: null,
      features: [],
      organisation_id: 1,
      hasSubGroups: false
    }
  ];

  // Get icon path based on seat_type
  const getIconPath = (seatType: string) => {
    return seatType === "faculty"
      ? "/svgs/faculty_svg.svg" : seatType === "student" ? "/svgs/student_svg.svg" : "/svgs/delete_orgs.svg";
  };

  const displayData = data || mockData;

  if (isGrid) {
    return (
      <>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="border-b-2">
              <TableHead className="text-sm text-black dark:text-white text-left">
                Seat Types
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
          {displayData.map((folder) => (
            <div
              key={folder.id}
              onDoubleClick={() => onItemDoubleClick?.(folder)}
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 dark:bg-backgroundSecondary hover:bg-gray-100 dark:hover:bg-muted cursor-pointer transition-all group border border-gray-200 dark:border-accent"
            >
              <div className="mb-3">
                <Image
                  src={getIconPath(folder.seat_type)}
                  alt={folder.name}
                  width={80}
                  height={80}
                  className="w-20 h-20"
                />
              </div>
              <span className="text-sm font-medium text-center text-gray-900 dark:text-gray-100">
                {folder.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                {folder.seat_type}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow className="border-b-2">
          <TableHead className="text-sm text-black dark:text-white w-1/2 text-left">
            Seat Types
          </TableHead>
          <TableHead className="text-sm pr-5 text-black dark:text-white w-1/2 text-right">
            Created At
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayData.map((folder) => (
          <TableRow
            key={folder.id}
            onDoubleClick={() => onItemDoubleClick?.(folder)}
            className="h-12 hover:bg-accent cursor-pointer transition-colors"
          >
            <TableCell className="py-2">
              <div className="flex items-center gap-3">
                <Image
                  src={getIconPath(folder.seat_type)}
                  alt={folder.name}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{folder.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {folder.seat_type}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-2 text-right">
              <span className="text-xs text-muted-foreground">
                -
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
