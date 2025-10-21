
import express from "express";
import bathroomsRouter from "./routes/bathrooms.js";

const app = express();
app.use(express.json());

// sanity check
app.get("/", (req, res) => res.send("CleanIQ backend running!"));

// mount the bathrooms routes at /api/bathrooms
app.use("/api/bathrooms", bathroomsRouter);

app.listen(3000, () => console.log("Server listening on port 3000"));



