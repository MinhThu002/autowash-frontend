/* AutoWash Pro - Booking (aligned with Booking table: service_type, booking_date, booking_time) */
let selectedTimeSlot = null;
let selectedPromotionId = null;
let bookingVehicles = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookingForm')) return;
  initBookingPage();
});

function initBookingPage() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tierId);

  fetchCustomerVehicles(getLoggedInCustomerId())
    .then(vehicles => populateBookingVehicles(vehicles, customer, tier))
    .catch(error => {
      showToast(error.message || 'Không tải được danh sách xe.');
      populateBookingVehicles([], customer, tier);
    });
}

function populateBookingVehicles(vehicles, customer, tier) {
  bookingVehicles = vehicles;

  const vehicleSelect = document.getElementById('bookingVehicle');
  vehicleSelect.innerHTML = '<option value="">-- Chọn xe --</option>';
  bookingVehicles.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.vehicleId;
    opt.textContent = `${v.licensePlate} - ${v.brand} (${v.vehicleType})`;
    opt.dataset.type = v.vehicleType;
    opt.dataset.plate = v.licensePlate;
    vehicleSelect.appendChild(opt);
  });

  document.getElementById('bookingWindowInfo').innerHTML =
    `<strong>Cửa sổ đặt lịch (${tier.tierName}):</strong> Bạn có thể đặt trước tối đa <strong>${tier.bookingWindowDays} ngày</strong>.`;

  const dateInput = document.getElementById('bookingDate');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + tier.bookingWindowDays);
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];
  dateInput.value = today.toISOString().split('T')[0];

  renderTimeSlots();
  updateServiceOptions();
  renderPromotions(customer);
  updatePriceSummary();

  vehicleSelect.addEventListener('change', updatePriceSummary);
  document.getElementById('bookingService').addEventListener('change', updatePriceSummary);
  document.getElementById('bookingDate').addEventListener('change', renderTimeSlots);
  document.getElementById('bookingPromotion')?.addEventListener('change', (e) => {
    selectedPromotionId = e.target.value || null;
    updatePriceSummary();
  });
  document.getElementById('bookingForm').addEventListener('submit', confirmBooking);
}

function updateServiceOptions() {
  const serviceSelect = document.getElementById('bookingService');
  serviceSelect.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';
  getServiceCatalog().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.serviceType;
    opt.textContent = `${s.serviceType} - ${formatCurrency(s.basePrice)}`;
    serviceSelect.appendChild(opt);
  });
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  const slots = MOCK_DATA.bookingTimeOptions;
  selectedTimeSlot = null;
  container.innerHTML = slots.map(slot => `
    <button type="button" class="time-slot" data-time="${slot}" onclick="selectTimeSlot('${slot}', this)">${slot}</button>
  `).join('');
}

function selectTimeSlot(time, btn) {
  selectedTimeSlot = time;
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function renderPromotions(customer) {
  const tierId = Number(customer.tierId);
  const promos = getPromotions().filter(p => {
    if (normalizeStatus(p.status) !== 'active') return false;
    if (p.minTierId == null) return true;
    return tierId >= Number(p.minTierId);
  });
  const select = document.getElementById('bookingPromotion');
  if (!select) return;
  select.innerHTML = '<option value="">Không áp dụng</option>' +
    promos.map(p => `<option value="${p.promotionId}">${p.title} (-${p.discountPercent}%)</option>`).join('');
}

function updatePriceSummary() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tierId);
  const serviceType = document.getElementById('bookingService').value;
  const basePrice = serviceType ? getServiceBasePrice(serviceType) : 0;
  const tierDiscountPct = getTierDiscountPercent(tier.tierId);
  const discount = Math.round(basePrice * tierDiscountPct / 100);

  let promoDiscount = 0;
  if (selectedPromotionId) {
    const promo = getPromotions().find(p => String(p.promotionId) === String(selectedPromotionId));
    if (promo) {
      promoDiscount = Math.round(basePrice * Number(promo.discountPercent) / 100);
    }
  }

  const total = Math.max(0, basePrice - discount - promoDiscount);
  const points = Math.round(total / 1000 * tier.pointMultiplier);

  document.getElementById('summaryBase').textContent = formatCurrency(basePrice);
  document.getElementById('summaryTierDiscount').textContent = `-${formatCurrency(discount)}`;
  document.getElementById('summaryPromoDiscount').textContent = `-${formatCurrency(promoDiscount)}`;
  document.getElementById('summaryTotal').textContent = formatCurrency(total);
  document.getElementById('summaryPoints').textContent = `+${points} điểm`;
}

function confirmBooking(e) {
  e.preventDefault();
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tierId);
  const vehicleId = document.getElementById('bookingVehicle').value;
  const serviceType = document.getElementById('bookingService').value;
  const bookingDate = document.getElementById('bookingDate').value;

  if (!vehicleId || !serviceType || !bookingDate || !selectedTimeSlot) {
    showToast('Vui lòng chọn đầy đủ thông tin và khung giờ.');
    return;
  }

  const vehicle = bookingVehicles.find(v => String(v.vehicleId) === String(vehicleId));
  if (!vehicle) {
    showToast('Thông tin xe không hợp lệ.');
    return;
  }

  const bookings = getBookings();
  const bookingId = bookings.reduce((max, b) => Math.max(max, Number(b.bookingId) || 0), 0) + 1;

  bookings.unshift({
    bookingId,
    vehicleId: Number(vehicle.vehicleId),
    bookingDate,
    bookingTime: selectedTimeSlot,
    serviceType,
    status: 'Pending',
    priorityLevel: tier.priorityLevel,
    tierIdAtBooking: tier.tierId,
    cancelledByAdminId: null,
    createdAt: new Date().toISOString()
  });

  saveToStorage('bookings', bookings);
  showToast(`Đặt lịch thành công! Mã booking: #${bookingId}`);
  setTimeout(() => { window.location.href = 'booking-history.html'; }, 1500);
}
