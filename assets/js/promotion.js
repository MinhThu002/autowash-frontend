/* =========================================================================
   AUTOWASH API INTEGRATION: PROMOTIONS MODULE
   ========================================================================= */

function mapBackendPromoToFrontend(p) {
  let targetTier = 'all';
  if (p.minTierName) {
    const name = p.minTierName.toLowerCase();
    if (name.includes('silver')) targetTier = 'silver';
    else if (name.includes('gold')) targetTier = 'gold';
    else if (name.includes('platinum') || name.includes('diamond')) targetTier = 'platinum';
    else if (name.includes('member') || name.includes('bronze')) targetTier = 'member';
  }
  const discountType = p.discountAmount <= 100 ? 'percent' : 'fixed';
  return {
    id: String(p.promoId),
    name: p.promoName,
    description: p.description,
    discountType: discountType,
    discountValue: p.discountAmount,
    startDate: p.startDate,
    endDate: p.endDate,
    targetTier: targetTier,
    usageLimit: 999,
    usedCount: 0,
    status: p.isActive ? 'active' : 'inactive'
  };
}

function mapFrontendPromoToBackend(p) {
  let minTierId = null;
  if (p.targetTier === 'silver') minTierId = 2;
  else if (p.targetTier === 'gold') minTierId = 3;
  else if (p.targetTier === 'platinum') minTierId = 4;
  else if (p.targetTier === 'member') minTierId = 1;
  return {
    promoName: p.name,
    description: p.description,
    discountAmount: parseFloat(p.discountValue),
    startDate: p.startDate,
    endDate: p.endDate,
    isActive: p.status === 'active',
    minTierId: minTierId
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
