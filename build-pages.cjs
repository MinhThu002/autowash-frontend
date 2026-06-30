const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const CSS = `  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/dashboard.css">
  <link rel="stylesheet" href="assets/css/responsive.css">`;

const SCRIPTS = `  <script src="assets/js/api-config.js"></script>
  <script src="assets/js/mock-api.js"></script>
  <script src="assets/js/mock-data.js"></script>
  <script src="assets/js/main.js"></script>
  <script src="assets/js/modal.js"></script>`;
const DASH = `  <script src="assets/js/dashboard.js"></script>`;
const BOOK = `  <script src="assets/js/booking.js"></script>`;

function fixHtml(html) {
  return html.replace(/<\/motion>/gi, '</div>').replace(/<motion\b/gi, '<div');
}

function customerSidebar(active) {
  const items = [
    ['customer-dashboard.html', '📊', 'Dashboard'],
    ['customer-vehicles.html', '🚗', 'Xe của tôi'],
    ['booking.html', '📅', 'Đặt lịch'],
    ['booking-history.html', '📋', 'Lịch sử'],
    ['loyalty.html', '⭐', 'Loyalty'],
    ['promotions.html', '🎁', 'Khuyến mãi']
  ];
  const links = items.map(([h, ic, lb]) =>
    `<li><a href="${h}" class="${active === h ? 'active' : ''}"><span class="nav-icon">${ic}</span>${lb}</a></li>`
  ).join('');
  return `<aside class="sidebar"><div class="sidebar-header"><a href="index.html" class="sidebar-logo">🚿 Auto<span>Wash</span> Pro</a><motion class="sidebar-role">Khách hàng</div></div><nav class="sidebar-nav"><ul>${links}</ul></nav><div class="sidebar-footer"><a href="#" onclick="logout();return false">🚪 Đăng xuất</a></div></aside>`;
}

function adminSidebar(active) {
  const items = [
    ['admin-dashboard.html', '📊', 'Dashboard'],
    ['admin-customers.html', '👥', 'Khách hàng'],
    ['admin-bookings.html', '📅', 'Bookings'],
    ['admin-services.html', '🔧', 'Dịch vụ'],
    ['admin-loyalty-tiers.html', '🏆', 'Hạng TV'],
    ['admin-promotions.html', '🎁', 'Khuyến mãi'],
    ['admin-rewards.html', '🎖️', 'Quà tặng'],
    ['admin-analytics.html', '📈', 'Analytics']
  ];
  const links = items.map(([h, ic, lb]) =>
    `<li><a href="${h}" class="${active === h ? 'active' : ''}"><span class="nav-icon">${ic}</span>${lb}</a></li>`
  ).join('');
  return `<aside class="sidebar"><div class="sidebar-header"><a href="index.html" class="sidebar-logo">🚿 Auto<span>Wash</span> Pro</a><div class="sidebar-role">Quản trị</div></motion><nav class="sidebar-nav"><ul>${links}</ul></nav><div class="sidebar-footer"><a href="#" onclick="logout();return false">🚪 Đăng xuất</a></div></aside>`;
}

function staffSidebar() {
  return `<aside class="sidebar"><div class="sidebar-header"><a href="index.html" class="sidebar-logo">🚿 Auto<span>Wash</span> Pro</a><div class="sidebar-role">Nhân viên</div></div><nav class="sidebar-nav"><ul><li><a href="staff-schedule.html" class="active"><span class="nav-icon">📋</span>Lịch hôm nay</a></li></ul></nav><div class="sidebar-footer"><a href="#" onclick="logout();return false">🚪 Đăng xuất</a></motion></aside>`;
}

function layout(title, sidebar, body, extra, dataPage) {
  const dp = dataPage ? ` data-page="${dataPage}"` : '';
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AutoWash Pro</title>
${CSS}
</head>
<body${dp}>
<div class="app-layout">
  <div class="sidebar-overlay"></div>
  ${sidebar}
  <main class="main-content">
    <header class="navbar">
      <motion class="navbar-left">
        <button type="button" class="sidebar-toggle" aria-label="Menu">☰</button>
        <div class="navbar-title"><h2>${title}</h2></div>
      </div>
      <div class="navbar-right">
        <div class="navbar-user">
          <div class="user-avatar">NA</div>
          <div class="user-info"><div class="user-name">User</div><div class="user-tier">Member</div></div>
        </div>
      </div>
    </header>
    <div class="page-content">${body}</div>
  </main>
</motion>
${SCRIPTS}
${extra || ''}
</body>
</html>`;
}

const pages = {};

pages['register.html'] = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Đăng ký - AutoWash Pro</title>${CSS}</head>
<body class="auth-page">
<div class="auth-card">
  <div class="auth-logo"><h1>🚿 Auto<span>Wash</span> Pro</h1></div>
  <p class="auth-subtitle">Tạo tài khoản mới</p>
  <form id="registerForm">
    <div class="form-group"><label for="regName">Họ và tên</label><input type="text" id="regName" required></div>
    <div class="form-group"><label for="regPhone">Số điện thoại</label><input type="tel" id="regPhone" required></div>
    <div class="form-group"><label for="regEmail">Email</label><input type="email" id="regEmail" required></div>
    <div class="form-group"><label for="regPassword">Mật khẩu</label><input type="password" id="regPassword" required></div>
    <div class="form-group"><label for="regConfirm">Xác nhận mật khẩu</label><input type="password" id="regConfirm" required></div>
    <button type="submit" class="btn btn-primary btn-block">Đăng ký</button>
  </form>
  <p class="auth-links">Đã có tài khoản? <a href="login.html">Đăng nhập</a></p>
</div>
<script src="assets/js/mock-data.js"></script><script src="assets/js/main.js"></script>
</body></html>`;

pages['customer-dashboard.html'] = layout('Dashboard', customerSidebar('customer-dashboard.html'), `
<div class="welcome-banner">
  <div><h2>Xin chào, <span id="welcomeName">Khách hàng</span>! 👋</h2><p>Chào mừng trở lại AutoWash Pro</p></div>
  <div class="tier-highlight"><div class="tier-label">Hạng hiện tại</div><div class="tier-value" id="currentTier">Gold</div></div>
</div>
<div class="stats-grid">
  <div class="stat-card"><motion class="stat-icon cyan">⭐</div><div class="stat-label">Điểm tích lũy</div><div class="stat-value" id="pointsBalance">0</div></div>
  <div class="stat-card"><div class="stat-icon blue">🔄</div><div class="stat-label">Tổng lượt rửa</motion><div class="stat-value" id="totalVisits">0</div></div>
  <div class="stat-card"><div class="stat-icon green">💰</div><div class="stat-label">Tổng chi tiêu</div><div class="stat-value" id="totalSpending">0</div></div>
</div>
<div class="card tier-progress-card" style="margin-bottom:1.5rem">
  <h4>Tiến độ lên hạng <span id="nextTierName">Platinum</span></h4>
  <div class="tier-progress-info"><span id="tierProgressText">0%</span></div>
  <div class="progress-bar"><div class="progress-bar-fill" id="tierProgressFill" style="width:0%"></div></div>
</div>
<div class="dashboard-grid">
  <div class="card"><div class="card-header"><h3>Lịch hẹn sắp tới</h3><a href="booking.html" class="btn btn-sm btn-primary">Đặt lịch</a></div><div id="upcomingBooking"></div></div>
  <div class="card"><div class="card-header"><h3>Khuyến mãi gợi ý</h3></div><div id="recommendedPromos" style="display:flex;flex-direction:column;gap:0.75rem"></div></div>
</motion>
<div class="card"><div class="card-header"><h3>Lịch sử rửa gần đây</h3><a href="booking-history.html">Xem tất cả</a></div><div id="recentHistory"></div></div>
`, `  <script src="assets/js/loyaltytier.js"></script>
  <script src="assets/js/promotion.js"></script>
  <script src="assets/js/dashboard.js"></script>`, 'customer-dashboard');

pages['customer-vehicles.html'] = layout('Xe của tôi', customerSidebar('customer-vehicles.html'), `
<div class="page-header"><h2>Quản lý xe</h2><button class="btn btn-primary" onclick="openAddVehicle()">+ Thêm xe</button></div>
<div class="card"><motion id="vehiclesList"></div></motion>
<div class="modal-overlay" id="vehicleModal">
  <div class="modal">
    <div class="modal-header"><h3 id="vehicleModalTitle">Thêm xe mới</h3><button class="modal-close" data-modal-close="vehicleModal">&times;</button></div>
    <form id="vehicleForm">
      <div class="modal-body">
        <input type="hidden" id="vehicleId">
        <div class="form-group"><label>Biển số</label><input type="text" id="vehiclePlate" required></div>
        <div class="form-group"><label>Loại xe</label><select id="vehicleType"><option value="Car">Ô tô</option><option value="Motorbike">Xe máy</option></select></div>
        <div class="form-group"><label>Hãng xe</label><input type="text" id="vehicleBrand" required></div>
        <div class="form-group"><label>Màu sắc</label><input type="text" id="vehicleColor"></div>
        <div class="form-group"><label>Ghi chú</label><textarea id="vehicleNotes"></textarea></div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-secondary" data-modal-close="vehicleModal">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div>
    </form>
  </div>
</div>
`, DASH, 'customer-vehicles');

pages['booking.html'] = layout('Đặt lịch', customerSidebar('booking.html'), `
<div class="booking-form-layout">
  <div class="card">
    <form id="bookingForm">
      <div id="bookingWindowInfo" class="booking-window-info"></motion>
      <div class="form-group"><label>Chọn xe</label><select id="bookingVehicle" required><option value="">-- Chọn xe --</option></select></div>
      <div class="form-group"><label>Chọn dịch vụ</label><select id="bookingService" required><option value="">-- Chọn dịch vụ --</option></select></div>
      <div class="form-row">
        <div class="form-group"><label>Ngày</label><input type="date" id="bookingDate" required></div>
        <div class="form-group"><label>Khuyến mãi</label><select id="bookingPromotion"><option value="">Không dùng</option></select></div>
      </div>
      <div class="form-group"><label>Khung giờ</label><div id="timeSlots" class="time-slots"></div></div>
      <button type="submit" class="btn btn-primary btn-lg">Xác nhận đặt lịch</button>
    </form>
  </div>
  <div class="card">
    <h3>Tóm tắt thanh toán</h3>
    <div class="booking-summary">
      <div class="booking-summary-row"><span>Giá gốc</span><span id="summaryBase">0đ</span></div>
      <div class="booking-summary-row"><span>Giảm hạng</span><span id="summaryTierDiscount">-0đ</span></div>
      <motion class="booking-summary-row"><span>Giảm KM</span><span id="summaryPromoDiscount">-0đ</span></div>
      <div class="booking-summary-row total"><span>Tổng cộng</span><span id="summaryTotal">0đ</span></div>
      <div class="booking-summary-row"><span>Điểm dự kiến</span><span id="summaryPoints" class="text-primary">+0 điểm</span></div>
    </div>
  </div>
</div>
`, DASH + '\n' + BOOK, '');

// Continue with more pages in part 2 - write remaining via fs append

const more = {
  'booking-history.html': layout('Lịch sử đặt lịch', customerSidebar('booking-history.html'), `
<div class="filter-bar">
  <select id="filterStatus"><option value="all">Tất cả trạng thái</option><option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="in_progress">Đang rửa</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option></select>
  <input type="date" id="filterDateFrom" placeholder="Từ ngày">
  <input type="date" id="filterDateTo" placeholder="Đến ngày">
</div>
<div class="card table-wrapper"><table class="table" id="bookingsTable"><thead><tr><th>Mã</th><th>Ngày</th><th>Giờ</th><th>Xe</th><th>Dịch vụ</th><th>Trạng thái</th><th>Tổng</th><th>Điểm</th></tr></thead><tbody></tbody></table></div>
`, DASH, 'booking-history'),

  'loyalty.html': layout('Loyalty Program', customerSidebar('loyalty.html'), `
<div class="loyalty-hero">
  <div class="card current-tier-card gold"><h3>Hạng hiện tại</h3><div class="tier-name" id="loyaltyTierName">Gold</div><div class="points-display" id="loyaltyPoints">0</div><p class="text-muted">điểm</p></div>
  <div class="card">
    <h3>Quyền lợi hạng</h3><ul class="tier-benefits" id="tierBenefitsList"></ul>
    <h4 style="margin-top:1rem">Tiến độ lên <span id="loyaltyNextTier">Platinum</span></h4>
    <div class="progress-bar"><div class="progress-bar-fill" id="loyaltyProgressFill" style="width:0%"></div></div>
    <p id="loyaltyProgressLabel" class="form-hint"></p>
  </div>
</div>
<div class="dashboard-grid-equal">
  <div class="card table-wrapper"><h3>Lịch sử điểm</h3><table class="table" id="pointsHistory"><thead><tr><th>Ngày</th><th>Mô tả</th><th>Điểm</th></tr></thead><tbody></tbody></table></div>
  <div class="card"><h3>Đổi thưởng</h3><div class="rewards-grid" id="rewardsList"></div></div>
</motion>
`, `  <script src="assets/js/loyaltytier.js"></script>
  <script src="assets/js/dashboard.js"></script>`, 'loyalty'),

  'promotions.html': layout('Khuyến mãi', customerSidebar('promotions.html'), `
<div class="grid grid-3" id="promotionsGrid"></div>
`, `  <script src="assets/js/promotion.js"></script>
  <script src="assets/js/dashboard.js"></script>`, 'promotions'),

  'admin-dashboard.html': layout('Admin Dashboard', adminSidebar('admin-dashboard.html'), `
<div class="stats-grid">
  <div class="stat-card"><div class="stat-icon blue">📅</div><motion class="stat-label">Tổng booking</div><div class="stat-value" id="statTotalBookings">0</div></div>
  <div class="stat-card"><div class="stat-icon cyan">📆</div><div class="stat-label">Hôm nay</div><div class="stat-value" id="statTodayBookings">0</motion></div>
  <div class="stat-card"><div class="stat-icon green">💰</div><motion class="stat-label">Doanh thu</div><div class="stat-value" id="statRevenue">0</motion></div>
  <div class="stat-card"><div class="stat-icon purple">👤</motion><div class="stat-label">KH mới</div><div class="stat-value" id="statNewCustomers">0</div></div>
  <div class="stat-card"><motion class="stat-icon orange">🔄</div><div class="stat-label">KH quay lại</div><motion class="stat-value" id="statRepeatCustomers">0</div></div>
  <div class="stat-card"><div class="stat-icon blue">🎁</div><div class="stat-label">KM active</div><div class="stat-value" id="statActivePromos">0</div></div>
</div>
<div class="dashboard-grid">
  <div class="card"><h3>Doanh thu 6 tháng</h3><div id="revenueChart"></div></div>
  <div class="card"><h3>KH theo hạng</h3><div id="tierChart"></div></div>
</div>
<div class="card table-wrapper"><h3>Booking gần đây</h3><table class="table" id="recentBookingsTable"><thead><tr><th>Mã</th><th>KH</th><th>DV</th><th>Thời gian</th><th>TT</th><th>Tổng</th></tr></thead><tbody></tbody></table></div>
`, DASH, 'admin-dashboard'),

  'admin-customers.html': layout('Khách hàng', adminSidebar('admin-customers.html'), `
<div class="filter-bar"><input type="search" id="searchCustomer" placeholder="Tìm tên, SĐT, email..."><select id="filterTier"><option value="all">Tất cả hạng</option><option value="member">Member</option><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option></select></div>
<div class="card table-wrapper"><table class="table" id="customersTable"><thead><tr><th>Tên</th><th>SĐT</th><th>Email</th><th>Hạng</th><th>Điểm</th><th>Lượt</th><th>Chi tiêu</th><th>TT</th></tr></thead><tbody></tbody></table></div>
`, DASH, 'admin-customers'),

  'admin-bookings.html': layout('Quản lý Booking', adminSidebar('admin-bookings.html'), `
<div class="filter-bar"><select id="filterStatus"><option value="all">Tất cả</option><option value="pending">Chờ</option><option value="confirmed">Xác nhận</option><option value="in_progress">Đang rửa</option><option value="completed">Xong</option><option value="cancelled">Hủy</option></select></div>
<div class="card table-wrapper"><table class="table" id="adminBookingsTable"><thead><tr><th>KH</th><th>Xe</th><th>DV</th><th>Ngày</th><th>Giờ</th><th>TT</th><th>Tổng</th><th>Thao tác</th></tr></thead><tbody></tbody></table></div>
`, DASH, 'admin-bookings'),

  'admin-services.html': layout('Dịch vụ', adminSidebar('admin-services.html'), `
<div class="page-header"><h2>Dịch vụ</h2><button class="btn btn-primary" onclick="openAddService()">+ Thêm dịch vụ</button></div>
<div class="card table-wrapper"><table class="table" id="servicesTable"><thead><tr><th>Tên</th><th>Loại xe</th><th>TG</th><th>Giá</th><th>Mô tả</th><th>TT</th><th></th></tr></thead><tbody></tbody></table></div>
<div class="modal-overlay" id="serviceModal"><motion class="modal"><div class="modal-header"><h3>Dịch vụ</h3><button class="modal-close" data-modal-close="serviceModal">&times;</button></div>
<form id="serviceForm"><div class="modal-body"><input type="hidden" id="serviceId">
<div class="form-group"><label>Tên</label><input id="serviceName" required></div>
<div class="form-row"><div class="form-group"><label>Loại xe</label><select id="serviceVehicleType"><option>Car</option><option>Motorbike</option></select></div>
<div class="form-group"><label>Thời lượng (phút)</label><input type="number" id="serviceDuration" required></div></div>
<div class="form-group"><label>Giá</label><input type="number" id="servicePrice" required></div>
<div class="form-group"><label>Mô tả</label><textarea id="serviceDescription"></textarea></div>
<div class="form-group"><label>Trạng thái</label><select id="serviceActive"><option value="true">Active</option><option value="false">Inactive</option></select></div>
</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-modal-close="serviceModal">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form></div></div>
`, DASH, 'admin-services'),

  'admin-loyalty-tiers.html': layout('Hạng thành viên', adminSidebar('admin-loyalty-tiers.html'), `
<div class="page-header"><h2>Hạng thành viên</h2><button class="btn btn-primary" onclick="openAddLoyaltyTier()">+ Thêm hạng</button></div>
<div class="card table-wrapper"><table class="table" id="tiersTable"><thead><tr><th>Hạng</th><th>Chi tiêu tối thiểu</th><th>Lượt yêu cầu</th><th>Tỷ lệ điểm</th><th>Cửa sổ đặt (ngày)</th><th>Giảm %</th><th>Độ ưu tiên</th><th>TT</th><th></th></tr></thead><tbody></tbody></table></div>
<div class="modal-overlay" id="tierModal"><div class="modal"><div class="modal-header"><h3>Hạng thành viên</h3><button class="modal-close" data-modal-close="tierModal">&times;</button></div>
<form id="tierForm"><div class="modal-body">
<input type="hidden" id="tierId">
<div class="form-group"><label>Tên hạng</label><input id="tierName" required placeholder="Ví dụ: Silver, Gold"></div>
<div class="form-row">
  <div class="form-group"><label>Chi tiêu tối thiểu (VND)</label><input type="number" id="tierMinSpending" required min="0"></div>
  <div class="form-group"><label>Lượt yêu cầu</label><input type="number" id="tierMinVisits" required min="0"></div>
</div>
<div class="form-row">
  <div class="form-group"><label>Tỷ lệ điểm</label><input type="number" step="0.1" id="tierPointMultiplier" required min="1"></div>
  <div class="form-group"><label>Cửa sổ đặt lịch (ngày)</label><input type="number" id="tierBookingWindowDays" required min="1"></div>
</div>
<div class="form-row">
  <div class="form-group"><label>Phần trăm giảm (%)</label><input type="number" id="tierDiscountPercent" required min="0" max="100"></div>
  <div class="form-group"><label>Mức độ ưu tiên (số nguyên dương)</label><input type="number" id="tierPriorityLevel" required min="1"></div>
</div>
<div class="form-group"><label>Trạng thái</label><select id="tierIsActive"><option value="active">Hoạt động</option><option value="inactive">Ngừng</option></select></div>
</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-modal-close="tierModal">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form></div></div>
`, `  <script src="assets/js/api-config.js"></script>
  <script src="assets/js/mock-api.js"></script>
  <script src="assets/js/loyaltytier.js"></script>
  <script src="assets/js/dashboard.js"></script>`, 'admin-loyalty-tiers'),

  'admin-promotions.html': layout('Khuyến mãi', adminSidebar('admin-promotions.html'), `
<div class="page-header"><h2>Khuyến mãi</h2><button class="btn btn-primary" onclick="openAddPromotion()">+ Thêm KM</button></div>
<div class="card table-wrapper"><table class="table" id="promotionsTable"><thead><tr><th>Tên</th><th>Mô tả</th><th>Giảm</th><th>Bắt đầu</th><th>Kết thúc</th><th>Hạng</th><th>Limit</th><th>TT</th><th></th></tr></thead><tbody></tbody></table></div>
<div class="modal-overlay" id="promotionModal"><div class="modal"><div class="modal-header"><h3>Khuyến mãi</h3><button class="modal-close" data-modal-close="promotionModal">&times;</button></div>
<form id="promotionForm"><div class="modal-body"><input type="hidden" id="promoId">
<div class="form-group"><label>Tên</label><input id="promoName" required></div>
<div class="form-group"><label>Mô tả</label><textarea id="promoDescription"></textarea></motion>
<div class="form-row"><div class="form-group"><label>Loại giảm</label><select id="promoDiscountType"><option value="percent">%</option><option value="fixed">Cố định</option></select></div>
<div class="form-group"><label>Giá trị</label><input type="number" id="promoDiscountValue" required></div></div>
<div class="form-row"><div class="form-group"><label>Từ ngày</label><input type="date" id="promoStart" required></div>
<div class="form-group"><label>Đến ngày</label><input type="date" id="promoEnd" required></div></div>
<div class="form-row"><motion class="form-group"><label>Hạng</label><select id="promoTier"><option value="silver">Silver+</option><option value="gold">Gold+</option><option value="platinum">Platinum</option></select></div>
<div class="form-group"><label>Giới hạn</label><input type="number" id="promoLimit" required></div></div>
<div class="form-group"><label>Trạng thái</label><select id="promoStatus"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-modal-close="promotionModal">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></motion></form></div></div>
`, `  <script src="assets/js/api-config.js"></script>
  <script src="assets/js/mock-api.js"></script>
  <script src="assets/js/loyaltytier.js"></script>
  <script src="assets/js/promotion.js"></script>
  <script src="assets/js/dashboard.js"></script>`, 'admin-promotions'),

  'admin-rewards.html': layout('Quà tặng', adminSidebar('admin-rewards.html'), `
<div class="page-header"><h2>Quản lý quà tặng</h2><button class="btn btn-primary" onclick="openAddReward()">+ Thêm quà tặng</button></div>
<div class="card table-wrapper"><table class="table" id="rewardsTable"><thead><tr><th>ID</th><th>Tên quà</th><th>Mô tả</th><th>Điểm đổi</th><th>Trị giá giảm</th><th>Số lượng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody></tbody></table></div>
<div class="modal-overlay" id="rewardModal"><div class="modal"><div class="modal-header"><h3 id="rewardModalTitle">Thêm quà tặng</h3><button class="modal-close" data-modal-close="rewardModal">&times;</button></div>
<form id="rewardForm"><div class="modal-body">
<input type="hidden" id="rewardId">
<div class="form-group"><label>Tên quà tặng</label><input id="rewardName" required placeholder="Ví dụ: Voucher giảm 50k"></div>
<div class="form-group"><label>Mô tả</label><textarea id="rewardDescription" placeholder="Mô tả quà tặng..."></textarea></div>
<div class="form-row">
  <div class="form-group"><label>Điểm yêu cầu</label><input type="number" id="rewardPoints" required min="1"></div>
  <div class="form-group"><label>Trị giá giảm (đ)</label><input type="number" id="rewardDiscount" required min="0"></div>
</div>
<div class="form-row">
  <div class="form-group"><label>Số lượng kho</label><input type="number" id="rewardStock" required min="0"></div>
  <div class="form-group"><label>Trạng thái</label><select id="rewardActive"><option value="true">Kích hoạt</option><option value="false">Ngừng kích hoạt</option></select></div>
</div>
</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-modal-close="rewardModal">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div></form></div></div>
`, `  <script src="assets/js/api-config.js"></script>
  <script src="assets/js/mock-api.js"></script>
  <script src="assets/js/dashboard.js"></script>`, 'admin-rewards'),

  'admin-analytics.html': layout('Analytics', adminSidebar('admin-analytics.html'), `
<div class="analytics-grid">
  <div class="card analytics-card"><h3>Doanh thu</h3><div id="analyticsRevenue"></div></div>
  <div class="card analytics-card"><h3>Xu hướng booking</h3><div id="analyticsBookings"></div></div>
  <div class="card analytics-card"><h3>Phân bổ hạng</h3><div id="analyticsTierChart"></div></div>
  <div class="card"><h3>Tỷ lệ dùng thưởng</h3><div class="progress-bar"><div class="progress-bar-fill" id="rewardUsageFill" style="width:34%"></div></div><p id="rewardUsageRate" class="text-center" style="margin-top:0.5rem">34%</p></div>
</div>
<div class="dashboard-grid-equal" style="margin-top:1.25rem">
  <div class="card"><h3>Top KH trung thành</h3><ul class="top-list" id="topCustomers"></ul></div>
  <div class="card"><h3>Dịch vụ phổ biến</h3><ul class="top-list" id="topServices"></ul></div>
</div>
`, DASH, 'admin-analytics'),

  'staff-schedule.html': layout('Lịch rửa xe hôm nay', staffSidebar(), `
<p class="text-muted" style="margin-bottom:1rem">Lịch rửa xe ngày ${new Date().toLocaleDateString('vi-VN')}</p>
<div class="schedule-timeline" id="scheduleList"></div>
`, DASH, 'staff-schedule')
};

Object.assign(pages, more);

let count = 0;
for (const [name, html] of Object.entries(pages)) {
  fs.writeFileSync(path.join(DIR, name), fixHtml(html));
  count++;
}
console.log('Generated', count, 'HTML files');
