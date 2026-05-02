// customer/assets/js/dispute-form.js

document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CustomerApp;
  if (app && app.ready && typeof app.ready.then === "function") {
    try {
      await app.ready;
    } catch (error) {
      console.warn("Customer backend sync unavailable for dispute form:", error);
    }
  }
  const form = document.getElementById("disputeForm");
  if (!form) return;

  const bookings = app && typeof app.getCustomerBookings === "function"
    ? app.getCustomerBookings()
    : (JSON.parse(localStorage.getItem("serviceHub_bookings")) || []);
  const storedContext = app && typeof app.readJSON === "function"
    ? app.readJSON("pendingDisputeContext", null)
    : JSON.parse(localStorage.getItem("pendingDisputeContext") || "null");
  const selectedBookingId = localStorage.getItem("selectedBookingId");
  const contextBooking =
    storedContext ||
    bookings.find((booking) => booking.bookingId === selectedBookingId) ||
    bookings.find((booking) => booking.status === "Completed") ||
    bookings[0];

  const bookingIdInput = document.getElementById("disputeBookingId");
  const bookingSummary = document.getElementById("disputeBookingSummary");
  const categoryInput = document.getElementById("disputeCategory");
  const descriptionInput = document.getElementById("disputeDescription");
  const descriptionCounter = document.getElementById("descriptionCounter");
  const fileInput = document.getElementById("disputeEvidence");
  const uploadZone = document.getElementById("disputeUploadZone");
  const filesList = document.getElementById("selectedFilesList");
  const feedback = document.getElementById("disputeFormMessage");

  const maxFileSize = 10 * 1024 * 1024;
  const acceptedTypes = new Set(["image/png", "image/jpeg", "application/pdf"]);
  let selectedFiles = [];

  function updateFeedback(message, tone) {
    if (!feedback) return;
    app.setFormFeedback(feedback, message, tone);
  }

  function renderSelectedFiles() {
    if (!filesList) return;

    if (!selectedFiles.length) {
      filesList.innerHTML = "";
      return;
    }

    filesList.innerHTML = selectedFiles.map((file, index) => {
      const sizeLabel = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      return `
        <div class="customer-file-chip">
          <span>${file.name} • ${sizeLabel}</span>
          <button type="button" data-remove-index="${index}">Remove</button>
        </div>
      `;
    }).join("");
  }

  function updateDescriptionCounter() {
    if (!descriptionInput || !descriptionCounter) return;
    descriptionCounter.textContent = `${descriptionInput.value.trim().length}/1000 characters`;
  }

  function populateContext() {
    if (!contextBooking) {
      updateFeedback("There is no booking available to attach to this dispute yet. Book or complete a service first.", "error");
      const submitButton = form.querySelector("button[type='submit']");
      if (submitButton) submitButton.disabled = true;
      return;
    }

    if (bookingIdInput) {
      bookingIdInput.value = contextBooking.bookingId;
    }

    if (bookingSummary) {
      bookingSummary.textContent = `${contextBooking.title} with ${contextBooking.provider} on ${
        app ? app.formatDisplayDate(contextBooking.date, { month: "short", day: "numeric", year: "numeric" }) : contextBooking.date
      }`;
    }
  }

  function acceptFiles(fileList) {
    const incomingFiles = Array.from(fileList || []);
    if (!incomingFiles.length) return;

    const rejectedFile = incomingFiles.find((file) => !acceptedTypes.has(file.type) || file.size > maxFileSize);
    if (rejectedFile) {
      updateFeedback("Only PNG, JPG, and PDF files up to 10 MB are allowed.", "error");
      return;
    }

    const nextFiles = incomingFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }));

    selectedFiles = [...selectedFiles, ...nextFiles].slice(0, 5);
    updateFeedback("", "info");
    renderSelectedFiles();
  }

  if (descriptionInput) {
    descriptionInput.addEventListener("input", updateDescriptionCounter);
    updateDescriptionCounter();
  }

  if (uploadZone && fileInput) {
    uploadZone.addEventListener("click", () => fileInput.click());
    uploadZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => {
      uploadZone.classList.remove("dragover");
    });
    uploadZone.addEventListener("drop", (event) => {
      event.preventDefault();
      uploadZone.classList.remove("dragover");
      acceptFiles(event.dataTransfer.files);
    });
    fileInput.addEventListener("change", () => {
      acceptFiles(fileInput.files);
      fileInput.value = "";
    });
  }

  if (filesList) {
    filesList.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-index]");
      if (!removeButton) return;

      const index = Number(removeButton.getAttribute("data-remove-index"));
      selectedFiles = selectedFiles.filter((_, itemIndex) => itemIndex !== index);
      renderSelectedFiles();
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateFeedback("", "info");

    if (!contextBooking) {
      updateFeedback("Please select a booking before submitting a dispute.", "error");
      return;
    }

    const category = categoryInput ? categoryInput.value : "";
    const description = descriptionInput ? descriptionInput.value.trim() : "";

    if (!category) {
      updateFeedback("Please choose an issue category.", "error");
      return;
    }

    if (description.length < 50) {
      updateFeedback("Please describe the issue in at least 50 characters.", "error");
      return;
    }

    if (description.length > 1000) {
      updateFeedback("Please keep the issue description under 1000 characters.", "error");
      return;
    }

    try {
      const dispute = app && typeof app.createCustomerDispute === "function"
        ? await app.createCustomerDispute({
            bookingId: contextBooking.bookingId,
            title: `${contextBooking.title} dispute`,
            description,
            evidence: selectedFiles
          })
        : null;

      if (dispute) {
        localStorage.setItem("latestDisputeId", dispute.id);
        localStorage.setItem("selectedDisputeId", dispute.id);
      }
      localStorage.removeItem("pendingDisputeContext");

      if (app) {
        app.addNotification(
          "Dispute submitted",
          `Your dispute for ${contextBooking.title} was submitted successfully.`,
          { href: "dispute-submitted.html", icon: "fa-file-circle-exclamation", tone: "orange" }
        );
      }

      window.location.href = "dispute-submitted.html";
    } catch (error) {
      updateFeedback(error.message, "error");
    }
  });

  populateContext();
  renderSelectedFiles();
  updateDescriptionCounter();
});
