const user = checkAuth();
displayUserInfo();
updateNavigation();

let allBorrowings = [];
let allExpenses = [];

async function loadBorrowingsReport() {
  try {
    const response = await fetch('/api/borrowings');
    allBorrowings = await response.json();
    filterBorrowings();
  } catch (error) {
    console.error('Error loading borrowings:', error);
  }
}

function filterBorrowings() {
  const filterValue = document.getElementById('borrowStatusFilter').value;
  let filteredBorrowings = allBorrowings;
  
  if (filterValue !== 'all') {
    const now = new Date();
    filteredBorrowings = allBorrowings.filter(b => {
      if (filterValue === 'Borrowed') {
        return b.status === 'Borrowed';
      } else if (filterValue === 'Returned') {
        return b.status === 'Returned';
      } else if (filterValue === 'Overdue') {
        const dueDate = new Date(b.due_date);
        return b.status === 'Borrowed' && now > dueDate;
      }
      return true;
    });
  }
  
  const tbody = document.getElementById('borrowingsReportTableBody');
  
  if (filteredBorrowings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No borrowing records</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  filteredBorrowings.forEach(b => {
    const now = new Date();
    const dueDate = new Date(b.due_date);
    const isOverdue = b.status === 'Borrowed' && now > dueDate;
    const statusClass = b.status === 'Returned' ? 'status-returned' : 
                       isOverdue ? 'status-overdue' : 'status-borrowed';
    const statusText = b.status === 'Returned' ? 'Returned' : 
                      isOverdue ? 'Overdue' : 'Borrowed';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.asset_name}</td>
      <td>${b.borrower_name}</td>
      <td>${formatDateTime(b.borrow_date)}</td>
      <td>${formatDateTime(b.due_date)}</td>
      <td>${b.returned_date ? formatDateTime(b.returned_date) : '-'}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadExpensesReport() {
  try {
    const response = await fetch('/api/expenses');
    allExpenses = await response.json();
    filterExpenseReport();
    calculateExpenseSummary();
  } catch (error) {
    console.error('Error loading expenses:', error);
  }
}

function filterExpenseReport() {
  const statusFilter = document.getElementById('expenseStatusFilter').value;
  const typeFilter = document.getElementById('expenseTypeFilter').value;
  
  let filteredExpenses = allExpenses;
  
  if (statusFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter(e => e.status === statusFilter);
  }
  
  if (typeFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter(e => e.type === typeFilter);
  }
  
  const tbody = document.getElementById('expensesReportTableBody');
  
  if (filteredExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No expense records</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  filteredExpenses.forEach(e => {
    const statusClass = e.status === 'Approved' ? 'status-approved' : 
                       e.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    const paymentClass = e.payment_status === 'Paid' ? 'status-paid' : 'status-unpaid';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(e.date)}</td>
      <td>${e.employee_name}</td>
      <td>${e.type}</td>
      <td>₹${parseFloat(e.amount).toFixed(2)}</td>
      <td>${e.description}</td>
      <td><span class="status-badge ${statusClass}">${e.status}</span></td>
      <td><span class="status-badge ${paymentClass}">${e.payment_status || 'Pending Payment'}</span></td>
    `;
    tbody.appendChild(tr);
  });
  
  calculateExpenseSummary();
}

function calculateExpenseSummary() {
  const expenses = allExpenses;
  
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const approved = expenses
    .filter(e => e.status === 'Approved')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const pending = expenses
    .filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  document.getElementById('totalExpenses').textContent = total.toFixed(2);
  document.getElementById('approvedExpenses').textContent = approved.toFixed(2);
  document.getElementById('pendingExpenses').textContent = pending.toFixed(2);
}

function exportBorrowings() {
  if (allBorrowings.length === 0) {
    showNotification('No borrowings data to export', 'error');
    return;
  }
  
  const data = allBorrowings.map(b => {
    const now = new Date();
    const dueDate = new Date(b.due_date);
    const isOverdue = b.status === 'Borrowed' && now > dueDate;
    const status = b.status === 'Returned' ? 'Returned' : 
                  isOverdue ? 'Overdue' : 'Borrowed';
    
    return {
      'Asset Name': b.asset_name,
      'Borrower': b.borrower_name,
      'Borrowed On': formatDateTime(b.borrow_date),
      'Due Date': formatDateTime(b.due_date),
      'Returned On': b.returned_date ? formatDateTime(b.returned_date) : '-',
      'Status': status,
      'Purpose': b.purpose
    };
  });
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Borrowed Items');
  
  XLSX.writeFile(wb, `Borrowed_Items_${new Date().toISOString().split('T')[0]}.xlsx`);
  showNotification('Borrowed items exported successfully', 'success');
}

function exportExpenses() {
  if (allExpenses.length === 0) {
    showNotification('No expenses data to export', 'error');
    return;
  }
  
  const data = allExpenses.map(e => ({
    'Date': formatDate(e.date),
    'Employee': e.employee_name,
    'Type': e.type,
    'Amount': parseFloat(e.amount).toFixed(2),
    'Description': e.description,
    'Status': e.status,
    'Payment Status': e.payment_status || 'Pending Payment'
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expense Requests');
  
  XLSX.writeFile(wb, `Expense_Requests_${new Date().toISOString().split('T')[0]}.xlsx`);
  showNotification('Expenses exported successfully', 'success');
}

async function exportAssets() {
  try {
    const response = await fetch('/api/assets');
    const assets = await response.json();
    
    if (assets.length === 0) {
      showNotification('No assets data to export', 'error');
      return;
    }
    
    const data = assets.map(a => ({
      'Asset Name': a.name,
      'Category': a.category,
      'Description': a.description || '-',
      'Status': a.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');
    
    XLSX.writeFile(wb, `Assets_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Assets exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting assets:', error);
    showNotification('Failed to export assets', 'error');
  }
}

async function exportAll() {
  try {
    const assetsRes = await fetch('/api/assets');
    const assets = await assetsRes.json();
    
    const wb = XLSX.utils.book_new();
    
    if (assets.length > 0) {
      const assetsData = assets.map(a => ({
        'Asset Name': a.name,
        'Category': a.category,
        'Description': a.description || '-',
        'Status': a.status
      }));
      const wsAssets = XLSX.utils.json_to_sheet(assetsData);
      XLSX.utils.book_append_sheet(wb, wsAssets, 'Assets');
    }
    
    if (allBorrowings.length > 0) {
      const borrowingsData = allBorrowings.map(b => {
        const now = new Date();
        const dueDate = new Date(b.due_date);
        const isOverdue = b.status === 'Borrowed' && now > dueDate;
        const status = b.status === 'Returned' ? 'Returned' : 
                      isOverdue ? 'Overdue' : 'Borrowed';
        
        return {
          'Asset Name': b.asset_name,
          'Borrower': b.borrower_name,
          'Borrowed On': formatDateTime(b.borrow_date),
          'Due Date': formatDateTime(b.due_date),
          'Returned On': b.returned_date ? formatDateTime(b.returned_date) : '-',
          'Status': status,
          'Purpose': b.purpose
        };
      });
      const wsBorrowings = XLSX.utils.json_to_sheet(borrowingsData);
      XLSX.utils.book_append_sheet(wb, wsBorrowings, 'Borrowed Items');
    }
    
    if (allExpenses.length > 0) {
      const expensesData = allExpenses.map(e => ({
        'Date': formatDate(e.date),
        'Employee': e.employee_name,
        'Type': e.type,
        'Amount': parseFloat(e.amount).toFixed(2),
        'Description': e.description,
        'Status': e.status,
        'Payment Status': e.payment_status || 'Pending Payment'
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Requests');
    }
    
    XLSX.writeFile(wb, `Office_Management_System_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('All data exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting all data:', error);
    showNotification('Failed to export data', 'error');
  }
}

loadBorrowingsReport();
loadExpensesReport();
