/* AutoWash Pro - Dashboard & Page Renderers (aligned with WashPRo.sql) */
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
    'admin-rewards': renderAdminRewards,
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
  const tier = getTierById(customer.tierId);
  const nextTierIdx = MOCK_DATA.loyaltyTiers.findIndex(t => t.tierId === tier.tierId) + 1;
  const nextTier = MOCK_DATA.loyaltyTiers[nextTierIdx];

  setUserNav(customer);
  document.getElementById('welcomeName').textContent = customer.fullName;
  document.getElementById('currentTier').textContent = tier.tierName;
  document.getElementById('pointsBalance').textContent = customer.currentPoints.toLocaleString('vi-VN');
  document.getElementById('totalVisits').textContent = customer.totalVisits;
  document.getElementById('totalSpending').textContent = formatCurrency(customer.totalSpend);

  if (nextTier) {
    const visitProgress = nextTier.minVisits ? Math.min(100, (customer.totalVisits / nextTier.minVisits) * 100) : 100;
    const spendProgress = nextTier.minSpending ? Math.min(100, (customer.totalSpend / nextTier.minSpending) * 100) : 100;
    const progress = Math.round((visitProgress + spendProgress) / 2);
    document.getElementById('nextTierName').textContent = nextTier.tierName;
    document.getElementById('tierProgressFill').style.width = progress + '%';
    document.getElementById('tierProgressText').textContent = `${progress}% đến ${nextTier.tierName}`;
  } else {
    document.getElementById('nextTierName').textContent = 'Tối đa';
    document.getElementById('tierProgressFill').style.width = '100%';
    document.getElementById('tierProgressText').textContent = 'Bạn đã ở hạng cao nhất!';
  }

  const bookings = getEnrichedBookings().filter(b => Number(b.customerId) === Number(customer.customerId));
  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.find(b => ['pending', 'confirmed'].includes(normalizeStatus(b.status)) && b.bookingDate >= today);
  const upcomingEl = document.getElementById('upcomingBooking');
  if (upcoming) {
    upcomingEl.innerHTML = `<div class="list-item"><div><strong>${upcoming.serviceType}</strong><br><span class="list-item-meta">${formatDate(upcoming.bookingDate)} • ${upcoming.bookingTime} • ${upcoming.vehiclePlate}</span></div><div>${getStatusBadge(upcoming.status)}</div></div>`;
  } else {
    upcomingEl.innerHTML = '<p class="text-muted">Chưa có lịch hẹn sắp tới. <a href="booking.html">Đặt lịch ngay</a></p>';
  }

  const historyEl = document.getElementById('recentHistory');
  const completed = bookings.filter(b => normalizeStatus(b.status) === 'completed').slice(0, 5);
  historyEl.innerHTML = completed.length
    ? completed.map(b => `<div class="list-item"><div><strong>${b.serviceType}</strong><br><span class="list-item-meta">${formatDate(b.bookingDate)} • ${b.vehiclePlate}</span></div><div>${b.amountPaid != null ? formatCurrency(b.amountPaid) : '-'}</div></div>`).join('')
    : '<p class="text-muted">Chưa có lịch sử.</p>';

  const promosEl = document.getElementById('recommendedPromos');
  promosEl.innerHTML = '';
  getPromotions().filter(p => normalizeStatus(p.status) === 'active').slice(0, 3).forEach(p => {
    promosEl.innerHTML += `<div class="promotion-card"><h4>${p.title}</h4><p class="text-muted">${p.description || ''}</p><span class="discount">-${p.discountPercent}%</span><a href="promotions.html" class="btn btn-sm btn-primary" style="margin-top:0.5rem">Xem chi tiết</a></div>`;
  });
}

function renderVehiclesPage() {
  const user = requireAuth(['customer']);
  if (!user) return;

  const customer = getCurrentCustomer();
  setUserNav(customer);
  const list = document.getElementById('vehiclesList');
  const customerId = getLoggedInCustomerId();

  list.innerHTML = '<div class="empty-state"><p>Đang tải danh sách xe...</p></div>';

  return fetchCustomerVehicles(customerId)
    .then(vehicles => {
      if (!vehicles.length) {
        list.innerHTML = '<div class="empty-state"><div class="icon">🚗</div><p>Chưa có xe nào. Thêm xe để đặt lịch.</p></div>';
        return;
      }

      list.innerHTML = vehicles.map(v => `
        <div class="vehicle-card" data-id="${v.vehicleId}">
          <div class="vehicle-card-info">
            <h4>${v.licensePlate}</h4>
            <p>${v.brand} • ${v.vehicleType} • ${v.color}</p>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" onclick="editVehicle(${v.vehicleId})">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${v.vehicleId})">Xóa</button>
          </div>
        </div>`).join('');
    })
    .catch(error => {
      list.innerHTML = '<div class="empty-state"><p>Không tải được danh sách xe.</p></div>';
      showToast(error.message || 'Không tải được danh sách xe.');
    });
}

async function saveVehicle(e) {
  e.preventDefault();
  const user = requireAuth(['customer']);
  if (!user) return;

  const customerId = getLoggedInCustomerId();
  const vehicleId = document.getElementById('vehicleId').value;
  const payload = buildVehicleRequest(customerId, {
    licensePlate: document.getElementById('vehiclePlate').value.trim(),
    vehicleType: document.getElementById('vehicleType').value,
    brand: document.getElementById('vehicleBrand').value.trim(),
    color: document.getElementById('vehicleColor').value.trim()
  });

  if (!payload.licensePlate || !payload.brand) {
    showToast('Vui lòng nhập biển số và hãng xe.');
    return;
  }

  try {
    if (window.AutoWashAPI && usesRealApi()) {
      if (vehicleId) await window.AutoWashAPI.vehicles.update(Number(vehicleId), payload);
      else await window.AutoWashAPI.vehicles.create(payload);
    } else {
      let vehicles = getVehicles();
      if (vehicleId) {
        vehicles = vehicles.map(v => Number(v.vehicleId) === Number(vehicleId) ? { ...v, ...payload, vehicleId: Number(vehicleId) } : v);
      } else {
        const nextId = vehicles.reduce((m, v) => Math.max(m, Number(v.vehicleId) || 0), 0) + 1;
        vehicles.push({ vehicleId: nextId, ...payload });
      }
      saveToStorage('vehicles', vehicles);
    }
    closeModal('vehicleModal');
    showToast(vehicleId ? 'Cập nhật xe thành công!' : 'Thêm xe thành công!');
    await renderVehiclesPage();
  } catch (error) {
    showToast(error.message || 'Lưu xe thất bại.');
  }
}

async function editVehicle(id) {
  const user = requireAuth(['customer']);
  if (!user) return;

  let vehicle;
  try {
    const vehicles = await fetchCustomerVehicles(getLoggedInCustomerId());
    vehicle = vehicles.find(x => Number(x.vehicleId) === Number(id));
  } catch (error) {
    showToast(error.message || 'Không tải được thông tin xe.');
    return;
  }

  if (!vehicle) return;
  document.getElementById('vehicleModalTitle').textContent = 'Sửa xe';
  document.getElementById('vehicleId').value = vehicle.vehicleId;
  document.getElementById('vehiclePlate').value = vehicle.licensePlate;
  document.getElementById('vehicleType').value = vehicle.vehicleType;
  document.getElementById('vehicleBrand').value = vehicle.brand;
  document.getElementById('vehicleColor').value = vehicle.color;
  openModal('vehicleModal');
}

async function deleteVehicle(id) {
  if (!confirm('Bạn có chắc muốn xóa xe này?')) return;

  try {
    if (window.AutoWashAPI && usesRealApi()) {
      await window.AutoWashAPI.vehicles.remove(Number(id));
    } else {
      saveToStorage('vehicles', getVehicles().filter(v => Number(v.vehicleId) !== Number(id)));
    }
    showToast('Đã xóa xe.');
    await renderVehiclesPage();
  } catch (error) {
    showToast(error.message || 'Xóa xe thất bại.');
  }
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
  tbody.innerHTML = '';
  getEnrichedBookings().filter(b => Number(b.customerId) === Number(customer.customerId)).forEach(b => {
    tbody.innerHTML += `<tr data-status="${normalizeStatus(b.status)}" data-date="${b.bookingDate}">
      <td><strong>#${b.bookingId}</strong></td>
      <td>${formatDate(b.bookingDate)}</td>
      <td>${b.bookingTime}</td>
      <td>${b.vehiclePlate}</td>
      <td>${b.serviceType}</td>
      <td>${getStatusBadge(b.status)}</td>
      <td>${b.amountPaid != null ? formatCurrency(b.amountPaid) : '-'}</td>
      <td>${b.pointsEarned != null ? b.pointsEarned : '-'}</td>
    </tr>`;
  });
}

function renderLoyaltyPage() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tierId);
  setUserNav(customer);

  document.getElementById('loyaltyTierName').textContent = tier.tierName;
  document.getElementById('loyaltyPoints').textContent = customer.currentPoints.toLocaleString('vi-VN');
  document.querySelector('.current-tier-card')?.classList.add(tierKey(tier));

  const benefitsEl = document.getElementById('tierBenefitsList');
  benefitsEl.innerHTML = getTierBenefits(tier.tierId).map(b => `<li>${b}</li>`).join('');

  const nextIdx = MOCK_DATA.loyaltyTiers.findIndex(t => t.tierId === tier.tierId) + 1;
  const next = MOCK_DATA.loyaltyTiers[nextIdx];
  if (next) {
    document.getElementById('loyaltyNextTier').textContent = next.tierName;
    const p = Math.min(100, Math.round(((customer.totalVisits / Math.max(next.minVisits, 1)) + (customer.totalSpend / Math.max(next.minSpending, 1))) / 2 * 100));
    document.getElementById('loyaltyProgressFill').style.width = p + '%';
    document.getElementById('loyaltyProgressLabel').textContent = `${p}% — Cần ${next.minVisits} lượt & ${formatCurrency(next.minSpending)}`;
  }

  const txEl = document.querySelector('#pointsHistory tbody');
  txEl.innerHTML = '';
  getLoyaltyPoints().filter(t => Number(t.customerId) === Number(customer.customerId)).forEach(t => {
    const sign = t.pointsChange > 0 ? '+' : '';
    const label = `${t.transactionType}${t.washId ? ` • Wash #${t.washId}` : ''}${t.expiryDate ? ` • HSD ${formatDate(t.expiryDate)}` : ''}`;
    txEl.innerHTML += `<tr><td>${formatDate(String(t.createdAt).slice(0, 10))}</td><td>${label}</td><td><span class="${t.pointsChange > 0 ? 'text-primary' : 'text-muted'}">${sign}${t.pointsChange}</span></td></tr>`;
  });

  const rewardsEl = document.getElementById('rewardsList');
  rewardsEl.innerHTML = '';
  getRewardCatalog().filter(r => r.isActive !== false).forEach(r => {
    const extra = r.freeWash ? ' • Rửa miễn phí' : (r.discountAmount ? ` • ${formatCurrency(r.discountAmount)}` : '');
    rewardsEl.innerHTML += `<div class="reward-item"><h4>${r.rewardName}</h4><p class="text-muted">${extra}</p><div class="points-cost">${r.pointsRequired} điểm</div><button class="btn btn-sm btn-primary" onclick="redeemReward(${r.rewardId}, ${r.pointsRequired})">Đổi thưởng</button></div>`;
  });
}

function redeemReward(id, cost) {
  const customer = getCurrentCustomer();
  if (customer.currentPoints < cost) {
    showToast('Không đủ điểm để đổi thưởng.');
    return;
  }

  const reward = getRewardCatalog().find(r => Number(r.rewardId) === Number(id));
  if (!reward || reward.isActive === false) {
    showToast('Phần thưởng không khả dụng.');
    return;
  }

  customer.currentPoints -= cost;
  const customers = loadFromStorage('customers', [...MOCK_DATA.customers]).map(c =>
    Number(c.customerId) === Number(customer.customerId) ? { ...c, currentPoints: customer.currentPoints } : c
  );
  saveToStorage('customers', customers);

  const redemptions = loadFromStorage('rewardRedemptions', [...MOCK_DATA.rewardRedemptions]);
  const redemptionId = redemptions.reduce((m, r) => Math.max(m, Number(r.redemptionId) || 0), 0) + 1;
  redemptions.push({
    redemptionId,
    customerId: customer.customerId,
    rewardId: Number(id),
    pointsUsed: cost,
    redemptionDate: new Date().toISOString()
  });
  saveToStorage('rewardRedemptions', redemptions);

  const points = getLoyaltyPoints();
  const pointId = points.reduce((m, p) => Math.max(m, Number(p.pointId) || 0), 0) + 1;
  points.unshift({
    pointId,
    customerId: customer.customerId,
    washId: null,
    pointsChange: -cost,
    transactionType: 'Redeem',
    expiryDate: null,
    createdAt: new Date().toISOString()
  });
  saveToStorage('loyaltyPoints', points);

  showToast('Đổi thưởng thành công!');
  renderLoyaltyPage();
}

function renderPromotionsPage() {
  const customer = getCurrentCustomer();
  setUserNav(customer);
  const grid = document.getElementById('promotionsGrid');
  grid.innerHTML = '';
  getPromotions().filter(p => normalizeStatus(p.status) === 'active').forEach(p => {
    const tierLabel = p.minTierId == null ? 'Tất cả hạng' : `${getTierById(p.minTierId).tierName}+`;
    grid.innerHTML += `
      <div class="promotion-card">
        <h4>${p.title}</h4>
        <p class="text-muted">${p.description || ''}</p>
        <span class="discount">Giảm ${p.discountPercent}%</span>
        <p class="text-muted" style="font-size:0.8125rem">HSD: ${formatDate(p.startDate)} - ${formatDate(p.endDate)}</p>
        <p style="font-size:0.8125rem">Áp dụng: ${tierLabel}</p>
        <button class="btn btn-sm btn-primary" onclick="usePromotion(${p.promotionId})">Sử dụng</button>
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
  tbody.innerHTML = '';
  getEnrichedBookings().slice(0, 8).forEach(b => {
    tbody.innerHTML += `<tr>
      <td>#${b.bookingId}</td><td>${b.customerName}</td><td>${b.serviceType}</td>
      <td>${formatDate(b.bookingDate)} ${b.bookingTime}</td><td>${getStatusBadge(b.status)}</td>
      <td>${b.amountPaid != null ? formatCurrency(b.amountPaid) : '-'}</td></tr>`;
  });
}

function renderAdminCustomers() {
  if (!requireAuth(['admin'])) return;

  const tbody = document.querySelector('#customersTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7">Đang tải danh sách khách hàng...</td></tr>';

  fetchAdminCustomers()
    .then(customers => {
      if (!customers.length) {
        tbody.innerHTML = '<tr><td colspan="7">Chưa có khách hàng.</td></tr>';
        return;
      }

      tbody.innerHTML = customers.map(c => {
        const tierKeyName = normalizeTierKey(c.loyaltyTier || c.tierId);
        const searchText = `${c.fullName} ${c.phoneNumber} ${c.email}`.toLowerCase();
        return `<tr data-tier="${tierKeyName}" data-search="${searchText}">
          <td><strong>${c.fullName}</strong></td>
          <td>${c.phoneNumber}</td>
          <td>${c.email || '-'}</td>
          <td>${getTierBadge(c.tierId || c.loyaltyTier)}</td>
          <td>${c.currentPoints.toLocaleString('vi-VN')}</td>
          <td>${c.totalVisits}</td>
          <td>${formatCurrency(c.totalSpend)}</td>
        </tr>`;
      }).join('');

      filterTable('customersTable', {
        tier: document.getElementById('filterTier')?.value,
        search: document.getElementById('searchCustomer')?.value
      });
    })
    .catch(error => {
      tbody.innerHTML = '<tr><td colspan="7">Không tải được danh sách khách hàng.</td></tr>';
      showToast(error.message || 'Không tải được danh sách khách hàng.');
    });
}

function renderAdminBookings() {
  const tbody = document.querySelector('#adminBookingsTable tbody');
  tbody.innerHTML = '';
  getEnrichedBookings().forEach(b => {
    tbody.innerHTML += `<tr data-status="${normalizeStatus(b.status)}" data-id="${b.bookingId}">
      <td>${b.customerName}</td><td>${b.vehiclePlate}</td><td>${b.serviceType}</td>
      <td>${formatDate(b.bookingDate)}</td><td>${b.bookingTime}</td><td>${getStatusBadge(b.status)}</td>
      <td>${b.amountPaid != null ? formatCurrency(b.amountPaid) : '-'}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="updateBookingStatus(${b.bookingId},'Confirmed')">Xác nhận</button>
        <button class="btn btn-sm btn-primary" onclick="updateBookingStatus(${b.bookingId},'In_Progress')">Đang rửa</button>
        <button class="btn btn-sm btn-primary" onclick="updateBookingStatus(${b.bookingId},'Completed')">Hoàn thành</button>
        <button class="btn btn-sm btn-danger" onclick="updateBookingStatus(${b.bookingId},'Cancelled')">Hủy</button>
      </td></tr>`;
  });
}

function updateBookingStatus(id, status) {
  const bookings = getBookings().map(b => Number(b.bookingId) === Number(id) ? { ...b, status } : b);
  saveToStorage('bookings', bookings);

  if (status === 'Cancelled') {
    const updated = getBookings().map(b => Number(b.bookingId) === Number(id) ? { ...b, cancelledByAdminId: 1 } : b);
    saveToStorage('bookings', updated);
  }

  if (status === 'Completed') {
    const booking = getBookings().find(b => Number(b.bookingId) === Number(id));
    if (booking && !getWashForBooking(id)) {
      const history = getWashHistory();
      const washId = history.reduce((m, w) => Math.max(m, Number(w.washId) || 0), 0) + 1;
      const amountPaid = getServiceBasePrice(booking.serviceType);
      const tier = getTierById(booking.tierIdAtBooking);
      const pointsEarned = Math.round(amountPaid / 1000 * tier.pointMultiplier);
      history.push({
        washId,
        bookingId: Number(id),
        washDate: new Date().toISOString(),
        amountPaid,
        pointsEarned,
        pointsUsed: 0,
        perkApplied: getTierDiscountPercent(tier.tierId) ? `Giảm ${getTierDiscountPercent(tier.tierId)}%` : 'Không'
      });
      saveToStorage('washHistory', history);
    }
  }

  showToast('Cập nhật trạng thái thành công!');
  location.reload();
}

function renderAdminServices() {
  const tbody = document.querySelector('#servicesTable tbody');
  tbody.innerHTML = '';
  getServiceCatalog().forEach((s, index) => {
    tbody.innerHTML += `<tr data-id="${index}">
      <td><strong>${s.serviceType}</strong></td>
      <td>${formatCurrency(s.basePrice)}</td>
      <td class="text-muted">Lưu vào Booking.service_type</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editService(${index})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteService(${index})">Xóa</button>
      </td></tr>`;
  });
}

function renderAdminTiers() {
  const tbody = document.querySelector('#tiersTable tbody');
  tbody.innerHTML = '';
  MOCK_DATA.loyaltyTiers.forEach(t => {
    const perks = getPerksForTier(t.tierId).map(describePerk).join('; ') || '—';
    tbody.innerHTML += `<tr>
      <td><strong>${t.tierName}</strong></td>
      <td>${t.minVisits}</td>
      <td>${formatCurrency(t.minSpending)}</td>
      <td>x${t.pointMultiplier}</td>
      <td>${t.bookingWindowDays} ngày</td>
      <td>${t.priorityLevel}</td>
      <td>${perks}</td></tr>`;
  });
}

function renderAdminPromotions() {
  const tbody = document.querySelector('#promotionsTable tbody');
  tbody.innerHTML = '';
  getPromotions().forEach(p => {
    const tierLabel = p.minTierId == null ? 'Tất cả' : `${getTierById(p.minTierId).tierName}+`;
    tbody.innerHTML += `<tr data-id="${p.promotionId}">
      <td><strong>${p.title}</strong></td><td>${p.description || '-'}</td><td>${p.discountPercent}%</td>
      <td>${formatDate(p.startDate)}</td><td>${formatDate(p.endDate)}</td>
      <td>${tierLabel}</td><td>${getStatusBadge(p.status)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editPromotion(${p.promotionId})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deletePromotion(${p.promotionId})">Xóa</button>
      </td></tr>`;
  });
}

function renderAdminRewards() {
  const user = requireAuth(['admin']);
  if (!user) return;

  const tbody = document.querySelector('#rewardsTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7">Đang tải danh sách quà tặng...</td></tr>';

  fetchAdminRewards()
    .then(rewards => {
      if (!rewards.length) {
        tbody.innerHTML = '<tr><td colspan="7">Chưa có quà tặng nào.</td></tr>';
        return;
      }

      tbody.innerHTML = rewards.map(r => `
        <tr data-id="${r.rewardId}">
          <td>${r.rewardId}</td>
          <td><strong>${r.rewardName}</strong></td>
          <td>${r.pointsRequired.toLocaleString('vi-VN')}</td>
          <td>${formatCurrency(r.discountAmount)}</td>
          <td>${r.freeWash ? 'Có' : 'Không'}</td>
          <td>${getStatusBadge(r.isActive ? 'active' : 'inactive')}</td>
          <td class="actions">
            <button class="btn btn-sm btn-secondary" onclick="editReward(${r.rewardId})">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteReward(${r.rewardId})">Xóa</button>
          </td>
        </tr>`).join('');
    })
    .catch(error => {
      tbody.innerHTML = '<tr><td colspan="7">Không tải được danh sách quà tặng.</td></tr>';
      showToast(error.message || 'Không tải được danh sách quà tặng.');
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
  topEl.innerHTML = '';
  d.topLoyalCustomers.forEach((c, i) => {
    topEl.innerHTML += `<li><span><span class="rank">${i + 1}</span>${c.name}</span><span>${c.visits} lượt • ${formatCurrency(c.spending)}</span></li>`;
  });

  const svcEl = document.getElementById('topServices');
  svcEl.innerHTML = '';
  d.topServices.forEach(s => {
    svcEl.innerHTML += `<li><span>${s.name}</span><span>${s.count} lượt</span></li>`;
  });
}

function renderStaffSchedule() {
  const container = document.getElementById('scheduleList');
  const schedule = buildStaffScheduleFromBookings();
  if (!schedule.length) {
    container.innerHTML = '<p class="text-muted">Chưa có lịch từ bảng Booking.</p>';
    return;
  }
  container.innerHTML = schedule.map(s => `
    <div class="schedule-item">
      <div class="schedule-time">${s.time}</div>
      <div class="schedule-details">
        <h4>${s.customerName}</h4>
        <p>${s.vehicle} • ${s.licensePlate} • ${s.service}</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
        ${getStatusBadge(s.status)}
        ${normalizeStatus(s.status) !== 'in_progress' ? `<button class="btn btn-sm btn-primary" onclick="updateScheduleStatus(${s.bookingId},'In_Progress')">Bắt đầu</button>` : ''}
        ${normalizeStatus(s.status) !== 'completed' ? `<button class="btn btn-sm btn-secondary" onclick="updateScheduleStatus(${s.bookingId},'Completed')">Hoàn thành</button>` : ''}
      </div>
    </div>`).join('');
}

function updateScheduleStatus(bookingId, status) {
  updateBookingStatus(bookingId, status);
}

function setUserNav(customer) {
  const user = requireAuth(['customer']);
  if (!user) return;
  const name = customer?.fullName || user.name;
  document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
  document.querySelectorAll('.user-tier').forEach(el => {
    if (customer) el.textContent = getTierById(customer.tierId).tierName;
  });
  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = getUserInitials(name));
}

function renderBarChart(containerId, data, labels, small) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...data, 1);
  container.innerHTML = '<div class="chart-container">' +
    data.map((v) => `<div class="chart-bar" style="height:${Math.round((v / max) * 100)}%" data-value="${small ? v : formatCurrency(v)}"></div>`).join('') +
    '</div><div class="chart-labels">' + labels.map(l => `<span>${l}</span>`).join('') + '</div>';
}

function renderTierChart(data, containerId) {
  const el = document.getElementById(containerId || 'tierChart');
  if (!el) return;
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
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
      ${Object.entries(data).map(([t, c]) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[t]}"></span>${getTierById(t).tierName}: ${c}</div>`).join('')}
    </div>`;
}

function initCrudModals() {
  document.getElementById('vehicleForm')?.addEventListener('submit', saveVehicle);
  document.getElementById('serviceForm')?.addEventListener('submit', saveService);
  document.getElementById('promotionForm')?.addEventListener('submit', savePromotion);
  document.getElementById('rewardForm')?.addEventListener('submit', saveReward);
}

function saveService(e) {
  e.preventDefault();
  const index = document.getElementById('serviceId').value;
  const data = {
    serviceType: document.getElementById('serviceName').value.trim(),
    basePrice: parseInt(document.getElementById('servicePrice').value, 10) || 0
  };
  if (!data.serviceType) {
    showToast('Nhập tên dịch vụ (service_type).');
    return;
  }
  let catalog = getServiceCatalog();
  if (index !== '') catalog[Number(index)] = data;
  else catalog.push(data);
  saveToStorage('serviceCatalog', catalog);
  closeModal('serviceModal');
  showToast('Lưu loại dịch vụ thành công!');
  location.reload();
}

function editService(index) {
  const s = getServiceCatalog()[index];
  if (!s) return;
  document.getElementById('serviceId').value = index;
  document.getElementById('serviceName').value = s.serviceType;
  document.getElementById('servicePrice').value = s.basePrice;
  openModal('serviceModal');
}

function deleteService(index) {
  if (!confirm('Xóa loại dịch vụ này?')) return;
  const catalog = getServiceCatalog().filter((_, i) => i !== Number(index));
  saveToStorage('serviceCatalog', catalog);
  location.reload();
}

function openAddService() {
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceId').value = '';
  openModal('serviceModal');
}

function savePromotion(e) {
  e.preventDefault();
  const id = document.getElementById('promoId').value;
  const minTierRaw = document.getElementById('promoTier').value;
  const data = {
    promotionId: id ? Number(id) : null,
    title: document.getElementById('promoName').value.trim(),
    description: document.getElementById('promoDescription').value.trim(),
    discountPercent: parseFloat(document.getElementById('promoDiscountValue').value) || 0,
    startDate: document.getElementById('promoStart').value,
    endDate: document.getElementById('promoEnd').value,
    minTierId: minTierRaw === 'all' ? null : Number(minTierRaw),
    status: document.getElementById('promoStatus').value,
    createdByAdminId: 1
  };
  let promos = getPromotions();
  if (id) {
    promos = promos.map(p => Number(p.promotionId) === Number(id) ? { ...p, ...data, promotionId: Number(id) } : p);
  } else {
    data.promotionId = promos.reduce((m, p) => Math.max(m, Number(p.promotionId) || 0), 0) + 1;
    promos = [...promos, data];
  }
  saveToStorage('promotions', promos);
  closeModal('promotionModal');
  showToast('Lưu khuyến mãi thành công!');
  location.reload();
}

function editPromotion(id) {
  const p = getPromotions().find(x => Number(x.promotionId) === Number(id));
  if (!p) return;
  document.getElementById('promoId').value = p.promotionId;
  document.getElementById('promoName').value = p.title;
  document.getElementById('promoDescription').value = p.description || '';
  document.getElementById('promoDiscountValue').value = p.discountPercent;
  document.getElementById('promoStart').value = p.startDate;
  document.getElementById('promoEnd').value = p.endDate;
  document.getElementById('promoTier').value = p.minTierId == null ? 'all' : String(p.minTierId);
  document.getElementById('promoStatus').value = p.status === 'Inactive' || normalizeStatus(p.status) === 'inactive' ? 'Inactive' : 'Active';
  openModal('promotionModal');
}

function deletePromotion(id) {
  if (!confirm('Xóa khuyến mãi?')) return;
  saveToStorage('promotions', getPromotions().filter(p => Number(p.promotionId) !== Number(id)));
  location.reload();
}

function openAddPromotion() {
  document.getElementById('promotionForm').reset();
  document.getElementById('promoId').value = '';
  openModal('promotionModal');
}

async function saveReward(e) {
  e.preventDefault();
  if (!requireAuth(['admin'])) return;

  const rewardId = document.getElementById('rewardId').value;
  const payload = buildRewardRequest({
    rewardName: document.getElementById('rewardName').value.trim(),
    pointsRequired: document.getElementById('rewardPoints').value,
    discountAmount: document.getElementById('rewardDiscount').value,
    freeWash: document.getElementById('rewardFreeWash').value,
    isActive: document.getElementById('rewardActive').value
  });

  if (!payload.rewardName || payload.pointsRequired < 1) {
    showToast('Vui lòng nhập tên quà và điểm đổi hợp lệ.');
    return;
  }

  try {
    if (window.AutoWashAPI && usesRealApi()) {
      if (rewardId) await window.AutoWashAPI.rewards.update(Number(rewardId), payload);
      else await window.AutoWashAPI.rewards.create(payload);
    } else {
      let catalog = getRewardCatalog();
      if (rewardId) {
        catalog = catalog.map(r => Number(r.rewardId) === Number(rewardId)
          ? { ...r, ...payload, rewardId: Number(rewardId), createdByAdminId: r.createdByAdminId || 1 }
          : r);
      } else {
        const nextId = catalog.reduce((m, r) => Math.max(m, Number(r.rewardId) || 0), 0) + 1;
        catalog.push({ rewardId: nextId, ...payload, createdByAdminId: 1 });
      }
      saveToStorage('rewardCatalog', catalog);
    }
    closeModal('rewardModal');
    showToast(rewardId ? 'Cập nhật quà tặng thành công!' : 'Thêm quà tặng thành công!');
    await renderAdminRewards();
  } catch (error) {
    showToast(error.message || 'Lưu quà tặng thất bại.');
  }
}

async function editReward(id) {
  if (!requireAuth(['admin'])) return;

  let reward;
  try {
    const rewards = await fetchAdminRewards();
    reward = rewards.find(r => Number(r.rewardId) === Number(id));
  } catch (error) {
    showToast(error.message || 'Không tải được thông tin quà tặng.');
    return;
  }

  if (!reward) return;

  document.getElementById('rewardModalTitle').textContent = 'Sửa quà tặng';
  document.getElementById('rewardId').value = reward.rewardId;
  document.getElementById('rewardName').value = reward.rewardName;
  document.getElementById('rewardPoints').value = reward.pointsRequired;
  document.getElementById('rewardDiscount').value = reward.discountAmount;
  document.getElementById('rewardFreeWash').value = reward.freeWash ? 'true' : 'false';
  document.getElementById('rewardActive').value = reward.isActive ? 'true' : 'false';
  openModal('rewardModal');
}

async function deleteReward(id) {
  if (!requireAuth(['admin'])) return;
  if (!confirm('Bạn có chắc muốn vô hiệu hóa quà tặng này?')) return;

  try {
    if (window.AutoWashAPI && usesRealApi()) {
      await window.AutoWashAPI.rewards.delete(Number(id));
    } else {
      const catalog = getRewardCatalog().map(r =>
        Number(r.rewardId) === Number(id) ? { ...r, isActive: false } : r
      );
      saveToStorage('rewardCatalog', catalog);
    }
    showToast('Đã vô hiệu hóa quà tặng.');
    await renderAdminRewards();
  } catch (error) {
    showToast(error.message || 'Xóa quà tặng thất bại.');
  }
}

function openAddReward() {
  document.getElementById('rewardForm').reset();
  document.getElementById('rewardId').value = '';
  document.getElementById('rewardModalTitle').textContent = 'Thêm quà tặng';
  document.getElementById('rewardActive').value = 'true';
  document.getElementById('rewardFreeWash').value = 'false';
  openModal('rewardModal');
}
