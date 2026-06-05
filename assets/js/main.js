/* AutoWash Pro - Main */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initSidebar();
  initLandingMenu();
  setActiveNavLink();
  initAuthForms();
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

function initAuthForms() {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const remember = document.getElementById('rememberMe')?.checked;

  if (!email || !password) {
    showFormError(e.target, 'Vui lòng nhập email/số điện thoại và mật khẩu.');
    return;
  }

  let role = detectLoginRole(email);
  let user = {
    email,
    role,
    customerId: role === 'customer' ? 'cust-001' : null,
    name: role === 'admin' ? 'Admin' : role === 'staff' ? 'Nhân viên' : 'Nguyễn Văn An'
  };

  if (window.AutoWashAPI) {
    try {
      const auth = await window.AutoWashAPI.auth.login(email, password);
      role = auth.roleName === 'MANAGER' ? 'admin' : auth.roleName.toLowerCase();
      user = {
        email: auth.loginKey,
        role,
        customerId: role === 'customer' ? `cust-${String(auth.id).padStart(3, '0')}` : null,
        name: auth.fullName,
        backendAuth: auth
      };
    } catch (error) {
      showFormError(e.target, error.message || 'Đăng nhập thất bại.');
      return;
    }
  }

  localStorage.setItem('autowash_user', JSON.stringify(user));
  if (remember) localStorage.setItem('autowash_remember', 'true');

  const redirects = {
    customer: 'customer-dashboard.html',
    admin: 'admin-dashboard.html',
    staff: 'staff-schedule.html'
  };
  window.location.href = redirects[role] || 'customer-dashboard.html';
}

function detectLoginRole(email) {
  const lower = email.toLowerCase();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('staff')) return 'staff';
  return 'customer';
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName')?.value.trim();
  const phone = document.getElementById('regPhone')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const confirm = document.getElementById('regConfirm')?.value;

  if (!name || !phone || !email || !password) {
    alert('Vui lòng điền đầy đủ thông tin.');
    return;
  }
  if (password.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }
  if (password !== confirm) {
    alert('Mật khẩu xác nhận không khớp.');
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
      alert(error.message || 'Đăng ký thất bại.');
      return;
    }
  }

  localStorage.setItem('autowash_user', JSON.stringify({
    email, role: 'customer', customerId: 'cust-001', name
  }));
  alert('Đăng ký thành công! Chào mừng bạn đến AutoWash Pro.');
  window.location.href = 'customer-dashboard.html';
}

function showFormError(form, msg) {
  let errEl = form.querySelector('.form-error-global');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'alert alert-error form-error-global';
    form.insertBefore(errEl, form.firstChild);
  }
  errEl.textContent = msg;
}

function logout() {
  localStorage.removeItem('autowash_user');
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
    if (filters.search && !row.textContent.toLowerCase().includes(filters.search.toLowerCase())) show = false;
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
