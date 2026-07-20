/* AutoWash Pro - Main */
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  initSidebar();
  initLandingMenu();
  setActiveNavLink();
  initAuthForms();
  showRegisteredNotice();
  initHeaderAuth();
  initBookingLinks();
  loadLandingData();
});

function initSidebar() {
  const toggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay?.classList.toggle("active");
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
}

function initLandingMenu() {
  const toggle = document.querySelector(".menu-toggle-landing");
  const menu = document.querySelector(".landing-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("open"));
  }
}

function setActiveNavLink() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    if (link.getAttribute("href") === path) link.classList.add("active");
  });
}

function showToast(message, duration = 3000) {
  let toastEl = document.querySelector(".toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), duration);
}

function mapBackendRole(roleName) {
  const normalized = String(roleName || "")
    .replace(/^ROLE_/, "")
    .toUpperCase();
  if (normalized === "MANAGER") return "admin";
  if (normalized === "STAFF") return "staff";
  return "customer";
}

function persistAuthSession(auth, remember) {
  const role = mapBackendRole(auth.roleName);
  const user = {
    email: auth.loginKey,
    role,
    id: auth.id,
    customerId: role === "customer" ? auth.id : null,
    name: auth.fullName,
    token: auth.token || null,
    backendAuth: auth,
  };

  localStorage.setItem("autowash_user", JSON.stringify(user));
  if (auth.token) {
    localStorage.setItem("autowash_token", auth.token);
  } else {
    localStorage.removeItem("autowash_token");
  }

  if (remember) localStorage.setItem("autowash_remember", "true");
  else localStorage.removeItem("autowash_remember");

  return user;
}

function getAuthRedirect(role) {
  const redirects = {
    customer: "customer-dashboard.html",
    admin: "admin-dashboard.html",
    staff: "staff-schedule.html",
  };
  return redirects[role] || "customer-dashboard.html";
}

function initAuthForms() {
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document
    .getElementById("registerForm")
    ?.addEventListener("submit", handleRegister);
  document
    .getElementById("forgotPasswordForm")
    ?.addEventListener("submit", handleForgotPassword);
  document
    .getElementById("resetPasswordForm")
    ?.addEventListener("submit", handleResetPassword);
}

function showRegisteredNotice() {
  if (new URLSearchParams(window.location.search).get("registered") !== "1")
    return;
  const form = document.getElementById("loginForm");
  if (!form) return;
  showFormSuccess(form, "Đăng ký thành công! Vui lòng đăng nhập.");
}

async function handleLogin(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const loginKey = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  const remember = document.getElementById("rememberMe")?.checked;

  if (!loginKey || !password) {
    showFormError(e.target, "Vui lòng nhập email/tên đăng nhập và mật khẩu.");
    return;
  }

  let user;

  if (window.AutoWashAPI) {
    try {
      const auth = await window.AutoWashAPI.auth.login(loginKey, password);
      user = persistAuthSession(auth, remember);
    } catch (error) {
      showFormError(e.target, error.message || "Đăng nhập thất bại.");
      return;
    }
  } else {
    const role = detectLoginRole(loginKey);
    user = persistAuthSession(
      {
        id: role === "customer" ? 1 : role === "staff" ? 2 : 1,
        loginKey,
        fullName:
          role === "admin"
            ? "Admin"
            : role === "staff"
              ? "Nhân viên"
              : "Khách hàng",
        roleName:
          role === "admin"
            ? "ROLE_MANAGER"
            : role === "staff"
              ? "ROLE_STAFF"
              : "ROLE_CUSTOMER",
      },
      remember,
    );
  }

  window.location.href = getAuthRedirect(user.role);
}

function detectLoginRole(email) {
  const lower = email.toLowerCase();
  if (lower.includes("admin") || lower === "admin") return "admin";
  if (lower.includes("staff") || lower.startsWith("staff")) return "staff";
  return "customer";
}

async function handleRegister(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const name = document.getElementById("regName")?.value.trim();
  const phone = document.getElementById("regPhone")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value;
  const confirm = document.getElementById("regConfirm")?.value;

  if (!name || !phone || !email || !password) {
    showFormError(e.target, "Vui lòng điền đầy đủ thông tin.");
    return;
  }
  if (password.length < 6) {
    showFormError(e.target, "Mật khẩu phải có ít nhất 6 ký tự.");
    return;
  }
  if (password !== confirm) {
    showFormError(e.target, "Mật khẩu xác nhận không khớp.");
    return;
  }

  if (window.AutoWashAPI) {
    try {
      await window.AutoWashAPI.auth.register({
        fullName: name,
        phoneNumber: phone,
        email,
        password,
      });
    } catch (error) {
      showFormError(e.target, error.message || "Đăng ký thất bại.");
      return;
    }
  }

  window.location.href = "login.html?registered=1";
}

async function handleForgotPassword(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const email = document.getElementById("forgotEmail")?.value.trim();
  if (!email) {
    showFormError(e.target, "Vui lòng nhập email.");
    return;
  }

  if (!window.AutoWashAPI) {
    showFormError(e.target, "API chưa sẵn sàng.");
    return;
  }

  try {
    const message = await window.AutoWashAPI.auth.forgotPassword(email);
    showFormSuccess(
      e.target,
      typeof message === "string" ? message : "OTP đã được gửi qua email.",
    );
    setTimeout(() => {
      window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
    }, 1500);
  } catch (error) {
    showFormError(e.target, error.message || "Gửi OTP thất bại.");
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const email = document.getElementById("resetEmail")?.value.trim();
  const otp = document.getElementById("resetOtp")?.value.trim();
  const newPassword = document.getElementById("resetPassword")?.value;
  const confirm = document.getElementById("resetConfirm")?.value;

  if (!email || !otp || !newPassword) {
    showFormError(e.target, "Vui lòng điền đầy đủ thông tin.");
    return;
  }
  if (newPassword.length < 6) {
    showFormError(e.target, "Mật khẩu mới phải có ít nhất 6 ký tự.");
    return;
  }
  if (newPassword !== confirm) {
    showFormError(e.target, "Mật khẩu xác nhận không khớp.");
    return;
  }

  if (!window.AutoWashAPI) {
    showFormError(e.target, "API chưa sẵn sàng.");
    return;
  }

  try {
    const message = await window.AutoWashAPI.auth.resetPassword({
      email,
      otp,
      newPassword,
    });
    showFormSuccess(
      e.target,
      typeof message === "string" ? message : "Đặt lại mật khẩu thành công!",
    );
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    showFormError(e.target, error.message || "Đặt lại mật khẩu thất bại.");
  }
}

function clearFormMessage(form) {
  form.querySelector(".form-error-global")?.remove();
  form.querySelector(".form-success-global")?.remove();
}

function showFormError(form, msg) {
  clearFormMessage(form);
  const errEl = document.createElement("div");
  errEl.className = "alert alert-error form-error-global";
  errEl.textContent = msg;
  form.insertBefore(errEl, form.firstChild);
}

function showFormSuccess(form, msg) {
  clearFormMessage(form);
  const okEl = document.createElement("div");
  okEl.className = "alert alert-success form-success-global";
  okEl.textContent = msg;
  form.insertBefore(okEl, form.firstChild);
}

function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("autowash_user");
    localStorage.removeItem("autowash_token");
    showToast("Đăng xuất thành công!");
    window.location.href = "index.html"; // Chuyển hướng về trang chủ công khai
  }
}

window.handleLogout = handleLogout;

function requireAuth(roles) {
  const stored = localStorage.getItem("autowash_user");
  if (!stored) {
    window.location.href = "login.html";
    return null;
  }
  try {
    const user = JSON.parse(stored);
    if (roles && !roles.includes(user.role)) {
      window.location.href = "login.html";
      return null;
    }
    return user;
  } catch (e) {
    window.location.href = "login.html";
    return null;
  }
}

function getUserInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function filterTable(tableId, filters) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.querySelectorAll("tr").forEach((row) => {
    let show = true;
    if (
      filters.status &&
      filters.status !== "all" &&
      row.getAttribute("data-status") !== filters.status
    )
      show = false;
    if (
      filters.tier &&
      filters.tier !== "all" &&
      row.getAttribute("data-tier") !== filters.tier
    )
      show = false;
    if (filters.dateFrom) {
      const date = row.getAttribute("data-date");
      if (date && date < filters.dateFrom) show = false;
    }
    if (filters.dateTo) {
      const date = row.getAttribute("data-date");
      if (date && date > filters.dateTo) show = false;
    }
    if (filters.search) {
      const haystack = (
        row.getAttribute("data-search") || row.textContent
      ).toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) show = false;
    }
    row.style.display = show ? "" : "none";
  });
}

function setupTableFilters(config) {
  const apply = () =>
    filterTable(config.tableId, {
      status: document.getElementById(config.statusId)?.value,
      tier: document.getElementById(config.tierId)?.value,
      dateFrom: document.getElementById(config.dateFromId)?.value,
      dateTo: document.getElementById(config.dateToId)?.value,
      search: document.getElementById(config.searchId)?.value,
    });
  [
    config.statusId,
    config.tierId,
    config.dateFromId,
    config.dateToId,
    config.searchId,
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", apply);
  });
}

function initHeaderAuth() {
  const userStr = localStorage.getItem("autowash_user");
  const guestElements = document.querySelectorAll(".auth-guest");
  const userElements = document.querySelectorAll(".auth-user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      // 1. Ẩn các nút của Khách, hiển thị khối thông tin Thành viên
      guestElements.forEach((el) => (el.style.display = "none"));
      userElements.forEach((el) => {
        el.style.display = "flex"; // Khớp với inline style định sẵn của bạn
      });

      // 2. Cập nhật dữ liệu tên và avatar viết tắt
      const nameEl = document.getElementById("navUserName");
      const avatarEl = document.getElementById("navUserAvatar");
      const tierEl = document.getElementById("navUserTier");

      if (nameEl) nameEl.textContent = user.name || "Thành viên";
      if (avatarEl) avatarEl.textContent = getUserInitials(user.name);

      if (tierEl) {
        // Hiển thị vai trò (CUSTOMER, STAFF, ADMIN) làm hạng mặc định nếu chưa có dữ liệu cấu hình hạng riêng
        tierEl.textContent = user.role ? user.role.toUpperCase() : "MEMBER";
      }
    } catch (e) {
      console.error("Lỗi khi đọc dữ liệu session người dùng:", e);
    }
  } else {
    // Nếu chưa đăng nhập, hiển thị Guest và ẩn User đi
    guestElements.forEach((el) => (el.style.display = ""));
    userElements.forEach((el) => (el.style.display = "none"));
  }
}

function initBookingLinks() {
  const userStr = localStorage.getItem("autowash_user");
  let targetUrl = "login.html"; // Mặc định nếu chưa đăng nhập

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Nếu là nhân viên hoặc quản lý (admin)
      if (user.role === "staff" || user.role === "admin") {
        targetUrl = "walkin-booking.html";
      } else {
        // Nếu là khách hàng (customer)
        targetUrl = "booking.html";
      }
    } catch (e) {
      console.error("Lỗi khi phân tích thông tin user đặt lịch:", e);
      targetUrl = "login.html";
    }
  }

  // Quét và cập nhật tất cả các nút có thuộc tính href="booking.html" trên trang
  const bookingButtons = document.querySelectorAll('a[href="booking.html"]');
  bookingButtons.forEach((btn) => {
    btn.setAttribute("href", targetUrl);
  });
}

async function loadLandingData() {
  const servicesGrid = document.getElementById("landingServicesGrid");
  const tiersGrid = document.getElementById("landingTiersGrid");

  if (!servicesGrid && !tiersGrid) return;

  // 1. Xác định URL đặt lịch dựa trên Role của user đang đăng nhập
  let baseBookingUrl = "login.html"; // Mặc định chưa đăng nhập

  try {
    // Lấy data user từ localStorage (thay 'currentUser' bằng key thực tế dự án của bạn đang dùng)
    const userStr =
      localStorage.getItem("currentUser") || localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // Đảm bảo viết hoa để so sánh chính xác, xử lý cả trường hợp dùng prefix "ROLE_"
      const role = user.role ? user.role.toUpperCase() : "";

      if (role === "CUSTOMER" || role === "ROLE_CUSTOMER") {
        baseBookingUrl = "booking.html";
      } else if (
        role === "STAFF" ||
        role === "ROLE_STAFF" ||
        role === "MANAGER" ||
        role === "ROLE_MANAGER"
      ) {
        baseBookingUrl = "walkin-booking.html";
      }
    }
  } catch (e) {
    console.error("Lỗi parse thông tin user:", e);
  }

  try {
    // 2. Tải danh sách Gói dịch vụ
    if (servicesGrid) {
      const svcRes = await fetch(
        "http://localhost:8080/api/admin/wash-services/active",
      );
      if (svcRes.ok) {
        const services = await svcRes.json();
        const activeServices = services.filter((s) => s.isActive);

        if (activeServices.length > 0) {
          servicesGrid.innerHTML = activeServices
            .map(
              (s) => `
            <div class="service-package">
              <h4>✨ ${s.serviceName}</h4>
              <div class="price">${formatCurrency(s.price)}</div>
              <ul>
                <li>${s.durationMinutes} phút</li>
                <li>${s.description || "Chăm sóc xe chuyên nghiệp"}</li>
              </ul>
            </div>
          `,
            )
            .join("");
        } else {
          servicesGrid.innerHTML =
            '<p class="text-center" style="grid-column: 1/-1;">Hiện chưa có gói dịch vụ nào.</p>';
        }
      }
    }

    // 3. Tải danh sách Hạng thành viên (Giữ nguyên như cũ)
    if (tiersGrid) {
      const tierRes = await fetch(
        "http://localhost:8080/api/loyalty-tiers/active",
      );
      if (tierRes.ok) {
        const tiers = await tierRes.json();
        const sortedTiers = tiers.sort(
          (a, b) => a.priorityLevel - b.priorityLevel,
        );

        if (sortedTiers.length > 0) {
          tiersGrid.innerHTML = sortedTiers
            .map((t) => {
              const featuredClass = t.priorityLevel >= 2 ? "featured" : "";
              return `
              <div class="tier-card ${featuredClass}">
                <div class="tier-name">${t.tierName}</div>
                <p class="text-muted">${t.minVisits} lượt • ${formatCurrency(t.minSpending)}</p>
                <ul class="tier-benefits">
                  <li>Giảm ${t.discountPercent}% dịch vụ</li>
                  <li>Nhân ${t.pointMultiplier} lần điểm thưởng</li>
                  <li>Đặt lịch trước ${t.bookingWindowDays} ngày</li>
                </ul>
              </div>
            `;
            })
            .join("");
        } else {
          tiersGrid.innerHTML =
            '<p class="text-center" style="grid-column: 1/-1;">Chưa có thông tin hạng thành viên.</p>';
        }
      }
    }
  } catch (error) {
    console.error("Lỗi tải dữ liệu trang chủ:", error);
    if (servicesGrid)
      servicesGrid.innerHTML =
        '<p class="text-center text-danger" style="grid-column: 1/-1;">Không thể tải danh sách dịch vụ.</p>';
    if (tiersGrid)
      tiersGrid.innerHTML =
        '<p class="text-center text-danger" style="grid-column: 1/-1;">Không thể tải hạng thành viên.</p>';
  }
}

// Xử lý chuyển hướng trang dashboard khi click vào thông tin user trên Header
function handleProfileClick() {
  const userStr = localStorage.getItem("autowash_user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Sử dụng hàm có sẵn getAuthRedirect để lấy đúng link theo role
      // customer -> customer-dashboard.html
      // admin -> admin-dashboard.html
      // staff -> staff-schedule.html
      const targetUrl = getAuthRedirect(user.role);
      window.location.href = targetUrl;
    } catch (e) {
      console.error("Lỗi đọc dữ liệu user:", e);
      window.location.href = "login.html";
    }
  } else {
    // Nếu chưa đăng nhập thì đẩy về trang login
    window.location.href = "login.html";
  }
}

// Xuất hàm ra phạm vi window để file HTML có thể gọi được
window.handleProfileClick = handleProfileClick;
