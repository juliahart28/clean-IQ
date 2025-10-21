import { Router } from "express";
import { computeScore } from "../utils/scoring.js";
import {
  listBathrooms,
  resetBathroom,
  getOrganizationTree
} from "../data/bathrooms.js";
import { getEmployeeById } from "../data/employees.js";
import { prioritizeBathrooms } from "../utils/prioritization.js";

const router = Router();

router.get("/organization", (req, res) => {
  res.json(getOrganizationTree());
});

router.get("/", (req, res) => {
  const data = listBathrooms().map(bathroom => ({
    ...bathroom,
    ...computeScore(bathroom.numUses, bathroom.soapLevel, bathroom.toiletPaperLevel)
  }));

  res.json(data);
});

router.post("/prioritize", (req, res) => {
  const { janitorId, currentFloor } = req.body;

  if (!janitorId) {
    return res.status(400).json({ error: "janitorId is required" });
  }

  if (currentFloor === undefined) {
    return res.status(400).json({ error: "currentFloor is required" });
  }

  const employee = getEmployeeById(janitorId);
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const bathrooms = listBathrooms().filter(
    bathroom => bathroom.buildingId === employee.assignedBuildingId
  );

  const parsedFloor = Number(currentFloor);
  if (!Number.isFinite(parsedFloor)) {
    return res.status(400).json({ error: "currentFloor must be a number" });
  }

  const prioritized = prioritizeBathrooms({
    bathrooms,
    currentFloor: parsedFloor
  });

  res.json({
    janitor: {
      id: employee.id,
      name: employee.name,
      buildingId: employee.assignedBuildingId,
      currentFloor: parsedFloor
    },
    bathrooms: prioritized
  });
});

router.post("/:id/markCleaned", (req, res) => {
  const { id } = req.params;
  const updated = resetBathroom(id);

  if (!updated) {
    return res.status(404).json({ error: "Bathroom not found" });
  }

  const scored = {
    ...updated,
    ...computeScore(updated.numUses, updated.soapLevel, updated.toiletPaperLevel)
  };

  res.json(scored);
});

export default router;