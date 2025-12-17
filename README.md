# clean-IQ
A demo janitorial optimization platform for EGN 110 Group 5. The project exposes an Express API with sample data for bathrooms, employees, shifts, floorplans, and annotated areas so the UI can experiment with cleanliness scoring, prioritization, and floorplan markup flows.

## Table of contents
- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [API overview](#api-overview)
  - [Bathrooms](#bathrooms)
  - [Employees](#employees)
  - [Shifts](#shifts)
  - [Annotated areas](#annotated-areas)
- [Data storage](#data-storage)
- [Troubleshooting](#troubleshooting)

## Features
- Express server that serves both the API (`/api/*`) and static demo UI files from `public/`.
- Sample data for bathrooms, employees, and shifts to drive scoring and prioritization demos.
- Area annotation endpoints that validate geometry (points, polylines, polygons) before persisting to JSON.
- Cleanliness analytics utilities with node-based tests.

## Project structure
```
root
├─ server.js           # Bootstraps Express, static assets, and API routers
├─ routes/             # API route handlers for each resource
├─ data/               # Sample datasets and JSON persistence targets
├─ utils/              # Analytics, scoring, prioritization, and JSON helpers
├─ public/             # Static assets served at the root URL
├─ tests/              # Node test files for utilities
└─ package.json        # Scripts and dependencies
```

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the server**
   ```bash
   node server.js
   ```
   The API listens on `http://localhost:3000` and serves the static UI from `public/`.
3. **Run the test suite (optional but recommended)**
   ```bash
   npm test
   ```

## Available scripts
- `npm test` — runs the Node test suite located in `tests/` using `node --test`.

## API overview
The server mounts all feature routers under `/api`. Example base URL when running locally: `http://localhost:3000/api`.

### Bathrooms
- `GET /api/bathrooms/organization` — returns building/floor/bathroom tree for navigation.
- `GET /api/bathrooms` — lists bathrooms with computed cleanliness scores.
- `GET /api/bathrooms/averages` — returns average cleanliness scores per building.
- `POST /api/bathrooms/prioritize` — body: `{ janitorId, currentFloor }`; ranks bathrooms for a janitor in their assigned building.
- `POST /api/bathrooms/:id/markCleaned` — marks a bathroom as cleaned, resets supplies, and returns the updated score.

### Employees
- `GET /api/employees` — returns the employee directory used for assignments and shift creation.

### Shifts
- `GET /api/shifts` — lists in-memory shifts.
- `POST /api/shifts` — body: `{ employeeId, buildingId, floorNumber, startTime, endTime }`; creates a shift after validating required fields and numeric floor number.

### Annotated areas
- `GET /api/areas?floorplanId=FP_ID` — returns saved areas for a floorplan.
- `POST /api/areas` — body includes `floorplanId`, `category`, and `geometry`; saves a single area after validating geometry and category rules (e.g., bathrooms must be polygons and include type/stall info).
- `PUT /api/areas/:floorplanId` — replaces all areas for a floorplan with the provided array, sanitizing each shape.

## Data storage
- JSON-backed resources (`data/areas.json`, `data/floorplans.json`) are persisted to disk when write endpoints are called.
- Other datasets (`data/bathrooms.js`, `data/employees.js`, `data/shifts.js`) are in-memory JavaScript exports intended for demo purposes.

## Troubleshooting
- **`EADDRINUSE: address already in use 3000`**: stop any other process on port 3000 or change the port in `server.js`.
- **Uploads fail with MIME type errors**: ensure `imageData` is a base64 data URL using PNG or JPEG MIME types (`image/png`, `image/jpeg`, `image/jpg`).
- **400 responses when saving areas**: verify `floorplanId`, `category`, and properly typed geometry points; bathrooms and elevators must be polygons.
