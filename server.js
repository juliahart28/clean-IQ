
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bathroomsRouter from "./routes/bathrooms.js";
import employeesRouter from "./routes/employees.js";
import shiftsRouter from "./routes/shifts.js";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// mount the bathrooms routes at /api/bathrooms
app.use("/api/bathrooms", bathroomsRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/shifts", shiftsRouter);

app.listen(3000, () => console.log("Server listening on port 3000"));



