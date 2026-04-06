import { LogOut, Settings, Loader,User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/stores";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { AccountSettings } from "@/components/ui/modals/account-settings";

const OrgProfileDropdown = () => {
  const { user, organizationDetails } = useAuthStore();
  const initials = user?.first_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();
  const handleSettings = () => {
    // get org id from store and push there
    router.push(`/orgs/${organizationDetails?.slug}/settings`);
  };

  const handleAccountSettings = () => {
    setIsAccountSettingsOpen(true);
  };

  const handleLogout = async () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      toast.error("Failed logging out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={user?.photo_url || ""} alt={""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background">
          <div className="flex items-center gap-2 p-2">
            <div className="flex flex-col">
              <span className="text-sm capitalize font-medium">
                {user?.first_name + " " + user?.last_name}
              </span>

              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
          <div className="my-1 h-px bg-border" />
          <DropdownMenuItem
            onClick={handleAccountSettings}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          {/* <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem> */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer  text-red-700 hover:bg-red-200 hover:text-red-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={isAccountSettingsOpen}
        onOpenChange={setIsAccountSettingsOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
          </DialogHeader>
          <AccountSettings />
        </DialogContent>
      </Dialog>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again
              to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {isLoggingOut && <Loader className="h-4 w-4 animate-spin" />}
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrgProfileDropdown;
