// customer/assets/js/backendData.js
// Backend-first compatibility file. Runtime data is synchronized from the NestJS API.

const initialServices = [];

const initialBookings = [];

function initDatabase() {
  if (!localStorage.getItem("serviceHub_services")) localStorage.setItem("serviceHub_services", JSON.stringify([]));
  if (!localStorage.getItem("serviceHub_bookings")) localStorage.setItem("serviceHub_bookings", JSON.stringify([]));
  if (!localStorage.getItem("serviceHub_disputes")) localStorage.setItem("serviceHub_disputes", JSON.stringify([]));
}

initDatabase();

if (typeof window !== "undefined") {
  window.serviceHubCustomerSeed = { initialServices: [], initialBookings: [] };
}
