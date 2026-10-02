import express from "express";
import http from "http";
import dns from "dns";
import net from "net";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { sanitizeSearchQuery } from "./middleware/searchSanitizer.js";
import adminRoutes from "./routes/adminRoutes.js";
import employeeAuthRoutes from "./routes/employeeAuthRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

// Prefer IPv4 for outbound connections (e.g. api.cloudinary.com). On many
// home/ISP networks the IPv6 route stalls, and Node then waits until the
// Cloudinary SDK times out at 60s. Also shorten the per-address fallback wait.
dns.setDefaultResultOrder("ipv4first");
if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === "function") {
  net.setDefaultAutoSelectFamilyAttemptTimeout(500);
}

connectDB();

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeSearchQuery);

// Serve uploaded menu images. The DB only stores the relative URL
// (e.g. /uploads/menu/169...-photo.jpg).
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Server is healthy", data: {} });
});

app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeAuthRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
