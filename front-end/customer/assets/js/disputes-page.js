// customer/assets/js/disputes-page.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const disputesList = document.getElementById("disputes-list");
  const paginationContainer = document.getElementById("pagination-container");
  const applyFiltersButton = document.getElementById("apply-filters-btn");
  const emptyState = document.getElementById("disputes-empty-state");
  const raiseDisputeButton = document.getElementById("raiseDisputeBtn");

  const allDisputes = JSON.parse(localStorage.getItem("serviceHub_disputes")) || [];
  let filteredData = Array.isArray(allDisputes) ? [...allDisputes] : [];
  let currentPage = 1;
  const itemsPerPage = 4;

  function getStatusMeta(status) {
    if (status === "review") {
      return {
        className: "status-dot-pill--review",
        label: "Under Review",
        icon: "fa-magnifying-glass"
      };
    }

    if (status === "resolved") {
      return {
        className: "status-dot-pill--resolved",
        label: "Resolved",
        icon: "fa-check"
      };
    }

    return {
      className: "status-dot-pill--pending",
      label: "Pending",
      icon: "fa-clock"
    };
  }

  function filterDisputes() {
    const statusValue = document.getElementById("filter-status").value;
    const categoryValue = document.getElementById("filter-category").value;
    const dateValue = document.getElementById("filter-date").value;
    const now = new Date();

    filteredData = allDisputes.filter((dispute) => {
      const statusMatch = statusValue === "all" || dispute.status === statusValue;
      const categoryMatch = categoryValue === "all" || dispute.category === categoryValue;

      let dateMatch = true;
      if (dateValue !== "all") {
        const disputeDate = new Date(dispute.date);
        const diffDays = Math.ceil(Math.abs(now - disputeDate) / (1000 * 60 * 60 * 24));
        if (dateValue === "30") dateMatch = diffDays <= 30;
        if (dateValue === "90") dateMatch = diffDays <= 90;
      }

      return statusMatch && categoryMatch && dateMatch;
    });

    currentPage = 1;
    renderDisputes();
    renderPagination();
  }

  function renderDisputes() {
    if (!disputesList) return;

    disputesList.innerHTML = "";

    if (!filteredData.length) {
      disputesList.style.display = "none";
      if (paginationContainer) paginationContainer.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    disputesList.style.display = "flex";
    if (emptyState) emptyState.style.display = "none";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const items = filteredData.slice(startIndex, startIndex + itemsPerPage);

    items.forEach((dispute) => {
      const status = getStatusMeta(dispute.status);
      const formattedDate = app
        ? app.formatDisplayDate(dispute.date, { month: "short", day: "numeric", year: "numeric" })
        : dispute.date;

      const card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "16px";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-dark); margin: 0;">${dispute.service}</h3>
              <span style="font-size: 0.75rem; color: var(--text-soft); font-weight: 600;">ID: ${dispute.id}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-mid); margin: 0;">Provider: <strong>${dispute.provider}</strong> • Booking: ${dispute.bookingId}</p>
          </div>
          <span class="status-dot-pill ${status.className}">
            <i class="fa-solid ${status.icon}" style="margin-right: 4px; font-size: 10px; color: inherit; background: transparent;"></i>
            ${status.label}
          </span>
        </div>

        <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 16px;">
          <p style="font-size: 0.9rem; color: var(--text-dark); line-height: 1.5; margin: 0;">"${dispute.desc}"</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; color: var(--text-soft); font-weight: 500;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> Filed on ${formattedDate}</span>
          <button class="btn btn--outline btn--sm btn-view-dispute" data-id="${dispute.id}">View Details</button>
        </div>
      `;

      disputesList.appendChild(card);
    });
  }

  function renderPagination() {
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (totalPages <= 1) {
      paginationContainer.style.display = "none";
      return;
    }

    paginationContainer.style.display = "flex";

    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement("button");
      button.className = `page-btn ${page === currentPage ? "active" : ""}`;
      button.textContent = String(page);
      button.addEventListener("click", () => {
        currentPage = page;
        renderDisputes();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      paginationContainer.appendChild(button);
    }
  }

  if (applyFiltersButton) {
    applyFiltersButton.addEventListener("click", filterDisputes);
  }

  if (raiseDisputeButton) {
    raiseDisputeButton.addEventListener("click", () => {
      window.location.href = "raise-dispute.html";
    });
  }

  if (disputesList) {
    disputesList.addEventListener("click", (event) => {
      const detailsButton = event.target.closest(".btn-view-dispute");
      if (!detailsButton) return;

      const disputeId = detailsButton.getAttribute("data-id");
      localStorage.setItem("selectedDisputeId", disputeId);
      window.location.href = "dispute-status.html";
    });
  }

  renderDisputes();
  renderPagination();
});
