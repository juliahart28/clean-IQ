export const employees = [
  {
    id: "emp-1",
    name: "Jordan Lee",
    email: "jordan.lee@cleaniq.com",
    role: "Custodian",
    assignedBuildingId: "bldg-1"
  },
  {
    id: "emp-2",
    name: "Priya Natarajan",
    email: "priya.natarajan@cleaniq.com",
    role: "Custodian",
    assignedBuildingId: "bldg-2"
  },
  {
    id: "emp-3",
    name: "Morgan Riley",
    email: "morgan.riley@cleaniq.com",
    role: "Manager",
    assignedBuildingId: "bldg-1"
  }
];

export function getEmployeeById(id) {
  return employees.find(employee => employee.id === id) || null;
}

export function listEmployees() {
  return employees.map(employee => ({ ...employee }));
}

export function getEmployeeByEmail(email) {
  return employees.find(employee => employee.email === email) || null;
}
