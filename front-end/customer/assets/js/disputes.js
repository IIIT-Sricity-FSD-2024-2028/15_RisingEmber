// assets/js/disputes.js - Mock Database for Disputes

const initialDisputes = [
    // Last 30 Days (March 2026)
    { id: "DSP-001", bookingId: "BK-2026-1102", service: "Plumbing Repair", provider: "Mike's Plumbing", category: "quality", status: "review", date: "2026-03-25", desc: "Provider left the work incomplete and pipe is still leaking." },
    { id: "DSP-003", bookingId: "BK-2026-1205", service: "Electrical Wiring", provider: "Volt Electrical", category: "noshow", status: "pending", date: "2026-03-28", desc: "Electrician never showed up for the scheduled appointment." },
    { id: "DSP-005", bookingId: "BK-2026-1301", service: "Custom Carpentry", provider: "WoodCrafters", category: "other", status: "review", date: "2026-03-15", desc: "Wrong wood finish was applied to the cabinets." },
    { id: "DSP-006", bookingId: "BK-2026-0800", service: "House Painting", provider: "ColorPro Painters", category: "quality", status: "pending", date: "2026-03-20", desc: "Paint spilled on the hardwood floor and not cleaned." },
    { id: "DSP-008", bookingId: "BK-2026-1420", service: "Deep Cleaning", provider: "Sparkle Cleaners", category: "quality", status: "review", date: "2026-03-29", desc: "Missed several rooms that were included in the package." },
    { id: "DSP-009", bookingId: "BK-2026-1500", service: "Electrical Repair", provider: "Volt Electrical", category: "noshow", status: "pending", date: "2026-03-31", desc: "Rescheduled three times without prior notice." },
    
    // Last 90 Days (Jan - Feb 2026)
    { id: "DSP-002", bookingId: "BK-2026-0984", service: "Deep Cleaning", provider: "Sparkle Cleaners", category: "billing", status: "resolved", date: "2026-02-15", desc: "Charged for 4 hours but only stayed for 2 hours." },
    { id: "DSP-004", bookingId: "BK-2026-1150", service: "Appliance Repair", provider: "FixIt Appliances", category: "quality", status: "resolved", date: "2026-01-22", desc: "Fridge broke down again the next day." },
    
    // Older than 90 Days (To test "All Time" filter)
    { id: "DSP-007", bookingId: "BK-2025-0750", service: "Plumbing Repair", provider: "Mike's Plumbing", category: "billing", status: "resolved", date: "2025-11-05", desc: "Hidden fees were added to the final invoice." }
];

// Initialize database if empty
const existingDisputes = JSON.parse(localStorage.getItem("serviceHub_disputes") || "null");
if (!Array.isArray(existingDisputes) || existingDisputes.length === 0) {
    localStorage.setItem("serviceHub_disputes", JSON.stringify(initialDisputes));
}
