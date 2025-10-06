const user = checkAuth();
displayUserInfo();
updateNavigation();

async function loadDashboardStats() {
  try {
    const [assetsRes, borrowingsRes, expensesRes] = await Promise.all([
      fetch('/api/assets'),
      fetch('/api/borrowings'),
      fetch('/api/expenses')
    ]);
    
    const assets = await assetsRes.json();
    const borrowings = await borrowingsRes.json();
    const expenses = await expensesRes.json();
    
    const availableAssets = assets.filter(a => a.status === 'Available').length;
    const borrowedAssets = assets.filter(a => a.status === 'Borrowed').length;
    const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;
    
    document.getElementById('totalAssets').textContent = assets.length;
    document.getElementById('availableAssets').textContent = availableAssets;
    document.getElementById('borrowedAssets').textContent = borrowedAssets;
    document.getElementById('pendingExpenses').textContent = pendingExpenses;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecentBorrowings() {
  try {
    const response = await fetch('/api/borrowings');
    const borrowings = await response.json();
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
      const dueDate = new Date(b.due_date);
      const isOverdue = now > dueDate;
      const statusClass = isOverdue ? 'status-overdue' : 'status-borrowed';
      const statusText = isOverdue ? 'Overdue' : 'Borrowed';
      
      html += `
        <tr>
          <td>${b.asset_name}</td>
          <td>${b.borrower_name}</td>
          <td>${formatDateTime(b.borrow_date)}</td>
          <td>${formatDateTime(b.due_date)}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    tbody.innerHTML = html;
  } catch (error) {
    console.error('Error loading borrowings:', error);
  }
}

async function loadRecentExpenses() {
  try {
    const response = await fetch('/api/expenses');
    const expenses = await response.json();
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
          <td>${e.employee_name}</td>
          <td>${e.type}</td>
          <td>₹${parseFloat(e.amount).toFixed(2)}</td>
          <td><span class="status-badge ${statusClass}">${e.status}</span></td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    tbody.innerHTML = html;
  } catch (error) {
    console.error('Error loading expenses:', error);
  }
}

loadDashboardStats();
loadRecentBorrowings();
loadRecentExpenses();
