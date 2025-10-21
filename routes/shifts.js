import { Router } from "express";
import { addShift, listShifts } from "../data/shifts.js";
import { getEmployeeById } from "../data/employees.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(listShifts());
});

router.post("/", (req, res) => {
  const { employeeId, buildingId, floorNumber, startTime, endTime } = req.body;

  if (!employeeId || !buildingId || floorNumber === undefined || !startTime || !endTime) {
    return res.status(400).json({
      error:
        "employeeId, buildingId, floorNumber, startTime, and endTime are required"
    });
  }

  const employee = getEmployeeById(employeeId);
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const parsedFloor = Number(floorNumber);
  if (!Number.isFinite(parsedFloor)) {
    return res.status(400).json({ error: "floorNumber must be numeric" });
  }

  const newShift = addShift({
    employeeId,
    buildingId,
    floorNumber: parsedFloor,
    startTime,
    endTime
  });

  res.status(201).json(newShift);
});

export default router;
