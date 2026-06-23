/* AutoWash Pro - Booking */
let selectedTimeSlot = null;
let selectedPromotionId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookingForm')) return;
  initBookingPage();
});

function initBookingPage() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);
  const user = JSON.parse(localStorage.getItem('autowash_user') || 'null');
  const customerId = user?.customerId || user?.id || customer.id;

  fetchCustomerVehicles(customerId)
    .then(vehicles => populateBookingVehicles(vehicles, customer, tier))
    .catch(() => {
      const vehicles = getActiveVehicles().filter(v => v.customerId === customer.id);
      populateBookingVehicles(vehicles.map(normalizeVehicle), customer, tier);
    });
}

function populateBookingVehicles(vehicles, customer, tier) {
  const services = getServices().filter(s => s.active);
  const vehicleSelect = document.getElementById('bookingVehicle');
  vehicleSelect.innerHTML = '<option value="">-- Chọn xe --</option>';
  vehicles.filter(v => v.isActive !== false).forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.licensePlate} - ${v.brand} (${v.vehicleType})`;
    opt.dataset.type = v.vehicleType;
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
    opt.textContent = `${s.name} - ${formatCurrency(s.price)} (${s.duration} phút)`;
    opt.dataset.price = s.price;
    serviceSelect.appendChild(opt);
  });
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  container.innerHTML = '';
  selectedTimeSlot = null;
  MOCK_DATA.timeSlots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot';
    btn.textContent = slot;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTimeSlot = slot;
    });
    container.appendChild(btn);
  });
}

function renderPromotions(customer) {
  const select = document.getElementById('bookingPromotion');
  if (!select) return;
  const promos = getPromotions().filter(p => {
    if (p.status !== 'active') return false;
    if (p.targetTier === 'all') return true;
    const tierOrder = ['member', 'silver', 'gold', 'platinum'];
    return tierOrder.indexOf(customer.tier) >= tierOrder.indexOf(p.targetTier);
  });
  promos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    const disc = p.discountType === 'percent' ? `${p.discountValue}%` : formatCurrency(p.discountValue);
    opt.textContent = `${p.name} (-${disc})`;
    select.appendChild(opt);
  });
}

function updatePriceSummary() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);
  const serviceOpt = document.getElementById('bookingService').selectedOptions[0];
  const basePrice = parseFloat(serviceOpt?.dataset.price) || 0;
  let discount = basePrice * (tier.discountPercent / 100);
  let promoDiscount = 0;

  if (selectedPromotionId) {
    const promo = getPromotions().find(p => p.id === selectedPromotionId);
    if (promo) {
      promoDiscount = promo.discountType === 'percent'
        ? (basePrice - discount) * (promo.discountValue / 100)
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

  const vehicle = getVehicles().find(v => v.id === vehicleId);
  const service = getServices().find(s => s.id === serviceId);
  const totalText = document.getElementById('summaryTotal').textContent;
  const bookings = getBookings();
  const newId = `BK-2026-${String(bookings.length + 1).padStart(3, '0')}`;

  bookings.unshift({
    id: newId,
    customerId: customer.id,
    customerName: customer.name,
    vehicleId,
    vehiclePlate: vehicle.licensePlate,
    serviceId,
    serviceName: service.name,
    date,
    time: selectedTimeSlot,
    status: 'pending',
    totalPrice: parseInt(totalText.replace(/\D/g, '')) || service.price,
    pointsEarned: 0,
    promotionId: selectedPromotionId
  });

  saveToStorage('bookings', bookings);
  showToast(`Đặt lịch thành công! Mã booking: ${newId}`);
  setTimeout(() => { window.location.href = 'booking-history.html'; }, 1500);
}
