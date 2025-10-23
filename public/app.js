const state = {
    baseBathrooms: [],
    customBathrooms: [],
    employees: [],
    customEmployees: [],
    shifts: [],
    organization: [],
    customBuildings: [],
    floorPlans: [],
    currentUser: null,
    showAllShifts: false
};

const selectors = {
    app: document.getElementById("app"),
    loginScreen: document.getElementById("login-screen"),
    loginForm: document.getElementById("login-form"),
    roleTabs: document.getElementById("role-tabs"),
    managerView: document.getElementById("manager-view"),
    managerSetup: document.getElementById("manager-setup"),
    managerPanels: Array.from(document.querySelectorAll("[data-manager-panel]")),
    janitorView: document.getElementById("janitor-view"),
    janitorStatusSummary: document.getElementById("janitor-status-summary"),
    filterBuilding: document.getElementById("filter-building"),
    filterFloor: document.getElementById("filter-floor"),
    filterEmployee: document.getElementById("filter-employee"),
    filterStatus: document.getElementById("filter-status"),
    bathroomTableBody: document.querySelector("#bathroom-table tbody"),
    staffGrid: document.getElementById("staff-grid"),
    scheduleCards: document.getElementById("schedule-cards"),
    toggleSchedule: document.getElementById("toggle-schedule"),
    routeFloorSelect: document.getElementById("route-floor-select"),
    restroomFloorSelect: document.getElementById("restroom-floor-select"),
    routeMap: document.getElementById("route-map"),
    restroomList: document.getElementById("restroom-list"),
    refreshRoute: document.getElementById("refresh-route"),
    profileButton: document.getElementById("profile-button"),
    profilePopover: document.getElementById("profile-popover"),
    profileEmail: document.getElementById("profile-email"),
    logoutButton: document.getElementById("logout-button"),
    addEmployeeForm: document.getElementById("add-employee-form"),
    employeeBuildingSelect: document.getElementById("employee-building-select"),
    addBuildingForm: document.getElementById("add-building-form"),
    bathroomBuildingSelect: document.getElementById("bathroom-building-select"),
    addBathroomForm: document.getElementById("add-bathroom-form"),
    editScheduleButton: document.getElementById("edit-schedule-button"),
    addShiftButton: document.getElementById("add-shift-button"),
    scheduleModal: document.getElementById("schedule-modal"),
    closeScheduleModal: document.getElementById("close-schedule-modal"),
    addShiftForm: document.getElementById("add-shift-form"),
    shiftEmployeeSelect: document.getElementById("shift-employee"),
    shiftBuildingSelect: document.getElementById("shift-building"),
    floorPlanForm: document.getElementById("add-floorplan-form"),
    floorPlanBuildingSelect: document.getElementById("floorplan-building-select"),
    setupProgress: document.getElementById("setup-progress")
};

const setupSequence = ["employees", "buildings", "floorplans", "bathrooms"];
const setupStepLabels = {
    employees: "Add Your Team",
    buildings: "Add Buildings",
    floorplans: "Upload Floor Plans",
    bathrooms: "Mark Restrooms"
};
const setupStepElements = new Map(
                                  Array.from(document.querySelectorAll("[data-setup-step]")).map(element => [
                                      element.dataset.setupStep,
                                      element
                                  ])
                                  );

function fetchJSON(url, options = {}) {
    const headers = options.headers || {};
    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    
    return fetch(url, { ...options, headers }).then(response => {
        if (!response.ok) {
            return response.json().catch(() => ({})).then(payload => {
                const error = new Error(payload.error || "Request failed");
                error.status = response.status;
                throw error;
            });
        }
        
        if (response.status === 204) {
            return null;
        }
        
        return response.json();
    });
}

function getAllEmployees() {
    return [...state.employees, ...state.customEmployees];
}

function getBuildingName(buildingId) {
    const fromOrg = state.organization.find(b => b.id === buildingId);
    if (fromOrg) {
        return fromOrg.name;
    }
    const custom = state.customBuildings.find(b => b.id === buildingId);
    return custom ? custom.name : "Unknown";
}

function getAllBuildings() {
    const organizationBuildings = state.organization.map(building => ({
        id: building.id,
        name: building.name
    }));
    const unique = new Map();
    for (const building of organizationBuildings) {
        unique.set(building.id, building);
    }
    for (const building of state.customBuildings) {
        unique.set(building.id, { id: building.id, name: building.name });
    }
    return Array.from(unique.values());
}

function getFloorsForBuilding(buildingId) {
    if (!buildingId) {
        return [];
    }
    const building = state.organization.find(b => b.id === buildingId);
    if (building) {
        return building.floors
        .map(floor => ({ number: floor.number, name: floor.name }))
        .sort((a, b) => a.number - b.number);
    }
    const customBuilding = state.customBuildings.find(b => b.id === buildingId);
    if (customBuilding) {
        return Array.from({ length: Number(customBuilding.floors) || 0 }).map((_, index) => ({
            number: index + 1,
            name: `Floor ${index + 1}`
        }));
    }
    const bathrooms = getAllBathrooms().filter(bathroom => bathroom.buildingId === buildingId);
    const floors = new Map();
    for (const bathroom of bathrooms) {
        floors.set(bathroom.floorNumber, bathroom.floorName || `Floor ${bathroom.floorNumber}`);
    }
    return Array.from(floors.entries())
    .map(([number, name]) => ({ number, name }))
    .sort((a, b) => a.number - b.number);
}

function getAllBathrooms() {
    return [...state.baseBathrooms, ...state.customBathrooms];
}

function getBathroomsForCurrentJanitor() {
    if (!state.currentUser || !state.currentUser.assignedBuildingId) {
        return [];
    }

    return getAllBathrooms().filter(
        bathroom => bathroom.buildingId === state.currentUser.assignedBuildingId
    );
}

function hasUploadedFloorPlans() {
    if (state.floorPlans.length > 0) {
        return true;
    }
    return state.organization.some(
                                   building => Array.isArray(building.floors) && building.floors.length > 0
                                   );
}

function isSetupStepComplete(step) {
    switch (step) {
        case "employees":
            return getAllEmployees().length > 0;
        case "buildings":
            return getAllBuildings().length > 0;
        case "floorplans":
            return hasUploadedFloorPlans();
        case "bathrooms":
            return getAllBathrooms().length > 0;
        default:
            return false;
    }
}

function updateSetupFlow() {
    if (!selectors.managerSetup) {
        return;
    }
    
    const firstIncompleteIndex = setupSequence.findIndex(step => !isSetupStepComplete(step));
    const setupComplete = firstIncompleteIndex === -1;
    
    selectors.managerSetup.classList.toggle("hidden", setupComplete);
    selectors.managerPanels.forEach(panel => {
        panel.classList.toggle("hidden", !setupComplete);
    });
    
    if (setupComplete) {
        if (selectors.setupProgress) {
            selectors.setupProgress.textContent = "";
        }
        return;
    }
    
    setupSequence.forEach((step, index) => {
        const element = setupStepElements.get(step);
        if (element) {
            element.classList.toggle("active", index === firstIncompleteIndex);
        }
    });
    
    if (selectors.setupProgress) {
        const currentStep = setupSequence[firstIncompleteIndex];
        selectors.setupProgress.textContent = `Step ${firstIncompleteIndex + 1} of ${
      setupSequence.length
    } • ${setupStepLabels[currentStep] || ""}`;
    }
}



function categoryKey(category) {
    if (!category) return "";
    const normalized = category.toLowerCase();
    if (normalized.includes("needs")) {
        return "needs-attention";
    }
    return normalized;
}

function formatDateRange(start, end) {
    if (!start || !end) {
        return "";
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    });
    
    const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();
    
    if (sameDay) {
        return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`;
    }
    
    return `${dateFormatter.format(startDate)} ${timeFormatter.format(startDate)} – ${dateFormatter.format(endDate)} ${timeFormatter.format(endDate)}`;
}

function closeProfilePopover() {
    selectors.profilePopover.classList.add("hidden");
}

function populateBuildingSelects() {
    const buildings = getAllBuildings();
    const selects = [
        selectors.employeeBuildingSelect,
        selectors.bathroomBuildingSelect,
        selectors.shiftBuildingSelect,
        selectors.floorPlanBuildingSelect
    ];
    
    for (const select of selects) {
        if (!select) {
            continue;
        }
        select.innerHTML = "";
        for (const building of buildings) {
            const option = document.createElement("option");
            option.value = building.id;
            option.textContent = building.name;
            select.append(option);
        }
    }
    
    selectors.filterBuilding.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Buildings";
    selectors.filterBuilding.append(allOption);
    for (const building of buildings) {
        const option = document.createElement("option");
        option.value = building.id;
        option.textContent = building.name;
        selectors.filterBuilding.append(option);
    }
    
    populateFilterFloors();
    populateShiftModalDefaults();
}

function populateFilterFloors() {
    selectors.filterFloor.innerHTML = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "All Floors";
    selectors.filterFloor.append(option);
    
    const buildingId = selectors.filterBuilding.value;
    if (!buildingId) {
        return;
    }
    const floors = getFloorsForBuilding(buildingId);
    for (const floor of floors) {
        const floorOption = document.createElement("option");
        floorOption.value = String(floor.number);
        floorOption.textContent = floor.name;
        selectors.filterFloor.append(floorOption);
    }
}

function populateEmployeeFilters() {
    selectors.filterEmployee.innerHTML = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "All Staff";
    selectors.filterEmployee.append(option);
    
    for (const employee of getAllEmployees()) {
        const employeeOption = document.createElement("option");
        employeeOption.value = employee.id;
        employeeOption.textContent = employee.name;
        selectors.filterEmployee.append(employeeOption);
    }
    
    selectors.shiftEmployeeSelect.innerHTML = "";
    for (const employee of getAllEmployees()) {
        const employeeOption = document.createElement("option");
        employeeOption.value = employee.id;
        employeeOption.textContent = `${employee.name} (${employee.role})`;
        selectors.shiftEmployeeSelect.append(employeeOption);
    }
}

function populateShiftModalDefaults() {
    if (!selectors.shiftBuildingSelect.value && selectors.shiftBuildingSelect.options.length > 0) {
        selectors.shiftBuildingSelect.selectedIndex = 0;
    }
    if (!selectors.shiftEmployeeSelect.value && selectors.shiftEmployeeSelect.options.length > 0) {
        selectors.shiftEmployeeSelect.selectedIndex = 0;
    }
}

function renderBathroomTable() {
    const bathrooms = getAllBathrooms();
    const filters = {
        building: selectors.filterBuilding.value,
        floor: selectors.filterFloor.value,
        employee: selectors.filterEmployee.value,
        status: selectors.filterStatus.value
    };
    
    selectors.bathroomTableBody.innerHTML = "";
    
    const filtered = bathrooms.filter(bathroom => {
        if (filters.building && bathroom.buildingId !== filters.building) {
            return false;
        }
        if (filters.floor && String(bathroom.floorNumber) !== filters.floor) {
            return false;
        }
        if (filters.employee && bathroom.assignedEmployeeId !== filters.employee) {
            return false;
        }
        if (filters.status && categoryKey(bathroom.category) !== filters.status) {
            return false;
        }
        return true;
    });
    
    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "No bathrooms match the selected filters.";
        cell.style.textAlign = "center";
        cell.style.color = "var(--muted)";
        row.append(cell);
        selectors.bathroomTableBody.append(row);
        return;
    }
    
    const employees = getAllEmployees();
    const employeeById = new Map(employees.map(emp => [emp.id, emp]));
    
    for (const bathroom of filtered) {
        const row = document.createElement("tr");
        
        const nameCell = document.createElement("td");
        nameCell.textContent = bathroom.name;
        row.append(nameCell);
        
        const buildingCell = document.createElement("td");
        buildingCell.textContent = getBuildingName(bathroom.buildingId);
        row.append(buildingCell);
        
        const floorCell = document.createElement("td");
        floorCell.textContent = bathroom.floorName || `Floor ${bathroom.floorNumber}`;
        row.append(floorCell);
        
        const employeeCell = document.createElement("td");
        const assigned = bathroom.assignedEmployeeId
        ? employeeById.get(bathroom.assignedEmployeeId)
        : null;
        employeeCell.textContent = assigned ? assigned.name : "Unassigned";
        row.append(employeeCell);
        
        const scoreCell = document.createElement("td");
        scoreCell.textContent = `${bathroom.score}`;
        row.append(scoreCell);
        
        const alertCell = document.createElement("td");
        if (bathroom.alerts && bathroom.alerts.length > 0) {
            alertCell.append(
                             ...bathroom.alerts.map(message => {
                                 const pill = document.createElement("span");
                                 pill.className = "alert-pill";
                                 pill.textContent = message;
                                 return pill;
                             })
                             );
        } else {
            alertCell.textContent = "—";
            alertCell.style.color = "var(--muted)";
        }
        row.append(alertCell);
        
        selectors.bathroomTableBody.append(row);
    }
}

function renderStaffGrid() {
    selectors.staffGrid.innerHTML = "";
    const employees = getAllEmployees();
    const buildingLookup = new Map(getAllBuildings().map(building => [building.id, building.name]));
    
    const shiftsByEmployee = new Map();
    for (const shift of state.shifts) {
        if (!shiftsByEmployee.has(shift.employeeId)) {
            shiftsByEmployee.set(shift.employeeId, []);
        }
        shiftsByEmployee.get(shift.employeeId).push(shift);
    }
    for (const list of shiftsByEmployee.values()) {
        list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
    
    const employeesWithShifts = employees.map(employee => {
        const employeeShifts = shiftsByEmployee.get(employee.id) || [];
        const nextShift = employeeShifts[0];
        return {
            employee,
            shifts: employeeShifts,
            nextShiftDate: nextShift ? new Date(nextShift.startTime).getTime() : Infinity
        };
    });
    
    employeesWithShifts.sort((a, b) => {
        if (a.nextShiftDate !== b.nextShiftDate) {
            return a.nextShiftDate - b.nextShiftDate;
        }
        return a.employee.name.localeCompare(b.employee.name);
    });
    
    for (const { employee, shifts } of employeesWithShifts) {
        const card = document.createElement("article");
        card.className = "staff-card";
        
        const info = document.createElement("div");
        info.className = "staff-info";
        
        const name = document.createElement("h3");
        name.textContent = employee.name;
        info.append(name);
        
        const meta = document.createElement("div");
        meta.className = "badge-outline";
        meta.textContent = `${employee.role} • ${buildingLookup.get(employee.assignedBuildingId) || "Unassigned"}`;
        info.append(meta);
        
        card.append(info);
        
        const shiftLine = document.createElement("div");
        shiftLine.className = "shift-line";
        
        if (shifts.length === 0) {
            const empty = document.createElement("span");
            empty.className = "shift-item shift-item--empty";
            empty.textContent = "No scheduled shifts";
            shiftLine.append(empty);
        } else {
            for (const shift of shifts.slice(0, 4)) {
                const item = document.createElement("span");
                item.className = "shift-item";
                item.textContent = `${formatDateRange(shift.startTime, shift.endTime)} • ${getBuildingName(
          shift.buildingId
        )} • Floor ${shift.floorNumber}`;
                shiftLine.append(item);
            }
        }
        
        card.append(shiftLine);
        
        selectors.staffGrid.append(card);
    }
}

function renderScheduleCards() {
    if (!state.currentUser) {
        selectors.scheduleCards.innerHTML = "";
        return;
    }
    const userShifts = state.shifts
    .filter(shift => shift.employeeId === state.currentUser.id)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    const visibleShifts = state.showAllShifts ? userShifts : userShifts.slice(0, 3);
    
    selectors.scheduleCards.innerHTML = "";
    if (visibleShifts.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.textContent = "No upcoming shifts assigned.";
        emptyState.style.color = "var(--muted)";
        selectors.scheduleCards.append(emptyState);
        return;
    }
    
    for (const shift of visibleShifts) {
        const card = document.createElement("article");
        card.className = "schedule-card";
        
        const title = document.createElement("h3");
        title.textContent = `${getBuildingName(shift.buildingId)} • Floor ${shift.floorNumber}`;
        card.append(title);
        
        const time = document.createElement("time");
        time.dateTime = shift.startTime;
        time.textContent = formatDateRange(shift.startTime, shift.endTime);
        card.append(time);
        
        selectors.scheduleCards.append(card);
    }
    
    selectors.toggleSchedule.textContent = state.showAllShifts
    ? "Show Next Three Shifts"
    : "View All Upcoming Shifts";
}

function hazardFromAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
        return null;
    }
    const hasEmpty = alerts.some(alert => alert.toLowerCase().includes("empty"));
    const type = alerts.find(alert => alert.toLowerCase().includes("soap"))
    ? alerts.find(alert => alert.toLowerCase().includes("soap"))
    : alerts.find(alert => alert.toLowerCase().includes("toilet"));
    return {
        label: hasEmpty ? "Empty" : "Low",
        detail: type || alerts[0]
    };
}

function renderJanitorSummary() {
    if (!selectors.janitorStatusSummary) {
        return;
    }

    selectors.janitorStatusSummary.innerHTML = "";

    if (!state.currentUser) {
        return;
    }

    const bathrooms = getBathroomsForCurrentJanitor();

    if (bathrooms.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "status-empty";
        emptyState.textContent = "No restrooms are assigned to your building yet.";
        selectors.janitorStatusSummary.append(emptyState);
        return;
    }

    const locationName = getBuildingName(state.currentUser.assignedBuildingId);
    const location = locationName && locationName !== "Unknown"
        ? locationName
        : "your building";

    const summary = {
        clean: {
            label: "Clean",
            helper: `All set in ${location}`,
            count: 0
        },
        "needs-attention": {
            label: "Needs Attention",
            helper: `Check soon in ${location}`,
            count: 0
        },
        urgent: {
            label: "Urgent",
            helper: `Requires immediate fix in ${location}`,
            count: 0
        }
    };

    for (const bathroom of bathrooms) {
        const key = categoryKey(bathroom.category);
        if (summary[key]) {
            summary[key].count += 1;
        }
    }

    Object.entries(summary).forEach(([key, data]) => {
        const card = document.createElement("article");
        card.className = "status-card";

        const circle = document.createElement("span");
        circle.className = `status-circle ${key}`;
        circle.textContent = data.count;
        circle.setAttribute("aria-hidden", "true");
        card.append(circle);

        const meta = document.createElement("div");
        meta.className = "status-meta";

        const label = document.createElement("span");
        label.className = "status-label";
        label.textContent = data.label;
        meta.append(label);

        const count = document.createElement("span");
        count.className = "status-count";
        count.textContent = `${data.count} ${data.count === 1 ? "Restroom" : "Restrooms"}`;
        meta.append(count);

        const helper = document.createElement("span");
        helper.className = "status-helper";
        helper.textContent = data.helper;
        meta.append(helper);

        card.append(meta);
        selectors.janitorStatusSummary.append(card);
    });
}

async function renderRouteMap() {
    selectors.routeMap.innerHTML = "";
    if (!state.currentUser) {
        return;
    }
    const floorValue = selectors.routeFloorSelect.value;
    if (!floorValue) {
        selectors.routeMap.innerHTML = "<p>Select your current floor to load priorities.</p>";
        return;
    }
    
    try {
        const response = await fetchJSON("/api/bathrooms/prioritize", {
            method: "POST",
            body: JSON.stringify({
                janitorId: state.currentUser.id,
                currentFloor: Number(floorValue)
            })
        });
        const bathrooms = response.bathrooms || [];
        if (bathrooms.length === 0) {
            selectors.routeMap.innerHTML = "<p>No bathrooms require service on this floor.</p>";
            return;
        }
        
        bathrooms.forEach((bathroom, index) => {
            const node = document.createElement("div");
            node.className = "route-node";
            
            const circle = document.createElement("div");
            circle.className = `route-circle status-${categoryKey(bathroom.category)}`;
            
            const number = document.createElement("span");
            number.className = "route-number";
            number.textContent = index + 1;
            circle.append(number);
            
            const hazard = hazardFromAlerts(bathroom.alerts);
            if (hazard) {
                const hazardBadge = document.createElement("span");
                hazardBadge.className = "route-hazard";
                hazardBadge.innerHTML = `<span class="material-symbol">warning</span>`;
                hazardBadge.title = hazard.detail;
                circle.append(hazardBadge);
            }
            
            const label = document.createElement("div");
            label.className = "route-label";
            
            const name = document.createElement("strong");
            name.textContent = bathroom.name;
            label.append(name);
            
            const score = document.createElement("span");
            score.textContent = `Score: ${bathroom.score}`;
            label.append(score);
            
            if (bathroom.alerts && bathroom.alerts.length > 0) {
                const alerts = document.createElement("span");
                alerts.className = "route-alert";
                alerts.textContent = bathroom.alerts.join(" • ");
                label.append(alerts);
            }
            
            node.append(circle, label);
            selectors.routeMap.append(node);
        });
    } catch (error) {
        selectors.routeMap.innerHTML = `<p class="error">Unable to load route: ${error.message}</p>`;
    }
}

function renderRestroomList() {
    selectors.restroomList.innerHTML = "";
    if (!state.currentUser) {
        return;
    }
    
    const floorValue = selectors.restroomFloorSelect.value;
    if (!floorValue) {
        selectors.restroomList.innerHTML = "<p>Select a floor to view restrooms.</p>";
        return;
    }
    
    const bathrooms = getAllBathrooms().filter(
                                               bathroom =>
                                               bathroom.buildingId === state.currentUser.assignedBuildingId &&
                                               String(bathroom.floorNumber) === floorValue
                                               );
    
    if (bathrooms.length === 0) {
        selectors.restroomList.innerHTML = "<p>No restrooms registered on this floor.</p>";
        return;
    }
    
    bathrooms
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(bathroom => {
        const card = document.createElement("article");
        card.className = "restroom-card";
        
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        
        const title = document.createElement("h3");
        title.textContent = bathroom.name;
        title.style.margin = "0";
        header.append(title);
        
        const badge = document.createElement("span");
        badge.className = `badge status-badge ${categoryKey(bathroom.category)}`;
        badge.textContent = bathroom.category;
        header.append(badge);
        card.append(header);
        
        const score = document.createElement("p");
        score.textContent = `Cleanliness Score: ${bathroom.score}`;
        score.style.margin = "0";
        card.append(score);
        
        if (bathroom.alerts.length > 0) {
            const alerts = document.createElement("div");
            alerts.append(
                          ...bathroom.alerts.map(message => {
                              const pill = document.createElement("span");
                              pill.className = "alert-pill";
                              pill.textContent = message;
                              return pill;
                          })
                          );
            card.append(alerts);
        }
        
        const button = document.createElement("button");
        button.className = "primary-button";
        button.textContent = "Mark As Cleaned";
        button.addEventListener("click", () => markRestroomClean(bathroom));
        card.append(button);
        
        selectors.restroomList.append(card);
    });
}

async function markRestroomClean(bathroom) {
    if (bathroom.isCustom) {
        bathroom.numUses = 0;
        bathroom.soapLevel = "ok";
        bathroom.toiletPaperLevel = "ok";
        bathroom.score = 100;
        bathroom.category = "Clean";
        bathroom.alerts = [];
        renderRestroomList();
        renderBathroomTable();
        renderJanitorSummary();
        return;
    }
    
    try {
        const updated = await fetchJSON(`/api/bathrooms/${bathroom.id}/markCleaned`, {
            method: "POST"
        });
        const index = state.baseBathrooms.findIndex(b => b.id === updated.id);
        if (index !== -1) {
            state.baseBathrooms[index] = updated;
        }
        renderRestroomList();
        renderBathroomTable();
        renderJanitorSummary();
        if (!selectors.routeMap.innerHTML.includes("Unable")) {
            renderRouteMap();
        }
    } catch (error) {
        alert(`Unable to reset restroom: ${error.message}`);
    }
}

function updateProfileDetails() {
    if (!state.currentUser) {
        selectors.profileEmail.textContent = "";
        return;
    }
    selectors.profileEmail.textContent = state.currentUser.email;
}

function updateRouteFloorOptions() {
    selectors.routeFloorSelect.innerHTML = "";
    selectors.restroomFloorSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select Floor";
    selectors.routeFloorSelect.append(placeholder.cloneNode(true));
    selectors.restroomFloorSelect.append(placeholder.cloneNode(true));
    
    if (!state.currentUser) {
        return;
    }
    
    const floors = getFloorsForBuilding(state.currentUser.assignedBuildingId);
    floors.forEach(floor => {
        const option = document.createElement("option");
        option.value = String(floor.number);
        option.textContent = floor.name;
        selectors.routeFloorSelect.append(option.cloneNode(true));
        selectors.restroomFloorSelect.append(option);
    });
    
    if (floors.length > 0) {
        selectors.routeFloorSelect.selectedIndex = 1;
        selectors.restroomFloorSelect.selectedIndex = 1;
    }
}

async function loadBaseBathrooms() {
    const bathrooms = await fetchJSON("/api/bathrooms");
    state.baseBathrooms = bathrooms;
}

async function loadOrganization() {
    state.organization = await fetchJSON("/api/bathrooms/organization");
}

async function loadEmployees() {
    state.employees = await fetchJSON("/api/employees");
}

async function loadShifts() {
    state.shifts = await fetchJSON("/api/shifts");
}

async function initializeData() {
    await Promise.all([loadBaseBathrooms(), loadOrganization(), loadEmployees(), loadShifts()]);
    populateBuildingSelects();
    populateEmployeeFilters();
    renderBathroomTable();
    renderStaffGrid();
    updateSetupFlow();
}

function setRoleView(role) {
    const isManager = role === "Manager";
    selectors.managerView.classList.toggle("hidden", !isManager);
    selectors.janitorView.classList.toggle("hidden", isManager);
    
    for (const tab of selectors.roleTabs.querySelectorAll(".role-tab")) {
        tab.classList.toggle("active", tab.dataset.role === (isManager ? "manager" : "janitor"));
    }
}

function handleRoleTabClick(event) {
    const button = event.target.closest(".role-tab");
    if (!button) return;
    
    if (button.dataset.role === "manager") {
        setRoleView("Manager");
    } else {
        setRoleView("Custodian");
    }
}

function openScheduleModal() {
    selectors.scheduleModal.classList.remove("hidden");
}

function closeScheduleModal() {
    selectors.scheduleModal.classList.add("hidden");
    selectors.addShiftForm.reset();
    populateShiftModalDefaults();
}

function registerEventListeners() {
    selectors.roleTabs.addEventListener("click", handleRoleTabClick);
    
    selectors.filterBuilding.addEventListener("change", () => {
        populateFilterFloors();
        renderBathroomTable();
    });
    selectors.filterFloor.addEventListener("change", renderBathroomTable);
    selectors.filterEmployee.addEventListener("change", renderBathroomTable);
    selectors.filterStatus.addEventListener("change", renderBathroomTable);
    
    selectors.toggleSchedule.addEventListener("click", () => {
        state.showAllShifts = !state.showAllShifts;
        renderScheduleCards();
    });
    
    selectors.refreshRoute.addEventListener("click", renderRouteMap);
    selectors.routeFloorSelect.addEventListener("change", renderRouteMap);
    selectors.restroomFloorSelect.addEventListener("change", renderRestroomList);
    
    selectors.profileButton.addEventListener("click", () => {
        selectors.profilePopover.classList.toggle("hidden");
    });
    
    document.addEventListener("click", event => {
        if (
            !selectors.profilePopover.contains(event.target) &&
            !selectors.profileButton.contains(event.target)
            ) {
                closeProfilePopover();
            }
    });
    
    selectors.logoutButton.addEventListener("click", () => {
        state.currentUser = null;
        state.showAllShifts = false;
        selectors.app.classList.add("hidden");
        selectors.loginScreen.classList.remove("hidden");
        closeProfilePopover();
        renderJanitorSummary();
    });
    
    selectors.addEmployeeForm.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(selectors.addEmployeeForm);
        const name = formData.get("name").trim();
        const email = formData.get("email").trim();
        const role = formData.get("role");
        const building = formData.get("building") || null;
        
        if (!name || !email) {
            return;
        }
        
        const newEmployee = {
            id: `custom-emp-${Date.now()}`,
            name,
            email,
            role,
            assignedBuildingId: building
        };
        
        state.customEmployees.push(newEmployee);
        populateEmployeeFilters();
        renderStaffGrid();
        updateSetupFlow();
        selectors.addEmployeeForm.reset();
    });
    
    selectors.addBuildingForm.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(selectors.addBuildingForm);
        const name = formData.get("name").trim();
        const address = formData.get("address").trim();
        const floors = Number(formData.get("floors")) || 1;
        
        if (!name) {
            return;
        }
        
        const newBuilding = {
            id: `custom-bldg-${Date.now()}`,
            name,
            address,
            floors
        };
        
        state.customBuildings.push(newBuilding);
        populateBuildingSelects();
        updateSetupFlow();
        selectors.addBuildingForm.reset();
    });
    
    if (selectors.floorPlanForm) {
        selectors.floorPlanForm.addEventListener("submit", event => {
            event.preventDefault();
            const formData = new FormData(selectors.floorPlanForm);
            const buildingId = formData.get("building");
            const file = formData.get("floorplan");
            
            if (!buildingId) {
                return;
            }
            
            const fileName =
            file && typeof file === "object" && "name" in file && file.name
            ? file.name
            : file
            ? String(file)
            : `Floor Plan ${state.floorPlans.length + 1}`;
            
            state.floorPlans.push({
                id: `floorplan-${Date.now()}`,
                buildingId,
                fileName
            });
            
            selectors.floorPlanForm.reset();
            updateSetupFlow();
        });
    }
    
    
    selectors.addBathroomForm.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(selectors.addBathroomForm);
        const buildingId = formData.get("building");
        const floor = Number(formData.get("floor"));
        const name = formData.get("name").trim();
        const type = formData.get("type");
        const sensor = formData.get("sensor").trim();
        
        if (!buildingId || Number.isNaN(floor) || !name) {
            return;
        }
        
        const newBathroom = {
            id: `custom-bathroom-${Date.now()}`,
            buildingId,
            buildingName: getBuildingName(buildingId),
            floorNumber: floor,
            floorName: `Floor ${floor}`,
            name,
            type,
            sensorId: sensor,
            numUses: 0,
            soapLevel: "ok",
            toiletPaperLevel: "ok",
            score: 100,
            category: "Clean",
            alerts: [],
            assignedEmployeeId: null,
            isCustom: true
        };
        
        state.customBathrooms.push(newBathroom);
        renderBathroomTable();
        renderRestroomList();
        renderJanitorSummary();
        updateSetupFlow();
        selectors.addBathroomForm.reset();
    });
    
    selectors.editScheduleButton.addEventListener("click", openScheduleModal);
    selectors.addShiftButton.addEventListener("click", openScheduleModal);
    selectors.closeScheduleModal.addEventListener("click", closeScheduleModal);
    selectors.scheduleModal.addEventListener("click", event => {
        if (event.target === selectors.scheduleModal) {
            closeScheduleModal();
        }
    });
    
    selectors.addShiftForm.addEventListener("submit", async event => {
        event.preventDefault();
        const formData = new FormData(selectors.addShiftForm);
        const payload = {
            employeeId: formData.get("employeeId"),
            startTime: formData.get("startTime"),
            endTime: formData.get("endTime"),
            buildingId: formData.get("buildingId"),
            floorNumber: formData.get("floorNumber")
        };
        
        try {
            const created = await fetchJSON("/api/shifts", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            state.shifts.push(created);
            renderStaffGrid();
            renderScheduleCards();
            closeScheduleModal();
        } catch (error) {
            alert(`Unable to add shift: ${error.message}`);
        }
    });
}

selectors.loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(selectors.loginForm);
    const email = formData.get("email").trim();
    const password = formData.get("password");
    
    if (!email || !password) {
        return;
    }
    
    try {
        if (state.employees.length === 0 && state.baseBathrooms.length === 0) {
            await initializeData();
        }
        
        const employee = getAllEmployees().find(emp => emp.email.toLowerCase() === email.toLowerCase());
        
        if (!employee) {
            alert("No account found for that email.");
            return;
        }
        
        state.currentUser = employee;
        selectors.loginScreen.classList.add("hidden");
        selectors.app.classList.remove("hidden");
        updateProfileDetails();
        populateEmployeeFilters();
        renderBathroomTable();
        renderStaffGrid();
        updateRouteFloorOptions();
        renderRouteMap();
        renderRestroomList();
        renderScheduleCards();
        renderJanitorSummary();
        updateSetupFlow();
        setRoleView(employee.role);
    } catch (error) {
        alert(`Unable to sign in: ${error.message}`);
    }
});

(async function boot() {
    try {
        await initializeData();
        populateEmployeeFilters();
        renderBathroomTable();
        renderStaffGrid();
    } catch (error) {
        console.warn("Bootstrap failed", error);
    }
    registerEventListeners();
})();
