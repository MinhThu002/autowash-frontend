/* AutoWash Pro - Booking */
let selectedSlotId = null;
let selectedPromotionId = null;
let bookingVehicles = [];
let bookingServices = [];
let activePromotions = [];
let unusedVouchers = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookingForm')) return;
  initBookingPage();
});

function initBookingPage() {
  if (!requireAuth(['customer'])) return;

  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);

  document.getElementById('bookingWindowInfo').innerHTML =
    `<strong>Cửa sổ đặt lịch (${tier.name}):</strong> Bạn có thể đặt trước tối đa <strong>${tier.bookingWindow} ngày</strong>.`;

  const dateInput = document.getElementById('bookingDate');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + tier.bookingWindow);
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];
  dateInput.value = today.toISOString().split('T')[0];

  Promise.all([
    fetchCustomerVehicles(getLoggedInCustomerId()),
    fetchActiveWashServices().catch(() => getServices().map(normalizeWashService)),
    fetchActivePromotions().catch(() => getPromotions().filter(p => p.status === 'active').map(normalizePromotion)),
    fetchUnusedVouchers(getLoggedInCustomerId()).catch(() => [])
  ])
    .then(([vehicles, services, promotions, vouchers]) => {
      bookingVehicles = vehicles.filter(v => v.isActive !== false);
      bookingServices = services;
      activePromotions = promotions;
      unusedVouchers = vouchers;
      populateBookingVehicles(bookingVehicles);
      updateServiceOptions();
      renderPromotionOptions(customer);
      renderVoucherOptions();
      renderTimeSlots();
      updatePriceSummary();
    })
    .catch(error => {
      showToast(error.message || 'Không tải được dữ liệu đặt lịch.');
    });

  document.getElementById('bookingVehicle')?.addEventListener('change', () => {
    updateServiceOptions();
    renderTimeSlots();
    updatePriceSummary();
  });
  document.getElementById('bookingService')?.addEventListener('change', () => {
    renderTimeSlots();
    updatePriceSummary();
  });
  document.getElementById('bookingDate')?.addEventListener('change', renderTimeSlots);
  document.getElementById('bookingPromotion')?.addEventListener('change', (e) => {
    selectedPromotionId = e.target.value || null;
    updatePriceSummary();
  });
  document.getElementById('bookingVouchers')?.addEventListener('change', updatePriceSummary);
  document.getElementById('bookingForm')?.addEventListener('submit', confirmBooking);
}

function populateBookingVehicles(vehicles) {
  const vehicleSelect = document.getElementById('bookingVehicle');
  vehicleSelect.innerHTML = '<option value="">-- Chọn xe --</option>';
  vehicles.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.vehicleId;
    opt.textContent = `${v.licensePlate} - ${v.brand} (${v.vehicleType})`;
    opt.dataset.type = v.vehicleType;
    vehicleSelect.appendChild(opt);
  });
}

function updateServiceOptions() {
  const serviceSelect = document.getElementById('bookingService');
  serviceSelect.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';
  bookingServices.filter(s => s.isActive !== false).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.serviceId;
    opt.textContent = `${s.serviceName} - ${formatCurrency(s.price)}`;
    serviceSelect.appendChild(opt);
  });
}

function renderPromotionOptions(customer) {
  const customerTierId = tierKeyToId(customer.tier);
  const promos = activePromotions.filter(p => {
    if (p.isActive === false) return false;
    if (p.minTierId == null) return true;
    return Number(p.minTierId) === customerTierId;
  });
  const select = document.getElementById('bookingPromotion');
  if (!select) return;
  select.innerHTML = '<option value="">Không áp dụng</option>' +
    promos.map(p => `<option value="${p.promoId}">${p.promoName} (-${formatCurrency(p.discountAmount)})</option>`).join('');
}

function renderVoucherOptions() {
  const select = document.getElementById('bookingVouchers');
  if (!select) return;
  if (!unusedVouchers.length) {
    select.innerHTML = '<option value="">Không có voucher</option>';
    return;
  }
  select.innerHTML = unusedVouchers.map(v =>
    `<option value="${v.redemptionId}">${v.rewardName} (-${formatCurrency(v.discountAmount)})</option>`
  ).join('');
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  const serviceId = document.getElementById('bookingService').value;
  const date = document.getElementById('bookingDate').value;
  selectedSlotId = null;

  if (!serviceId || !date) {
    container.innerHTML = '<p class="text-muted">Chọn dịch vụ và ngày để xem khung giờ.</p>';
    return;
  }

  container.innerHTML = '<p class="text-muted">Đang tải khung giờ...</p>';

  fetchAvailableSlots(date, serviceId)
    .then(slots => {
      if (!slots.length) {
        container.innerHTML = '<p class="text-muted">Không có khung giờ trống.</p>';
        return;
      }
      container.innerHTML = slots.map(slot => {
        const start = String(slot.startTime || '').slice(0, 5);
        const end = String(slot.endTime || '').slice(0, 5);
        const disabled = slot.isAvailable === false ? 'disabled' : '';
        return `<button type="button" class="time-slot" data-slot-id="${slot.slotId}" ${disabled}
          onclick="selectTimeSlot(${slot.slotId}, this)">${start} - ${end}</button>`;
      }).join('');
    })
    .catch(error => {
      container.innerHTML = '<p class="text-muted">Không tải được khung giờ.</p>';
      showToast(error.message || 'Không tải được khung giờ.');
    });
}

function selectTimeSlot(slotId, btn) {
  if (btn.disabled) return;
  selectedSlotId = slotId;
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function updatePriceSummary() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tier);
  const serviceId = document.getElementById('bookingService').value;
  const service = bookingServices.find(s => String(s.serviceId) === String(serviceId));
  const basePrice = service ? Number(service.price) : 0;
  const discount = Math.round(basePrice * (tier.discountPercent || 0) / 100);

  let promoDiscount = 0;
  if (selectedPromotionId) {
    const promo = activePromotions.find(p => String(p.promoId) === String(selectedPromotionId));
    if (promo) {
      promoDiscount = Number(promo.discountAmount) <= 100
        ? Math.round(basePrice * Number(promo.discountAmount) / 100)
        : Number(promo.discountAmount);
    }
  }

  let voucherDiscount = 0;
  const voucherSelect = document.getElementById('bookingVouchers');
  const voucherId = voucherSelect?.value;
  if (voucherId) {
    const voucher = unusedVouchers.find(v => String(v.redemptionId) === String(voucherId));
    if (voucher) {
      voucherDiscount = Number(voucher.discountAmount) <= 100
        ? Math.round(basePrice * Number(voucher.discountAmount) / 100)
        : Number(voucher.discountAmount);
    }
  }

  const total = Math.max(0, basePrice - discount - promoDiscount - voucherDiscount);
  const points = Math.round(total / 1000 * (tier.pointRate || 1));

  document.getElementById('summaryBase').textContent = formatCurrency(basePrice);
  document.getElementById('summaryTierDiscount').textContent = `-${formatCurrency(discount)}`;
  document.getElementById('summaryPromoDiscount').textContent = `-${formatCurrency(promoDiscount)}`;
  document.getElementById('summaryVoucherDiscount').textContent = `-${formatCurrency(voucherDiscount)}`;
  document.getElementById('summaryTotal').textContent = formatCurrency(total);
  document.getElementById('summaryPoints').textContent = `+${points} điểm (dự kiến)`;
}

async function confirmBooking(e) {
  e.preventDefault();

  const customerId = getLoggedInCustomerId();
  const vehicleId = document.getElementById('bookingVehicle').value;
  const serviceId = document.getElementById('bookingService').value;
  const date = document.getElementById('bookingDate').value;
  const voucherId = document.getElementById('bookingVouchers')?.value;

  if (!vehicleId || !serviceId || !date || !selectedSlotId) {
    showToast('Vui lòng chọn đầy đủ thông tin và khung giờ.');
    return;
  }

  const payload = {
    customerId: Number(customerId),
    vehicleId: Number(vehicleId),
    slotId: Number(selectedSlotId),
    washServiceId: Number(serviceId),
    bookingDate: date,
    promotionId: selectedPromotionId ? Number(selectedPromotionId) : null,
    appliedRedemptionIds: voucherId ? [Number(voucherId)] : []
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const result = await createBookingRequest(payload);
    showToast(`Đặt lịch thành công! Tổng thanh toán: ${formatCurrency(result.finalPrice || 0)}`);
    setTimeout(() => { window.location.href = 'booking-history.html'; }, 1500);
  } catch (error) {
    showToast(error.message || 'Đặt lịch thất bại.');
    if (submitBtn) submitBtn.disabled = false;
  }
}
