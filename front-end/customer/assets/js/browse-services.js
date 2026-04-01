// assets/js/browse-services.js

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('browse-services-grid');
    const searchInput = document.getElementById('browse-search');
    const categoryFilter = document.getElementById('browse-category');
    const sortFilter = document.getElementById('browse-sort');

    // Pull from our single source of truth (simulated backend)
    const allServices = JSON.parse(localStorage.getItem('serviceHub_services')) || [];

    // Check if the user was redirected here from the Dashboard search
    // (We will implement this handoff fully in a later step, but this preps it)
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('q') || '';
    if (initialSearch && searchInput) {
        searchInput.value = initialSearch;
    }

    // ==========================================
    // 1. MASTER RENDER FUNCTION (Filters & Sorts)
    // ==========================================
    function renderServices() {
        if (!grid) return;
        
        const query = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value.toLowerCase();
        const sortBy = sortFilter.value;

        // Step A: Filter by Search AND Category
        let filtered = allServices.filter(service => {
            const matchesSearch = !query || 
                                  service.title.toLowerCase().includes(query) || 
                                  service.category.toLowerCase().includes(query) || 
                                  service.description.toLowerCase().includes(query);
            
            const matchesCategory = category === 'all' || service.category.toLowerCase() === category;
            
            return matchesSearch && matchesCategory;
        });

        // Step B: Apply Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating; // Highest rating first
            return 0; // 'recommended' leaves it in default mock database order
        });

        grid.innerHTML = ''; // Clear current grid

        // Step C: Edge Case - No Results Found (Rule 9)
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);">
                    <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 40px; color: var(--text-soft); margin-bottom: 16px;"></i>
                    <h3 style="font-size: 1.2rem; color: var(--text-dark); margin-bottom: 8px;">No services found</h3>
                    <p style="color: var(--text-mid);">We couldn't find any services matching your current filters.</p>
                    <button class="btn btn--outline" style="margin-top: 16px;" onclick="document.getElementById('browse-search').value=''; document.getElementById('browse-category').value='all'; document.getElementById('browse-search').dispatchEvent(new Event('input'));">Clear Filters</button>
                </div>
            `;
            return;
        }

        // Step D: Render Cards
        filtered.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <div class="service-card__image">
                    <div class="service-badge" style="text-transform: capitalize;">${service.category}</div>
                    <img src="${service.image}" alt="${service.title}" style="height:180px; width:100%; object-fit:cover; border-bottom:1px solid var(--border);"/>
                </div>
                <div class="service-card__body" style="padding: 20px;">
                    <div class="service-card__header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <h3 class="service-title" style="font-size: 1.05rem; font-weight: 700; color: var(--text-dark); margin: 0; padding-right: 12px;">${service.title}</h3>
                        <div class="service-price" style="font-size: 1.1rem; font-weight: 800; color: var(--primary); text-align: right; flex-shrink: 0;">
                            $${service.price} <span style="display: block; font-size: 0.75rem; color: var(--text-soft); font-weight: 500;">/hour</span>
                        </div>
                    </div>
                    
                    <p class="service-desc" style="font-size: 0.85rem; color: var(--text-mid); line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${service.description}</p>
                    
                    <div class="service-card__meta" style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px dashed var(--border);">
                        <div class="meta-item" style="font-size: 0.8rem; color: var(--text-soft); font-weight: 500; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-star" style="color: var(--orange);"></i>
                            <span style="color: var(--text-dark); font-weight: 600;">${service.rating}</span> (${service.reviews})
                        </div>
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-mid);"><i class="fa-solid fa-shield-halved" style="color: var(--green); margin-right: 4px;"></i>Verified</span>
                    </div>
                </div>
                <div style="padding: 0 20px 20px;">
                    <button class="btn btn--primary btn--full btn-view-details" data-id="${service.id}">View Details</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Initial Load
    renderServices();

    // ==========================================
    // 2. EVENT LISTENERS (Instant Updates)
    // ==========================================
    if (searchInput) searchInput.addEventListener('input', renderServices);
    if (categoryFilter) categoryFilter.addEventListener('change', renderServices);
    if (sortFilter) sortFilter.addEventListener('change', renderServices);

    // ==========================================
    // 3. EVENT DELEGATION (Routing)
    // ==========================================
    if (grid) {
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-view-details');
            if (!btn) return;

            const serviceId = btn.getAttribute('data-id');
            // Store ID for the details page to pick up
            localStorage.setItem('selectedServiceId', serviceId);
            window.location.href = 'service-details.html';
        });
    }
});