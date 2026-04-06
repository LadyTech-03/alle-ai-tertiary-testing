import api from "../axios";

export const orgOverviewApi = {
  getSignUPsActivity: async (
    orgId: string,
    fromDate?: string,
    toDate?: string
  ) => {
    if (!fromDate || !toDate) {
      const respone = await api.get(
        `/organisations/${orgId}/sign_up_analytics`
      );
      return respone.data;
    }
    const response = await api.get(
      `/organisations/${orgId}/sign_up_analytics`,
      {
        params: {
          start_date: fromDate,
          end_date: toDate,
        },
      }
    );
    return response.data;
  },
  getPreview: async (orgId: string | number) => {
    const response = await api.get(`/organisations/${orgId}/preview`);
    return response.data;
  },
};
