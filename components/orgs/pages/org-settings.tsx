"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Building2,
  Shield,
  Brain,
  Lock,
  FileKey,
  CreditCard,
  UserCog,
  CircleUserRound,
  SlidersHorizontal,
} from "lucide-react";
import OrgConfigurations from "../org-configurations";
import { Card } from "@/components/ui/card";
import OrgProfile from "../org-proflie";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrganizationInfoTab from "../org-info";
import AdministratorsTable from "../org-administrators";
import PasswordSecuritySettings from "../password-security";
export default function OrgSettingsPage() {
  return (
    <div className=" mt-5 min-h-screen">
      <Tabs defaultValue="organization" className="flex gap-6">
        <TabsList className="flex flex-col items-start h-fit w-55 bg-transparent space-y-1 [&_[data-state=active]]:bg-primary/10 [&_[data-state=active]]:rounded-md">
          {/* <TabsTrigger
            value="profile"
            className="justify-start px-3 py-2 w-full"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger> */}
          <TabsTrigger
            value="organization"
            className="justify-start px-3 py-2 w-full"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Organization Info
          </TabsTrigger>
          {/* <TabsTrigger
            value="billing"
            className="justify-start px-3 py-2 w-full"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger> */}
          <TabsTrigger
            value="administrators"
            className="justify-start px-3 py-2 w-full"
          >
            <UserCog className="w-4 h-4 mr-2" />
            Administrators
          </TabsTrigger>
          {/* <TabsTrigger
            value="configuration"
            className="justify-start px-3 py-2 w-full"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger> */}
          {/* <TabsTrigger
            value="data-privacy"
            className="justify-start px-3 py-2 w-full"
          >
            <FileKey className="w-4 h-4 mr-2" />
            Data and Privacy
          </TabsTrigger> */}
          <TabsTrigger
            value="security"
            className="justify-start px-3 py-2 w-full"
          >
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 pl-6">
          <ScrollArea className="h-[calc(100vh-150px)] scrollbar-hide">
            {/* <TabsContent value="profile">
              <Card className="max-w-3xl bg-background">
                <OrgProfile />
              </Card>
            </TabsContent> */}
            <TabsContent value="organization">
              <Card className="max-w-3xl bg-background dark:bg-sideBarBackground">
                <OrganizationInfoTab />
              </Card>
            </TabsContent>

            <TabsContent value="administrators">
              <Card className="bg-background">
                <AdministratorsTable />
              </Card>
            </TabsContent>
            {/* <TabsContent value="model-access">
              <div className="border rounded-lg min-h-96">
           
              </div>
            </TabsContent> */}

            {/* <TabsContent value="configuration">
              <Card className="border bg-background max-w-4xl rounded-lg min-h-96">
                <OrgConfigurations />
              </Card>
            </TabsContent> */}

            <TabsContent value="security">
              <Card className="max-w-3xl bg-background">
                <PasswordSecuritySettings />
              </Card>
            </TabsContent>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
