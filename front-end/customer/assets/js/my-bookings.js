// customer/assets/js/my-bookings.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const bookingsGrid = document.getElementById("bookings-grid");
  const tabs = document.querySelectorAll(".tab-pill");

  let allBookings = JSON.parse(localStorage.getItem("serviceHub_bookings")) || [];
  if (!Array.isArray(allBookings)) {
    allBookings = [];
  }

  allBookings = allBookings.slice().sort((left, right) => {
    return new Date(right.date || 0) - new Date(left.date || 0);
  });

  function getIconDetails(title) {
    const value = String(title || "").toLowerCase();
    if (value.includes("plumb")) return { icon: "fa-wrench", css: "provider-icon--blue" };
    if (value.includes("elect")) return { icon: "fa-bolt", css: "provider-icon--orange" };
    if (value.includes("clean")) return { icon: "fa-broom", css: "provider-icon--purple" };
    if (value.includes("appliance")) return { icon: "fa-screwdriver-wrench", css: "provider-icon--red" };
    if (value.includes("carpent")) return { icon: "fa-hammer", css: "provider-icon--green" };
    if (value.includes("paint")) return { icon: "fa-paint-roller", css: "" };
    return { icon: "fa-house-chimney-user", css: "provider-icon--blue" };
  }

  function getStatusConfig(status) {
    if (status === "Completed") return { label: "Completed", className: "status--completed" };
    if (status === "Cancelled") return { label: "Cancelled", className: "status--cancelled" };
    return { label: "Upcoming", className: "status--confirmed" };
  }

  function render(filter) {
    if (!bookingsGrid) return;

    bookingsGrid.innerHTML = "";
    const activeFilter = filter || "all";

    const filteredBookings = allBookings.filter((booking) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "upcoming") return booking.status === "Confirmed";
      return String(booking.status || "").toLowerCase() === activeFilter;
    });

    if (!filteredBookings.length) {
      bookingsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 40px 24px; text-align: center;">
          <i class="fa-regular fa-calendar-xmark" style="font-size: 36px; color: var(--text-soft); margin-bottom: 14px;"></i>
          <h3 style="font-size: 1.1rem; color: var(--text-dark); margin-bottom: 8px;">No bookings in this view</h3>
          <p style="color: var(--text-mid);">Try another filter or book a new service from Browse Services.</p>
        </div>
      `;
      return;
    }

    filteredBookings.forEach((booking) => {
      const visual = getIconDetails(booking.title);
      const statusConfig = getStatusConfig(booking.status);
      const formattedDate = app
        ? app.formatDisplayDate(booking.date, { month: "short", day: "numeric", year: "numeric" })
        : booking.date;

      const card = document.createElement("div");
      card.className = "booking-card";
      card.innerHTML = `
        <div class="booking-card__header">
          <div class="booking-provider">
            <div class="provider-icon ${visual.css}">
              <i class="fa-solid ${visual.icon}"></i>
            </div>
            <div class="provider-info">
              <h3>${booking.title}</h3>
              <span>${booking.provider}</span>
            </div>
          </div>
          <span class="booking-status ${statusConfig.className}">${statusConfig.label}</span>
        </div>
        <div class="booking-details">
          <p><i class="fa-solid fa-calendar-day"></i> ${formattedDate}</p>
          <p><i class="fa-regular fa-clock"></i> ${booking.time}</p>
          <p><i class="fa-solid fa-location-dot"></i> ${booking.address || "Address not provided"}</p>
        </div>
        <div class="booking-actions">
          <button class="btn btn--primary btn-view" data-id="${booking.bookingId}">View Details</button>
          ${
            booking.status === "Confirmed"
              ? `<button class="btn btn-report btn-cancel" data-id="${booking.bookingId}">Cancel Booking</button>`
              : booking.status === "Completed"
                ? `<button class="btn btn-report btn-report-issue" data-id="${booking.bookingId}">Report Issue</button>`
                : ""
          }
        </div>
      `;

      bookingsGrid.appendChild(card);
    });
  }

  if (bookingsGrid) {
    bookingsGrid.addEventListener("click", (event) => {
      const viewButton = event.target.closest(".btn-view");
      const cancelButton = event.target.closest(".btn-cancel");
      const reportButton = event.target.closest(".btn-report-issue");

      if (viewButton) {
        localStorage.setItem("selectedBookingId", viewButton.getAttribute("data-id"));
        window.location.href = "booking-details.html";
        return;
      }

      if (cancelButton) {
        localStorage.setItem("selectedBookingId", cancelButton.getAttribute("data-id"));
        window.location.href = "cancel-booking.html";
        return;
      }

      if (reportButton) {
        const bookingId = reportButton.getAttribute("data-id");
        const booking = allBookings.find((item) => item.bookingId === bookingId);
        if (booking) {
          localStorage.setItem("selectedBookingId", bookingId);
          localStorage.setItem("pendingDisputeContext", JSON.stringify(booking));
          window.location.href = "raise-dispute.html";
        }
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((button) => button.classList.remove("active"));
      tab.classList.add("active");
      render(tab.dataset.filter || "all");
    });
  });

  render("all");
});
