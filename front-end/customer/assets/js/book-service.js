// customer/assets/js/book-service.js

document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CustomerApp;
  const notify = (message, type = "info") => {
    if (app && typeof app.showToast === "function") app.showToast(message, type);
    else if (typeof window.showAppToast === "function") window.showAppToast(message, type);
    else console.warn(message);
  };
  if (app && app.ready && typeof app.ready.then === "function") {
    try {
      await app.ready;
    } catch (error) {
      console.warn("Customer backend sync unavailable for booking form:", error);
    }
  }
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
    confirmButton.addEventListener("click", async (event) => {
      event.preventDefault();

      const address = addressInput ? addressInput.value.trim() : "";
      const bookingDate = dateInput ? dateInput.value : "";
      const bookingTime = timeInput ? timeInput.value : "";

      if (address.length < 10) {
        setAddressValidity("Please enter the full service address, including street or apartment details.");
        return;
      }

      if (!bookingDate) {
        notify("Please select a service date.", "warning");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(`${bookingDate}T00:00:00`);
      if (selectedDate < today) {
        notify("Please choose a future service date.", "warning");
        return;
      }

      if (!bookingTime) {
        notify("Please select a service time.", "warning");
        return;
      }

      setAddressValidity("");

      try {
        const newBooking = app && typeof app.createCustomerBooking === "function"
          ? await app.createCustomerBooking({
              serviceId: pendingBooking.id,
              title: pendingBooking.title,
              date: bookingDate,
              time: bookingTime,
              address
            })
          : null;

        const bookingId = newBooking ? newBooking.bookingId : `BK-${Math.floor(Math.random() * 90000 + 10000)}`;
        localStorage.setItem("latestBookingId", bookingId);
        localStorage.setItem("selectedBookingId", bookingId);
        localStorage.removeItem("pendingBooking");

        if (app && newBooking) {
          app.addNotification(
            "Booking confirmed",
            `${newBooking.title} was booked for ${app.formatDisplayDate(newBooking.date, { month: "short", day: "numeric" })} at ${newBooking.time}.`,
            { href: "booking-confirmation.html", icon: "fa-calendar-check", tone: "green" }
          );
        }

        window.location.href = "booking-confirmation.html";
      } catch (error) {
        notify(error.message, "error");
      }
    });
  }
});
