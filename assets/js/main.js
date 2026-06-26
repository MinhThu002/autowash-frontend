/* AutoWash Pro - Main */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initSidebar();
  initLandingMenu();
  setActiveNavLink();
  initAuthForms();
  showRegisteredNotice();
});

function initSidebar() {
  const toggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

function initLandingMenu() {
  const toggle = document.querySelector('.menu-toggle-landing');
  const menu = document.querySelector('.landing-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
  }
}

function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });
}

function showToast(message, duration = 3000) {
  let toastEl = document.querySelector('.toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

function mapBackendRole(roleName) {
  const normalized = String(roleName || '').replace(/^ROLE_/, '').toUpperCase();
  if (normalized === 'MANAGER') return 'admin';
  if (normalized === 'STAFF') return 'staff';
  return 'customer';
}

function persistAuthSession(auth, remember) {
  const role = mapBackendRole(auth.roleName);
  const user = {
    email: auth.loginKey,
    role,
    id: auth.id,
    customerId: role === 'customer' ? auth.id : null,
    name: auth.fullName,
    token: auth.token || null,
    backendAuth: auth
  };

  localStorage.setItem('autowash_user', JSON.stringify(user));
  if (auth.token) {
    localStorage.setItem('autowash_token', auth.token);
  } else {
    localStorage.removeItem('autowash_token');
  }

  if (remember) localStorage.setItem('autowash_remember', 'true');
  else localStorage.removeItem('autowash_remember');

  return user;
}

function getAuthRedirect(role) {
  const redirects = {
    customer: 'customer-dashboard.html',
    admin: 'admin-dashboard.html',
    staff: 'staff-schedule.html'
  };
  return redirects[role] || 'customer-dashboard.html';
}

function initAuthForms() {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  document.getElementById('forgotPasswordForm')?.addEventListener('submit', handleForgotPassword);
  document.getElementById('resetPasswordForm')?.addEventListener('submit', handleResetPassword);
  initGoogleSignIn();
}

function initGoogleSignIn() {
  const wrap = document.getElementById('googleSignInWrap');
  const onload = document.getElementById('g_id_onload');
  const clientId = window.AutoWashConfig?.googleClientId;

  if (!wrap || !onload) return;

  if (!clientId) {
    wrap.style.display = 'none';
    const divider = wrap.previousElementSibling;
    if (divider?.classList.contains('auth-divider')) divider.style.display = 'none';
    return;
  }

  onload.setAttribute('data-client_id', clientId);
  onload.setAttribute('data-callback', 'handleGoogleCredentialResponse');
  onload.setAttribute('data-auto_prompt', 'false');
  window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
}

async function handleGoogleCredentialResponse(response) {
  const form = document.getElementById('loginForm');
  if (form) clearFormMessage(form);

  if (!response?.credential) {
    showToast('Google không trả về token hợp lệ.');
    return;
  }

  if (!window.AutoWashAPI) {
    showToast('API chưa sẵn sàng.');
    return;
  }

  try {
    const auth = await window.AutoWashAPI.auth.loginWithGoogle(response.credential);
    const remember = document.getElementById('rememberMe')?.checked;
    const user = persistAuthSession(auth, remember);
    window.location.href = getAuthRedirect(user.role);
  } catch (error) {
    const message = error.message || 'Đăng nhập Google thất bại.';
    if (form) showFormError(form, message);
    else showToast(message);
  }
}

function showRegisteredNotice() {
  if (new URLSearchParams(window.location.search).get('registered') !== '1') return;
  const form = document.getElementById('loginForm');
  if (!form) return;
  showFormSuccess(form, 'Đăng ký thành công! Vui lòng đăng nhập.');
}

async function handleLogin(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const loginKey = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const remember = document.getElementById('rememberMe')?.checked;

  if (!loginKey || !password) {
    showFormError(e.target, 'Vui lòng nhập email/tên đăng nhập và mật khẩu.');
    return;
  }

  let user;

  if (window.AutoWashAPI) {
    try {
      const auth = await window.AutoWashAPI.auth.login(loginKey, password);
      user = persistAuthSession(auth, remember);
    } catch (error) {
      showFormError(e.target, error.message || 'Đăng nhập thất bại.');
      return;
    }
  } else {
    const role = detectLoginRole(loginKey);
    user = persistAuthSession({
      id: role === 'customer' ? 1 : role === 'staff' ? 2 : 1,
      loginKey,
      fullName: role === 'admin' ? 'Admin' : role === 'staff' ? 'Nhân viên' : 'Khách hàng',
      roleName: role === 'admin' ? 'ROLE_MANAGER' : role === 'staff' ? 'ROLE_STAFF' : 'ROLE_CUSTOMER'
    }, remember);
  }

  window.location.href = getAuthRedirect(user.role);
}

function detectLoginRole(email) {
  const lower = email.toLowerCase();
  if (lower.includes('admin') || lower === 'admin') return 'admin';
  if (lower.includes('staff') || lower.startsWith('staff')) return 'staff';
  return 'customer';
}

async function handleRegister(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const name = document.getElementById('regName')?.value.trim();
  const phone = document.getElementById('regPhone')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const confirm = document.getElementById('regConfirm')?.value;

  if (!name || !phone || !email || !password) {
    showFormError(e.target, 'Vui lòng điền đầy đủ thông tin.');
    return;
  }
  if (password.length < 6) {
    showFormError(e.target, 'Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }
  if (password !== confirm) {
    showFormError(e.target, 'Mật khẩu xác nhận không khớp.');
    return;
  }

  if (window.AutoWashAPI) {
    try {
      await window.AutoWashAPI.auth.register({
        fullName: name,
        phoneNumber: phone,
        email,
        password
      });
    } catch (error) {
      showFormError(e.target, error.message || 'Đăng ký thất bại.');
      return;
    }
  }

  window.location.href = 'login.html?registered=1';
}

async function handleForgotPassword(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const email = document.getElementById('forgotEmail')?.value.trim();
  if (!email) {
    showFormError(e.target, 'Vui lòng nhập email.');
    return;
  }

  if (!window.AutoWashAPI) {
    showFormError(e.target, 'API chưa sẵn sàng.');
    return;
  }

  try {
    const message = await window.AutoWashAPI.auth.forgotPassword(email);
    showFormSuccess(e.target, typeof message === 'string' ? message : 'OTP đã được gửi qua email.');
    setTimeout(() => {
      window.location.href = `reset-password.html?email=${encodeURIComponent(email)}`;
    }, 1500);
  } catch (error) {
    showFormError(e.target, error.message || 'Gửi OTP thất bại.');
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  clearFormMessage(e.target);

  const email = document.getElementById('resetEmail')?.value.trim();
  const otp = document.getElementById('resetOtp')?.value.trim();
  const newPassword = document.getElementById('resetPassword')?.value;
  const confirm = document.getElementById('resetConfirm')?.value;

  if (!email || !otp || !newPassword) {
    showFormError(e.target, 'Vui lòng điền đầy đủ thông tin.');
    return;
  }
  if (newPassword.length < 6) {
    showFormError(e.target, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    return;
  }
  if (newPassword !== confirm) {
    showFormError(e.target, 'Mật khẩu xác nhận không khớp.');
    return;
  }

  if (!window.AutoWashAPI) {
    showFormError(e.target, 'API chưa sẵn sàng.');
    return;
  }

  try {
    const message = await window.AutoWashAPI.auth.resetPassword({ email, otp, newPassword });
    showFormSuccess(e.target, typeof message === 'string' ? message : 'Đặt lại mật khẩu thành công!');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  } catch (error) {
    showFormError(e.target, error.message || 'Đặt lại mật khẩu thất bại.');
  }
}

function clearFormMessage(form) {
  form.querySelector('.form-error-global')?.remove();
  form.querySelector('.form-success-global')?.remove();
}

function showFormError(form, msg) {
  clearFormMessage(form);
  const errEl = document.createElement('div');
  errEl.className = 'alert alert-error form-error-global';
  errEl.textContent = msg;
  form.insertBefore(errEl, form.firstChild);
}

function showFormSuccess(form, msg) {
  clearFormMessage(form);
  const okEl = document.createElement('div');
  okEl.className = 'alert alert-success form-success-global';
  okEl.textContent = msg;
  form.insertBefore(okEl, form.firstChild);
}

function logout() {
  localStorage.removeItem('autowash_user');
  localStorage.removeItem('autowash_token');
  window.location.href = 'login.html';
}

function requireAuth(roles) {
  const stored = localStorage.getItem('autowash_user');
  if (!stored) {
    window.location.href = 'login.html';
    return null;
  }
  try {
    const user = JSON.parse(stored);
    if (roles && !roles.includes(user.role)) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  } catch (e) {
    window.location.href = 'login.html';
    return null;
  }
}

function getUserInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
}

function filterTable(tableId, filters) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(row => {
    let show = true;
    if (filters.status && filters.status !== 'all' && row.getAttribute('data-status') !== filters.status) show = false;
    if (filters.tier && filters.tier !== 'all' && row.getAttribute('data-tier') !== filters.tier) show = false;
    if (filters.dateFrom) {
      const date = row.getAttribute('data-date');
      if (date && date < filters.dateFrom) show = false;
    }
    if (filters.dateTo) {
      const date = row.getAttribute('data-date');
      if (date && date > filters.dateTo) show = false;
    }
    if (filters.search) {
      const haystack = (row.getAttribute('data-search') || row.textContent).toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) show = false;
    }
    row.style.display = show ? '' : 'none';
  });
}

function setupTableFilters(config) {
  const apply = () => filterTable(config.tableId, {
    status: document.getElementById(config.statusId)?.value,
    tier: document.getElementById(config.tierId)?.value,
    dateFrom: document.getElementById(config.dateFromId)?.value,
    dateTo: document.getElementById(config.dateToId)?.value,
    search: document.getElementById(config.searchId)?.value
  });
  [config.statusId, config.tierId, config.dateFromId, config.dateToId, config.searchId].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', apply);
  });
}

