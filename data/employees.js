export const employees = [
  {
    id: "emp-1",
    name: "Jordan Lee",
    role: "Custodian",
    assignedBuildingId: "bldg-1"
  },
  {
    id: "emp-2",
    name: "Priya Natarajan",
    role: "Custodian",
    assignedBuildingId: "bldg-2"
  }
];

export function getEmployeeById(id) {
  return employees.find(employee => employee.id === id) || null;
}

export function listEmployees() {
  return employees.map(employee => ({ ...employee }));
}