import { createOrder, confirmOrderPayment, getAllOrders, getOrdersByUser } from "../../src/controllers/order-controller";
import prisma from "../../src/config/prisma";
import { checkAvailabilityAndGetPrice, createPaymentIntent } from "../../src/utils";
import { Request, Response } from "express";

// Mocking external dependencies
jest.mock("../../src/config/prisma", () => ({
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  orderItem: {
    createMany: jest.fn(),
  },
}));

jest.mock("../../src/utils", () => ({
  checkAvailabilityAndGetPrice: jest.fn(),
  createPaymentIntent: jest.fn(),
}));

describe("Order Controller", () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = (body: any, params: any, headers: any) => {
    const req = {} as Request;
    req.body = body;
    req.params = params;
    req.headers = headers;
    return req;
  };describe("createOrder", () => {

    it("should return 400 if order items are missing", async () => {
      const req = mockRequest(
        { order: { order_status: "pending", customer_id: "123", shipping_address_id: "456" }, orderItems: [] },
        {},
        {}
      );
      const res = mockResponse();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Order items are required",
      });
    });

    it("should return 400 if order items have invalid fields", async () => {
      const req = mockRequest(
        { order: { order_status: "pending", customer_id: "123", shipping_address_id: "456" }, orderItems: [{ variantId: "v123" }] },
        {},
        {}
      );
      const res = mockResponse();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Each order item must have product_variant_id and quantity",
      });
    });

    it("should return 400 if order details are incomplete", async () => {
      const req = mockRequest(
        { order: { order_status: "pending", customer_id: "123" }, orderItems: [{ variantId: "v123", quantity: 2 }] },
        {},
        {}
      );
      const res = mockResponse();

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Order details are missing or incomplete",
      });
    });
  });

  describe("confirmOrderPayment", () => {
    it("should confirm order payment successfully", async () => {
      const req = mockRequest(
        {},
        { order_id: "order123" },
        { user: JSON.stringify({ user: { userId: "123" } }) }
      );
      const res = mockResponse();

      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        order_id: "order123",
        customer_id: "123",
      });
      (prisma.order.update as jest.Mock).mockResolvedValue({ order_status: "confirmed" });

      await confirmOrderPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: expect.anything(),
        message: "Order payment confirmed",
      });
    });

    it("should return 404 if order is not found", async () => {
      const req = mockRequest(
        {},
        { order_id: "order123" },
        { user: JSON.stringify({ user: { userId: "123" } }) }
      );
      const res = mockResponse();

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      await confirmOrderPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Order not found",
      });
    });

    it("should return 400 if order_id is missing", async () => {
      const req = mockRequest(
        { order_status: "confirmed" },
        {},
        { user: JSON.stringify({ user: { userId: "123" } }) }
      );
      const res = mockResponse();

      await confirmOrderPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Order ID is required",
      });
    });
  });

  describe("getAllOrders", () => {
    it("should get all orders successfully", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      (prisma.order.findMany as jest.Mock).mockResolvedValue([{ order_id: "order123" }]);

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: [{ order_id: "order123" }],
        message: "All orders retrieved",
      });
    });

    it("should handle errors when fetching orders", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error("Database error"));

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Database error",
      });
    });
  });

  describe("getOrdersByUser", () => {
    it("should get orders by user successfully", async () => {
      const req = mockRequest({}, {}, { user: JSON.stringify({ user: { userId: "123" } }) });
      const res = mockResponse();

      (prisma.order.findMany as jest.Mock).mockResolvedValue([{ order_id: "order123" }]);

      await getOrdersByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: true,
        data: [{ order_id: "order123" }],
        message: "All orders retrieved",
      });
    });

    it("should return 400 if user ID is not available", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await getOrdersByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: {},
        error: "User header is required",
      });
    });

    it("should return 500 if error occurs while fetching orders", async () => {
      const req = mockRequest({}, {}, { user: JSON.stringify({ user: { userId: "123" } }) });
      const res = mockResponse();

      (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error("Database error"));

      await getOrdersByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        data: null,
        message: "Database error",
      });
    });
  });
});
