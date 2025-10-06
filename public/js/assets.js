const user = checkAuth();
displayUserInfo();
updateNavigation();

if (user.role !== 'admin') {
  window.location.href = 'dashboard.html';
}

let editingAssetId = null;

function loadAssets() {
  const assets = JSON.parse(localStorage.getItem('assets')) || [];
  const tbody = document.getElementById('assetsTableBody');
  
  if (assets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No assets added yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  assets.forEach(asset => {
    const tr = document.createElement('tr');
    const statusClass = asset.status === 'Available' ? 'status-available' : 'status-borrowed';
    
    tr.innerHTML = `
      <td>${asset.name}</td>
      <td>${asset.category}</td>
      <td>${asset.description || '-'}</td>
      <td><span class="status-badge ${statusClass}">${asset.status}</span></td>
      <td>
        <button onclick="editAsset('${asset.id}')" class="btn btn-info" style="padding: 6px 12px; margin-right: 5px;">Edit</button>
        <button onclick="deleteAsset('${asset.id}')" class="btn btn-danger" style="padding: 6px 12px;" ${asset.status === 'Borrowed' ? 'disabled' : ''}>Delete</button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function showAddAssetForm() {
  document.getElementById('assetForm').style.display = 'block';
  document.getElementById('formTitle').textContent = 'Add New Asset';
  document.getElementById('assetFormElement').reset();
  document.getElementById('assetId').value = '';
  editingAssetId = null;
}

function hideAssetForm() {
  document.getElementById('assetForm').style.display = 'none';
  document.getElementById('assetFormElement').reset();
  editingAssetId = null;
}

function editAsset(id) {
  const assets = JSON.parse(localStorage.getItem('assets')) || [];
  const asset = assets.find(a => a.id === id);
  
  if (asset) {
    document.getElementById('assetForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Edit Asset';
    document.getElementById('assetId').value = asset.id;
    document.getElementById('assetName').value = asset.name;
    document.getElementById('assetCategory').value = asset.category;
    document.getElementById('assetDescription').value = asset.description || '';
    editingAssetId = id;
  }
}

function deleteAsset(id) {
  if (confirm('Are you sure you want to delete this asset?')) {
    let assets = JSON.parse(localStorage.getItem('assets')) || [];
    assets = assets.filter(a => a.id !== id);
    localStorage.setItem('assets', JSON.stringify(assets));
    showNotification('Asset deleted successfully', 'success');
    loadAssets();
  }
}

document.getElementById('assetFormElement').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const assetId = document.getElementById('assetId').value;
  const name = document.getElementById('assetName').value;
  const category = document.getElementById('assetCategory').value;
  const description = document.getElementById('assetDescription').value;
  
  let assets = JSON.parse(localStorage.getItem('assets')) || [];
  
  if (assetId) {
    const index = assets.findIndex(a => a.id === assetId);
    if (index !== -1) {
      assets[index].name = name;
      assets[index].category = category;
      assets[index].description = description;
      showNotification('Asset updated successfully', 'success');
    }
  } else {
    const newAsset = {
      id: generateId(),
      name: name,
      category: category,
      description: description,
      status: 'Available',
      createdAt: new Date().toISOString()
    };
    assets.push(newAsset);
    showNotification('Asset added successfully', 'success');
  }
  
  localStorage.setItem('assets', JSON.stringify(assets));
  hideAssetForm();
  loadAssets();
});

loadAssets();
