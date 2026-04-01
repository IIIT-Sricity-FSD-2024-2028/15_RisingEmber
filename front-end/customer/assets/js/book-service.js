// customer/assets/js/book-service.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const pendingBooking = app && typeof app.readJSON === "function"
    ? app.readJSON("pendingBooking", null)
    : (() => {
        try {
          return JSON.parse(localStorage.getItem("pendingBooking") || "null");
        } catch (error) {
          return null;
        }
      })();
  const confirmButton = document.getElementById("confirmBookingBtn");

  if (!pendingBooking || !pendingBooking.id || !pendingBooking.title) {
    window.location.href = "browse-services.html";
    return;
  }

  const customer = app ? app.getCurrentCustomer() : null;
  const addressInput = document.getElementById("serviceAddress");
  const dateInput = document.getElementById("bookingDate");
  const timeInput = document.getElementById("bookingTime");
  const addressError = document.getElementById("addressError");

  document.getElementById("serviceTitle").textContent = pendingBooking.title;
  document.getElementById("providerName").textContent = pendingBooking.provider;
  document.getElementById("serviceHero").src = pendingBooking.image;
  document.getElementById("serviceRate").innerHTML = `$${pendingBooking.price} <span>/hour</span>`;
  document.getElementById("providerImg").src = app
    ? app.buildAvatarUrl(pendingBooking.provider, pendingBooking.providerImage)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(pendingBooking.provider)}&background=2F54EB&color=fff`;

  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
    dateInput.value = pendingBooking.date || today;
  }

  if (timeInput && pendingBooking.time) {
    const desiredTime = pendingBooking.time.trim();
    Array.from(timeInput.options).forEach((option) => {
      if (option.value.trim() === desiredTime || option.textContent.trim() === desiredTime) {
        timeInput.value = option.value;
      }
    });
  }

  if (addressInput && customer && customer.location) {
    addressInput.value = customer.location;
  }

  const hours = 2;
  const subtotal = (Number(pendingBooking.price) || 0) * hours;
  const fee = subtotal * 0.05;
  const total = subtotal + fee;

  document.getElementById("summaryPrice").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("summaryFee").textContent = `$${fee.toFixed(2)}`;
  document.getElementById("summaryTotal").textContent = `$${total.toFixed(2)}`;

  function setAddressValidity(message) {
    if (!addressError || !addressInput) return;

    const hasError = Boolean(message);
    addressError.style.display = hasError ? "block" : "none";
    addressError.textContent = message || "";
    addressInput.style.borderColor = hasError ? "var(--red)" : "var(--border)";
  }

  if (addressInput) {
    addressInput.addEventListener("input", () => {
      if (addressInput.value.trim().length >= 10) {
        setAddressValidity("");
      }
    });
  }

  if (confirmButton) {
    confirmButton.addEventListener("click", (event) => {
      event.preventDefault();

      const address = addressInput ? addressInput.value.trim() : "";
      const bookingDate = dateInput ? dateInput.value : "";
      const bookingTime = timeInput ? timeInput.value : "";

      if (address.length < 10) {
        setAddressValidity("Please enter the full service address, including street or apartment details.");
        return;
      }

      if (!bookingDate) {
        app ? app.showToast("Please select a service date.", "warning") : alert("Please select a service date.");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(`${bookingDate}T00:00:00`);
      if (selectedDate < today) {
        app ? app.showToast("Please choose a future service date.", "warning") : alert("Please choose a future service date.");
        return;
      }

      if (!bookingTime) {
        app ? app.showToast("Please select a service time.", "warning") : alert("Please select a service time.");
        return;
      }

      setAddressValidity("");

      const bookings = app && typeof app.getCustomerBookings === "function"
        ? app.getCustomerBookings()
        : (JSON.parse(localStorage.getItem("serviceHub_bookings")) || []);
      const bookingId = `BK-${Math.floor(Math.random() * 90000 + 10000)}`;
      const newBooking = {
        bookingId,
        serviceId: pendingBooking.id,
        title: pendingBooking.title,
        provider: pendingBooking.provider,
        providerImage: pendingBooking.providerImage || "",
        date: bookingDate,
        time: bookingTime,
        address,
        durationHours: hours,
        unitPrice: Number(pendingBooking.price) || 0,
        total: Number(total.toFixed(2)),
        status: "Confirmed",
        createdAt: new Date().toISOString(),
        customerEmail: customer ? customer.email : "",
        customerId: customer ? customer.id : ""
      };

      const nextBookings = [newBooking].concat(Array.isArray(bookings) ? bookings : []);
      if (app && typeof app.saveCustomerBookings === "function") {
        app.saveCustomerBookings(nextBookings);
      } else {
        localStorage.setItem("serviceHub_bookings", JSON.stringify(nextBookings));
      }
      localStorage.setItem("latestBookingId", bookingId);
      localStorage.setItem("selectedBookingId", bookingId);
      localStorage.removeItem("pendingBooking");

      if (app) {
        app.addNotification(
          "Booking confirmed",
          `${newBooking.title} was booked for ${app.formatDisplayDate(newBooking.date, { month: "short", day: "numeric" })} at ${newBooking.time}.`,
          { href: "booking-confirmation.html", icon: "fa-calendar-check", tone: "green" }
        );
      }

      window.location.href = "booking-confirmation.html";
    });
  }
});
