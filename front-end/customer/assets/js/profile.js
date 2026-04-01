// customer/assets/js/profile.js

document.addEventListener("DOMContentLoaded", () => {
  const app = window.CustomerApp;
  if (!app) return;

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

  function loadProfile() {
    const customer = app.getCurrentCustomer();
    if (!customer) return;

    document.getElementById("profile-name").value = customer.name || "";
    document.getElementById("profile-email").value = customer.email || "";
    document.getElementById("profile-phone").value = customer.phone || "";
    document.getElementById("profile-location").value = customer.location || "";

    app.refreshShell();
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
    saveButton.addEventListener("click", () => {
      try {
        const updatedCustomer = app.updateCustomerProfile({
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

  if (passwordForm) {
    passwordForm.addEventListener("submit", (event) => {
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
        app.updateCustomerPassword(currentPassword, newPassword);
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
