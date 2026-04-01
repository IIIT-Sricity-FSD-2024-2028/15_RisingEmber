// assets/js/customer-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const servicesGrid = document.getElementById('dashboard-services-grid');
    const navSearch = document.getElementById('nav-search');
    const bannerSearch = document.getElementById('banner-search');
    const sectionTitle = document.getElementById('services-section-title');

    // Fetch the mock database initialized in mockData.js
    const allServices = JSON.parse(localStorage.getItem('serviceHub_services')) || [];

    // ==========================================
    // 1. DYNAMIC RENDERING & INSTANT FILTERING
    // ==========================================
    function renderServices(searchQuery = '') {
        if (!servicesGrid) return;
        servicesGrid.innerHTML = ''; // Clear grid

        const query = searchQuery.toLowerCase().trim();

        // Filter based on name, category, or description (keywords)
        let filtered = allServices.filter(service => {
            if (!query) return true;
            return service.title.toLowerCase().includes(query) ||
                   service.category.toLowerCase().includes(query) ||
                   service.description.toLowerCase().includes(query);
        });

        // UI Logic: If no search, show top 3. If searching, show all matches.
        if (!query) {
            filtered = filtered.slice(0, 3); // Just show recommended
            if (sectionTitle) sectionTitle.innerText = "Recommended Services";
        } else {
            if (sectionTitle) sectionTitle.innerText = `Search Results for "${searchQuery}"`;
        }

        // Empty State Handling
        if (filtered.length === 0) {
            servicesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-soft);">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>No services found matching "${searchQuery}".</p>
                </div>`;
            return;
        }

        // Render matching cards dynamically
        filtered.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <div class="service-card__image">
                    <img src="${service.image}" alt="${service.title}" style="height:180px; width:100%; object-fit:cover; border-bottom:1px solid var(--border);"/>
                </div>
                <div class="service-card__body" style="padding: 20px;">
                    <h3 class="service-title" style="margin-bottom: 8px; font-size: 1.05rem; font-weight: 700; color: var(--text-dark);">${service.title}</h3>
                    <div class="meta-item" style="margin-bottom: 8px; font-size: 0.8rem; color: var(--text-soft); font-weight: 500;">
                        <i class="fa-solid fa-star" style="color: var(--orange);"></i>
                        <span style="color: var(--text-mid); margin-left: 4px;">${service.rating} (${service.reviews} reviews)</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-soft); font-weight: 500;">From $${service.price}/hour</p>
                </div>
                <div style="padding: 0 20px 20px;">
                    <button class="btn btn--primary btn--full btn-book-now" 
                            data-id="${service.id}" 
                            data-name="${service.title}" 
                            data-provider="${service.providerName}" 
                            data-price="${service.price}">
                        Book Now
                    </button>
                </div>
            `;
            servicesGrid.appendChild(card);
        });
    }

    // Initial render of recommended services
    renderServices();

    // ==========================================
    // 2. SEARCH EVENT LISTENERS (NO RELOAD)
    // ==========================================
    function handleSearchInput(e) {
        const val = e.target.value;
        // Keep both search bars synced if user types in one
        if (navSearch && e.target !== navSearch) navSearch.value = val;
        if (bannerSearch && e.target !== bannerSearch) bannerSearch.value = val;
        
        renderServices(val); // Instantly update UI
    }

    if (navSearch) navSearch.addEventListener('input', handleSearchInput);
    if (bannerSearch) bannerSearch.addEventListener('input', handleSearchInput);

    // ==========================================
    // 3. EVENT DELEGATION FOR 'BOOK NOW'
    // ==========================================
    if (servicesGrid) {
        servicesGrid.addEventListener('click', (e) => {
            const bookBtn = e.target.closest('.btn-book-now');
            if (!bookBtn) return; // If clicked outside a button, ignore

            // Extract specific service data dynamically
            const serviceData = {
                id: bookBtn.getAttribute('data-id'),
                name: bookBtn.getAttribute('data-name'),
                provider: bookBtn.getAttribute('data-provider'),
                price: bookBtn.getAttribute('data-price')
            };

            // Store ID for standard routing
            localStorage.setItem('selectedServiceId', serviceData.id);
            
            // Store full explicitly requested data payload
            localStorage.setItem('selectedServiceDetails', JSON.stringify(serviceData));

            // Redirect dynamically
            window.location.href = 'service-details.html';
        });
    }
});