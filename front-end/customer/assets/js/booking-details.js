// customer/assets/js/booking-details.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const bookingId = localStorage.getItem("selectedBookingId") || localStorage.getItem("latestBookingId");
  const bookings = app && typeof app.getCustomerBookings === "function"
    ? app.getCustomerBookings()
    : (JSON.parse(localStorage.getItem("serviceHub_bookings")) || []);
  const booking = Array.isArray(bookings)
    ? bookings.find((item) => item.bookingId === bookingId) || null
    : null;

  if (!booking) {
    window.location.href = "my-bookings.html";
    return;
  }

  document.getElementById("disp-title").innerText = booking.title || "Service Details";
  document.getElementById("disp-provider-name").innerText = booking.provider || "Service Professional";
  document.getElementById("disp-address").innerText = booking.address || "No address provided";
  document.getElementById("disp-time").innerText = booking.time || "Time not set";
  document.getElementById("disp-total").innerText = `$${Number(booking.total || 0).toFixed(2)}`;

  const avatarImg = document.getElementById("disp-provider-img");
  if (avatarImg) {
    avatarImg.src = app
      ? app.buildAvatarUrl(booking.provider, booking.providerImage)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider || "Provider")}&background=2F54EB&color=fff`;
  }

  document.getElementById("disp-date").innerText = app
    ? app.formatDisplayDate(booking.date)
    : booking.date;

  const statusEl = document.getElementById("disp-status");
  const status = booking.status || "Confirmed";
  statusEl.innerText = status;

  if (status === "Confirmed") {
    statusEl.style.background = "var(--green-bg)";
    statusEl.style.color = "var(--green)";
  } else if (status === "Completed") {
    statusEl.style.background = "var(--blue-bg)";
    statusEl.style.color = "var(--primary)";
  } else if (status === "Cancelled") {
    statusEl.style.background = "#FEE2E2";
    statusEl.style.color = "var(--red)";
  }
});
