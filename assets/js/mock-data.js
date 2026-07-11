/* AutoWash Pro - Mock Data */
const MOCK_DATA = {
  currentCustomerId: 'cust-001',

  dbLoyaltyTiers: [
    { tierId: 1, tierName: 'BRONZE' },
    { tierId: 2, tierName: 'SILVER' },
    { tierId: 3, tierName: 'GOLD' },
    { tierId: 4, tierName: 'DIAMOND' }
  ],

  loyaltyTiers: [
    { id: 'member', name: 'Member', requiredVisits: 0, requiredSpending: 0, pointRate: 1, bookingWindow: 7, discountPercent: 0, benefits: ['Đặt lịch trước 7 ngày', 'Tích điểm cơ bản'] },
    { id: 'silver', name: 'Silver', requiredVisits: 5, requiredSpending: 500000, pointRate: 1.2, bookingWindow: 10, discountPercent: 5, benefits: ['Giảm 5%', 'Đặt lịch 10 ngày', 'Ưu tiên xếp hàng nhẹ'] },
    { id: 'gold', name: 'Gold', requiredVisits: 15, requiredSpending: 2000000, pointRate: 1.5, bookingWindow: 12, discountPercent: 10, benefits: ['Giảm 10%', 'Đặt lịch 12 ngày', 'Quà sinh nhật'] },
    { id: 'platinum', name: 'Platinum', requiredVisits: 30, requiredSpending: 5000000, pointRate: 2, bookingWindow: 14, discountPercent: 15, benefits: ['Giảm 15%', 'Đặt lịch 14 ngày', 'Dịch vụ VIP', 'Tặng 1 lần rửa/tháng'] }
  ],

  customers: [
    { id: 'cust-001', name: 'Minh Thư 1', phone: '0901234567', email: 'an.nguyen@email.com', tier: 'gold', points: 2450, totalVisits: 18, totalSpending: 3200000, status: 'active' },
    { id: 'cust-002', name: 'Minh Thư 2', phone: '0912345678', email: 'binh.tran@email.com', tier: 'silver', points: 890, totalVisits: 7, totalSpending: 980000, status: 'active' },
    { id: 'cust-003', name: 'Minh Thư 3', phone: '0923456789', email: 'cuong.le@email.com', tier: 'platinum', points: 5200, totalVisits: 42, totalSpending: 8500000, status: 'active' },
    { id: 'cust-004', name: 'Minh Thư 4', phone: '0934567890', email: 'dung.pham@email.com', tier: 'member', points: 120, totalVisits: 2, totalSpending: 350000, status: 'active' },
    { id: 'cust-005', name: 'Minh Thư 5', phone: '0945678901', email: 'em.hoang@email.com', tier: 'gold', points: 1800, totalVisits: 14, totalSpending: 2100000, status: 'inactive' }
  ],

  vehicles: [
    { id: 'veh-001', vehicleId: 1, customerId: 'cust-001', licensePlate: '51A-12345', vehicleType: 'Car', brand: 'Toyota Camry', color: 'Trắng', notes: 'Xe gia đình', isActive: true },
    { id: 'veh-002', vehicleId: 2, customerId: 'cust-001', licensePlate: '59-H1 6789', vehicleType: 'Motorbike', brand: 'Honda Vision', color: 'Đỏ', notes: '', isActive: true },
    { id: 'veh-003', vehicleId: 3, customerId: 'cust-002', licensePlate: '30F-98765', vehicleType: 'Car', brand: 'Hyundai Tucson', color: 'Xám', notes: '', isActive: true }
  ],

  services: [
    { id: 'svc-001', name: 'Rửa nhanh', vehicleType: 'Motorbike', duration: 15, price: 50000, description: 'Rửa ngoài cơ bản', active: true },
    { id: 'svc-002', name: 'Rửa tiêu chuẩn', vehicleType: 'Motorbike', duration: 25, price: 80000, description: 'Rửa ngoài + lau khô', active: true },
    { id: 'svc-003', name: 'Rửa nhanh', vehicleType: 'Car', duration: 20, price: 120000, description: 'Rửa ngoài cơ bản', active: true },
    { id: 'svc-004', name: 'Rửa tiêu chuẩn', vehicleType: 'Car', duration: 35, price: 180000, description: 'Rửa ngoài + hút bụi', active: true },
    { id: 'svc-005', name: 'Rửa cao cấp', vehicleType: 'Car', duration: 60, price: 350000, description: 'Rửa full + wax', active: true },
    { id: 'svc-006', name: 'Detailing', vehicleType: 'Car', duration: 120, price: 800000, description: 'Chăm sóc toàn diện', active: true },
    { id: 'svc-007', name: 'Rửa cũ', vehicleType: 'Car', duration: 30, price: 100000, description: 'Ngừng dịch vụ', active: false }
  ],

  bookings: [
    { id: 'BK-2026-001', customerId: 'cust-001', customerName: 'Minh Thư 1', vehicleId: 'veh-001', vehiclePlate: '51A-12345', serviceId: 'svc-004', serviceName: 'Rửa tiêu chuẩn', date: '2026-05-22', time: '09:00', status: 'confirmed', totalPrice: 162000, pointsEarned: 180, promotionId: null },
    { id: 'BK-2026-002', customerId: 'cust-001', customerName: 'Minh Thư 1', vehicleId: 'veh-002', vehiclePlate: '59-H1 6789', serviceId: 'svc-002', serviceName: 'Rửa tiêu chuẩn', date: '2026-05-15', time: '14:30', status: 'completed', totalPrice: 72000, pointsEarned: 96 },
    { id: 'BK-2026-003', customerId: 'cust-002', customerName: 'Minh Thư 2', vehicleId: 'veh-003', vehiclePlate: '30F-98765', serviceId: 'svc-003', serviceName: 'Rửa nhanh', date: '2026-05-20', time: '10:00', status: 'pending', totalPrice: 114000, pointsEarned: 0 },
    { id: 'BK-2026-004', customerId: 'cust-003', customerName: 'Minh Thư 3', vehicleId: 'veh-001', vehiclePlate: '51A-99999', serviceId: 'svc-005', serviceName: 'Rửa cao cấp', date: '2026-05-19', time: '08:00', status: 'in_progress', totalPrice: 297500, pointsEarned: 0 },
    { id: 'BK-2026-005', customerId: 'cust-001', customerName: 'Minh Thư 1', vehicleId: 'veh-001', vehiclePlate: '51A-12345', serviceId: 'svc-003', serviceName: 'Rửa nhanh', date: '2026-05-10', time: '11:00', status: 'completed', totalPrice: 108000, pointsEarned: 120 },
    { id: 'BK-2026-006', customerId: 'cust-004', customerName: 'Minh Thư 4', vehicleId: 'veh-003', vehiclePlate: '30F-11111', serviceId: 'svc-004', serviceName: 'Rửa tiêu chuẩn', date: '2026-05-18', time: '15:00', status: 'cancelled', totalPrice: 180000, pointsEarned: 0 }
  ],

  promotions: [
    { id: 'promo-001', name: 'Chào hè 2026', description: 'Giảm giá mùa hè cho tất cả dịch vụ ô tô', discountType: 'percent', discountValue: 15, startDate: '2026-05-01', endDate: '2026-08-31', minTierId: null, usageLimit: 500, usedCount: 128, status: 'active' },
    { id: 'promo-002', name: 'Gold Member Exclusive', description: 'Giảm thêm cho hạng Gold', discountType: 'percent', discountValue: 10, startDate: '2026-04-01', endDate: '2026-12-31', minTierId: 3, usageLimit: 200, usedCount: 45, status: 'active' },
    { id: 'promo-003', name: 'Xe máy cuối tuần', description: 'Giảm 20k cho rửa xe máy T7-CN', discountType: 'fixed', discountValue: 20000, startDate: '2026-05-01', endDate: '2026-06-30', minTierId: null, usageLimit: 1000, usedCount: 312, status: 'active' },
    { id: 'promo-004', name: 'Diamond VIP', description: 'Miễn phí wax nhẹ', discountType: 'fixed', discountValue: 50000, startDate: '2026-01-01', endDate: '2026-12-31', minTierId: 4, usageLimit: 50, usedCount: 12, status: 'active' },
    { id: 'promo-005', name: 'Tết 2025', description: 'Khuyến mãi đã kết thúc', discountType: 'percent', discountValue: 20, startDate: '2025-01-01', endDate: '2025-02-15', minTierId: null, usageLimit: 300, usedCount: 300, status: 'inactive' }
  ],

  loyaltyTransactions: [
    { id: 'lt-001', customerId: 'cust-001', type: 'earn', description: 'Booking BK-2026-002', points: 96, date: '2026-05-15' },
    { id: 'lt-002', customerId: 'cust-001', type: 'earn', description: 'Booking BK-2026-005', points: 120, date: '2026-05-10' },
    { id: 'lt-003', customerId: 'cust-001', type: 'redeem', description: 'Đổi voucher giảm 50k', points: -500, date: '2026-05-08' },
    { id: 'lt-004', customerId: 'cust-001', type: 'bonus', description: 'Thưởng hạng Gold', points: 200, date: '2026-04-01' },
    { id: 'lt-005', customerId: 'cust-001', type: 'earn', description: 'Booking BK-2026-001 (dự kiến)', points: 180, date: '2026-05-22' }
  ],

  rewards: [
    { id: 'rw-001', name: 'Voucher giảm 50.000đ', pointsCost: 500, description: 'Áp dụng 1 lần cho bất kỳ dịch vụ' },
    { id: 'rw-002', name: 'Rửa nhanh miễn phí (xe máy)', pointsCost: 800, description: 'Miễn phí 1 lần rửa nhanh xe máy' },
    { id: 'rw-003', name: 'Nâng cấp rửa cao cấp', pointsCost: 1500, description: 'Giảm 100% phí chênh lệch lên cao cấp' }
  ],

  rewardCatalog: [
    { rewardId: 1, rewardName: 'Voucher giảm 50.000đ', description: 'Áp dụng 1 lần cho bất kỳ dịch vụ', pointsRequired: 500, discountAmount: 50000, stockQuantity: 100, isActive: true },
    { rewardId: 2, rewardName: 'Rửa nhanh miễn phí (xe máy)', description: 'Miễn phí 1 lần rửa nhanh xe máy', pointsRequired: 800, discountAmount: 80000, stockQuantity: 50, isActive: true },
    { rewardId: 3, rewardName: 'Nâng cấp rửa cao cấp', description: 'Giảm 100% phí chênh lệch lên cao cấp', pointsRequired: 1500, discountAmount: 200000, stockQuantity: 20, isActive: true },
    { rewardId: 4, rewardName: 'Voucher cũ (ngừng)', description: 'Quà đã ngừng phát hành', pointsRequired: 300, discountAmount: 30000, stockQuantity: 0, isActive: false }
  ],

  timeSlots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],

  analyticsData: {
    totalBookings: 1247,
    todayBookings: 23,
    totalRevenue: 458200000,
    newCustomers: 34,
    repeatCustomers: 189,
    activePromotions: 4,
    customersByTier: { member: 120, silver: 85, gold: 42, platinum: 12 },
    monthlyRevenue: [32000000, 35000000, 38000000, 42000000, 45000000, 48000000, 52000000, 49000000, 51000000, 54000000, 56000000, 58000000],
    bookingTrend: [45, 52, 48, 61, 55, 67, 72, 68, 75, 80, 78, 85],
    rewardUsageRate: 34,
    topLoyalCustomers: [
      { name: 'Minh Thư 3', visits: 42, spending: 8500000 },
      { name: 'Minh Thư 1', visits: 18, spending: 3200000 },
      { name: 'Minh Thư 5', visits: 14, spending: 2100000 }
    ],
    topServices: [
      { name: 'Rửa tiêu chuẩn (Car)', count: 412 },
      { name: 'Rửa nhanh (Car)', count: 298 },
      { name: 'Rửa tiêu chuẩn (Motorbike)', count: 256 },
      { name: 'Rửa cao cấp', count: 145 }
    ]
  },

  staffSchedule: [
    { id: 'ss-001', time: '08:00', customerId: 'cust-003', customerName: 'Minh Thư 3', vehicle: 'Mercedes C200', licensePlate: '51A-99999', service: 'Rửa cao cấp', status: 'in_progress' },
    { id: 'ss-002', time: '09:00', customerId: 'cust-001', customerName: 'Minh Thư 1', vehicle: 'Toyota Camry', licensePlate: '51A-12345', service: 'Rửa tiêu chuẩn', status: 'confirmed' },
    { id: 'ss-003', time: '10:00', customerId: 'cust-002', customerName: 'Minh Thư 2', vehicle: 'Hyundai Tucson', licensePlate: '30F-98765', service: 'Rửa nhanh', status: 'confirmed' },
    { id: 'ss-004', time: '11:00', customerId: 'cust-004', customerName: 'Minh Thư 4', vehicle: 'Mazda 3', licensePlate: '30F-11111', service: 'Rửa tiêu chuẩn', status: 'pending' },
    { id: 'ss-005', time: '14:00', customerId: 'cust-001', customerName: 'Minh Thư 1', vehicle: 'Honda Vision', licensePlate: '59-H1 6789', service: 'Rửa tiêu chuẩn', status: 'pending' }
  ]
};

function getLoyaltyTierList() {
  try {
    const cached = localStorage.getItem('autowash_loyaltyTiers');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (_) {}
  return MOCK_DATA.loyaltyTiers;
}

function extractTierLabel(tier) {
  if (tier == null) return '';
  if (typeof tier === 'object') return String(tier.tierName || tier.name || '').trim();
  return String(tier).trim();
}

function getTierById(tierId) {
  const list = getLoyaltyTierList();
  const label = extractTierLabel(tierId);
  const key = normalizeTierKey(label || tierId);
  return list.find(t =>
    String(t.id) === String(tierId) ||
    String(t.tierId) === String(tierId) ||
    normalizeTierKey(t.id) === key ||
    normalizeTierKey(t.name || t.tierName) === key ||
    String(t.name || t.tierName).toLowerCase() === label.toLowerCase()
  ) || list[0];
}

function getTierDisplayName(tierRef) {
  if (tierRef && typeof tierRef === 'object') {
    const direct = tierRef.tierName || tierRef.name;
    if (direct) return direct;
  }
  const tier = getTierById(tierRef);
  return tier?.tierName || tier?.name || extractTierLabel(tierRef) || 'BRONZE';
}

function getSortedTiers() {
  return [...getLoyaltyTierList()].sort((a, b) =>
    (a.priorityLevel ?? 99) - (b.priorityLevel ?? 99) ||
    Number(a.minSpending ?? a.requiredSpending ?? 0) - Number(b.minSpending ?? b.requiredSpending ?? 0)
  );
}

function getNextTier(tierRef) {
  const list = getSortedTiers();
  const current = getTierById(tierRef);
  const idx = list.findIndex(t =>
    String(t.id || t.tierId) === String(current?.id || current?.tierId) ||
    normalizeTierKey(t.name || t.tierName) === normalizeTierKey(current?.name || current?.tierName)
  );
  return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
}

function getDbTierById(tierId) {
  return MOCK_DATA.dbLoyaltyTiers.find(t => t.tierId === Number(tierId)) || null;
}

function getDbTierName(minTierId) {
  if (minTierId == null || minTierId === '') return 'Tất cả';
  return getDbTierById(minTierId)?.tierName || 'Tất cả';
}

function tierKeyToId(tierKey) {
  const map = { member: 1, bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 4 };
  return map[normalizeTierKey(tierKey)] || 1;
}

function getPromotionMinTierId(promotion) {
  if (promotion.minTierId != null && promotion.minTierId !== '') {
    return Number(promotion.minTierId);
  }
  if (!promotion.targetTier || promotion.targetTier === 'all') return null;
  return tierKeyToId(promotion.targetTier);
}

function populatePromotionTierSelect(selectEl, selectedValue) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">Tất cả</option>' +
    MOCK_DATA.dbLoyaltyTiers.map(t => `<option value="${t.tierId}">${t.tierName}</option>`).join('');
  if (selectedValue != null && selectedValue !== '') {
    selectEl.value = String(selectedValue);
  }
}

function getCustomerById(id) {
  return MOCK_DATA.customers.find(c => c.id === id);
}

function getLoggedInUser() {
  const stored = localStorage.getItem('autowash_user');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch (e) { return null; }
}

function findMockCustomerForUser(user) {
  if (!user) return null;
  const email = String(user.email || user.loginKey || '').toLowerCase();
  if (email) {
    const byEmail = MOCK_DATA.customers.find(c => String(c.email || '').toLowerCase() === email);
    if (byEmail) return byEmail;
  }
  if (window.AutoWashConfig?.useMock || !user.token) {
    return getCustomerById(user.customerId)
      || getCustomerById(`cust-${String(user.customerId || '').padStart(3, '0')}`);
  }
  return null;
}

function getCurrentCustomer() {
  const user = getLoggedInUser();
  if (user) {
    const mockCustomer = findMockCustomerForUser(user);
    if (mockCustomer) return mockCustomer;
    return {
      id: user.customerId || user.id,
      customerId: user.customerId || user.id,
      name: user.name || user.fullName || 'Khách hàng',
      email: user.email || user.loginKey || '',
      tier: normalizeTierKey(user.tier || 'member'),
      points: Number(user.points || 0),
      totalVisits: Number(user.totalVisits || 0),
      totalSpending: Number(user.totalSpending || 0)
    };
  }
  return getCustomerById(MOCK_DATA.currentCustomerId);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('vi-VN');
}

function normalizeBookingStatus(status) {
  return String(status || 'pending').toLowerCase();
}

function getStatusBadge(status) {
  const key = normalizeBookingStatus(status);
  const map = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    in_progress: 'badge-progress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    active: 'badge-confirmed',
    inactive: 'badge-cancelled',
    available: 'badge-confirmed',
    used: 'badge-cancelled'
  };
  const labels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang rửa',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    active: 'Hoạt động',
    inactive: 'Ngừng',
    available: 'Chưa dùng',
    used: 'Đã dùng'
  };
  const cls = map[key] || 'badge-pending';
  const label = labels[key] || status;
  return `<span class="badge ${cls}">${label}</span>`;
}

function getTierBadge(tierId) {
  const key = normalizeTierKey(tierId);
  const colors = { member: '', silver: 'badge-silver', gold: 'badge-gold', platinum: 'badge-platinum' };
  return `<span class="badge badge-tier ${colors[key] || ''}">${getTierDisplayName(tierId)}</span>`;
}

function normalizeTierKey(tier) {
  const value = extractTierLabel(tier).toLowerCase() || String(tier || '').toLowerCase();
  if (value.includes('bronze') || value === 'member') return 'member';
  if (value.includes('silver')) return 'silver';
  if (value.includes('gold')) return 'gold';
  if (value.includes('diamond') || value.includes('platinum')) return 'platinum';
  return value || 'member';
}

function getTierBadgeFromLoyaltyTier(loyaltyTier) {
  return getTierBadge(normalizeTierKey(loyaltyTier));
}

function normalizeCustomer(customer) {
  return {
    fullName: customer.fullName || customer.name || '',
    phoneNumber: customer.phoneNumber || customer.phone || '',
    email: customer.email || '',
    loyaltyTier: customer.loyaltyTier || customer.currentTier || customer.tier || 'member',
    currentPoints: Number(customer.currentPoints ?? customer.pointsBalance ?? customer.points ?? 0),
    totalVisits: Number(customer.totalVisits ?? 0),
    totalSpend: Number(customer.totalSpend ?? customer.totalSpending ?? 0)
  };
}

async function fetchAdminCustomers() {
  if (!window.AutoWashAPI) {
    throw new Error('API chưa sẵn sàng.');
  }

  const list = await window.AutoWashAPI.customers.getAll();
  return (Array.isArray(list) ? list : []).map(normalizeCustomer);
}

function saveToStorage(key, data) {
  localStorage.setItem('autowash_' + key, JSON.stringify(data));
}

function loadFromStorage(key, fallback) {
  const raw = localStorage.getItem('autowash_' + key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

function initStorage() {
  if (!localStorage.getItem('autowash_initialized')) {
    saveToStorage('vehicles', MOCK_DATA.vehicles);
    saveToStorage('bookings', MOCK_DATA.bookings);
    saveToStorage('services', MOCK_DATA.services);
    saveToStorage('promotions', MOCK_DATA.promotions);
    saveToStorage('loyaltyTiers', MOCK_DATA.loyaltyTiers);
    saveToStorage('rewardCatalog', MOCK_DATA.rewardCatalog);
    localStorage.setItem('autowash_initialized', 'true');
  }
  MOCK_DATA.loyaltyTiers = loadFromStorage('loyaltyTiers', MOCK_DATA.loyaltyTiers);
}

function getBookings() {
  return loadFromStorage('bookings', [...MOCK_DATA.bookings]);
}

function getVehicles() {
  return loadFromStorage('vehicles', [...MOCK_DATA.vehicles]);
}

function getActiveVehicles() {
  return getVehicles().filter(v => v.isActive !== false);
}

function numId(value) {
  if (value == null) return null;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function getLoggedInCustomerId() {
  const stored = localStorage.getItem('autowash_user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    const raw = user.customerId ?? user.id;
    if (raw == null) return null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : numId(raw);
  } catch (e) {
    return null;
  }
}

function normalizeVehicle(vehicle) {
  const vehicleId = vehicle.vehicleId ?? numId(vehicle.id) ?? vehicle.id;
  return {
    id: vehicleId,
    vehicleId,
    customerId: vehicle.customerId,
    licensePlate: vehicle.licensePlate,
    vehicleType: vehicle.vehicleType,
    brand: vehicle.brand || '',
    color: vehicle.color || '',
    notes: vehicle.notes || '',
    isActive: vehicle.isActive !== false
  };
}

function buildVehicleRequest(customerId, fields) {
  return {
    customerId: Number(customerId),
    licensePlate: fields.licensePlate,
    vehicleType: fields.vehicleType,
    brand: fields.brand,
    color: fields.color || ''
  };
}

function usesRealApi() {
  return window.AutoWashAPI && window.AutoWashConfig && window.AutoWashConfig.useMock === false;
}

async function fetchCustomerVehicles(customerId) {
  if (!window.AutoWashAPI) {
    throw new Error('API chưa sẵn sàng.');
  }

  const id = customerId ?? getLoggedInCustomerId();
  if (!id) {
    throw new Error('Chưa xác định được customer đang đăng nhập.');
  }

  const list = await window.AutoWashAPI.vehicles.byCustomer(id);
  return (Array.isArray(list) ? list : [])
    .filter(v => v.isActive !== false)
    .map(normalizeVehicle);
}

function normalizeReward(reward) {
  return {
    rewardId: reward.rewardId ?? numId(reward.id),
    rewardName: reward.rewardName || reward.name || '',
    description: reward.description || '',
    pointsRequired: Number(reward.pointsRequired ?? reward.pointsCost ?? 0),
    discountAmount: Number(reward.discountAmount ?? 0),
    stockQuantity: Number(reward.stockQuantity ?? 0),
    isActive: reward.isActive !== false
  };
}

function buildRewardRequest(fields) {
  return {
    rewardName: fields.rewardName,
    description: fields.description || '',
    pointsRequired: Number(fields.pointsRequired),
    discountAmount: Number(fields.discountAmount),
    stockQuantity: Number(fields.stockQuantity),
    isActive: fields.isActive === true || fields.isActive === 'true'
  };
}

async function fetchAdminRewards() {
  if (!window.AutoWashAPI) {
    throw new Error('API chưa sẵn sàng.');
  }

  const list = await window.AutoWashAPI.rewards.getAll();
  return (Array.isArray(list) ? list : []).map(normalizeReward);
}

function getServices() {
  return loadFromStorage('services', [...MOCK_DATA.services]);
}

function getPromotions() {
  return loadFromStorage('promotions', [...MOCK_DATA.promotions]);
}

function normalizeWashService(service) {
  return {
    serviceId: service.serviceId ?? numId(service.id),
    serviceName: service.serviceName || service.name || '',
    description: service.description || '',
    vehicleType: service.vehicleType || inferServiceVehicleType(service.serviceName || service.name || ''),
    price: Number(service.price || 0),
    durationMinutes: Number(service.durationMinutes ?? service.duration ?? 30),
    isActive: service.isActive !== false && service.active !== false
  };
}

function inferServiceVehicleType(serviceName) {
  const name = String(serviceName || '').toLowerCase();
  if (/(motorbike|xe máy|xe may|moto)/i.test(name)) return 'Motorbike';
  if (/(car|ô tô|oto|xe hơi)/i.test(name)) return 'Car';
  return '';
}

function normalizeVehicleType(type) {
  const value = String(type || '').trim().toLowerCase();
  if (value.includes('motor') || value.includes('moto') || value.includes('xe máy') || value.includes('xe may')) {
    return 'motorbike';
  }
  if (value.includes('car') || value.includes('oto') || value.includes('ô tô') || value.includes('xe hoi')) {
    return 'car';
  }
  return value;
}

function serviceMatchesVehicleType(service, vehicleType) {
  if (!vehicleType || !service.vehicleType) return true;
  return normalizeVehicleType(service.vehicleType) === normalizeVehicleType(vehicleType);
}

function bookingServicesUseVehicleType() {
  return bookingServices.some(s => s.vehicleType);
}

function normalizePromotion(promo) {
  return {
    promoId: promo.promoId ?? numId(promo.id),
    promoName: promo.promoName || promo.name || '',
    description: promo.description || '',
    discountAmount: Number(promo.discountAmount ?? promo.discountValue ?? 0),
    startDate: promo.startDate,
    endDate: promo.endDate,
    minTierId: promo.minTierId ?? getPromotionMinTierId(promo),
    minTierName: promo.minTierName || getDbTierName(promo.minTierId ?? getPromotionMinTierId(promo)),
    isActive: promo.isActive !== false && promo.status !== 'inactive'
  };
}

function normalizeBooking(booking) {
  const id = booking.id ?? booking.bookingId ?? numId(booking.id);
  const time = booking.startTime || booking.createdAt || booking.time || booking.bookingTime || '';
  const timeText = typeof time === 'string' && time.includes(':') ? time.slice(0, 5) : String(time || '-');
  return {
    id,
    bookingId: id,
    customerName: booking.fullName || booking.customerName || '',
    vehiclePlate: booking.licensePlate || booking.vehiclePlate || '',
    serviceName: booking.serviceName || '',
    date: booking.bookingDate || booking.date || '',
    time: timeText,
    status: normalizeBookingStatus(booking.status),
    totalPrice: Number(booking.totalPrice ?? 0),
    pointsEarned: booking.pointsEarned ?? booking.totalPointEarned ?? '-'
  };
}

function normalizeRedemption(item) {
  return {
    redemptionId: item.redemptionId ?? numId(item.id),
    rewardId: item.rewardId,
    rewardName: item.rewardName || '',
    pointsUsed: Number(item.pointsUsed ?? 0),
    discountAmount: Number(item.discountAmount ?? 0),
    redemptionDate: item.redemptionDate,
    bookingId: item.bookingId ?? null,
    status: item.status || (item.bookingId ? 'USED' : 'AVAILABLE')
  };
}

function normalizeCustomerProfile(profile) {
  const loyaltyTier = profile.loyaltyTier;
  const tierName = loyaltyTier?.tierName || (typeof loyaltyTier === 'string' ? loyaltyTier : null) || profile.currentTier || 'BRONZE';
  return {
    id: profile.customerId ?? getLoggedInCustomerId(),
    customerId: profile.customerId ?? getLoggedInCustomerId(),
    name: profile.fullName || profile.name || '',
    email: profile.email || '',
    phone: profile.phoneNumber || profile.phone || '',
    tier: normalizeTierKey(tierName),
    loyaltyTier: loyaltyTier || tierName,
    tierName,
    points: Number(profile.currentPoints ?? profile.pointsBalance ?? 0),
    totalVisits: Number(profile.totalVisits ?? 0),
    totalSpending: Number(profile.totalSpend ?? profile.totalSpending ?? 0)
  };
}

async function fetchCustomerProfile(customerId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const id = customerId ?? getLoggedInCustomerId();
  const profile = await window.AutoWashAPI.customers.profile(id);
  return normalizeCustomerProfile(profile);
}

async function fetchActiveWashServices() {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const list = await window.AutoWashAPI.washServices.active();
  return (Array.isArray(list) ? list : []).map(normalizeWashService);
}

async function fetchActivePromotions() {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const list = await window.AutoWashAPI.promotions.active();
  return (Array.isArray(list) ? list : []).map(normalizePromotion);
}

async function fetchAvailableSlots(date, washServiceId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const list = await window.AutoWashAPI.bookings.availableSlots(date, washServiceId);
  return Array.isArray(list) ? list : [];
}

async function fetchBookings() {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const list = await window.AutoWashAPI.bookings.list();
  return (Array.isArray(list) ? list : []).map(normalizeBooking);
}

async function fetchCustomerBookings(customerId) {
  const user = getLoggedInUser();
  const profile = user?.name ? { name: user.name } : await fetchCustomerProfile(customerId).catch(() => null);
  const customerName = profile?.name || profile?.fullName || user?.name || user?.fullName || '';
  const bookings = await fetchBookings();
  if (!customerName) return bookings;
  return bookings.filter(b => b.customerName === customerName);
}

async function createBookingRequest(payload) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  return window.AutoWashAPI.bookings.create(payload);
}

async function confirmBookingArrival(bookingId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  return window.AutoWashAPI.bookings.confirmArrival(bookingId);
}

async function completeBooking(bookingId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  return window.AutoWashAPI.bookings.complete(bookingId);
}

async function cancelBookingRequest(bookingId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  return window.AutoWashAPI.bookings.cancel(bookingId);
}

async function fetchCustomerRewardCatalog() {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const list = await window.AutoWashAPI.rewards.catalog();
  return (Array.isArray(list) ? list : []).map(normalizeReward);
}

async function fetchUnusedVouchers(customerId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const id = customerId ?? getLoggedInCustomerId();
  const list = await window.AutoWashAPI.rewards.unused(id);
  return (Array.isArray(list) ? list : []).map(normalizeRedemption);
}

async function fetchRedemptionHistory(customerId) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  const id = customerId ?? getLoggedInCustomerId();
  const list = await window.AutoWashAPI.rewards.history(id);
  return (Array.isArray(list) ? list : []).map(normalizeRedemption);
}

async function redeemCustomerReward(customerId, rewardId, quantity = 1) {
  if (!window.AutoWashAPI) throw new Error('API chưa sẵn sàng.');
  return window.AutoWashAPI.rewards.redeem({
    customerId: Number(customerId),
    rewardId: Number(rewardId),
    quantity: Number(quantity)
  });
}
