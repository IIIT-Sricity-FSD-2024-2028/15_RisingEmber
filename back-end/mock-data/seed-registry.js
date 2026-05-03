/*
  Backend seed registry (transitional).
  This file defines canonical entity shapes that frontend actors share today
  and backend APIs will serve soon.
*/

const backendSeedRegistry = {
  meta: {
    version: "2026-04-07",
    source: "servicehub-backend-mock-registry"
  },
  entities: {
    services: {
      key: "sh_services",
      requiredFields: ["id", "name", "category", "price", "description", "status", "providerEmail"]
    },
    bookings: {
      key: "serviceHub_bookings",
      requiredFields: ["bookingId", "serviceId", "title", "provider", "date", "time", "status", "customerEmail"]
    },
    disputes: {
      key: "sh_disputes",
      requiredFields: ["id", "customerName", "issue", "status", "description", "providerEmail"]
    },
    providers: {
      key: "sh_providers_list",
      requiredFields: ["name", "email", "phone", "role"]
    },
    customers: {
      key: "serviceHub_customer_accounts",
      requiredFields: ["id", "name", "email", "phone", "role"]
    },
    arbitrators: {
      key: "sh_arbitrators_registry",
      requiredFields: ["profile", "auth"]
    }
  }
};

if (typeof window !== "undefined") {
  window.ServiceHubBackendMock = backendSeedRegistry;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = backendSeedRegistry;
}
