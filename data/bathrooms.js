export const bathroomTypes = [
  "single-stall",
  "accessible",
  "family",
  "multi-stall"
];

export const bathrooms = [
  {
    id: "bldg-1-floor-1-east-stall",
    name: "East Wing Stall",
    type: "multi-stall",
    buildingId: "bldg-1",
    buildingName: "Innovation Hall",
    floorNumber: 1,
    floorName: "Level 1",
    assignedEmployeeId: "emp-1",
    doorOpenEvents: 6,
    numUses: 3,
    stalls: 3,
    paperDispensers: [
      { id: "bldg-1-floor-1-east-paper-1", level: "low" },
      { id: "bldg-1-floor-1-east-paper-2", level: "ok" },
      { id: "bldg-1-floor-1-east-paper-3", level: "ok" }
    ],
    soapDispensers: [
      { id: "bldg-1-floor-1-east-soap-1", level: "low" },
      { id: "bldg-1-floor-1-east-soap-2", level: "ok" },
      { id: "bldg-1-floor-1-east-soap-3", level: "ok" }
    ],
    lowPaperStalls: 1,
    noPaperStalls: 0,
    lowSoapDispensers: 1,
    noSoapDispensers: 0
  },
  {
    id: "bldg-1-floor-1-west-single",
    name: "West Single Occupancy",
    type: "single-stall",
    buildingId: "bldg-1",
    buildingName: "Innovation Hall",
    floorNumber: 1,
    floorName: "Level 1",
    assignedEmployeeId: "emp-1",
    doorOpenEvents: 0,
    numUses: 0,
    soapLevel: "ok",
    toiletPaperLevel: "ok",
    stalls: 1,
    soapDispensers: 1,
    lowPaperStalls: 0,
    noPaperStalls: 0,
    lowSoapDispensers: 0,
    noSoapDispensers: 0
  },
  {
    id: "bldg-1-floor-2-north-family",
    name: "North Family Suite",
    type: "family",
    buildingId: "bldg-1",
    buildingName: "Innovation Hall",
    floorNumber: 2,
    floorName: "Level 2",
    assignedEmployeeId: "emp-1",
    doorOpenEvents: 8,
    numUses: 4,
    soapLevel: "low",
    toiletPaperLevel: "ok",
    stalls: 1,
    soapDispensers: 1,
    lowPaperStalls: 0,
    noPaperStalls: 0,
    lowSoapDispensers: 1,
    noSoapDispensers: 0
  },
  {
    id: "bldg-1-floor-2-south-stall",
    name: "South Wing Stall",
    type: "multi-stall",
    buildingId: "bldg-1",
    buildingName: "Innovation Hall",
    floorNumber: 2,
    floorName: "Level 2",
    assignedEmployeeId: "emp-3",
    doorOpenEvents: 18,
    numUses: 9,
    stalls: 5,
    paperDispensers: [
      { id: "bldg-1-floor-2-south-paper-1", level: "empty" },
      { id: "bldg-1-floor-2-south-paper-2", level: "low" },
      { id: "bldg-1-floor-2-south-paper-3", level: "ok" },
      { id: "bldg-1-floor-2-south-paper-4", level: "ok" },
      { id: "bldg-1-floor-2-south-paper-5", level: "ok" }
    ],
    soapDispensers: [
      { id: "bldg-1-floor-2-south-soap-1", level: "ok" },
      { id: "bldg-1-floor-2-south-soap-2", level: "low" },
      { id: "bldg-1-floor-2-south-soap-3", level: "empty" },
      { id: "bldg-1-floor-2-south-soap-4", level: "ok" }
    ],
    lowPaperStalls: 1,
    noPaperStalls: 1,
    lowSoapDispensers: 1,
    noSoapDispensers: 1
  },
  {
    id: "bldg-2-floor-1-lobby-stall",
    name: "Lobby Stall",
    type: "multi-stall",
    buildingId: "bldg-2",
    buildingName: "Science Pavilion",
    floorNumber: 1,
    floorName: "Ground Floor",
    assignedEmployeeId: "emp-2",
    doorOpenEvents: 4,
    numUses: 2,
    stalls: 5,
    paperDispensers: [
      { id: "bldg-2-floor-1-lobby-paper-1", level: "ok" },
      { id: "bldg-2-floor-1-lobby-paper-2", level: "ok" },
      { id: "bldg-2-floor-1-lobby-paper-3", level: "ok" },
      { id: "bldg-2-floor-1-lobby-paper-4", level: "ok" },
      { id: "bldg-2-floor-1-lobby-paper-5", level: "ok" }
    ],
    soapDispensers: [
      { id: "bldg-2-floor-1-lobby-soap-1", level: "low" },
      { id: "bldg-2-floor-1-lobby-soap-2", level: "low" },
      { id: "bldg-2-floor-1-lobby-soap-3", level: "ok" },
      { id: "bldg-2-floor-1-lobby-soap-4", level: "ok" },
      { id: "bldg-2-floor-1-lobby-soap-5", level: "ok" }
    ],
    lowPaperStalls: 0,
    noPaperStalls: 0,
    lowSoapDispensers: 2,
    noSoapDispensers: 0
  },
  {
    id: "bldg-2-floor-3-east-single",
    name: "East Study Wing",
    type: "single-stall",
    buildingId: "bldg-2",
    buildingName: "Science Pavilion",
    floorNumber: 3,
    floorName: "Level 3",
    assignedEmployeeId: "emp-2",
    doorOpenEvents: 12,
    numUses: 6,
    soapLevel: "empty",
    toiletPaperLevel: "low",
    stalls: 1,
    soapDispensers: 1,
    lowPaperStalls: 0,
    noPaperStalls: 0,
    lowSoapDispensers: 0,
    noSoapDispensers: 1
  }
];

export function listBathrooms() {
  return bathrooms.map(b => ({ ...b }));
}

export function getBathroomById(id) {
  return bathrooms.find(b => b.id === id) || null;
}

export function resetBathroom(id) {
    const bathroom = getBathroomById(id);
  if (!bathroom) {
    return null;
  }

    bathroom.numUses = 0;
  bathroom.doorOpenEvents = 0;
  bathroom.soapLevel = "ok";
  bathroom.toiletPaperLevel = "ok";
  if (Array.isArray(bathroom.paperDispensers)) {
    bathroom.paperDispensers = bathroom.paperDispensers.map(dispenser => ({ ...dispenser, level: "ok" }));
  }
  if (Array.isArray(bathroom.soapDispensers)) {
    bathroom.soapDispensers = bathroom.soapDispensers.map(dispenser => ({ ...dispenser, level: "ok" }));
  }
  bathroom.lowPaperStalls = 0;
  bathroom.noPaperStalls = 0;
  bathroom.lowSoapDispensers = 0;
  bathroom.noSoapDispensers = 0;

    return { ...bathroom };
  }

  export function getOrganizationTree() {
    const buildings = new Map();

    for (const bathroom of bathrooms) {
      if (!buildings.has(bathroom.buildingId)) {
        buildings.set(bathroom.buildingId, {
          id: bathroom.buildingId,
          name: bathroom.buildingName,
          floors: []
        });
      }

      const building = buildings.get(bathroom.buildingId);
      let floor = building.floors.find(f => f.number === bathroom.floorNumber);

      if (!floor) {
        floor = {
          number: bathroom.floorNumber,
          name: bathroom.floorName,
          bathrooms: []
        };
        building.floors.push(floor);
      }

      floor.bathrooms.push({ ...bathroom });
    }

    return Array.from(buildings.values()).map(building => ({
      ...building,
      floors: building.floors
        .sort((a, b) => a.number - b.number)
        .map(floor => ({
          ...floor,
          bathrooms: floor.bathrooms.map(b => ({ ...b }))
        }))
    }));
  }
