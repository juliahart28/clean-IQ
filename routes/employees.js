import { Router } from "express";
import { listEmployees } from "../data/employees.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(listEmployees());
});

export default router;
