import { useState, useEffect, useMemo } from "react";
import { Loader, User, Pencil, Camera, X, Info, Save, Gem } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { PlansModal } from "../modals";

export function AccountSettings() {
  const { user: authUser, token, plan: userPlan, setAuth } = useAuthStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isLoadingBillingPortal, setIsLoadingBillingPortal] = useState(false);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const router = useRouter();

  // Profile form state
  const [profileFormData, setProfileFormData] = useState({
    firstname: "",
    lastname: "",
    profilePhoto: null as File | null,
  });

  // Track original values for comparison
  const [originalProfileData, setOriginalProfileData] = useState({
    firstname: "",
    lastname: "",
    profilePhoto: null as File | null,
  });

  // Check if there are changes
  const hasChanges = useMemo(() => {
    const hasNameChanges =
      profileFormData.firstname !== originalProfileData.firstname ||
      profileFormData.lastname !== originalProfileData.lastname ||
      profileFormData.profilePhoto !== null;

    const isValidForm =
      profileFormData.firstname.trim() !== "" &&
      profileFormData.lastname.trim() !== "";

    return hasNameChanges && isValidForm;
  }, [profileFormData, originalProfileData]);

  // Profile-related functions
  function parsePlanDetails(planString: string): {
    tier: string;
    cycle?: string;
    features: string[];
  } {
    if (!planString || typeof planString !== "string") {
      return { tier: "Free", cycle: undefined, features: [] };
    }
    const parts = planString.split("_").filter(Boolean);
    if (parts.length === 0) {
      return { tier: "Free", cycle: undefined, features: [] };
    }
    const last = parts[parts.length - 1];
    const cycle =
      last === "monthly"
        ? "Billed monthly"
        : last === "yearly"
        ? "Billed yearly"
        : "forever";
    const tierRaw = parts[0];
    const tierMap: Record<string, string> = {
      free: "Free",
      standard: "Standard",
      plus: "Plus",
      custom: "Custom",
      pro: "Pro",
    };
    const tier =
      tierMap[tierRaw] || tierRaw.charAt(0).toUpperCase() + tierRaw.slice(1);
    const featuresStart = 1;
    const featuresEnd = cycle ? parts.length - 1 : parts.length;
    const rawFeatures = parts.slice(featuresStart, featuresEnd);
    const prettify = (s: string) =>
      s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const features = rawFeatures.map(prettify);
    return { tier, cycle, features };
  }

  // Update profile form data when user data changes
  useEffect(() => {
    if (authUser) {
      const userData = {
        firstname: authUser.first_name || "",
        lastname: authUser.last_name || "",
        profilePhoto: null as File | null,
      };
      setProfileFormData(userData);
      setOriginalProfileData(userData);
    }
  }, [authUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = [
        "image/jpeg",
        "image/webp",
        "image/jpg",
        "image/webp",
        "image/gif",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Supported files(JPEG, PNG, JPG, WEBP, or GIF)"
        );
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large, less than 2MB required");
        return;
      }
      setProfileFormData((prev) => ({ ...prev, profilePhoto: file }));
    }
  };

  const handleProfileEditToggle = async () => {
    if (isEditingProfile) {
      setIsSubmittingProfile(true);
      try {
        const response = await profileApi.updateProfile({
          firstname: profileFormData.firstname,
          lastname: profileFormData.lastname,
          ...(profileFormData.profilePhoto && {
            profile_photo: profileFormData.profilePhoto,
          }),
        });

        if (response.status && response.user) {
          setAuth(
            {
              ...authUser!,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              photo_url: response.user.photo_url,
            },
            token!,
            userPlan
          );
        }
        toast.success("Profile updated");
        setIsEditingProfile(false);
        // Update original data to reflect saved changes
        setOriginalProfileData({
          firstname: profileFormData.firstname,
          lastname: profileFormData.lastname,
          profilePhoto: null,
        });
        setProfileFormData((prev) => ({ ...prev, profilePhoto: null }));
      } catch (error) {
        toast.error("Failed to update profile");
      } finally {
        setIsSubmittingProfile(false);
      }
    } else {
      setIsEditingProfile(true);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    setProfileFormData({
      firstname: originalProfileData.firstname,
      lastname: originalProfileData.lastname,
      profilePhoto: null,
    });
    setIsEditingProfile(false);
  };

  const isPaidPlan =
    typeof userPlan === "string" &&
    (userPlan === "standard" ||
      userPlan === "plus" ||
      userPlan.includes("standard") ||
      userPlan.includes("plus") ||
      userPlan.includes("pro") ||
      userPlan.includes("custom"));

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-borderColorPrimary">
          <div className="space-y-1">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profile Information
            </h4>
            <p className="text-[0.75rem] text-muted-foreground">
              Manage your personal information and profile photo
            </p>
          </div>
          <div className="flex gap-2">
            {isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 px-3"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              variant={isEditingProfile ? "default" : "outline"}
              size="sm"
              onClick={handleProfileEditToggle}
              disabled={
                isSubmittingProfile || (isEditingProfile && !hasChanges)
              }
              className="h-8 px-3"
            >
              {isSubmittingProfile ? (
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : isEditingProfile ? (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Display/Edit */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage
                  src={
                    profileFormData.profilePhoto
                      ? URL.createObjectURL(profileFormData.profilePhoto)
                      : authUser?.photo_url || "/user.jpg"
                  }
                  alt="Profile"
                />
                <AvatarFallback>
                  {authUser?.first_name?.[0]}
                  {authUser?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {isEditingProfile && (
                <label
                  htmlFor="profile-photo"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    id="profile-photo"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/webp,image/jpg,image/webp,image/gif"
                  />
                </label>
              )}
              {isEditingProfile && profileFormData.profilePhoto && (
                <button
                  onClick={() =>
                    setProfileFormData((prev) => ({
                      ...prev,
                      profilePhoto: null,
                    }))
                  }
                  className="absolute -top-1 -right-1 p-1 bg-destructive rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {isEditingProfile
                  ? "Edit Profile"
                  : `${authUser?.first_name} ${authUser?.last_name}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {authUser?.email}
              </div>
              {typeof userPlan === "string" ? (
                (() => {
                  const { tier } = parsePlanDetails(userPlan);
                  return (
                    <Badge variant="default" className="mt-1 text-xs">
                      {tier}
                    </Badge>
                  );
                })()
              ) : (
                <Badge variant="default" className="mt-1 text-xs">
                  Free
                </Badge>
              )}
            </div>
          </div>

          {/* Form Fields */}
          {isEditingProfile && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First name</label>
                <Input
                  value={profileFormData.firstname}
                  onChange={(e) =>
                    setProfileFormData((prev) => ({
                      ...prev,
                      firstname: e.target.value,
                    }))
                  }
                  placeholder="Enter your first name"
                  className="bg-background border-borderColorPrimary"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last name</label>
                <Input
                  value={profileFormData.lastname}
                  onChange={(e) =>
                    setProfileFormData((prev) => ({
                      ...prev,
                      lastname: e.target.value,
                    }))
                  }
                  placeholder="Enter your last name"
                  className="bg-background border-borderColorPrimary"
                  maxLength={255}
                  required
                />
              </div>
            </div>
          )}

          {/* File Requirements */}
          {isEditingProfile && (
            <div className="rounded-lg border border-primary/20 p-3 bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Info className="h-4 w-4" />
                <span>Profile Photo Requirements</span>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Accepted formats: JPEG, PNG, JPG, WEBP, GIF</li>
                <li>• Maximum file size: 2MB</li>
                <li>• Recommended size: 400x400 pixels</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-borderColorPrimary">
          <div className="space-y-1">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Gem className="h-4 w-4 text-primary" />
              Subscription
            </h4>
            <p className="text-[0.75rem] text-muted-foreground">
              Manage your subscription and billing
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-muted/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium mb-2">Current Plan</div>
              {typeof userPlan === "string" ? (
                (() => {
                  const { tier, cycle, features } = parsePlanDetails(userPlan);
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            "text-lg font-semibold",
                            tier === "Free" && "text-foreground",
                            tier === "Standard" &&
                              "bg-gradient-to-r from-gray-300 via-gray-500 to-gray-200 dark:from-gray-100 dark:via-gray-400 dark:to-gray-200 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient",
                            tier === "Plus" &&
                              "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient",
                            tier === "Pro" ||
                              (tier === "Custom" &&
                                "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient")
                          )}
                        >
                          {tier}
                        </div>
                        <Badge
                          variant="default"
                          className="text-xs font-semibold rounded-sm p-1 h-4"
                        >
                          {cycle}
                        </Badge>
                      </div>
                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {features.slice(0, 3).map((f, idx) => (
                            <Badge
                              key={idx}
                              variant="default"
                              className="h-5 px-2 py-0 text-xs leading-none rounded-full"
                            >
                              {f}
                            </Badge>
                          ))}
                          {features.length > 3 && (
                            <Badge
                              variant="default"
                              className="h-5 px-1.5 py-0 text-xs leading-none rounded-full"
                            >
                              +{features.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                //   An error notice to inform the user Failed to load subscription: No subscription found for account. Contact support@alle-ai.com if error persists.
                <div className="text-xs border border-destructive rounded-md p-2 text-destructive">
                  Failed to load subscription: No subscription found for
                  account. Contact support@alle-ai.com if error persists.
                </div>
              )}
            </div>
            <Button
              className="text-xs"
              variant="outline"
              onClick={() => {
                if (isPaidPlan) {
                  router.push("/manage-subscription");
                } else {
                  setPlansModalOpen(true);
                }
              }}
              disabled={isLoadingBillingPortal}
            >
              {isPaidPlan ? "MANAGE" : "UPGRADE"}
            </Button>
          </div>
        </div>
      </div>
      <PlansModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
      />
    </div>
  );
}
