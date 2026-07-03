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
    let token = localStorage.getItem('autowash_token');
    if (token) return token;
    try {
      const user = JSON.parse(localStorage.getItem('autowash_user') || 'null');
      token = user?.token || null;
      if (token) localStorage.setItem('autowash_token', token);
      return token;
    } catch (e) {
      return null;
    }
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
      'GET /api/promotions/active',
      'POST /api/promotions',
      'PUT /api/promotions/{id}',
      'DELETE /api/promotions/{id}'
    ],
    bookingsV1: [
      'GET /api/v1/bookings',
      'GET /api/v1/bookings/available-slots',
      'POST /api/v1/bookings',
      'PUT /api/v1/bookings/{id}/confirm-arrival',
      'PUT /api/v1/bookings/{id}/complete',
      'PUT /api/v1/bookings/{id}/cancel'
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
      'GET /api/rewards/customer/catalog',
      'GET /api/rewards/customer/history/{customerId}',
      'GET /api/rewards/customer/unused/{customerId}',
      'POST /api/rewards/customer/redeem',
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
    if (!localStorage.getItem('autowash_rewardCatalog')) {
      save('rewardCatalog', MOCK_DATA.rewardCatalog);
    }
    if (!localStorage.getItem('autowash_redemptions')) {
      save('redemptions', []);
    }
    if (!localStorage.getItem('autowash_bookingRecords')) {
      save('bookingRecords', MOCK_DATA.bookings.map((b, index) => ({
        id: index + 1,
        fullName: b.customerName,
        licensePlate: b.vehiclePlate,
        serviceName: b.serviceName,
        bookingDate: b.date,
        createdAt: `${b.time}:00`,
        status: String(b.status || 'pending').toUpperCase(),
        totalPrice: b.totalPrice
      })));
    }
  }

  function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function tierIdFromName(tier) {
    const order = { member: 1, bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 4 };
    return order[String(tier || 'member').toLowerCase()] || 1;
  }

  function tierNameFromId(id) {
    const tier = MOCK_DATA.dbLoyaltyTiers.find(t => t.tierId === Number(id));
    return tier ? tier.tierName : 'All Tiers';
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

  function toBackendCustomerList(customer) {
    const tierMap = { member: 'BRONZE', silver: 'SILVER', gold: 'GOLD', platinum: 'DIAMOND' };
    const tierKey = customer.tier || customer.currentTier || 'member';
    return {
      fullName: customer.fullName || customer.name,
      phoneNumber: customer.phoneNumber || customer.phone,
      email: customer.email,
      loyaltyTier: customer.loyaltyTier || tierMap[tierKey] || String(tierKey).toUpperCase(),
      currentPoints: Number(customer.currentPoints ?? customer.points ?? 0),
      totalVisits: Number(customer.totalVisits ?? 0),
      totalSpend: Number(customer.totalSpend ?? customer.totalSpending ?? 0)
    };
  }

  function toBackendVehicle(vehicle) {
    return {
      vehicleId: numId(vehicle.vehicleId || vehicle.id),
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      color: vehicle.color,
      isActive: vehicle.isActive !== false
    };
  }

  function isVehicleActive(vehicle) {
    return vehicle.isActive !== false;
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
    const minTierId = promotion.minTierId != null
      ? Number(promotion.minTierId)
      : (promotion.targetTier === 'all' || !promotion.targetTier ? null : tierIdFromName(promotion.targetTier));
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
    return {
      ...(existing || {}),
      id: existing?.id || legacyId('promo', body.promoId || Date.now()),
      name: body.promoName,
      description: body.description || '',
      discountType: body.discountType || existing?.discountType || 'percent',
      discountValue: Number(body.discountAmount ?? body.discountValue ?? 0),
      startDate: body.startDate,
      endDate: body.endDate,
      minTierId,
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

      let email = 'google.user@gmail.com';
      let name = 'Google User';
      try {
        const payload = JSON.parse(atob(body.token.split('.')[1]));
        email = payload.email || email;
        name = payload.name || payload.given_name || name;
      } catch (e) { /* mock fallback */ }

      const customers = load('customers', MOCK_DATA.customers);
      let customer = customers.find(c => c.email === email);
      if (!customer) {
        const id = nextNumber(customers, 'customerId', 'id');
        customer = {
          id: legacyId('cust', id),
          name,
          phone: '',
          email,
          tier: 'member',
          points: 0,
          totalVisits: 0,
          totalSpending: 0,
          status: 'active'
        };
        customers.push(customer);
        save('customers', customers);
      }

      return respond({
        id: numId(customer.id),
        loginKey: email,
        fullName: customer.name || name,
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
      const customer = load('customers', MOCK_DATA.customers).find(c => numId(c.id) === Number(customerId));
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
          .filter(v => numId(v.customerId) === customerId && isVehicleActive(v))
          .map(toBackendVehicle)
      );
    }

    if (method === 'POST' && parts.length === 1) {
      const id = nextNumber(vehicles, 'vehicleId', 'id');
      const item = {
        id: legacyId('veh', id),
        vehicleId: id,
        customerId: legacyId('cust', body.customerId),
        licensePlate: body.licensePlate,
        vehicleType: body.vehicleType,
        brand: body.brand || '',
        color: body.color || '',
        notes: body.notes || '',
        isActive: true
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
      vehicles[index] = { ...vehicles[index], isActive: false };
      save('vehicles', vehicles);
      return respond(`Vehicle deleted successfully with ID: ${id}`);
    }

    return null;
  }

  function toBackendReward(reward) {
    return {
      rewardId: numId(reward.rewardId || reward.id),
      rewardName: reward.rewardName || reward.name,
      description: reward.description || '',
      pointsRequired: Number(reward.pointsRequired ?? reward.pointsCost ?? 0),
      discountAmount: Number(reward.discountAmount ?? 0),
      stockQuantity: Number(reward.stockQuantity ?? 0),
      isActive: reward.isActive !== false
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
          .filter(r => r.isActive !== false && Number(r.stockQuantity) > 0)
          .sort((a, b) => Number(a.pointsRequired) - Number(b.pointsRequired))
          .map(toBackendReward)
      );
    }

    if (method === 'POST' && parts[1] === 'customer' && parts[2] === 'redeem') {
      const customerId = Number(body.customerId);
      const rewardId = Number(body.rewardId);
      const quantity = Number(body.quantity || 1);
      const reward = rewards.find(r => numId(r.rewardId || r.id) === rewardId);
      if (!reward || reward.isActive === false) return fail('Reward not found');
      if (Number(reward.stockQuantity) < quantity) return fail('Not enough stock');

      const customers = load('customers', MOCK_DATA.customers);
      const customer = customers.find(c => numId(c.id) === customerId);
      if (!customer) return fail('Customer not found');

      const pointsNeeded = Number(reward.pointsRequired) * quantity;
      if (Number(customer.points) < pointsNeeded) return fail('Not enough points');

      customer.points -= pointsNeeded;
      reward.stockQuantity = Number(reward.stockQuantity) - quantity;
      save('customers', customers);
      save('rewardCatalog', rewards);

      let redemptions = load('redemptions', []);
      const redemptionId = nextNumber(redemptions, 'redemptionId', 'id');
      const item = {
        redemptionId,
        customerId,
        pointsUsed: pointsNeeded,
        redemptionDate: new Date().toISOString(),
        rewardId,
        rewardName: reward.rewardName || reward.name,
        discountAmount: Number(reward.discountAmount || 0),
        bookingId: null,
        status: 'AVAILABLE'
      };
      redemptions.unshift(item);
      save('redemptions', redemptions);
      return respond(item, 201);
    }

    if (method === 'GET' && parts[1] === 'customer' && parts[2] === 'history') {
      const customerId = Number(parts[3]);
      const list = load('redemptions', []).filter(r => Number(r.customerId) === customerId);
      return respond(list);
    }

    if (method === 'GET' && parts[1] === 'customer' && parts[2] === 'unused') {
      const customerId = Number(parts[3]);
      const list = load('redemptions', []).filter(r => Number(r.customerId) === customerId && !r.bookingId);
      return respond(list);
    }

    if (method === 'POST' && parts[1] === 'admin' && parts[2] === 'create') {
      if (!body.rewardName || body.pointsRequired == null || body.discountAmount == null || body.stockQuantity == null) {
        return fail('Reward name, points, discount amount and stock quantity are required');
      }
      if (rewards.some(r => r.rewardName === body.rewardName)) {
        return fail('Reward name already exists!');
      }

      const rewardId = nextNumber(rewards, 'rewardId', 'id');
      const item = {
        rewardId,
        rewardName: body.rewardName,
        description: body.description || '',
        pointsRequired: Number(body.pointsRequired),
        discountAmount: Number(body.discountAmount),
        stockQuantity: Number(body.stockQuantity),
        isActive: body.isActive !== false
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
        description: body.description || '',
        pointsRequired: Number(body.pointsRequired),
        discountAmount: Number(body.discountAmount),
        stockQuantity: Number(body.stockQuantity),
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
    let services = load('services', MOCK_DATA.services);
    const id = Number(parts[2]);

    if (method === 'GET' && parts.length === 2) return respond(services.map(toBackendWashService));
    if (method === 'GET' && parts[2] === 'active') {
      return respond(services.filter(s => s.active !== false && s.isActive !== false).map(toBackendWashService));
    }

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
    const id = Number(parts[1]);

    if (method === 'GET' && parts.length === 1) return respond(promotions.map(toBackendPromotion));
    if (method === 'GET' && parts[1] === 'active') {
      return respond(promotions.filter(p => p.status !== 'inactive').map(toBackendPromotion));
    }

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

  function toBackendBookingRecord(record) {
    return {
      id: record.id,
      fullName: record.fullName,
      licensePlate: record.licensePlate,
      serviceName: record.serviceName,
      bookingDate: record.bookingDate,
      createdAt: record.createdAt,
      status: record.status,
      totalPrice: record.totalPrice
    };
  }

  function handleBookingsV1(method, parts, params, body) {
    let records = load('bookingRecords', []);

    if (method === 'GET' && parts[0] === 'available-slots') {
      const date = params.get('date');
      const washServiceId = Number(params.get('washServiceId'));
      const slots = load('timeSlots', []);
      const service = load('services', MOCK_DATA.services).find(s => numId(s.id) === washServiceId);
      const duration = service?.duration || service?.durationMinutes || 30;
      return respond(slots.filter(s => s.isActive !== false).map(slot => ({
        slotId: slot.slotId,
        slotName: slot.slotName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxCapacity: slot.maxCapacity,
        isAvailable: true
      })));
    }

    if (method === 'GET' && parts.length === 0) {
      return respond(records.map(toBackendBookingRecord));
    }

    if (method === 'POST' && parts.length === 0) {
      const customer = load('customers', MOCK_DATA.customers).find(c => numId(c.id) === Number(body.customerId));
      const vehicle = load('vehicles', MOCK_DATA.vehicles).find(v => numId(v.vehicleId || v.id) === Number(body.vehicleId));
      const service = load('services', MOCK_DATA.services).find(s => numId(s.id) === Number(body.washServiceId));
      const slot = load('timeSlots', []).find(s => Number(s.slotId) === Number(body.slotId));
      if (!customer || !vehicle || !service) return fail('Invalid booking data');

      const basePrice = Number(service.price || 0);
      const id = nextNumber(records, 'id');
      const record = {
        id,
        fullName: customer.name,
        licensePlate: vehicle.licensePlate,
        serviceName: service.name || service.serviceName,
        bookingDate: body.bookingDate,
        createdAt: slot?.startTime ? `${slot.startTime}:00` : '09:00:00',
        status: 'PENDING',
        totalPrice: basePrice
      };
      records.unshift(record);
      save('bookingRecords', records);

      return respond({
        basePrice,
        discountFromTier: 0,
        discountFromPromo: 0,
        discountFromReward: 0,
        addOn: 'NONE',
        totalPointEarned: Math.round(basePrice / 1000),
        finalPrice: basePrice
      }, 201);
    }

    const bookingId = Number(parts[0]);
    const index = records.findIndex(r => Number(r.id) === bookingId);
    if (index < 0) return fail('Booking not found', 404);
    const record = records[index];

    if (method === 'PUT' && parts[1] === 'confirm-arrival') {
      if (record.status !== 'PENDING') return fail("Only 'PENDING' bookings can be CONFIRMED.");
      records[index].status = 'CONFIRMED';
      save('bookingRecords', records);
      return respond(toBackendBookingRecord(records[index]));
    }

    if (method === 'PUT' && parts[1] === 'complete') {
      if (record.status !== 'CONFIRMED') return fail("Booking must be 'CONFIRMED' to complete.");
      records[index].status = 'COMPLETED';
      save('bookingRecords', records);
      return respond(toBackendBookingRecord(records[index]));
    }

    if (method === 'PUT' && parts[1] === 'cancel') {
      if (record.status === 'COMPLETED') return fail('Cannot cancel a booking that is already COMPLETED.');
      if (record.status === 'CANCELLED') return fail('This booking has already been cancelled.');
      records[index].status = 'CANCELLED';
      save('bookingRecords', records);
      return respond('Booking has been cancelled successfully');
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
    if (resource === 'rewards') return handleRewards(method, parts, body);
    if (resource === 'v1' && parts[1] === 'bookings') return handleBookingsV1(method, parts.slice(2), searchParams, body);
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
      active: () => request('/api/admin/wash-services/active'),
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
      active: () => request('/api/promotions/active'),
      create: (payload) => request('/api/promotions', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/promotions/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/api/promotions/${id}`, { method: 'DELETE' })
    },
    rewards: {
      getAll: () => request('/api/rewards/admin/all'),
      catalog: () => request('/api/rewards/customer/catalog'),
      history: (customerId) => request(`/api/rewards/customer/history/${customerId}`),
      unused: (customerId) => request(`/api/rewards/customer/unused/${customerId}`),
      redeem: (payload) => request('/api/rewards/customer/redeem', { method: 'POST', body: payload }),
      create: (payload) => request('/api/rewards/admin/create', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/api/rewards/admin/update/${id}`, { method: 'PUT', body: payload }),
      delete: (id) => request(`/api/rewards/admin/delete/${id}`, { method: 'DELETE' })
    },
    bookings: {
      list: () => request('/api/v1/bookings'),
      availableSlots: (date, washServiceId) => request(`/api/v1/bookings/available-slots?date=${date}&washServiceId=${washServiceId}`),
      create: (payload) => request('/api/v1/bookings', { method: 'POST', body: payload }),
      confirmArrival: (id) => request(`/api/v1/bookings/${id}/confirm-arrival`, { method: 'PUT' }),
      complete: (id) => request(`/api/v1/bookings/${id}/complete`, { method: 'PUT' }),
      cancel: (id) => request(`/api/v1/bookings/${id}/cancel`, { method: 'PUT' }),
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
