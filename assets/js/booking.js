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
    `<strong>Cửa sổ đặt lịch (${getTierDisplayName(customer.loyaltyTier || customer.tier)}):</strong> Bạn có thể đặt trước tối đa <strong>${tier.bookingWindowDays ?? tier.bookingWindow ?? 7} ngày</strong>.`;

  const dateInput = document.getElementById('bookingDate');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + (tier.bookingWindowDays ?? tier.bookingWindow ?? 7));
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

function getSelectedVehicleType() {
  const vehicleSelect = document.getElementById('bookingVehicle');
  if (!vehicleSelect?.value) return null;
  const vehicle = bookingVehicles.find(v => String(v.vehicleId) === String(vehicleSelect.value));
  return vehicle?.vehicleType || vehicleSelect.selectedOptions[0]?.dataset.type || null;
}

function getSelectedService() {
  const serviceId = document.getElementById('bookingService')?.value;
  if (!serviceId) return null;
  return bookingServices.find(s => String(s.serviceId) === String(serviceId)) || null;
}

function getServicesForSelectedVehicle() {
  const vehicleType = getSelectedVehicleType();
  return bookingServices.filter(s => {
    if (s.isActive === false) return false;
    if (!bookingServicesUseVehicleType()) return true;
    return serviceMatchesVehicleType(s, vehicleType);
  });
}

function formatSlotStartTime(time) {
  if (!time) return '--:--';
  const text = String(time);
  if (text.includes('T')) return text.split('T')[1].slice(0, 5);
  return text.slice(0, 5);
}

function updateServiceOptions() {
  const serviceSelect = document.getElementById('bookingService');
  const previous = serviceSelect.value;
  const vehicleType = getSelectedVehicleType();
  const services = getServicesForSelectedVehicle();

  serviceSelect.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';

  if (!vehicleType) {
    serviceSelect.innerHTML = '<option value="">-- Chọn xe trước --</option>';
    return;
  }

  if (!services.length) {
    serviceSelect.innerHTML = '<option value="">-- Không có dịch vụ cho loại xe này --</option>';
    return;
  }

  services.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.serviceId;
    const duration = s.durationMinutes ?? s.duration ?? 60;
    opt.textContent = `${s.serviceName} - ${formatCurrency(s.price)} (${duration} phút)`;
    serviceSelect.appendChild(opt);
  });

  if (services.some(s => String(s.serviceId) === String(previous))) {
    serviceSelect.value = previous;
  }
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

      const service = getSelectedService();
      const duration = Number(service?.durationMinutes ?? service?.duration ?? 60);
      const slotsNeeded = Math.max(1, Math.ceil(duration / 60));
      const hint = slotsNeeded > 1
        ? `<p class="form-hint">Dịch vụ ${duration} phút cần ${slotsNeeded} slot liên tiếp (mỗi slot 60 phút). Giờ hiển thị là <strong>giờ bắt đầu</strong> của slot bạn chọn.</p>`
        : '<p class="form-hint">Mỗi khung giờ là 60 phút. Giờ hiển thị là giờ bắt đầu.</p>';

      container.innerHTML = hint + slots.map(slot => {
        const start = formatSlotStartTime(slot.startTime);
        const disabled = slot.isAvailable === false ? 'disabled' : '';
        const label = slot.slotName ? `${start} (${slot.slotName})` : start;
        return `<button type="button" class="time-slot" data-slot-id="${slot.slotId}" ${disabled}
          onclick="selectTimeSlot(${slot.slotId}, this)">${label}</button>`;
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
  const tier = getTierById(customer.loyaltyTier || customer.tierName || customer.tier);
  const service = getSelectedService();
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
  const points = Math.round(total / 1000 * (tier.pointMultiplier ?? tier.pointRate ?? 1));

  document.getElementById('summaryBase').textContent = formatCurrency(basePrice);
  document.getElementById('summaryTierDiscount').textContent = `-${formatCurrency(discount)}`;
  document.getElementById('summaryPromoDiscount').textContent = `-${formatCurrency(promoDiscount)}`;
  document.getElementById('summaryVoucherDiscount').textContent = `-${formatCurrency(voucherDiscount)}`;
  document.getElementById('summaryTotal').textContent = formatCurrency(total);
  document.getElementById('summaryPoints').textContent = `+${points} điểm (dự kiến)`;
}

async function confirmBooking(e) {
  e.preventDefault();

  if (!getAuthorizedUser(['customer'])) {
    showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    return;
  }

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
    const paid = Number(result.finalPrice ?? result.totalPrice ?? 0);
    showToast(`Đặt lịch thành công! Tổng thanh toán: ${formatCurrency(paid)}`);
    setTimeout(() => { window.location.href = 'booking-history.html'; }, 1500);
  } catch (error) {
    showToast(error.message || 'Đặt lịch thất bại.');
    if (submitBtn) submitBtn.disabled = false;
  }
}
