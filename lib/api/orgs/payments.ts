import { get, remove } from "lodash";
import api from "../axios";
import { useAuthStore } from "@/stores";

interface Checkout {
  seat_types: string[];
  seats_number: number[];
}

interface CheckoutResponse {
  status: boolean;
  id: string;
  to: string;
}

export interface PaymentMethodResponse {
  customer_id: string;
  type: string;
  payment_methods: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  default?: boolean;
}
export type DefaultPaymentMethodResponse = {
  status: boolean;
  payment_method: {
    id: string;
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
    default?: boolean;
  };
};
export type NextBillingResponse = {
  status: boolean;
  message: string;
  next_billing_date: string;
};

export type SetDefaultPaymentMethodResponse = {
  status: boolean;
  message: string;
};

export const orgPaymentsApi = {
  checkout: async (
    orgId: string,
    checkout: Checkout
  ): Promise<CheckoutResponse> => {
    const response = await api.post(`/organisations/${orgId}/checkout`, {
      seat_types: checkout.seat_types,
      seats_number: checkout.seats_number,
    });
    return response.data;
  },
  subscriptionUpdate: async (
    orgId: string,
    updateData: Checkout
  ): Promise<any> => {
    const response = await api.post(
      `/organisations/${orgId}/subscription-update`,
      updateData
    );
    return response.data;
  },
  getPaymentMethods: async (): Promise<PaymentMethodResponse> => {
    const orgId = useAuthStore.getState().organizationDetails?.id;
    const response = await api.get(`/organisations/${orgId}/payment-methods`);
    return response.data;
  },
  removePaymentMethod: async (paymentMethodId: string): Promise<any> => {
    const orgId = useAuthStore.getState().organizationDetails?.id;
    const response = await api.post(
      `/organisations/${orgId}/remove-payment-method`,
      {
        payment_method_id: paymentMethodId,
      }
    );
    return response.data;
  },
  getDefaultPaymentMethod: async (): Promise<DefaultPaymentMethodResponse> => {
    const orgId = useAuthStore.getState().organizationDetails?.id;
    const response = await api.get(
      `/organisations/${orgId}/payment-method/default`
    );
    return response.data;
  },
  getNextBillingDate: async (): Promise<NextBillingResponse> => {
    const orgId = useAuthStore.getState().organizationDetails?.id;
    const response = await api.get(`/organisations/${orgId}/nextBillingDate`);
    return response.data;
  },
  setDefaultPaymentMethod: async (
    paymentMethodId: string
  ): Promise<SetDefaultPaymentMethodResponse> => {
    const orgId = useAuthStore.getState().organizationDetails?.id;
    const response = await api.post(
      `/organisations/${orgId}/payment-method/default`,
      {
        payment_method_id: paymentMethodId,
      }
    );
    return response.data;
  },
  addPaymentMethod: async (paymente_method: any): Promise<any> => {
    const orgId = useAuthStore.getState().organizationDetails?.id;
    const response = await api.post(
      `/organisations/${orgId}/save-card-details`,
      {
        paymente_method: paymente_method,
      }
    );
    return response.data;
  },
};
