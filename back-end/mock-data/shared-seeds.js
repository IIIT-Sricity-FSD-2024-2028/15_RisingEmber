/*
  Shared backend-side seed payloads for all actors.
  Front-end adapters should read from window.ServiceHubBackendSeeds.
*/
(function attachSharedSeeds(globalScope) {
  const seeds = {
    provider: {
      defaultProviderEmail: "paul@example.com"
    },
    customer: {
      initialServices: [
        {
          id: "svc-plumb-001",
          name: "Plumbing Leak Repair",
          category: "Plumbing",
          providerName: "Paul Repair",
          providerEmail: "paul@example.com",
          rating: 4.9,
          reviews: 127,
          price: 89,
          status: "active",
          description: "Emergency leak repair for faucets, traps, and supply lines.",
          image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400"
        },
        {
          id: "svc-elec-002",
          name: "Electrical Wiring Inspection",
          category: "Electrical",
          providerName: "Paul Repair",
          providerEmail: "paul@example.com",
          rating: 4.8,
          reviews: 93,
          price: 95,
          status: "active",
          description: "Inspection and troubleshooting for outlets, switches, and breakers.",
          image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400"
        }
      ],
      initialBookings: []
    },
    providerData: {
      initialServices: [
        {
          id: "svc-plumb-001",
          name: "Plumbing Leak Repair",
          category: "Plumbing",
          price: 89,
          status: "active",
          providerEmail: "paul@example.com",
          duration: "Fixed (1-2 Hours)",
          description: "Emergency leak repair for faucets, traps, supply lines, and under-sink plumbing issues.",
          image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400"
        }
      ],
      initialJobs: [],
      initialDisputes: [],
      initialProvider: {
        name: "Paul Repair",
        email: "paul@example.com",
        phone: "1234567890",
        category: "Plumbing",
        experience: "6 - 10 years",
        location: "San Francisco, CA",
        bio: "Licensed home services provider specializing in plumbing and maintenance visits.",
        walletBalance: 3450
      },
      initialProvidersList: [
        {
          name: "Paul Repair",
          email: "paul@example.com",
          phone: "1234567890",
          password: "Password123!",
          role: "provider"
        }
      ]
    },
    adminData: {},
    arbitratorData: {}
  };

  globalScope.ServiceHubBackendSeeds = {
    ...(globalScope.ServiceHubBackendSeeds || {}),
    ...seeds
  };
})(typeof window !== "undefined" ? window : globalThis);
