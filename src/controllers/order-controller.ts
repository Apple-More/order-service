import prisma from "../config/prisma";
import { Request, Response } from "express";

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

const createOrderItem = async (orderItems: BulkOrderItems) => {
  const { orderItems: items } = orderItems;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No order items provided");
  }

  items.forEach((item) => {
    if (
      !item.order_item_id ||
      !item.product_variant_id ||
      !item.quantity ||
      !item.order_id ||
      !item.price
    ) {
      throw new Error("Missing required fields in one or more order items");
    }
  });

  const createBulkOrderItems = prisma.orderItem.createMany({
    data: items,
  });

  await prisma.$transaction([createBulkOrderItems]);
};

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { order, orderItems } = req.body;
  // TODO: check if order and orderItems are available on the request body
  if (!order || !orderItems) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Order details are required",
    });
  }

  const { order_status, customer_id, shipping_address_id } = order;

  // TODO: check if order status, customer ID and shipping address ID are available on the order object
  if (!order_status || !customer_id || !shipping_address_id) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Order status, customer ID and shipping address ID are required",
    });
  }

  // TODO: check if orderItems is an array and has at least one item
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({
      status: false,
      data: null,
      message: "Order items are required",
    });
  }

  // TODO: check if each order item has all the required fields
  orderItems.forEach((item) => {
    if (!item.product_variant_id || !item.quantity) {
      return res.status(400).json({
        status: false,
        data: null,
        message: "Order item details are required",
      });
    }
  });

  try {
    // TODO: call the product service and verify stock availability and get the price of each product variant
    // TODO: create the order and order items in the database
    const newOrder = await prisma.order.create({
      data: {
        order_status,
        customer_id,
        shipping_address_id,
      },
    });

    await createOrderItem({ orderItems });
    // TODO: call the payment service and get the client secret
    // TODO: return the order ID and client secret in the response

    const { order_id } = newOrder;
    return res.status(201).json({
      status: true,
      data: { order_id, client_secret: "client_secret" },
      message: "Order created successfully",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: false, data: null, message: error.message });
  }
};
