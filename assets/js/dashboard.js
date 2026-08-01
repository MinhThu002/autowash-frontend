/* AutoWash Pro - Dashboard & Page Renderers */
document.addEventListener("DOMContentLoaded", () => {
  loadHeaderUserInfoFromAPI();
  adjustSidebarForRole();
  const page = document.body.dataset.page;
  if (!page) return;

  const renderers = {
    "customer-dashboard": renderCustomerDashboard,
    "customer-vehicles": renderVehiclesPage,
    "booking-history": renderBookingHistory,
    loyalty: renderLoyaltyPage,
    promotions: renderPromotionsPage,
    "admin-dashboard": renderAdminDashboard,
    "admin-customers": renderAdminCustomers,
    "admin-bookings": renderAdminBookings,
    "admin-services": renderAdminServices,
    "admin-loyalty-tiers": renderAdminTiers,
    "admin-promotions": renderAdminPromotions,
    "admin-rewards": renderAdminRewards,
    "admin-staff": renderAdminStaff,
    "staff-schedule": renderStaffSchedule,
  };
  let loadedServices = [];
  const fn = renderers[page];
  if (fn) fn();

  setupTableFiltersForPage(page);
  initCrudModals(page);
});

function setupTableFiltersForPage(page) {
  const configs = {
    "booking-history": {
      tableId: "bookingsTable",
      statusId: "filterStatus",
      dateFromId: "filterDateFrom",
      dateToId: "filterDateTo",
    },
    "admin-customers": {
      tableId: "customersTable",
      tierId: "filterTier",
      searchId: "searchCustomer",
    },
    "admin-bookings": {
      tableId: "adminBookingsTable",
      statusId: "filterStatus",
    },
  };
  if (configs[page]) setupTableFilters(configs[page]);
}

async function renderCustomerDashboard() {
  // 1. Kiểm tra xác thực và lấy customerId thực tế
  const user = requireAuth(["customer"]);
  if (!user) return;
  const customerId = getLoggedInCustomerId();

  if (!window.AutoWashAPI) {
    showToast("API chưa sẵn sàng.");
    return;
  }

  try {
    // 2. Gọi đồng thời API lấy thông tin Profile và danh sách Hạng đang kích hoạt từ Server
    const [profile, tiersRes] = await Promise.all([
      window.AutoWashAPI.customers.profile(customerId),
      fetch("http://localhost:8080/api/loyalty-tiers/active"),
    ]);

    const activeTiers = await tiersRes.json();

    // 3. Chuẩn hóa tên hạng để đồng bộ thông tin lên Navbar
    const tierKey = normalizeTierKey(profile.loyaltyTier.tierName);

    // 4. Đổ dữ liệu từ API thực tế ra các thẻ HTML trên Dashboard
    document.getElementById("welcomeName").textContent = profile.fullName;
    document.getElementById("currentTier").textContent =
      profile.loyaltyTier.tierName;
    document.getElementById("pointsBalance").textContent = (
      profile.currentPoints || 0
    ).toLocaleString("vi-VN");
    document.getElementById("totalVisits").textContent =
      profile.totalVisits || 0;
    document.getElementById("totalSpending").textContent = formatCurrency(
      profile.totalSpend || 0,
    );
  } catch (error) {
    showToast(error.message || "Không tải được thông tin Dashboard.");
    console.error("Lỗi đồng bộ Dashboard:", error);
  }
}

function renderVehiclesPage() {
  const user = requireAuth(["customer"]);
  if (!user) return;

  loadHeaderUserInfoFromAPI();
  const list = document.getElementById("vehiclesList");
  const customerId = getLoggedInCustomerId();

  list.innerHTML =
    '<div class="empty-state"><p>Đang tải danh sách xe...</p></div>';

  return fetchCustomerVehicles(customerId)
    .then((vehicles) => {
      if (!vehicles.length) {
        list.innerHTML =
          '<div class="empty-state"><div class="icon">🚗</div><p>Chưa có xe nào. Thêm xe để đặt lịch.</p></div>';
        return;
      }

      list.innerHTML = vehicles
        .map(
          (v) => `
        <div class="vehicle-card" data-id="${v.vehicleId}">
          <div class="vehicle-card-info">
            <h4>${v.licensePlate}</h4>
            <p>${v.brand} • ${v.vehicleType} • ${v.color}</p>
            ${v.notes ? `<p class="text-muted">${v.notes}</p>` : ""}
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" onclick="editVehicle(${v.vehicleId})">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${v.vehicleId})">Xóa</button>
          </div>
        </div>`,
        )
        .join("");
    })
    .catch((error) => {
      list.innerHTML =
        '<div class="empty-state"><p>Không tải được danh sách xe.</p></div>';
      showToast(error.message || "Không tải được danh sách xe.");
    });
}

async function saveVehicle(e) {
  e.preventDefault();
  const user = requireAuth(["customer"]);
  if (!user) return;

  const customerId = getLoggedInCustomerId();
  const vehicleId = document.getElementById("vehicleId").value;

  // Lấy và chuẩn hóa biển số xe thành chữ in hoa
  const rawLicensePlate = document.getElementById("vehiclePlate").value.trim();
  const normalizedPlate = rawLicensePlate.toUpperCase();

  const payload = buildVehicleRequest(customerId, {
    licensePlate: normalizedPlate,
    vehicleType: document.getElementById("vehicleType").value,
    brand: document.getElementById("vehicleBrand").value.trim(),
    color: document.getElementById("vehicleColor").value.trim(),
  });

  if (!payload.licensePlate || !payload.brand) {
    showToast("Vui lòng nhập biển số và hãng xe.");
    return;
  }

  // ==========================================
  // BỔ SUNG VALIDATE BIỂN SỐ XE
  // ==========================================
  const licensePlateRegex = /^[0-9]{2}[A-Z][0-9A-Z]?-[0-9]{4,5}$/;
  if (!licensePlateRegex.test(payload.licensePlate)) {
    showToast("Biển số xe không hợp lệ. Vui lòng nhập theo định dạng VD: 61A-22222 hoặc 59A1-12345.");
    return;
  }
  // ==========================================

  if (!window.AutoWashAPI) {
    showToast("API chưa sẵn sàng.");
    return;
  }

  try {
    if (vehicleId) {
      await window.AutoWashAPI.vehicles.update(Number(vehicleId), payload);
    } else {
      await window.AutoWashAPI.vehicles.create(payload);
    }
    closeModal("vehicleModal");
    showToast(vehicleId ? "Cập nhật xe thành công!" : "Thêm xe thành công!");
    await renderVehiclesPage();
    await loadHeaderUserInfoFromAPI();
  } catch (error) {
    showToast(error.message || "Lưu xe thất bại.");
  }
}

async function editVehicle(id) {
  const user = requireAuth(["customer"]);
  if (!user) return;

  let vehicle;
  try {
    const vehicles = await fetchCustomerVehicles(getLoggedInCustomerId());
    vehicle = vehicles.find((x) => Number(x.vehicleId) === Number(id));
  } catch (error) {
    showToast(error.message || "Không tải được thông tin xe.");
    return;
  }

  if (!vehicle) return;
  document.getElementById("vehicleModalTitle").textContent = "Sửa xe";
  document.getElementById("vehicleId").value = vehicle.vehicleId;
  document.getElementById("vehiclePlate").value = vehicle.licensePlate;
  document.getElementById("vehicleType").value = vehicle.vehicleType;
  document.getElementById("vehicleBrand").value = vehicle.brand;
  document.getElementById("vehicleColor").value = vehicle.color;
  openModal("vehicleModal");
}

async function deleteVehicle(id) {
  if (!confirm("Bạn có chắc muốn xóa xe này?")) return;

  if (!window.AutoWashAPI) {
    showToast("API chưa sẵn sàng.");
    return;
  }

  try {
    await window.AutoWashAPI.vehicles.remove(Number(id));
    showToast("Đã xóa xe.");
    await renderVehiclesPage();
    await loadHeaderUserInfoFromAPI();
  } catch (error) {
    showToast(error.message || "Xóa xe thất bại.");
  }
}

function openAddVehicle() {
  document.getElementById("vehicleForm").reset();
  document.getElementById("vehicleId").value = "";
  document.getElementById("vehicleModalTitle").textContent = "Thêm xe mới";
  openModal("vehicleModal");
}

async function renderBookingHistory() {
  const user = requireAuth(["customer"]);
  if (!user) return;
  const customerId = getLoggedInCustomerId();
  const customer = getCurrentCustomer();
  if (customer) setUserNav(customer);

  const tbody = document.querySelector("#bookingsTable tbody");

  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align: center;">Đang tải dữ liệu...</td></tr>';

  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/bookings/customer/${customerId}`,
    );
    if (!response.ok) throw new Error("Lỗi kết nối đến máy chủ");

    const bookings = await response.json();

    if (!bookings || bookings.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align: center;">Chưa có lịch sử đặt lịch nào.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings
      .map((b) => {
        const statusMap = {
          COMPLETED: "completed",
          CANCELLED: "cancelled",
          PENDING: "pending",
          CONFIRMED: "confirmed",
        };
        const statusUi = statusMap[b.status] || b.status.toLowerCase();

        // Xử lý hiển thị giờ bắt đầu và kết thúc (cắt lấy HH:mm)
        const startTimeStr = b.startTime
          ? b.startTime.substring(0, 5)
          : "--:--";
        const endTimeStr = b.endTime ? b.endTime.substring(0, 5) : "--:--";

        return `<tr data-status="${statusUi}" data-date="${b.bookingDate}">
        <td>${formatDate(b.bookingDate)}</td>
        <td>${startTimeStr}</td>
        <td>${endTimeStr}</td>
        <td>${b.licensePlate}</td>
        <td>${b.serviceName}</td>
        <td>${b.addOn || "-"}</td> <!-- Hiển thị addOn, nếu không có thì để dấu "-" -->
        <td>${getStatusBadge(statusUi)}</td>
        <td>${formatCurrency(b.totalPrice)}</td>
      </tr>`;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi khi tải lịch sử đặt lịch:", error);
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: red;">Không tải được dữ liệu lịch sử.</td></tr>';
    showToast("Lỗi khi tải lịch sử đặt lịch.");
  }
}
async function renderLoyaltyPage() {
  // 1. Kiểm tra xác thực quyền truy cập của Khách hàng
  const user = requireAuth(["customer"]);
  if (!user) return;

  // 2. Lấy ID người dùng đang đăng nhập thực tế từ hệ thống
  const customerId = getLoggedInCustomerId();

  if (!window.AutoWashAPI) {
    showToast("Hệ thống API chưa sẵn sàng.");
    return;
  }

  // Khởi tạo trạng thái giao diện chờ tải
  const txBody = document.querySelector("#pointsHistory tbody");
  const rewardsEl = document.getElementById("rewardsList");
  if (txBody)
    txBody.innerHTML =
      '<tr><td colspan="3" style="text-align: center;">Đang tải lịch sử điểm...</td></tr>';
  if (rewardsEl)
    rewardsEl.innerHTML =
      '<p class="text-center">Đang tải danh mục đổi thưởng...</p>';

  try {
    // 3. Gọi đồng thời tất cả API liên quan để tối ưu hiệu năng tải trang
    const [profile, tiersRes, historyRes, catalogRes] = await Promise.all([
      window.AutoWashAPI.customers.profile(customerId),
      fetch("http://localhost:8080/api/loyalty-tiers/active"),
      fetch(`http://localhost:8080/api/loyalty-points/customer/${customerId}`),
      fetch("http://localhost:8080/api/rewards/customer/catalog"),
    ]);

    // Ép kiểu JSON dữ liệu trả về từ các Endpoint Fetch API
    const activeTiers = await tiersRes.json();
    const pointsHistory = await historyRes.json();
    const rewardsCatalog = await catalogRes.json();

    // ==========================================
    // KHỐI 1: HIỂN THỊ THÔNG TIN HẠNG & ĐIỂM HIỆN TẠI
    // ==========================================
    const currentTierName = profile.loyaltyTier.tierName; // Ví dụ: BRONZE, SILVER, GOLD...
    document.getElementById("loyaltyTierName").textContent = currentTierName;
    document.getElementById("loyaltyPoints").textContent = (
      profile.currentPoints || 0
    ).toLocaleString("vi-VN");

    // Thay đổi class CSS của thẻ bao quanh tương ứng với màu sắc từng hạng (bronze, silver, gold, diamond)
    const tierCard = document.querySelector(".current-tier-card");
    if (tierCard) {
      tierCard.className =
        "card current-tier-card " + currentTierName.toLowerCase();
    }

    // Tìm chi tiết cấu hình hạng hiện tại trong danh sách Active Tiers từ server
    const currentTierConfig = activeTiers.find(
      (t) => t.tierName === currentTierName,
    );
    if (currentTierConfig) {
      const benefitsEl = document.getElementById("tierBenefitsList");
      benefitsEl.innerHTML = `
        <li>Ưu đãi giảm giá dịch vụ: <strong>${currentTierConfig.discountPercent}%</strong> cho mọi hóa đơn</li>
        <li>Hệ số tích lũy điểm thưởng: <strong>x${currentTierConfig.pointMultiplier}</strong> khi thanh toán</li>
        <li>Thời hạn đặt lịch linh hoạt: Đặt trước tối đa <strong>${currentTierConfig.bookingWindowDays} ngày</strong></li>
      `;
    }

    // ==========================================
    // KHỐI 3: LIÊN KẾT BẢNG LỊCH SỬ ĐIỂM THỰC TẾ
    // ==========================================
    if (!pointsHistory || pointsHistory.length === 0) {
      txBody.innerHTML =
        '<tr><td colspan="3" style="text-align: center;">Bạn chưa thực hiện giao dịch tích lũy điểm nào.</td></tr>';
    } else {
      txBody.innerHTML = pointsHistory
        .map((t) => {
          const isEarn = t.pointsChange > 0;
          const sign = isEarn ? "+" : "";
          const colorClass = isEarn ? "text-primary" : "text-muted";
          return `
          <tr>
            <td>${formatDate(t.createAt)}</td>
            <td>${t.transactionType}</td>
            <td><span class="${colorClass}"><strong>${sign}${t.pointsChange}</strong></span></td>
          </tr>
        `;
        })
        .join("");
    }

    // ==========================================
    // KHỐI 4: HIỂN THỊ DANH MỤC QUÀ TẶNG (VOUCHER ĐỔI THƯỞNG)
    // ==========================================
    if (!rewardsCatalog || rewardsCatalog.length === 0) {
      rewardsEl.innerHTML =
        '<p class="text-center text-muted">Hiện tại trung tâm chưa có chương trình đổi quà.</p>';
    } else {
      rewardsEl.innerHTML = rewardsCatalog
        .map((r) => {
          const isOutOfStock = r.stockQuantity <= 0;
          const isNotEnoughPoints = profile.currentPoints < r.pointsRequired;
          const isDisabled = isOutOfStock || isNotEnoughPoints;

          let btnText = "Đổi thưởng";
          if (isOutOfStock) btnText = "Hết kho quà";
          else if (isNotEnoughPoints) btnText = "Chưa đủ điểm";

          return `
          <div class="reward-item">
            <h4>${r.rewardName}</h4>
            <p class="text-muted">${r.description || "Áp dụng trực tiếp tại hệ thống AutoWash Pro"}</p>
            <div class="points-cost">${r.pointsRequired} điểm</div>
            <p class="text-muted" style="font-size:0.8rem; margin-top:-0.25rem; margin-bottom:0.75rem;">Còn lại: ${r.stockQuantity} voucher</p>
            <button 
              class="btn btn-sm btn-primary" 
              onclick="redeemReward(${r.rewardId}, ${r.pointsRequired}, '${r.rewardName}')"
              ${isDisabled ? "disabled" : ""}
            >
              ${btnText}
            </button>
          </div>
        `;
        })
        .join("");
    }
  } catch (error) {
    console.error("Lỗi đồng bộ dữ liệu Loyalty:", error);
    showToast("Không thể kết xuất dữ liệu chương trình Loyalty từ máy chủ.");
  }
}

async function redeemReward(rewardId, pointsCost, rewardName) {
  const customerId = getLoggedInCustomerId();

  if (
    !confirm(
      `Xác nhận đổi ${pointsCost} điểm tích lũy lấy gói "${rewardName}"?`,
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8080/api/rewards/customer/redeem",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(customerId),
          rewardId: parseInt(rewardId),
          quantity: 1,
        }),
      },
    );

    if (response.status === 201 || response.ok) {
      showToast(
        "Đổi thưởng thành công! Mã Voucher đã được lưu vào ví ưu đãi của bạn.",
      );
      // Gọi lại hàm load trang để cập nhật lại số điểm và số lượng tồn kho trên UI mà không cần tải lại trang
      await renderLoyaltyPage();
    } else {
      const errData = await response.json().catch(() => ({}));
      showToast(
        errData.message || "Giao dịch đổi thưởng thất bại. Vui lòng thử lại.",
      );
    }
  } catch (error) {
    console.error("Lỗi khi gọi API đổi quà:", error);
    showToast("Mất kết nối với máy chủ xử lý đổi thưởng.");
  }
}

// Xuất hàm ra phạm vi window để đảm bảo thuộc tính HTML onclick="" có thể kích hoạt được hàm
window.redeemReward = redeemReward;

async function renderPromotionsPage() {
  // 1. Kiểm tra quyền truy cập và lấy ID khách hàng đang đăng nhập
  const user = requireAuth(["customer"]);
  if (!user) return;
  const customerId = getLoggedInCustomerId();

  const grid = document.getElementById("promotionsGrid");
  if (!grid) return;

  // Hiển thị trạng thái đang tải dữ liệu
  grid.innerHTML =
    '<div class="empty-state"><p>Đang tải danh sách ưu đãi đặc quyền...</p></div>';

  try {
    // 2. Gọi đồng thời các API cần thiết từ Server
    const [profile, tiersRes, promosRes] = await Promise.all([
      window.AutoWashAPI.customers.profile(customerId),
      fetch("http://localhost:8080/api/loyalty-tiers/active"),
      fetch("http://localhost:8080/api/promotions/active"),
    ]);

    if (!tiersRes.ok || !promosRes.ok)
      throw new Error("Không thể kết nối đến máy chủ.");

    const activeTiers = await tiersRes.json();
    const activePromotions = await promosRes.json();

    // 3. Đồng bộ hóa thông tin khách hàng lên thanh điều hướng (Navbar)
    const currentTierName = profile.loyaltyTier.tierName;

    // 4. Lấy cấu hình cấp độ ưu tiên (priorityLevel) của hạng khách hàng hiện tại
    const customerTierConfig = activeTiers.find(
      (t) => t.tierName === currentTierName,
    );
    const customerPriority = customerTierConfig
      ? customerTierConfig.priorityLevel
      : 0;

    // Lấy ngày hôm nay dưới dạng chuỗi "YYYY-MM-DD" theo đúng chuẩn giờ địa phương
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // 5. Tiến hành lọc song song cả ĐIỀU KIỆN HẠNG và ĐIỀU KIỆN THỜI GIAN
    const eligiblePromotions = activePromotions.filter((promo) => {
      // CHECK 1: Kiểm tra thời gian (Ngày hôm nay phải nằm trong khoảng [startDate, endDate])
      const isTimeValid =
        todayStr >= promo.startDate && todayStr <= promo.endDate;

      // CHECK 2: Kiểm tra cấp độ hạng thành viên
      const promoTierConfig = activeTiers.find(
        (t) => t.tierName === promo.minTierName,
      );
      const promoRequiredPriority = promoTierConfig
        ? promoTierConfig.priorityLevel
        : 0;
      const isTierValid = customerPriority == promoRequiredPriority;

      // Khuyến mãi chỉ được hiển thị khi thỏa mãn cả 2 điều kiện trên
      return isTimeValid && isTierValid;
    });

    // Kiểm tra nếu sau khi lọc không còn khuyến mãi nào khả dụng
    if (eligiblePromotions.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <div class="icon" style="font-size: 3rem; margin-bottom: 1rem;">🎁</div>
          <p>Hiện tại không có chương trình ưu đãi nào đang trong thời gian diễn ra phù hợp với bạn.</p>
        </div>`;
      return;
    }

    // 6. Đổ dữ liệu các khuyến mãi hợp lệ ra giao diện HTML (Đã bỏ nút "Sử dụng ngay")
    grid.innerHTML = eligiblePromotions
      .map((p) => {
        const discountDisplay =
          p.discountAmount <= 100
            ? `${p.discountAmount}%`
            : `${p.discountAmount.toLocaleString("vi-VN")}đ`;

        const tierClass = p.minTierName
          ? p.minTierName.toLowerCase()
          : "bronze";

        return `
        <div class="promotion-card tier-benefit-${tierClass}">
          <div class="promo-badge">${p.minTierName}</div>
          <h4>Code: ${p.promoName}</h4>
          <p class="text-muted description">${p.description}</p>
          <span class="discount">Giảm ngay ${discountDisplay}</span>
          <div class="promo-footer">
            <p class="text-muted"><span class="icon">📅</span> HSD: ${formatDate(p.startDate)} - ${formatDate(p.endDate)}</p>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi tải trang khuyến mãi:", error);
    grid.innerHTML =
      '<div class="empty-state"><p style="color: red;">Lỗi: Không thể kết xuất danh sách ưu đãi.</p></div>';
    showToast("Không tải được danh sách khuyến mãi.");
  }
}

// Hàm bổ trợ xử lý khi bấm nút "Sử dụng" khuyến mãi
function usePromotion(promoCode) {
  if (!promoCode) return;
  showToast(`Đã ghi nhận mã [${promoCode}]! Đang chuyển hướng...`);
  setTimeout(() => {
    window.location.href = `booking.html?promo=${encodeURIComponent(promoCode)}`;
  }, 1200);
}

// Xuất hàm ra phạm vi window toàn cục
window.usePromotion = usePromotion;

async function renderAdminDashboard() {
  if (!requireAuth(["admin"])) return;

  try {
    const token = getAuthToken();

    // Gọi API thống kê Dashboard
    const response = await fetch("http://localhost:8080/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Không thể tải dữ liệu Dashboard.");

    const d = await response.json();

    // 1. CẬP NHẬT CÁC THẺ THỐNG KÊ (Top Stats)
    document.getElementById("statTotalBookings").textContent = (
      d.totalBooking || 0
    ).toLocaleString("vi-VN");
    document.getElementById("statTodayBookings").textContent = (
      d.todayBooking || 0
    ).toLocaleString("vi-VN");
    document.getElementById("statRevenue").textContent = formatCurrency(
      d.totalRevenue || 0,
    );
    document.getElementById("statNewCustomers").textContent = (
      d.newCustomers || 0
    ).toLocaleString("vi-VN");
    document.getElementById("statRepeatCustomers").textContent = (
      d.oldCustomers || 0
    ).toLocaleString("vi-VN");
    document.getElementById("statActivePromos").textContent = (
      d.activePromotion || 0
    ).toLocaleString("vi-VN");
    if (document.getElementById("statActiveRewards")) {
      document.getElementById("statActiveRewards").textContent = (
        d.activeReward || 0
      ).toLocaleString("vi-VN");
    }

    // 2. VẼ BIỂU ĐỒ DOANH THU THÁNG
    if (d.monthlyRevenues && d.monthlyRevenues.length > 0) {
      const revenueData = d.monthlyRevenues.map((r) => r.totalRevenue);
      // Biến đổi yearMonth "202602" thành mác "T2"
      const revenueLabels = d.monthlyRevenues.map(
        (r) => `T${parseInt(r.yearMonth.substring(4, 6), 10)}`,
      );
      renderBarChart("revenueChart", revenueData, revenueLabels);
    } else {
      document.getElementById("revenueChart").innerHTML =
        '<p class="text-center text-muted mt-3">Chưa có dữ liệu doanh thu</p>';
    }

    // 3. VẼ BIỂU ĐỒ PHÂN BỔ HẠNG KHÁCH HÀNG (Dữ liệu trả về BRONZE, SILVER...)
    if (d.loyaltyTierCustomers && d.loyaltyTierCustomers.length > 0) {
      const tierData = {};
      d.loyaltyTierCustomers.forEach((t) => {
        tierData[t.tierName] = t.numberCustomer;
      });
      renderTierChart(tierData, "tierChart");
    } else {
      document.getElementById("tierChart").innerHTML =
        '<p class="text-center text-muted mt-3">Chưa có dữ liệu hạng</p>';
    }

    // 4. HIỂN THỊ DỊCH VỤ PHỔ BIẾN
    const svcEl = document.getElementById("topServices");
    if (svcEl) {
      if (d.serviceCustomers && d.serviceCustomers.length > 0) {
        svcEl.innerHTML = d.serviceCustomers
          .map(
            (s) =>
              `<li><span>${s.serviceName}</span><span>${s.numberCustomer} lượt</span></li>`,
          )
          .join("");
      } else {
        svcEl.innerHTML = "<li><span>Chưa có dữ liệu dịch vụ</span></li>";
      }
    }
  } catch (error) {
    console.error("Lỗi renderAdminDashboard:", error);
    showToast("Không thể kết nối và tải dữ liệu tổng quan từ API.");
  }
}

async function renderAdminStaff() {
  if (!requireAuth(["admin"])) return;

  const tbody = document.querySelector("#staffTable tbody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="5" class="text-center text-muted">Đang tải…</td></tr>';

  try {
    const response = await fetch("http://localhost:8080/api/staff", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!response.ok) throw new Error("Không tải được danh sách nhân viên.");

    const staffList = await response.json();
    if (!Array.isArray(staffList) || staffList.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">Chưa có nhân viên nào.</td></tr>';
      return;
    }

    tbody.innerHTML = staffList
      .map((s) => {
        const id = s.id ?? s.adminId;
        const name = s.fullName || "—";
        const username = s.userName || s.username || "—";
        return `<tr>
          <td>${id}</td>
          <td><strong>${name}</strong></td>
          <td>${username}</td>
          <td><span class="badge badge-confirmed">STAFF</span></td>
          <td>
            <button type="button" class="btn btn-sm btn-secondary" onclick="editStaff(${id}, '${String(name).replace(/'/g, "\\'")}', '${String(username).replace(/'/g, "\\'")}')">Sửa</button>
            <button type="button" class="btn btn-sm btn-danger" onclick="deleteStaff(${id})">Xóa</button>
          </td>
        </tr>`;
      })
      .join("");
  } catch (error) {
    console.error("Lỗi renderAdminStaff:", error);
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">Không tải được dữ liệu.</td></tr>';
    showToast(error.message || "Không tải được nhân viên.");
  }
}

function openStaffModal() {
  document.getElementById("staffModalTitle").textContent = "Thêm nhân viên";
  document.getElementById("staffId").value = "";
  document.getElementById("staffFullName").value = "";
  document.getElementById("staffUsername").value = "";
  document.getElementById("staffPassword").value = "";
  document.getElementById("staffPassword").required = true;
  document.getElementById("staffPasswordHint").textContent = "(bắt buộc)";
  openModal("staffModal");
}

function editStaff(id, fullName, username) {
  document.getElementById("staffModalTitle").textContent = "Sửa nhân viên";
  document.getElementById("staffId").value = id;
  document.getElementById("staffFullName").value = fullName || "";
  document.getElementById("staffUsername").value = username || "";
  document.getElementById("staffPassword").value = "";
  document.getElementById("staffPassword").required = true;
  document.getElementById("staffPasswordHint").textContent =
    "(nhập mật khẩu mới)";
  openModal("staffModal");
}

async function saveStaff(e) {
  e.preventDefault();
  if (!requireAuth(["admin"])) return;

  const id = document.getElementById("staffId").value;
  const payload = {
    fullName: document.getElementById("staffFullName").value.trim(),
    username: document.getElementById("staffUsername").value.trim(),
    password: document.getElementById("staffPassword").value,
  };

  if (!payload.fullName || !payload.username || !payload.password) {
    showToast("Vui lòng điền đầy đủ họ tên, username và mật khẩu.");
    return;
  }
  if (payload.password.length < 6) {
    showToast("Mật khẩu tối thiểu 6 ký tự.");
    return;
  }

  try {
    const url = id
      ? `http://localhost:8080/api/staff/${id}`
      : "http://localhost:8080/api/staff";
    const response = await fetch(url, {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || "Lưu nhân viên thất bại.");
    }
    closeModal("staffModal");
    showToast(
      id ? "Cập nhật nhân viên thành công!" : "Thêm nhân viên thành công!",
    );
    await renderAdminStaff();
  } catch (error) {
    showToast(error.message || "Không lưu được nhân viên.");
  }
}

async function deleteStaff(id) {
  if (!requireAuth(["admin"])) return;
  if (!confirm("Xóa tài khoản nhân viên này?")) return;

  try {
    const response = await fetch(`http://localhost:8080/api/staff/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || "Xóa thất bại.");
    }
    showToast("Đã xóa nhân viên.");
    await renderAdminStaff();
  } catch (error) {
    showToast(error.message || "Không xóa được nhân viên.");
  }
}

window.openStaffModal = openStaffModal;
window.editStaff = editStaff;
window.saveStaff = saveStaff;
window.deleteStaff = deleteStaff;
window.renderAdminStaff = renderAdminStaff;

function renderAdminCustomers() {
  if (!requireAuth(["admin"])) return;

  const tbody = document.querySelector("#customersTable tbody");
  if (!tbody) return;

  loadTiersToCustomerFilter();

  tbody.innerHTML =
    '<tr><td colspan="7">Đang tải danh sách khách hàng...</td></tr>';

  fetchAdminCustomers()
    .then((customers) => {
      if (!customers.length) {
        tbody.innerHTML = '<tr><td colspan="7">Chưa có khách hàng.</td></tr>';
        return;
      }

      tbody.innerHTML = customers
        .map((c) => {
          // Sử dụng trực tiếp giá trị từ DB (BRONZE, SILVER, GOLD, DIAMOND) làm khóa lọc
          const tierKey = c.loyaltyTier;
          const searchText =
            `${c.fullName} ${c.phoneNumber} ${c.email}`.toLowerCase();

          return `<tr data-tier="${tierKey}" data-search="${searchText}">
          <td><strong>${c.fullName}</strong></td>
          <td>${c.phoneNumber}</td>
          <td>${c.email}</td>
          <td><span class="badge tier-${tierKey.toLowerCase()}">${tierKey}</span></td>
          <td>${c.currentPoints.toLocaleString("vi-VN")}</td>
          <td>${c.totalVisits}</td>
          <td>${formatCurrency(c.totalSpend)}</td>
        </tr>`;
        })
        .join("");

      filterTable("customersTable", {
        tier: document.getElementById("filterTier")?.value,
        search: document.getElementById("searchCustomer")?.value,
      });
    })
    .catch((error) => {
      tbody.innerHTML =
        '<tr><td colspan="7">Không tải được danh sách khách hàng.</td></tr>';
      showToast(error.message || "Không tải được danh sách khách hàng.");
    });
}

async function loadTiersToCustomerFilter() {
  const filterSelect = document.getElementById("filterTier");
  if (!filterSelect) return;

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    // Gọi API lấy danh sách hạng (Tái sử dụng endpoint giống loadTiersToPromoSelect)
    const response = await fetch("http://localhost:8080/api/loyalty-tiers", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Không thể tải danh sách hạng.");

    const tiers = await response.json();

    // Lọc các hạng đang Active và sắp xếp theo cấp độ ưu tiên (priorityLevel)
    const activeTiers = tiers
      .filter((t) => t.isActive)
      .sort((a, b) => a.priorityLevel - b.priorityLevel);

    // Gắn thêm các Option lấy từ API vào bên dưới Option "Tất cả hạng"
    // Lưu ý: Đặt value="${t.tierName}" để khớp với data-tier trong hàm renderAdminCustomers
    const optionsHtml = activeTiers
      .map((t) => `<option value="${t.tierName}">${t.tierName}</option>`)
      .join("");

    filterSelect.innerHTML =
      '<option value="all">Tất cả hạng</option>' + optionsHtml;
  } catch (error) {
    console.error("Lỗi tải bộ lọc hạng khách hàng:", error);
  }
}

async function renderAdminBookings() {
  if (!requireAuth(["admin"])) return;

  const tbody = document.querySelector("#adminBookingsTable tbody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách đặt lịch...</td></tr>';

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    // Gọi API lấy danh sách toàn bộ Booking
    const response = await fetch("http://localhost:8080/api/v1/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });

    if (!response.ok) throw new Error("Không thể kết nối máy chủ API.");

    const bookings = await response.json();

    if (!bookings || bookings.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align: center;">Không có dữ liệu đặt lịch nào.</td></tr>';
      return;
    }

    // Map dữ liệu API vào Table HTML
    tbody.innerHTML = bookings
      .map((b) => {
        // Đảm bảo đồng bộ hóa chữ thường với thuộc tính data-status phục vụ bộ lọc
        const statusLower = b.status ? b.status.toLowerCase() : "pending";
        const bookingId = b.bookingId || b.id;

        // Xử lý động cột "Thao tác" dựa vào Trạng thái hiện tại của Booking
        let actionButtons = "";
        if (statusLower === "pending") {
          actionButtons = `
          <button class="btn btn-sm btn-secondary" onclick="confirmArrival(${bookingId})">Xác nhận đến</button>
          <button class="btn btn-sm btn-danger" onclick="cancelBooking(${bookingId})">Hủy</button>
        `;
        } else if (statusLower === "confirmed") {
          actionButtons = `
          <button class="btn btn-sm btn-primary" onclick="completeBooking(${bookingId})">Hoàn thành</button>
          <button class="btn btn-sm btn-danger" onclick="cancelBooking(${bookingId})">Hủy</button>
        `;
        } else {
          // COMPLETED hoặc CANCELLED thì không cho thao tác gì thêm
          actionButtons = `<span class="text-muted">Đã kết thúc</span>`;
        }

        // --- BẮT ĐẦU CẬP NHẬT: Xử lý hiển thị giờ bắt đầu và giờ kết thúc ---
        let timeDisplay = "-";
        if (b.startTime && b.endTime) {
          // Cắt lấy 5 ký tự đầu (HH:mm) để hiển thị định dạng "08:00 - 09:00"
          timeDisplay = `${b.startTime.substring(0, 5)} - ${b.endTime.substring(0, 5)}`;
        } else if (b.startTime) {
          timeDisplay = b.startTime.substring(0, 5);
        } else if (b.startSlotName) {
          timeDisplay = b.startSlotName;
        }
        // --- KẾT THÚC CẬP NHẬT ---

        return `<tr data-status="${statusLower}" data-id="${bookingId}">
        <td><strong>${b.fullName || b.customerName || "Khách vãng lai"}</strong></td>
        <td>${b.customerPhoneNumber || "-"}</td> <!-- Đã sửa thành customerPhoneNumber -->
        <td>${b.licensePlate || "-"}</td>
        <td>${b.serviceName || "Dịch vụ"}</td>
        <td>${b.addOn || "-"}</td> 
        <td>${formatDate(b.bookingDate)}</td>
        <td>${timeDisplay}</td> 
        <td>${getStatusBadge(statusLower)}</td>
        <td>${formatCurrency(b.totalPrice)}</td>
        <td class="actions">
          ${actionButtons}
        </td>
      </tr>`;
      })
      .join("");

    // Kích hoạt bộ lọc trạng thái có sẵn của trang
    filterTable("adminBookingsTable", {
      status: document.getElementById("filterStatus")?.value,
    });
  } catch (error) {
    console.error("Lỗi renderAdminBookings:", error);
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: red;">Không thể tải dữ liệu lịch đặt từ máy chủ.</td></tr>';
    showToast("Lỗi kết nối máy chủ API.");
  }
}

function updateBookingStatus(id, status) {
  const bookings = getBookings().map((b) =>
    b.id === id ? { ...b, status } : b,
  );
  saveToStorage("bookings", bookings);
  showToast("Cập nhật trạng thái thành công!");
  location.reload();
}

async function renderAdminServices() {
  if (!requireAuth(["admin"])) return;

  const tbody = document.querySelector("#servicesTable tbody");
  if (!tbody) return;

  // Giảm colspan xuống 6 do đã bỏ cột Loại xe
  tbody.innerHTML =
    '<tr><td colspan="6" style="text-align: center;">Đang tải danh sách dịch vụ từ máy chủ...</td></tr>';

  try {
    const response = await fetch(
      "http://localhost:8080/api/admin/wash-services",
    );
    if (!response.ok) throw new Error("Không thể kết nối đến máy chủ API.");

    loadedServices = await response.json();

    if (!loadedServices || loadedServices.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">Chưa có gói dịch vụ nào được cấu hình.</td></tr>';
      return;
    }

    // Đã loại bỏ dòng hiển thị s.vehicleType
    tbody.innerHTML = loadedServices
      .map(
        (s) => `
        <tr data-id="${s.serviceId}">
          <td><strong>${s.serviceName}</strong></td>
          <td>${s.durationMinutes} phút</td>
          <td>${formatCurrency(s.price)}</td>
        <td>${s.description || "-"}</td>
             <td>
              <span class="badge status-${s.isActive ? "active" : "inactive"}">
                ${s.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </td>
          <td class="actions">
            <button class="btn btn-sm btn-secondary" onclick="editService('${s.serviceId}')">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteService('${s.serviceId}')">Xóa</button>
          </td>
        </tr>`,
      )
      .join("");
  } catch (error) {
    console.error("Lỗi renderAdminServices:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: red;">Lỗi: Không thể tải dữ liệu dịch vụ.</td></tr>';
    showToast("Mất kết nối với máy chủ API dịch vụ.");
  }
}

async function renderAdminPromotions() {
  const tbody = document.querySelector("#promotionsTable tbody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="8">Đang tải danh sách khuyến mãi...</td></tr>';

  try {
    // 1. Gọi API nạp danh sách Hạng động vào dropdown trước
    await loadTiersToPromoSelect();

    // 2. Tải danh sách Khuyến mãi từ máy chủ
    const response = await fetch("http://localhost:8080/api/promotions");
    if (!response.ok) throw new Error("Không thể kết nối API");

    const promos = await response.json();

    if (!promos.length) {
      tbody.innerHTML = '<tr><td colspan="8">Chưa có khuyến mãi nào.</td></tr>';
      return;
    }

    // 3. Render bảng khuyến mãi kèm theo data attribute "data-tier-id"
    tbody.innerHTML = promos
      .map((p) => {
        let type =
          p.discountType || (p.discountAmount <= 100 ? "percent" : "fixed");

        const discountDisplay =
          type === "percent"
            ? `${p.discountAmount}%`
            : `${Number(p.discountAmount).toLocaleString("vi-VN")} đ`;

        return `
          <tr data-id="${p.promoId}" data-tier-id="${p.minTierId || ""}">
            <td><strong>${p.promoName}</strong></td>
            <td>${p.description}</td>
            <td data-discount="${p.discountAmount}">${discountDisplay}</td>
            <td>${p.startDate}</td>
            <td>${p.endDate}</td>
            <td>${p.minTierName || "Chưa xác định"}</td>
            <td>
              <span class="badge status-${p.isActive ? "active" : "inactive"}">
                ${p.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td class="actions">
              <button class="btn btn-sm btn-secondary" onclick="editPromotion('${p.promoId}')">Sửa</button>
              <button class="btn btn-sm btn-danger" onclick="deletePromotion('${p.promoId}')">Xóa</button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8">Lỗi tải dữ liệu.</td></tr>';
    showToast("Không thể tải danh sách khuyến mãi.");
  }
}

function renderAdminRewards() {
  const tbody = document.querySelector("#rewardsTable tbody");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8">Đang tải dữ liệu...</td></tr>';

  fetchAdminRewards()
    .then((rewards) => {
      if (!rewards.length) {
        tbody.innerHTML = '<tr><td colspan="8">Chưa có quà tặng nào.</td></tr>';
        return;
      }

      tbody.innerHTML = rewards
        .map((r) => {
          // 1. Phán đoán loại giảm giá đề phòng data cũ từ API trả về null
          let type = r.discountType;
          if (!type) {
            type = r.discountAmount <= 100 ? "percent" : "fixed";
          }

          // 2. Định dạng chuỗi hiển thị đúng chuẩn % và đ
          const discountDisplay =
            type === "percent"
              ? `${r.discountAmount}%`
              : `${Number(r.discountAmount).toLocaleString("vi-VN")} đ`;

          return `
            <tr data-id="${r.rewardId}">
              <td>${r.rewardId}</td>
              <td><strong>${r.rewardName}</strong></td>
              <td>${r.description || "-"}</td>
              <td>${r.pointsRequired.toLocaleString("vi-VN")}</td>
              <td>${discountDisplay}</td>
              <td>${r.stockQuantity}</td>
              <td><span class="badge status-${r.isActive ? "active" : "inactive"}">${r.isActive ? "Active" : "Inactive"}</span></td>
              <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editReward(${r.rewardId})">Sửa</button>
                <button class="btn btn-sm btn-danger" onclick="deleteReward(${r.rewardId})">Xóa</button>
              </td>
            </tr>`;
        })
        .join("");
    })
    .catch((error) => {
      tbody.innerHTML =
        '<tr><td colspan="8" style="color:red;">Lỗi tải danh sách quà tặng.</td></tr>';
    });
}

function getAuthToken() {
  try {
    const userStr = localStorage.getItem("autowash_user");
    return userStr ? JSON.parse(userStr).token || "" : "";
  } catch (e) {
    return localStorage.getItem("autowash_token") || "";
  }
}

function updateStaffDayStats(bookings) {
  const count = (status) =>
    bookings.filter((b) => String(b.status || "").toLowerCase() === status)
      .length;
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set("stTotal", bookings.length);
  set("stPending", count("pending"));
  set("stConfirmed", count("confirmed"));
  set("stCompleted", count("completed"));
}

async function renderStaffSchedule() {
  if (!requireAuth(["staff", "admin"])) return;

  const scheduleContainer = document.querySelector("#scheduleList");
  if (!scheduleContainer) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const todayDisplay = `${dd}/${mm}/${yyyy}`;

  const titleEl = document.getElementById("scheduleDateTitle");
  const subEl = document.getElementById("scheduleDateSub");
  if (titleEl) titleEl.textContent = `Lịch ngày ${todayDisplay}`;
  if (subEl)
    subEl.textContent =
      "Xác nhận khách đến, hoàn thành và thu tiền ngay trên timeline.";

  scheduleContainer.innerHTML =
    '<div class="empty-state"><p>Đang tải lịch trình...</p></div>';

  try {
    const token = getAuthToken();
    const response = await fetch("http://localhost:8080/api/v1/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });
    if (!response.ok) throw new Error("Không thể lấy dữ liệu lịch trình.");

    const bookings = await response.json();
    const todayBookings = bookings
      .filter((booking) => {
        if (!booking.bookingDate) return false;
        return booking.bookingDate.split("T")[0] === todayStr;
      })
      .sort((a, b) =>
        String(a.startTime || "").localeCompare(String(b.startTime || "")),
      );

    updateStaffDayStats(todayBookings);

    if (todayBookings.length === 0) {
      scheduleContainer.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <p>Hôm nay (${todayDisplay}) chưa có lịch nào.</p>
          <a href="walkin-booking.html" class="btn btn-primary" style="margin-top:1rem">Tạo walk-in</a>
        </div>`;
      return;
    }

    scheduleContainer.innerHTML = todayBookings
      .map((booking) => {
        const bookingId = booking.bookingId || booking.id;
        const statusLower = booking.status
          ? booking.status.toLowerCase()
          : "pending";

        let timeStr = "--:--";
        if (booking.startTime && booking.endTime) {
          // Hiển thị theo định dạng "HH:mm - HH:mm"
          timeStr = `${booking.startTime.substring(0, 5)} - ${booking.endTime.substring(0, 5)}`;
        } else if (booking.startTime) {
          timeStr = booking.startTime.substring(0, 5);
        } else if (booking.startSlotName) {
          timeStr = booking.startSlotName;
        }

        return `
          <div class="schedule-card" data-status="${statusLower}">
            <div class="schedule-time">${timeStr}</div>
            <div>
              <div class="schedule-card-top">
                <h4>${booking.fullName || booking.customerName || "Khách vãng lai"}</h4>
                ${getStatusBadge(statusLower)}
              </div>
              <div class="schedule-meta">
                <span>📞 ${booking.customerPhoneNumber || "N/A"}</span> <!-- Đã sửa thành customerPhoneNumber -->
                <span>🚗 ${booking.licensePlate || "N/A"}</span>
                <span>🔧 ${booking.serviceName || "N/A"}</span>
                <span>➕ ${booking.addOn || "Không có"}</span>
                <span>💰 ${formatCurrency(booking.totalPrice)}</span>
              </div>
              <div class="schedule-actions">
                <label for="status-${bookingId}">Trạng thái</label>
                <select class="status-updater" data-id="${bookingId}" id="status-${bookingId}">
                  <option value="PENDING" ${statusLower === "pending" ? "selected" : ""}>Chờ xử lý</option>
                  <option value="CONFIRMED" ${statusLower === "confirmed" ? "selected" : ""}>Đã xác nhận</option>
                  <option value="COMPLETED" ${statusLower === "completed" ? "selected" : ""}>Hoàn thành</option>
                  <option value="CANCELLED" ${statusLower === "cancelled" ? "selected" : ""}>Hủy bỏ</option>
                </select>
              </div>
            </div>
          </div>`;
      })
      .join("");

    document.querySelectorAll(".status-updater").forEach((select) => {
      select.addEventListener("change", async (e) => {
        await updateScheduleStatus(e.target.dataset.id, e.target.value);
      });
    });
  } catch (error) {
    console.error("Lỗi khi tải lịch trình hôm nay:", error);
    updateStaffDayStats([]);
    scheduleContainer.innerHTML = `<div class="empty-state"><p class="text-danger">Không tải được lịch trình.</p></div>`;
  }
}

async function updateScheduleStatus(bookingId, newStatus) {
  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    // 1. Xác định đúng API endpoint (PUT) dựa theo trạng thái được chọn từ dropdown
    let url = "";
    if (newStatus === "CONFIRMED") {
      url = `http://localhost:8080/api/v1/bookings/${bookingId}/confirm-arrival`;
    } else if (newStatus === "COMPLETED") {
      url = `http://localhost:8080/api/v1/bookings/${bookingId}/complete`;
    } else if (newStatus === "CANCELLED") {
      url = `http://localhost:8080/api/v1/bookings/${bookingId}/cancel`;
    } else {
      showToast(
        "Không hỗ trợ chuyển về trạng thái chờ xử lý (PENDING) từ đây!",
      );
      renderStaffSchedule(); // Reset lại giao diện dropdown về giá trị cũ
      return;
    }

    // 2. Gửi request PUT lên Server kèm token bảo mật
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showToast("Cập nhật trạng thái thành công!");
      await renderStaffSchedule(); // Tải lại danh sách lịch trình để đồng bộ UI
    } else {
      const errData = await response.json().catch(() => ({}));
      showToast(
        errData.message || "Cập nhật trạng thái thất bại. Vui lòng thử lại!",
      );
      await renderStaffSchedule();
    }
  } catch (error) {
    console.error("Lỗi kết nối khi cập nhật trạng thái:", error);
    showToast("Không thể kết nối đến máy chủ.");
    await renderStaffSchedule();
  }
}

function setUserNav(customer) {
  const user = requireAuth(["customer"]);
  if (!user) return;
  const name = customer?.name || user.name;
  document
    .querySelectorAll(".user-name")
    .forEach((el) => (el.textContent = name));
  document.querySelectorAll(".user-tier").forEach((el) => {
    if (customer) el.textContent = getTierById(customer.tier).name;
  });
  document
    .querySelectorAll(".user-avatar")
    .forEach((el) => (el.textContent = getUserInitials(name)));
}

function renderBarChart(containerId, data, labels, small) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!data || !data.length) {
    container.innerHTML =
      '<p class="text-center text-muted">Chưa có dữ liệu</p>';
    return;
  }
  const max = Math.max(...data.map(Number), 1);
  container.innerHTML =
    '<div class="chart-container">' +
    data
      .map(
        (v, i) =>
          `<div class="chart-bar" style="height:${Math.round((Number(v) / max) * 100)}%" data-value="${small ? v : formatCurrency(v)}"></div>`,
      )
      .join("") +
    '</div><div class="chart-labels">' +
    labels.map((l) => `<span>${l}</span>`).join("") +
    "</div>";
}

function renderTierChart(data, containerId) {
  const el = document.getElementById(containerId || "tierChart");
  if (!el) return;
  const total = Object.values(data).reduce((a, b) => a + b, 0);

  // Bảng màu mặc định tự sinh cho các hạng từ API (BRONZE, SILVER, GOLD, PLATINUM)
  const colors = {
    bronze: "#cd7f32",
    silver: "#94a3b8",
    gold: "#f59e0b",
    platinum: "#8b5cf6",
  };

  let gradient = [];
  let acc = 0;
  Object.entries(data).forEach(([tier, count]) => {
    const pct = (count / total) * 100;
    const colorKey = tier.toLowerCase();
    const color = colors[colorKey] || "#007bff"; // Lấy màu fallback nếu tên hạng lạ
    gradient.push(`${color} ${acc}% ${acc + pct}%`);
    acc += pct;
  });

  el.innerHTML = `
    <div class="donut-chart" style="background:conic-gradient(${gradient.join(",")})"></div>
    <div class="donut-legend" style="margin-top:1rem">
      ${Object.entries(data)
      .map(([t, c]) => {
        const colorKey = t.toLowerCase();
        const color = colors[colorKey] || "#007bff";
        return `<div class="legend-item"><span class="legend-dot" style="background:${color}"></span>${t}: ${c}</div>`;
      })
      .join("")}
    </div>`;
}

// ====== 1. ĐĂNG KÝ SỰ KIỆN Ở HÀM initCrudModals ======
// Tìm hàm initCrudModals(page) trong file của bạn và thêm dòng lắng nghe 'tierForm'
function initCrudModals(page) {
  document
    .getElementById("vehicleForm")
    ?.addEventListener("submit", saveVehicle);
  document
    .getElementById("serviceForm")
    ?.addEventListener("submit", saveService);
  document
    .getElementById("promotionForm")
    ?.addEventListener("submit", savePromotion);
  document.getElementById("rewardForm")?.addEventListener("submit", saveReward);
  // THÊM DÒNG NÀY:
  document.getElementById("tierForm")?.addEventListener("submit", saveTier);
}

// ====== 2. LOGIC CRUD CHO HẠNG THÀNH VIÊN ======
let loadedTiers = []; // Biến toàn cục để lưu trữ dữ liệu hạng

// 2.1. Lấy và hiển thị danh sách hạng (GET)
async function renderAdminTiers() {
  const tbody = document.querySelector("#tiersTable tbody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7" style="text-align: center;">Đang tải danh sách hạng thành viên...</td></tr>';

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch("http://localhost:8080/api/loyalty-tiers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Lỗi tải danh sách hạng từ máy chủ.");

    loadedTiers = await response.json();

    if (!loadedTiers || loadedTiers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">Chưa có hạng thành viên nào được tạo.</td></tr>';
      return;
    }

    // Map dữ liệu vào bảng
    tbody.innerHTML = loadedTiers
      .map(
        (t) => `
  <tr data-id="${t.tierId || t.id}">
    <td><strong>${t.tierName}</strong> (Cấp ${t.priorityLevel})</td>
    <td>${t.minVisits} lượt / ${formatCurrency(t.minSpending)}</td>
    <td>x${t.pointMultiplier}</td>
    <td>${t.bookingWindowDays} ngày</td>
    <td>${t.discountPercent}%</td>
    <td><span class="badge status-${t.isActive ? "active" : "inactive"}">${t.isActive ? "Active" : "Inactive"}</span></td>
    <td class="actions">
      <!-- Cập nhật tham số truyền vào thành t.tierId || t.id -->
      <button class="btn btn-sm btn-secondary" onclick="editTier(${t.tierId || t.id})">Sửa</button>
      <button class="btn btn-sm btn-danger" onclick="deleteTier(${t.tierId || t.id})">Xóa</button>
    </td>
  </tr>
`,
      )
      .join("");
  } catch (error) {
    console.error("Lỗi renderAdminTiers:", error);
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi kết nối máy chủ API.</td></tr>';
  }
}

// 2.2. Mở Modal Thêm mới
function openAddTier() {
  document.getElementById("tierForm").reset();
  document.getElementById("tierId").value = "";
  document.getElementById("tierModalTitle").textContent = "Thêm hạng mới";
  document.getElementById("tierActive").value = "true"; // Mặc định là Active
  openModal("tierModal");
}

// 2.3. Xử lý Thêm mới (POST) và Cập nhật (PUT) kèm kiểm tra trùng cấp độ ưu tiên (priorityLevel)
async function saveTier(e) {
  e.preventDefault();
  if (!requireAuth(["admin"])) return;

  const id = document.getElementById("tierId").value;

  // Ánh xạ dữ liệu form khớp với cấu trúc request body từ Swagger
  const payload = {
    tierName: document.getElementById("tierName").value.trim(),
    minSpending: parseInt(document.getElementById("tierMinSpending").value),
    minVisits: parseInt(document.getElementById("tierMinVisits").value),
    bookingWindowDays: parseInt(
      document.getElementById("tierBookingWindow").value,
    ),
    pointMultiplier: parseFloat(
      document.getElementById("tierMultiplier").value,
    ),
    priorityLevel: parseInt(document.getElementById("tierPriority").value),
    discountPercent: parseInt(document.getElementById("tierDiscount").value),
    isActive: document.getElementById("tierActive").value === "true",
  };

  // --- BẮT ĐẦU KIỂM TRA TRÙNG LẶP PRIORITY LEVEL ---
  const isDuplicatePriority = loadedTiers.some((t) => {
    const existingId = t.tierId || t.id;
    if (id) {
      // TRƯỜNG HỢP SỬA (Cập nhật):
      // Cấp độ ưu tiên trùng với một hạng KHÁC hạng đang sửa hiện tại
      return (
        Number(existingId) !== Number(id) &&
        Number(t.priorityLevel) === Number(payload.priorityLevel)
      );
    } else {
      // TRƯỜNG HỢP THÊM MỚI:
      // Cấp độ ưu tiên trùng với bất kỳ hạng nào đã tồn tại trong hệ thống
      return Number(t.priorityLevel) === Number(payload.priorityLevel);
    }
  });

  if (isDuplicatePriority) {
    showToast(
      `Lỗi: Cấp độ ưu tiên ${payload.priorityLevel} đã tồn tại ở một hạng khác. Vui lòng chọn cấp độ khác!`,
    );
    return; // Dừng thực thi, không gửi API lên Server
  }
  // --- KẾT THÚC KIỂM TRA ---

  const url = id
    ? `http://localhost:8080/api/loyalty-tiers/${id}`
    : "http://localhost:8080/api/loyalty-tiers";
  const method = id ? "PUT" : "POST";

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Giao dịch lỗi.");
    }

    closeModal("tierModal");
    showToast(
      id ? "Cập nhật hạng thành công!" : "Tạo hạng thành viên mới thành công!",
    );
    await renderAdminTiers(); // Tải lại bảng
  } catch (error) {
    showToast("Lỗi: " + error.message);
  }
}

// 2.4. Đổ dữ liệu vào Modal khi Sửa
function editTier(id) {
  const t = loadedTiers.find((x) => Number(x.tierId || x.id) === Number(id));
  if (!t) {
    showToast("Lỗi: Không tìm thấy dữ liệu hạng thành viên!");
    return;
  }

  document.getElementById("tierId").value = t.tierId || t.id;
  document.getElementById("tierName").value = t.tierName;
  document.getElementById("tierPriority").value = t.priorityLevel;
  document.getElementById("tierMinVisits").value = t.minVisits;
  document.getElementById("tierMinSpending").value = t.minSpending;
  document.getElementById("tierMultiplier").value = t.pointMultiplier;
  document.getElementById("tierBookingWindow").value = t.bookingWindowDays;
  document.getElementById("tierDiscount").value = t.discountPercent;
  document.getElementById("tierActive").value = t.isActive ? "true" : "false";

  document.getElementById("tierModalTitle").textContent =
    "Cập nhật hạng thành viên";
  openModal("tierModal");
}

// 2.5. Xóa hạng thành viên (Soft Delete - DELETE)
async function deleteTier(id) {
  if (!requireAuth(["admin"])) return;
  if (
    !confirm(
      "Hành động này sẽ vô hiệu hóa hạng thành viên (Trạng thái Inactive). Bạn có chắc chắn?",
    )
  )
    return;

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch(
      `http://localhost:8080/api/loyalty-tiers/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Thao tác bị từ chối.");

    showToast("Đã vô hiệu hóa hạng thành viên.");
    await renderAdminTiers();
  } catch (error) {
    showToast("Lỗi xóa hạng: " + error.message);
  }
}
async function saveService(e) {
  e.preventDefault();
  if (!requireAuth(["admin"])) return;

  const id = document.getElementById("serviceId").value;

  // Thu thập dữ liệu từ Form và ép kiểu chuẩn DTO Backend
  const payload = {
    serviceName: document.getElementById("serviceName").value.trim(),
    description: document.getElementById("serviceDescription").value.trim(),
    price: parseInt(document.getElementById("servicePrice").value),
    durationMinutes: parseInt(document.getElementById("serviceDuration").value),
    isActive: document.getElementById("serviceActive").value === "true",
  };

  // Xác định Endpoint và Method tương ứng theo trạng thái Form
  const url = id
    ? `http://localhost:8080/api/admin/wash-services/${id}`
    : `http://localhost:8080/api/admin/wash-services`;

  const method = id ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Giao dịch qua API thất bại.");
    }

    closeModal("serviceModal");
    showToast(
      id ? "Cập nhật dịch vụ thành công!" : "Thêm dịch vụ mới thành công!",
    );

    // Tải lại bảng danh sách ngay lập tức để đồng bộ UI
    await renderAdminServices();
  } catch (error) {
    console.error("Lỗi saveService:", error);
    showToast(error.message || "Không thể lưu thay đổi dịch vụ.");
  }
}

function editService(id) {
  const s = loadedServices.find((x) => Number(x.serviceId) === Number(id));
  if (!s) {
    showToast("Không tìm thấy thông tin chi tiết dịch vụ.");
    return;
  }

  // Đổ dữ liệu từ Object API ra các input tương ứng
  document.getElementById("serviceId").value = s.serviceId;
  document.getElementById("serviceName").value = s.serviceName;
  document.getElementById("serviceDuration").value = s.durationMinutes;
  document.getElementById("servicePrice").value = s.price;
  document.getElementById("serviceDescription").value = s.description || "";
  document.getElementById("serviceActive").value = s.isActive
    ? "true"
    : "false";
  openModal("serviceModal");
}

async function deleteService(id) {
  if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa gói dịch vụ này không?"))
    return;

  try {
    const response = await fetch(
      `http://localhost:8080/api/admin/wash-services/${id}`,
      {
        method: "DELETE",
        // headers: { "Authorization": "Bearer " + token } // Thêm nếu cần thiết
      },
    );

    if (!response.ok)
      throw new Error("Yêu cầu xóa dịch vụ từ hệ thống bị từ chối.");

    showToast("Đã vô hiệu hóa dịch vụ thành công.");

    // Refresh dữ liệu
    await renderAdminServices();
  } catch (error) {
    console.error("Lỗi deleteService:", error);
    showToast(error.message || "Xóa dịch vụ thất bại.");
  }
}

function openAddService() {
  document.getElementById("serviceForm").reset();
  document.getElementById("serviceId").value = "";
  // Mặc định trạng thái khi thêm mới là Active
  document.getElementById("serviceActive").value = "true";
  openModal("serviceModal");
}

async function savePromotion(e) {
  e.preventDefault();

  const id = document.getElementById("promoId").value;
  const tierSelectVal = document.getElementById("promoTier").value;

  // Kiểm tra nếu chưa chọn hạng (đề phòng mảng hạng trống)
  if (!tierSelectVal) {
    showToast("Vui lòng chọn Hạng áp dụng cho khuyến mãi này.");
    return;
  }

  const data = {
    promoName: document.getElementById("promoName").value.trim(),
    description: document.getElementById("promoDescription").value.trim(),
    discountAmount: parseFloat(
      document.getElementById("promoDiscountValue").value,
    ),
    discountType: document.getElementById("promoDiscountType").value,
    startDate: document.getElementById("promoStart").value,
    endDate: document.getElementById("promoEnd").value,
    isActive: document.getElementById("promoStatus").value === "active",
    minTierId: parseInt(tierSelectVal), // Luôn luôn gửi ID của hạng đã chọn
  };

  if (!data.promoName || data.discountAmount < 0) {
    showToast("Vui lòng kiểm tra lại thông tin khuyến mãi.");
    return;
  }

  try {
    if (id) {
      await window.AutoWashAPI.promotions.update(Number(id), data);
    } else {
      await window.AutoWashAPI.promotions.create(data);
    }
    closeModal("promotionModal");
    showToast("Lưu khuyến mãi thành công!");
    await renderAdminPromotions();
  } catch (err) {
    console.error(err);
    showToast("Lỗi: Không thể lưu khuyến mãi.");
  }
}
function editPromotion(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  document.getElementById("promoId").value = id;
  document.getElementById("promoName").value = row.cells[0].innerText;
  document.getElementById("promoDescription").value = row.cells[1].innerText;

  const rawDiscount = row.cells[2].getAttribute("data-discount");
  document.getElementById("promoDiscountValue").value = parseFloat(rawDiscount);

  document
    .getElementById("promoDiscountValue")
    .dispatchEvent(new Event("input"));

  document.getElementById("promoStart").value = row.cells[3].innerText;
  document.getElementById("promoEnd").value = row.cells[4].innerText;

  // ĐỒNG BỘ: Tự động tìm và chọn option Hạng tương ứng
  const tierId = row.getAttribute("data-tier-id");
  const promoTierSelect = document.getElementById("promoTier");
  if (promoTierSelect) {
    promoTierSelect.value = tierId || "";
  }

  openModal("promotionModal");
}

async function deletePromotion(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) return;

  try {
    await fetch(`http://localhost:8080/api/promotions/${id}`, {
      method: "DELETE",
    });
    showToast("Đã xóa khuyến mãi.");
    renderAdminPromotions(); // Tải lại bảng sau khi xóa
  } catch (err) {
    showToast("Lỗi khi xóa khuyến mãi.");
  }
}

function openAddPromotion() {
  document.getElementById("promotionForm").reset();
  document.getElementById("promoId").value = "";
  openModal("promotionModal");
}

async function saveReward(e) {
  e.preventDefault();
  if (!requireAuth(["admin"])) return;

  const rewardId = document.getElementById("rewardId").value;

  // Lấy dữ liệu mới bao gồm loại giảm giá
  const payload = {
    rewardName: document.getElementById("rewardName").value.trim(),
    description: document.getElementById("rewardDescription").value.trim(),
    pointsRequired: parseInt(document.getElementById("rewardPoints").value),
    discountAmount: parseFloat(document.getElementById("rewardDiscount").value),
    discountType: document.getElementById("rewardDiscountType").value, // Thêm trường này
    stockQuantity: parseInt(document.getElementById("rewardStock").value),
    isActive: document.getElementById("rewardActive").value === "true", // Đã khớp với 'Active'/'Inactive'
  };

  // Cho phép discountAmount bằng 0, chỉ chặn khi < 0
  if (
    !payload.rewardName ||
    payload.pointsRequired < 1 ||
    payload.discountAmount < 0
  ) {
    showToast(
      "Vui lòng nhập tên quà, điểm đổi hợp lệ và giá trị không được là số âm.",
    );
    return;
  }

  try {
    if (rewardId) {
      await window.AutoWashAPI.rewards.update(Number(rewardId), payload);
    } else {
      await window.AutoWashAPI.rewards.create(payload);
    }
    closeModal("rewardModal");
    showToast(rewardId ? "Cập nhật thành công!" : "Thêm quà tặng thành công!");
    await renderAdminRewards();
  } catch (error) {
    showToast(error.message || "Lưu quà tặng thất bại.");
  }
}

async function editReward(id) {
  if (!requireAuth(["admin"])) return;

  let reward;
  try {
    const rewards = await fetchAdminRewards();
    reward = rewards.find((r) => Number(r.rewardId) === Number(id));
  } catch (error) {
    showToast(error.message || "Không tải được thông tin quà tặng.");
    return;
  }

  if (!reward) return;

  document.getElementById("rewardModalTitle").textContent = "Sửa quà tặng";
  document.getElementById("rewardId").value = reward.rewardId;
  document.getElementById("rewardName").value = reward.rewardName;
  document.getElementById("rewardDescription").value = reward.description || "";
  document.getElementById("rewardPoints").value = reward.pointsRequired;
  document.getElementById("rewardDiscount").value = reward.discountAmount;
  document.getElementById("rewardStock").value = reward.stockQuantity;
  document.getElementById("rewardActive").value = reward.isActive
    ? "true"
    : "false";
  openModal("rewardModal");
  document.getElementById("rewardDiscountType").value =
    reward.discountType || "fixed";
}

async function deleteReward(id) {
  if (!requireAuth(["admin"])) return;
  if (!confirm("Bạn có chắc muốn vô hiệu hóa quà tặng này?")) return;

  if (!window.AutoWashAPI) {
    showToast("API chưa sẵn sàng.");
    return;
  }

  try {
    await window.AutoWashAPI.rewards.delete(Number(id));
    showToast("Đã vô hiệu hóa quà tặng.");
    await renderAdminRewards();
  } catch (error) {
    showToast(error.message || "Xóa quà tặng thất bại.");
  }
}

function openAddReward() {
  document.getElementById("rewardForm").reset();
  document.getElementById("rewardId").value = "";
  document.getElementById("rewardModalTitle").textContent = "Thêm quà tặng";
  document.getElementById("rewardActive").value = "true";
  openModal("rewardModal");
}

// BỌC TẤT CẢ VÀO DOMContentLoaded ĐỂ ĐẢM BẢO HTML ĐÃ TẢI XONG
document.addEventListener("DOMContentLoaded", () => {
  // 1. Logic tự động chọn Loại giảm giá cho trang KHUYẾN MÃI
  const promoDiscount = document.getElementById("promoDiscountValue");
  if (promoDiscount) {
    promoDiscount.addEventListener("input", function () {
      const value = parseFloat(this.value);
      const typeSelect = document.getElementById("promoDiscountType");
      if (!isNaN(value) && typeSelect) {
        typeSelect.value = value <= 100 ? "percent" : "fixed";
      }
    });
  }

  // 2. Logic ngày tháng cho trang KHUYẾN MÃI
  const promoStart = document.getElementById("promoStart");
  if (promoStart) {
    promoStart.addEventListener("change", function () {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      if (this.value && this.value < todayStr) {
        showToast(
          "Không thể chọn ngày trong quá khứ. Hệ thống tự động đặt thành hôm nay.",
        );
        this.value = todayStr;
        const endDateInput = document.getElementById("promoEnd");
        if (
          endDateInput &&
          endDateInput.value &&
          endDateInput.value < todayStr
        ) {
          endDateInput.value = todayStr;
        }
      }
    });
  }

  // 3. Logic tự động chọn Loại giảm giá cho trang QUÀ TẶNG
  const rewardDiscountInput = document.getElementById("rewardDiscount");
  if (rewardDiscountInput) {
    rewardDiscountInput.addEventListener("input", function () {
      const value = parseFloat(this.value);
      const typeSelect = document.getElementById("rewardDiscountType");
      if (!isNaN(value) && typeSelect) {
        typeSelect.value = value <= 100 ? "percent" : "fixed";
      }
    });
  }
});

async function loadHeaderUserInfoFromAPI() {
  console.log("Đang tải header...");
  try {
    const userStr = localStorage.getItem("autowash_user");
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // Tìm các element trên Header
    const nameEl =
      document.getElementById("navUserName") ||
      document.querySelector(".navbar .user-name");
    const tierEl =
      document.getElementById("navUserTier") ||
      document.querySelector(".navbar .user-tier");
    const avatarEl =
      document.getElementById("navUserAvatar") ||
      document.querySelector(".navbar .user-avatar");

    //1. Kiểm tra nếu là ADMIN hoặc STAFF (Không gọi API khách hàng)
    if (user.role === "admin" || user.isAdmin || user.role === "staff") {
      if (nameEl)
        nameEl.textContent =
          user.name ||
          user.fullName ||
          (user.role === "admin" ? "Quản trị viên" : "Nhân viên");
      if (tierEl) tierEl.style.display = "none"; // Ẩn hiển thị Hạng đối với Admin & Staff
      if (avatarEl) {
        const displayName = user.name || user.fullName || "NV";
        avatarEl.textContent = getUserInitials(displayName);
      }
      return;
    }

    // 2. NẾU LÀ CUSTOMER, GỌI API LẤY PROFILE NHƯ CŨ
    const customerId = user.customerId || user.id;
    if (!customerId) return;

    const response = await fetch(
      `http://localhost:8080/api/customers/profile?customerId=${customerId}`,
    );
    if (!response.ok) return;
    const profile = await response.json();

    if (nameEl) nameEl.textContent = profile.fullName;

    if (tierEl) {
      tierEl.style.display = "block"; // Hiển thị lại tier lỡ như bị ẩn
      const tierName =
        profile.loyaltyTier && typeof profile.loyaltyTier === "object"
          ? profile.loyaltyTier.tierName
          : profile.loyaltyTier || "MEMBER";
      tierEl.textContent = tierName;
    }

    if (avatarEl && profile.fullName) {
      avatarEl.textContent = getUserInitials(profile.fullName);
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin Header từ API:", error);
    const nameEl =
      document.getElementById("navUserName") ||
      document.querySelector(".navbar .user-name");
    if (nameEl) nameEl.textContent = "Người dùng";
  }
}

// Hàm gọi API lấy danh sách Hạng thành viên đang hoạt động và đổ vào dropdown select
async function loadTiersToPromoSelect() {
  const promoTierSelect = document.getElementById("promoTier");
  if (!promoTierSelect) return;

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch("http://localhost:8080/api/loyalty-tiers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Không thể tải danh sách hạng.");

    const tiers = await response.json();

    const activeTiers = tiers
      .filter((t) => t.isActive)
      .sort((a, b) => a.priorityLevel - b.priorityLevel);

    // BỎ "Tất cả", chỉ map danh sách hạng hoạt động
    promoTierSelect.innerHTML = activeTiers
      .map((t) => `<option value="${t.tierId || t.id}">${t.tierName}</option>`)
      .join("");
  } catch (error) {
    console.error("Lỗi tải hạng thành viên:", error);
    showToast("Không thể đồng bộ danh sách Hạng thành viên.");
  }
}

// ====== 2. CÁC API THAO TÁC CẬP NHẬT TRẠNG THÁI BOOKING ======

// 2.1. Xác nhận xe đến cửa hàng (Pending -> Confirmed)
async function confirmArrival(bookingId) {
  if (
    !confirm(
      `Xác nhận khách hàng sử dụng xe này đã đến tiệm (Mã lịch: #${bookingId})?`,
    )
  )
    return;

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch(
      `http://localhost:8080/api/v1/bookings/${bookingId}/confirm-arrival`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Xác nhận đến tiệm thất bại.");
    }

    showToast("Đã chuyển trạng thái sang CONFIRMED!");
    await renderAdminBookings(); // Load lại bảng không cần reload trang!
  } catch (error) {
    showToast("Lỗi: " + error.message);
  }
}

// 2.2. Hoàn thành dịch vụ rửa xe và tích điểm (Confirmed -> Completed)
async function completeBooking(bookingId) {
  if (
    !confirm(
      `Xác nhận xe #${bookingId} đã hoàn tất dịch vụ & thu tiền thành công?`,
    )
  )
    return;

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch(
      `http://localhost:8080/api/v1/bookings/${bookingId}/complete`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.message || "Không thể hoàn tất thanh toán lịch trình.",
      );
    }

    showToast("Đã hoàn tất thanh toán & ghi nhận lịch sử!");
    await renderAdminBookings();
  } catch (error) {
    showToast("Lỗi: " + error.message);
  }
}

// 2.3. Hủy lịch đặt xe (Cancel)
async function cancelBooking(bookingId) {
  if (!confirm(`Bạn có chắc chắn muốn HỦY lịch đặt #${bookingId} này không?`))
    return;

  try {
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    const response = await fetch(
      `http://localhost:8080/api/v1/bookings/${bookingId}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Hủy đặt lịch thất bại.");
    }

    showToast("Đã hủy lịch đặt thành công.");
    await renderAdminBookings();
  } catch (error) {
    showToast("Lỗi: " + error.message);
  }
}

// Đăng ký toàn cục để các sự kiện onclick="" trong HTML có thể gọi được
window.confirmArrival = confirmArrival;
window.completeBooking = completeBooking;
window.cancelBooking = cancelBooking;
window.renderStaffSchedule = renderStaffSchedule;

function adjustSidebarForRole() {
  const userStr = localStorage.getItem("autowash_user");
  if (!userStr) return;
  const user = JSON.parse(userStr);

  if (user.role === "staff") {
    // 1. Cập nhật vai trò hiển thị
    const sidebarRole = document.querySelector(".sidebar-role");
    if (sidebarRole) sidebarRole.textContent = "Nhân viên";

    // 2. Cấu hình lại menu Sidebar cho Staff (CHỈ hiển thị 2 trang dưới đây)
    const sidebarNav = document.querySelector(".sidebar-nav ul");
    if (sidebarNav) {
      const currentPage = document.body.dataset.page;
      sidebarNav.innerHTML = `
        <li>
          <a href="staff-schedule.html" class="${currentPage === "staff-schedule" ? "active" : ""}">
            <span class="nav-icon">📅</span>Lịch Trình Hôm Nay
          </a>
        </li>
        <li>
          <a href="walkin-booking.html" class="${currentPage === "walkin-booking" ? "active" : ""}">
            <span class="nav-icon">📝</span>Đặt Lịch Trực Tiếp
          </a>
        </li>
      `;
    }
  }
}
