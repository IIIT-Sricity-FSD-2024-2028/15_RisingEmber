// customer/assets/js/cancellation-confirmed.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const bookings = app && typeof app.getCustomerBookings === "function"
    ? app.getCustomerBookings()
    : (JSON.parse(localStorage.getItem("serviceHub_bookings")) || []);
  const bookingId = localStorage.getItem("latestCancellationBookingId") || localStorage.getItem("selectedBookingId");
  const booking = Array.isArray(bookings)
    ? bookings.find((item) => item.bookingId === bookingId) || bookings.find((item) => item.status === "Cancelled")
    : null;

  const reasonLabels = {
    found_another: "Found another service provider",
    schedule_conflict: "Schedule conflict",
    price_too_high: "Price too high",
    no_longer_needed: "Service no longer needed",
    other: "Other"
  };

  if (!booking) {
    const container = document.querySelector(".status-container");
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px 24px; text-align: center;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 44px; color: var(--orange); margin-bottom: 16px;"></i>
          <h2 style="margin-bottom: 8px;">No recent cancellation found</h2>
          <p style="color: var(--text-mid); margin-bottom: 20px;">We could not find a cancelled booking to display right now.</p>
          <a href="my-bookings.html" class="btn btn--primary">Back to My Bookings</a>
        </div>
      `;
    }
    return;
  }

  document.getElementById("cancelledBookingId").textContent = booking.bookingId;
  document.getElementById("cancelledService").textContent = booking.title;
  document.getElementById("cancelledDate").textContent = app
    ? app.formatDisplayDate(booking.date)
    : booking.date;
  document.getElementById("cancelledReason").textContent = reasonLabels[booking.cancellationReason] || "Cancellation requested";
  document.getElementById("cancelledNotes").textContent = booking.cancellationNotes || "No additional notes were provided.";
});
