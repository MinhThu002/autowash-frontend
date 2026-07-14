/* AutoWash Pro - Booking
   Khi useMock=false: gọi BE /api/v1/bookings (lưu SQL Server)
   Payload BE: customerId, vehicleId, slotId, washServiceId, bookingDate, promotionId */
let selectedSlotId = null;
let selectedPromotionId = null;
let bookingVehicles = [];
let bookingServices = [];
let bookingPromotions = [];
let availableSlots = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('bookingForm')) return;
  initBookingPage();
});

async function initBookingPage() {
  requireAuth(['customer']);
  const customer = await refreshCurrentCustomerProfile();
  const tier = getTierById(customer.tierId);

  try {
    bookingVehicles = await fetchCustomerVehicles(getLoggedInCustomerId());
  } catch (error) {
    showToast(error.message || 'Không tải được danh sách xe.');
    bookingVehicles = [];
  }

  populateBookingVehicles(bookingVehicles, customer, tier);
  await loadBookingServices();
  await loadBookingPromotions(customer);
  await renderAvailableSlots();
  updatePriceSummary();

  document.getElementById('bookingVehicle').addEventListener('change', updatePriceSummary);
  document.getElementById('bookingService').addEventListener('change', async () => {
    await renderAvailableSlots();
    updatePriceSummary();
  });
  document.getElementById('bookingDate').addEventListener('change', renderAvailableSlots);
  document.getElementById('bookingPromotion')?.addEventListener('change', (e) => {
    selectedPromotionId = e.target.value || null;
    updatePriceSummary();
  });
  document.getElementById('bookingForm').addEventListener('submit', confirmBooking);
}

function populateBookingVehicles(vehicles, customer, tier) {
  const vehicleSelect = document.getElementById('bookingVehicle');
  vehicleSelect.innerHTML = '<option value="">-- Chọn xe --</option>';
  vehicles.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.vehicleId;
    opt.textContent = `${v.licensePlate} - ${v.brand} (${v.vehicleType})`;
    vehicleSelect.appendChild(opt);
  });

  document.getElementById('bookingWindowInfo').innerHTML =
    `<strong>Cửa sổ đặt lịch (${tier.tierName}):</strong> Bạn có thể đặt trước tối đa <strong>${tier.bookingWindowDays} ngày</strong>.`;

  const dateInput = document.getElementById('bookingDate');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + (tier.bookingWindowDays || 7));
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];
  if (!dateInput.value) dateInput.value = today.toISOString().split('T')[0];
}

async function loadBookingServices() {
  const serviceSelect = document.getElementById('bookingService');
  serviceSelect.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';

  try {
    if (usesRealApi() && window.AutoWashAPI) {
      const list = await window.AutoWashAPI.washServicesActive.list();
      bookingServices = (Array.isArray(list) ? list : []).filter(s => s.isActive !== false);
    } else {
      bookingServices = getServiceCatalog().map((s, i) => ({
        serviceId: i + 1,
        serviceName: s.serviceType,
        price: s.basePrice,
        isActive: true
      }));
    }
  } catch (error) {
    showToast(error.message || 'Không tải được dịch vụ từ server.');
    bookingServices = [];
  }

  bookingServices.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.serviceId;
    opt.textContent = `${s.serviceName} - ${formatCurrency(Number(s.price || 0))}`;
    opt.dataset.price = s.price || 0;
    serviceSelect.appendChild(opt);
  });
}

async function loadBookingPromotions(customer) {
  const select = document.getElementById('bookingPromotion');
  if (!select) return;

  try {
    if (usesRealApi() && window.AutoWashAPI) {
      const list = await window.AutoWashAPI.promotions.list();
      bookingPromotions = (Array.isArray(list) ? list : [])
        .filter(p => p.isActive !== false && p.status !== 'Inactive')
        .map(p => ({
          promotionId: p.promoId ?? p.promotionId,
          title: p.promoName || p.title,
          discountPercent: Number(p.discountAmount ?? p.discountPercent ?? 0),
          minTierId: p.minTierId ?? null
        }))
        .filter(p => p.minTierId == null || Number(customer.tierId) >= Number(p.minTierId));
    } else {
      bookingPromotions = getPromotions()
        .filter(p => normalizeStatus(p.status) === 'active')
        .filter(p => p.minTierId == null || Number(customer.tierId) >= Number(p.minTierId));
    }
  } catch (error) {
    bookingPromotions = [];
  }

  select.innerHTML = '<option value="">Không áp dụng</option>' +
    bookingPromotions.map(p =>
      `<option value="${p.promotionId}">${p.title} (-${p.discountPercent}%)</option>`
    ).join('');
}

async function renderAvailableSlots() {
  const container = document.getElementById('timeSlots');
  const date = document.getElementById('bookingDate').value;
  const washServiceId = document.getElementById('bookingService').value;
  selectedSlotId = null;

  if (!date || !washServiceId) {
    container.innerHTML = '<p class="text-muted">Chọn dịch vụ và ngày để xem khung giờ.</p>';
    return;
  }

  container.innerHTML = '<p class="text-muted">Đang tải khung giờ...</p>';

  try {
    if (usesRealApi() && window.AutoWashAPI) {
      availableSlots = await window.AutoWashAPI.bookings.availableSlots(date, washServiceId);
      if (!Array.isArray(availableSlots)) availableSlots = [];
    } else {
      availableSlots = (MOCK_DATA.bookingTimeOptions || []).map((time, i) => ({
        slotId: i + 1,
        slotName: time,
        startTime: time,
        isAvailable: true
      }));
    }
  } catch (error) {
    container.innerHTML = `<p class="text-muted">${error.message || 'Không tải được khung giờ.'}</p>`;
    return;
  }

  const slots = availableSlots.filter(s => s.isAvailable !== false);
  if (!slots.length) {
    container.innerHTML = '<p class="text-muted">Không còn khung giờ trống cho ngày này.</p>';
    return;
  }

  container.innerHTML = slots.map(slot => {
    const label = slot.startTime || slot.slotName || `Slot ${slot.slotId}`;
    return `<button type="button" class="time-slot" data-slot-id="${slot.slotId}" onclick="selectTimeSlot(${slot.slotId}, this)">${label}</button>`;
  }).join('');
}

function selectTimeSlot(slotId, btn) {
  selectedSlotId = Number(slotId);
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function updatePriceSummary() {
  const customer = getCurrentCustomer();
  const tier = getTierById(customer.tierId);
  const serviceId = document.getElementById('bookingService').value;
  const service = bookingServices.find(s => String(s.serviceId) === String(serviceId));
  const basePrice = service ? Number(service.price || 0) : 0;
  const tierDiscountPct = getTierDiscountPercent(tier.tierId);
  const discount = Math.round(basePrice * tierDiscountPct / 100);

  let promoDiscount = 0;
  if (selectedPromotionId) {
    const promo = bookingPromotions.find(p => String(p.promotionId) === String(selectedPromotionId));
    if (promo) promoDiscount = Math.round(basePrice * Number(promo.discountPercent) / 100);
  }

  const total = Math.max(0, basePrice - discount - promoDiscount);
  const points = Math.round(total / 1000 * (tier.pointMultiplier || 1));

  document.getElementById('summaryBase').textContent = formatCurrency(basePrice);
  document.getElementById('summaryTierDiscount').textContent = `-${formatCurrency(discount)}`;
  document.getElementById('summaryPromoDiscount').textContent = `-${formatCurrency(promoDiscount)}`;
  document.getElementById('summaryTotal').textContent = formatCurrency(total);
  document.getElementById('summaryPoints').textContent = `+${points} điểm`;
}

async function confirmBooking(e) {
  e.preventDefault();

  const customerId = getLoggedInCustomerId();
  const vehicleId = document.getElementById('bookingVehicle').value;
  const washServiceId = document.getElementById('bookingService').value;
  const bookingDate = document.getElementById('bookingDate').value;

  if (!customerId || !vehicleId || !washServiceId || !bookingDate || !selectedSlotId) {
    showToast('Vui lòng chọn đầy đủ xe, dịch vụ, ngày và khung giờ.');
    return;
  }

  const payload = {
    customerId: Number(customerId),
    vehicleId: Number(vehicleId),
    slotId: Number(selectedSlotId),
    washServiceId: Number(washServiceId),
    bookingDate,
    promotionId: selectedPromotionId ? Number(selectedPromotionId) : null,
    appliedRedemptionIds: []
  };

  try {
    if (usesRealApi() && window.AutoWashAPI) {
      const result = await window.AutoWashAPI.bookings.create(payload);
      const bookingId = result?.bookingId || result?.id || '';
      showToast(bookingId ? `Đặt lịch thành công! Mã #${bookingId}` : 'Đặt lịch thành công!');
    } else {
      // Fallback demo local (không vào DB)
      const tier = getTierById(getCurrentCustomer().tierId);
      const bookings = getBookings();
      const bookingId = bookings.reduce((max, b) => Math.max(max, Number(b.bookingId) || 0), 0) + 1;
      const service = bookingServices.find(s => String(s.serviceId) === String(washServiceId));
      bookings.unshift({
        bookingId,
        vehicleId: Number(vehicleId),
        bookingDate,
        bookingTime: availableSlots.find(s => Number(s.slotId) === Number(selectedSlotId))?.startTime || '',
        serviceType: service?.serviceName || '',
        status: 'Pending',
        priorityLevel: tier.priorityLevel,
        tierIdAtBooking: tier.tierId,
        cancelledByAdminId: null,
        createdAt: new Date().toISOString()
      });
      saveToStorage('bookings', bookings);
      showToast(`Đặt lịch demo (local) #${bookingId} — bật useMock:false để lưu DB`);
    }
    setTimeout(() => { window.location.href = 'booking-history.html'; }, 1200);
  } catch (error) {
    showToast(error.message || 'Đặt lịch thất bại. Kiểm tra backend đang chạy.');
  }
}
