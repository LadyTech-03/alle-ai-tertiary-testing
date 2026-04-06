import React, { useState, useRef, ChangeEvent } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  Building2,
  Users,
  Calendar,
  Mail,
  User,
  Pencil,
  Upload,
  Loader,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

import { useAuthStore } from "@/stores";
import { useOrgMemberStore, useOrgPaymentStore } from "@/stores/edu-store";
import { useUpdateOrganization } from "@/hooks/use-org-member-mutations";

interface OrganizationData {
  name: string;
  slug: string;
  logo: string;
  type: string;
  nextBilling: string;
  supportEmail: string[];
  createdBy: string;
  createdOn: string;
  websiteUrl: string;
  supportPhone: string[];
  allowedDomains: string[];
}

export default function OrganizationInfoTab() {
  const { organizationDetails, updateOrganizationDetails, userPermissions } =
    useAuthStore();
  const canUpdateOrganisation =
    organizationDetails?.is_owner ||
    organizationDetails?.user_permissions.includes("update_organisation");
  const { nextBillingDate } = useOrgPaymentStore();

  // organizationDetails?.user_permissions?.includes("update_organisation");

  // Calculate total seats from seats_info
  const totalSeats = organizationDetails?.seats_info
    ? Object.values(organizationDetails.seats_info).reduce(
      (total, seatInfo) => total + parseInt(seatInfo.purchased_seats),
      0
    )
    : 0;

  // Get faculty and student seats
  const facultySeats = organizationDetails?.seats_info?.faculty
    ? parseInt(organizationDetails.seats_info.faculty.purchased_seats)
    : 0;
  const studentSeats = organizationDetails?.seats_info?.student
    ? parseInt(organizationDetails.seats_info.student.purchased_seats)
    : 0;

  // Helper to parse arrays from backend (handles both string and array)
  const parseArrayField = (
    field: string | string[] | null | undefined
  ): string[] => {
    if (!field) return [];
    if (Array.isArray(field))
      return field.filter((d) => d && d.trim().length > 0);
    if (typeof field === "string") {
      return field
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    }
    return [];
  };

  // Helper to parse contact fields (ensures at least one empty string)
  const parseContactField = (
    field: string | string[] | null | undefined
  ): string[] => {
    const parsed = parseArrayField(field);
    return parsed.length > 0 ? parsed : [""];
  };

  const [orgData, setOrgData] = useState<OrganizationData>({
    name: organizationDetails?.name || "Organization Name",
    slug: organizationDetails?.slug || "",
    logo: organizationDetails?.logo_url || "",
    type: organizationDetails?.organisation_plan || "Organization",
    nextBilling: organizationDetails?.subscription_info
      ? `${organizationDetails.subscription_info.cycle}`
      : organizationDetails?.trial_ends_at
        ? new Date(organizationDetails.trial_ends_at).toLocaleDateString()
        : "No billing info",
    supportEmail: parseContactField(
      organizationDetails?.support_email || organizationDetails?.email
    ),
    createdBy: organizationDetails?.created_by?.toString() || "Unknown",
    createdOn: organizationDetails?.trial_ends_at
      ? new Date(organizationDetails.trial_ends_at).toLocaleDateString()
      : "Unknown",
    websiteUrl: organizationDetails?.website_url || "",
    supportPhone: parseContactField(organizationDetails?.support_phone),
    allowedDomains: parseArrayField(organizationDetails?.allowed_domains),
  });

  const [originalData, setOriginalData] = useState<OrganizationData>(orgData);
  const [tempData, setTempData] = useState<OrganizationData>(orgData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [urlError, setUrlError] = useState<string>("");
  const [slugError, setSlugError] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const updateOrgMutation = useUpdateOrganization();
  const isLoading = updateOrgMutation.isPending;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    if (url.startsWith("www.")) return true;
    if (url.startsWith("http://") || url.startsWith("https://")) return true;
    return false;
  };

  const validateSlug = (slug: string): string => {
    if (!slug) return "Slug is required";
    if (slug.length < 3) return "Slug must be at least 3 characters";
    if (!/^[a-z]/.test(slug)) return "Slug must start with a lowercase letter";
    if (!/^[a-z0-9-]+$/.test(slug))
      return "Slug can only contain lowercase letters, numbers, and hyphens";
    if (/--/.test(slug)) return "Slug cannot contain consecutive hyphens";
    if (/-$/.test(slug)) return "Slug cannot end with a hyphen";
    return "";
  };

  const handleInputChange = (
    field: keyof OrganizationData,
    value: string | number
  ) => {
    setTempData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "websiteUrl") setUrlError("");
    if (field === "slug") setSlugError("");
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must not exceed 5MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempData((prev) => ({
          ...prev,
          logo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setTempData(orgData);
    setUrlError("");
    setSlugError("");
    setLogoFile(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (tempData.websiteUrl && !validateUrl(tempData.websiteUrl)) {
      setUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const slugValidationError = validateSlug(tempData.slug);
    if (slugValidationError) {
      setSlugError(slugValidationError);
      return;
    }

    const formData = new FormData();
    formData.append("name", tempData.name);
    formData.append("slug", tempData.slug);
    formData.append("website_url", tempData.websiteUrl);

    // Append support emails as array
    tempData.supportEmail.forEach((email, index) => {
      if (email.trim()) {
        formData.append(`support_email[${index}]`, email.trim());
      }
    });

    // Append support phones as array
    tempData.supportPhone.forEach((phone, index) => {
      if (phone.trim()) {
        formData.append(`support_phone[${index}]`, phone.trim());
      }
    });

    if (logoFile) {
      formData.append("logo_file", logoFile);
    }

    tempData.allowedDomains.forEach((domain, index) => {
      if (domain.trim()) {
        formData.append(`allowed_domains[${index}]`, domain.trim());
      }
    });

    try {
      updateOrgMutation.mutate(
        { updateData: formData },
        {
          onSuccess: () => {
            setOrgData(tempData);
            setOriginalData(tempData);
            setUrlError("");
            setSlugError("");
            setIsDialogOpen(false);
          },
        }
      );
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleCancel = () => {
    setTempData(orgData);
    setUrlError("");
    setSlugError("");
    setLogoFile(null);
    setIsDialogOpen(false);
  };

  const hasChanges = Object.keys(tempData).some(
    (key) =>
      tempData[key as keyof OrganizationData] !==
      orgData[key as keyof OrganizationData]
  );

  const truncateName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-6">
      {/* Header Section */}
      <Card className="p-6 bg-background">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <Avatar className="w-20 h-20 rounded-lg flex-shrink-0">
              <AvatarImage src={orgData.logo} alt="Organization Logo" />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                {organizationDetails?.name
                  ?.split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2) || <Building2 className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 min-w-0 flex-1">
              <h1
                className="text-2xl font-semibold truncate"
                title={orgData.name}
              >
                {truncateName(orgData.name)}
              </h1>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Organization Type:
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {orgData.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Organization Mail:
                  </span>
                  <span
                    className="text-muted-foreground font-medium truncate"
                    title={orgData.supportEmail[0]}
                  >
                    {orgData.supportEmail[0]}
                    {orgData.supportEmail.length > 1 &&
                      ` (+${orgData.supportEmail.length - 1} more)`}
                  </span>
                </div>
                {orgData.websiteUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Website:</span>
                    <a
                      href={
                        orgData.websiteUrl.startsWith("http://") ||
                          orgData.websiteUrl.startsWith("https://")
                          ? orgData.websiteUrl
                          : `https://${orgData.websiteUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium truncate underline"
                      title={orgData.websiteUrl}
                    >
                      {orgData.websiteUrl}
                    </a>
                  </div>
                )}
                {orgData.supportPhone[0] && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      Support Phone:
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {orgData.supportPhone[0]}
                      {orgData.supportPhone.length > 1 &&
                        ` (+${orgData.supportPhone.length - 1} more)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-shrink-0 ml-4"
                    disabled={!canUpdateOrganisation}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </span>
              </TooltipTrigger>
              {!canUpdateOrganisation && (
                <TooltipContent>
                  <p>
                    {
                      "You don't have permission to update organization details. Contact your administrator."
                    }
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>

      {/* Subscription Details */}
      <Card className="p-4 bg-background">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded shadow-sm">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold">Subscription Details</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[140px] rounded p-3 shadow-sm border dark:border-gray-700 border-gray-200">
            <p className="text-xs font-medium uppercase tracking-wide mb-1">
              Total Seats
            </p>
            <p className="text-xl font-bold text-muted-foreground">
              {totalSeats}
            </p>
          </div>
          {Object.entries(organizationDetails?.seats_info || {}).map(
            ([key, info]) => (
              <div
                key={key}
                className="flex-1 min-w-[140px] dark:border-gray-700 rounded p-3 shadow-sm border border-gray-200"
              >
                <p className="text-xs font-medium uppercase tracking-wide mb-1">
                  {key === "device_edu"
                    ? "Devices"
                    : key.charAt(0).toUpperCase() + key.slice(1)}
                </p>
                <p className="text-xl font-bold text-muted-foreground">
                  {info.purchased_seats}
                </p>
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-2 dark:border-gray-700 rounded p-2 shadow-sm border border-gray-200">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs text-muted-foreground">Next Billing:</span>
          <span className="text-xs font-semibold">
            {nextBillingDate
              ? new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(nextBillingDate.replace(" ", "T")))
              : "Not available"}
          </span>
        </div>
      </Card>

      {/* Organization Details */}
      <Card className="p-4 bg-background">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4" />
          <h2 className="text-base font-semibold">Organization Details</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5" />
              <p className="text-xs font-medium uppercase tracking-wide">
                Created By
              </p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {orgData.createdBy}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <p className="text-xs font-medium uppercase tracking-wide">
                Created On
              </p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {orgData.createdOn}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5" />
              <p className="text-xs font-medium uppercase tracking-wide">
                Admin Contact
              </p>
            </div>
            <p
              className="text-xs font-medium text-muted-foreground truncate"
              title={orgData.supportEmail[0]}
            >
              {orgData.supportEmail[0]}
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              {"Update your organization's information and logo"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-5 pb-4">
              {/* Logo Upload */}
              <div className="flex flex-col items-center space-y-3 pb-4 border-b">
                <div
                  className="relative group cursor-pointer"
                  onClick={handleLogoClick}
                >
                  <Avatar className="w-20 h-20 rounded-lg">
                    <AvatarImage src={tempData.logo} alt="Organization Logo" />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                      {organizationDetails?.name
                        ?.split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2) || <Building2 className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLogoClick}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-orgName">Organization Name</Label>
                <Input
                  id="edit-orgName"
                  value={tempData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>

              {/* Organization Slug */}
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Organization Slug</Label>
                <Input
                  id="edit-slug"
                  value={tempData.slug}
                  onChange={(e) =>
                    handleInputChange("slug", e.target.value.toLowerCase())
                  }
                  placeholder="my-organization"
                  className={slugError ? "border-red-500" : ""}
                />
                {slugError && (
                  <p className="text-sm text-red-500">{slugError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (lowercase letters, numbers, hyphens
                  only)
                </p>
              </div>

              {/* Organization Type */}
              <div className="space-y-2">
                <Label htmlFor="edit-orgType">Organization Type</Label>
                <Input
                  id="edit-orgType"
                  value={tempData.type}
                  disabled
                  className="cursor-not-allowed"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="edit-websiteUrl">Website URL</Label>
                <Input
                  id="edit-websiteUrl"
                  value={tempData.websiteUrl}
                  onChange={(e) =>
                    handleInputChange("websiteUrl", e.target.value)
                  }
                  placeholder="https://example.com"
                  type="url"
                  className={urlError ? "border-red-500" : ""}
                />
                {urlError && <p className="text-sm text-red-500">{urlError}</p>}
              </div>

              {/* Support Emails */}
              <div className="space-y-2">
                <Label>Support Emails</Label>
                <p className="text-xs text-muted-foreground">
                  Add multiple support email addresses
                </p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {tempData.supportEmail.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={email}
                        onChange={(e) => {
                          const newEmails = [...tempData.supportEmail];
                          newEmails[index] = e.target.value;
                          setTempData((prev) => ({
                            ...prev,
                            supportEmail: newEmails,
                          }));
                        }}
                        placeholder="support@example.com"
                        type="email"
                        className="flex-1"
                      />
                      {tempData.supportEmail.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newEmails = tempData.supportEmail.filter(
                              (_, i) => i !== index
                            );
                            setTempData((prev) => ({
                              ...prev,
                              supportEmail: newEmails,
                            }));
                          }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempData((prev) => ({
                      ...prev,
                      supportEmail: [...prev.supportEmail, ""],
                    }));
                  }}
                  className="w-full mt-2"
                >
                  + Add Email
                </Button>
              </div>

              {/* Support Phones */}
              <div className="space-y-2">
                <Label>Support Phones</Label>
                <p className="text-xs text-muted-foreground">
                  Add multiple support phone numbers
                </p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {tempData.supportPhone.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={phone}
                        onChange={(e) => {
                          const newPhones = [...tempData.supportPhone];
                          newPhones[index] = e.target.value;
                          setTempData((prev) => ({
                            ...prev,
                            supportPhone: newPhones,
                          }));
                        }}
                        placeholder="+1 (555) 123-4567"
                        type="tel"
                        className="flex-1"
                      />
                      {tempData.supportPhone.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newPhones = tempData.supportPhone.filter(
                              (_, i) => i !== index
                            );
                            setTempData((prev) => ({
                              ...prev,
                              supportPhone: newPhones,
                            }));
                          }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempData((prev) => ({
                      ...prev,
                      supportPhone: [...prev.supportPhone, ""],
                    }));
                  }}
                  className="w-full mt-2"
                >
                  + Add Phone
                </Button>
              </div>

              {/* Allowed Domains */}
              <div className="space-y-2">
                <Label>Allowed Domains</Label>
                <p className="text-xs text-muted-foreground">
                  Specify which email domains can join your organization
                </p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                  {tempData.allowedDomains.length > 0 ? (
                    tempData.allowedDomains.map((domain, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={domain}
                          onChange={(e) => {
                            const newDomains = [...tempData.allowedDomains];
                            newDomains[index] = e.target.value;
                            setTempData((prev) => ({
                              ...prev,
                              allowedDomains: newDomains,
                            }));
                          }}
                          placeholder="example.com"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newDomains = tempData.allowedDomains.filter(
                              (_, i) => i !== index
                            );
                            setTempData((prev) => ({
                              ...prev,
                              allowedDomains: newDomains,
                            }));
                          }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No domains added yet
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempData((prev) => ({
                      ...prev,
                      allowedDomains: [...prev.allowedDomains, ""],
                    }));
                  }}
                  className="w-full mt-2"
                >
                  + Add Domain
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant={"default"}
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="gap-2"
            >
              {isLoading && (
                <div className="flex items-center gap-2">
                  <span>Saving...</span>
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
              )}
              {!isLoading && "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
