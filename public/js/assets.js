const user = checkAuth();
displayUserInfo();
updateNavigation();

if (user.role !== 'admin') {
  window.location.href = 'dashboard.html';
}

let editingAssetId = null;

async function loadAssets() {
  try {
    const response = await fetch('/api/assets');
    const assets = await response.json();
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
  } catch (error) {
    console.error('Error loading assets:', error);
    showNotification('Failed to load assets', 'error');
  }
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

async function editAsset(id) {
  try {
    const response = await fetch('/api/assets');
    const assets = await response.json();
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
  } catch (error) {
    console.error('Error editing asset:', error);
    showNotification('Failed to load asset', 'error');
  }
}

async function deleteAsset(id) {
  if (confirm('Are you sure you want to delete this asset?')) {
    try {
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        showNotification('Asset deleted successfully', 'success');
        loadAssets();
      } else {
        showNotification('Failed to delete asset', 'error');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      showNotification('Failed to delete asset', 'error');
    }
  }
}

document.getElementById('assetFormElement').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const assetId = document.getElementById('assetId').value;
  const name = document.getElementById('assetName').value;
  const category = document.getElementById('assetCategory').value;
  const description = document.getElementById('assetDescription').value;
  
  try {
    if (assetId) {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, description })
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('Asset updated successfully', 'success');
      }
    } else {
      const newId = generateId();
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, name, category, description })
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification('Asset added successfully', 'success');
      }
    }
    
    hideAssetForm();
    loadAssets();
  } catch (error) {
    console.error('Error saving asset:', error);
    showNotification('Failed to save asset', 'error');
  }
});

loadAssets();
