import { Router } from "express";
import { computeScore } from "../utils/scoring.js";
import { bathrooms, resetBathroom } from "../data/bathrooms.js";

const router = Router();

// GET /api/bathrooms
router.get("/", (req, res) => {
  const data = bathrooms.map(b => ({
    ...b,
    ...computeScore(b.numUses, b.soapLevel, b.toiletPaperLevel)
  }));
  res.json(data);
});

// POST /api/bathrooms/:id/markCleaned
router.post("/:id/markCleaned", (req, res) => {
  const id = Number(req.params.id);
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
