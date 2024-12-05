import axios from "axios";
import { API_GATEWAY_URL } from "../config";

const axiosInstance = axios.create({
  timeout: 10000,
});

const BASE_URL = API_GATEWAY_URL;

const SERVICES_URL = {
  PRODUCT_SERVICE_URL: "product-service",
  PAYMENT_SERVICE_URL: "payment-service",
};

export const routes = {
  products: {
    "check-availability-and-get-price": `${BASE_URL}${SERVICES_URL.PRODUCT_SERVICE_URL}/v1/product-variant-prices`,
  },
  payments: {
    "create-payment-intent": `${BASE_URL}${SERVICES_URL.PAYMENT_SERVICE_URL}/v1/customer/payment-intent`,
  },
};

export const checkAvailabilityAndGetPrice = async (productVariantIds: any) => {
  try {
    const response = await axiosInstance.post(
      routes.products["check-availability-and-get-price"],
      productVariantIds,
    );
    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const createPaymentIntent = async (amount: number) => {
  try {
    const response = await axiosInstance.post(
      routes.payments["create-payment-intent"],
      { amount },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
