import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// // Connecting to the database before running tests
// beforeAll(async () => {
//   await prisma.$connect();
//   console.log("Connected to the database");
// });

// // Disconnecting Prisma after testsS
// afterAll(async () => {
//   await prisma.$disconnect();
//   console.log("Disconnected from the database");
// });

export default prisma;
