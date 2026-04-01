// customer/assets/js/booking-confirmation.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const latestBookingId = localStorage.getItem("latestBookingId") || localStorage.getItem("selectedBookingId");
  const bookings = app && typeof app.getCustomerBookings === "function"
    ? app.getCustomerBookings()
    : (JSON.parse(localStorage.getItem("serviceHub_bookings")) || []);
  const booking = Array.isArray(bookings)
    ? bookings.find((item) => item.bookingId === latestBookingId)
    : null;

  if (!booking) {
    const container = document.querySelector(".status-container");
    if (container) {
      container.innerHTML = `
        <div style="padding: 60px; text-align: center;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 48px; color: var(--orange); margin-bottom: 16px;"></i>
          <h2>No recent booking found</h2>
          <p style="color: var(--text-mid); margin-bottom: 24px;">We could not locate a booking confirmation to display right now.</p>
          <a href="customer_dashboard.html" class="btn btn--primary">Return to Dashboard</a>
        </div>
      `;
    }
    return;
  }

  document.getElementById("confirmId").textContent = booking.bookingId;
  document.getElementById("confirmDate").textContent = app
    ? app.formatDisplayDate(booking.date)
    : booking.date;
  document.getElementById("confirmTime").textContent = booking.time;
  document.getElementById("confirmService").textContent = booking.title;
  document.getElementById("confirmProvider").textContent = booking.provider;
  document.getElementById("confirmAddress").textContent = booking.address || "Address not provided";
  document.getElementById("confirmTotal").textContent = `$${Number(booking.total || 0).toFixed(2)}`;

  const providerImage = document.getElementById("confirmProviderImg");
  if (providerImage) {
    providerImage.src = app
      ? app.buildAvatarUrl(booking.provider, booking.providerImage)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider)}&background=2F54EB&color=fff`;
  }
});
