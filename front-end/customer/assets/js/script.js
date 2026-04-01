// script.js - Master Logic for Customer Portal

document.addEventListener('DOMContentLoaded', () => {
    // Router: Initialize page-specific logic
    if (document.querySelector('.services-grid') && !document.querySelector('.recommended-services')) initBrowseServices();
    if (document.querySelector('.details-layout')) initServiceDetails();
    if (document.querySelector('.checkout-grid')) initCheckout();
    if (document.querySelector('.bookings-grid')) initMyBookings();
    if (document.querySelector('.status-title')?.innerText.includes('Confirmed')) initBookingConfirmation();
});

// --- 1. BROWSE SERVICES (READ) ---
function initBrowseServices() {
    const grid = document.querySelector('.services-grid');
    const services = JSON.parse(localStorage.getItem('serviceHub_services')) || [];
    if (!grid) return;
    grid.innerHTML = ''; 

    services.forEach(s => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <img src="${s.image}" style="height:180px; width:100%; object-fit:cover;">
            <div class="service-card__body">
                <h3 class="service-title">${s.title}</h3>
                <p class="service-desc">${s.description}</p>
                <div class="service-footer">
                    <span class="service-price">$${s.price}/hr</span>
                    <button class="btn btn--primary" onclick="viewServiceDetails('${s.id}')">View Details</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

window.viewServiceDetails = (id) => {
    localStorage.setItem('selectedServiceId', id);
    window.location.href = 'service-details.html';
};

// --- 2. SERVICE DETAILS (STATE MANAGEMENT) ---
function initServiceDetails() {
    const id = localStorage.getItem('selectedServiceId');
    const services = JSON.parse(localStorage.getItem('serviceHub_services')) || [];
    const s = services.find(item => item.id === id);
    if (!s) return;

    // Map Data to UI
    document.querySelector('.header-row h1').innerText = s.title;
    document.querySelector('.amount').innerText = `$${s.price}`;
    document.querySelector('.hero-image').src = s.image;
    document.querySelector('.provider-info strong').innerText = s.providerName;

    // Time Slot Selection UI
    document.querySelectorAll('.time-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Capture selection and move to checkout
    document.querySelector('.booking-widget .btn--primary').addEventListener('click', () => {
        const selectedTimeBtn = document.querySelector('.time-btn.active');
        const pending = {
            id: s.id, 
            title: s.title, 
            provider: s.providerName, 
            price: s.price,
            image: s.image,
            date: document.querySelector('.widget-input[type="date"]').value,
            time: selectedTimeBtn ? selectedTimeBtn.innerText.trim() : "09:00 AM"
        };
        localStorage.setItem('pendingBooking', JSON.stringify(pending));
        window.location.href = 'book-service.html';
    });
}

// --- 3. CHECKOUT (CREATE & VALIDATE) ---
function initCheckout() {
    const pending = JSON.parse(localStorage.getItem('pendingBooking'));
    if (!pending) return;

    // Sync State to UI
    document.getElementById('serviceTitle').innerText = pending.title;
    document.getElementById('providerName').innerText = pending.provider;
    document.getElementById('serviceRate').innerHTML = `$${pending.price} <span>/hour</span>`;
    document.getElementById('serviceHero').src = pending.image;
    document.getElementById('bookingDate').value = pending.date;
    
    // FIX: Match saved time string to dropdown value (normalization)
    const timeSelect = document.getElementById('bookingTime');
    if (timeSelect) {
        const savedTime = pending.time.trim();
        let matchFound = false;
        Array.from(timeSelect.options).forEach((opt) => {
            if (opt.value.trim() === savedTime || opt.text.trim() === savedTime) {
                timeSelect.value = opt.value;
                matchFound = true;
            }
        });
    }

    // Payment Selection Logic
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });

    // Calculations
    const subtotal = pending.price * 2;
    const fee = subtotal * 0.05;
    const total = subtotal + fee;
    document.getElementById('summaryPrice').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('summaryFee').innerText = `$${fee.toFixed(2)}`;
    document.getElementById('summaryTotal').innerText = `$${total.toFixed(2)}`;

    // Submit & Validation (Rule 5)
    document.getElementById('confirmBookingBtn').addEventListener('click', () => {
        const addr = document.getElementById('serviceAddress').value;
        const err = document.getElementById('addressError');
        
        if (!addr.trim()) {
            err.style.display = 'block';
            return;
        }
        err.style.display = 'none';

        // CRUD: CREATE
        const bookings = JSON.parse(localStorage.getItem('serviceHub_bookings')) || [];
        const newEntry = {
            ...pending, 
            address: addr, 
            total: total, 
            bookingId: 'BK-' + Math.floor(Math.random()*9000 + 1000), 
            status: 'Confirmed'
        };
        bookings.unshift(newEntry);
        localStorage.setItem('serviceHub_bookings', JSON.stringify(bookings));
        localStorage.setItem('latestBookingId', newEntry.bookingId);
        window.location.href = 'booking-confirmation.html';
    });
}

// --- 4. MY BOOKINGS (READ & UPDATE) ---
function initMyBookings() {
    const grid = document.querySelector('.bookings-grid');
    const bookings = JSON.parse(localStorage.getItem('serviceHub_bookings')) || [];
    if (!grid) return;
    if (!bookings.length) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-soft);">No bookings found.</p>`;
        return;
    }

    grid.innerHTML = '';
    bookings.forEach(b => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.innerHTML = `
            <div class="booking-card__header">
                <div class="booking-provider">
                    <div class="provider-icon ${b.status === 'Cancelled' ? 'provider-icon--red' : 'provider-icon--blue'}">
                        <i class="fa-solid ${b.status === 'Cancelled' ? 'fa-xmark' : 'fa-wrench'}"></i>
                    </div>
                    <div class="provider-info">
                        <h3>${b.title}</h3>
                        <span>${b.provider}</span>
                    </div>
                </div>
                <span class="status ${b.status === 'Cancelled' ? 'status--cancelled' : 'status--confirmed'}">${b.status}</span>
            </div>
            <div class="booking-details" style="margin-top:10px;">
                <p><i class="fa-solid fa-calendar-day"></i> ${b.date}</p>
                <p><i class="fa-regular fa-clock"></i> ${b.time}</p>
            </div>
            <div class="booking-actions" style="margin-top:20px; display:flex; gap:12px;">
                <button class="btn btn--primary" style="flex:1;">View Details</button>
                ${b.status === 'Confirmed' ? `<button class="btn btn-report" onclick="cancelBooking('${b.bookingId}')">Cancel</button>` : ''}
            </div>`;
        grid.appendChild(card);
    });
}

window.cancelBooking = (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const db = JSON.parse(localStorage.getItem('serviceHub_bookings'));
    const item = db.find(i => i.bookingId === id);
    if (item) item.status = 'Cancelled';
    localStorage.setItem('serviceHub_bookings', JSON.stringify(db));
    window.location.reload();
};

function initBookingConfirmation() {
    const latestId = localStorage.getItem('latestBookingId');
    const el = document.querySelector('.detail-value');
    if (latestId && el) el.innerText = latestId;
}