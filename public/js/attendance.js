const user = checkAuth();
displayUserInfo();
updateNavigation();

/* ------------------ TAB FUNCTION ------------------ */
function showTab(tabId) {
  const tabs = [
    "attendanceTab",
    "leaveTab",
    "leaveAdminTab",
    "employeeTab",
    "compTab",
    "compAdminTab",
  ];
  tabs.forEach((id) => (document.getElementById(id).style.display = "none"));
  document.getElementById(tabId).style.display = "block";

  if (tabId === "employeeTab") loadEmployeesTable();
  if (tabId === "attendanceTab") loadAttendance();
  if (tabId === "leaveTab") loadLeaveEmployeeRequests();
  if (tabId === "leaveAdminTab") loadLeaveRequests();
  if (tabId === "compTab") loadMyCompRequests();
  if (tabId === "compAdminTab") loadCompRequests();
}

function showButton() {
  if (user.role === "employee") {
    document.getElementById("leaveAdminBtn").style.display = "none";
    document.getElementById("employeeBtn").style.display = "none";
    document.getElementById("compAdminBtn").style.display = "none";
  } else if (user.role === "admin") {
    document.getElementById("leaveBtn").style.display = "none"; // if admin shouldn't apply leave
    document.getElementById("compBtn").style.display = "none"; // if admin shouldn't apply comp leave
  }
}
showButton();
/* ------------------ ELEMENTS ------------------ */
const attendanceUserSelect = document.getElementById("attendanceUserSelect");
const leaveUserSelect = document.getElementById("leaveUserSelect");
const compUserSelect = document.getElementById("compUserSelect");
const currentTime = document.getElementById("currentTime");
const checkinBtn = document.getElementById("checkinBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const attendanceBody = document.getElementById("attendanceBody");
const employeeTableBody = document.getElementById("employeeTableBody");
const leaveRequestsBody = document.getElementById("leaveRequestsBody");
const leaveRequests = document.getElementById("leaveRequests");
const compRequestsBody = document.getElementById("compRequestsBody");
const compRequests = document.getElementById("compRequests");

let attendanceselectedUser = attendanceUserSelect.value;
let leaveselectedUser = leaveUserSelect.value;
let compselectedUser = compUserSelect.value;
let employeeList = [];

/* ------------------ CURRENT TIME ------------------ */
setInterval(() => {
  const now = new Date();
  currentTime.textContent = now.toLocaleString();
}, 1000);

async function getCityName(latitude, longitude) {
  const apiKey = "0adf6691926d4db6a7661f859117c796"; // OpenCage API Key
  const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C+${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status.code == 200 && data.results.length > 0) {
      // Find the city name from the address components
      const townComponent = data.results[0].components.town;
      const stateComponent = data.results[0].components.state;
      const cityComponent = data.results[0].components.country;
      if (cityComponent) {
        return (
          townComponent +
          (stateComponent ? ", " + stateComponent : "") +
          (cityComponent ? ", " + cityComponent : "")
        );
      } else {
        return "City not found";
      }
    } else {
      return "Reverse geocoding failed or no results found.";
    }
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return "Error fetching city name.";
  }
}

function updateAttendanceButtons() {
  const employeeId = attendanceUserSelect.value;
  fetch(`/api/attendance/${employeeId}`)
    .then((res) => res.json())
    .then((data) => {
      // Find today's record
      const today = new Date().toLocaleDateString();
      const todayRecord = data.find(
        (a) => new Date(a.check_in).toLocaleDateString() === today
      );

      if (!todayRecord) {
        checkinBtn.disabled = false;
        checkoutBtn.disabled = true;
      } else if (todayRecord && !todayRecord.check_out) {
        checkinBtn.disabled = true;
        checkoutBtn.disabled = false;
      } else {
        checkinBtn.disabled = true;
        checkoutBtn.disabled = true;
      }
    });
}
/* ------------------ LOAD EMPLOYEES ------------------ */
function loadEmployees() {
  fetch("/api/users")
    .then((res) => res.json())
    .then((users) => {
      employeeList = users;

      // Populate Attendance Dropdown
      attendanceUserSelect.innerHTML =
        '<option value="">Select Employee</option>';
      users.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        attendanceUserSelect.appendChild(opt);
      });

      // Populate Leave Dropdown
      leaveUserSelect.innerHTML = '<option value="">Select Employee</option>';
      users.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        leaveUserSelect.appendChild(opt);
      });
      // Populate Compensatory Dropdown
      compUserSelect.innerHTML = "";
      users.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        compUserSelect.appendChild(opt);
      });

      loadAttendance();
      updateAttendanceButtons();
    });
}

attendanceUserSelect.addEventListener("change", () => {
  attendanceselectedUser = attendanceUserSelect.value;
  loadAttendance();
  updateAttendanceButtons();
});

// Event listener for leave dropdown
leaveUserSelect.addEventListener("change", () => {
  leaveselectedUser = leaveUserSelect.value;
  loadLeaveEmployeeRequests();
});

compUserSelect.addEventListener("change", () => {
  compSelectedUser = compUserSelect.value;
  loadCompRequests();
  loadMyCompRequests();
});

loadEmployees();
loadAttendance();
updateAttendanceButtons();

/* ------------------ ATTENDANCE ------------------ */
checkinBtn.addEventListener("click", () => {
  const employeeId = attendanceUserSelect.value;
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
    })
      .then((res) => res.json())
      .then((r) => {
        alert(r.message);
        checkinBtn.disabled = true;
        checkoutBtn.disabled = false;
        loadAttendance();
        updateAttendanceButtons();
      });
  });
});

checkoutBtn.addEventListener("click", () => {
  const employeeId = attendanceUserSelect.value;
  fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id: employeeId }),
  })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      checkinBtn.disabled = false;
      checkoutBtn.disabled = true;
      loadAttendance();
      updateAttendanceButtons();
    });
});

async function loadAttendance() {
  const employeeId = Number(attendanceUserSelect.value); // convert to number

  const res = await fetch(`/api/attendance/${employeeId}`);
  const attendance = await res.json();

  if (!Array.isArray(attendance)) {
    console.error("Invalid response:", attendance);
    return;
  }
  attendanceBody.innerHTML = "";

  let filteredAttendance = [];

  if (user.role === "employee") {
    filteredAttendance = attendance.filter((a) => a.employee_id === user.id);
  } else if (user.role === "admin") {
    filteredAttendance = employeeId
      ? attendance.filter((a) => a.employee_id === user.id)
      : attendance;
  }

  const location =
    filteredAttendance.length > 0
      ? await getCityName(
          filteredAttendance[0].latitude,
          filteredAttendance[0].longitude
        )
      : "-";

  filteredAttendance.forEach((a) => {
    const date = new Date(a.check_in).toLocaleDateString();
    const checkInTime = a.check_in ? new Date(a.check_in) : null;
    const checkOutTime = a.check_out ? new Date(a.check_out) : null;
    const checkIn = checkInTime
      ? checkInTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })
      : "-";
    const checkOut = checkOutTime
      ? checkOutTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })
      : "-";

    let workedMinutes = a.worked_minutes || 0;
    if (
      (!workedMinutes || workedMinutes === null) &&
      checkInTime &&
      checkOutTime
    ) {
      workedMinutes = Math.floor((checkOutTime - checkInTime) / 60000);
    }

    const hours = Math.floor(workedMinutes / 60);
    const minutes = workedMinutes % 60;
    const duration = `${hours}h ${minutes}m`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${date}</td>
      <td>${checkIn}</td>
      <td>${checkOut}</td>
      <td>${location}</td>
      <td>${duration}</td>
    `;
    attendanceBody.appendChild(tr);
  });
}

/* ------------------ LEAVE APPLY ------------------ */
const applyLeaveBtn = document.getElementById("applyLeaveBtn");
applyLeaveBtn.addEventListener("click", () => {
  if (user.role !== "employee") {
    alert("Only employees can apply leave");
    return;
  }

  const selectedEmp = leaveUserSelect.selectedOptions[0];

  const leaveData = {
    employee_id: Number(selectedEmp.value),
    name: selectedEmp.textContent,
    leave_type: document.getElementById("leaveType").value,
    start_date: document.getElementById("startDate").value,
    end_date: document.getElementById("endDate").value,
    reason: document.getElementById("leaveReason").value,
  };
  fetch("/api/leave/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leaveData),
  })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      document.getElementById("leaveReason").value = "";
    });
});

/* ------------------ LEAVE ADMIN ------------------ */
function loadLeaveRequests() {
  if (user.role !== "admin") return;

  fetch("/api/leave/requests")
    .then((res) => res.json())
    .then((data) => {
      const requests = Array.isArray(data) ? data : [];
      leaveRequestsBody.innerHTML = "";

      if (!data || data.length === 0) {
        leaveRequestsBody.innerHTML = `<tr><td colspan="7">No leave requests found</td></tr>`;
        return;
      }

      requests.forEach((r) => {
        const tr = document.createElement("tr");

        const startDate = new Date(r.start_date).toLocaleDateString();
        const endDate = new Date(r.end_date).toLocaleDateString();

        const isDisabled = r.status && r.status !== "Pending";
        tr.innerHTML = `
          <td>${r.name}</td>
          <td>${r.leave_type}</td>
          <td>${startDate}</td>
          <td>${endDate}</td>
          <td>${r.reason}</td>
          <td>${r.status || "Pending"}</td>
          <td>
            <button class="btn btn-success" 
              onclick="updateLeave('${r.id}','Approved', this)" 
              ${isDisabled ? "disabled" : ""}>Approve</button>
            <button class="btn btn-danger" 
              onclick="updateLeave('${r.id}','Rejected', this)" 
              ${isDisabled ? "disabled" : ""}>Reject</button>
          </td>
        `;
        leaveRequestsBody.appendChild(tr);
      });
    })
    .catch((err) => console.error("Error fetching leave requests:", err));
}

function updateLeave(id, status, btn) {
  fetch("/api/leave/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leave_id: id, status }),
  })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      // Disable both buttons in the same row
      const row = btn.closest("tr");
      const buttons = row.querySelectorAll("button");
      buttons.forEach((b) => (b.disabled = true));

      // Update the status cell visually
      row.querySelector("td:nth-child(6)").textContent = status;
      loadLeaveRequests();
    })
    .catch((err) => console.error("Error updating leave:", err));
}

function loadLeaveEmployeeRequests() {
  fetch(`/api/leave/requests`) // ✅ use user.id
    .then((res) => res.json())
    .then((data) => {
      const requests = Array.isArray(data) ? data : [];
      leaveRequests.innerHTML = "";

      if (!data || data.length === 0) {
        leaveRequests.innerHTML = `<tr><td colspan="6">No leave requests found</td></tr>`;
        return;
      }

      requests.forEach((r) => {
        const tr = document.createElement("tr");
        const startDate = new Date(r.start_date).toLocaleDateString();
        const endDate = new Date(r.end_date).toLocaleDateString();

        tr.innerHTML = `
          <td>${r.name}</td>
          <td>${r.leave_type}</td>
          <td>${startDate}</td>
          <td>${endDate}</td>
          <td>${r.reason}</td>
          <td>${r.status || "Pending"}</td>
          <td>${r.approved_by || "-"}</td>
        `;
        leaveRequests.appendChild(tr);
      });
    })
    .catch((err) => console.error("Error fetching leave requests:", err));
}
function populateEmployeeDropdowns() {
  const selects = [leaveUserSelect, attendanceUserSelect, compUserSelect];
  selects.forEach((sel) => {
    if (sel) {
      const opt = document.createElement("option");
      opt.value = user.id;
      opt.textContent = user.name;
      sel.appendChild(opt);
    }
  });
}
/* ------------------ EMPLOYEE MANAGEMENT ------------------ */
function loadEmployeesTable() {
  employeeTableBody.innerHTML = "";
  employeeList.forEach((emp) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.name}</td>
      <td>
        <button class="btn btn-info" onclick="editEmployee(${emp.id},'${emp.name}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteEmployee(${emp.id})">Delete</button>
      </td>
    `;
    employeeTableBody.appendChild(tr);
  });
}

document.getElementById("addEmployeeBtn").addEventListener("click", () => {
  const name = document.getElementById("newEmployeeName").value;
  if (!name) return alert("Enter employee name");
  fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      document.getElementById("newEmployeeName").value = "";
      loadEmployees();
    });
});

function editEmployee(id, oldName) {
  const newName = prompt("Edit employee name", oldName);
  if (!newName) return;
  fetch(`/api/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      loadEmployees();
    });
}

function deleteEmployee(id) {
  if (!confirm("Are you sure you want to delete this employee?")) return;
  fetch(`/api/employees/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      loadEmployees();
    });
}

async function submitCompRequest(e) {
  e.preventDefault();

  const work_date = document.getElementById("workDate").value;
  const requested_date = document.getElementById("requestedDate").value;
  const reason = document.getElementById("compReason").value;
  const selectedCompEmp = compUserSelect.selectedOptions[0];
  const res = await fetch("/api/compensatory/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: selectedCompEmp.value,
      work_date,
      requested_date,
      reason,
    }),
  });

  const data = await res.json();
  alert(data.message);
  loadMyCompRequests();
}

document
  .getElementById("submitCompRequest")
  .addEventListener("click", submitCompRequest);

async function loadMyCompRequests() {
  const selectedCompEmp = compUserSelect.selectedOptions[0];
  const valueCompEmp = compUserSelect.value;
  const res = await fetch(`/api/compensatory/mine/${valueCompEmp}`);
  const data = await res.json();

  const tbody = document.getElementById("compRequestsBody");
  tbody.innerHTML = "";

  if (data.success) {
    data.data.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${selectedCompEmp.textContent}</td>
        <td>${new Date(r.work_date).toLocaleDateString()}</td>
        <td>${new Date(r.requested_date).toLocaleDateString()}</td>
        <td>${r.reason}</td>
        <td>${r.status}</td>
        <td>${r.approved_by || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Load all compensatory requests for admin
async function loadCompRequests() {
  if (user.role !== "admin") return;
  const res = await fetch("/api/compensatory/requests");
  const { success, data } = await res.json();

  compRequestsBody.innerHTML = "";
  const selectedCompEmp = compUserSelect.selectedOptions[0];
  if (success && Array.isArray(data)) {
    data.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${selectedCompEmp.textContent}</td>
        <td>${new Date(r.work_date).toLocaleDateString()}</td>
        <td>${new Date(r.requested_date).toLocaleDateString()}</td>
        <td>${r.reason}</td>
        <td>${r.status}</td>
        <td>
          <button class="btn btn-success" onclick="updateCompensatory('${
            r.id
          }', 'Approved', this)" ${
        r.status !== "Pending" ? "disabled" : ""
      }>Approve</button>
          <button class="btn btn-danger" onclick="updateCompensatory('${
            r.id
          }', 'Rejected', this)" ${
        r.status !== "Pending" ? "disabled" : ""
      }>Reject</button>
        </td>
      `;
      compRequestsBody.appendChild(tr);
    });
  }
}

function updateCompensatory(id, status, btn) {
  fetch(`/api/compensatory/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, status }),
  })
    .then((res) => res.json())
    .then((r) => {
      alert(r.message);
      // Disable both buttons in the same row
      const row = btn.closest("tr");
      const buttons = row.querySelectorAll("button");
      buttons.forEach((b) => (b.disabled = true));

      // Update the status cell visually
      row.querySelector("td:nth-child(6)").textContent = status;
      loadCompRequests();
    })
    .catch((err) => console.error("Error updating compensatory:", err));
}

loadEmployees();
loadAttendance();
loadLeaveRequests();
updateAttendanceButtons();
loadLeaveEmployeeRequests();
populateEmployeeDropdowns();
loadMyCompRequests();
