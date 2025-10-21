const initialShifts = [
  {
    id: "shift-1",
    employeeId: "emp-1",
    buildingId: "bldg-1",
    floorNumber: 1,
    startTime: "2024-05-01T08:00:00",
    endTime: "2024-05-01T12:00:00"
  },
  {
    id: "shift-2",
    employeeId: "emp-1",
    buildingId: "bldg-1",
    floorNumber: 2,
    startTime: "2024-05-02T13:00:00",
    endTime: "2024-05-02T17:00:00"
  },
  {
    id: "shift-3",
    employeeId: "emp-2",
    buildingId: "bldg-2",
    floorNumber: 3,
    startTime: "2024-05-01T09:00:00",
    endTime: "2024-05-01T15:00:00"
  }
];

const shifts = initialShifts.map(shift => ({ ...shift }));
let shiftCounter = shifts.length + 1;

export function listShifts() {
  return shifts.map(shift => ({ ...shift }));
}

export function addShift({ employeeId, buildingId, floorNumber, startTime, endTime }) {
  const id = `shift-${shiftCounter++}`;
  const newShift = {
    id,
    employeeId,
    buildingId,
    floorNumber,
    startTime,
    endTime
  };

  shifts.push(newShift);
  return { ...newShift };
}
