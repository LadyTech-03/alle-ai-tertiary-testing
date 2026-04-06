import { HearAboutUsResponse } from './api/onboarding';
import { RootGroupType } from "./query/queryKeys";

export interface CreateGroupData {
  id: number;
  name: string;
  description?: string;
  parent_id: number | null;
  seat_type: RootGroupType;
  expiry_date: string | null;
  features: string[] | null;
  // seats_number?: number;
  hasSubGroups: boolean;
  organisation_id: number;
  
}

export interface createGroupResponse {
  status: boolean;
  message: string;
  data: CreateGroupData;
}

export interface OrgUser {
  name: string;
  email: string;
  seat_type: RootGroupType;
}
