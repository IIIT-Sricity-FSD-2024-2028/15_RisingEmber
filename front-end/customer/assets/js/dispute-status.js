// customer/assets/js/dispute-status.js

document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CustomerApp;
  if (app && app.ready && typeof app.ready.then === "function") {
    try {
      await app.ready;
    } catch (error) {
      console.warn("Customer backend sync unavailable for dispute status:", error);
    }
  }
  const disputes = app && typeof app.getCustomerDisputes === "function"
    ? app.getCustomerDisputes()
    : (JSON.parse(localStorage.getItem("serviceHub_disputes")) || []);
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

    let evidence = [];
    const fields = [disputeRecord.evidence, disputeRecord.evidenceFiles, disputeRecord.files, disputeRecord.respondentEvidence, disputeRecord.uploadedEvidence];
    fields.forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(file => {
          if (file) evidence.push(file);
        });
      }
    });

    if (!evidence.length) {
      evidenceGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px; border: 1px dashed var(--border); border-radius: var(--radius-sm); color: var(--text-mid);">
          No evidence files were uploaded for this dispute.
        </div>
      `;
      return;
    }

    evidenceGrid.innerHTML = evidence.map((file) => {
      const fileName = file.name || "Evidence_Document.pdf";
      const fileUrl = file.fileLink || file.url || "#";
      const isPdf = true;
      const sizeLabel = file.size ? (file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`) : "PDF Document";

      return `
        <div class="evidence-item">
          <div class="evidence-icon pdf">
            <i class="fa-solid fa-file-pdf" style="color: var(--red);"></i>
          </div>
          <div class="evidence-details">
            <span class="evidence-name">${fileName}</span>
            <span class="evidence-meta">${sizeLabel} • Uploaded PDF</span>
          </div>
          <a href="${fileUrl}" download="${fileName}" target="_blank" class="btn-icon" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; color: var(--primary);">
            <i class="fa-solid fa-download"></i>
          </a>
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
    if (serviceValue) serviceValue.textContent = disputeRecord.service || disputeRecord.title;
    if (bookingValue) bookingValue.textContent = disputeRecord.bookingId;
    if (statusLink) {
      statusLink.addEventListener("click", () => {
        localStorage.setItem("selectedDisputeId", disputeRecord.id);
      });
    }
  }

  function populateStatusPage(disputeRecord) {
    const latestAward = JSON.parse(localStorage.getItem('sh_latest_award') || 'null');
    if (latestAward && (latestAward.caseId === disputeRecord.id || latestAward.bookingId === disputeRecord.bookingId)) {
      disputeRecord.status = 'resolved';
      disputeRecord.awardDecision = latestAward.awardDecision;
      disputeRecord.awardSummary = latestAward.awardSummary;
      disputeRecord.awardPdfUrl = latestAward.awardPdfUrl;
      disputeRecord.awardPdfName = latestAward.awardPdfName;
    }

    const isClosed = String(disputeRecord.status).toLowerCase() === 'closed' || String(disputeRecord.status).toLowerCase() === 'resolved' || Boolean(disputeRecord.awardDecision);
    const statusMeta = getStatusMeta(isClosed ? "resolved" : disputeRecord.status);

    const disputeIdValue = document.getElementById("statusDisputeId");
    const serviceValue = document.getElementById("statusServiceName");
    const bookingValue = document.getElementById("statusBookingId");
    const categoryValue = document.getElementById("statusCategory");
    const submittedDateValue = document.getElementById("statusSubmittedDate");
    const descriptionValue = document.getElementById("statusDescription");
    const badgeContainer = document.getElementById("statusBadge");

    if (disputeIdValue) disputeIdValue.textContent = disputeRecord.id;
    if (serviceValue) serviceValue.textContent = disputeRecord.service || disputeRecord.title || "Service Dispute";
    if (bookingValue) bookingValue.textContent = disputeRecord.bookingId || "booking_8001";
    if (categoryValue) categoryValue.textContent = getCategoryLabel(disputeRecord.category || disputeRecord.issue);
    if (submittedDateValue) {
      submittedDateValue.textContent = app.formatDisplayDate(disputeRecord.submittedAt || disputeRecord.date || new Date());
    }
    if (descriptionValue) {
      descriptionValue.textContent = disputeRecord.description || disputeRecord.desc || disputeRecord.claimantDescription || "No detailed description provided.";
    }
    if (badgeContainer) {
      badgeContainer.innerHTML = `<span class="status-dot-pill ${statusMeta.className}"><i></i> ${statusMeta.label}</span>`;
    }

    // Render Arbitrator Verdict & Final Award Section if closed
    if (isClosed) {
      const summaryBox = document.getElementById("statusDescription")?.parentElement;
      if (summaryBox && !document.getElementById("awardVerdictBox")) {
        const decisionText = disputeRecord.awardDecision === "REFUND_TO_CUSTOMER" ? "Full Refund Issued to Customer" : "Released Payment to Provider";
        const awardPdfUrl = disputeRecord.awardPdfUrl || "#";
        const awardPdfName = disputeRecord.awardPdfName || `Final_Award_${disputeRecord.id}.pdf`;
        
        const verdictHtml = `
          <div id="awardVerdictBox" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius); padding: 20px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="color: #166534; font-size: 1rem; margin: 0;"><i class="fa-solid fa-gavel"></i> Final Arbitrator Award & Verdict</h4>
              <span class="status-dot-pill status-dot-pill--resolved">Closed / Resolved</span>
            </div>
            <p style="font-size: 0.9rem; color: #15803D; font-weight: 700; margin-bottom: 6px;">Decision: ${decisionText}</p>
            <p style="font-size: 0.88rem; color: #166534; line-height: 1.5; margin-bottom: 14px;">${disputeRecord.awardSummary || "The arbitrator has completed the case review and issued a binding decision."}</p>
            <a href="${awardPdfUrl}" download="${awardPdfName}" target="_blank" class="btn btn--primary" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 8px 16px;">
              <i class="fa-solid fa-file-pdf"></i> Download Official Award PDF
            </a>
          </div>
        `;
        summaryBox.insertAdjacentHTML('beforeend', verdictHtml);
      }
    }

    // Render Respondent Reply Section if available
    const respReply = disputeRecord.respondentDescription || disputeRecord.providerReply;
    if (respReply) {
      const summaryBox = document.getElementById("statusDescription")?.parentElement;
      if (summaryBox && !document.getElementById("respondentReplyBox")) {
        const replyHtml = `
          <div id="respondentReplyBox" style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius); padding: 20px; margin-top: 20px;">
            <h4 style="color: #92400E; font-size: 0.95rem; margin-bottom: 8px;"><i class="fa-solid fa-reply"></i> Respondent Written Reply</h4>
            <p style="font-size: 0.88rem; color: #78350F; line-height: 1.5; margin: 0;">"${respReply}"</p>
          </div>
        `;
        summaryBox.insertAdjacentHTML('beforeend', replyHtml);
      }
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
