import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  confirmOrderPayment,
} from "../controllers/order-controller";

const router = Router();

router.post("/", createOrder);
router.get("/:order_id", confirmOrderPayment);
router.get("/user", getOrdersByUser);
router.get("/", getAllOrders);

export default router;
