// customer/assets/js/mockData.js
// Shared customer-side seed data stored in localStorage.

const initialServices = [
  {
    id: "SRV-001",
    category: "plumbing",
    title: "Expert Plumbing Repairs",
    providerName: "Mike's Plumbing",
    providerImage: "https://ui-avatars.com/api/?name=Mike+Plumbing&background=DBEAFE&color=1D4ED8",
    rating: 4.9,
    reviews: 127,
    price: 85,
    description: "Professional leak detection, pipe repair, and emergency plumbing services. Fully licensed and insured.",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-002",
    category: "electrical",
    title: "Home Wiring & Electrical Fixes",
    providerName: "Volt Electrical",
    providerImage: "https://ui-avatars.com/api/?name=Volt+Electrical&background=FEF3C7&color=92400E",
    rating: 4.7,
    reviews: 89,
    price: 95,
    description: "Complete home wiring, outlet repair, and electrical panel upgrades. Safe and reliable work guaranteed.",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-003",
    category: "cleaning",
    title: "Deep Home Cleaning",
    providerName: "Sparkle Cleaners",
    providerImage: "https://ui-avatars.com/api/?name=Sparkle+Cleaners&background=D1FAE5&color=065F46",
    rating: 5.0,
    reviews: 203,
    price: 60,
    description: "Thorough deep cleaning for your entire home. Includes appliance cleaning, baseboards, and window washing.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-004",
    category: "appliance",
    title: "Appliance Repair Pro",
    providerName: "FixIt Appliances",
    providerImage: "https://ui-avatars.com/api/?name=FixIt+Appliances&background=EDE9FE&color=5B21B6",
    rating: 4.5,
    reviews: 56,
    price: 65,
    description: "Fast and reliable repair services for refrigerators, washers, dryers, and all major home appliances.",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-005",
    category: "carpentry",
    title: "Custom Carpentry & Woodwork",
    providerName: "WoodCrafters",
    providerImage: "https://ui-avatars.com/api/?name=WoodCrafters&background=FFEDD5&color=C2410C",
    rating: 4.8,
    reviews: 112,
    price: 55,
    description: "Custom woodwork, furniture repair, cabinet installation, and trim services by skilled carpenters.",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-006",
    category: "painting",
    title: "Interior & Exterior Painting",
    providerName: "ColorPro Painters",
    providerImage: "https://ui-avatars.com/api/?name=ColorPro&background=E0E7FF&color=4338CA",
    rating: 4.6,
    reviews: 140,
    price: 45,
    description: "Professional interior and exterior painting services with premium paints and crisp finishes.",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-007",
    category: "hvac",
    title: "AC Tune-Up & HVAC Maintenance",
    providerName: "Breeze Comfort",
    providerImage: "https://ui-avatars.com/api/?name=Breeze+Comfort&background=DBEAFE&color=1E40AF",
    rating: 4.8,
    reviews: 94,
    price: 110,
    description: "Seasonal AC servicing, duct inspection, filter replacement, and heating tune-ups for year-round comfort.",
    image: "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-008",
    category: "landscaping",
    title: "Landscape Cleanup & Lawn Care",
    providerName: "GreenNest Outdoor",
    providerImage: "https://ui-avatars.com/api/?name=GreenNest+Outdoor&background=D1FAE5&color=047857",
    rating: 4.7,
    reviews: 76,
    price: 70,
    description: "Yard cleanup, mowing, edging, mulching, and seasonal outdoor refresh packages for busy homeowners.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-009",
    category: "handyman",
    title: "Handyman Hourly Help",
    providerName: "FixRight Handyman",
    providerImage: "https://ui-avatars.com/api/?name=FixRight+Handyman&background=FEF3C7&color=9A3412",
    rating: 4.9,
    reviews: 188,
    price: 58,
    description: "Furniture assembly, wall mounting, patch repairs, and everyday home fixes handled in one visit.",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-010",
    category: "flooring",
    title: "Floor Repair & Tile Replacement",
    providerName: "Prime Floors",
    providerImage: "https://ui-avatars.com/api/?name=Prime+Floors&background=FDE68A&color=92400E",
    rating: 4.6,
    reviews: 61,
    price: 98,
    description: "Tile replacement, grout refresh, squeaky-floor fixes, and minor hardwood repair with clean finishing.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-011",
    category: "pest-control",
    title: "Pest Control Inspection",
    providerName: "SafeGuard Pest",
    providerImage: "https://ui-avatars.com/api/?name=SafeGuard+Pest&background=FEE2E2&color=B91C1C",
    rating: 4.7,
    reviews: 84,
    price: 78,
    description: "Targeted pest inspections and treatment plans for ants, roaches, termites, and seasonal intrusions.",
    image: "https://images.unsplash.com/photo-1621905252472-e8bb123415b8?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "SRV-012",
    category: "locksmith",
    title: "Lock Repair & Rekey Service",
    providerName: "SecureKey Locksmith",
    providerImage: "https://ui-avatars.com/api/?name=SecureKey+Locksmith&background=EDE9FE&color=6D28D9",
    rating: 4.8,
    reviews: 119,
    price: 88,
    description: "Door lock repair, deadbolt installation, and home rekey service with same-day availability.",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=400"
  }
];

const initialBookings = [
  {
    bookingId: "BK-7721",
    serviceId: "SRV-001",
    title: "Plumbing Repair",
    provider: "John Arthur",
    date: "2026-04-15",
    time: "10:00 AM - 12:00 PM",
    status: "Confirmed",
    address: "245 East 48th St, New York, NY 10017",
    total: 178.5
  },
  {
    bookingId: "BK-8820",
    serviceId: "SRV-005",
    title: "Carpentry Work",
    provider: "William Wilson",
    date: "2026-04-21",
    time: "10:00 AM - 1:00 PM",
    status: "Confirmed",
    address: "501 Congress Ave, Austin, TX 78701",
    total: 115.5
  },
  {
    bookingId: "BK-5512",
    serviceId: "SRV-002",
    title: "Electrical Installation",
    provider: "Kevin Johnson",
    date: "2026-03-12",
    time: "2:00 PM - 4:00 PM",
    status: "Completed",
    address: "300 Post St, San Francisco, CA 94108",
    total: 199.5
  },
  {
    bookingId: "BK-4409",
    serviceId: "SRV-006",
    title: "Interior Painting",
    provider: "Michael Brown",
    date: "2026-03-02",
    time: "1:00 PM - 5:00 PM",
    status: "Completed",
    address: "401 Michigan Ave, Chicago, IL 60611",
    total: 94.5
  },
  {
    bookingId: "BK-3301",
    serviceId: "SRV-003",
    title: "Deep Cleaning Service",
    provider: "Martha Leo",
    date: "2026-03-10",
    time: "9:00 AM - 1:00 PM",
    status: "Cancelled",
    address: "110 Wall St, New York, NY 10005",
    total: 126
  },
  {
    bookingId: "BK-2290",
    serviceId: "SRV-004",
    title: "Appliance Repair",
    provider: "Houston Fix",
    date: "2026-03-08",
    time: "10:00 AM - 12:00 PM",
    status: "Cancelled",
    address: "180 N LaSalle St, Chicago, IL 60601",
    total: 136.5
  },
  {
    bookingId: "BK-1904",
    serviceId: "SRV-009",
    title: "Handyman Hourly Help",
    provider: "Andre Morris",
    date: "2026-04-11",
    time: "3:00 PM - 5:00 PM",
    status: "Confirmed",
    address: "720 Pine St, Seattle, WA 98101",
    total: 121.8
  },
  {
    bookingId: "BK-1048",
    serviceId: "SRV-007",
    title: "AC Tune-Up & HVAC Maintenance",
    provider: "Luis Rivera",
    date: "2026-02-26",
    time: "11:00 AM - 1:00 PM",
    status: "Completed",
    address: "12 Biscayne Blvd, Miami, FL 33132",
    total: 231
  }
];

function initDatabase() {
  if (!localStorage.getItem("serviceHub_services")) {
    localStorage.setItem("serviceHub_services", JSON.stringify(initialServices));
  }

  if (!localStorage.getItem("serviceHub_bookings")) {
    localStorage.setItem("serviceHub_bookings", JSON.stringify(initialBookings));
  }

  if (!localStorage.getItem("serviceHub_disputes")) {
    localStorage.setItem("serviceHub_disputes", JSON.stringify([]));
  }
}

initDatabase();

if (typeof window !== "undefined") {
  window.serviceHubCustomerSeed = {
    initialServices,
    initialBookings
  };
}
