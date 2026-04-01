// assets/js/booking-details.js

document.addEventListener('DOMContentLoaded', () => {
    const bookingId = localStorage.getItem('selectedBookingId');
    const allBookings = JSON.parse(localStorage.getItem('serviceHub_bookings')) || [];
    const booking = allBookings.find(b => b.bookingId === bookingId);

    if (!booking) {
        window.location.href = 'my-bookings.html';
        return;
    }

    // 1. POPULATE TEXT FIELDS
    document.getElementById('disp-title').innerText = booking.title || "Service Details";
    document.getElementById('disp-provider-name').innerText = booking.provider;
    document.getElementById('disp-address').innerText = booking.address || "No address provided";
    document.getElementById('disp-time').innerText = booking.time;

    // 2. THE NaN FIX (Safety logic to strip non-numeric characters)
    let rawPrice = booking.total;
    if (typeof rawPrice === 'string') {
        rawPrice = rawPrice.replace(/[^0-9.]/g, ''); // Removes $ or letters
    }
    const cleanPrice = parseFloat(rawPrice);
    
    document.getElementById('disp-total').innerText = isNaN(cleanPrice) ? "$0.00" : `$${cleanPrice.toFixed(2)}`;

    // 3. AVATAR & DATE LOGIC
    const avatarImg = document.getElementById('disp-provider-img');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider)}&background=random`;
    }

    const dateObj = new Date(booking.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('disp-date').innerText = formattedDate !== "Invalid Date" ? formattedDate : booking.date;

    // 4. STATUS STYLING
    const statusEl = document.getElementById('disp-status');
    const status = booking.status || 'Confirmed';
    statusEl.innerText = status;

    if (status === 'Confirmed') {
        statusEl.style.background = 'var(--green-bg)';
        statusEl.style.color = 'var(--green)';
    } else if (status === 'Completed') {
        statusEl.style.background = 'var(--blue-bg)';
        statusEl.style.color = 'var(--primary)';
    } else if (status === 'Cancelled') {
        statusEl.style.background = '#FEE2E2';
        statusEl.style.color = 'var(--red)';
    }
});