const user = checkAuth();
displayUserInfo();
updateNavigation();

function loadDashboardStats() {
  const assets = JSON.parse(localStorage.getItem('assets')) || [];
  const borrowings = JSON.parse(localStorage.getItem('borrowings')) || [];
  const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  
  const availableAssets = assets.filter(a => a.status === 'Available').length;
  const borrowedAssets = assets.filter(a => a.status === 'Borrowed').length;
  const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;
  
  document.getElementById('totalAssets').textContent = assets.length;
  document.getElementById('availableAssets').textContent = availableAssets;
  document.getElementById('borrowedAssets').textContent = borrowedAssets;
  document.getElementById('pendingExpenses').textContent = pendingExpenses;
}

function loadRecentBorrowings() {
  const borrowings = JSON.parse(localStorage.getItem('borrowings')) || [];
  const recentBorrowings = borrowings
    .filter(b => b.status === 'Borrowed')
    .slice(0, 5);
  
  const tbody = document.getElementById('recentBorrowings');
  
  if (recentBorrowings.length === 0) {
    tbody.innerHTML = '<p>No recent borrowings</p>';
    return;
  }
  
  let html = '<table><thead><tr><th>Asset</th><th>Borrower</th><th>Borrowed On</th><th>Due Date</th><th>Status</th></tr></thead><tbody>';
  
  recentBorrowings.forEach(b => {
    const now = new Date();
    const dueDate = new Date(b.dueDate);
    const isOverdue = now > dueDate;
    const statusClass = isOverdue ? 'status-overdue' : 'status-borrowed';
    const statusText = isOverdue ? 'Overdue' : 'Borrowed';
    
    html += `
      <tr>
        <td>${b.assetName}</td>
        <td>${b.borrowerName}</td>
        <td>${formatDateTime(b.borrowDate)}</td>
        <td>${formatDateTime(b.dueDate)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  tbody.innerHTML = html;
}

function loadRecentExpenses() {
  const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  const recentExpenses = expenses.slice(-5).reverse();
  
  const tbody = document.getElementById('recentExpenses');
  
  if (recentExpenses.length === 0) {
    tbody.innerHTML = '<p>No recent expense requests</p>';
    return;
  }
  
  let html = '<table><thead><tr><th>Date</th><th>Employee</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
  
  recentExpenses.forEach(e => {
    const statusClass = e.status === 'Approved' ? 'status-approved' : 
                       e.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    
    html += `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.employeeName}</td>
        <td>${e.type}</td>
        <td>₹${parseFloat(e.amount).toFixed(2)}</td>
        <td><span class="status-badge ${statusClass}">${e.status}</span></td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  tbody.innerHTML = html;
}

loadDashboardStats();
loadRecentBorrowings();
loadRecentExpenses();
