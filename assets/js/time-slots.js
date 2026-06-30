/* AutoWash Pro - Time Slots Management Module */

// Extend AutoWashAPI with time slots methods
window.AutoWashAPI = window.AutoWashAPI || {};
window.AutoWashAPI.timeSlots = {
  getAll: () => window.AutoWashAPI.request('/api/admin/time-slots'),
  getActive: () => window.AutoWashAPI.request('/api/admin/time-slots/active'),
  create: (payload) => window.AutoWashAPI.request('/api/admin/time-slots', { method: 'POST', body: payload }),
  update: (id, payload) => window.AutoWashAPI.request(`/api/admin/time-slots/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => window.AutoWashAPI.request(`/api/admin/time-slots/${id}`, { method: 'DELETE' })
};

// Form field mappings
const TIME_SLOT_FORM_FIELDS = {
  name: 'slotName',
  startTime: 'slotStartTime',
  endTime: 'slotEndTime',
  maxCapacity: 'slotMaxCapacity',
  isActive: 'slotIsActive'
};

// Initialize time slots management on page load
function initTimeSlots() {
  console.log('[TimeSlots] initTimeSlots() called');
  const form = document.getElementById('timeslotForm');
  if (!form) {
    console.error('[TimeSlots] Form not found!');
    return;
  }

  form.setAttribute('novalidate', 'novalidate');
  
  // Form submission handler
  form.addEventListener('submit', saveTimeSlot);
  console.log('[TimeSlots] Form submit listener added');

  // Modal close handlers
  const modal = document.getElementById('timeslotModal');
  if (modal) {
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal('timeslotModal');
        form.reset();
        delete form.dataset.editingId;
      });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal('timeslotModal');
        form.reset();
        delete form.dataset.editingId;
      }
    });
    console.log('[TimeSlots] Modal close listeners added');
  } else {
    console.error('[TimeSlots] Modal not found!');
  }
}

// Load and render time slots
async function loadTimeSlots() {
  try {
    const slots = await window.AutoWashAPI.timeSlots.getAll();
    renderTimeSlotsTable(slots);
  } catch (error) {
    showToast('Lỗi tải dữ liệu khung giờ: ' + error.message);
  }
}

// Render time slots table
function renderTimeSlotsTable(slots) {
  const tbody = document.querySelector('#timeslotsTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  slots.forEach(slot => {
    // Handle both backend format (isActive, isStatus)
    const isActive = (slot.isActive !== undefined) ? slot.isActive : slot.isStatus;
    
    tbody.innerHTML += `<tr data-id="${slot.slotId}" data-name="${slot.slotName}" data-start-time="${slot.startTime}" data-end-time="${slot.endTime}" data-capacity="${slot.maxCapacity}" data-active="${isActive}">
      <td><strong>${slot.slotName || 'N/A'}</strong></td>
      <td>${slot.startTime || 'N/A'}</td>
      <td>${slot.endTime || 'N/A'}</td>
      <td>${slot.maxCapacity || 1}</td>
      <td>${getStatusBadge(isActive ? 'active' : 'inactive')}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="showEditTimeSlotModal(${slot.slotId})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTimeSlot(${slot.slotId})">Xóa</button>
      </td>
    </tr>`;
  });
}

// Show modal for adding new time slot
function showAddTimeSlotModal() {
  const form = document.getElementById('timeslotForm');
  if (!form) return;

  form.reset();
  delete form.dataset.editingId;
  
  // Set default value for status dropdown
  document.getElementById(TIME_SLOT_FORM_FIELDS.isActive).value = 'true';

  const modal = document.getElementById('timeslotModal');
  if (modal) {
    const title = modal.querySelector('.modal-title');
    if (title) title.textContent = 'Thêm khung giờ mới';
    openModal('timeslotModal');
  }
}

// Show modal for editing existing time slot
async function showEditTimeSlotModal(slotId) {
  try {
    const slots = await window.AutoWashAPI.timeSlots.getAll();
    const slot = slots.find(s => s.slotId === slotId);
    
    if (!slot) {
      showToast('Không tìm thấy khung giờ');
      return;
    }

    const form = document.getElementById('timeslotForm');
    if (!form) return;

    // Populate form with existing data
    document.getElementById(TIME_SLOT_FORM_FIELDS.name).value = slot.slotName || '';
    document.getElementById(TIME_SLOT_FORM_FIELDS.startTime).value = slot.startTime || '';
    document.getElementById(TIME_SLOT_FORM_FIELDS.endTime).value = slot.endTime || '';
    document.getElementById(TIME_SLOT_FORM_FIELDS.maxCapacity).value = slot.maxCapacity || 1;
    const isActive = (slot.isActive !== undefined) ? slot.isActive : slot.isStatus;
    document.getElementById(TIME_SLOT_FORM_FIELDS.isActive).value = isActive ? 'true' : 'false';

    form.dataset.editingId = slotId;

    const modal = document.getElementById('timeslotModal');
    if (modal) {
      const title = modal.querySelector('.modal-title');
      if (title) title.textContent = 'Chỉnh sửa khung giờ';
      openModal('timeslotModal');
    }
  } catch (error) {
    showToast('Lỗi tải dữ liệu: ' + error.message);
  }
}

// Save time slot (create or update)
async function saveTimeSlot(e) {
  e.preventDefault();
  console.log('[TimeSlots] saveTimeSlot called');

  const form = e.target;
  const slotName = document.getElementById(TIME_SLOT_FORM_FIELDS.name).value.trim();
  const startTime = document.getElementById(TIME_SLOT_FORM_FIELDS.startTime).value.trim();
  const endTime = document.getElementById(TIME_SLOT_FORM_FIELDS.endTime).value.trim();
  const maxCapacity = Number(document.getElementById(TIME_SLOT_FORM_FIELDS.maxCapacity).value || 1);
  const isActive = document.getElementById(TIME_SLOT_FORM_FIELDS.isActive).value === 'true';

  console.log('[TimeSlots] Form data:', { slotName, startTime, endTime, maxCapacity, isActive });

  // Validation
  if (!slotName || slotName.length < 2 || slotName.length > 100) {
    showToast('Tên khung giờ phải từ 2-100 ký tự');
    return;
  }

  if (!startTime || !endTime) {
    showToast('Vui lòng nhập giờ bắt đầu và kết thúc');
    return;
  }

  if (maxCapacity <= 0) {
    showToast('Dung tích tối đa phải lớn hơn 0');
    return;
  }

  const payload = {
    slotName,
    startTime,
    endTime,
    maxCapacity,
    isActive
  };

  try {
    const editingId = form.dataset.editingId;
    console.log('[TimeSlots] Editing ID:', editingId);

    if (editingId) {
      // Update existing
      console.log('[TimeSlots] Updating slot...');
      await window.AutoWashAPI.timeSlots.update(editingId, payload);
      showToast('Cập nhật khung giờ thành công!');
    } else {
      // Create new
      console.log('[TimeSlots] Creating new slot...');
      await window.AutoWashAPI.timeSlots.create(payload);
      showToast('Thêm khung giờ mới thành công!');
    }

    // Close modal and reload
    console.log('[TimeSlots] API success, closing modal...');
    closeModal('timeslotModal');
    form.reset();
    delete form.dataset.editingId;

    console.log('[TimeSlots] Thực thi location.reload()...');
    setTimeout(() => {
      console.log('[TimeSlots] Reloading page now!');
      location.reload();
    }, 800);
  } catch (error) {
    console.error('[TimeSlots] Error:', error);
    showToast('Lỗi: ' + error.message);
  }
}

// Delete time slot
async function deleteTimeSlot(slotId) {
  if (!confirm('Bạn chắc chắn muốn xóa khung giờ này?')) return;

  try {
    await window.AutoWashAPI.timeSlots.delete(slotId);
    showToast('Xóa khung giờ thành công!');
    console.log('[TimeSlots] Delete success, reloading...');
    setTimeout(() => {
      console.log('[TimeSlots] Reloading page now!');
      location.reload();
    }, 800);
  } catch (error) {
    showToast('Lỗi xóa: ' + error.message);
  }
}


