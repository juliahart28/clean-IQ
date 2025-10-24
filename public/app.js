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

function ready(cb) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cb);
    } else cb();
}

function setText(el, val = "") {
    if (!el) return console.warn("setText(): target is null");
    el.textContent = String(val);
}

function clear(el) {
    if (!el) return console.warn("clear(): target is null");
    while (el.firstChild) el.removeChild(el.firstChild);
}

function append(el, ...children) {
    if (!el) return console.warn("append(): target is null");
    children.forEach(c => el.appendChild(c));
}

function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null) continue;
        if (k === "class") node.className = v;
        else if (k.startsWith("data-")) node.setAttribute(k, v);
        else node[k] = v;
    }
    if (text != null) setText(node, text);
    return node;
}

const selectors = {};
let setupStepElements = new Map();

function initializeDomReferences() {
    Object.assign(selectors, {
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
        bathroomTypeSelect: document.getElementById("bathroom-type-select"),
        bathroomStallsField: document.getElementById("bathroom-stalls-field"),
        editScheduleButton: document.getElementById("edit-schedule-button"),
        addShiftButton: document.getElementById("add-shift-button"),
        scheduleModal: document.getElementById("schedule-modal"),
        closeScheduleModal: document.getElementById("close-schedule-modal"),
        addShiftForm: document.getElementById("add-shift-form"),
        shiftEmployeeSelect: document.getElementById("shift-employee"),
        shiftBuildingSelect: document.getElementById("shift-building"),
        managerOverview: document.getElementById("manager-overview"),
        setupProgress: document.getElementById("setup-progress")
    });

    setupStepElements = new Map(
        Array.from(document.querySelectorAll("[data-setup-step]")).map(element => [
            element.dataset.setupStep,
            element
        ])
    );

    for (const [key, value] of Object.entries(selectors)) {
        if (!value) console.warn(`Missing DOM node for selectors.${key}`);
    }
}

const setupSequence = ["employees", "buildings", "bathrooms"];
const setupStepLabels = {
    employees: "Add Your Team",
    buildings: "Add Buildings",
    floorplans: "Upload Floor Plans",
    bathrooms: "Mark Restrooms"
};

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

function getFloorPlanForBuilding(buildingId) {
    if (!buildingId) {
        return null;
    }
    return state.floorPlans.find(plan => plan.buildingId === buildingId) || null;
}

function computeLocalBuildingAverages() {
    const bathrooms = getAllBathrooms();
    const totals = new Map();

    for (const bathroom of bathrooms) {
        if (!bathroom || !bathroom.buildingId) {
            continue;
        }

        const entry = totals.get(bathroom.buildingId) || {
            buildingId: bathroom.buildingId,
            buildingName: bathroom.buildingName || getBuildingName(bathroom.buildingId),
            total: 0,
            count: 0
        };

        const score = Number(bathroom.score);
        entry.total += Number.isFinite(score) ? score : 0;
        entry.count += 1;

        if (!entry.buildingName) {
            entry.buildingName = getBuildingName(bathroom.buildingId);
        }

        totals.set(bathroom.buildingId, entry);
    }

    return Array.from(totals.values()).map(entry => {
        const average = entry.count === 0 ? 0 : entry.total / entry.count;
        const clamped = Math.max(0, Math.min(100, average));
        const rounded = Math.round(clamped);
        return {
            buildingId: entry.buildingId,
            buildingName: entry.buildingName,
            averageScore: rounded,
            category: categoryFromScore(rounded),
            bathroomCount: entry.count
        };
    });
}

function getBathroomsForCurrentJanitor() {
    if (!state.currentUser || !state.currentUser.assignedBuildingId) {
        return [];
    }

    return getAllBathrooms().filter(
        bathroom => bathroom.buildingId === state.currentUser.assignedBuildingId
    );
}

function isSetupStepComplete(step) {
    switch (step) {
        case "employees":
            return getAllEmployees().length > 0;
        case "buildings":
            return getAllBuildings().length > 0;
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
            setText(selectors.setupProgress, "");
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
        setText(selectors.setupProgress, `Step ${firstIncompleteIndex + 1} of ${
      setupSequence.length
    } • ${setupStepLabels[currentStep] || ""}`);
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

function categoryFromScore(score) {
    const numeric = Number(score);
    if (!Number.isFinite(numeric)) {
        return "Clean";
    }
    if (numeric < 20) {
        return "Urgent";
    }
    if (numeric < 50) {
        return "Needs Attention";
    }
    return "Clean";
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
        if (!selectors.profilePopover) {
        return;
    }
    selectors.profilePopover.classList.add("hidden");
}

function populateBuildingSelects() {
    const buildings = getAllBuildings();
    const selects = [
        selectors.employeeBuildingSelect,
        selectors.bathroomBuildingSelect,
        selectors.shiftBuildingSelect
    ];
    
    for (const select of selects) {
        if (!select) {
            continue;
        }
        clear(select);
        for (const building of buildings) {
            append(select, el("option", { value: building.id }, building.name));
        }
    }
    
    if (selectors.filterBuilding) {
        clear(selectors.filterBuilding);
        append(selectors.filterBuilding, el("option", { value: "" }, "All Buildings"));
        for (const building of buildings) {
            append(selectors.filterBuilding, el("option", { value: building.id }, building.name));
        }
    }
    
    populateFilterFloors();
    populateShiftModalDefaults();
}

function populateFilterFloors() {
    if (!selectors.filterFloor || !selectors.filterBuilding) {
        return;
    }

    clear(selectors.filterFloor);
    append(selectors.filterFloor, el("option", { value: "" }, "All Floors"));
    
    const buildingId = selectors.filterBuilding.value;
    if (!buildingId) {
        return;
    }
    const floors = getFloorsForBuilding(buildingId);
    for (const floor of floors) {
        append(selectors.filterFloor, el("option", { value: String(floor.number) }, floor.name));
    }
}

function populateEmployeeFilters() {
        if (selectors.filterEmployee) {
        clear(selectors.filterEmployee);
        append(selectors.filterEmployee, el("option", { value: "" }, "All Staff"));

        for (const employee of getAllEmployees()) {
            append(selectors.filterEmployee, el("option", { value: employee.id }, employee.name));
        }
    }
    
        if (selectors.shiftEmployeeSelect) {
        clear(selectors.shiftEmployeeSelect);
        for (const employee of getAllEmployees()) {
            append(
                selectors.shiftEmployeeSelect,
                el("option", { value: employee.id }, `${employee.name} (${employee.role})`)
            );
        }
    }
}

function populateShiftModalDefaults() {
    if (selectors.shiftBuildingSelect && !selectors.shiftBuildingSelect.value && selectors.shiftBuildingSelect.options.length > 0) {
        selectors.shiftBuildingSelect.selectedIndex = 0;
    }
    if (selectors.shiftEmployeeSelect && !selectors.shiftEmployeeSelect.value && selectors.shiftEmployeeSelect.options.length > 0) {
        selectors.shiftEmployeeSelect.selectedIndex = 0;
    }
}

function renderBathroomTable() {
        if (!selectors.bathroomTableBody) {
        return;
    }
    const bathrooms = getAllBathrooms();
    const filters = {
        building: selectors.filterBuilding ? selectors.filterBuilding.value : "",
        floor: selectors.filterFloor ? selectors.filterFloor.value : "",
        employee: selectors.filterEmployee ? selectors.filterEmployee.value : "",
        status: selectors.filterStatus ? selectors.filterStatus.value : ""
    };
    
    clear(selectors.bathroomTableBody);
    
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
        setText(cell, "No bathrooms match the selected filters.");
        cell.style.textAlign = "center";
        cell.style.color = "var(--muted)";
        append(row, cell);
        append(selectors.bathroomTableBody, row);
        return;
    }
    
    const employees = getAllEmployees();
    const employeeById = new Map(employees.map(emp => [emp.id, emp]));
    
    for (const bathroom of filtered) {
        const row = document.createElement("tr");
        
        const nameCell = document.createElement("td");
        setText(nameCell, bathroom.name);
        append(row, nameCell);
        
        const buildingCell = document.createElement("td");
        setText(nameCell, bathroom.name);
        append(row, nameCell);
        
        const floorCell = document.createElement("td");
        setText(floorCell, bathroom.floorName || `Floor ${bathroom.floorNumber}`);
        append(row, floorCell);
        
        const employeeCell = document.createElement("td");
        const assigned = bathroom.assignedEmployeeId
        ? employeeById.get(bathroom.assignedEmployeeId)
        : null;
        setText(employeeCell, assigned ? assigned.name : "Unassigned");
        append(row, employeeCell);
        
        const scoreCell = document.createElement("td");
        setText(scoreCell, `${bathroom.score}`);
        append(row, scoreCell);
        
        const alertCell = document.createElement("td");
        if (bathroom.alerts && bathroom.alerts.length > 0) {
            append(
                alertCell,
                ...bathroom.alerts.map(message => {
                    const pill = document.createElement("span");
                    pill.className = "alert-pill";
                    setText(pill, message);
                    return pill;
                })
            );
        } else {
            setText(alertCell, "—");
            alertCell.style.color = "var(--muted)";
        }
        append(row, alertCell);

        append(selectors.bathroomTableBody, row);
    }
}

function renderManagerOverview() {
    if (!selectors.managerOverview) {
        return;
    }

    clear(selectors.managerOverview);
    const buildings = getAllBuildings();

    if (buildings.length === 0) {
        const message = el("p", { class: "status-helper" }, "Add a building to see performance data.");
        append(selectors.managerOverview, message);
        return;
    }

    const averages = computeLocalBuildingAverages();
    const averageById = new Map(averages.map(summary => [summary.buildingId, summary]));

    for (const building of buildings) {
        const summary = averageById.get(building.id) || {
            buildingId: building.id,
            buildingName: building.name,
            averageScore: 0,
            category: "Clean",
            bathroomCount: 0
        };

        const floorPlan = getFloorPlanForBuilding(building.id);
        const card = el("div", { class: "status-card" });

        const circleClass = `status-circle ${categoryKey(summary.category)}`;
        const scoreText = summary.bathroomCount > 0 ? summary.averageScore : "—";
        append(card, el("div", { class: circleClass }, scoreText));

        const meta = el("div", { class: "status-meta" });
        append(meta, el("strong", {}, summary.buildingName || building.name));

        const bathroomLabel = summary.bathroomCount > 0
            ? `${summary.bathroomCount} bathroom${summary.bathroomCount === 1 ? "" : "s"}`
            : "No bathrooms yet";
        append(meta, el("span", { class: "status-helper" }, bathroomLabel));

        append(meta, el("span", { class: `badge ${categoryKey(summary.category)}` }, summary.category));

        if (floorPlan) {
            append(meta, el("span", { class: "status-helper" }, `Floor plan: ${floorPlan.fileName}`));
        }

        const button = el(
            "button",
            {
                type: "button",
                class: floorPlan ? "secondary-button" : "primary-button",
                "data-floorplan-building": building.id
            },
            floorPlan ? "Edit Floor Plan" : "Add Floor Plan"
        );
        append(meta, button);

        if (!floorPlan) {
            const warning = el(
                "p",
                { class: "error" },
                "No floor plan is uploaded. For best performance and accurate routing, we recommend uploading a floor plan."
            );
            warning.style.margin = "0";
            warning.style.textAlign = "left";
            append(meta, warning);
        }

        append(card, meta);
        append(selectors.managerOverview, card);
    }
}

function renderStaffGrid() {
    if (!selectors.staffGrid) {
        return;
    }
    clear(selectors.staffGrid);
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
        setText(name, employee.name);
        append(info, name);
        
        const meta = document.createElement("div");
        meta.className = "badge-outline";
        setText(meta, `${employee.role} • ${buildingLookup.get(employee.assignedBuildingId) || "Unassigned"}`);
        append(info, meta);

        append(card, info);
        
        const shiftLine = document.createElement("div");
        shiftLine.className = "shift-line";
        
        if (shifts.length === 0) {
            const empty = document.createElement("span");
            empty.className = "shift-item shift-item--empty";
            setText(empty, "No scheduled shifts");
            append(shiftLine, empty);
        } else {
            for (const shift of shifts.slice(0, 4)) {
                const item = document.createElement("span");
                item.className = "shift-item";
                setText(item, `${formatDateRange(shift.startTime, shift.endTime)} • ${getBuildingName(
          shift.buildingId
        )} • Floor ${shift.floorNumber}`);
                append(shiftLine, item);
            }
        }
        
        append(card, shiftLine);

        append(selectors.staffGrid, card);
    }
}

function renderScheduleCards() {
        if (!selectors.scheduleCards) {
        return;
    }
    if (!state.currentUser) {
        clear(selectors.scheduleCards);
        return;
    }
    const userShifts = state.shifts
    .filter(shift => shift.employeeId === state.currentUser.id)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    const visibleShifts = state.showAllShifts ? userShifts : userShifts.slice(0, 3);
    
    clear(selectors.scheduleCards);
    if (visibleShifts.length === 0) {
        const emptyState = document.createElement("p");
        setText(emptyState, "No upcoming shifts assigned.");
        emptyState.style.color = "var(--muted)";
        append(selectors.scheduleCards, emptyState);
        return;
    }
    
    for (const shift of visibleShifts) {
        const card = document.createElement("article");
        card.className = "schedule-card";
        
        const title = document.createElement("h3");
        setText(title, `${getBuildingName(shift.buildingId)} • Floor ${shift.floorNumber}`);
        append(card, title);
        
        const time = document.createElement("time");
        time.dateTime = shift.startTime;
        setText(time, formatDateRange(shift.startTime, shift.endTime));
        append(card, time);

        append(selectors.scheduleCards, card);
    }

    if (selectors.toggleSchedule) {
        setText(selectors.toggleSchedule, state.showAllShifts
        ? "Show Next Three Shifts"
        : "View All Upcoming Shifts");
    }
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

    clear(selectors.janitorStatusSummary);

    if (!state.currentUser) {
        return;
    }

    const bathrooms = getBathroomsForCurrentJanitor();

    if (bathrooms.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "status-empty";
        setText(emptyState, "No restrooms are assigned to your building yet.");
        append(selectors.janitorStatusSummary, emptyState);
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
        setText(circle, data.count);
        circle.setAttribute("aria-hidden", "true");
        append(card, circle)

        const meta = document.createElement("div");
        meta.className = "status-meta";

        const label = document.createElement("span");
        label.className = "status-label";
        setText(label, data.label);
        append(meta, label);

        const count = document.createElement("span");
        count.className = "status-count";
        setText(count, `${data.count} ${data.count === 1 ? "Restroom" : "Restrooms"}`);
        append(meta, count);

        const helper = document.createElement("span");
        helper.className = "status-helper";
        setText(helper, data.helper);
        append(meta, helper);

        append(card, meta);
        append(selectors.janitorStatusSummary, card);
    });
}

async function renderRouteMap() {
    if (!selectors.routeMap) {
        return;
    }
    clear(selectors.routeMap);
    delete selectors.routeMap.dataset.error;

    if (!state.currentUser || !selectors.routeFloorSelect) {
        return;
    }
    const floorValue = selectors.routeFloorSelect.value;
    if (!floorValue) {
        append(selectors.routeMap, el("p", {}, "Select your current floor to load priorities."));
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
            append(selectors.routeMap, el("p", {}, "No bathrooms require service on this floor."));
            return;
        }
        
        bathrooms.forEach((bathroom, index) => {
            const node = document.createElement("div");
            node.className = "route-node";
            
            const circle = document.createElement("div");
            circle.className = `route-circle status-${categoryKey(bathroom.category)}`;
            
            const number = document.createElement("span");
            number.className = "route-number";
            setText(number, index + 1);
            append(circle, number);
            
            const hazard = hazardFromAlerts(bathroom.alerts);
            if (hazard) {
                const hazardBadge = document.createElement("span");
                hazardBadge.className = "route-hazard";
                clear(hazardBadge);
                append(hazardBadge, el("span", { class: "material-symbol" }, "warning"));
                hazardBadge.title = hazard.detail;
                append(circle, hazardBadge);
            }
            
            const label = document.createElement("div");
            label.className = "route-label";
            
            const name = document.createElement("strong");
            setText(name, bathroom.name);
            append(label, name);
            
            const score = document.createElement("span");
            setText(score, `Score: ${bathroom.score}`);
            append(label, score);
            
            if (bathroom.alerts && bathroom.alerts.length > 0) {
                const alerts = document.createElement("span");
                alerts.className = "route-alert";
                setText(alerts, bathroom.alerts.join(" • "));
                append(label, alerts);
            }
            
            append(node, circle, label);
            append(selectors.routeMap, node);
        });
    } catch (error) {
        append(selectors.routeMap, el("p", { class: "error" }, `Unable to load route: ${error.message}`));
        selectors.routeMap.dataset.error = "true";
    }
}

function renderRestroomList() {
    if (!selectors.restroomList) {
        return;
    }
        clear(selectors.restroomList);
    if (!state.currentUser || !selectors.restroomFloorSelect) {
        return;
    }
    
    const floorValue = selectors.restroomFloorSelect.value;
    if (!floorValue) {
        append(selectors.restroomList, el("p", {}, "Select a floor to view restrooms."));
        return;
    }
    
    const bathrooms = getAllBathrooms().filter(
                                               bathroom =>
                                               bathroom.buildingId === state.currentUser.assignedBuildingId &&
                                               String(bathroom.floorNumber) === floorValue
                                               );
    
    if (bathrooms.length === 0) {
        append(selectors.restroomList, el("p", {}, "No restrooms registered on this floor."));
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
        setText(title, bathroom.name);
        title.style.margin = "0";
        append(header, title);
        
        const badge = document.createElement("span");
        badge.className = `badge status-badge ${categoryKey(bathroom.category)}`;
        setText(badge, bathroom.category);
        append(header, badge);
        append(card, header);
        
        const score = document.createElement("p");
        setText(score, `Cleanliness Score: ${bathroom.score}`);
        score.style.margin = "0";
        append(card, score);
        
        if (bathroom.alerts.length > 0) {
            const alerts = document.createElement("div");
            append(
                alerts,
                ...bathroom.alerts.map(message => {
                    const pill = document.createElement("span");
                    pill.className = "alert-pill";
                    setText(pill, message);
                    return pill;
                })
            );
            append(card, alerts);
        }
        
        const button = document.createElement("button");
        button.className = "primary-button";
        setText(button, "Mark As Cleaned");
        button.addEventListener("click", () => markRestroomClean(bathroom));
        append(card, button);

        append(selectors.restroomList, card);
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
        renderManagerOverview();
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
        renderManagerOverview();
        if (selectors.routeMap && selectors.routeMap.dataset.error !== "true") {
            renderRouteMap();
        }
    } catch (error) {
        alert(`Unable to reset restroom: ${error.message}`);
    }
}

function updateProfileDetails() {
        if (!selectors.profileEmail) {
        return;
    }
    if (!state.currentUser) {
        setText(selectors.profileEmail, "");
        return;
    }
    setText(selectors.profileEmail, state.currentUser.email);
}

function updateRouteFloorOptions() {
    if (!selectors.routeFloorSelect || !selectors.restroomFloorSelect) {
        return;
    }

    clear(selectors.routeFloorSelect);
    clear(selectors.restroomFloorSelect);
    append(selectors.routeFloorSelect, el("option", { value: "" }, "Select Floor"));
    append(selectors.restroomFloorSelect, el("option", { value: "" }, "Select Floor"));
    
    if (!state.currentUser) {
        return;
    }
    
    const floors = getFloorsForBuilding(state.currentUser.assignedBuildingId);
    floors.forEach(floor => {
        const option = el("option", { value: String(floor.number) }, floor.name);
        append(selectors.routeFloorSelect, option.cloneNode(true));
        append(selectors.restroomFloorSelect, option);
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
    renderManagerOverview();
    updateSetupFlow();
}

function setRoleView(role) {
        if (!selectors.managerView || !selectors.janitorView || !selectors.roleTabs) {
        return;
    }
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
        if (!selectors.scheduleModal) {
        return;
    }
    selectors.scheduleModal.classList.remove("hidden");
}

function closeScheduleModal() {
    if (selectors.scheduleModal) {
        selectors.scheduleModal.classList.add("hidden");
    }
    if (selectors.addShiftForm) {
        selectors.addShiftForm.reset();
    }
    populateShiftModalDefaults();
}

function toggleStallsField() {
    if (!selectors.bathroomStallsField) {
        return;
    }
    const type = selectors.bathroomTypeSelect ? selectors.bathroomTypeSelect.value : "";
    const show = type === "multi-stall";
    selectors.bathroomStallsField.classList.toggle("hidden", !show);

    const input = selectors.bathroomStallsField.querySelector("input");
    if (input) {
        if (show) {
            input.required = true;
        } else {
            input.required = false;
            input.value = "";
            input.setCustomValidity("");
        }
    }
}

function promptForFloorPlanUpload(buildingId) {
    if (!buildingId) {
        return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";

    input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) {
            return;
        }

        const fileName = file.name || `Floor Plan ${state.floorPlans.length + 1}`;
        const existingIndex = state.floorPlans.findIndex(plan => plan.buildingId === buildingId);

        if (existingIndex >= 0) {
            const current = state.floorPlans[existingIndex];
            state.floorPlans[existingIndex] = { ...current, fileName };
        } else {
            state.floorPlans.push({
                id: `floorplan-${Date.now()}`,
                buildingId,
                fileName
            });
        }

        renderManagerOverview();
    });

    input.click();
}

function registerEventListeners() {
    if (selectors.roleTabs) {
        selectors.roleTabs.addEventListener("click", handleRoleTabClick);
    }

    if (selectors.filterBuilding) {
        selectors.filterBuilding.addEventListener("change", () => {
            populateFilterFloors();
            renderBathroomTable();
        });
    }
    if (selectors.filterFloor) {
        selectors.filterFloor.addEventListener("change", renderBathroomTable);
    }
    if (selectors.filterEmployee) {
        selectors.filterEmployee.addEventListener("change", renderBathroomTable);
    }
    if (selectors.filterStatus) {
        selectors.filterStatus.addEventListener("change", renderBathroomTable);
    }

    if (selectors.toggleSchedule) {
        selectors.toggleSchedule.addEventListener("click", () => {
            state.showAllShifts = !state.showAllShifts;
            renderScheduleCards();
        });
    }

    if (selectors.refreshRoute) {
        selectors.refreshRoute.addEventListener("click", renderRouteMap);
    }
    if (selectors.routeFloorSelect) {
        selectors.routeFloorSelect.addEventListener("change", renderRouteMap);
    }
    if (selectors.restroomFloorSelect) {
        selectors.restroomFloorSelect.addEventListener("change", renderRestroomList);
    }

    if (selectors.profileButton) {
        selectors.profileButton.addEventListener("click", () => {
            if (selectors.profilePopover) {
                selectors.profilePopover.classList.toggle("hidden");
            }
        });
    }
    
    document.addEventListener("click", event => {
                if (!selectors.profilePopover || !selectors.profileButton) {
            return;
        }
        if (
            !selectors.profilePopover.contains(event.target) &&
            !selectors.profileButton.contains(event.target)
        ) {
            closeProfilePopover();
            }
        });

    if (selectors.logoutButton && selectors.app && selectors.loginScreen) {
        selectors.logoutButton.addEventListener("click", () => {
            state.currentUser = null;
            state.showAllShifts = false;
            selectors.app.classList.add("hidden");
            selectors.loginScreen.classList.remove("hidden");
            closeProfilePopover();
            renderJanitorSummary();
        });
    }

       if (selectors.bathroomTypeSelect) {
        selectors.bathroomTypeSelect.addEventListener("change", toggleStallsField);
    }

    if (selectors.managerOverview) {
        selectors.managerOverview.addEventListener("click", event => {
            const button = event.target.closest("[data-floorplan-building]");
            if (!button) {
                return;
            }
            const buildingId = button.getAttribute("data-floorplan-building");
            promptForFloorPlanUpload(buildingId);
        });
    }

    if (selectors.addEmployeeForm) {
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
            renderManagerOverview();
        });
    }

    if (selectors.addBuildingForm) {
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
            renderManagerOverview();
        });
    }
    
        if (selectors.addBathroomForm) {
        selectors.addBathroomForm.addEventListener("submit", event => {
            event.preventDefault();
            const formData = new FormData(selectors.addBathroomForm);
            const buildingId = formData.get("building");
            const floor = Number(formData.get("floor"));
            const name = formData.get("name").trim();
            const type = formData.get("type");
            const sensor = formData.get("sensor").trim();
            const stallsInput = formData.get("stalls");
            const parsedStalls = Number(stallsInput);

            if (!buildingId || Number.isNaN(floor) || !name) {
                return;
            }

            if (type === "multi-stall") {
                const stallsFieldInput = selectors.bathroomStallsField
                ? selectors.bathroomStallsField.querySelector("input")
                : null;
                const validStalls = Number.isInteger(parsedStalls) && parsedStalls >= 1;
                if (!validStalls) {
                    if (stallsFieldInput) {
                        stallsFieldInput.setCustomValidity("Please enter a stall count of at least 1.");
                        stallsFieldInput.reportValidity();
                        stallsFieldInput.setCustomValidity("");
                        stallsFieldInput.focus();
                    }
                    return;
                }
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
                stalls: type === "multi-stall" ? Math.max(1, Math.floor(parsedStalls)) : null,
                lowPaperStalls: type === "multi-stall" ? 0 : null,
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
            toggleStallsField();
            renderManagerOverview();
        });
    }
    toggleStallsField();
    if (selectors.editScheduleButton) {
        selectors.editScheduleButton.addEventListener("click", openScheduleModal);
    }
    if (selectors.addShiftButton) {
        selectors.addShiftButton.addEventListener("click", openScheduleModal);
    }
    if (selectors.closeScheduleModal) {
        selectors.closeScheduleModal.addEventListener("click", closeScheduleModal);
    }
    if (selectors.scheduleModal) {
        selectors.scheduleModal.addEventListener("click", event => {
            if (event.target === selectors.scheduleModal) {
                closeScheduleModal();
            }
        });
    }

    if (selectors.addShiftForm) {
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

    if (selectors.loginForm) {
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
                if (selectors.loginScreen) {
                    selectors.loginScreen.classList.add("hidden");
                }
                if (selectors.app) {
                    selectors.app.classList.remove("hidden");
                }
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
    }
}

async function init() {
    try {
        await initializeData();
        populateEmployeeFilters();
        renderBathroomTable();
        renderStaffGrid();
    } catch (error) {
        console.warn("Bootstrap failed", error);
    }
    registerEventListeners();
}

ready(() => {
    initializeDomReferences();
    init().catch(error => console.error("Init failed", error));
});
