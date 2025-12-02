
import { Router } from "express";
import { computeScore } from "../utils/scoring.js";
import { computeBuildingAverages } from "../utils/analytics.js";
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
    ...computeScore(bathroom)
  }));

    res.json(data);
  }); 
  router.get("/averages", (req, res) => {
    const bathrooms = listBathrooms();
    const averages = computeBuildingAverages(bathrooms.map(bathroom => ({
      ...bathroom,
      ...computeScore(bathroom)
    })));
  res.json(averages);
});

router.post("/prioritize", (req, res) => {
  const { janitorId, currentFloor } = req.body;

  if (!janitorId) {
    return res.status(400).json({ error: "janitorId is required" });
  }

  if (currentFloor === undefined) {
    return res.status(400).json({ error: "currentFloor is required" });
  }

  const parsedFloor = Number(currentFloor);
  if (!Number.isFinite(parsedFloor)) {
    return res.status(400).json({ error: "currentFloor must be a number" });
  }

  const employee = getEmployeeById(janitorId);
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const bathrooms = listBathrooms().filter(
    bathroom =>
      bathroom.buildingId === employee.assignedBuildingId &&
      Number(bathroom.floorNumber) === parsedFloor
  );

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
      ...computeScore(updated)
    };

    res.json(scored);
  });

  export default router;
