import React, { useState, useRef, ChangeEvent } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { useAuthStore } from "@/stores";

// Define the profile data type
interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
}

export default function OrgProfile() {
  const { user } = useAuthStore();
  
  // Initialize profile data with actual user data or fallback to empty values
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: "", // Phone not available in User interface
    avatar: user?.photo_url || "", // Use photo_url instead of avatar
  });

  const [originalData, setOriginalData] = useState<ProfileData>(profileData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          avatar: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setOriginalData(profileData);
    alert("Profile updated successfully!");
  };

  const handleCancel = () => {
    setProfileData(originalData);
  };

  const hasChanges =
    JSON.stringify(profileData) !== JSON.stringify(originalData);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold  flex items-center gap-3">
          <User className="w-8 h-8" />
          Manage Your Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Update your personal information and profile picture
        </p>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div
              className="relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar className="w-32 h-32">
                <AvatarImage src={profileData.avatar} alt="Profile" />
                <AvatarFallback className="text-2xl">
                  {user?.first_name?.[0] || profileData.firstName[0]}
                  {user?.last_name?.[0] || profileData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Email and Phone Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={true}
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
