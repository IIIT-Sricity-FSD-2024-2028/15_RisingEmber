// customer/assets/js/profile.js

document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CustomerApp;
  if (!app) return;

  if (app.ready && typeof app.ready.then === "function") {
    try {
      await app.ready;
    } catch (error) {
      console.warn("Customer backend sync unavailable for profile page:", error);
    }
  }

  const currentCustomer = app.getCurrentCustomer();
  if (!currentCustomer) {
    window.location.href = "login.html";
    return;
  }

  const profileForm = document.getElementById("profile-form");
  const editableFields = profileForm ? profileForm.querySelectorAll(".input-field") : [];
  const editButton = document.getElementById("edit-profile-btn");
  const saveButton = document.getElementById("save-profile-btn");
  const cancelButton = document.getElementById("cancel-edit-btn");
  const profileSuccess = document.getElementById("profile-success-msg");
  const profileError = document.getElementById("profile-error-msg");

  const passwordForm = document.getElementById("password-form");
  const passwordSuccess = document.getElementById("password-success-msg");
  const passwordError = document.getElementById("password-error-msg");

  function showMessage(element, message, mode) {
    if (!element) return;

    element.style.display = message ? "block" : "none";
    element.textContent = message || "";

    if (!message) return;

    if (mode === "error") {
      element.classList.remove("alert--success");
      element.classList.add("alert--error");
    } else {
      element.classList.remove("alert--error");
      element.classList.add("alert--success");
    }
  }

  async function renderSubscriptionSection() {
    const planBadge = document.getElementById("plan-status-badge");
    const planDesc = document.getElementById("plan-description");
    const upgradeSection = document.getElementById("upgrade-section");

    if (!planBadge || !planDesc || !upgradeSection) return;

    const customer = app.getCurrentCustomer();
    let isPaid = false;
    let cardLast4 = "4242";

    try {
      const headers = app.getCustomerApiHeaders(customer);
      const meData = await app.requestCustomerApi("/users/me", { headers });
      if (meData && meData.profile) {
        if (meData.profile.plan === "paid") isPaid = true;
        if (meData.profile.cardDetails && meData.profile.cardDetails.last4) {
          cardLast4 = meData.profile.cardDetails.last4;
        }
      }
    } catch (e) {
      if (customer && customer.plan === "paid") isPaid = true;
    }

    if (isPaid) {
      planBadge.style.background = "#ECFDF5";
      planBadge.style.color = "#047857";
      planBadge.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> Paid Plan';

      planDesc.innerHTML = `You are on <strong>Plan 2 (Paid Plan)</strong>. You have full access to marketplace services and dispute resolution mechanism. Credit card ending in <strong>**** ${cardLast4}</strong> is registered for dispute billing.`;

      upgradeSection.style.display = "none";
    } else {
      planBadge.style.background = "#F3F4F6";
      planBadge.style.color = "#4B5563";
      planBadge.innerHTML = "Free Plan";

      planDesc.innerHTML = `You are currently on <strong>Plan 1 (Free Plan)</strong>. You have access to browse and book marketplace services. Dispute resolution is disabled on Free plans.`;

      upgradeSection.style.display = "flex";
    }
  }

  function loadProfile() {
    const customer = app.getCurrentCustomer();
    if (!customer) return;

    document.getElementById("profile-name").value = customer.name || "";
    document.getElementById("profile-email").value = customer.email || "";
    document.getElementById("profile-phone").value = customer.phone || "";
    document.getElementById("profile-location").value = customer.location || "";

    app.refreshShell();
    renderSubscriptionSection();
  }

  function setEditMode(isEditing) {
    editableFields.forEach((input) => {
      input.disabled = !isEditing;
      input.style.backgroundColor = isEditing ? "var(--surface)" : "#F9FAFB";
      input.style.borderColor = isEditing ? "var(--primary)" : "var(--border)";
    });

    if (editButton) editButton.style.display = isEditing ? "none" : "inline-flex";
    if (saveButton) saveButton.style.display = isEditing ? "inline-flex" : "none";
    if (cancelButton) cancelButton.style.display = isEditing ? "inline-flex" : "none";

    if (isEditing) {
      showMessage(profileSuccess, "", "success");
      showMessage(profileError, "", "error");
    }
  }

  if (editButton) {
    editButton.addEventListener("click", () => setEditMode(true));
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      loadProfile();
      setEditMode(false);
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      try {
        const updatedCustomer = await app.updateCustomerProfile({
          name: document.getElementById("profile-name").value,
          email: document.getElementById("profile-email").value,
          phone: document.getElementById("profile-phone").value,
          location: document.getElementById("profile-location").value
        });

        loadProfile();
        setEditMode(false);
        showMessage(profileError, "", "error");
        showMessage(profileSuccess, `Profile updated successfully for ${updatedCustomer.name}.`, "success");
      } catch (error) {
        showMessage(profileSuccess, "", "success");
        showMessage(profileError, error.message, "error");
      }
    });
  }

  const upgradeBtn = document.getElementById("upgrade-plan-btn");
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", async () => {
      const cardholderName = await app.showAppPrompt("Upgrade to Paid Plan ($100 Charge)", "Enter Cardholder Name:", {
        placeholder: "Name on Credit Card",
        defaultValue: currentCustomer ? currentCustomer.name : ""
      });
      if (cardholderName === false || cardholderName === null) return;

      const cardNumber = await app.showAppPrompt("Card Number", "Enter 16-digit Credit Card Number:", {
        placeholder: "1234 5678 9101 1121"
      });
      if (!cardNumber) {
        app.showToast("Card number is required for upgrade.", "warning");
        return;
      }

      const expDate = await app.showAppPrompt("Expiration Date", "Enter Expiration Date (MM/YY):", {
        placeholder: "12/28"
      });
      if (!expDate) {
        app.showToast("Expiration date is required for upgrade.", "warning");
        return;
      }

      const cvv = await app.showAppPrompt("CVV Security Code", "Enter 3 or 4-digit CVV:", {
        placeholder: "123",
        inputType: "password"
      });
      if (!cvv) {
        app.showToast("CVV is required for upgrade.", "warning");
        return;
      }

      try {
        upgradeBtn.disabled = true;
        upgradeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing $100 Charge...';

        await app.upgradeCustomerPlan({
          cardholderName: String(cardholderName).trim() || currentCustomer.name,
          cardNumber: String(cardNumber).trim(),
          expDate: String(expDate).trim(),
          cvv: String(cvv).trim()
        });

        app.showToast("Success! Your account has been upgraded to the Paid Plan ($100 fee processed).", "success");
        await renderSubscriptionSection();
      } catch (error) {
        app.showToast(error.message, "error");
      } finally {
        upgradeBtn.disabled = false;
        upgradeBtn.innerHTML = '<i class="fa-solid fa-credit-card" style="margin-right: 6px;"></i> Upgrade to Paid Plan ($100)';
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      showMessage(passwordSuccess, "", "success");
      showMessage(passwordError, "", "error");

      if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage(passwordError, "Please complete all password fields.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage(passwordError, "New passwords do not match. Please try again.", "error");
        return;
      }

      try {
        await app.updateCustomerPassword(currentPassword, newPassword);
        passwordForm.reset();
        showMessage(passwordSuccess, "Password changed successfully.", "success");
      } catch (error) {
        showMessage(passwordError, error.message, "error");
      }
    });
  }

  loadProfile();
  setEditMode(false);
});
