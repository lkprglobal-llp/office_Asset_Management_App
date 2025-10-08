const user = checkAuth();
displayUserInfo();
updateNavigation();

if (user.role !== "employee") {
  document.getElementById("expenseFormContainer").style.display = "none";
}

if (user.role !== "admin") {
  document.getElementById("approvalSection").style.display = "none";
  document.getElementById("allExpensesSection").style.display = "none";
}

function createBillUrlFromBuffer(billBuffer, billType) {
  const uint8Array = new Uint8Array(billBuffer.data);

  const blob = new Blob([uint8Array], { type: billType });

  return URL.createObjectURL(blob);
}

async function loadMyExpenses() {
  try {
    const response = await fetch("/api/expenses");
    const expenses = await response.json();
    const myExpenses = expenses.filter(
      (e) => e.employee_username === user.username
    );
    const tbody = document.getElementById("myExpensesTableBody");

    if (myExpenses.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">No expense requests</td></tr>';
      return;
    }

    tbody.innerHTML = "";

    myExpenses.forEach((e) => {
      const statusClass =
        e.status === "Approved"
          ? "status-approved"
          : e.status === "Rejected"
          ? "status-rejected"
          : "status-pending";
      const paymentClass =
        e.payment_status === "Paid" ? "status-paid" : "status-unpaid";

      // Get bill URL dynamically if BLOB exists
      const billLink = e.bill_data
        ? `<a href="${createBillUrlFromBuffer(
            e.bill_data,
            e.bill_type
          )}" target="_blank">View Bill</a>`
        : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(e.date)}</td>
        <td>${e.type}</td>
        <td>₹${parseFloat(e.amount).toFixed(2)}</td>
        <td>${e.description}</td>
        <td>${billLink}</td>
        <td><span class="status-badge ${statusClass}">${e.status}</span></td>
        <td><span class="status-badge ${paymentClass}">${
        e.payment_status || "Pending Payment"
      }</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading expenses:", error);
  }
}

async function loadPendingApprovals() {
  if (user.role !== "admin") {
    return;
  }

  try {
    const response = await fetch("/api/expenses");
    const expenses = await response.json();
    const pendingExpenses = expenses.filter((e) => e.status === "Pending");
    const tbody = document.getElementById("pendingExpensesTableBody");

    if (pendingExpenses.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No pending approvals</td></tr>';
      return;
    }

    tbody.innerHTML = "";

    pendingExpenses.forEach((e) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(e.date)}</td>
        <td>${e.employee_name}</td>
        <td>${e.type}</td>
        <td>₹${parseFloat(e.amount).toFixed(2)}</td>
        <td>${e.description}<br>${
        e.bill_data
          ? `<a href="${e.bill_data}" target="_blank">View Bill</a>`
          : "No bill"
      }</td>
        <td>
          <button onclick="approveExpense('${
            e.id
          }')" class="btn btn-success" style="padding: 6px 12px; margin-right: 5px;">Approve</button>
          <button onclick="rejectExpense('${
            e.id
          }')" class="btn btn-danger" style="padding: 6px 12px;">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading pending approvals:", error);
  }
}

async function loadAllExpenses() {
  if (user.role !== "admin") {
    return;
  }

  filterExpenses();
}

async function filterExpenses() {
  try {
    const response = await fetch("/api/expenses");
    const expenses = await response.json();
    const statusFilterElement = document.getElementById("statusFilter");
    const filterValue = statusFilterElement ? statusFilterElement.value : "all";

    let filteredExpenses = expenses;
    if (filterValue !== "all") {
      filteredExpenses = expenses.filter((e) => e.status === filterValue);
    }

    const tbody = document.getElementById("allExpensesTableBody");

    if (filteredExpenses.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">No expense requests</td></tr>';
      return;
    }

    tbody.innerHTML = "";

    filteredExpenses.forEach((e) => {
      const statusClass =
        e.status === "Approved"
          ? "status-approved"
          : e.status === "Rejected"
          ? "status-rejected"
          : "status-pending";
      const paymentClass =
        e.payment_status === "Paid" ? "status-paid" : "status-unpaid";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(e.date)}</td>
        <td>${e.employee_name}</td>
        <td>${e.type}</td>
        <td>₹${parseFloat(e.amount).toFixed(2)}</td>
        <td><span class="status-badge ${statusClass}">${e.status}</span></td>
        <td><span class="status-badge ${paymentClass}">${
        e.payment_status || "Pending Payment"
      }</span></td>
        <td>
          ${
            e.status === "Approved" && e.payment_status !== "Paid"
              ? `<button onclick="markAsPaid('${e.id}')" class="btn btn-success" style="padding: 6px 12px;">Mark as Paid</button>`
              : "-"
          }
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error filtering expenses:", error);
  }
}

async function approveExpense(expenseId) {
  if (confirm("Are you sure you want to approve this expense?")) {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user.username }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Expense approved successfully", "success");
        loadPendingApprovals();
        loadAllExpenses();
      }
    } catch (error) {
      console.error("Error approving expense:", error);
      showNotification("Failed to approve expense", "error");
    }
  }
}

async function rejectExpense(expenseId) {
  if (confirm("Are you sure you want to reject this expense?")) {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedBy: user.username }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Expense rejected", "success");
        loadPendingApprovals();
        loadAllExpenses();
      }
    } catch (error) {
      console.error("Error rejecting expense:", error);
      showNotification("Failed to reject expense", "error");
    }
  }
}

async function markAsPaid(expenseId) {
  if (confirm("Mark this expense as paid?")) {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/pay`, {
        method: "PUT",
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Expense marked as paid", "success");
        loadAllExpenses();
        loadMyExpenses();
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      showNotification("Failed to mark as paid", "error");
    }
  }
}

if (user.role !== "admin") {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const expenseDateElement = document.getElementById("expenseDate");
  const employeeNameElement = document.getElementById("employeeName");

  if (expenseDateElement) {
    expenseDateElement.value = today.toISOString().split("T")[0];
  }
  if (employeeNameElement) {
    employeeNameElement.value = user.name;
  }
}

const expenseFormElement = document.getElementById("expenseForm");
if (expenseFormElement) {
  expenseFormElement.addEventListener("submit", async function (e) {
    e.preventDefault();

    const date = document.getElementById("expenseDate").value;
    const employeename = document.getElementById("employeeName").value;
    const type = document.getElementById("expenseType").value;
    const amount = document.getElementById("expenseAmount").value;
    const description = document.getElementById("expenseDescription").value;
    const billFile = document.getElementById("billUpload").files[0];

    if (!billFile) {
      showNotification("Please upload a bill or receipt", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", generateId());
      formData.append("date", date);
      formData.append("employeeUsername", user.username);
      formData.append("employeeName", employeename);
      formData.append("type", type);
      formData.append("amount", amount);
      formData.append("description", description);
      formData.append("bill", billFile);

      const response = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Expense request submitted successfully", "success");
        this.reset();

        const newToday = new Date();
        newToday.setMinutes(
          newToday.getMinutes() - newToday.getTimezoneOffset()
        );
        const expenseDateElement = document.getElementById("expenseDate");
        const employeeNameElement = document.getElementById("employeeName");

        if (expenseDateElement) {
          expenseDateElement.value = newToday.toISOString().split("T")[0];
        }
        if (employeeNameElement) {
          employeeNameElement.value = user.name;
        }

        loadMyExpenses();
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      showNotification("Failed to submit expense", "error");
    }
  });
}

loadMyExpenses();
loadPendingApprovals();
loadAllExpenses();
