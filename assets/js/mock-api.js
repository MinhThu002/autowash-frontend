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
    customers: [
      'GET /api/customers',
      'GET /api/customers/profile?customerId=1'
    ],
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
    ],
    rewards: [
      'GET /api/rewards/admin/all',
      'POST /api/rewards/admin/create',
      'PUT /api/rewards/admin/update/{id}',
      'DELETE /api/rewards/admin/delete/{id}'
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
    if (!localStorage.getItem('autowash_loyaltyPoints')) save('loyaltyPoints', MOCK_DATA.loyaltyPoints);
    if (!localStorage.getItem('autowash_washHistory')) save('washHistory', MOCK_DATA.washHistory);
    if (!localStorage.getItem('autowash_rewardCatalog')) save('rewardCatalog', MOCK_DATA.rewardCatalog);
    if (!localStorage.getItem('autowash_serviceCatalog')) save('serviceCatalog', MOCK_DATA.serviceCatalog);
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
    const tier = MOCK_DATA.loyaltyTiers.find(t => t.tierId === Number(id)) || MOCK_DATA.loyaltyTiers[id - 1];
    return tier ? tier.tierName : 'All Tiers';
  }

  function toBackendCustomer(customer) {
    const tier = MOCK_DATA.loyaltyTiers.find(t => t.tierId === Number(customer.tierId)) || getTierById(customer.tierId || customer.tier);
    return {
      customerId: customer.customerId ?? numId(customer.id),
      fullName: customer.fullName || customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber || customer.phone,
      currentTier: tier.tierName,
      tierId: tier.tierId,
      pointsBalance: Number(customer.currentPoints ?? customer.points ?? 0),
      totalVisits: Number(customer.totalVisits || 0),
      totalSpending: Number(customer.totalSpend ?? customer.totalSpending ?? 0)
    };
  }

  function toBackendCustomerList(customer) {
    const tier = MOCK_DATA.loyaltyTiers.find(t => t.tierId === Number(customer.tierId)) || getTierById(customer.tierId || customer.tier || customer.loyaltyTier);
    return {
      customerId: customer.customerId ?? numId(customer.id),
      fullName: customer.fullName || customer.name,
      phoneNumber: customer.phoneNumber || customer.phone,
      email: customer.email,
      loyaltyTier: customer.loyaltyTier || tier.tierName,
      tierId: tier.tierId,
      currentPoints: Number(customer.currentPoints ?? customer.points ?? 0),
      totalVisits: Number(customer.totalVisits ?? 0),
      totalSpend: Number(customer.totalSpend ?? customer.totalSpending ?? 0)
    };
  }

  function toBackendVehicle(vehicle) {
    return {
      vehicleId: numId(vehicle.vehicleId || vehicle.id),
      customerId: numId(vehicle.customerId),
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      color: vehicle.color
    };
  }

  function isVehicleActive() {
    return true;
  }

  function toBackendWashService(service, index) {
    return {
      serviceId: index + 1,
      serviceName: service.serviceType || service.serviceName || service.name,
      description: 'Booking.service_type',
      price: Number(service.basePrice ?? service.price ?? 0),
      durationMinutes: 30,
      isActive: true
    };
  }

  function fromBackendWashService(body) {
    return {
      serviceType: body.serviceName || body.serviceType,
      basePrice: Number(body.price || body.basePrice || 0)
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
    const minTierId = promotion.minTierId == null
      ? (promotion.targetTier === 'all' ? null : tierIdFromName(promotion.targetTier))
      : Number(promotion.minTierId);
    return {
      promoId: numId(promotion.promotionId || promotion.promoId || promotion.id),
      promoName: promotion.title || promotion.promoName || promotion.name,
      description: promotion.description,
      discountAmount: Number(promotion.discountPercent ?? promotion.discountAmount ?? promotion.discountValue ?? 0),
      discountPercent: Number(promotion.discountPercent ?? 0),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      status: promotion.status,
      minTierId,
      minTierName: minTierId ? tierNameFromId(minTierId) : 'All Tiers'
    };
  }

  function fromBackendPromotion(body, existing) {
    const minTierId = body.minTierId == null || body.minTierId === '' ? null : Number(body.minTierId);
    return {
      ...(existing || {}),
      promotionId: existing?.promotionId || numId(body.promoId) || Date.now(),
      title: body.promoName || body.title,
      description: body.description || '',
      discountPercent: Number(body.discountPercent ?? body.discountAmount ?? body.discountValue ?? 0),
      startDate: body.startDate,
      endDate: body.endDate,
      minTierId,
      status: body.status || 'Active',
      createdByAdminId: existing?.createdByAdminId || 1
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
      const customer = customers.find(c =>
        String(c.email || '').toLowerCase() === String(loginKey).toLowerCase()
        || String(c.phoneNumber || c.phone || '') === loginKey
      ) || customers[0];
      const admin = (MOCK_DATA.adminAccounts || []).find(a =>
        String(a.username).toLowerCase() === String(loginKey).toLowerCase()
      );
      const auth = {
        id: roleName === 'ROLE_CUSTOMER'
          ? (customer.customerId ?? numId(customer.id))
          : (admin?.adminId || (roleName === 'ROLE_STAFF' ? 2 : 1)),
        loginKey,
        fullName: roleName === 'ROLE_CUSTOMER'
          ? (customer.fullName || customer.name)
          : (admin?.fullName || (roleName === 'ROLE_STAFF' ? 'Nhân viên AutoWash' : 'Quản lý AutoWash')),
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
      if (customers.some(c => c.email === body.email || c.phoneNumber === body.phoneNumber || c.phone === body.phoneNumber)) {
        return fail('Email or phone number already exists');
      }
      const id = nextNumber(customers, 'customerId', 'id');
      customers.push({
        customerId: id,
        fullName: body.fullName,
        phoneNumber: body.phoneNumber,
        email: body.email,
        tierId: 1,
        currentPoints: 0,
        totalVisits: 0,
        totalSpend: 0,
        lastTierReview: null,
        tierUpdatedByAdminId: null,
        createdAt: new Date().toISOString()
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
    if (method === 'GET' && parts.length === 1) {
      const customers = load('customers', MOCK_DATA.customers);
      return respond(customers.map(toBackendCustomerList));
    }

    if (method === 'GET' && parts[1] === 'profile') {
      const customerId = params.get('customerId');
      const customer = load('customers', MOCK_DATA.customers).find(c =>
        Number(c.customerId ?? numId(c.id)) === Number(customerId)
      );
      return customer ? respond(toBackendCustomer(customer)) : fail('Customer not found');
    }
    return null;
  }

  function handleVehicles(method, parts, params, body) {
    let vehicles = load('vehicles', MOCK_DATA.vehicles);

    if (method === 'GET' && parts[1] === 'customer') {
      const customerId = Number(params.get('customerId'));
      return respond(
        vehicles
          .filter(v => numId(v.customerId) === customerId)
          .map(toBackendVehicle)
      );
    }

    if (method === 'POST' && parts.length === 1) {
      const id = nextNumber(vehicles, 'vehicleId', 'id');
      const item = {
        vehicleId: id,
        customerId: Number(body.customerId),
        licensePlate: body.licensePlate,
        vehicleType: body.vehicleType,
        brand: body.brand || '',
        color: body.color || ''
      };
      vehicles.push(item);
      save('vehicles', vehicles);
      return respond(toBackendVehicle(item), 201);
    }

    const id = Number(parts[1]);
    const index = vehicles.findIndex(v => numId(v.vehicleId || v.id) === id);
    if (index < 0) return fail('Vehicle not found');

    if (method === 'PUT') {
      vehicles[index] = {
        ...vehicles[index],
        customerId: body.customerId != null ? Number(body.customerId) : vehicles[index].customerId,
        licensePlate: body.licensePlate,
        vehicleType: body.vehicleType,
        brand: body.brand || '',
        color: body.color || ''
      };
      save('vehicles', vehicles);
      return respond(toBackendVehicle(vehicles[index]));
    }

    if (method === 'DELETE') {
      vehicles = vehicles.filter(v => numId(v.vehicleId || v.id) !== id);
      save('vehicles', vehicles);
      return respond(`Vehicle deleted successfully with ID: ${id}`);
    }

    return null;
  }

  function toBackendReward(reward) {
    return {
      rewardId: numId(reward.rewardId || reward.id),
      rewardName: reward.rewardName || reward.name,
      pointsRequired: Number(reward.pointsRequired ?? reward.pointsCost ?? 0),
      discountAmount: Number(reward.discountAmount ?? 0),
      freeWash: Boolean(reward.freeWash),
      isActive: reward.isActive !== false,
      createdByAdminId: reward.createdByAdminId ?? 1
    };
  }

  function handleRewards(method, parts, body) {
    let rewards = load('rewardCatalog', MOCK_DATA.rewardCatalog);

    if (method === 'GET' && parts[1] === 'admin' && parts[2] === 'all') {
      return respond(
        [...rewards]
          .sort((a, b) => Number(a.pointsRequired) - Number(b.pointsRequired))
          .map(toBackendReward)
      );
    }

    if (method === 'GET' && parts[1] === 'customer' && parts[2] === 'catalog') {
      return respond(
        rewards
          .filter(r => r.isActive !== false)
          .sort((a, b) => Number(a.pointsRequired) - Number(b.pointsRequired))
          .map(toBackendReward)
      );
    }

    if (method === 'POST' && parts[1] === 'admin' && parts[2] === 'create') {
      if (!body.rewardName || body.pointsRequired == null || body.discountAmount == null) {
        return fail('Reward name, points and discount amount are required');
      }
      if (rewards.some(r => r.rewardName === body.rewardName)) {
        return fail('Reward name already exists!');
      }

      const rewardId = nextNumber(rewards, 'rewardId', 'id');
      const item = {
        rewardId,
        rewardName: body.rewardName,
        pointsRequired: Number(body.pointsRequired),
        discountAmount: Number(body.discountAmount),
        freeWash: Boolean(body.freeWash),
        isActive: body.isActive !== false,
        createdByAdminId: 1
      };
      rewards.push(item);
      save('rewardCatalog', rewards);
      return respond(toBackendReward(item), 201);
    }

    const id = Number(parts[3]);
    const index = rewards.findIndex(r => numId(r.rewardId || r.id) === id);

    if (method === 'PUT' && parts[1] === 'admin' && parts[2] === 'update') {
      if (index < 0) return fail('Reward not found with ID: ' + id);
      if (rewards.some(r => r.rewardName === body.rewardName && numId(r.rewardId || r.id) !== id)) {
        return fail('Reward name is already taken!');
      }

      rewards[index] = {
        ...rewards[index],
        rewardName: body.rewardName,
        pointsRequired: Number(body.pointsRequired),
        discountAmount: Number(body.discountAmount),
        freeWash: body.freeWash !== undefined ? Boolean(body.freeWash) : Boolean(rewards[index].freeWash),
        isActive: body.isActive !== undefined ? body.isActive !== false : rewards[index].isActive !== false
      };
      save('rewardCatalog', rewards);
      return respond(toBackendReward(rewards[index]));
    }

    if (method === 'DELETE' && parts[1] === 'admin' && parts[2] === 'delete') {
      if (index < 0) return fail('Reward not found');
      rewards[index] = { ...rewards[index], isActive: false };
      save('rewardCatalog', rewards);
      return respond('Deactivated reward item success.');
    }

    return null;
  }

  function handleWashServices(method, parts, body) {
    let services = load('serviceCatalog', MOCK_DATA.serviceCatalog);
    const id = Number(parts[2]);

    if (method === 'GET' && parts.length === 2) {
      return respond(services.map((s, i) => toBackendWashService(s, i)));
    }

    if (method === 'POST') {
      const service = fromBackendWashService(body);
      services.push(service);
      save('serviceCatalog', services);
      return respond(toBackendWashService(service, services.length - 1), 201);
    }

    const index = id - 1;
    if (index < 0 || index >= services.length) return fail('Wash service not found');

    if (method === 'PUT') {
      services[index] = fromBackendWashService(body);
      save('serviceCatalog', services);
      return respond(toBackendWashService(services[index], index));
    }

    if (method === 'DELETE') {
      services = services.filter((_, i) => i !== index);
      save('serviceCatalog', services);
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
    const id = Number(parts[1]);

    if (method === 'GET' && parts.length === 1) return respond(promotions.map(toBackendPromotion));

    if (method === 'POST') {
      const promoId = nextNumber(promotions, 'promotionId', 'promoId');
      const promo = fromBackendPromotion({ ...body, promoId });
      promotions.push(promo);
      save('promotions', promotions);
      return respond(toBackendPromotion(promo), 201);
    }

    const index = promotions.findIndex(p => numId(p.promotionId || p.id) === id);
    if (index < 0) return fail('Promotion not found');

    if (method === 'PUT') {
      promotions[index] = fromBackendPromotion(body, promotions[index]);
      save('promotions', promotions);
      return respond(toBackendPromotion(promotions[index]));
    }

    if (method === 'DELETE') {
      promotions = promotions.filter(p => numId(p.promotionId || p.id) !== id);
      save('promotions', promotions);
      return respond(`Promotion with ID ${id} has been deleted successfully!`);
    }

    return null;
  }

  function handleBookings(method, parts, body) {
    let bookings = load('bookings', MOCK_DATA.bookings);

    if (method === 'GET') return respond(bookings.map(enrichBooking));

    if (method === 'POST') {
      const vehicle = load('vehicles', MOCK_DATA.vehicles).find(v => Number(v.vehicleId) === Number(body.vehicleId));
      const serviceType = body.serviceType || body.serviceName;
      if (!vehicle || !serviceType) return fail('Invalid booking data');
      const customer = load('customers', MOCK_DATA.customers).find(c => Number(c.customerId) === Number(vehicle.customerId));
      const tier = getTierById(customer?.tierId || 1);
      const bookingId = nextNumber(bookings, 'bookingId', 'id');
      const booking = {
        bookingId,
        vehicleId: Number(vehicle.vehicleId),
        bookingDate: body.bookingDate || body.date,
        bookingTime: body.bookingTime || body.time,
        serviceType,
        status: body.status || 'Pending',
        priorityLevel: tier.priorityLevel,
        tierIdAtBooking: tier.tierId,
        cancelledByAdminId: null,
        createdAt: new Date().toISOString()
      };
      bookings.unshift(booking);
      save('bookings', bookings);
      return respond(enrichBooking(booking), 201);
    }

    if (method === 'PATCH' && parts[2] === 'status') {
      const id = Number(parts[1]);
      const index = bookings.findIndex(b => Number(b.bookingId) === id);
      if (index < 0) return fail('Booking not found', 404);
      bookings[index].status = body.status;
      save('bookings', bookings);
      return respond(enrichBooking(bookings[index]));
    }

    return null;
  }

  function handleDemo(method, parts, body) {
    if (parts[0] === 'dashboard' && parts[1] === 'analytics' && method === 'GET') return respond(MOCK_DATA.analyticsData);
    if (parts[0] === 'staff' && parts[1] === 'schedule') {
      if (method === 'GET') return respond(buildStaffScheduleFromBookings());
      if (method === 'PATCH' && parts[3] === 'status') {
        const bookingId = Number(parts[2]);
        let bookings = load('bookings', MOCK_DATA.bookings);
        const index = bookings.findIndex(b => Number(b.bookingId) === bookingId);
        if (index < 0) return fail('Schedule item not found', 404);
        bookings[index].status = body.status;
        save('bookings', bookings);
        return respond(enrichBooking(bookings[index]));
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
    if (resource === 'rewards') return handleRewards(method, parts, body);
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
      getAll: () => request('/api/customers'),
      profile: (customerId) => request(`/api/customers/profile?customerId=${customerId}`)
    },
    vehicles: {
      byCustomer: (customerId) => {
        const id = customerId ?? (typeof getLoggedInCustomerId === 'function' ? getLoggedInCustomerId() : null);
        return request(`/api/vehicles/customer?customerId=${id}`);
      },
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
    bookings: {
      list: () => request('/api/v1/bookings'),
      byCustomer: (customerId) => request(`/api/v1/bookings/customer/${customerId}`),
      create: (payload) => request('/api/v1/bookings', { method: 'POST', body: payload }),
      availableSlots: (date, washServiceId) =>
        request(`/api/v1/bookings/available-slots?date=${encodeURIComponent(date)}&washServiceId=${washServiceId}`),
      confirmArrival: (id) => request(`/api/v1/bookings/${id}/confirm-arrival`, { method: 'PUT' }),
      complete: (id) => request(`/api/v1/bookings/${id}/complete`, { method: 'PUT' }),
      cancel: (id) => request(`/api/v1/bookings/${id}/cancel`, { method: 'PUT' })
    },
    washServicesActive: {
      list: () => request('/api/admin/wash-services/active')
    },
    rewards: {
      getAll: () => request('/api/rewards/admin/all'),
      catalog: () => request('/api/rewards/customer/catalog'),
      create: (payload) => request('/api/rewards/admin/create', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/rewards/admin/update/${id}`, { method: 'PUT', body: payload }),
      delete: (id) => request(`/api/rewards/admin/delete/${id}`, { method: 'DELETE' }),
      redeem: (payload) => request('/api/rewards/customer/redeem', { method: 'POST', body: payload })
    },
    staff: {
      list: () => request('/api/staff'),
      schedule: () => request('/api/v1/bookings'),
      updateStatus: (id, status) => {
        const key = String(status || '').toLowerCase();
        if (key.includes('confirm')) return request(`/api/v1/bookings/${id}/confirm-arrival`, { method: 'PUT' });
        if (key.includes('complete')) return request(`/api/v1/bookings/${id}/complete`, { method: 'PUT' });
        if (key.includes('cancel')) return request(`/api/v1/bookings/${id}/cancel`, { method: 'PUT' });
        return Promise.reject(new Error('Trạng thái không hỗ trợ'));
      }
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
