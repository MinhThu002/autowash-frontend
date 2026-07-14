/* AutoWash Pro - Mock Data (aligned with WashPRo.sql / AutoWashPro DB) */
const STORAGE_SCHEMA_VERSION = 'db-v2';

const MOCK_DATA = {
  currentCustomerId: 1,

  /* LoyaltyTier */
  loyaltyTiers: [
    { tierId: 1, tierName: 'Member', minSpending: 0, minVisits: 0, bookingWindowDays: 7, pointMultiplier: 1.0, priorityLevel: 1 },
    { tierId: 2, tierName: 'Silver', minSpending: 2000000, minVisits: 10, bookingWindowDays: 10, pointMultiplier: 1.2, priorityLevel: 2 },
    { tierId: 3, tierName: 'Gold', minSpending: 5000000, minVisits: 20, bookingWindowDays: 12, pointMultiplier: 1.5, priorityLevel: 3 },
    { tierId: 4, tierName: 'Platinum', minSpending: 10000000, minVisits: 40, bookingWindowDays: 14, pointMultiplier: 2.0, priorityLevel: 4 }
  ],

  /* Perk */
  perks: [
    { perkId: 1, perkName: 'Giảm giá 5%', discountPercent: 5, freeService: null, addOnItem: null },
    { perkId: 2, perkName: 'Sáp miễn phí', discountPercent: 0, freeService: 'Sáp bóng', addOnItem: null },
    { perkId: 3, perkName: 'Tặng vệ sinh nội thất', discountPercent: 0, freeService: null, addOnItem: 'Vệ sinh nội thất' }
  ],

  /* TierPerk */
  tierPerks: [
    { tierId: 2, perkId: 1 },
    { tierId: 3, perkId: 1 }, { tierId: 3, perkId: 2 },
    { tierId: 4, perkId: 1 }, { tierId: 4, perkId: 2 }, { tierId: 4, perkId: 3 }
  ],

  /* AdminAccount */
  adminAccounts: [
    { adminId: 1, fullName: 'Quản trị viên chính', username: 'admin', password: '123456', role: 'Manager' },
    { adminId: 2, fullName: 'Nhân viên CSKH', username: 'staff1', password: '123456', role: 'Staff' }
  ],

  /* Customer — sample from WashPRo.sql + extras for UI */
  customers: [
    { customerId: 1, fullName: 'Nguyễn Văn A', phoneNumber: '0901234567', email: 'vana@gmail.com', tierId: 1, currentPoints: 100, totalSpend: 120000, totalVisits: 1, lastTierReview: null, tierUpdatedByAdminId: null, createdAt: '2026-05-01T08:00:00' },
    { customerId: 2, fullName: 'Trần Thị B', phoneNumber: '0912345678', email: 'thib@gmail.com', tierId: 2, currentPoints: 500, totalSpend: 200000, totalVisits: 1, lastTierReview: null, tierUpdatedByAdminId: null, createdAt: '2026-05-01T09:00:00' },
    { customerId: 3, fullName: 'Lê Minh C', phoneNumber: '0923456789', email: 'minhc@gmail.com', tierId: 3, currentPoints: 1800, totalSpend: 5200000, totalVisits: 22, lastTierReview: '2026-04-01', tierUpdatedByAdminId: null, createdAt: '2026-01-15T10:00:00' },
    { customerId: 4, fullName: 'Phạm Thu D', phoneNumber: '0934567890', email: 'thud@gmail.com', tierId: 4, currentPoints: 4200, totalSpend: 12500000, totalVisits: 45, lastTierReview: '2026-04-01', tierUpdatedByAdminId: 1, createdAt: '2025-11-20T11:00:00' }
  ],

  /* Vehicle */
  vehicles: [
    { vehicleId: 1, customerId: 1, licensePlate: '59A-12345', vehicleType: 'Motorbike', brand: 'Honda', color: 'Black' },
    { vehicleId: 2, customerId: 2, licensePlate: '61B-67890', vehicleType: 'Motorbike', brand: 'Yamaha', color: 'Red' },
    { vehicleId: 3, customerId: 3, licensePlate: '51A-88888', vehicleType: 'Car', brand: 'Toyota', color: 'White' },
    { vehicleId: 4, customerId: 4, licensePlate: '30F-99999', vehicleType: 'Car', brand: 'Mercedes', color: 'Silver' }
  ],

  /**
   * Danh mục service_type cho UI (DB không có bảng WashService).
   * Booking.service_type lưu chuỗi tên dịch vụ.
   */
  serviceCatalog: [
    { serviceType: 'Rửa nhanh', basePrice: 80000 },
    { serviceType: 'Rửa tiêu chuẩn', basePrice: 120000 },
    { serviceType: 'Rửa cao cấp', basePrice: 200000 },
    { serviceType: 'Rửa toàn diện', basePrice: 250000 }
  ],

  /* Booking — status theo sample DB: Pending, Confirmed, ... */
  bookings: [
    { bookingId: 1, vehicleId: 1, bookingDate: '2026-05-20', bookingTime: '09:00', serviceType: 'Rửa cao cấp', status: 'Pending', priorityLevel: 1, tierIdAtBooking: 1, cancelledByAdminId: null, createdAt: '2026-05-18T10:00:00' },
    { bookingId: 2, vehicleId: 2, bookingDate: '2026-05-20', bookingTime: '10:00', serviceType: 'Rửa toàn diện', status: 'Confirmed', priorityLevel: 2, tierIdAtBooking: 2, cancelledByAdminId: null, createdAt: '2026-05-18T11:00:00' },
    { bookingId: 3, vehicleId: 3, bookingDate: '2026-05-22', bookingTime: '14:00', serviceType: 'Rửa tiêu chuẩn', status: 'Confirmed', priorityLevel: 3, tierIdAtBooking: 3, cancelledByAdminId: null, createdAt: '2026-05-19T09:00:00' },
    { bookingId: 4, vehicleId: 1, bookingDate: '2026-05-10', bookingTime: '11:00', serviceType: 'Rửa nhanh', status: 'Completed', priorityLevel: 1, tierIdAtBooking: 1, cancelledByAdminId: null, createdAt: '2026-05-08T08:00:00' },
    { bookingId: 5, vehicleId: 4, bookingDate: '2026-05-19', bookingTime: '08:00', serviceType: 'Rửa cao cấp', status: 'Completed', priorityLevel: 4, tierIdAtBooking: 4, cancelledByAdminId: null, createdAt: '2026-05-17T07:00:00' },
    { bookingId: 6, vehicleId: 3, bookingDate: '2026-05-18', bookingTime: '15:00', serviceType: 'Rửa tiêu chuẩn', status: 'Cancelled', priorityLevel: 3, tierIdAtBooking: 3, cancelledByAdminId: 1, createdAt: '2026-05-16T12:00:00' }
  ],

  /* WashHistory — money/points live here, not on Booking */
  washHistory: [
    { washId: 1, bookingId: 4, washDate: '2026-05-10T11:30:00', amountPaid: 80000, pointsEarned: 12, pointsUsed: 0, perkApplied: 'Không' },
    { washId: 2, bookingId: 5, washDate: '2026-05-19T09:00:00', amountPaid: 170000, pointsEarned: 20, pointsUsed: 50, perkApplied: 'Giảm 5% (Silver)' },
    { washId: 3, bookingId: 1, washDate: '2026-05-20T09:45:00', amountPaid: 120000, pointsEarned: 12, pointsUsed: 0, perkApplied: 'Không' },
    { washId: 4, bookingId: 2, washDate: '2026-05-20T10:50:00', amountPaid: 200000, pointsEarned: 20, pointsUsed: 50, perkApplied: 'Giảm 5% (Silver)' }
  ],

  /* LoyaltyPoint */
  loyaltyPoints: [
    { pointId: 1, customerId: 1, washId: 1, pointsChange: 12, transactionType: 'Earn', expiryDate: '2027-05-20', createdAt: '2026-05-10T11:35:00' },
    { pointId: 2, customerId: 2, washId: 2, pointsChange: -50, transactionType: 'Redeem', expiryDate: null, createdAt: '2026-05-19T09:05:00' },
    { pointId: 3, customerId: 1, washId: 3, pointsChange: 12, transactionType: 'Earn', expiryDate: '2027-05-20', createdAt: '2026-05-20T09:50:00' },
    { pointId: 4, customerId: 2, washId: 4, pointsChange: 20, transactionType: 'Earn', expiryDate: '2027-05-20', createdAt: '2026-05-20T10:55:00' },
    { pointId: 5, customerId: 2, washId: null, pointsChange: -100, transactionType: 'Redeem', expiryDate: null, createdAt: '2026-05-15T16:00:00' }
  ],

  /* Promotion — only discount_percent in DB */
  promotions: [
    { promotionId: 1, title: 'Ưu đãi tháng 5', description: 'Giảm 10% cho khách Silver trở lên', minTierId: 2, discountPercent: 10, startDate: '2026-05-01', endDate: '2026-05-31', status: 'Active', createdByAdminId: 1 },
    { promotionId: 2, title: 'Khách mới', description: 'Giảm 5% cho mọi hạng', minTierId: null, discountPercent: 5, startDate: '2026-05-01', endDate: '2026-08-31', status: 'Active', createdByAdminId: 1 },
    { promotionId: 3, title: 'Tết 2025', description: 'Khuyến mãi đã kết thúc', minTierId: null, discountPercent: 20, startDate: '2025-01-01', endDate: '2025-02-15', status: 'Inactive', createdByAdminId: 1 }
  ],

  /* RewardCatalog */
  rewardCatalog: [
    { rewardId: 1, rewardName: 'Giảm 10.000đ', pointsRequired: 100, discountAmount: 10000, freeWash: false, isActive: true, createdByAdminId: 1 },
    { rewardId: 2, rewardName: 'Rửa xe miễn phí', pointsRequired: 300, discountAmount: 0, freeWash: true, isActive: true, createdByAdminId: 1 },
    { rewardId: 3, rewardName: 'Giảm 50.000đ', pointsRequired: 500, discountAmount: 50000, freeWash: false, isActive: true, createdByAdminId: 1 },
    { rewardId: 4, rewardName: 'Quà ngừng phát hành', pointsRequired: 200, discountAmount: 20000, freeWash: false, isActive: false, createdByAdminId: 1 }
  ],

  /* RewardRedemption */
  rewardRedemptions: [
    { redemptionId: 1, customerId: 2, rewardId: 1, pointsUsed: 100, redemptionDate: '2026-05-15T16:00:00' }
  ],

  /* CustomerMonthlyStats */
  customerMonthlyStats: [
    { statsId: 1, customerId: 1, yearMonth: '202605', monthlySpend: 200000, monthlyVisits: 2 },
    { statsId: 2, customerId: 2, yearMonth: '202605', monthlySpend: 400000, monthlyVisits: 2 },
    { statsId: 3, customerId: 3, yearMonth: '202605', monthlySpend: 800000, monthlyVisits: 4 },
    { statsId: 4, customerId: 4, yearMonth: '202605', monthlySpend: 1200000, monthlyVisits: 5 }
  ],

  /* UI-only: khung giờ chọn trên form (không phải bảng TimeSlot) */
  bookingTimeOptions: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],

  analyticsData: {
    totalBookings: 6,
    todayBookings: 2,
    totalRevenue: 570000,
    newCustomers: 2,
    repeatCustomers: 2,
    activePromotions: 2,
    customersByTier: { member: 1, silver: 1, gold: 1, platinum: 1 },
    monthlyRevenue: [80000, 120000, 90000, 150000, 200000, 170000],
    bookingTrend: [2, 3, 2, 4, 5, 6],
    rewardUsageRate: 25,
    topLoyalCustomers: [
      { name: 'Phạm Thu D', visits: 45, spending: 12500000 },
      { name: 'Lê Minh C', visits: 22, spending: 5200000 },
      { name: 'Trần Thị B', visits: 1, spending: 200000 }
    ],
    topServices: [
      { name: 'Rửa cao cấp', count: 2 },
      { name: 'Rửa tiêu chuẩn', count: 2 },
      { name: 'Rửa toàn diện', count: 1 },
      { name: 'Rửa nhanh', count: 1 }
    ]
  }
};

/* ---------- Tier helpers ---------- */

function tierKey(tier) {
  if (tier == null) return 'member';
  if (typeof tier === 'object') return String(tier.tierName || '').toLowerCase() || 'member';
  const value = String(tier).toLowerCase();
  if (/^\d+$/.test(value)) {
    const found = MOCK_DATA.loyaltyTiers.find(t => t.tierId === Number(value));
    return found ? found.tierName.toLowerCase() : 'member';
  }
  if (value.includes('bronze') || value === 'member') return 'member';
  if (value.includes('silver')) return 'silver';
  if (value.includes('gold')) return 'gold';
  if (value.includes('diamond') || value.includes('platinum')) return 'platinum';
  return value || 'member';
}

function getTierById(tierIdOrKey) {
  if (tierIdOrKey == null) return MOCK_DATA.loyaltyTiers[0];
  if (typeof tierIdOrKey === 'object') return tierIdOrKey;
  const n = Number(tierIdOrKey);
  if (Number.isFinite(n) && n > 0) {
    return MOCK_DATA.loyaltyTiers.find(t => t.tierId === n) || MOCK_DATA.loyaltyTiers[0];
  }
  const key = tierKey(tierIdOrKey);
  return MOCK_DATA.loyaltyTiers.find(t => t.tierName.toLowerCase() === key) || MOCK_DATA.loyaltyTiers[0];
}

function getPerksForTier(tierId) {
  const ids = MOCK_DATA.tierPerks.filter(tp => tp.tierId === Number(tierId)).map(tp => tp.perkId);
  return MOCK_DATA.perks.filter(p => ids.includes(p.perkId));
}

function getTierDiscountPercent(tierId) {
  const perks = getPerksForTier(tierId);
  return perks.reduce((max, p) => Math.max(max, Number(p.discountPercent) || 0), 0);
}

function describePerk(perk) {
  const parts = [];
  if (perk.discountPercent) parts.push(`Giảm ${perk.discountPercent}%`);
  if (perk.freeService) parts.push(`Miễn phí: ${perk.freeService}`);
  if (perk.addOnItem) parts.push(`Tặng: ${perk.addOnItem}`);
  return parts.length ? parts.join(' • ') : perk.perkName;
}

function getTierBenefits(tierId) {
  const tier = getTierById(tierId);
  const benefits = [
    `Đặt lịch trước ${tier.bookingWindowDays} ngày`,
    `Hệ số điểm x${tier.pointMultiplier}`,
    `Ưu tiên xếp hàng: ${tier.priorityLevel}`
  ];
  getPerksForTier(tier.tierId).forEach(p => benefits.push(describePerk(p)));
  return benefits;
}

/* ---------- Customer / vehicle ---------- */

function getCustomerById(id) {
  const n = Number(id);
  const customers = loadFromStorage('customers', MOCK_DATA.customers);
  return customers.find(c => Number(c.customerId) === n || c.customerId === id);
}

function getAuthUser() {
  const stored = localStorage.getItem('autowash_user');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch (e) { return null; }
}

function getCurrentCustomer() {
  const user = getAuthUser();
  if (user && usesRealApi()) {
    const cached = loadFromStorage('currentCustomerProfile', null);
    if (cached && Number(cached.customerId) === Number(user.customerId || user.id)) {
      return normalizeCustomer(cached);
    }
    return normalizeCustomer({
      customerId: user.customerId || user.id,
      fullName: user.name || user.fullName || 'Khách hàng',
      email: user.email || user.loginKey || '',
      phoneNumber: user.phoneNumber || '',
      tierId: user.tierId || 1,
      currentPoints: user.currentPoints || 0,
      totalVisits: user.totalVisits || 0,
      totalSpend: user.totalSpend || 0,
      loyaltyTier: user.loyaltyTier || 'Member'
    });
  }

  if (user) {
    const raw = user.customerId ?? user.id;
    return getCustomerById(raw) || getCustomerById(MOCK_DATA.currentCustomerId);
  }
  return getCustomerById(MOCK_DATA.currentCustomerId);
}

async function refreshCurrentCustomerProfile() {
  if (!usesRealApi() || !window.AutoWashAPI) return getCurrentCustomer();
  const id = getLoggedInCustomerId();
  if (!id) return getCurrentCustomer();
  try {
    const profile = await window.AutoWashAPI.customers.profile(id);
    const normalized = normalizeCustomer({ ...profile, customerId: id });
    saveToStorage('currentCustomerProfile', normalized);
    return normalized;
  } catch (e) {
    return getCurrentCustomer();
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const raw = String(dateStr).slice(0, 10);
  const d = new Date(raw + 'T00:00:00');
  return d.toLocaleDateString('vi-VN');
}

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function getStatusBadge(status) {
  const key = normalizeStatus(status);
  const map = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    in_progress: 'badge-progress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    active: 'badge-confirmed',
    inactive: 'badge-cancelled'
  };
  const labels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang rửa',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    active: 'Hoạt động',
    inactive: 'Ngừng'
  };
  const cls = map[key] || 'badge-pending';
  const label = labels[key] || status;
  return `<span class="badge ${cls}">${label}</span>`;
}

function getTierBadge(tierIdOrKey) {
  const tier = getTierById(tierIdOrKey);
  const key = tierKey(tier);
  const colors = { member: '', silver: 'badge-silver', gold: 'badge-gold', platinum: 'badge-platinum' };
  return `<span class="badge badge-tier ${colors[key] || ''}">${tier.tierName}</span>`;
}

function normalizeTierKey(tier) {
  return tierKey(tier);
}

function getTierBadgeFromLoyaltyTier(loyaltyTier) {
  return getTierBadge(normalizeTierKey(loyaltyTier));
}

function normalizeCustomer(customer) {
  const tierId = customer.tierId ?? customer.tier_id ?? tierKeyToId(customer.loyaltyTier || customer.currentTier || customer.tier);
  const tier = getTierById(tierId);
  return {
    customerId: customer.customerId ?? numId(customer.id),
    fullName: customer.fullName || customer.name || '',
    phoneNumber: customer.phoneNumber || customer.phone || '',
    email: customer.email || '',
    tierId: tier.tierId,
    loyaltyTier: tier.tierName,
    currentPoints: Number(customer.currentPoints ?? customer.pointsBalance ?? customer.points ?? 0),
    totalVisits: Number(customer.totalVisits ?? 0),
    totalSpend: Number(customer.totalSpend ?? customer.totalSpending ?? 0)
  };
}

function tierKeyToId(tier) {
  return getTierById(tier).tierId;
}

async function fetchAdminCustomers() {
  if (!window.AutoWashAPI) {
    return MOCK_DATA.customers.map(normalizeCustomer);
  }

  try {
    const list = await window.AutoWashAPI.customers.getAll();
    return (Array.isArray(list) ? list : []).map(normalizeCustomer);
  } catch (e) {
    return MOCK_DATA.customers.map(normalizeCustomer);
  }
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
  const version = localStorage.getItem('autowash_schema_version');
  if (version !== STORAGE_SCHEMA_VERSION) {
    [
      'vehicles', 'bookings', 'services', 'serviceCatalog', 'promotions', 'rewardCatalog',
      'washHistory', 'loyaltyPoints', 'rewardRedemptions', 'customers', 'staffSchedule',
      'timeSlots', 'loyaltyTransactions'
    ].forEach(key => localStorage.removeItem('autowash_' + key));
    localStorage.removeItem('autowash_initialized');
    localStorage.setItem('autowash_schema_version', STORAGE_SCHEMA_VERSION);
  }

  if (!localStorage.getItem('autowash_initialized')) {
    saveToStorage('vehicles', MOCK_DATA.vehicles);
    saveToStorage('bookings', MOCK_DATA.bookings);
    saveToStorage('serviceCatalog', MOCK_DATA.serviceCatalog);
    saveToStorage('promotions', MOCK_DATA.promotions);
    saveToStorage('rewardCatalog', MOCK_DATA.rewardCatalog);
    saveToStorage('washHistory', MOCK_DATA.washHistory);
    saveToStorage('loyaltyPoints', MOCK_DATA.loyaltyPoints);
    saveToStorage('rewardRedemptions', MOCK_DATA.rewardRedemptions);
    saveToStorage('customers', MOCK_DATA.customers);
    localStorage.setItem('autowash_initialized', 'true');
  }
}

function getBookings() {
  return loadFromStorage('bookings', [...MOCK_DATA.bookings]);
}

function getWashHistory() {
  return loadFromStorage('washHistory', [...MOCK_DATA.washHistory]);
}

function getLoyaltyPoints() {
  return loadFromStorage('loyaltyPoints', [...MOCK_DATA.loyaltyPoints]);
}

function getVehicles() {
  return loadFromStorage('vehicles', [...MOCK_DATA.vehicles]);
}

function getActiveVehicles() {
  return getVehicles();
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
    vehicleId,
    id: vehicleId,
    customerId: vehicle.customerId,
    licensePlate: vehicle.licensePlate,
    vehicleType: vehicle.vehicleType,
    brand: vehicle.brand || '',
    color: vehicle.color || ''
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
  const id = customerId ?? getLoggedInCustomerId();
  if (!id) {
    throw new Error('Chưa xác định được customer đang đăng nhập.');
  }

  if (window.AutoWashAPI && usesRealApi()) {
    const list = await window.AutoWashAPI.vehicles.byCustomer(id);
    return (Array.isArray(list) ? list : []).map(normalizeVehicle);
  }

  if (window.AutoWashAPI) {
    try {
      const list = await window.AutoWashAPI.vehicles.byCustomer(id);
      return (Array.isArray(list) ? list : []).map(normalizeVehicle);
    } catch (e) { /* fallback local */ }
  }

  return getVehicles().filter(v => Number(v.customerId) === Number(id)).map(normalizeVehicle);
}

function normalizeReward(reward) {
  return {
    rewardId: reward.rewardId ?? numId(reward.id),
    rewardName: reward.rewardName || reward.name || '',
    pointsRequired: Number(reward.pointsRequired ?? reward.pointsCost ?? 0),
    discountAmount: Number(reward.discountAmount ?? 0),
    freeWash: Boolean(reward.freeWash ?? reward.free_wash),
    isActive: reward.isActive !== false,
    createdByAdminId: reward.createdByAdminId ?? null
  };
}

function buildRewardRequest(fields) {
  return {
    rewardName: fields.rewardName,
    description: fields.description || '',
    pointsRequired: Number(fields.pointsRequired),
    discountAmount: Number(fields.discountAmount || 0),
    stockQuantity: Number(fields.stockQuantity ?? 100),
    isActive: fields.isActive === true || fields.isActive === 'true'
  };
}

async function fetchAdminRewards() {
  if (!window.AutoWashAPI) {
    return getRewardCatalog().map(normalizeReward);
  }

  try {
    const list = await window.AutoWashAPI.rewards.getAll();
    return (Array.isArray(list) ? list : []).map(normalizeReward);
  } catch (e) {
    return getRewardCatalog().map(normalizeReward);
  }
}

function getServiceCatalog() {
  return loadFromStorage('serviceCatalog', [...MOCK_DATA.serviceCatalog]);
}

/** @deprecated use getServiceCatalog — kept for older call sites */
function getServices() {
  return getServiceCatalog().map((s, i) => ({
    id: `svc-${i + 1}`,
    name: s.serviceType,
    serviceType: s.serviceType,
    price: s.basePrice,
    active: true
  }));
}

function getPromotions() {
  return loadFromStorage('promotions', [...MOCK_DATA.promotions]);
}

function getRewardCatalog() {
  return loadFromStorage('rewardCatalog', [...MOCK_DATA.rewardCatalog]);
}

function getVehicleById(vehicleId) {
  return getVehicles().find(v => Number(v.vehicleId) === Number(vehicleId));
}

function getCustomerNameByVehicle(vehicleId) {
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) return '-';
  const customer = getCustomerById(vehicle.customerId);
  return customer ? customer.fullName : '-';
}

function getWashForBooking(bookingId) {
  return getWashHistory().find(w => Number(w.bookingId) === Number(bookingId));
}

function enrichBooking(booking) {
  const vehicle = getVehicleById(booking.vehicleId);
  const wash = getWashForBooking(booking.bookingId);
  const customer = vehicle ? getCustomerById(vehicle.customerId) : null;
  return {
    ...booking,
    customerId: customer?.customerId ?? vehicle?.customerId,
    customerName: customer?.fullName || '-',
    vehiclePlate: vehicle?.licensePlate || '-',
    vehicleBrand: vehicle?.brand || '-',
    amountPaid: wash?.amountPaid ?? null,
    pointsEarned: wash?.pointsEarned ?? null,
    perkApplied: wash?.perkApplied || null
  };
}

function getEnrichedBookings() {
  return getBookings().map(enrichBooking);
}

function getServiceBasePrice(serviceType) {
  const item = getServiceCatalog().find(s => s.serviceType === serviceType);
  return item ? Number(item.basePrice) : 0;
}

function buildStaffScheduleFromBookings() {
  const today = new Date().toISOString().slice(0, 10);
  return getEnrichedBookings()
    .filter(b => b.bookingDate === today || ['Pending', 'Confirmed', 'In_Progress', 'InProgress'].includes(b.status))
    .sort((a, b) => String(a.bookingTime).localeCompare(String(b.bookingTime)))
    .map(b => ({
      id: `ss-${b.bookingId}`,
      bookingId: b.bookingId,
      time: b.bookingTime,
      customerId: b.customerId,
      customerName: b.customerName,
      vehicle: b.vehicleBrand,
      licensePlate: b.vehiclePlate,
      service: b.serviceType,
      status: b.status
    }));
}
