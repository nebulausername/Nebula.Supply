import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CheckoutData } from "../components/checkout/CheckoutFlow";

export type CheckoutStepType = "address" | "payment" | "review" | "confirmation";

export type CheckoutStatus = "idle" | "processing" | "success" | "error";

export interface CheckoutState {
  // Current state
  currentStep: CheckoutStepType;
  status: CheckoutStatus;
  error: string | null;
  
  // Checkout data
  data: CheckoutData;
  
  // Order information
  orderId: string | null;
  estimatedDelivery: string | null;
  
  // Actions
  setStep: (step: CheckoutStepType) => void;
  setStatus: (status: CheckoutStatus) => void;
  setError: (error: string | null) => void;
  updateData: (data: Partial<CheckoutData>) => void;
  setOrderId: (orderId: string) => void;
  setEstimatedDelivery: (date: string) => void;
  reset: () => void;
  canProceedToNext: () => boolean;
}

const initialCheckoutData: CheckoutData = {
  shippingAddress: {
    firstName: "",
    lastName: "",
    address1: "",
    city: "",
    postalCode: "",
    country: "DE",
  },
  billingAddress: {
    sameAsShipping: true,
    firstName: "",
    lastName: "",
    address1: "",
    city: "",
    postalCode: "",
    country: "DE",
  },
  paymentMethod: "",
  paymentDetails: {},
  marketingConsent: false,
  termsAccepted: false,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      currentStep: "address",
      status: "idle",
      error: null,
      data: initialCheckoutData,
      orderId: null,
      estimatedDelivery: null,

      setStep: (step) => set({ currentStep: step }),
      
      setStatus: (status) => set({ status }),
      
      setError: (error) => set({ error }),
      
      updateData: (newData) => set((state) => ({
        data: { ...state.data, ...newData }
      })),
      
      setOrderId: (orderId) => set({ orderId }),
      
      setEstimatedDelivery: (date) => set({ estimatedDelivery: date }),
      
      reset: () => set({
        currentStep: "address",
        status: "idle",
        error: null,
        data: initialCheckoutData,
        orderId: null,
        estimatedDelivery: null,
      }),
      
      canProceedToNext: () => {
        const { currentStep, data } = get();
        
        switch (currentStep) {
          case "address":
            return !!(
              data.shippingAddress.firstName &&
              data.shippingAddress.lastName &&
              data.shippingAddress.address1 &&
              data.shippingAddress.city &&
              data.shippingAddress.postalCode
            );
          case "payment":
            return !!data.paymentMethod;
          case "review":
            return data.termsAccepted;
          default:
            return false;
        }
      },
    }),
    {
      name: "nebula-checkout-store",
      partialize: (state) => ({
        data: state.data,
        currentStep: state.currentStep,
      }),
    }
  )
);

