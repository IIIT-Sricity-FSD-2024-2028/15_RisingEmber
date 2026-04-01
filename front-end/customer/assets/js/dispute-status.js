// customer/assets/js/dispute-status.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const disputes = JSON.parse(localStorage.getItem("serviceHub_disputes")) || [];
  const selectedDisputeId = localStorage.getItem("selectedDisputeId") || localStorage.getItem("latestDisputeId");
  const dispute = Array.isArray(disputes)
    ? disputes.find((item) => item.id === selectedDisputeId) || disputes[0]
    : null;

  function getCategoryLabel(category) {
    const labels = {
      quality: "Quality of Service",
      noshow: "Professional No-Show",
      billing: "Billing Issue",
      overcharged: "Overcharged",
      incomplete: "Service Not Completed",
      other: "Other"
    };
    return labels[category] || "General Issue";
  }

  function getStatusMeta(status) {
    if (status === "review") {
      return { label: "Under Review", className: "status-dot-pill--review" };
    }
    if (status === "resolved") {
      return { label: "Resolved", className: "status-dot-pill--resolved" };
    }
    return { label: "Pending", className: "status-dot-pill--pending" };
  }

  function buildTimeline(disputeRecord) {
    if (Array.isArray(disputeRecord.timeline) && disputeRecord.timeline.length) {
      return disputeRecord.timeline;
    }

    const submittedAt = disputeRecord.submittedAt || disputeRecord.date;
    return [
      {
        title: "Dispute Submitted",
        detail: "Your dispute was successfully submitted and assigned a case number.",
        status: "completed",
        at: submittedAt
      },
      {
        title: disputeRecord.status === "resolved" ? "Resolved" : disputeRecord.status === "review" ? "Under Review" : "Pending Review",
        detail: disputeRecord.status === "resolved"
          ? "Our team completed the review and closed this case."
          : "Our team is currently reviewing your case and gathering information.",
        status: disputeRecord.status === "resolved" ? "completed" : "active",
        at: submittedAt
      },
      {
        title: "Provider Response",
        detail: "The provider will be contacted for their response to this dispute.",
        status: disputeRecord.status === "resolved" ? "completed" : "pending"
      },
      {
        title: "Resolution",
        detail: "A final decision will be communicated to both parties.",
        status: disputeRecord.status === "resolved" ? "completed" : "pending"
      }
    ];
  }

  function renderTimeline(disputeRecord) {
    const timelineContainer = document.getElementById("disputeTimeline");
    if (!timelineContainer) return;

    timelineContainer.innerHTML = buildTimeline(disputeRecord).map((item) => {
      const state = item.status || "pending";
      const icon = state === "completed" ? "fa-check" : state === "active" ? "fa-magnifying-glass" : "fa-clock";
      const dateLabel = item.at
        ? app.formatDisplayDate(item.at, { month: "long", day: "numeric", year: "numeric" }) + " at " +
          new Date(item.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "Pending";

      return `
        <div class="timeline-item ${state}">
          <div class="timeline-icon"><i class="fa-solid ${icon}"></i></div>
          <div class="timeline-content">
            <h4>${item.title}</h4>
            <p>${item.detail}</p>
            <span class="timeline-time">${dateLabel}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderEvidence(disputeRecord) {
    const evidenceGrid = document.getElementById("evidenceGrid");
    if (!evidenceGrid) return;

    const evidence = Array.isArray(disputeRecord.evidence) ? disputeRecord.evidence : [];
    if (!evidence.length) {
      evidenceGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px; border: 1px dashed var(--border); border-radius: var(--radius-sm); color: var(--text-mid);">
          No evidence files were uploaded for this dispute.
        </div>
      `;
      return;
    }

    evidenceGrid.innerHTML = evidence.map((file) => {
      const isPdf = file.type === "application/pdf";
      const sizeLabel = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      return `
        <div class="evidence-item">
          <div class="evidence-icon ${isPdf ? "pdf" : ""}">
            <i class="fa-regular ${isPdf ? "fa-file-pdf" : "fa-image"}"></i>
          </div>
          <div class="evidence-details">
            <span class="evidence-name">${file.name}</span>
            <span class="evidence-meta">${sizeLabel} • Uploaded ${app.formatDisplayDate(file.uploadedAt || disputeRecord.submittedAt, { month: "short", day: "numeric" })}</span>
          </div>
          <button type="button" class="btn-icon" data-download-file="${file.name}">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      `;
    }).join("");
  }

  function populateSubmittedPage(disputeRecord) {
    const disputeIdValue = document.getElementById("submittedDisputeId");
    const serviceValue = document.getElementById("submittedServiceName");
    const bookingValue = document.getElementById("submittedBookingId");
    const statusLink = document.getElementById("viewDisputeStatusLink");

    if (disputeIdValue) disputeIdValue.textContent = disputeRecord.id;
    if (serviceValue) serviceValue.textContent = disputeRecord.service;
    if (bookingValue) bookingValue.textContent = disputeRecord.bookingId;
    if (statusLink) {
      statusLink.addEventListener("click", () => {
        localStorage.setItem("selectedDisputeId", disputeRecord.id);
      });
    }
  }

  function populateStatusPage(disputeRecord) {
    const statusMeta = getStatusMeta(disputeRecord.status);

    const disputeIdValue = document.getElementById("statusDisputeId");
    const serviceValue = document.getElementById("statusServiceName");
    const bookingValue = document.getElementById("statusBookingId");
    const categoryValue = document.getElementById("statusCategory");
    const submittedDateValue = document.getElementById("statusSubmittedDate");
    const descriptionValue = document.getElementById("statusDescription");
    const badgeContainer = document.getElementById("statusBadge");

    if (disputeIdValue) disputeIdValue.textContent = disputeRecord.id;
    if (serviceValue) serviceValue.textContent = disputeRecord.service;
    if (bookingValue) bookingValue.textContent = disputeRecord.bookingId;
    if (categoryValue) categoryValue.textContent = getCategoryLabel(disputeRecord.category);
    if (submittedDateValue) {
      submittedDateValue.textContent = app.formatDisplayDate(disputeRecord.submittedAt || disputeRecord.date);
    }
    if (descriptionValue) {
      descriptionValue.textContent = disputeRecord.desc;
    }
    if (badgeContainer) {
      badgeContainer.innerHTML = `<span class="status-dot-pill ${statusMeta.className}"><i></i> ${statusMeta.label}</span>`;
    }

    renderTimeline(disputeRecord);
    renderEvidence(disputeRecord);
  }

  function bindCopyButtons() {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", async () => {
        const targetId = button.getAttribute("data-copy-target");
        const target = document.getElementById(targetId);
        const text = target ? target.textContent.trim() : "";

        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          app.showToast(`Copied ${text} to clipboard.`, "success");
        } catch (error) {
          app.showToast("Unable to copy right now. Please try again.", "error");
        }
      });
    });
  }

  if (!dispute) {
    const statusContainer = document.querySelector(".status-container") || document.querySelector(".main");
    if (statusContainer) {
      statusContainer.innerHTML = `
        <div style="padding: 40px 24px; text-align: center;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 44px; color: var(--orange); margin-bottom: 16px;"></i>
          <h2 style="margin-bottom: 8px;">No dispute selected</h2>
          <p style="color: var(--text-mid); margin-bottom: 20px;">We could not find dispute details to display right now.</p>
          <a href="disputes.html" class="btn btn--primary">Back to Disputes</a>
        </div>
      `;
    }
    return;
  }

  localStorage.setItem("selectedDisputeId", dispute.id);
  populateSubmittedPage(dispute);
  populateStatusPage(dispute);
  bindCopyButtons();

  document.addEventListener("click", (event) => {
    const downloadButton = event.target.closest("[data-download-file]");
    if (!downloadButton) return;

    const fileName = downloadButton.getAttribute("data-download-file");
    app.showToast(`${fileName} is stored as demo evidence in local storage only.`, "info");
  });
});
