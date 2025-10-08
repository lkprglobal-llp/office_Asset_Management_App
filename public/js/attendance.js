const user = checkAuth();
displayUserInfo();
updateNavigation();

/* ------------------ TAB FUNCTION ------------------ */
function showTab(tabId) {
  const tabs = ["attendanceTab", "leaveTab", "leaveAdminTab", "employeeTab"];
  tabs.forEach((id) => (document.getElementById(id).style.display = "none"));
  document.getElementById(tabId).style.display = "block";
}

function showButton() {
  if (user.role === "employee") {
    document.getElementById("leaveAdminBtn").style.display = "none";
    document.getElementById("employeeBtn").style.display = "none";
  } else if (user.role === "admin") {
    document.getElementById("leaveBtn").style.display = "none"; // if admin shouldn't apply leave
  }
}
showButton();
/* ------------------ ELEMENTS ------------------ */
const attendanceUserSelect = document.getElementById("attendanceUserSelect");
const leaveUserSelect = document.getElementById("leaveUserSelect");
const currentTime = document.getElementById("currentTime");
const checkinBtn = document.getElementById("checkinBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const attendanceBody = document.getElementById("attendanceBody");
const employeeTableBody = document.getElementById("employeeTableBody");
const leaveRequestsBody = document.getElementById("leaveRequestsBody");

let attendanceselectedUser = attendanceUserSelect.value;
let leaveselectedUser = leaveUserSelect.value;
let employeeList = [];

/* ------------------ CURRENT TIME ------------------ */
setInterval(() => {
  const now = new Date();
  currentTime.textContent = now.toLocaleString();
}, 1000);

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
      attendanceUserSelect.innerHTML = "";
      users.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        attendanceUserSelect.appendChild(opt);
      });

      // Populate Leave Dropdown
      leaveUserSelect.innerHTML = "";
      users.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        leaveUserSelect.appendChild(opt);
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
leaveUserSelect?.addEventListener("change", () => {
  leaveselectedUser = leaveUserSelect.value;
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
  const employeeId = attendanceUserSelect.value;

  const res = await fetch(`/api/attendance/${employeeId}`); // ✅ use user.id
  const attendance = await res.json();

  if (!Array.isArray(attendance)) {
    console.error("Invalid response:", attendance);
    return;
  }

  attendanceBody.innerHTML = "";
  attendance.forEach((a) => {
    const date = new Date(a.check_in).toLocaleDateString();
    const checkIn = a.check_in ? new Date(a.check_in).toLocaleString() : "-";
    const checkOut = a.check_out ? new Date(a.check_out).toLocaleString() : "-";
    const workedMinutes = a.worked_minutes || 0;
    if (
      (workedMinutes === null || workedMinutes === undefined) &&
      checkIn &&
      checkOut
    ) {
      workedMinutes = Math.floor((checkOut - checkIn) / 60000);
    }
    const hours = Math.floor(workedMinutes / 60);
    const minutes = workedMinutes % 60;
    const duration = `${hours}h ${minutes}m`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${date}</td>
        <td>${checkIn}</td>
        <td>${checkOut}</td>
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

loadEmployees();
loadAttendance();
loadLeaveRequests();
updateAttendanceButtons();
