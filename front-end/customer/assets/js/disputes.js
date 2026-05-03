// assets/js/disputes.js - Backend cache for disputes

const initialDisputes = [];

// Initialize database if empty
const existingDisputes = JSON.parse(localStorage.getItem("serviceHub_disputes") || "null");
if (!Array.isArray(existingDisputes) || existingDisputes.length === 0) {
    localStorage.setItem("serviceHub_disputes", JSON.stringify([]));
}
