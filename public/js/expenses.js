const user = checkAuth();
displayUserInfo();
updateNavigation();

if (user.role === 'admin') {
  document.getElementById('expenseFormContainer').style.display = 'none';
}

if (user.role !== 'manager' && user.role !== 'admin') {
  document.getElementById('approvalSection').style.display = 'none';
  document.getElementById('allExpensesSection').style.display = 'none';
}

function loadMyExpenses() {
  const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  const myExpenses = expenses.filter(e => e.employeeUsername === user.username);
  const tbody = document.getElementById('myExpensesTableBody');
  
  if (myExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No expense requests</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  myExpenses.forEach(e => {
    const statusClass = e.status === 'Approved' ? 'status-approved' : 
                       e.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    const paymentClass = e.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(e.date)}</td>
      <td>${e.type}</td>
      <td>₹${parseFloat(e.amount).toFixed(2)}</td>
      <td>${e.description}</td>
      <td><span class="status-badge ${statusClass}">${e.status}</span></td>
      <td><span class="status-badge ${paymentClass}">${e.paymentStatus || 'Pending Payment'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function loadPendingApprovals() {
  if (user.role !== 'manager' && user.role !== 'admin') {
    return;
  }
  
  const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  const pendingExpenses = expenses.filter(e => e.status === 'Pending');
  const tbody = document.getElementById('pendingExpensesTableBody');
  
  if (pendingExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pending approvals</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  pendingExpenses.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(e.date)}</td>
      <td>${e.employeeName}</td>
      <td>${e.type}</td>
      <td>₹${parseFloat(e.amount).toFixed(2)}</td>
      <td>${e.description}</td>
      <td>
        <button onclick="approveExpense('${e.id}')" class="btn btn-success" style="padding: 6px 12px; margin-right: 5px;">Approve</button>
        <button onclick="rejectExpense('${e.id}')" class="btn btn-danger" style="padding: 6px 12px;">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadAllExpenses() {
  if (user.role !== 'manager' && user.role !== 'admin') {
    return;
  }
  
  filterExpenses();
}

function filterExpenses() {
  const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  const filterValue = document.getElementById('statusFilter').value;
  
  let filteredExpenses = expenses;
  if (filterValue !== 'all') {
    filteredExpenses = expenses.filter(e => e.status === filterValue);
  }
  
  const tbody = document.getElementById('allExpensesTableBody');
  
  if (filteredExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No expense requests</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  filteredExpenses.forEach(e => {
    const statusClass = e.status === 'Approved' ? 'status-approved' : 
                       e.status === 'Rejected' ? 'status-rejected' : 'status-pending';
    const paymentClass = e.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(e.date)}</td>
      <td>${e.employeeName}</td>
      <td>${e.type}</td>
      <td>₹${parseFloat(e.amount).toFixed(2)}</td>
      <td><span class="status-badge ${statusClass}">${e.status}</span></td>
      <td><span class="status-badge ${paymentClass}">${e.paymentStatus || 'Pending Payment'}</span></td>
      <td>
        ${e.status === 'Approved' && e.paymentStatus !== 'Paid' ? 
          `<button onclick="markAsPaid('${e.id}')" class="btn btn-success" style="padding: 6px 12px;">Mark as Paid</button>` : 
          '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function approveExpense(expenseId) {
  if (confirm('Are you sure you want to approve this expense?')) {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const index = expenses.findIndex(e => e.id === expenseId);
    
    if (index !== -1) {
      expenses[index].status = 'Approved';
      expenses[index].approvedBy = user.username;
      expenses[index].approvedDate = new Date().toISOString();
      expenses[index].paymentStatus = 'Pending Payment';
      
      localStorage.setItem('expenses', JSON.stringify(expenses));
      showNotification('Expense approved successfully', 'success');
      loadPendingApprovals();
      loadAllExpenses();
    }
  }
}

function rejectExpense(expenseId) {
  if (confirm('Are you sure you want to reject this expense?')) {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const index = expenses.findIndex(e => e.id === expenseId);
    
    if (index !== -1) {
      expenses[index].status = 'Rejected';
      expenses[index].rejectedBy = user.username;
      expenses[index].rejectedDate = new Date().toISOString();
      
      localStorage.setItem('expenses', JSON.stringify(expenses));
      showNotification('Expense rejected', 'success');
      loadPendingApprovals();
      loadAllExpenses();
    }
  }
}

function markAsPaid(expenseId) {
  if (confirm('Mark this expense as paid?')) {
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const index = expenses.findIndex(e => e.id === expenseId);
    
    if (index !== -1) {
      expenses[index].paymentStatus = 'Paid';
      expenses[index].paidDate = new Date().toISOString();
      
      localStorage.setItem('expenses', JSON.stringify(expenses));
      showNotification('Expense marked as paid', 'success');
      loadAllExpenses();
      loadMyExpenses();
    }
  }
}

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
document.getElementById('expenseDate').value = today.toISOString().split('T')[0];
document.getElementById('employeeName').value = user.name;

document.getElementById('expenseForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const date = document.getElementById('expenseDate').value;
  const type = document.getElementById('expenseType').value;
  const amount = document.getElementById('expenseAmount').value;
  const description = document.getElementById('expenseDescription').value;
  
  const expense = {
    id: generateId(),
    date: date,
    employeeUsername: user.username,
    employeeName: user.name,
    type: type,
    amount: amount,
    description: description,
    status: 'Pending',
    paymentStatus: 'Pending Payment',
    createdAt: new Date().toISOString()
  };
  
  let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  expenses.push(expense);
  localStorage.setItem('expenses', JSON.stringify(expenses));
  
  showNotification('Expense request submitted successfully', 'success');
  this.reset();
  
  const newToday = new Date();
  newToday.setMinutes(newToday.getMinutes() - newToday.getTimezoneOffset());
  document.getElementById('expenseDate').value = newToday.toISOString().split('T')[0];
  document.getElementById('employeeName').value = user.name;
  
  loadMyExpenses();
});

loadMyExpenses();
loadPendingApprovals();
loadAllExpenses();
