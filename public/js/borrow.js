const user = checkAuth();
displayUserInfo();
updateNavigation();

function loadAvailableAssets() {
  const assets = JSON.parse(localStorage.getItem('assets')) || [];
  const availableAssets = assets.filter(a => a.status === 'Available');
  const select = document.getElementById('borrowAsset');
  
  select.innerHTML = '<option value="">Select an asset</option>';
  
  availableAssets.forEach(asset => {
    const option = document.createElement('option');
    option.value = asset.id;
    option.textContent = `${asset.name} (${asset.category})`;
    select.appendChild(option);
  });
}

function loadMyBorrowings() {
  const borrowings = JSON.parse(localStorage.getItem('borrowings')) || [];
  const myBorrowings = borrowings.filter(b => b.borrowerUsername === user.username);
  const tbody = document.getElementById('myBorrowingsTableBody');
  
  if (myBorrowings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No borrowed items</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  myBorrowings.forEach(b => {
    const now = new Date();
    const dueDate = new Date(b.dueDate);
    const isOverdue = b.status === 'Borrowed' && now > dueDate;
    const statusClass = b.status === 'Returned' ? 'status-returned' : 
                       isOverdue ? 'status-overdue' : 'status-borrowed';
    const statusText = b.status === 'Returned' ? 'Returned' : 
                      isOverdue ? 'Overdue' : 'Borrowed';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.assetName}</td>
      <td>${formatDateTime(b.borrowDate)}</td>
      <td>${formatDateTime(b.dueDate)}</td>
      <td>${b.purpose}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        ${b.status === 'Borrowed' ? 
          `<button onclick="returnItem('${b.id}')" class="btn btn-success" style="padding: 6px 12px;">Return</button>` : 
          '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadAllBorrowings() {
  if (user.role !== 'admin' && user.role !== 'manager') {
    document.getElementById('allBorrowingsSection').style.display = 'none';
    return;
  }
  
  const borrowings = JSON.parse(localStorage.getItem('borrowings')) || [];
  const tbody = document.getElementById('allBorrowingsTableBody');
  
  if (borrowings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No borrowings recorded</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  borrowings.forEach(b => {
    const now = new Date();
    const dueDate = new Date(b.dueDate);
    const isOverdue = b.status === 'Borrowed' && now > dueDate;
    const statusClass = b.status === 'Returned' ? 'status-returned' : 
                       isOverdue ? 'status-overdue' : 'status-borrowed';
    const statusText = b.status === 'Returned' ? 'Returned' : 
                      isOverdue ? 'Overdue' : 'Borrowed';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.assetName}</td>
      <td>${b.borrowerName}</td>
      <td>${formatDateTime(b.borrowDate)}</td>
      <td>${formatDateTime(b.dueDate)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        ${b.status === 'Borrowed' && user.role === 'admin' ? 
          `<button onclick="returnItemAdmin('${b.id}')" class="btn btn-success" style="padding: 6px 12px;">Mark Returned</button>` : 
          '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function returnItem(borrowingId) {
  if (confirm('Are you sure you want to return this item?')) {
    let borrowings = JSON.parse(localStorage.getItem('borrowings')) || [];
    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    
    const borrowingIndex = borrowings.findIndex(b => b.id === borrowingId);
    if (borrowingIndex !== -1) {
      const borrowing = borrowings[borrowingIndex];
      borrowing.status = 'Returned';
      borrowing.returnedDate = new Date().toISOString();
      
      const assetIndex = assets.findIndex(a => a.id === borrowing.assetId);
      if (assetIndex !== -1) {
        assets[assetIndex].status = 'Available';
      }
      
      localStorage.setItem('borrowings', JSON.stringify(borrowings));
      localStorage.setItem('assets', JSON.stringify(assets));
      
      showNotification('Item returned successfully', 'success');
      loadMyBorrowings();
      loadAllBorrowings();
      loadAvailableAssets();
    }
  }
}

function returnItemAdmin(borrowingId) {
  returnItem(borrowingId);
}

document.getElementById('borrowerName').value = user.name;

const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
document.getElementById('borrowDate').value = now.toISOString().slice(0, 16);

const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
document.getElementById('dueDate').value = tomorrow.toISOString().slice(0, 16);

document.getElementById('borrowForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const assetId = document.getElementById('borrowAsset').value;
  const borrowDate = document.getElementById('borrowDate').value;
  const dueDate = document.getElementById('dueDate').value;
  const purpose = document.getElementById('borrowPurpose').value;
  
  if (!assetId) {
    showNotification('Please select an asset', 'error');
    return;
  }
  
  let assets = JSON.parse(localStorage.getItem('assets')) || [];
  const assetIndex = assets.findIndex(a => a.id === assetId);
  
  if (assetIndex === -1) {
    showNotification('Asset not found', 'error');
    return;
  }
  
  const asset = assets[assetIndex];
  asset.status = 'Borrowed';
  
  const borrowing = {
    id: generateId(),
    assetId: assetId,
    assetName: asset.name,
    borrowerUsername: user.username,
    borrowerName: user.name,
    borrowDate: borrowDate,
    dueDate: dueDate,
    purpose: purpose,
    status: 'Borrowed',
    createdAt: new Date().toISOString()
  };
  
  let borrowings = JSON.parse(localStorage.getItem('borrowings')) || [];
  borrowings.push(borrowing);
  
  localStorage.setItem('assets', JSON.stringify(assets));
  localStorage.setItem('borrowings', JSON.stringify(borrowings));
  
  showNotification('Item borrowed successfully', 'success');
  this.reset();
  document.getElementById('borrowerName').value = user.name;
  
  const newNow = new Date();
  newNow.setMinutes(newNow.getMinutes() - newNow.getTimezoneOffset());
  document.getElementById('borrowDate').value = newNow.toISOString().slice(0, 16);
  
  const newTomorrow = new Date(newNow);
  newTomorrow.setDate(newTomorrow.getDate() + 1);
  newTomorrow.setMinutes(newTomorrow.getMinutes() - newTomorrow.getTimezoneOffset());
  document.getElementById('dueDate').value = newTomorrow.toISOString().slice(0, 16);
  
  loadAvailableAssets();
  loadMyBorrowings();
  loadAllBorrowings();
});

loadAvailableAssets();
loadMyBorrowings();
loadAllBorrowings();
