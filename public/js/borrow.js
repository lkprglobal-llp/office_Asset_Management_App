const user = checkAuth();
displayUserInfo();
updateNavigation();

async function loadAvailableAssets() {
  try {
    const response = await fetch("/api/assets");
    const assets = await response.json();
    const availableAssets = assets.filter((a) => a.status === "Available");
    const select = document.getElementById("borrowAsset");

    select.innerHTML = '<option value="">Select an asset</option>';

    availableAssets.forEach((asset) => {
      const option = document.createElement("option");
      option.value = asset.id;
      option.textContent = `${asset.name} (${asset.category})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading assets:", error);
  }
}

async function loadMyBorrowings() {
  try {
    const response = await fetch("/api/borrowings");
    const borrowings = await response.json();
    const myBorrowings = borrowings.filter(
      (b) => b.borrower_username === user.username
    );
    const tbody = document.getElementById("myBorrowingsTableBody");

    if (myBorrowings.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No borrowed items</td></tr>';
      return;
    }

    tbody.innerHTML = "";

    myBorrowings.forEach((b) => {
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
        b.status === "Returned"
          ? "Returned"
          : isOverdue
          ? "Overdue"
          : "Borrowed";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.asset_name}</td>
        <td>${b.borrower_name}</td>
        <td>${formatDateTime(b.borrow_date)}</td>
        <td>${formatDateTime(b.due_date)}</td>
        <td>${b.purpose}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          ${
            b.status === "Borrowed"
              ? `<button onclick="returnItem('${b.id}')" class="btn btn-success" style="padding: 6px 12px;">Return</button>`
              : "-"
          }
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading borrowings:", error);
  }
}

async function loadAllBorrowings() {
  if (user.role !== "admin" && user.role !== "manager") {
    document.getElementById("allBorrowingsSection").style.display = "none";
    return;
  }

  try {
    const response = await fetch("/api/borrowings");
    const borrowings = await response.json();
    const tbody = document.getElementById("allBorrowingsTableBody");

    if (borrowings.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No borrowings recorded</td></tr>';
      return;
    }

    tbody.innerHTML = "";

    borrowings.forEach((b) => {
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
        b.status === "Returned"
          ? "Returned"
          : isOverdue
          ? "Overdue"
          : "Borrowed";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.asset_name}</td>
        <td>${b.borrower_name}</td>
        <td>${formatDateTime(b.borrow_date)}</td>
        <td>${formatDateTime(b.due_date)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          ${
            b.status === "Borrowed" && user.role === "admin"
              ? `<button onclick="returnItemAdmin('${b.id}')" class="btn btn-success" style="padding: 6px 12px;">Mark Returned</button>`
              : "-"
          }
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading borrowings:", error);
  }
}

async function returnItem(borrowingId) {
  if (confirm("Are you sure you want to return this item?")) {
    try {
      const response = await fetch(`/api/borrowings/${borrowingId}/return`, {
        method: "PUT",
      });
      const data = await response.json();

      if (data.success) {
        showNotification("Item returned successfully", "success");
        loadMyBorrowings();
        loadAllBorrowings();
        loadAvailableAssets();
      }
    } catch (error) {
      console.error("Error returning item:", error);
      showNotification("Failed to return item", "error");
    }
  }
}

function returnItemAdmin(borrowingId) {
  returnItem(borrowingId);
}

document.getElementById("borrowerName").value;

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
document.getElementById("borrowDate").value = now.toISOString().slice(0, 16);

const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
document.getElementById("dueDate").value = tomorrow.toISOString().slice(0, 16);

document
  .getElementById("borrowForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const assetId = document.getElementById("borrowAsset").value;
    const borrowDate = document.getElementById("borrowDate").value;
    const dueDate = document.getElementById("dueDate").value;
    const purpose = document.getElementById("borrowPurpose").value;

    if (!assetId) {
      showNotification("Please select an asset", "error");
      return;
    }

    try {
      const assetsRes = await fetch("/api/assets");
      const assets = await assetsRes.json();
      const asset = assets.find((a) => a.id === assetId);

      if (!asset) {
        showNotification("Asset not found", "error");
        return;
      }

      const borrowing = {
        id: generateId(),
        assetId: assetId,
        assetName: asset.name,
        borrowerUsername: user.username,
        borrowerName: user.name,
        borrowDate: borrowDate,
        dueDate: dueDate,
        purpose: purpose,
      };

      const response = await fetch("/api/borrowings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(borrowing),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Item borrowed successfully", "success");
        this.reset();
        document.getElementById("borrowerName").value = user.name;

        const newNow = new Date();
        newNow.setMinutes(newNow.getMinutes() - newNow.getTimezoneOffset());
        document.getElementById("borrowDate").value = newNow
          .toISOString()
          .slice(0, 16);

        const newTomorrow = new Date(newNow);
        newTomorrow.setDate(newTomorrow.getDate() + 1);
        newTomorrow.setMinutes(
          newTomorrow.getMinutes() - newTomorrow.getTimezoneOffset()
        );
        document.getElementById("dueDate").value = newTomorrow
          .toISOString()
          .slice(0, 16);

        loadAvailableAssets();
        loadMyBorrowings();
        loadAllBorrowings();
      }
    } catch (error) {
      console.error("Error borrowing item:", error);
      showNotification("Failed to borrow item", "error");
    }
  });

loadAvailableAssets();
loadMyBorrowings();
loadAllBorrowings();
