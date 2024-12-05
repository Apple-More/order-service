import prisma from "../config/prisma";
import { Request, Response } from "express";

import { createPaymentIntent, checkAvailabilityAndGetPrice } from "../utils";

interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
}

interface BulkOrderItems {
  orderItems: OrderItem[];
}

const createOrderItem = async (
  orderItems: BulkOrderItems,
  order_id: string,
) => {
  const { orderItems: items } = orderItems;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No order items provided");
  }
  items.forEach((item) => {
    if (!item.product_variant_id || !item.quantity || !item.price) {
      throw new Error("Missing required fields in one or more order items");
    }
  });

  const newItems = items.map((item) => {
    return {
      order_id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      price: item.price,
    };
  });

  const createBulkOrderItems = prisma.orderItem.createMany({
    data: newItems,
  });

  await prisma.$transaction([createBulkOrderItems]);

  return true;
};

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { order, orderItems } = req.body;

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Order items are required",
    });
  }

  orderItems.forEach((item) => {
    if (!item.variantId || !item.quantity) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Each order item must have product_variant_id and quantity",
      });
    }
  });

  if (
    !order ||
    !order.order_status ||
    !order.customer_id ||
    !order.shipping_address_id
  ) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Order details are missing or incomplete",
    });
  }

  try {
    const response = await checkAvailabilityAndGetPrice(orderItems);

    const { variantDetails, amount } = (
      response.data as { data: { variantDetails: any; amount: number } }
    ).data;

    const newOrder = await prisma.order.create({
      data: {
        order_status: order.order_status,
        customer_id: order.customer_id,
        shipping_address_id: order.shipping_address_id,
      },
    });

    const { order_id } = newOrder;

    await createOrderItem({ orderItems: variantDetails }, order_id);

    const paymentIntent = await createPaymentIntent(amount);

    const { client_secret } = (
      paymentIntent as { data: { client_secret: string } }
    ).data;

    return res.status(201).json({
      status: true,
      data: { order_id, client_secret },
      message: "Order created successfully",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, data: null, message: error.message });
  }
};

interface RequestWithUser extends Request {
  user?: {
    userRole: string;
    userId: string;
    userName: string;
    email: string;
  };
}

export const confirmOrderPayment = async (
  req: RequestWithUser,
  res: Response,
): Promise<any> => {
  const { order_id } = req.params;

  if (!order_id) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Order ID is required",
    });
  }

  const userHeader = req.headers["user"];

  if (userHeader) {
    try {
      const { user } = JSON.parse(userHeader as string);
      req.user = user;
    } catch (error) {
      res.status(400).json({
        status: false,
        data: {},
        error: "Invalid user header format",
      });
    }
  }

  const customer_id = req.user?.userId;

  try {
    const order = await prisma.order.findUnique({
      where: { order_id, customer_id },
    });

    if (!order) {
      return res.status(404).json({
        status: false,
        data: null,
        message: "Order not found",
      });
    }

    await prisma.order.update({
      where: { order_id },
      data: { order_status: "payment_completed" },
    });

    const orderWithItems = await prisma.order.findUnique({
      where: { order_id },
      include: { order_items: true },
    });

    return res.status(200).json({
      status: true,
      data: orderWithItems,
      message: "Order payment confirmed",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, data: null, message: error.message });
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const orders = await prisma.order.findMany();

    return res.status(200).json({
      status: true,
      data: orders,
      message: "All orders retrieved",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, data: null, message: error.message });
  }
};

export const getOrdersByUser = async (
  req: RequestWithUser,
  res: Response,
): Promise<any> => {
  const userHeader = req.headers["user"];

  if (userHeader) {
    try {
      const { user } = JSON.parse(userHeader as string);
      req.user = user;
    } catch (error) {
      res.status(400).json({
        status: false,
        data: {},
        error: "Invalid user header format",
      });
    }
  }

  const customer_id = req.user?.userId;

  try {
    const orders = await prisma.order.findMany({
      where: { customer_id },
    });

    return res.status(200).json({
      status: true,
      data: orders,
      message: "All orders retrieved",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, data: null, message: error.message });
  }
};
