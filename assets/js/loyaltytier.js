/* =========================================================================
   AUTOWASH API INTEGRATION: LOYALTY TIERS MODULE
   ========================================================================= */

function mapBackendTierToFrontend(t) {
  let benefits = [];
  if (Array.isArray(t.benefits)) {
    benefits = t.benefits;
  } else if (typeof t.benefits === 'string') {
    benefits = t.benefits.split(',').map(b => b.trim()).filter(Boolean);
  }
  return {
    id: t.id || String(t.tierName || t.name || '').toLowerCase(),
    name: t.tierName || t.name,
    requiredVisits: Number(t.requiredVisits ?? 0),
    requiredSpending: Number(t.requiredSpending ?? 0),
    pointRate: Number(t.pointMultiplier || t.pointRate || 1),
    bookingWindow: Number(t.bookingWindowDays || t.bookingWindow || 7),
    discountPercent: Number(t.discountPercent ?? 0),
    benefits: benefits,
    isActive: t.isActive ?? t.active ?? true
  };
}

function mapFrontendTierToBackend(t) {
  return {
    tierName: t.name,
    requiredVisits: t.requiredVisits,
    requiredSpending: t.requiredSpending,
    pointMultiplier: t.pointRate,
    bookingWindowDays: t.bookingWindow,
    discountPercent: t.discountPercent,
    benefits: Array.isArray(t.benefits) ? t.benefits.join(', ') : (t.benefits || ''),
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
    idInput.readOnly = false;
    idInput.placeholder = "Ví dụ: silver, gold, vip";
  }
  openModal('tierModal');
}

function editLoyaltyTier(id) {
  const tier = MOCK_DATA.loyaltyTiers.find(t => t.id === id);
  if (!tier) return;

  const idInput = document.getElementById('tierId');
  if (idInput) {
    idInput.value = tier.id;
    idInput.readOnly = true;
  }
  
  const nameInput = document.getElementById('tierName');
  if (nameInput) nameInput.value = tier.name;

  const visitsInput = document.getElementById('tierRequiredVisits');
  if (visitsInput) visitsInput.value = tier.requiredVisits;

  const spendingInput = document.getElementById('tierRequiredSpending');
  if (spendingInput) spendingInput.value = tier.requiredSpending;

  const pointRateInput = document.getElementById('tierPointRate');
  if (pointRateInput) pointRateInput.value = tier.pointRate;

  const windowInput = document.getElementById('tierBookingWindow');
  if (windowInput) windowInput.value = tier.bookingWindow;

  const discountInput = document.getElementById('tierDiscountPercent');
  if (discountInput) discountInput.value = tier.discountPercent;

  const benefitsInput = document.getElementById('tierBenefits');
  if (benefitsInput) {
    benefitsInput.value = Array.isArray(tier.benefits) ? tier.benefits.join(', ') : (tier.benefits || '');
  }

  const statusInput = document.getElementById('tierStatus');
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
    if (t.id === id) {
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

  const id = document.getElementById('tierId').value.trim().toLowerCase();
  const data = {
    id: id,
    name: document.getElementById('tierName').value.trim(),
    requiredVisits: parseInt(document.getElementById('tierRequiredVisits').value),
    requiredSpending: parseInt(document.getElementById('tierRequiredSpending').value),
    pointRate: parseFloat(document.getElementById('tierPointRate').value),
    bookingWindow: parseInt(document.getElementById('tierBookingWindow').value),
    discountPercent: parseInt(document.getElementById('tierDiscountPercent').value),
    benefits: document.getElementById('tierBenefits').value.split(',').map(b => b.trim()).filter(Boolean),
    isActive: document.getElementById('tierStatus').value === 'active'
  };

  const isExisting = MOCK_DATA.loyaltyTiers.some(t => t.id === id);

  try {
    const url = isExisting ? `/api/loyalty-tiers/${id}` : '/api/loyalty-tiers';
    const method = isExisting ? 'PUT' : 'POST';
    const backendData = mapFrontendTierToBackend(data);
    // Include id for PUT request if required by backend, or let endpoint resolve it
    if (isExisting) {
      backendData.id = id;
    } else {
      backendData.id = id; // Add ID to creation payload if backend expects it
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
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn('Backend API offline, using localStorage fallback', err);
    } else {
      alert('Không thể lưu vào database:\n' + err.message);
      return;
    }
  }

  // Update MOCK_DATA and localStorage
  if (isExisting) {
    MOCK_DATA.loyaltyTiers = MOCK_DATA.loyaltyTiers.map(t => t.id === id ? { ...t, ...data } : t);
  } else {
    MOCK_DATA.loyaltyTiers.push(data);
  }
  localStorage.setItem('autowash_loyaltyTiers', JSON.stringify(MOCK_DATA.loyaltyTiers));
  
  closeModal('tierModal');
  showToast('Lưu hạng thành viên thành công!');
  if (typeof renderAdminTiers === 'function') renderAdminTiers();
}

document.addEventListener('DOMContentLoaded', () => {
  syncLoyaltyTiersFromServer();
});
