// customer/assets/js/cancel-booking.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const bookings = JSON.parse(localStorage.getItem("serviceHub_bookings")) || [];
  const selectedBookingId = localStorage.getItem("selectedBookingId") || localStorage.getItem("latestBookingId");
  const booking = Array.isArray(bookings)
    ? bookings.find((item) => item.bookingId === selectedBookingId) || bookings.find((item) => item.status === "Confirmed")
    : null;

  const form = document.getElementById("cancelBookingForm");
  const feedback = document.getElementById("cancelBookingMessage");

  function updateFeedback(message, tone) {
    if (!feedback || !app) return;
    app.setFormFeedback(feedback, message, tone);
  }

  function populateBooking() {
    if (!booking) {
      const container = document.querySelector(".cancel-container");
      if (container) {
        container.innerHTML = `
          <div class="cancel-card" style="text-align: center;">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 44px; color: var(--orange); margin-bottom: 16px;"></i>
            <h2 style="margin-bottom: 8px;">No booking available to cancel</h2>
            <p style="color: var(--text-mid); margin-bottom: 20px;">Select an upcoming booking first from My Bookings.</p>
            <a href="my-bookings.html" class="btn btn--primary">Back to My Bookings</a>
          </div>
        `;
      }
      return;
    }

    document.getElementById("cancelBookingTitle").textContent = booking.title;
    document.getElementById("cancelBookingDate").textContent = app.formatDisplayDate(booking.date);
    document.getElementById("cancelBookingTime").textContent = booking.time;
    document.getElementById("cancelBookingProvider").textContent = booking.provider;
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateFeedback("", "info");

      if (!booking) {
        updateFeedback("No booking is available to cancel.", "error");
        return;
      }

      const selectedReason = form.querySelector("input[name='cancel_reason']:checked");
      const comments = document.getElementById("cancelComments").value.trim();

      if (!selectedReason) {
        updateFeedback("Please choose a reason for cancellation.", "error");
        return;
      }

      if (selectedReason.value === "other" && comments.length < 10) {
        updateFeedback("Please add at least 10 characters when selecting Other.", "error");
        return;
      }

      const nextBookings = bookings.map((item) => {
        if (item.bookingId !== booking.bookingId) return item;
        return {
          ...item,
          status: "Cancelled",
          cancellationReason: selectedReason.value,
          cancellationNotes: comments,
          cancelledAt: new Date().toISOString()
        };
      });

      localStorage.setItem("serviceHub_bookings", JSON.stringify(nextBookings));
      localStorage.setItem("latestCancellationBookingId", booking.bookingId);
      localStorage.setItem("selectedBookingId", booking.bookingId);

      if (app) {
        app.addNotification(
          "Booking cancelled",
          `${booking.title} was cancelled successfully.`,
          { href: "cancellation-confirmed.html", icon: "fa-calendar-xmark", tone: "red" }
        );
      }

      window.location.href = "cancellation-confirmed.html";
    });
  }

  populateBooking();
});
