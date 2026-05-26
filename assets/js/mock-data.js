/* AutoWash Pro - Mock Data */
const MOCK_DATA = {
  currentCustomerId: 'cust-001',

  loyaltyTiers: [
    { id: 'member', name: 'Member', requiredVisits: 0, requiredSpending: 0, pointRate: 1, bookingWindow: 7, discountPercent: 0, benefits: ['Đặt lịch trước 7 ngày', 'Tích điểm cơ bản'] },
    { id: 'silver', name: 'Silver', requiredVisits: 5, requiredSpending: 500000, pointRate: 1.2, bookingWindow: 10, discountPercent: 5, benefits: ['Giảm 5%', 'Đặt lịch 10 ngày', 'Ưu tiên xếp hàng nhẹ'] },
    { id: 'gold', name: 'Gold', requiredVisits: 15, requiredSpending: 2000000, pointRate: 1.5, bookingWindow: 12, discountPercent: 10, benefits: ['Giảm 10%', 'Đặt lịch 12 ngày', 'Quà sinh nhật'] },
    { id: 'platinum', name: 'Platinum', requiredVisits: 30, requiredSpending: 5000000, pointRate: 2, bookingWindow: 14, discountPercent: 15, benefits: ['Giảm 15%', 'Đặt lịch 14 ngày', 'Dịch vụ VIP', 'Tặng 1 lần rửa/tháng'] }
  ],

  customers: [
    { id: 'cust-001', name: 'Nguyễn Văn An', phone: '0901234567', email: 'an.nguyen@email.com', tier: 'gold', points: 2450, totalVisits: 18, totalSpending: 3200000, status: 'active' },
    { id: 'cust-002', name: 'Trần Thị Bình', phone: '0912345678', email: 'binh.tran@email.com', tier: 'silver', points: 890, totalVisits: 7, totalSpending: 980000, status: 'active' },
    { id: 'cust-003', name: 'Lê Minh Cường', phone: '0923456789', email: 'cuong.le@email.com', tier: 'platinum', points: 5200, totalVisits: 42, totalSpending: 8500000, status: 'active' },
    { id: 'cust-004', name: 'Phạm Thu Dung', phone: '0934567890', email: 'dung.pham@email.com', tier: 'member', points: 120, totalVisits: 2, totalSpending: 350000, status: 'active' },
    { id: 'cust-005', name: 'Hoàng Văn Em', phone: '0945678901', email: 'em.hoang@email.com', tier: 'gold', points: 1800, totalVisits: 14, totalSpending: 2100000, status: 'inactive' }
  ],

  vehicles: [
    { id: 'veh-001', customerId: 'cust-001', licensePlate: '51A-12345', vehicleType: 'Car', brand: 'Toyota Camry', color: 'Trắng', notes: 'Xe gia đình' },
    { id: 'veh-002', customerId: 'cust-001', licensePlate: '59-H1 6789', vehicleType: 'Motorbike', brand: 'Honda Vision', color: 'Đỏ', notes: '' },
    { id: 'veh-003', customerId: 'cust-002', licensePlate: '30F-98765', vehicleType: 'Car', brand: 'Hyundai Tucson', color: 'Xám', notes: '' }
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
    { id: 'BK-2026-001', customerId: 'cust-001', customerName: 'Nguyễn Văn An', vehicleId: 'veh-001', vehiclePlate: '51A-12345', serviceId: 'svc-004', serviceName: 'Rửa tiêu chuẩn', date: '2026-05-22', time: '09:00', status: 'confirmed', totalPrice: 162000, pointsEarned: 180, promotionId: null },
    { id: 'BK-2026-002', customerId: 'cust-001', customerName: 'Nguyễn Văn An', vehicleId: 'veh-002', vehiclePlate: '59-H1 6789', serviceId: 'svc-002', serviceName: 'Rửa tiêu chuẩn', date: '2026-05-15', time: '14:30', status: 'completed', totalPrice: 72000, pointsEarned: 96 },
    { id: 'BK-2026-003', customerId: 'cust-002', customerName: 'Trần Thị Bình', vehicleId: 'veh-003', vehiclePlate: '30F-98765', serviceId: 'svc-003', serviceName: 'Rửa nhanh', date: '2026-05-20', time: '10:00', status: 'pending', totalPrice: 114000, pointsEarned: 0 },
    { id: 'BK-2026-004', customerId: 'cust-003', customerName: 'Lê Minh Cường', vehicleId: 'veh-001', vehiclePlate: '51A-99999', serviceId: 'svc-005', serviceName: 'Rửa cao cấp', date: '2026-05-19', time: '08:00', status: 'in_progress', totalPrice: 297500, pointsEarned: 0 },
    { id: 'BK-2026-005', customerId: 'cust-001', customerName: 'Nguyễn Văn An', vehicleId: 'veh-001', vehiclePlate: '51A-12345', serviceId: 'svc-003', serviceName: 'Rửa nhanh', date: '2026-05-10', time: '11:00', status: 'completed', totalPrice: 108000, pointsEarned: 120 },
    { id: 'BK-2026-006', customerId: 'cust-004', customerName: 'Phạm Thu Dung', vehicleId: 'veh-003', vehiclePlate: '30F-11111', serviceId: 'svc-004', serviceName: 'Rửa tiêu chuẩn', date: '2026-05-18', time: '15:00', status: 'cancelled', totalPrice: 180000, pointsEarned: 0 }
  ],

  promotions: [
    { id: 'promo-001', name: 'Chào hè 2026', description: 'Giảm giá mùa hè cho tất cả dịch vụ ô tô', discountType: 'percent', discountValue: 15, startDate: '2026-05-01', endDate: '2026-08-31', targetTier: 'all', usageLimit: 500, usedCount: 128, status: 'active' },
    { id: 'promo-002', name: 'Gold Member Exclusive', description: 'Giảm thêm cho hạng Gold trở lên', discountType: 'percent', discountValue: 10, startDate: '2026-04-01', endDate: '2026-12-31', targetTier: 'gold', usageLimit: 200, usedCount: 45, status: 'active' },
    { id: 'promo-003', name: 'Xe máy cuối tuần', description: 'Giảm 20k cho rửa xe máy T7-CN', discountType: 'fixed', discountValue: 20000, startDate: '2026-05-01', endDate: '2026-06-30', targetTier: 'all', usageLimit: 1000, usedCount: 312, status: 'active' },
    { id: 'promo-004', name: 'Platinum VIP', description: 'Miễn phí wax nhẹ', discountType: 'fixed', discountValue: 50000, startDate: '2026-01-01', endDate: '2026-12-31', targetTier: 'platinum', usageLimit: 50, usedCount: 12, status: 'active' },
    { id: 'promo-005', name: 'Tết 2025', description: 'Khuyến mãi đã kết thúc', discountType: 'percent', discountValue: 20, startDate: '2025-01-01', endDate: '2025-02-15', targetTier: 'all', usageLimit: 300, usedCount: 300, status: 'inactive' }
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
      { name: 'Lê Minh Cường', visits: 42, spending: 8500000 },
      { name: 'Nguyễn Văn An', visits: 18, spending: 3200000 },
      { name: 'Hoàng Văn Em', visits: 14, spending: 2100000 }
    ],
    topServices: [
      { name: 'Rửa tiêu chuẩn (Car)', count: 412 },
      { name: 'Rửa nhanh (Car)', count: 298 },
      { name: 'Rửa tiêu chuẩn (Motorbike)', count: 256 },
      { name: 'Rửa cao cấp', count: 145 }
    ]
  },

  staffSchedule: [
    { id: 'ss-001', time: '08:00', customerId: 'cust-003', customerName: 'Lê Minh Cường', vehicle: 'Mercedes C200', licensePlate: '51A-99999', service: 'Rửa cao cấp', status: 'in_progress' },
    { id: 'ss-002', time: '09:00', customerId: 'cust-001', customerName: 'Nguyễn Văn An', vehicle: 'Toyota Camry', licensePlate: '51A-12345', service: 'Rửa tiêu chuẩn', status: 'confirmed' },
    { id: 'ss-003', time: '10:00', customerId: 'cust-002', customerName: 'Trần Thị Bình', vehicle: 'Hyundai Tucson', licensePlate: '30F-98765', service: 'Rửa nhanh', status: 'confirmed' },
    { id: 'ss-004', time: '11:00', customerId: 'cust-004', customerName: 'Phạm Thu Dung', vehicle: 'Mazda 3', licensePlate: '30F-11111', service: 'Rửa tiêu chuẩn', status: 'pending' },
    { id: 'ss-005', time: '14:00', customerId: 'cust-001', customerName: 'Nguyễn Văn An', vehicle: 'Honda Vision', licensePlate: '59-H1 6789', service: 'Rửa tiêu chuẩn', status: 'pending' }
  ]
};

function getTierById(tierId) {
  return MOCK_DATA.loyaltyTiers.find(t => t.id === tierId) || MOCK_DATA.loyaltyTiers[0];
}

function getCustomerById(id) {
  return MOCK_DATA.customers.find(c => c.id === id);
}

function getCurrentCustomer() {
  const stored = localStorage.getItem('autowash_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      return getCustomerById(user.customerId) || getCustomerById(MOCK_DATA.currentCustomerId);
    } catch (e) { /* ignore */ }
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

function getStatusBadge(status) {
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
  const cls = map[status] || 'badge-pending';
  const label = labels[status] || status;
  return `<span class="badge ${cls}">${label}</span>`;
}

function getTierBadge(tierId) {
  const tier = getTierById(tierId);
  const colors = { member: '', silver: 'badge-silver', gold: 'badge-gold', platinum: 'badge-platinum' };
  return `<span class="badge badge-tier ${colors[tierId] || ''}">${tier.name}</span>`;
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
    localStorage.setItem('autowash_initialized', 'true');
  }
}

function getBookings() {
  return loadFromStorage('bookings', [...MOCK_DATA.bookings]);
}

function getVehicles() {
  return loadFromStorage('vehicles', [...MOCK_DATA.vehicles]);
}

function getServices() {
  return loadFromStorage('services', [...MOCK_DATA.services]);
}

function getPromotions() {
  return loadFromStorage('promotions', [...MOCK_DATA.promotions]);
}
