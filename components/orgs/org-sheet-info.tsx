import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";

interface OrgGroupsInfoProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  infoData?: any[];
}

// Mock data structure
const mockInfoData = {
  name: "Marketing Team",
  createdBy: "John Smith",
  createdAt: "2024-01-15",
  type: "group",
  seatUsed: 8,
  totalMembers: 12,
};

export function OrgGroupsInfo({
  open,
  onOpenChange,
  infoData,
}: OrgGroupsInfoProps) {
  const data = infoData && infoData.length > 0 ? infoData[0] : mockInfoData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[300px]  sm:w-[300px] overflow-y-auto ">
        <SheetHeader>
          <SheetTitle>Info</SheetTitle>
          {/* <SheetDescription>
            Detailed information about the group
          </SheetDescription> */}
        </SheetHeader>
        <div className="grid  flex-1 auto-rows-min gap-6 px-4 py-6">
          {/* Folder Icon Section */}
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative rounded-md p-4 bg-gray-100 dark:bg-primary/10 h-30 w-full flex items-center justify-center">
              <Image
                src="/svgs/folder-admin.svg"
                alt="Folder Icon"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>

          {/* Information Section */}
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold  tracking-wide">
                Name
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                {data.name}
              </p>
            </div>

            {/* Created By */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold   tracking-wide">
                Created By
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">{data.createdBy}</p>
            </div>

            {/* Created At */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold   tracking-wide">
                Created At
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                {formatDate(data.createdAt)}
              </p>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold   tracking-wide">
                Type
              </h3>
              <p className="text-sm capitalize">{data.type}</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold  capitalize tracking-wide">
                Seat Type
              </h3>
              <p className="text-sm  text-muted-foreground font-semibold">Faculty</p>
            </div>

            {/* Seat Used */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold   tracking-wide">
                Seat Used
              </h3>
              <p className="text-xs font-semibold text-muted-foreground">{data.seatUsed}</p>
            </div>

            {/* Total Members */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold   tracking-wide">
                Total Members
              </h3>
              <p className="text-xs font-semibold text-muted-foreground">
                {data.totalMembers}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
