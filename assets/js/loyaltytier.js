/* =========================================================================
   AUTOWASH API INTEGRATION: LOYALTY TIERS MODULE
   ========================================================================= */

function mapBackendTierToFrontend(t) {
  return {
    id: String(t.tierId || t.id || ''),
    tierId: t.tierId || t.id,
    name: t.tierName || t.name,
    minSpending: Number(t.minSpending ?? t.requiredSpending ?? 0),
    minVisits: Number(t.minVisits ?? t.requiredVisits ?? 0),
    pointMultiplier: Number(t.pointMultiplier || t.pointRate || 1),
    bookingWindowDays: Number(t.bookingWindowDays || t.bookingWindow || 7),
    priorityLevel: Number(t.priorityLevel ?? 1),
    discountPercent: Number(t.discountPercent ?? 0),
    isActive: t.isActive ?? t.active ?? true
  };
}

function mapFrontendTierToBackend(t) {
  return {
    tierName: t.name || t.tierName,
    minSpending: Number(t.minSpending),
    minVisits: Number(t.minVisits),
    pointMultiplier: Number(t.pointMultiplier),
    bookingWindowDays: Number(t.bookingWindowDays),
    priorityLevel: Number(t.priorityLevel),
    discountPercent: Number(t.discountPercent),
    isActive: t.isActive ?? true
  };
}

async function syncLoyaltyTiersFromServer() {
  try {
    const storedUser = localStorage.getItem('autowash_user');
    let isManager = false;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin') {
          isManager = true;
        }
      } catch (e) {}
    }

    const endpoint = isManager ? '/api/loyalty-tiers' : '/api/loyalty-tiers/active';
    const res = await fetch(endpoint);
    if (res.ok) {
      const backendTiers = await res.json();
      const tierList = Array.isArray(backendTiers) ? backendTiers : (backendTiers.value || []);
      const frontendTiers = tierList.map(mapBackendTierToFrontend);
      
      // Save to localStorage as a cache
      localStorage.setItem('autowash_loyaltyTiers', JSON.stringify(frontendTiers));
      
      // Update global MOCK_DATA cache so current functions pick it up dynamically
      if (typeof MOCK_DATA !== 'undefined') {
        MOCK_DATA.loyaltyTiers = frontendTiers;
      }

      // Re-render logic depending on current page
      const page = document.body.dataset.page;
      if (page === 'admin-loyalty-tiers') {
        const tbody = document.querySelector('#tiersTable tbody');
        if (tbody) {
          tbody.innerHTML = '';
          if (typeof renderAdminTiers === 'function') renderAdminTiers();
        }
      } else if (page === 'loyalty') {
        if (typeof renderLoyaltyPage === 'function') {
          const container = document.getElementById('loyaltyTierName');
          if (container) {
            location.reload();
          }
        }
      }
    }
  } catch (e) {
    console.warn('Backend server not reachable, using offline loyalty tiers.', e);
  }
}

function openAddLoyaltyTier() {
  const form = document.getElementById('tierForm');
  if (form) form.reset();
  const idInput = document.getElementById('tierId');
  if (idInput) {
    idInput.value = '';
  }
  openModal('tierModal');
}

function editLoyaltyTier(id) {
  const tier = MOCK_DATA.loyaltyTiers.find(t => String(t.id || t.tierId) === String(id));
  if (!tier) return;

  const idInput = document.getElementById('tierId');
  if (idInput) {
    idInput.value = tier.tierId || tier.id || '';
  }
  
  const nameInput = document.getElementById('tierName');
  if (nameInput) nameInput.value = tier.name || tier.tierName || '';

  const minSpendingInput = document.getElementById('tierMinSpending');
  if (minSpendingInput) minSpendingInput.value = tier.minSpending ?? tier.requiredSpending ?? 0;

  const minVisitsInput = document.getElementById('tierMinVisits');
  if (minVisitsInput) minVisitsInput.value = tier.minVisits ?? tier.requiredVisits ?? 0;

  const pointMultiplierInput = document.getElementById('tierPointMultiplier');
  if (pointMultiplierInput) pointMultiplierInput.value = tier.pointMultiplier ?? tier.pointRate ?? 1;

  const bookingWindowDaysInput = document.getElementById('tierBookingWindowDays');
  if (bookingWindowDaysInput) bookingWindowDaysInput.value = tier.bookingWindowDays ?? tier.bookingWindow ?? 7;

  const discountPercentInput = document.getElementById('tierDiscountPercent');
  if (discountPercentInput) discountPercentInput.value = tier.discountPercent ?? 0;

  const priorityLevelInput = document.getElementById('tierPriorityLevel');
  if (priorityLevelInput) priorityLevelInput.value = tier.priorityLevel ?? 1;

  const statusInput = document.getElementById('tierIsActive');
  if (statusInput) {
    const activeStatus = tier.isActive ?? tier.active ?? true;
    statusInput.value = activeStatus ? 'active' : 'inactive';
  }

  openModal('tierModal');
}

async function deleteLoyaltyTier(id) {
  if (!confirm('Bạn có chắc muốn xóa hạng thành viên này?')) return;

  try {
    const res = await fetch(`/api/loyalty-tiers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      let errorMsg = 'Lỗi khi xóa hạng thành viên trên server.';
      try {
        const errData = await res.json();
        if (errData.message) errorMsg = errData.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn('Backend offline, running fallback to offline storage.', err);
    } else {
      alert('Lỗi: ' + err.message);
      return;
    }
  }

  // Fallback / sync local storage
  MOCK_DATA.loyaltyTiers = MOCK_DATA.loyaltyTiers.map(t => {
    if (String(t.id || t.tierId) === String(id)) {
      return { ...t, isActive: false, active: false };
    }
    return t;
  });
  localStorage.setItem('autowash_loyaltyTiers', JSON.stringify(MOCK_DATA.loyaltyTiers));
  showToast('Đã dừng hoạt động hạng thành viên!');
  if (typeof renderAdminTiers === 'function') renderAdminTiers();
}

async function saveLoyaltyTier(e) {
  e.preventDefault();

  const id = document.getElementById('tierId').value;
  const data = {
    id: id ? Number(id) : null,
    tierId: id ? Number(id) : null,
    name: document.getElementById('tierName').value.trim(),
    minSpending: parseFloat(document.getElementById('tierMinSpending').value),
    minVisits: parseInt(document.getElementById('tierMinVisits').value),
    pointMultiplier: parseFloat(document.getElementById('tierPointMultiplier').value),
    bookingWindowDays: parseInt(document.getElementById('tierBookingWindowDays').value),
    discountPercent: parseInt(document.getElementById('tierDiscountPercent').value),
    priorityLevel: parseInt(document.getElementById('tierPriorityLevel').value),
    isActive: document.getElementById('tierIsActive').value === 'active'
  };

  const isExisting = id ? true : false;

  let savedResponse = null;
  try {
    const url = isExisting ? `/api/loyalty-tiers/${id}` : '/api/loyalty-tiers';
    const method = isExisting ? 'PUT' : 'POST';
    const backendData = mapFrontendTierToBackend(data);
    if (isExisting) {
      backendData.tierId = Number(id);
    }

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData)
    });

    if (!res.ok) {
      let errorMsg = 'Lỗi lưu thông tin lên database.';
      try {
        const errData = await res.json();
        if (errData.message) errorMsg = errData.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    try {
      savedResponse = await res.json();
    } catch (e) {}
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn('Backend API offline, using localStorage fallback', err);
    } else {
      alert('Không thể lưu vào database:\n' + err.message);
      return;
    }
  }

  // Update MOCK_DATA and localStorage offline fallback
  if (savedResponse) {
    const mapped = mapBackendTierToFrontend(savedResponse);
    if (isExisting) {
      MOCK_DATA.loyaltyTiers = MOCK_DATA.loyaltyTiers.map(t => String(t.id || t.tierId) === String(id) ? mapped : t);
    } else {
      MOCK_DATA.loyaltyTiers.push(mapped);
    }
  } else {
    if (isExisting) {
      MOCK_DATA.loyaltyTiers = MOCK_DATA.loyaltyTiers.map(t => String(t.id || t.tierId) === String(id) ? { ...t, ...data } : t);
    } else {
      data.id = String(Date.now());
      data.tierId = Date.now();
      MOCK_DATA.loyaltyTiers.push(data);
    }
  }
  localStorage.setItem('autowash_loyaltyTiers', JSON.stringify(MOCK_DATA.loyaltyTiers));
  
  closeModal('tierModal');
  showToast('Lưu hạng thành viên thành công!');
  if (typeof renderAdminTiers === 'function') renderAdminTiers();
}

document.addEventListener('DOMContentLoaded', () => {
  syncLoyaltyTiersFromServer();
});
