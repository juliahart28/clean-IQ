export const bathroomTypes = [
  "single-stall",
  "accessible",
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
    numUses: 3,
    soapLevel: "ok",
    toiletPaperLevel: null,
    stalls: 3,
    lowPaperStalls: 1
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
    numUses: 0,
    soapLevel: "ok",
    toiletPaperLevel: null,
    stalls: null,
    lowPaperStalls: 0
  },
  {
    id: "bldg-1-floor-2-north-family",
    name: "North Family Suite",
    type: "accessible",
    buildingId: "bldg-1",
    buildingName: "Innovation Hall",
    floorNumber: 2,
    floorName: "Level 2",
    assignedEmployeeId: "emp-1",
    numUses: 4,
    soapLevel: "low",
    toiletPaperLevel: "ok"
  },
  {
    id: "bldg-1-floor-2-south-stall",
    name: "South Wing Stall",
    type: "stall",
    buildingId: "bldg-1",
    buildingName: "Innovation Hall",
    floorNumber: 2,
    floorName: "Level 2",
    assignedEmployeeId: "emp-3",
    numUses: 9,
    soapLevel: "ok",
    toiletPaperLevel: null,
    stalls: 5,
    lowPaperStalls: 1
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
    numUses: 2,
    soapLevel: "low",
    toiletPaperLevel: null,
    stalls: 5,
    lowPaperStalls: 0
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
    numUses: 6,
    soapLevel: "empty",
    toiletPaperLevel: "low",
    stalls: null,
    lowPaperStalls: null
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
    bathroom.soapLevel = "ok";
    bathroom.toiletPaperLevel = "ok";    
    bathroom.lowPaperStalls = 0;

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
