// const user = checkAuth();
// displayUserInfo();
// updateNavigation();

// let allBorrowings = [];
// let allExpenses = [];
// let allAttendance = [];

// async function loadBorrowingsReport() {
//   try {
//     const response = await fetch("/api/borrowings");
//     allBorrowings = await response.json();
//     filterBorrowings();
//   } catch (error) {
//     console.error("Error loading borrowings:", error);
//   }
// }

// function filterBorrowings() {
//   const filterValue = document.getElementById("borrowStatusFilter").value;
//   let filteredBorrowings = allBorrowings;

//   if (filterValue !== "all") {
//     const now = new Date();
//     filteredBorrowings = allBorrowings.filter((b) => {
//       if (filterValue === "Borrowed") {
//         return b.status === "Borrowed";
//       } else if (filterValue === "Returned") {
//         return b.status === "Returned";
//       } else if (filterValue === "Overdue") {
//         const dueDate = new Date(b.due_date);
//         return b.status === "Borrowed" && now > dueDate;
//       }
//       return true;
//     });
//   }

//   const tbody = document.getElementById("borrowingsReportTableBody");

//   if (filteredBorrowings.length === 0) {
//     tbody.innerHTML =
//       '<tr><td colspan="6" style="text-align: center;">No borrowing records</td></tr>';
//     return;
//   }

//   tbody.innerHTML = "";

//   filteredBorrowings.forEach((b) => {
//     const now = new Date();
//     const dueDate = new Date(b.due_date);
//     const isOverdue = b.status === "Borrowed" && now > dueDate;
//     const statusClass =
//       b.status === "Returned"
//         ? "status-returned"
//         : isOverdue
//         ? "status-overdue"
//         : "status-borrowed";
//     const statusText =
//       b.status === "Returned" ? "Returned" : isOverdue ? "Overdue" : "Borrowed";

//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${b.asset_name}</td>
//       <td>${b.borrower_name}</td>
//       <td>${formatDateTime(b.borrow_date)}</td>
//       <td>${formatDateTime(b.due_date)}</td>
//       <td>${b.returned_date ? formatDateTime(b.returned_date) : "-"}</td>
//       <td><span class="status-badge ${statusClass}">${statusText}</span></td>
//     `;
//     tbody.appendChild(tr);
//   });
// }

// async function loadExpensesReport() {
//   try {
//     const response = await fetch("/api/allexpenses");
//     allExpenses = await response.json();
//     filterExpenseReport();
//     calculateExpenseSummary();
//   } catch (error) {
//     console.error("Error loading expenses:", error);
//   }
// }

// // async function filterExpenseReport() {
// //   const res = await fetch("/api/expensesTypes");
// //   const types = await res.json();

// //   const typeFilter = document.getElementById("expenseTypeFilter").value;
// //   typeFilter.innerHTML = '<option value="">Select Type</option>';
// //   types.forEach((t) => {
// //     typeFilter.innerHTML += `<option value="${t.type_name}">${t.type_name} - <b>${t.type_code}</b></option>`;
// //   });

// //   const statusFilter = document.getElementById("expenseStatusFilter").value;

// //   let filteredExpenses = allExpenses;

// //   if (statusFilter !== "all") {
// //     filteredExpenses = filteredExpenses.filter(
// //       (e) => e.status === statusFilter
// //     );
// //   }

// //   if (typeFilter !== "all") {
// //     filteredExpenses = filteredExpenses.filter((e) => e.type === typeFilter);
// //   }

// //   const tbody = document.getElementById("expensesReportTableBody");

// //   if (filteredExpenses.length === 0) {
// //     tbody.innerHTML =
// //       '<tr><td colspan="7" style="text-align: center;">No expense records</td></tr>';
// //     return;
// //   }

// //   tbody.innerHTML = "";

// //   filteredExpenses.forEach((e) => {
// //     const statusClass =
// //       e.status === "Approved"
// //         ? "status-approved"
// //         : e.status === "Rejected"
// //         ? "status-rejected"
// //         : "status-pending";
// //     const paymentClass =
// //       e.payment_status === "Paid" ? "status-paid" : "status-unpaid";

// //     const tr = document.createElement("tr");
// //     tr.innerHTML = `
// //       <td>${formatDate(e.date)}</td>
// //       <td>${e.employee_name}</td>
// //       <td>${e.type}</td>
// //       <td>${e.invoiceNumber}</td>
// //       <td>₹${parseFloat(e.amount).toFixed(2)}</td>
// //       <td>${e.description}</td>
// //       <td><span class="status-badge ${statusClass}">${e.status}</span></td>
// //       <td><span class="status-badge ${paymentClass}">${
// //       e.payment_status || "Pending Payment"
// //     }</span></td>
// //     `;
// //     tbody.appendChild(tr);
// //   });

// //   calculateExpenseSummary();
// // }

// function populateExpenseTypeDropdown() {
//   const typeFilter = document.getElementById("expenseTypeFilter");
//   typeFilter.innerHTML = '<option value="all">All Types</option>';

//   expenseTypes.forEach((t) => {
//     const option = document.createElement("option");
//     option.value = t.type_name;
//     option.textContent = `${t.type_name} (${t.type_code})`;
//     typeFilter.appendChild(option);
//   });

//   // Refilter on change
//   typeFilter.addEventListener("change", filterExpenseReport);
//   document
//     .getElementById("expenseStatusFilter")
//     .addEventListener("change", filterExpenseReport);
// }

// function filterExpenseReport() {
//   const typeValue = document.getElementById("expenseTypeFilter").value;
//   const statusValue = document.getElementById("expenseStatusFilter").value;

//   let filteredExpenses = [...allExpenses];

//   if (statusValue !== "all") {
//     filteredExpenses = filteredExpenses.filter((e) => e.status === statusValue);
//   }
//   if (typeValue !== "all") {
//     filteredExpenses = filteredExpenses.filter((e) => e.type === typeValue);
//   }

//   renderExpenseTable(filteredExpenses);
//   calculateExpenseSummary(filteredExpenses);
// }

// function renderExpenseTable(filteredExpenses) {
//   const tbody = document.getElementById("expensesReportTableBody");

//   if (filteredExpenses.length === 0) {
//     tbody.innerHTML =
//       '<tr><td colspan="8" style="text-align: center;">No expense records</td></tr>';
//     return;
//   }

//   tbody.innerHTML = "";

//   filteredExpenses.forEach((e) => {
//     const statusClass =
//       e.status === "Approved"
//         ? "status-approved"
//         : e.status === "Rejected"
//         ? "status-rejected"
//         : "status-pending";

//     const paymentClass =
//       e.payment_status === "Paid" ? "status-paid" : "status-unpaid";

//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${formatDate(e.date)}</td>
//       <td>${e.employee_name}</td>
//       <td>${e.type}</td>
//       <td>${e.invoiceNumber || "-"}</td>
//       <td>₹${parseFloat(e.amount).toFixed(2)}</td>
//       <td>${e.description}</td>
//       <td><span class="status-badge ${statusClass}">${e.status}</span></td>
//       <td><span class="status-badge ${paymentClass}">${
//       e.payment_status || "Pending Payment"
//     }</span></td>
//     `;
//     tbody.appendChild(tr);
//   });
// }

// function calculateExpenseSummary(expenses) {
//   const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
//   const approved = expenses
//     .filter((e) => e.status === "Approved")
//     .reduce((sum, e) => sum + parseFloat(e.amount), 0);
//   const pending = expenses
//     .filter((e) => e.status === "Pending")
//     .reduce((sum, e) => sum + parseFloat(e.amount), 0);

//   document.getElementById("totalExpenses").textContent = total.toFixed(2);
//   document.getElementById("approvedExpenses").textContent = approved.toFixed(2);
//   document.getElementById("pendingExpenses").textContent = pending.toFixed(2);
// }

// function exportBorrowings() {
//   if (allBorrowings.length === 0) {
//     showNotification("No borrowings data to export", "error");
//     return;
//   }

//   const data = allBorrowings.map((b) => {
//     const now = new Date();
//     const dueDate = new Date(b.due_date);
//     const isOverdue = b.status === "Borrowed" && now > dueDate;
//     const status =
//       b.status === "Returned" ? "Returned" : isOverdue ? "Overdue" : "Borrowed";

//     return {
//       "Asset Name": b.asset_name,
//       Borrower: b.borrower_name,
//       "Borrowed On": formatDateTime(b.borrow_date),
//       "Due Date": formatDateTime(b.due_date),
//       "Returned On": b.returned_date ? formatDateTime(b.returned_date) : "-",
//       Status: status,
//       Purpose: b.purpose,
//     };
//   });

//   const ws = XLSX.utils.json_to_sheet(data);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Borrowed Items");

//   XLSX.writeFile(
//     wb,
//     `Borrowed_Items_${new Date().toISOString().split("T")[0]}.xlsx`
//   );
//   showNotification("Borrowed items exported successfully", "success");
// }

// function exportExpenses() {
//   if (allExpenses.length === 0) {
//     showNotification("No expenses data to export", "error");
//     return;
//   }

//   const data = allExpenses.map((e) => ({
//     Date: formatDate(e.date),
//     Employee: e.employee_name,
//     Type: e.type,
//     Amount: parseFloat(e.amount).toFixed(2),
//     Description: e.description,
//     Status: e.status,
//     "Payment Status": e.payment_status || "Pending Payment",
//   }));

//   const ws = XLSX.utils.json_to_sheet(data);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Expense Requests");

//   XLSX.writeFile(
//     wb,
//     `Expense_Requests_${new Date().toISOString().split("T")[0]}.xlsx`
//   );
//   showNotification("Expenses exported successfully", "success");
// }

// async function exportAssets() {
//   try {
//     const response = await fetch("/api/assets");
//     const assets = await response.json();

//     if (assets.length === 0) {
//       showNotification("No assets data to export", "error");
//       return;
//     }

//     const data = assets.map((a) => ({
//       "Asset Name": a.name,
//       Category: a.category,
//       Description: a.description || "-",
//       Status: a.status,
//     }));

//     const ws = XLSX.utils.json_to_sheet(data);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Assets");

//     XLSX.writeFile(wb, `Assets_${new Date().toISOString().split("T")[0]}.xlsx`);
//     showNotification("Assets exported successfully", "success");
//   } catch (error) {
//     console.error("Error exporting assets:", error);
//     showNotification("Failed to export assets", "error");
//   }
// }

// async function exportAll() {
//   try {
//     const assetsRes = await fetch("/api/assets");
//     const assets = await assetsRes.json();

//     const attendanceRes = await fetch("/api/attendance");
//     const allAttendance = await attendanceRes.json();

//     const wb = XLSX.utils.book_new();

//     if (assets.length > 0) {
//       const assetsData = assets.map((a) => ({
//         "Asset Name": a.name,
//         Category: a.category,
//         Description: a.description || "-",
//         Status: a.status,
//       }));
//       const wsAssets = XLSX.utils.json_to_sheet(assetsData);
//       XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");
//     }

//     if (allBorrowings.length > 0) {
//       const borrowingsData = allBorrowings.map((b) => {
//         const now = new Date();
//         const dueDate = new Date(b.due_date);
//         const isOverdue = b.status === "Borrowed" && now > dueDate;
//         const status =
//           b.status === "Returned"
//             ? "Returned"
//             : isOverdue
//             ? "Overdue"
//             : "Borrowed";

//         return {
//           "Asset Name": b.asset_name,
//           Borrower: b.borrower_name,
//           "Borrowed On": formatDateTime(b.borrow_date),
//           "Due Date": formatDateTime(b.due_date),
//           "Returned On": b.returned_date
//             ? formatDateTime(b.returned_date)
//             : "-",
//           Status: status,
//           Purpose: b.purpose,
//         };
//       });
//       const wsBorrowings = XLSX.utils.json_to_sheet(borrowingsData);
//       XLSX.utils.book_append_sheet(wb, wsBorrowings, "Borrowed Items");
//     }

//     if (allExpenses.length > 0) {
//       const expensesData = allExpenses.map((e) => ({
//         Date: formatDate(e.date),
//         Employee: e.employee_name,
//         Type: e.type,
//         Amount: parseFloat(e.amount).toFixed(2),
//         Description: e.description,
//         Status: e.status,
//         "Payment Status": e.payment_status || "Pending Payment",
//       }));
//       const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
//       XLSX.utils.book_append_sheet(wb, wsExpenses, "Expense Requests");
//     }

//     if (allAttendance.length > 0) {
//       const attendanceData = allAttendance.map((a) => ({
//         Date: formatDate(a.date),
//         Employee: a.employee_name,
//         CheckIn: a.check_in ? formatDateTime(a.check_in) : "-",
//         CheckOut: a.check_out ? formatDateTime(a.check_out) : "-",
//         Date: formatDate(a.date),
//         Status: a.status,
//       }));
//       const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
//       XLSX.utils.book_append_sheet(wb, wsAttendance, "Attendance");
//     }

//     XLSX.writeFile(
//       wb,
//       `Office_Management_System_${new Date().toISOString().split("T")[0]}.xlsx`
//     );
//     showNotification("All data exported successfully", "success");
//   } catch (error) {
//     console.error("Error exporting all data:", error);
//     showNotification("Failed to export data", "error");
//   }
// }

// loadBorrowingsReport();
// loadExpensesReport();
/* js/reports.js (replace your existing file) */
const user = checkAuth();
displayUserInfo();
updateNavigation();

let allBorrowings = [];
let allExpenses = [];
let allAttendance = [];
let expenseTypes = [];

/* -------------------- Helpers -------------------- */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------- Loaders -------------------- */
async function loadBorrowingsReport() {
  try {
    const response = await fetch("/api/borrowings");
    allBorrowings = await response.json();
    filterBorrowings();
  } catch (error) {
    console.error("Error loading borrowings:", error);
  }
}

async function loadExpensesReport() {
  try {
    const [expensesRes, typesRes] = await Promise.all([
      fetch("/api/allexpenses"),
      fetch("/api/expensesTypes"),
    ]);

    allExpenses = await expensesRes.json();
    expenseTypes = await typesRes.json();

    populateExpenseTypeDropdown();
    populateExpenseStatusDropdown();
    filterExpenseReport(); // initial render
  } catch (err) {
    console.error("Error loading expenses/types:", err);
  }
}

async function loadAttendanceReport() {
  try {
    const res = await fetch("/api/attendance");
    allAttendance = await res.json();
  } catch (err) {
    console.error("Error loading attendance:", err);
  }
}

/* -------------------- Populate dropdowns -------------------- */
function populateExpenseTypeDropdown() {
  const el = document.getElementById("expenseTypeFilter");
  if (!el) return;

  el.innerHTML = ""; // clear
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "All Types";
  el.appendChild(allOpt);

  expenseTypes.forEach((t) => {
    const o = document.createElement("option");
    o.value = t.type_name;
    o.innerHTML = `${escapeHtml(t.type_name)} (${escapeHtml(t.type_code)})`;
    el.appendChild(o);
  });

  // ensure event listener in case HTML inline handler missing
  el.removeEventListener("change", filterExpenseReport);
  el.addEventListener("change", filterExpenseReport);
}

function populateExpenseStatusDropdown() {
  const el = document.getElementById("expenseStatusFilter");
  if (!el) return;

  // set a consistent set of options
  el.innerHTML = "";
  ["all", "Approved", "Pending", "Rejected"].forEach((val) => {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = val === "all" ? "All" : val;
    el.appendChild(o);
  });

  el.removeEventListener("change", filterExpenseReport);
  el.addEventListener("change", filterExpenseReport);
}

/* -------------------- Borrowings -------------------- */
function filterBorrowings() {
  const filterEl = document.getElementById("borrowStatusFilter");
  const filterValue = filterEl ? filterEl.value : "all";

  let filteredBorrowings = allBorrowings.slice();

  if (filterValue !== "all") {
    const now = new Date();
    filteredBorrowings = filteredBorrowings.filter((b) => {
      if (filterValue === "Borrowed") return b.status === "Borrowed";
      if (filterValue === "Returned") return b.status === "Returned";
      if (filterValue === "Overdue") {
        const dueDate = new Date(b.due_date);
        return b.status === "Borrowed" && now > dueDate;
      }
      return true;
    });
  }

  const tbody = document.getElementById("borrowingsReportTableBody");
  if (!tbody) return;

  if (filteredBorrowings.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;">No borrowing records</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  filteredBorrowings.forEach((b) => {
    const now = new Date();
    const dueDate = new Date(b.due_date);
    const isOverdue = b.status === "Borrowed" && now > dueDate;
    const statusClass =
      b.status === "Returned"
        ? "status-returned"
        : isOverdue
        ? "status-overdue"
        : "status-borrowed";
    const statusText =
      b.status === "Returned" ? "Returned" : isOverdue ? "Overdue" : "Borrowed";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(b.asset_name)}</td>
      <td>${escapeHtml(b.borrower_name)}</td>
      <td>${formatDateTime(b.borrow_date)}</td>
      <td>${formatDateTime(b.due_date)}</td>
      <td>${b.returned_date ? formatDateTime(b.returned_date) : "-"}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* -------------------- Expenses -------------------- */
function getFilteredExpenses() {
  const typeEl = document.getElementById("expenseTypeFilter");
  const statusEl = document.getElementById("expenseStatusFilter");
  const typeValue = typeEl ? typeEl.value : "all";
  const statusValue = statusEl ? statusEl.value : "all";

  return allExpenses.filter((e) => {
    const matchesType = typeValue === "all" || e.type === typeValue;
    const matchesStatus = statusValue === "all" || e.status === statusValue;
    return matchesType && matchesStatus;
  });
}

function renderExpenseTable(expenses) {
  const tbody = document.getElementById("expensesReportTableBody");
  if (!tbody) return;

  if (!Array.isArray(expenses) || expenses.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;">No expense records</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  expenses.forEach((e) => {
    const statusClass =
      e.status === "Approved"
        ? "status-approved"
        : e.status === "Rejected"
        ? "status-rejected"
        : "status-pending";
    const paymentClass =
      e.payment_status === "Paid" ? "status-paid" : "status-unpaid";

    const amount = Number(e.amount) || 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(e.date)}</td>
      <td>${escapeHtml(e.employee_name)}</td>
      <td>${escapeHtml(e.type)}</td>
      <td>${escapeHtml(e.invoiceNumber || "-")}</td>
      <td>₹${amount.toFixed(2)}</td>
      <td>${escapeHtml(e.description || "")}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(
      e.status || ""
    )}</span></td>
      <td><span class="status-badge ${paymentClass}">${escapeHtml(
      e.payment_status || "Pending Payment"
    )}</span></td>
    `;
    tbody.appendChild(tr);
  });
  calculateExpenseSummary(expenses);
}

function filterExpenseReport() {
  const filtered = getFilteredExpenses();
  renderExpenseTable(filtered);
}

/* -------------------- Summary -------------------- */
function calculateExpenseSummary(expenses) {
  const arr = Array.isArray(expenses) ? expenses : [];
  const total = arr.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const approved = arr
    .filter((e) => e.status === "Approved")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pending = arr
    .filter((e) => e.status === "Pending")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const totalEl = document.getElementById("totalExpenses");
  const approvedEl = document.getElementById("approvedExpenses");
  const pendingEl = document.getElementById("pendingExpenses");

  if (totalEl) totalEl.textContent = total.toFixed(2);
  if (approvedEl) approvedEl.textContent = approved.toFixed(2);
  if (pendingEl) pendingEl.textContent = pending.toFixed(2);
}

/* -------------------- Exports -------------------- */
function exportBorrowings() {
  if (!allBorrowings.length) {
    showNotification("No borrowings data to export", "error");
    return;
  }
  const data = allBorrowings.map((b) => {
    const now = new Date();
    const dueDate = new Date(b.due_date);
    const isOverdue = b.status === "Borrowed" && now > dueDate;
    const status =
      b.status === "Returned" ? "Returned" : isOverdue ? "Overdue" : "Borrowed";
    return {
      "Asset Name": b.asset_name,
      Borrower: b.borrower_name,
      "Borrowed On": formatDateTime(b.borrow_date),
      "Due Date": formatDateTime(b.due_date),
      "Returned On": b.returned_date ? formatDateTime(b.returned_date) : "-",
      Status: status,
      Purpose: b.purpose,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Borrowed Items");
  XLSX.writeFile(
    wb,
    `Borrowed_Items_${new Date().toISOString().split("T")[0]}.xlsx`
  );
  showNotification("Borrowed items exported successfully", "success");
}

function exportExpenses() {
  if (!allExpenses.length) {
    showNotification("No expenses data to export", "error");
    return;
  }

  const data = allExpenses.map((e) => ({
    Date: formatDate(e.date),
    Employee: e.employee_name,
    Type: e.type,
    Invoice: e.invoiceNumber || "-",
    Amount: (Number(e.amount) || 0).toFixed(2),
    Description: e.description || "",
    Status: e.status || "",
    "Payment Status": e.payment_status || "Pending Payment",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expense Requests");
  XLSX.writeFile(
    wb,
    `Expense_Requests_${new Date().toISOString().split("T")[0]}.xlsx`
  );
  showNotification("Expenses exported successfully", "success");
}

// async function exportAssets() {
//   try {
//     const response = await fetch("/api/assets");
//     const assets = await response.json();
//     if (!assets.length)
//       return showNotification("No assets data to export", "error");

//     const data = assets.map((a) => ({
//       "Asset Name": a.name,
//       Category: a.category,
//       Description: a.description || "-",
//       Status: a.status,
//     }));

//     const ws = XLSX.utils.json_to_sheet(data);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Assets");
//     XLSX.writeFile(wb, `Assets_${new Date().toISOString().split("T")[0]}.xlsx`);
//     showNotification("Assets exported successfully", "success");
//   } catch (err) {
//     console.error("Error exporting assets:", err);
//     showNotification("Failed to export assets", "error");
//   }
// }

async function exportAttendance() {
  try {
    const res = await fetch("/api/attendance");
    const attendance = await res.json();
    if (!attendance.length)
      return showNotification("No attendance data to export", "error");

    const data = attendance.map((a) => ({
      "Employee Name": a.employee_name,
      Date: a.date,
      "Check In": a.check_in ? new Date(a.check_in).toLocaleTimeString() : "-",
      "Check Out": a.check_out
        ? new Date(a.check_out).toLocaleTimeString()
        : "-",
      "Worked Hours": a.worked_minutes ? (a.worked_minutes / 60).toFixed(2) : 0,
      "Leave Types":
        a.leaves && a.leaves.length
          ? a.leaves
              .map(
                (l) =>
                  `${l.type} (start: ${
                    l.start_date
                      ? new Date(l.start_date).toLocaleDateString()
                      : "-"
                  } | end: ${
                    l.end_date ? new Date(l.end_date).toLocaleDateString() : "-"
                  })`
              )
              .join(", ")
          : "-",
      "Comp Leaves":
        a.comp_leaves && a.comp_leaves.length
          ? a.comp_leaves
              .map(
                (c) =>
                  `Requested: ${
                    c.requested_date
                      ? new Date(c.requested_date).toLocaleDateString()
                      : "-"
                  } | Worked: ${
                    c.work_date
                      ? new Date(c.work_date).toLocaleDateString()
                      : "-"
                  }`
              )
              .join(" ; ")
          : "-",
      "Total Leaves": a.totalLeaves,
      "Total Comp Leaves": a.totalCompLeaves,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(
      wb,
      `Attendance_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    showNotification("Attendance exported successfully", "success");
  } catch (err) {
    console.error("Error exporting attendance:", err);
    showNotification("Failed to export attendance", "error");
  }
}

// ==========================
// EXPORT ALL DATA
// ==========================
async function exportAll() {
  try {
    // 1️⃣ Assets
    const assetsRes = await fetch("/api/assets");
    const assets = await assetsRes.json();
    const assetSheet = assets.map((a) => ({
      "Asset Name": a.name,
      Category: a.category,
      Description: a.description || "-",
      Status: a.status,
    }));

    // 2️⃣ Borrowings
    const borrowRes = await fetch("/api/borrowings");
    const borrowings = await borrowRes.json();
    const borrowSheet = borrowings.map((b) => {
      const now = new Date();
      const dueDate = new Date(b.due_date);
      const isOverdue = b.status === "Borrowed" && now > dueDate;
      const status =
        b.status === "Returned"
          ? "Returned"
          : isOverdue
          ? "Overdue"
          : "Borrowed";

      return {
        "Asset Name": b.asset_name,
        Borrower: b.borrower_name,
        "Borrowed On": formatDateTime(b.borrow_date),
        "Due Date": formatDateTime(b.due_date),
        "Returned On": b.returned_date ? formatDateTime(b.returned_date) : "-",
        Status: status,
        Purpose: b.purpose,
      };
    });

    // 3️⃣ Expenses
    const expenseRes = await fetch("/api/allexpenses");
    const expenses = await expenseRes.json();
    const expenseSheet = expenses.map((e) => ({
      Date: formatDate(e.date),
      Employee: e.employee_name,
      Type: e.type,
      "Invoice Number": e.invoiceNumber,
      Amount: parseFloat(e.amount).toFixed(2),
      Description: e.description,
      Status: e.status,
      "Payment Status": e.payment_status || "Pending Payment",
    }));

    // 4️⃣ Attendance with leaves
    const attendanceRes = await fetch("/api/attendance");
    const attendance = await attendanceRes.json();
    const attendanceSheet = attendance.map((a) => ({
      "Employee Name": a.employee_name,
      Date: a.date,
      "Check In": a.check_in ? new Date(a.check_in).toLocaleTimeString() : "-",
      "Check Out": a.check_out
        ? new Date(a.check_out).toLocaleTimeString()
        : "-",
      "Worked Hours": a.worked_minutes ? (a.worked_minutes / 60).toFixed(2) : 0,
      "Leave Types":
        a.leaves && a.leaves.length
          ? a.leaves
              .map(
                (l) =>
                  `${l.type} (start: ${
                    l.start_date
                      ? new Date(l.start_date).toLocaleDateString()
                      : "-"
                  } | end: ${
                    l.end_date ? new Date(l.end_date).toLocaleDateString() : "-"
                  })`
              )
              .join(", ")
          : "-",
      "Comp Leaves":
        a.comp_leaves && a.comp_leaves.length
          ? a.comp_leaves
              .map(
                (c) =>
                  `Requested: ${
                    c.requested_date
                      ? new Date(c.requested_date).toLocaleDateString()
                      : "-"
                  } | Worked: ${
                    c.work_date
                      ? new Date(c.work_date).toLocaleDateString()
                      : "-"
                  }`
              )
              .join(" ; ")
          : "-",
      "Total Leaves": a.totalLeaves,
      "Total Comp Leaves": a.totalCompLeaves,
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    if (assetSheet.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(assetSheet),
        "Assets"
      );
    if (borrowSheet.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(borrowSheet),
        "Borrowings"
      );
    if (expenseSheet.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(expenseSheet),
        "Expenses"
      );
    if (attendanceSheet.length)
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(attendanceSheet),
        "Attendance"
      );

    XLSX.writeFile(
      wb,
      `Office_Management_All_Data_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
    showNotification("All data exported successfully", "success");
  } catch (err) {
    console.error("Error exporting all data:", err);
    showNotification("Failed to export all data", "error");
  }
}

// Helper function to format datetime
function formatDateTime(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function formatDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleDateString();
}

/* -------------------- Init -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // attach simple filter listeners (in case HTML didn't provide inline onchange)
  document
    .getElementById("borrowStatusFilter")
    ?.addEventListener("change", filterBorrowings);
  document
    .getElementById("expenseTypeFilter")
    ?.addEventListener("change", filterExpenseReport);
  document
    .getElementById("expenseStatusFilter")
    ?.addEventListener("change", filterExpenseReport);

  // load data
  loadBorrowingsReport();
  loadExpensesReport();
  loadAttendanceReport();
});
