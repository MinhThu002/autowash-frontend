/* AutoWash Pro - Backend-compatible Mock API
   Mock contract is based on the local Spring Boot backend in AutoWashProBE-main.
   It intercepts fetch('/api/...') and also exposes window.AutoWashAPI helpers. */
(function () {
  const API_PREFIX = '/api';
  const DELAY_MS = 180;
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;

  function getConfig() {
    return window.AutoWashConfig || { baseUrl: 'http://localhost:8080', useMock: false };
  }

  function getAuthToken() {
    return localStorage.getItem('autowash_token');
  }

  async function realFetch(path, options = {}) {
    const config = getConfig();
    const base = String(config.baseUrl || 'http://localhost:8080').replace(/\/$/, '');
    const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body != null && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let body = options.body;
    if (body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
      body = JSON.stringify(body);
    }

    return (originalFetch || fetch)(url, { ...options, headers, body });
  }

  const endpointDocs = {
    auth: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'POST /api/auth/google'
    ],
    customers: ['GET /api/customers/profile?customerId=1'],
    vehicles: [
      'GET /api/vehicles/customer?customerId=1',
      'POST /api/vehicles',
      'PUT /api/vehicles/{id}',
      'DELETE /api/vehicles/{id}'
    ],
    washServices: [
      'GET /api/admin/wash-services',
      'POST /api/admin/wash-services',
      'PUT /api/admin/wash-services/{id}',
      'DELETE /api/admin/wash-services/{id}'
    ],
    timeSlots: [
      'GET /api/admin/time-slots',
      'POST /api/admin/time-slots',
      'PUT /api/admin/time-slots/{id}',
      'DELETE /api/admin/time-slots/{id}'
    ],
    promotions: [
      'GET /api/promotions',
      'POST /api/promotions',
      'PUT /api/promotions/{id}',
      'DELETE /api/promotions/{id}'
    ],
    demoExtensions: [
      'GET /api/bookings',
      'POST /api/bookings',
      'PATCH /api/bookings/{id}/status',
      'GET /api/dashboard/analytics',
      'GET /api/staff/schedule',
      'PATCH /api/staff/schedule/{id}/status'
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function respond(body, status = 200) {
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8' }
    });
  }

  function fail(message, status = 400) {
    return respond(message, status);
  }

  function later(response) {
    return new Promise(resolve => setTimeout(() => resolve(response), DELAY_MS));
  }

  function readJson(init) {
    if (!init || init.body == null) return {};
    if (typeof init.body !== 'string') return init.body;
    try { return JSON.parse(init.body); } catch (error) { return {}; }
  }

  function numId(value) {
    if (value == null) return null;
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function legacyId(prefix, value) {
    const id = numId(value);
    return id == null ? value : `${prefix}-${String(id).padStart(3, '0')}`;
  }

  function nextNumber(items, fieldName, fallbackField) {
    const max = items.reduce((acc, item) => Math.max(acc, numId(item[fieldName] || item[fallbackField] || item.id) || 0), 0);
    return max + 1;
  }

  function load(key, fallback) {
    return loadFromStorage(key, clone(fallback));
  }

  function save(key, data) {
    saveToStorage(key, data);
    return data;
  }

  function ensureExtraStorage() {
    if (!localStorage.getItem('autowash_customers')) save('customers', MOCK_DATA.customers);
    if (!localStorage.getItem('autowash_loyaltyTransactions')) save('loyaltyTransactions', MOCK_DATA.loyaltyTransactions);
    if (!localStorage.getItem('autowash_staffSchedule')) save('staffSchedule', MOCK_DATA.staffSchedule);
    if (!localStorage.getItem('autowash_timeSlots')) {
      save('timeSlots', MOCK_DATA.timeSlots.map((slot, index) => ({
        slotId: index + 1,
        slotName: `Slot ${slot}`,
        startTime: slot,
        endTime: addMinutes(slot, 30),
        maxCapacity: 3,
        isActive: true
      })));
    }
  }

  function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function tierIdFromName(tier) {
    const order = { member: 1, silver: 2, gold: 3, platinum: 4 };
    return order[String(tier || 'member').toLowerCase()] || 1;
  }

  function tierNameFromId(id) {
    const tier = MOCK_DATA.loyaltyTiers[id - 1];
    return tier ? tier.name : 'All Tiers';
  }

  function toBackendCustomer(customer) {
    return {
      customerId: numId(customer.id),
      fullName: customer.name || customer.fullName,
      email: customer.email,
      phoneNumber: customer.phone || customer.phoneNumber,
      currentTier: customer.tier,
      pointsBalance: customer.points || 0,
      totalVisits: customer.totalVisits || 0,
      totalSpending: customer.totalSpending || 0,
      status: customer.status || 'active'
    };
  }

  function toBackendVehicle(vehicle) {
    return {
      vehicleId: numId(vehicle.vehicleId || vehicle.id),
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      color: vehicle.color
    };
  }

  function toBackendWashService(service) {
    return {
      serviceId: numId(service.serviceId || service.id),
      serviceName: service.serviceName || service.name,
      description: service.description,
      price: Number(service.price || 0),
      durationMinutes: service.durationMinutes || service.duration,
      isActive: service.isActive ?? service.active ?? true
    };
  }

  function fromBackendWashService(body, existing) {
    return {
      ...(existing || {}),
      id: existing?.id || legacyId('svc', body.serviceId || Date.now()),
      name: body.serviceName,
      vehicleType: body.vehicleType || existing?.vehicleType || 'Car',
      duration: Number(body.durationMinutes || body.duration || 30),
      price: Number(body.price || 0),
      description: body.description || '',
      active: body.isActive ?? true
    };
  }

  /* --- AUTOWASH API INTEGRATION: LOYALTY TIERS MAPPING --- */
  function toBackendLoyaltyTier(tier) {
    return {
      id: tier.id,
      tierName: tier.name,
      requiredVisits: tier.requiredVisits,
      requiredSpending: tier.requiredSpending,
      pointMultiplier: tier.pointRate,
      bookingWindowDays: tier.bookingWindow,
      discountPercent: tier.discountPercent,
      benefits: Array.isArray(tier.benefits) ? tier.benefits.join(', ') : (tier.benefits || ''),
      isActive: tier.isActive ?? true
    };
  }

  function fromBackendLoyaltyTier(body, existing) {
    let benefits = [];
    if (Array.isArray(body.benefits)) {
      benefits = body.benefits;
    } else if (typeof body.benefits === 'string') {
      benefits = body.benefits.split(',').map(b => b.trim()).filter(Boolean);
    }
    return {
      ...(existing || {}),
      id: existing?.id || String(body.tierName || '').toLowerCase(),
      name: body.tierName,
      requiredVisits: Number(body.requiredVisits ?? 0),
      requiredSpending: Number(body.requiredSpending ?? 0),
      pointRate: Number(body.pointMultiplier || 1),
      bookingWindow: Number(body.bookingWindowDays || 7),
      discountPercent: Number(body.discountPercent ?? 0),
      benefits: benefits,
      isActive: body.isActive ?? true
    };
  }

  function toBackendTimeSlot(slot) {
    return {
      slotId: numId(slot.slotId || slot.id),
      slotName: slot.slotName,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      isStatus: slot.isStatus ?? slot.isActive ?? true
    };
  }

  function toBackendPromotion(promotion) {
    const minTierId = promotion.minTierId || (promotion.targetTier === 'all' ? null : tierIdFromName(promotion.targetTier));
    return {
      promoId: numId(promotion.promoId || promotion.id),
      promoName: promotion.promoName || promotion.name,
      description: promotion.description,
      discountAmount: Number(promotion.discountAmount ?? promotion.discountValue ?? 0),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      status: promotion.status,
      minTierId,
      minTierName: minTierId ? tierNameFromId(minTierId) : 'All Tiers'
    };
  }

  function fromBackendPromotion(body, existing) {
    const minTierId = body.minTierId == null ? null : Number(body.minTierId);
    const tierIds = { 1: 'member', 2: 'silver', 3: 'gold', 4: 'platinum' };
    return {
      ...(existing || {}),
      id: existing?.id || legacyId('promo', body.promoId || Date.now()),
      name: body.promoName,
      description: body.description || '',
      discountType: body.discountType || existing?.discountType || 'percent',
      discountValue: Number(body.discountAmount ?? body.discountValue ?? 0),
      startDate: body.startDate,
      endDate: body.endDate,
      targetTier: minTierId ? tierIds[minTierId] : 'all',
      usageLimit: body.usageLimit || existing?.usageLimit || 100,
      usedCount: existing?.usedCount || 0,
      status: body.status || 'active'
    };
  }

  function toAuthRole(email) {
    const loginKey = String(email || '').toLowerCase();
    if (loginKey.includes('admin') || loginKey.includes('manager') || loginKey === 'admin') return 'ROLE_MANAGER';
    if (loginKey.includes('staff') || loginKey.startsWith('staff')) return 'ROLE_STAFF';
    return 'ROLE_CUSTOMER';
  }

  function handleAuth(method, parts, body) {
    if (method === 'POST' && parts[1] === 'login') {
      const loginKey = body.loginKey || body.email || body.phoneNumber || body.phone;
      if (!loginKey || !body.password) return fail('Login key and password cannot be blank', 401);

      const roleName = toAuthRole(loginKey);
      const customers = load('customers', MOCK_DATA.customers);
      const customer = customers.find(c => c.email === loginKey || c.phone === loginKey || c.phoneNumber === loginKey) || customers[0];
      const auth = {
        id: roleName === 'ROLE_CUSTOMER' ? numId(customer.id) : roleName === 'ROLE_STAFF' ? 2 : 1,
        loginKey,
        fullName: roleName === 'ROLE_CUSTOMER' ? customer.name : roleName === 'ROLE_STAFF' ? 'Nhân viên AutoWash' : 'Quản lý AutoWash',
        roleName,
        token: 'mock-jwt-token'
      };

      return respond(auth);
    }

    if (method === 'POST' && parts[1] === 'register') {
      if (!body.fullName || !body.email || !body.phoneNumber || !body.password) {
        return fail('Full name, email, phone number and password are required');
      }
      const customers = load('customers', MOCK_DATA.customers);
      if (customers.some(c => c.email === body.email || c.phone === body.phoneNumber)) {
        return fail('Email or phone number already exists');
      }
      const id = nextNumber(customers, 'customerId', 'id');
      customers.push({
        id: legacyId('cust', id),
        name: body.fullName,
        phone: body.phoneNumber,
        email: body.email,
        tier: 'member',
        points: 0,
        totalVisits: 0,
        totalSpending: 0,
        status: 'active'
      });
      save('customers', customers);
      return respond(`Register successfully for: ${body.fullName}`, 201);
    }

    if (method === 'POST' && parts[1] === 'forgot-password') {
      if (!body.email) return fail('Email cannot be blank');
      localStorage.setItem(`autowash_otp_${body.email}`, '123456');
      return respond(`OTP has been sent to ${body.email}`);
    }

    if (method === 'POST' && parts[1] === 'reset-password') {
      if (!body.email || !body.otp || !body.newPassword) return fail('Email, OTP and new password are required');
      if (body.otp !== '123456') return fail('Invalid OTP');
      return respond('Password reset successfully');
    }

    if (method === 'POST' && parts[1] === 'google') {
      if (!body.token) return fail('Google ID Token cannot be blank', 401);
      return respond({
        id: 1,
        loginKey: 'google.user@gmail.com',
        fullName: 'Google User',
        roleName: 'ROLE_CUSTOMER',
        token: 'mock-google-jwt-token'
      });
    }

    return null;
  }

  function handleCustomers(method, parts, params) {
    if (method === 'GET' && parts[1] === 'profile') {
      const customerId = params.get('customerId');
      const customer = load('customers', MOCK_DATA.customers).find(c => numId(c.id) === Number(customerId));
      return customer ? respond(toBackendCustomer(customer)) : fail('Customer not found');
    }
    return null;
  }

  function handleVehicles(method, parts, params, body) {
    let vehicles = load('vehicles', MOCK_DATA.vehicles);

    if (method === 'GET' && parts[1] === 'customer') {
      const customerId = Number(params.get('customerId'));
      return respond(vehicles.filter(v => numId(v.customerId) === customerId).map(toBackendVehicle));
    }

    if (method === 'POST' && parts.length === 1) {
      const id = nextNumber(vehicles, 'vehicleId', 'id');
      const item = {
        id: legacyId('veh', id),
        customerId: legacyId('cust', body.customerId),
        licensePlate: body.licensePlate,
        vehicleType: body.vehicleType,
        brand: body.brand || '',
        color: body.color || '',
        notes: body.notes || ''
      };
      vehicles.push(item);
      save('vehicles', vehicles);
      return respond(toBackendVehicle(item), 201);
    }

    const id = Number(parts[1]);
    const index = vehicles.findIndex(v => numId(v.id) === id);
    if (index < 0) return fail('Vehicle not found');

    if (method === 'PUT') {
      vehicles[index] = {
        ...vehicles[index],
        customerId: body.customerId ? legacyId('cust', body.customerId) : vehicles[index].customerId,
        licensePlate: body.licensePlate,
        vehicleType: body.vehicleType,
        brand: body.brand || '',
        color: body.color || ''
      };
      save('vehicles', vehicles);
      return respond(toBackendVehicle(vehicles[index]));
    }

    if (method === 'DELETE') {
      vehicles = vehicles.filter(v => numId(v.id) !== id);
      save('vehicles', vehicles);
      return respond(`Vehicle deleted successfully with ID: ${id}`);
    }

    return null;
  }

  function handleWashServices(method, parts, body) {
    let services = load('services', MOCK_DATA.services);
    const id = Number(parts[2]);

    if (method === 'GET' && parts.length === 2) return respond(services.map(toBackendWashService));

    if (method === 'POST') {
      const serviceId = nextNumber(services, 'serviceId', 'id');
      const service = fromBackendWashService({ ...body, serviceId });
      service.id = legacyId('svc', serviceId);
      services.push(service);
      save('services', services);
      return respond(toBackendWashService(service), 201);
    }

    const index = services.findIndex(s => numId(s.id) === id);
    if (index < 0) return fail('Wash service not found');

    if (method === 'PUT') {
      services[index] = fromBackendWashService(body, services[index]);
      save('services', services);
      return respond(toBackendWashService(services[index]));
    }

    if (method === 'DELETE') {
      services = services.filter(s => numId(s.id) !== id);
      save('services', services);
      return respond(`Wash service deleted successfully with ID: ${id}`);
    }

    return null;
  }

  function handleTimeSlots(method, parts, body) {
    let slots = load('timeSlots', []);
    const id = Number(parts[2]);

    if (method === 'GET' && parts.length === 2) return respond(slots.map(toBackendTimeSlot));

    if (method === 'POST') {
      const slot = {
        slotId: nextNumber(slots, 'slotId', 'id'),
        slotName: body.slotName,
        startTime: body.startTime,
        endTime: body.endTime,
        maxCapacity: Number(body.maxCapacity || 1),
        isActive: body.isActive ?? true
      };
      slots.push(slot);
      save('timeSlots', slots);
      return respond(toBackendTimeSlot(slot));
    }

    const index = slots.findIndex(s => Number(s.slotId) === id);
    if (index < 0) return fail('Time slot not found');

    if (method === 'PUT') {
      slots[index] = { ...slots[index], ...body, maxCapacity: Number(body.maxCapacity || slots[index].maxCapacity) };
      save('timeSlots', slots);
      return respond(toBackendTimeSlot(slots[index]));
    }

    if (method === 'DELETE') {
      slots = slots.filter(s => Number(s.slotId) !== id);
      save('timeSlots', slots);
      return respond(`Time slot with ID ${id} has been deleted successfully!`);
    }

    return null;
  }

  function handlePromotions(method, parts, body) {
    let promotions = load('promotions', MOCK_DATA.promotions);

    if (method === 'GET' && parts[1] === 'active') {
      return respond(promotions.filter(p => p.status === 'active').map(toBackendPromotion));
    }

    const id = Number(parts[1]);

    if (method === 'GET' && parts.length === 1) return respond(promotions.map(toBackendPromotion));

    if (method === 'POST') {
      const promoId = nextNumber(promotions, 'promoId', 'id');
      const promo = fromBackendPromotion({ ...body, promoId });
      promo.id = legacyId('promo', promoId);
      promotions.push(promo);
      save('promotions', promotions);
      return respond(toBackendPromotion(promo), 201);
    }

    const index = promotions.findIndex(p => numId(p.id) === id);
    if (index < 0) return fail('Promotion not found');

    if (method === 'PUT') {
      promotions[index] = fromBackendPromotion(body, promotions[index]);
      save('promotions', promotions);
      return respond(toBackendPromotion(promotions[index]));
    }

    if (method === 'DELETE') {
      promotions = promotions.filter(p => numId(p.id) !== id);
      save('promotions', promotions);
      return respond(`Promotion with ID ${id} has been deleted successfully!`);
    }

    return null;
  }

  /* --- AUTOWASH API INTEGRATION: LOYALTY TIERS HANDLER --- */
  function handleLoyaltyTiers(method, parts, body) {
    let tiers = load('loyaltyTiers', MOCK_DATA.loyaltyTiers);
    
    if (method === 'GET' && parts[1] === 'active') {
      return respond(tiers.filter(t => t.isActive !== false).map(toBackendLoyaltyTier));
    }
    
    if (method === 'GET' && parts.length === 1) {
      return respond(tiers.map(toBackendLoyaltyTier));
    }

    if (method === 'POST') {
      const tier = fromBackendLoyaltyTier(body);
      tiers.push(tier);
      save('loyaltyTiers', tiers);
      return respond(toBackendLoyaltyTier(tier), 201);
    }

    const id = parts[1];
    const index = tiers.findIndex(t => t.id === id);
    if (index < 0) return fail('Loyalty tier not found');

    if (method === 'PUT') {
      tiers[index] = fromBackendLoyaltyTier(body, tiers[index]);
      save('loyaltyTiers', tiers);
      return respond(toBackendLoyaltyTier(tiers[index]));
    }

    if (method === 'DELETE') {
      tiers[index].isActive = false;
      save('loyaltyTiers', tiers);
      return respond(`Loyalty tier deactivated successfully with ID: ${id}`);
    }

    return null;
  }

  function handleBookings(method, parts, body) {
    let bookings = load('bookings', MOCK_DATA.bookings);

    if (method === 'GET') return respond(bookings);

    if (method === 'POST') {
      const customer = load('customers', MOCK_DATA.customers).find(c => numId(c.id) === numId(body.customerId)) || getCurrentCustomer();
      const vehicle = load('vehicles', MOCK_DATA.vehicles).find(v => numId(v.id) === numId(body.vehicleId));
      const service = load('services', MOCK_DATA.services).find(s => numId(s.id) === numId(body.serviceId));
      if (!customer || !vehicle || !service) return fail('Invalid booking data');
      const booking = {
        id: `BK-${new Date().getFullYear()}-${String(bookings.length + 1).padStart(3, '0')}`,
        customerId: customer.id,
        customerName: customer.name,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.licensePlate,
        serviceId: service.id,
        serviceName: service.name,
        date: body.date,
        time: body.time,
        status: body.status || 'pending',
        totalPrice: body.totalPrice || service.price,
        pointsEarned: body.pointsEarned || 0,
        promotionId: body.promotionId || null
      };
      bookings.unshift(booking);
      save('bookings', bookings);
      return respond(booking, 201);
    }

    if (method === 'PATCH' && parts[2] === 'status') {
      const id = parts[1];
      const index = bookings.findIndex(b => b.id === id);
      if (index < 0) return fail('Booking not found', 404);
      bookings[index].status = body.status;
      save('bookings', bookings);
      return respond(bookings[index]);
    }

    return null;
  }

  function handleDemo(method, parts, body) {
    if (parts[0] === 'dashboard' && parts[1] === 'analytics' && method === 'GET') return respond(MOCK_DATA.analyticsData);
    if (parts[0] === 'staff' && parts[1] === 'schedule') {
      let schedule = load('staffSchedule', MOCK_DATA.staffSchedule);
      if (method === 'GET') return respond(schedule);
      if (method === 'PATCH' && parts[3] === 'status') {
        const id = parts[2];
        const index = schedule.findIndex(item => item.id === id);
        if (index < 0) return fail('Schedule item not found', 404);
        schedule[index].status = body.status;
        save('staffSchedule', schedule);
        return respond(schedule[index]);
      }
    }
    return null;
  }

  function route(method, pathname, searchParams, body) {
    ensureExtraStorage();
    const parts = pathname.replace(API_PREFIX, '').split('/').filter(Boolean);
    const resource = parts[0];

    if (!resource || resource === 'health') return respond({ status: 'UP', mode: 'mock', endpoints: endpointDocs });
    if (resource === 'auth') return handleAuth(method, parts, body);
    if (resource === 'customers') return handleCustomers(method, parts, searchParams);
    if (resource === 'vehicles') return handleVehicles(method, parts, searchParams, body);
    if (resource === 'admin' && parts[1] === 'wash-services') return handleWashServices(method, parts, body);
    if (resource === 'admin' && parts[1] === 'time-slots') return handleTimeSlots(method, parts, body);
    if (resource === 'promotions') return handlePromotions(method, parts, body);
    if (resource === 'loyalty-tiers') return handleLoyaltyTiers(method, parts, body);
    if (resource === 'bookings') return handleBookings(method, parts, body);

    return handleDemo(method, parts, body) || fail(`Mock API does not support ${method} ${pathname}`, 404);
  }

  async function mockFetch(input, init = {}) {
    const rawUrl = typeof input === 'string' ? input : input.url;
    const url = new URL(rawUrl, window.location.origin);
    const method = (init.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
    const body = readJson(init);
    return later(route(method, url.pathname, url.searchParams, body));
  }

  async function request(path, options = {}) {
    const config = getConfig();

    if (!config.useMock) {
      const response = await realFetch(path, {
        method: options.method || 'GET',
        body: options.body
      });
      const contentType = response.headers.get('Content-Type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : await response.text();
      if (!response.ok) throw new Error(typeof payload === 'string' ? payload : JSON.stringify(payload));
      return payload;
    }

    const response = await mockFetch(path, {
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const contentType = response.headers.get('Content-Type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(typeof payload === 'string' ? payload : JSON.stringify(payload));
    return payload;
  }

  window.AutoWashAPI = {
    endpoints: endpointDocs,
    request,
    getToken: getAuthToken,
    auth: {
      login: (loginKey, password) => request('/api/auth/login', { method: 'POST', body: { loginKey, password } }),
      register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
      forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
      resetPassword: (payload) => request('/api/auth/reset-password', { method: 'POST', body: payload }),
      loginWithGoogle: (token) => request('/api/auth/google', { method: 'POST', body: { token } })
    },
    customers: {
      profile: (customerId) => request(`/api/customers/profile?customerId=${customerId}`)
    },
    vehicles: {
      byCustomer: (customerId) => request(`/api/vehicles/customer?customerId=${customerId}`),
      create: (payload) => request('/api/vehicles', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/vehicles/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/api/vehicles/${id}`, { method: 'DELETE' })
    },
    washServices: {
      list: () => request('/api/admin/wash-services'),
      create: (payload) => request('/api/admin/wash-services', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/admin/wash-services/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/api/admin/wash-services/${id}`, { method: 'DELETE' })
    },
    timeSlots: {
      list: () => request('/api/admin/time-slots'),
      create: (payload) => request('/api/admin/time-slots', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/admin/time-slots/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/api/admin/time-slots/${id}`, { method: 'DELETE' })
    },
    promotions: {
      list: () => request('/api/promotions'),
      create: (payload) => request('/api/promotions', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/promotions/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/api/promotions/${id}`, { method: 'DELETE' })
    },
    loyaltyTiers: {
      list: () => request('/api/loyalty-tiers'),
      listActive: () => request('/api/loyalty-tiers/active'),
      create: (payload) => request('/api/loyalty-tiers', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/loyalty-tiers/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/api/loyalty-tiers/${id}`, { method: 'DELETE' })
    },
    bookings: {
      list: () => request('/api/bookings'),
      create: (payload) => request('/api/bookings', { method: 'POST', body: payload }),
      updateStatus: (id, status) => request(`/api/bookings/${id}/status`, { method: 'PATCH', body: { status } })
    },
    staff: {
      schedule: () => request('/api/staff/schedule'),
      updateStatus: (id, status) => request(`/api/staff/schedule/${id}/status`, { method: 'PATCH', body: { status } })
    }
  };

  window.mockApiFetch = mockFetch;
  if (originalFetch) {
    window.fetch = (input, init) => {
      const rawUrl = typeof input === 'string' ? input : input.url;
      const url = new URL(rawUrl, window.location.origin);
      if (!url.pathname.startsWith(API_PREFIX)) return originalFetch(input, init);

      if (!getConfig().useMock) {
        const path = `${url.pathname}${url.search}`;
        return realFetch(path, {
          method: init?.method || 'GET',
          body: init?.body,
          headers: init?.headers
        });
      }

      return mockFetch(input, init);
    };
  }
})();
