// customer/assets/js/service-details.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  const serviceId = localStorage.getItem("selectedServiceId");
  const services = JSON.parse(localStorage.getItem("serviceHub_services")) || [];
  const service = services.find((item) => item.id === serviceId);

  const errorState = document.getElementById("error-state");
  const contentState = document.getElementById("service-content");

  if (!service) {
    if (errorState) errorState.style.display = "block";
    if (contentState) contentState.style.display = "none";
    return;
  }

  if (contentState) contentState.style.display = "block";

  document.getElementById("detail-title").textContent = service.title;
  document.getElementById("detail-category").textContent = service.category;
  document.getElementById("detail-rating").textContent = service.rating;
  document.getElementById("detail-review-count").textContent = service.reviews;
  document.getElementById("detail-price").textContent = `$${service.price}`;
  document.getElementById("detail-provider-name").textContent = service.providerName;
  document.getElementById("detail-desc").textContent = service.description;
  document.getElementById("widget-total-price").textContent = `$${(service.price * 2).toFixed(2)}`;

  const heroImage = document.getElementById("detail-image");
  if (heroImage) heroImage.src = service.image;

  const providerImage = document.getElementById("detail-provider-img");
  if (providerImage) {
    providerImage.src = app
      ? app.buildAvatarUrl(service.providerName, service.providerImage)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(service.providerName)}&background=2F54EB&color=fff`;
  }

  const dateInput = document.getElementById("booking-date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
    if (!dateInput.value) {
      dateInput.value = today;
    }
  }

  const mockReviews = [
    { name: "Emily R.", stars: 5, text: "Absolutely fantastic service. Arrived on time and fixed the issue quickly.", date: "2 days ago" },
    { name: "Michael T.", stars: 4, text: "Very professional. The price was exactly as quoted and the work was clean.", date: "1 week ago" },
    { name: "Sarah J.", stars: 5, text: "Highly recommend. Left the place spotless after finishing.", date: "2 weeks ago" },
    { name: "David L.", stars: 5, text: "Great communication throughout the process. Very satisfied with the repair.", date: "3 weeks ago" },
    { name: "Jessica M.", stars: 4, text: "Good work overall. Took a bit longer than expected, but the quality is strong.", date: "1 month ago" },
    { name: "Robert P.", stars: 5, text: "Will definitely use this provider again. Top-notch service.", date: "1 month ago" }
  ];

  const reviewsContainer = document.getElementById("reviews-container");
  const loadMoreButton = document.getElementById("load-more-reviews-btn");
  let currentReviewIndex = 0;
  const reviewsPerLoad = 3;

  function renderReviews() {
    if (!reviewsContainer) return;

    const nextBatch = mockReviews.slice(currentReviewIndex, currentReviewIndex + reviewsPerLoad);
    nextBatch.forEach((review) => {
      const reviewCard = document.createElement("div");
      reviewCard.className = "review-card";
      reviewCard.innerHTML = `
        <div class="review-avatar">${review.name.charAt(0)}</div>
        <div class="review-content" style="flex: 1;">
          <h4>${review.name}</h4>
          <div class="stars">
            ${Array.from({ length: 5 }, (_, index) => {
              return `<i class="fa-${index < review.stars ? "solid" : "regular"} fa-star"></i>`;
            }).join("")}
          </div>
          <p>${review.text}</p>
          <span class="review-date">${review.date}</span>
        </div>
      `;
      reviewsContainer.appendChild(reviewCard);
    });

    currentReviewIndex += reviewsPerLoad;
    if (loadMoreButton && currentReviewIndex >= mockReviews.length) {
      loadMoreButton.style.display = "none";
    }
  }

  renderReviews();
  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", renderReviews);
  }

  const availableTimeButtons = document.querySelectorAll(".time-btn:not(.disabled)");
  availableTimeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      availableTimeButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  const continueButton = document.getElementById("book-service-btn");
  if (continueButton) {
    continueButton.addEventListener("click", () => {
      const selectedTimeButton = document.querySelector(".time-btn.active");
      const selectedDate = dateInput ? dateInput.value : "";

      if (!selectedDate) {
        app ? app.showToast("Please select a date for your service.", "warning") : alert("Please select a date for your service.");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosenDate = new Date(`${selectedDate}T00:00:00`);
      if (chosenDate < today) {
        app ? app.showToast("Please choose a future service date.", "warning") : alert("Please choose a future service date.");
        return;
      }

      if (!selectedTimeButton) {
        app ? app.showToast("Please select a time slot.", "warning") : alert("Please select a time slot.");
        return;
      }

      const pendingBooking = {
        id: service.id,
        title: service.title,
        provider: service.providerName,
        providerImage: service.providerImage || "",
        price: Number(service.price) || 0,
        image: service.image,
        date: selectedDate,
        time: selectedTimeButton.textContent.trim()
      };

      localStorage.setItem("pendingBooking", JSON.stringify(pendingBooking));
      window.location.href = "book-service.html";
    });
  }
});
