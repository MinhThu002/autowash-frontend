/* AutoWash Pro - Booking */
let selectedTimeSlot = null;
let selectedPromotionId = null;
let bookingVehicles = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookingForm')) return;
  initBookingPage();
});

function initBookingPage() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);

  fetchCustomerVehicles(getLoggedInCustomerId())
    .then(vehicles => populateBookingVehicles(vehicles, customer, tier))
    .catch(error => {
      showToast(error.message || 'Không tải được danh sách xe.');
      populateBookingVehicles([], customer, tier);
    });
}

function populateBookingVehicles(vehicles, customer, tier) {
  bookingVehicles = vehicles.filter(v => v.isActive !== false);

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
    `<strong>Cửa sổ đặt lịch (${tier.name}):</strong> Bạn có thể đặt trước tối đa <strong>${tier.bookingWindow} ngày</strong>.`;

  const dateInput = document.getElementById('bookingDate');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + tier.bookingWindow);
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];
  dateInput.value = today.toISOString().split('T')[0];

  renderTimeSlots();
  updateServiceOptions();
  renderPromotions(customer);
  updatePriceSummary();

  vehicleSelect.addEventListener('change', () => {
    updateServiceOptions();
    updatePriceSummary();
  });
  document.getElementById('bookingService').addEventListener('change', updatePriceSummary);
  document.getElementById('bookingDate').addEventListener('change', renderTimeSlots);
  document.getElementById('bookingPromotion')?.addEventListener('change', (e) => {
    selectedPromotionId = e.target.value || null;
    updatePriceSummary();
  });
  document.getElementById('bookingForm').addEventListener('submit', confirmBooking);
}

function updateServiceOptions() {
  const vehicleSelect = document.getElementById('bookingVehicle');
  const serviceSelect = document.getElementById('bookingService');
  const vehicleType = vehicleSelect.selectedOptions[0]?.dataset.type;
  serviceSelect.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';
  getServices().filter(s => s.active && s.vehicleType === vehicleType).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} - ${formatCurrency(s.price)}`;
    serviceSelect.appendChild(opt);
  });
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  const slots = MOCK_DATA.timeSlots;
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
  const tier = getTierById(customer.tier);
  const promos = getPromotions().filter(p => {
    if (p.status !== 'active') return false;
    if (p.targetTier === 'all') return true;
    const tierOrder = { member: 1, silver: 2, gold: 3, platinum: 4 };
    return tierOrder[p.targetTier] <= tierOrder[tier.id];
  });
  const select = document.getElementById('bookingPromotion');
  if (!select) return;
  select.innerHTML = '<option value="">Không áp dụng</option>' +
    promos.map(p => `<option value="${p.id}">${p.name} (-${p.discountValue}${p.discountType === 'percent' ? '%' : 'đ'})</option>`).join('');
}

function updatePriceSummary() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);
  const serviceId = document.getElementById('bookingService').value;
  const service = getServices().find(s => s.id === serviceId);
  const basePrice = service ? service.price : 0;
  const discount = Math.round(basePrice * tier.discount / 100);

  let promoDiscount = 0;
  if (selectedPromotionId) {
    const promo = getPromotions().find(p => p.id === selectedPromotionId);
    if (promo) {
      promoDiscount = promo.discountType === 'percent'
        ? Math.round(basePrice * promo.discountValue / 100)
        : promo.discountValue;
    }
  }

  const total = Math.max(0, basePrice - discount - promoDiscount);
  const points = Math.round(total / 1000 * tier.pointRate);

  document.getElementById('summaryBase').textContent = formatCurrency(basePrice);
  document.getElementById('summaryTierDiscount').textContent = `-${formatCurrency(discount)}`;
  document.getElementById('summaryPromoDiscount').textContent = `-${formatCurrency(promoDiscount)}`;
  document.getElementById('summaryTotal').textContent = formatCurrency(total);
  document.getElementById('summaryPoints').textContent = `+${points} điểm`;
}

function confirmBooking(e) {
  e.preventDefault();
  const customer = getCurrentCustomer();
  const vehicleId = document.getElementById('bookingVehicle').value;
  const serviceId = document.getElementById('bookingService').value;
  const date = document.getElementById('bookingDate').value;

  if (!vehicleId || !serviceId || !date || !selectedTimeSlot) {
    showToast('Vui lòng chọn đầy đủ thông tin và khung giờ.');
    return;
  }

  const vehicle = bookingVehicles.find(v => String(v.vehicleId) === String(vehicleId));
  const service = getServices().find(s => s.id === serviceId);
  if (!vehicle || !service) {
    showToast('Thông tin xe hoặc dịch vụ không hợp lệ.');
    return;
  }

  const totalText = document.getElementById('summaryTotal').textContent;
  const bookings = getBookings();
  const newId = `BK-2026-${String(bookings.length + 1).padStart(3, '0')}`;

  bookings.unshift({
    id: newId,
    customerId: customer.id,
    customerName: customer.name,
    vehicleId: vehicle.vehicleId,
    vehiclePlate: vehicle.licensePlate,
    serviceId,
    serviceName: service.name,
    date,
    time: selectedTimeSlot,
    status: 'pending',
    totalPrice: parseInt(totalText.replace(/\D/g, ''), 10) || service.price,
    pointsEarned: 0,
    promotionId: selectedPromotionId
  });

  saveToStorage('bookings', bookings);
  showToast(`Đặt lịch thành công! Mã booking: ${newId}`);
  setTimeout(() => { window.location.href = 'booking-history.html'; }, 1500);
}
