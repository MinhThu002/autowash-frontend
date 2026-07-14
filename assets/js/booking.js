/* AutoWash Pro - Booking */
let selectedTimeSlot = null;
let selectedPromotionId = null;
let bookingVehicles = [];
let unusedRewardsData = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("bookingForm")) return;
  initBookingPage();
});

async function initBookingPage() {
  const userStr = localStorage.getItem("autowash_user");
  if (!userStr) return;
  const user = JSON.parse(userStr);
  const customerId = user.customerId || user.id;

  try {
    // 1. Lấy profile thật từ Server
    const profileRes = await fetch(
      `http://localhost:8080/api/customers/profile?customerId=${customerId}`,
    );
    const profile = await profileRes.json();

    // Rút trích Tên Hạng thật
    const currentTierName =
      profile.loyaltyTier && typeof profile.loyaltyTier === "object"
        ? profile.loyaltyTier.tierName
        : profile.loyaltyTier || "BRONZE";

    // 2. Lấy cấu hình các hạng từ API để tính toán số ngày đặt lịch linh hoạt (hỗ trợ CRUD sau này)
    let bookingWindowDays = 7; // Giá trị mặc định phòng trường hợp API lỗi
    try {
      const tiersRes = await fetch(
        "http://localhost:8080/api/loyalty-tiers/active",
      );
      if (tiersRes.ok) {
        const activeTiers = await tiersRes.json();
        const currentTierConfig = activeTiers.find(
          (t) => t.tierName.toUpperCase() === currentTierName.toUpperCase(),
        );
        if (currentTierConfig) {
          // Kiểm tra thuộc tính bookingWindowDays từ DB hoặc fallback bookingWindow cũ
          bookingWindowDays =
            currentTierConfig.bookingWindowDays ||
            currentTierConfig.bookingWindow ||
            7;
        }
      }
    } catch (tierErr) {
      console.error(
        "Không tải được danh sách hạng, dùng fallback từ profile:",
        tierErr,
      );
      if (profile.loyaltyTier && typeof profile.loyaltyTier === "object") {
        bookingWindowDays =
          profile.loyaltyTier.bookingWindowDays ||
          profile.loyaltyTier.bookingWindow ||
          7;
      }
    }

    loadUnusedRewards(customerId);

    // 3. Truyền thêm bookingWindowDays vào hàm xử lý giao diện
    fetchCustomerVehicles(customerId)
      .then((vehicles) =>
        populateBookingVehicles(
          vehicles,
          profile,
          currentTierName,
          bookingWindowDays,
        ),
      )
      .catch((error) => {
        showToast(error.message || "Không tải được danh sách xe.");
        populateBookingVehicles(
          [],
          profile,
          currentTierName,
          bookingWindowDays,
        );
      });
  } catch (e) {
    console.error("Lỗi khởi tạo booking:", e);
  }
}

async function loadUnusedRewards(customerId) {
  if (!customerId) return;
  try {
    const response = await fetch(
      `http://localhost:8080/api/rewards/customer/unused/${customerId}`,
    );
    if (!response.ok) return;

    unusedRewardsData = await response.json();
    const rewardSelect = document.getElementById("bookingReward");
    if (!rewardSelect) return;

    rewardSelect.innerHTML = '<option value="">Không dùng</option>'; // Reset trước khi nạp

    unusedRewardsData.forEach((r) => {
      // Hỗ trợ cả 2 chuẩn backend thường dùng
      if (r.status === "AVAILABLE" || r.status === "UNUSED" || !r.status) {
        const opt = document.createElement("option");
        opt.value = r.redemptionId || r.id;
        opt.dataset.discount = r.discountAmount || 0;
        opt.textContent = `${r.rewardName || r.name} (Giảm ${formatCurrency(r.discountAmount)})`;
        rewardSelect.appendChild(opt);
      }
    });
  } catch (error) {
    console.error("Lỗi khi tải voucher:", error);
  }
}

async function populateBookingVehicles(
  vehicles,
  customer,
  currentTierName,
  bookingWindowDays = 7,
) {
  bookingVehicles = vehicles.filter((v) => v.isActive !== false);

  const vehicleSelect = document.getElementById("bookingVehicle");
  vehicleSelect.innerHTML = '<option value="">-- Chọn xe --</option>';
  bookingVehicles.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.vehicleId;
    opt.textContent = `${v.licensePlate} - ${v.brand} (${v.vehicleType})`;
    opt.dataset.type = v.vehicleType;
    opt.dataset.plate = v.licensePlate;
    vehicleSelect.appendChild(opt);
  });

  // Hiển thị thông tin cửa sổ đặt lịch an toàn (nếu có thẻ HTML hiển thị)
  const windowInfoEl = document.getElementById("bookingWindowInfo");
  if (windowInfoEl) {
    windowInfoEl.innerHTML = `<strong>Cửa sổ đặt lịch (${currentTierName}):</strong> Bạn có thể đặt trước tối đa <strong>${bookingWindowDays} ngày</strong>.`;
  }

  const dateInput = document.getElementById("bookingDate");
  const today = new Date();
  const maxDate = new Date();

  // Đã thay thế biến 'tier' chưa định nghĩa bằng biến 'bookingWindowDays' an toàn động từ API
  maxDate.setDate(today.getDate() + bookingWindowDays);
  dateInput.min = today.toISOString().split("T")[0];
  dateInput.max = maxDate.toISOString().split("T")[0];
  dateInput.value = today.toISOString().split("T")[0];

  // Các hàm render phía dưới giờ sẽ chạy mượt mà mà không bị block
  renderTimeSlots();
  await updateServiceOptions();
  renderPromotions(currentTierName);
  updatePriceSummary();

  // Các event listener giữ nguyên phần bên dưới...
  vehicleSelect.addEventListener("change", async () => {
    await updateServiceOptions();
    updatePriceSummary();
  });

  document.getElementById("bookingService").addEventListener("change", () => {
    renderTimeSlots(); // Gọi hiển thị khung giờ trống phù hợp với gói dịch vụ vừa chọn
    updatePriceSummary(); // Tính toán lại bảng giá xem trước
  });
  document
    .getElementById("bookingDate")
    .addEventListener("change", renderTimeSlots);
  document
    .getElementById("bookingPromotion")
    ?.addEventListener("change", (e) => {
      selectedPromotionId = e.target.value || null;
      updatePriceSummary();
    });
  document
    .getElementById("bookingReward")
    ?.addEventListener("change", updatePriceSummary);
  document
    .getElementById("bookingForm")
    .addEventListener("submit", confirmBooking);
}

async function updateServiceOptions() {
  const vehicleSelect = document.getElementById("bookingVehicle");
  const serviceSelect = document.getElementById("bookingService");
  const vehicleType = vehicleSelect.selectedOptions[0]?.dataset.type;
  console.log("Loại xe đang chọn:", vehicleType);

  // Reset select box về trạng thái ban đầu
  serviceSelect.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';

  // Nếu chưa chọn xe hợp lệ thì dừng lại (đợi user kích hoạt sự kiện change)
  if (!vehicleType) return;

  try {
    // 1. Sửa lại đúng đường dẫn API lấy danh sách dịch vụ active
    const response = await fetch(
      "http://localhost:8080/api/admin/wash-services/active",
    );
    if (!response.ok) throw new Error("Fetch failed");
    const services = await response.json();
    console.log("Danh sách dịch vụ từ API:", services);

    // 2. Sửa điều kiện lọc: Sử dụng 'isActive' theo đúng JSON trả về từ API và loại bỏ lọc 'vehicleType' nếu backend không trả về
    services
      .filter((s) => s.isActive !== false)
      .forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.serviceId || s.id;
        opt.dataset.price = s.price || 0;
        opt.textContent = `${s.serviceName || s.name} - ${formatCurrency(s.price)}`;
        serviceSelect.appendChild(opt);
      });
  } catch (error) {
    console.error("Lỗi khi tải danh sách dịch vụ:", error);
  }
}

async function renderTimeSlots() {
  const container = document.getElementById("timeSlots");
  const date = document.getElementById("bookingDate").value;
  const serviceId = document.getElementById("bookingService").value;

  if (!date || !serviceId) {
    container.innerHTML =
      '<p class="text-muted">Vui lòng chọn ngày và dịch vụ để xem giờ trống.</p>';
    return;
  }

  container.innerHTML = "<p>Đang tải danh sách khung giờ...</p>";
  selectedTimeSlot = null; // Đặt lại biến lưu trữ khi đổi ngày/dịch vụ

  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/bookings/available-slots?date=${date}&washServiceId=${serviceId}`,
    );
    if (!response.ok) throw new Error("Không tải được khung giờ");

    const slots = await response.json();

    if (slots.length === 0) {
      container.innerHTML =
        '<p class="text-danger">Không có khung giờ trống.</p>';
      return;
    }

    container.innerHTML = slots
      .map(
        (slot) => `
        <button type="button" class="time-slot ${!slot.available ? "disabled" : ""}" 
          data-id="${slot.slotId}" 
          ${!slot.available ? "disabled" : ""}
          onclick="selectTimeSlot(${slot.slotId}, this)">
          ${slot.startTime.substring(0, 5)}
        </button>
      `,
      )
      .join("");
  } catch (error) {
    container.innerHTML = '<p class="text-danger">Lỗi kết nối máy chủ.</p>';
  }
}

function selectTimeSlot(slotId, btn) {
  selectedTimeSlot = slotId;
  document
    .querySelectorAll(".time-slot")
    .forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

async function renderPromotions(currentTierName) {
  const select = document.getElementById("bookingPromotion");
  if (!select) return;

  try {
    // 1. Lấy danh sách các hạng đang hoạt động từ API để tìm hạng đầu tiên một cách ĐỘNG
    const tiersRes = await fetch(
      "http://localhost:8080/api/loyalty-tiers/active",
    );
    let dynamicDefaultTier = "";

    if (tiersRes.ok) {
      const activeTiers = await tiersRes.json();
      if (activeTiers.length > 0) {
        // Sắp xếp các hạng theo ID tăng dần (Hạng nào có ID nhỏ nhất chính là hạng thấp nhất/đầu tiên)
        activeTiers.sort((a, b) => (a.tierId || a.id) - (b.tierId || b.id));
        // Lấy tên hạng đầu tiên làm hạng mặc định hệ thống
        dynamicDefaultTier = activeTiers[0].tierName.toUpperCase();
      }
    }

    // 2. Lấy danh sách khuyến mãi đang hoạt động từ máy chủ
    const response = await fetch("http://localhost:8080/api/promotions/active");
    const promos = await response.json();

    // Nếu profile khách hàng không có tên hạng, tự động đưa về hạng đầu tiên tìm được ở trên
    const customerTier = currentTierName
      ? currentTierName.toUpperCase()
      : dynamicDefaultTier;

    // 3. Tiến hành lọc trùng khớp hoàn toàn (Strict Equality)
    const eligiblePromos = promos.filter((p) => {
      // Nếu chương trình khuyến mãi không để minTierName, coi như dành cho hạng đầu tiên
      const promoTierName = p.minTierName
        ? p.minTierName.toUpperCase()
        : dynamicDefaultTier;

      // Kiểm tra xem hạng khách hàng có trùng khớp hoàn toàn với hạng của khuyến mãi không
      return customerTier === promoTierName;
    });

    select.innerHTML =
      '<option value="">Không áp dụng</option>' +
      eligiblePromos
        .map(
          (p) =>
            `<option value="${p.promoId}" data-discount="${p.discountAmount}">${p.promoName} (-${p.discountAmount.toLocaleString()}đ)</option>`,
        )
        .join("");
  } catch (error) {
    console.error("Lỗi tải khuyến mãi:", error);
    select.innerHTML = '<option value="">Lỗi tải khuyến mãi</option>';
  }
}
function updatePriceSummary() {
  const serviceSelect = document.getElementById("bookingService");
  const promotionSelect = document.getElementById("bookingPromotion");
  const rewardSelect = document.getElementById("bookingReward");

  const selectedService = serviceSelect.selectedOptions[0];
  const selectedPromo = promotionSelect
    ? promotionSelect.selectedOptions[0]
    : null;
  const selectedReward = rewardSelect ? rewardSelect.selectedOptions[0] : null;

  const basePrice = selectedService?.dataset.price
    ? parseInt(selectedService.dataset.price)
    : 0;
  const promoDiscount = selectedPromo?.dataset.discount
    ? parseInt(selectedPromo.dataset.discount)
    : 0;
  const rewardDiscount = selectedReward?.dataset.discount
    ? parseInt(selectedReward.dataset.discount)
    : 0;
  const tierDiscount = 0;

  const total = Math.max(
    0,
    basePrice - promoDiscount - rewardDiscount - tierDiscount,
  );

  document.getElementById("summaryBase").textContent =
    formatCurrency(basePrice);
  document.getElementById("summaryTierDiscount").textContent =
    `-${formatCurrency(tierDiscount)}`;
  document.getElementById("summaryPromoDiscount").textContent =
    `-${formatCurrency(promoDiscount)}`;

  const summaryRewardEl = document.getElementById("summaryRewardDiscount");
  if (summaryRewardEl) {
    summaryRewardEl.textContent = `-${formatCurrency(rewardDiscount)}`;
  }

  // Đặt trạng thái chờ xử lý cho AddOn khi đang xem trước
  const summaryAddOnEl = document.getElementById("summaryAddOn");
  if (summaryAddOnEl) {
    summaryAddOnEl.textContent = "Tính toán khi đặt lịch...";
  }

  document.getElementById("summaryTotal").textContent = formatCurrency(total);
  document.getElementById("summaryPoints").textContent =
    basePrice > 0 ? `Tính toán khi đặt lịch...` : `+0 điểm`;
}
async function confirmBooking(e) {
  e.preventDefault();

  // 1. Lấy thông tin user an toàn trực tiếp từ localStorage tương tự hàm initBookingPage
  const userStr = localStorage.getItem("autowash_user");
  if (!userStr) {
    showToast("Vui lòng đăng nhập lại hệ thống.");
    return;
  }
  const user = JSON.parse(userStr);
  const customerId = user.customerId || user.id; // Fallback an toàn chống lỗi undefined

  const vehicleId = document.getElementById("bookingVehicle").value;
  const serviceId = document.getElementById("bookingService").value;
  const date = document.getElementById("bookingDate").value;

  const promotionSelect = document.getElementById("bookingPromotion");
  const selectedPromoId =
    promotionSelect && promotionSelect.value ? promotionSelect.value : null;

  const rewardSelect = document.getElementById("bookingReward");
  const rewardId =
    rewardSelect && rewardSelect.value ? rewardSelect.value : null;

  if (!vehicleId || !serviceId || !date || !selectedTimeSlot) {
    showToast("Vui lòng chọn đầy đủ thông tin và khung giờ.");
    return;
  }

  // 2. Thiết lập payload chắc chắn có đầy đủ dữ liệu hợp lệ
  const payload = {
    customerId: parseInt(customerId),
    vehicleId: parseInt(vehicleId),
    slotId: parseInt(selectedTimeSlot),
    washServiceId: parseInt(serviceId),
    bookingDate: date,
    promotionId: selectedPromoId ? parseInt(selectedPromoId) : null,
    appliedRedemptionIds: rewardId ? [parseInt(rewardId)] : [],
  };

  try {
    const response = await fetch("http://localhost:8080/api/v1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 3. Cải tiến bóc tách lỗi chi tiết từ server gửi về thay vì ném chuỗi cứng mặc định
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "Thao tác thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    }

    // Nhận DTO BookingDetailPriceResponse từ Backend
    const priceData = await response.json();

    // Ánh xạ toàn bộ dữ liệu thực tế từ response lên form tóm tắt
    document.getElementById("summaryBase").textContent = formatCurrency(
      priceData.basePrice,
    );
    document.getElementById("summaryTierDiscount").textContent =
      `-${formatCurrency(priceData.discountFromTier)}`;
    document.getElementById("summaryPromoDiscount").textContent =
      `-${formatCurrency(priceData.discountFromPromo)}`;

    const summaryRewardEl = document.getElementById("summaryRewardDiscount");
    if (summaryRewardEl) {
      summaryRewardEl.textContent = `-${formatCurrency(priceData.discountFromReward)}`;
    }

    // ĐỔ DỮ LIỆU ĐẦY ĐỦ: Hiển thị thông tin AddOn
    const summaryAddOnEl = document.getElementById("summaryAddOn");
    if (summaryAddOnEl) {
      summaryAddOnEl.textContent = priceData.addOn || "NONE";
    }

    document.getElementById("summaryTotal").textContent = formatCurrency(
      priceData.finalPrice,
    );
    document.getElementById("summaryPoints").textContent =
      `+${priceData.totalPointEarned} điểm`;

    showToast("Đặt lịch thành công! Đang chuyển trang...");

    // Giữ lại 3 giây để khách kịp kiểm tra bảng tóm tắt hóa đơn cuối cùng
    setTimeout(() => {
      window.location.href = "booking-history.html";
    }, 5000);
  } catch (error) {
    console.error("Lỗi đặt lịch cụ thể:", error);
    showToast(error.message); // Hiển thị chuẩn thông báo lỗi từ Backend trả về
  }
}
