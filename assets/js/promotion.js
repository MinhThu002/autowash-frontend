/* =========================================================================
   AUTOWASH API INTEGRATION: PROMOTIONS MODULE
   ========================================================================= */

function mapBackendPromoToFrontend(p) {
  const discountType = p.discountAmount <= 100 ? 'percent' : 'fixed';
  return {
    id: String(p.promoId),
    name: p.promoName,
    description: p.description,
    discountType: discountType,
    discountValue: p.discountAmount,
    startDate: p.startDate,
    endDate: p.endDate,
    targetTier: p.minTierId ? String(p.minTierId) : 'all',
    usageLimit: 999,
    usedCount: 0,
    status: p.isActive ? 'active' : 'inactive'
  };
}

function mapFrontendPromoToBackend(p) {
  return {
    promoName: p.name,
    description: p.description,
    discountAmount: parseFloat(p.discountValue),
    startDate: p.startDate,
    endDate: p.endDate,
    isActive: p.status === 'active',
    minTierId: p.targetTier === 'all' || !p.targetTier ? null : Number(p.targetTier)
  };
}

async function syncPromotionsFromServer() {
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
    
    const endpoint = isManager ? '/api/promotions' : '/api/promotions/active';
    const res = await fetch(endpoint);
    if (res.ok) {
      const backendPromos = await res.json();
      const promoList = Array.isArray(backendPromos) ? backendPromos : (backendPromos.value || []);
      const promotions = promoList.map(mapBackendPromoToFrontend);
      localStorage.setItem('autowash_promotions', JSON.stringify(promotions));
      
      const page = document.body.dataset.page;
      if (page === 'promotions') {
        const grid = document.getElementById('promotionsGrid');
        if (grid) {
          grid.innerHTML = '';
          if (typeof renderPromotionsPage === 'function') renderPromotionsPage();
        }
      } else if (page === 'admin-promotions') {
        const tbody = document.querySelector('#promotionsTable tbody');
        if (tbody) {
          tbody.innerHTML = '';
          if (typeof renderAdminPromotions === 'function') renderAdminPromotions();
        }
      }
    }
  } catch (e) {
    console.warn('Backend server not reachable, using offline promotions.', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  syncPromotionsFromServer();
});
