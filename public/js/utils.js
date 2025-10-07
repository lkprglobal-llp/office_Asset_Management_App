function checkAuth() {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    window.location.href = "index.html";
    return null;
  }
  return JSON.parse(currentUser);
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

function displayUserInfo() {
  const user = checkAuth();
  if (user) {
    const userDisplay = document.getElementById("userDisplay");
    if (userDisplay) {
      userDisplay.textContent = `${
        user.username.charAt(0).toUpperCase() + user.role.slice(1)
      } (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;
    }
  }
}

function updateNavigation() {
  const user = checkAuth();
  if (user && user.role === "employee") {
    const navAssets = document.getElementById("navAssets");
    const navReports = document.getElementById("navReports");
    const adminLeaveResponse = document.getElementById("leaveAdminTab");
    const adminAddEmployee = document.getElementById("employeeTab");
    if (navAssets) {
      navAssets.style.display = "none";
    }
    if (navReports) {
      navReports.style.display = "none";
    }
    if (adminLeaveResponse) {
      adminLeaveResponse.style.display = "none";
    }
    if (adminAddEmployee) {
      adminAddEmployee.style.display = "none";
    }
  }
  if (user && user.role === "manager") {
    const navAssets = document.getElementById("navAssets");
    if (navAssets) {
      navAssets.style.display = "none";
    }
  }
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === "success" ? "#28a745" : "#dc3545"};
    color: white;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function initializeData() {
  if (!localStorage.getItem("assets")) {
    localStorage.setItem("assets", JSON.stringify([]));
  }
  if (!localStorage.getItem("borrowings")) {
    localStorage.setItem("borrowings", JSON.stringify([]));
  }
  if (!localStorage.getItem("expenses")) {
    localStorage.setItem("expenses", JSON.stringify([]));
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

initializeData();
