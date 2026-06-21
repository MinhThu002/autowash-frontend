/* AutoWash Pro - Wash Services Management */

// Extend AutoWashAPI with wash services endpoints
if (window.AutoWashAPI) {
  window.AutoWashAPI.washServices = {
    // Get all wash services (Admin only)
    getAll: () => window.AutoWashAPI.request('/api/admin/wash-services'),
    
    // Create a new wash service (Admin only)
    create: (data) => window.AutoWashAPI.request('/api/admin/wash-services', {
      method: 'POST',
      body: {
        serviceName: data.serviceName,
        description: data.description,
        price: data.price,
        durationMinutes: data.durationMinutes,
        isActive: data.isActive
      }
    }),
    
    // Update a wash service (Admin only)
    update: (id, data) => window.AutoWashAPI.request(`/api/admin/wash-services/${id}`, {
      method: 'PUT',
      body: {
        serviceName: data.serviceName,
        description: data.description,
        price: data.price,
        durationMinutes: data.durationMinutes,
        isActive: data.isActive
      }
    }),
    
    // Deactivate a wash service (Admin only)
    delete: (id) => window.AutoWashAPI.request(`/api/admin/wash-services/${id}`, {
      method: 'DELETE'
    })
  };
}

async function loadWashServices() {
  try {
    const services = await window.AutoWashAPI.washServices.getAll();
    renderWashServicesTable(services);
  } catch (error) {
    showToast('Lỗi tải dữ liệu dịch vụ rửa xe: ' + error.message);
  }
}

function renderWashServicesTable(services) {
  const tbody = document.querySelector('#servicesTable tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  services.forEach(s => {
    // Handle both backend format (serviceId, serviceName) and frontend format (id, name)
    const id = s.serviceId || s.id;
    const name = s.serviceName || s.name;
    const duration = s.durationMinutes || s.duration;
    const active = s.isActive ?? s.active ?? true;
    
    tbody.innerHTML += `<tr data-id="${id}" data-name="${name}" data-type="Car" data-duration="${duration}" data-price="${s.price}" data-desc="${s.description}" data-active="${active}">
      <td><strong>${name}</strong></td>
      <td>Car</td>
      <td>${duration} phút</td>
      <td>${formatCurrency(s.price)}</td>
      <td>${s.description}</td>
      <td>${getStatusBadge(active ? 'active' : 'inactive')}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editWashServiceFromRow(this)">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWashService('${id}')">Xóa</button>
      </td>
    </tr>`;
  });
}

function closeWashServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function showAddWashServiceModal() {
  const form = document.getElementById('serviceForm');
  if (!form) {
    return;
  }
  
  form.reset();
  document.getElementById('serviceId').value = '';
  const modal = document.getElementById('serviceModal');
  if (modal) modal.classList.add('active');
}

function showEditWashServiceModal(id, name, vehicleType, duration, price, description, active) {
  const form = document.getElementById('serviceForm');
  if (!form) {
    return;
  }
  
  document.getElementById('serviceId').value = id;
  document.getElementById('serviceName').value = name;
  document.getElementById('serviceVehicleType').value = vehicleType;
  document.getElementById('serviceDuration').value = duration;
  document.getElementById('servicePrice').value = price;
  document.getElementById('serviceDescription').value = description;
  document.getElementById('serviceActive').value = active ? 'true' : 'false';
  
  const modal = document.getElementById('serviceModal');
  if (modal) modal.classList.add('active');
}

function editWashServiceFromRow(btn) {
  const row = btn.closest('tr');
  const id = row.dataset.id;
  const name = row.dataset.name;
  const type = row.dataset.type;
  const duration = row.dataset.duration;
  const price = row.dataset.price;
  const desc = row.dataset.desc;
  const active = row.dataset.active === 'true';
  
  showEditWashServiceModal(id, name, type, duration, price, desc, active);
}

async function deleteWashService(id) {
  if (!confirm('Bạn chắc chắn muốn xóa dịch vụ rửa xe này không?')) {
    return;
  }
  
  try {
    await window.AutoWashAPI.washServices.delete(id);
    showToast('Xóa dịch vụ rửa xe thành công!');
    setTimeout(() => location.reload(), 500);
  } catch (error) {
    showToast('Lỗi: ' + (error.message || 'Không thể xóa dịch vụ rửa xe'));
  }
}

// Alias function for HTML button onclick
function openAddService() {
  showAddWashServiceModal();
}

async function saveWashService(e) {
  e.preventDefault();
  
  const id = document.getElementById('serviceId').value;
  const name = document.getElementById('serviceName').value;
  const vehicleType = document.getElementById('serviceVehicleType').value;
  const duration = parseInt(document.getElementById('serviceDuration').value);
  const price = parseFloat(document.getElementById('servicePrice').value);
  const description = document.getElementById('serviceDescription').value;
  const active = document.getElementById('serviceActive').value === 'true';
  
  // Validation - match backend requirements
  if (!name || !vehicleType || !duration || !price || !description) {
    showToast('Vui lòng điền đầy đủ thông tin bắt buộc');
    return;
  }
  
  const nameTrimmed = name.trim();
  const descTrimmed = description.trim();
  
  if (nameTrimmed.length < 3) {
    showToast('Lỗi: Tên dịch vụ phải dài ít nhất 3 ký tự');
    return;
  }
  
  if (nameTrimmed.length > 100) {
    showToast('Lỗi: Tên dịch vụ không được vượt quá 100 ký tự');
    return;
  }
  
  if (descTrimmed.length === 0) {
    showToast('Lỗi: Mô tả không được để trống');
    return;
  }
  
  if (duration <= 0) {
    showToast('Lỗi: Thời lượng phải lớn hơn 0');
    return;
  }
  
  if (price <= 0) {
    showToast('Lỗi: Giá phải lớn hơn 0');
    return;
  }
  
  const data = {
    serviceName: nameTrimmed,
    description: descTrimmed,
    price: price,
    durationMinutes: duration,
    isActive: active
  };
  
  try {
    if (id) {
      // Update existing service
      await window.AutoWashAPI.washServices.update(id, data);
      showToast('Cập nhật dịch vụ rửa xe thành công!');
    } else {
      // Create new service
      await window.AutoWashAPI.washServices.create(data);
      showToast('Thêm dịch vụ rửa xe thành công!');
    }
    // Reload page after successful update/create
    setTimeout(() => location.reload(), 500);
  } catch (error) {
    // Parse error message from backend response
    let errorMsg = error.message || 'Không thể lưu dịch vụ rửa xe';
    try {
      const parsed = JSON.parse(errorMsg);
      errorMsg = parsed.message || parsed.error || 'Lỗi từ server';
    } catch (e) {
      // errorMsg is plain text
    }
    
    showToast('Lỗi: ' + errorMsg);
  }
}

function initWashServices() {
  // Check if we're on the admin services page
  if (document.body.dataset.page === 'admin-services') {
    loadWashServices();
  }
  
  const form = document.getElementById('serviceForm');
  if (form) {
    // Disable HTML5 validation - use custom validation instead
    form.setAttribute('novalidate', 'novalidate');
    
    // Remove required attributes to prevent browser blocking
    form.querySelectorAll('[required]').forEach(el => {
      el.removeAttribute('required');
    });
    
    form.addEventListener('submit', saveWashService);
  }
  
  const modal = document.getElementById('serviceModal');
  if (modal) {
    // Close modal when clicking close button
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeWashServiceModal);
    }
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeWashServiceModal();
      }
    });
  }
}
