/* AutoWash Pro - Dashboard & Page Renderers */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (!page) return;

  const renderers = {
    'customer-dashboard': renderCustomerDashboard,
    'customer-vehicles': renderVehiclesPage,
    'booking-history': renderBookingHistory,
    'loyalty': renderLoyaltyPage,
    'promotions': renderPromotionsPage,
    'admin-dashboard': renderAdminDashboard,
    'admin-customers': renderAdminCustomers,
    'admin-bookings': renderAdminBookings,
    'admin-services': renderAdminServices,
    'admin-loyalty-tiers': renderAdminTiers,
    'admin-promotions': renderAdminPromotions,
    'admin-analytics': renderAdminAnalytics,
    'staff-schedule': renderStaffSchedule
  };

  const fn = renderers[page];
  if (fn) fn();

  setupTableFiltersForPage(page);
  initCrudModals(page);
});

function setupTableFiltersForPage(page) {
  const configs = {
    'booking-history': { tableId: 'bookingsTable', statusId: 'filterStatus', dateFromId: 'filterDateFrom', dateToId: 'filterDateTo' },
    'admin-customers': { tableId: 'customersTable', tierId: 'filterTier', searchId: 'searchCustomer' },
    'admin-bookings': { tableId: 'adminBookingsTable', statusId: 'filterStatus' }
  };
  if (configs[page]) setupTableFilters(configs[page]);
}

function renderCustomerDashboard() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);
  const nextTierIdx = MOCK_DATA.loyaltyTiers.findIndex(t => t.id === customer.tier) + 1;
  const nextTier = MOCK_DATA.loyaltyTiers[nextTierIdx];

  setUserNav(customer);
  document.getElementById('welcomeName').textContent = customer.name;
  document.getElementById('currentTier').textContent = tier.name;
  document.getElementById('pointsBalance').textContent = customer.points.toLocaleString('vi-VN');
  document.getElementById('totalVisits').textContent = customer.totalVisits;
  document.getElementById('totalSpending').textContent = formatCurrency(customer.totalSpending);

  if (nextTier) {
    const visitProgress = Math.min(100, (customer.totalVisits / nextTier.requiredVisits) * 100);
    const spendProgress = Math.min(100, (customer.totalSpending / nextTier.requiredSpending) * 100);
    const progress = Math.round((visitProgress + spendProgress) / 2);
    document.getElementById('nextTierName').textContent = nextTier.name;
    document.getElementById('tierProgressFill').style.width = progress + '%';
    document.getElementById('tierProgressText').textContent = `${progress}% đến ${nextTier.name}`;
  } else {
    document.getElementById('nextTierName').textContent = 'Tối đa';
    document.getElementById('tierProgressFill').style.width = '100%';
    document.getElementById('tierProgressText').textContent = 'Bạn đã ở hạng cao nhất!';
  }

  const bookings = getBookings().filter(b => b.customerId === customer.id);
  const upcoming = bookings.find(b => ['pending', 'confirmed'].includes(b.status) && b.date >= new Date().toISOString().split('T')[0]);
  const upcomingEl = document.getElementById('upcomingBooking');
  if (upcoming) {
    upcomingEl.innerHTML = `<div class="list-item"><div><strong>${upcoming.serviceName}</strong><br><span class="list-item-meta">${formatDate(upcoming.date)} • ${upcoming.time} • ${upcoming.vehiclePlate}</span></div><div>${getStatusBadge(upcoming.status)}</div></div>`;
  } else {
    upcomingEl.innerHTML = '<p class="text-muted">Chưa có lịch hẹn sắp tới. <a href="booking.html">Đặt lịch ngay</a></p>';
  }

  const historyEl = document.getElementById('recentHistory');
  const completed = bookings.filter(b => b.status === 'completed').slice(0, 5);
  historyEl.innerHTML = completed.length
    ? completed.map(b => `<div class="list-item"><div><strong>${b.serviceName}</strong><br><span class="list-item-meta">${formatDate(b.date)} • ${b.vehiclePlate}</span></div><div>${formatCurrency(b.totalPrice)}</div></div>`).join('')
    : '<p class="text-muted">Chưa có lịch sử.</p>';

  const promosEl = document.getElementById('recommendedPromos');
  getPromotions().filter(p => p.status === 'active').slice(0, 3).forEach(p => {
    const disc = p.discountType === 'percent' ? `${p.discountValue}%` : formatCurrency(p.discountValue);
    promosEl.innerHTML += `<div class="promotion-card"><h4>${p.name}</h4><p class="text-muted">${p.description}</p><span class="discount">-${disc}</span><a href="promotions.html" class="btn btn-sm btn-primary" style="margin-top:0.5rem">Xem chi tiết</a></div>`;
  });
}

function renderVehiclesPage() {
  const customer = getCurrentCustomer();
  setUserNav(customer);
  const list = document.getElementById('vehiclesList');
  const vehicles = getVehicles().filter(v => v.customerId === customer.id);

  if (!vehicles.length) {
    list.innerHTML = '<div class="empty-state"><div class="icon">🚗</div><p>Chưa có xe nào. Thêm xe để đặt lịch.</p></div>';
    return;
  }

  list.innerHTML = vehicles.map(v => `
    <div class="vehicle-card" data-id="${v.id}">
      <div class="vehicle-card-info">
        <h4>${v.licensePlate}</h4>
        <p>${v.brand} • ${v.vehicleType} • ${v.color}</p>
        ${v.notes ? `<p class="text-muted">${v.notes}</p>` : ''}
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editVehicle('${v.id}')">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteVehicle('${v.id}')">Xóa</button>
      </div>
    </div>`).join('');
}

function saveVehicle(e) {
  e.preventDefault();
  const customer = getCurrentCustomer();
  const id = document.getElementById('vehicleId').value;
  const data = {
    id: id || 'veh-' + Date.now(),
    customerId: customer.id,
    licensePlate: document.getElementById('vehiclePlate').value.trim(),
    vehicleType: document.getElementById('vehicleType').value,
    brand: document.getElementById('vehicleBrand').value.trim(),
    color: document.getElementById('vehicleColor').value.trim(),
    notes: document.getElementById('vehicleNotes').value.trim()
  };
  if (!data.licensePlate || !data.brand) {
    showToast('Vui lòng nhập biển số và hãng xe.');
    return;
  }
  let vehicles = getVehicles();
  if (id) {
    vehicles = vehicles.map(v => v.id === id ? { ...v, ...data } : v);
  } else {
    vehicles.push(data);
  }
  saveToStorage('vehicles', vehicles);
  closeModal('vehicleModal');
  showToast(id ? 'Cập nhật xe thành công!' : 'Thêm xe thành công!');
  renderVehiclesPage();
}

function editVehicle(id) {
  const v = getVehicles().find(x => x.id === id);
  if (!v) return;
  document.getElementById('vehicleModalTitle').textContent = 'Sửa xe';
  document.getElementById('vehicleId').value = v.id;
  document.getElementById('vehiclePlate').value = v.licensePlate;
  document.getElementById('vehicleType').value = v.vehicleType;
  document.getElementById('vehicleBrand').value = v.brand;
  document.getElementById('vehicleColor').value = v.color;
  document.getElementById('vehicleNotes').value = v.notes || '';
  openModal('vehicleModal');
}

function deleteVehicle(id) {
  if (!confirm('Bạn có chắc muốn xóa xe này?')) return;
  saveToStorage('vehicles', getVehicles().filter(v => v.id !== id));
  showToast('Đã xóa xe.');
  renderVehiclesPage();
}

function openAddVehicle() {
  document.getElementById('vehicleForm').reset();
  document.getElementById('vehicleId').value = '';
  document.getElementById('vehicleModalTitle').textContent = 'Thêm xe mới';
  openModal('vehicleModal');
}

function renderBookingHistory() {
  const customer = getCurrentCustomer();
  setUserNav(customer);
  const tbody = document.querySelector('#bookingsTable tbody');
  getBookings().filter(b => b.customerId === customer.id).forEach(b => {
    tbody.innerHTML += `<tr data-status="${b.status}" data-date="${b.date}">
      <td><strong>${b.id}</strong></td>
      <td>${formatDate(b.date)}</td>
      <td>${b.time}</td>
      <td>${b.vehiclePlate}</td>
      <td>${b.serviceName}</td>
      <td>${getStatusBadge(b.status)}</td>
      <td>${formatCurrency(b.totalPrice)}</td>
      <td>${b.pointsEarned || '-'}</td>
    </tr>`;
  });
}

function renderLoyaltyPage() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);
  setUserNav(customer);

  document.getElementById('loyaltyTierName').textContent = tier.name;
  document.getElementById('loyaltyPoints').textContent = customer.points.toLocaleString('vi-VN');
  document.querySelector('.current-tier-card')?.classList.add(customer.tier);

  const benefitsEl = document.getElementById('tierBenefitsList');
  benefitsEl.innerHTML = tier.benefits.map(b => `<li>${b}</li>`).join('');

  const nextIdx = MOCK_DATA.loyaltyTiers.findIndex(t => t.id === customer.tier) + 1;
  const next = MOCK_DATA.loyaltyTiers[nextIdx];
  if (next) {
    document.getElementById('loyaltyNextTier').textContent = next.name;
    const p = Math.min(100, Math.round(((customer.totalVisits / next.requiredVisits) + (customer.totalSpending / next.requiredSpending)) / 2 * 100));
    document.getElementById('loyaltyProgressFill').style.width = p + '%';
    document.getElementById('loyaltyProgressLabel').textContent = `${p}% — Cần ${next.requiredVisits} lượt & ${formatCurrency(next.requiredSpending)}`;
  }

  const txEl = document.querySelector('#pointsHistory tbody');
  MOCK_DATA.loyaltyTransactions.filter(t => t.customerId === customer.id).forEach(t => {
    const sign = t.points > 0 ? '+' : '';
    txEl.innerHTML += `<tr><td>${formatDate(t.date)}</td><td>${t.description}</td><td><span class="${t.points > 0 ? 'text-primary' : 'text-muted'}">${sign}${t.points}</span></td></tr>`;
  });

  const rewardsEl = document.getElementById('rewardsList');
  MOCK_DATA.rewards.forEach(r => {
    rewardsEl.innerHTML += `<div class="reward-item"><h4>${r.name}</h4><p class="text-muted">${r.description}</p><div class="points-cost">${r.pointsCost} điểm</div><button class="btn btn-sm btn-primary" onclick="redeemReward('${r.id}', ${r.pointsCost})">Đổi thưởng</button></div>`;
  });
}

function redeemReward(id, cost) {
  const customer = getCurrentCustomer();
  if (customer.points < cost) {
    showToast('Không đủ điểm để đổi thưởng.');
    return;
  }
  showToast('Đổi thưởng thành công! Voucher đã được thêm vào tài khoản.');
}

function renderPromotionsPage() {
  const customer = getCurrentCustomer();
  setUserNav(customer);
  const grid = document.getElementById('promotionsGrid');
  getPromotions().filter(p => p.status === 'active').forEach(p => {
    const disc = p.discountType === 'percent' ? `${p.discountValue}%` : formatCurrency(p.discountValue);
    const tierLabel = p.targetTier === 'all' ? 'Tất cả hạng' : getTierById(p.targetTier).name;
    grid.innerHTML += `
      <div class="promotion-card">
        <h4>${p.name}</h4>
        <p class="text-muted">${p.description}</p>
        <span class="discount">Giảm ${disc}</span>
        <p class="text-muted" style="font-size:0.8125rem">HSD: ${formatDate(p.startDate)} - ${formatDate(p.endDate)}</p>
        <p style="font-size:0.8125rem">Áp dụng: ${tierLabel}</p>
        <button class="btn btn-sm btn-primary" onclick="usePromotion('${p.id}')">Sử dụng</button>
      </div>`;
  });
}

function usePromotion(id) {
  showToast('Khuyến mãi đã được áp dụng! Chuyển đến trang đặt lịch...');
  setTimeout(() => { window.location.href = 'booking.html'; }, 1000);
}

function renderAdminDashboard() {
  const d = MOCK_DATA.analyticsData;
  document.getElementById('statTotalBookings').textContent = d.totalBookings.toLocaleString('vi-VN');
  document.getElementById('statTodayBookings').textContent = d.todayBookings;
  document.getElementById('statRevenue').textContent = formatCurrency(d.totalRevenue);
  document.getElementById('statNewCustomers').textContent = d.newCustomers;
  document.getElementById('statRepeatCustomers').textContent = d.repeatCustomers;
  document.getElementById('statActivePromos').textContent = d.activePromotions;

  renderBarChart('revenueChart', d.monthlyRevenue.slice(-6), ['T1','T2','T3','T4','T5','T6']);
  renderTierChart(d.customersByTier);

  const tbody = document.querySelector('#recentBookingsTable tbody');
  getBookings().slice(0, 8).forEach(b => {
    tbody.innerHTML += `<tr>
      <td>${b.id}</td><td>${b.customerName}</td><td>${b.serviceName}</td>
      <td>${formatDate(b.date)} ${b.time}</td><td>${getStatusBadge(b.status)}</td>
      <td>${formatCurrency(b.totalPrice)}</td></tr>`;
  });
}

function renderAdminCustomers() {
  const tbody = document.querySelector('#customersTable tbody');
  MOCK_DATA.customers.forEach(c => {
    tbody.innerHTML += `<tr data-tier="${c.tier}">
      <td><strong>${c.name}</strong></td><td>${c.phone}</td><td>${c.email}</td>
      <td>${getTierBadge(c.tier)}</td><td>${c.points}</td><td>${c.totalVisits}</td>
      <td>${formatCurrency(c.totalSpending)}</td><td>${getStatusBadge(c.status)}</td></tr>`;
  });
}

function renderAdminBookings() {
  const tbody = document.querySelector('#adminBookingsTable tbody');
  getBookings().forEach(b => {
    tbody.innerHTML += `<tr data-status="${b.status}" data-id="${b.id}">
      <td>${b.customerName}</td><td>${b.vehiclePlate}</td><td>${b.serviceName}</td>
      <td>${formatDate(b.date)}</td><td>${b.time}</td><td>${getStatusBadge(b.status)}</td>
      <td>${formatCurrency(b.totalPrice)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="updateBookingStatus('${b.id}','confirmed')">Xác nhận</button>
        <button class="btn btn-sm btn-primary" onclick="updateBookingStatus('${b.id}','in_progress')">Đang rửa</button>
        <button class="btn btn-sm btn-primary" onclick="updateBookingStatus('${b.id}','completed')">Hoàn thành</button>
        <button class="btn btn-sm btn-danger" onclick="updateBookingStatus('${b.id}','cancelled')">Hủy</button>
      </td></tr>`;
  });
}

function updateBookingStatus(id, status) {
  const bookings = getBookings().map(b => b.id === id ? { ...b, status } : b);
  saveToStorage('bookings', bookings);
  showToast('Cập nhật trạng thái thành công!');
  location.reload();
}

function renderAdminServices() {
  const tbody = document.querySelector('#servicesTable tbody');
  getServices().forEach(s => {
    tbody.innerHTML += `<tr data-id="${s.id}">
      <td><strong>${s.name}</strong></td><td>${s.vehicleType}</td><td>${s.duration} phút</td>
      <td>${formatCurrency(s.price)}</td><td>${s.description}</td>
      <td>${getStatusBadge(s.active ? 'active' : 'inactive')}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editService('${s.id}')">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteService('${s.id}')">Xóa</button>
      </td></tr>`;
  });
}

function renderAdminTiers() {
  const tbody = document.querySelector('#tiersTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  MOCK_DATA.loyaltyTiers.forEach(t => {
    const activeStatus = t.isActive ?? t.active ?? true;
    tbody.innerHTML += `<tr data-id="${t.id || t.tierId}">
      <td><strong>${t.name || t.tierName}</strong></td>
      <td>${formatCurrency(t.minSpending ?? t.requiredSpending ?? 0)}</td>
      <td>${t.minVisits ?? t.requiredVisits ?? 0} lượt</td>
      <td>x${t.pointMultiplier ?? t.pointRate ?? 1}</td>
      <td>${t.bookingWindowDays ?? t.bookingWindow ?? 7} ngày</td>
      <td>${t.discountPercent}%</td>
      <td>${t.priorityLevel ?? 1}</td>
      <td>${getStatusBadge(activeStatus ? 'active' : 'inactive')}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editLoyaltyTier('${t.id || t.tierId}')">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteLoyaltyTier('${t.id || t.tierId}')">Xóa</button>
      </td></tr>`;
  });
}

function renderAdminPromotions() {
  const tbody = document.querySelector('#promotionsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const select = document.getElementById('promoTier');
  if (select) {
    select.innerHTML = '<option value="all">Tất cả</option>';
    MOCK_DATA.loyaltyTiers.forEach(t => {
      const activeStatus = t.isActive ?? t.active ?? true;
      if (activeStatus) {
        select.innerHTML += `<option value="${t.id || t.tierId}">${t.name || t.tierName}+</option>`;
      }
    });
  }

  getPromotions().forEach(p => {
    const disc = p.discountType === 'percent' ? `${p.discountValue}%` : formatCurrency(p.discountValue);
    const tierName = p.targetTier === 'all' || !p.targetTier ? 'Tất cả' : (getTierById(p.targetTier)?.name || 'Tất cả');
    tbody.innerHTML += `<tr data-id="${p.id}">
      <td><strong>${p.name}</strong></td><td>${p.description}</td><td>${disc}</td>
      <td>${formatDate(p.startDate)}</td><td>${formatDate(p.endDate)}</td>
      <td>${tierName}</td>
      <td>${getStatusBadge(p.status)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editPromotion('${p.id}')">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deletePromotion('${p.id}')">Xóa</button>
      </td></tr>`;
  });
}

function renderAdminAnalytics() {
  const d = MOCK_DATA.analyticsData;
  renderBarChart('analyticsRevenue', d.monthlyRevenue.slice(-6), ['T7','T8','T9','T10','T11','T12']);
  renderBarChart('analyticsBookings', d.bookingTrend.slice(-6), ['T7','T8','T9','T10','T11','T12'], true);
  renderTierChart(d.customersByTier, 'analyticsTierChart');

  document.getElementById('rewardUsageRate').textContent = d.rewardUsageRate + '%';
  document.getElementById('rewardUsageFill').style.width = d.rewardUsageRate + '%';
  

  const topEl = document.getElementById('topCustomers');
  d.topLoyalCustomers.forEach((c, i) => {
    topEl.innerHTML += `<li><span><span class="rank">${i + 1}</span>${c.name}</span><span>${c.visits} lượt • ${formatCurrency(c.spending)}</span></li>`;
  });

  const svcEl = document.getElementById('topServices');
  d.topServices.forEach(s => {
    svcEl.innerHTML += `<li><span>${s.name}</span><span>${s.count} lượt</span></li>`;
  });
}

function renderStaffSchedule() {
  const container = document.getElementById('scheduleList');
  const schedule = loadFromStorage('staffSchedule', MOCK_DATA.staffSchedule);
  container.innerHTML = schedule.map(s => `
    <div class="schedule-item">
      <div class="schedule-time">${s.time}</div>
      <div class="schedule-details">
        <h4>${s.customerName}</h4>
        <p>${s.vehicle} • ${s.licensePlate} • ${s.service}</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
        ${getStatusBadge(s.status)}
        ${s.status !== 'in_progress' ? `<button class="btn btn-sm btn-primary" onclick="updateScheduleStatus('${s.id}','in_progress')">Bắt đầu</button>` : ''}
        ${s.status !== 'completed' ? `<button class="btn btn-sm btn-secondary" onclick="updateScheduleStatus('${s.id}','completed')">Hoàn thành</button>` : ''}
      </div>
    </div>`).join('');
}

function updateScheduleStatus(id, status) {
  let schedule = loadFromStorage('staffSchedule', [...MOCK_DATA.staffSchedule]);
  schedule = schedule.map(s => s.id === id ? { ...s, status } : s);
  saveToStorage('staffSchedule', schedule);
  showToast('Cập nhật lịch thành công!');
  renderStaffSchedule();
}

function setUserNav(customer) {
  const user = requireAuth(['customer']);
  if (!user) return;
  const name = customer?.name || user.name;
  document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
  document.querySelectorAll('.user-tier').forEach(el => {
    if (customer) el.textContent = getTierById(customer.tier).name;
  });
  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = getUserInitials(name));
}

function renderBarChart(containerId, data, labels, small) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...data);
  container.innerHTML = '<div class="chart-container">' +
    data.map((v, i) => `<div class="chart-bar" style="height:${Math.round((v / max) * 100)}%" data-value="${small ? v : formatCurrency(v)}"></div>`).join('') +
    '</div><div class="chart-labels">' + labels.map(l => `<span>${l}</span>`).join('') + '</div>';
}

function renderTierChart(data, containerId) {
  const el = document.getElementById(containerId || 'tierChart');
  if (!el) return;
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const colors = { member: '#94a3b8', silver: '#64748b', gold: '#f59e0b', platinum: '#8b5cf6' };
  let gradient = [];
  let acc = 0;
  Object.entries(data).forEach(([tier, count]) => {
    const pct = (count / total) * 100;
    gradient.push(`${colors[tier]} ${acc}% ${acc + pct}%`);
    acc += pct;
  });
  el.innerHTML = `<div class="donut-chart" style="background:conic-gradient(${gradient.join(',')})"></div>
    <div class="donut-legend" style="margin-top:1rem">
      ${Object.entries(data).map(([t, c]) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[t]}"></span>${getTierById(t).name}: ${c}</div>`).join('')}
    </div>`;
}

function initCrudModals(page) {
  document.getElementById('vehicleForm')?.addEventListener('submit', saveVehicle);
  document.getElementById('serviceForm')?.addEventListener('submit', saveService);
  document.getElementById('promotionForm')?.addEventListener('submit', savePromotion);
  document.getElementById('tierForm')?.addEventListener('submit', saveLoyaltyTier);
}

function saveService(e) {
  e.preventDefault();
  const id = document.getElementById('serviceId').value;
  const data = {
    id: id || 'svc-' + Date.now(),
    name: document.getElementById('serviceName').value,
    vehicleType: document.getElementById('serviceVehicleType').value,
    duration: parseInt(document.getElementById('serviceDuration').value),
    price: parseInt(document.getElementById('servicePrice').value),
    description: document.getElementById('serviceDescription').value,
    active: document.getElementById('serviceActive').value === 'true'
  };
  let services = getServices();
  services = id ? services.map(s => s.id === id ? { ...s, ...data } : s) : [...services, data];
  saveToStorage('services', services);
  closeModal('serviceModal');
  showToast('Lưu dịch vụ thành công!');
  location.reload();
}

function editService(id) {
  const s = getServices().find(x => x.id === id);
  if (!s) return;
  document.getElementById('serviceId').value = s.id;
  document.getElementById('serviceName').value = s.name;
  document.getElementById('serviceVehicleType').value = s.vehicleType;
  document.getElementById('serviceDuration').value = s.duration;
  document.getElementById('servicePrice').value = s.price;
  document.getElementById('serviceDescription').value = s.description;
  document.getElementById('serviceActive').value = s.active ? 'true' : 'false';
  openModal('serviceModal');
}

function deleteService(id) {
  if (!confirm('Xóa dịch vụ này?')) return;
  saveToStorage('services', getServices().filter(s => s.id !== id));
  location.reload();
}

function openAddService() {
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceId').value = '';
  openModal('serviceModal');
}

/* --- AUTOWASH API INTEGRATION: SAVE PROMOTION --- */
async function savePromotion(e) {
  e.preventDefault();
  const id = document.getElementById('promoId').value;
  const data = {
    name: document.getElementById('promoName').value,
    description: document.getElementById('promoDescription').value,
    discountType: document.getElementById('promoDiscountType').value,
    discountValue: parseFloat(document.getElementById('promoDiscountValue').value),
    startDate: document.getElementById('promoStart').value,
    endDate: document.getElementById('promoEnd').value,
    targetTier: document.getElementById('promoTier').value,
    usageLimit: 999,
    status: document.getElementById('promoStatus').value
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (data.startDate < todayStr) {
    data.startDate = todayStr;
    const startInput = document.getElementById('promoStart');
    if (startInput) startInput.value = todayStr;
  }

  if (data.endDate < data.startDate) {
    alert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!');
    return;
  }

  try {
    const url = id ? `/api/promotions/${id}` : `/api/promotions`;
    const method = id ? 'PUT' : 'POST';
    const backendData = typeof mapFrontendPromoToBackend === 'function' ? mapFrontendPromoToBackend(data) : data;
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData)
    });
    
    if (!res.ok) {
      let errorMsg = 'Lỗi lưu thông tin lên database.';
      try {
        const errData = await res.json();
        if (errData.message) errorMsg = errData.message;
        else if (errData.error) errorMsg = errData.error;
        if (errData.errors && Array.isArray(errData.errors)) {
          errorMsg += ': ' + errData.errors.map(e => e.defaultMessage || e.message).join(', ');
        }
      } catch (e) {
        try {
          const text = await res.text();
          if (text) errorMsg = text;
        } catch (any) {}
      }
      throw new Error(errorMsg);
    }
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn('Backend API offline, using localStorage fallback', err);
    } else {
      alert('Không thể lưu vào database:\n' + err.message);
      return;
    }
  }

  let promos = getPromotions();
  const savedPromo = { ...data, id: id || 'promo-' + Date.now(), usedCount: 0 };
  promos = id ? promos.map(p => p.id === id ? { ...p, ...data } : p) : [...promos, savedPromo];
  saveToStorage('promotions', promos);
  closeModal('promotionModal');
  showToast('Lưu khuyến mãi thành công!');
  location.reload();
}

function editPromotion(id) {
  const p = getPromotions().find(x => x.id === id);
  if (!p) return;
  document.getElementById('promoId').value = p.id;
  document.getElementById('promoName').value = p.name;
  document.getElementById('promoDescription').value = p.description;
  document.getElementById('promoDiscountType').value = p.discountType;
  document.getElementById('promoDiscountValue').value = p.discountValue;
  document.getElementById('promoStart').value = p.startDate;
  document.getElementById('promoEnd').value = p.endDate;
  document.getElementById('promoTier').value = p.targetTier;
  document.getElementById('promoStatus').value = p.status;
  openModal('promotionModal');
}

/* --- AUTOWASH API INTEGRATION: DELETE PROMOTION --- */
async function deletePromotion(id) {
  if (!confirm('Xóa khuyến mãi?')) return;

  try {
    const res = await fetch(`/api/promotions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      let errorMsg = 'Lỗi xóa thông tin từ database.';
      try {
        const errData = await res.json();
        if (errData.message) errorMsg = errData.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn('Backend API offline, using localStorage fallback', err);
    } else {
      alert('Không thể xóa khỏi database:\n' + err.message);
      return;
    }
  }

  const updatedPromos = getPromotions().map(p => p.id === id ? { ...p, status: 'inactive' } : p);
  saveToStorage('promotions', updatedPromos);
  location.reload();
}

function openAddPromotion() {
  document.getElementById('promotionForm').reset();
  document.getElementById('promoId').value = '';
  openModal('promotionModal');
}
