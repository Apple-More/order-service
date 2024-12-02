import { Router } from "express";
import { createOrder } from "../controllers/order-controller";

const router = Router();

router.post("/", createOrder);
router.get("/:order_id");

export default router;
