(function () {
  const LANDING_STORAGE_KEYS = {
    ROLE_CONTEXT: 'sh_landing_role_context',
    SERVICE_SELECTION: 'sh_landing_service_selection',
    POST_JOB_DRAFT: 'sh_post_job_draft',
    POSTED_JOBS: 'sh_posted_jobs',
    CONTACT_DRAFT: 'sh_contact_draft',
    CONTACT_MESSAGES: 'sh_contact_messages',
    WAITLIST: 'sh_locations_waitlist'
  };

  function readStorageJSON(key, fallback) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (error) {
      console.warn('Unable to read localStorage key:', key, error);
      return fallback;
    }
  }

  function writeStorageJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function removeStorageKey(key) {
    localStorage.removeItem(key);
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizePostalCode(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
  }

  function isValidName(name) {
    const normalizedName = normalizeText(name);
    return normalizedName.length >= 2 && /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(normalizedName);
  }

  function isValidPostalCode(postalCode) {
    return /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(normalizePostalCode(postalCode));
  }

  function getTodayISODate() {
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 10);
  }

  function generateRecordId(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function getFormStatusElement(container, statusId) {
    let statusElement = document.getElementById(statusId);
    if (statusElement) return statusElement;

    statusElement = document.createElement('div');
    statusElement.id = statusId;
    statusElement.className = 'landing-form-status';
    container.appendChild(statusElement);
    return statusElement;
  }

  function setFormStatus(container, statusId, message, type) {
    const statusElement = getFormStatusElement(container, statusId);
    statusElement.textContent = message;
    statusElement.className = 'landing-form-status is-' + type;
  }

  function clearFormStatus(statusId) {
    const statusElement = document.getElementById(statusId);
    if (!statusElement) return;
    statusElement.textContent = '';
    statusElement.className = 'landing-form-status';
  }

  function getFieldErrorElement(field) {
    const errorId = field.id + '-error';
    let errorElement = document.getElementById(errorId);
    if (errorElement) return errorElement;

    errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'landing-field-error';
    field.insertAdjacentElement('afterend', errorElement);
    return errorElement;
  }

  function setFieldError(field, message) {
    field.classList.add('is-invalid');
    getFieldErrorElement(field).textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorElement = document.getElementById(field.id + '-error');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  function clearFieldErrors(form) {
    form.querySelectorAll('.landing-input').forEach((field) => clearFieldError(field));
  }

  function initMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.querySelector('.navbar');

    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      });
    }

    if (!mobileBtn || !navLinks) return;

    const icon = mobileBtn.querySelector('i');
    const closeMenu = () => {
      navLinks.classList.remove('active');
      if (icon && icon.classList.contains('fa-xmark')) {
        icon.classList.replace('fa-xmark', 'fa-bars');
      }
    };

    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      if (!icon) return;

      if (navLinks.classList.contains('active')) {
        icon.classList.replace('fa-bars', 'fa-xmark');
      } else {
        icon.classList.replace('fa-xmark', 'fa-bars');
      }
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!navLinks.classList.contains('active')) return;
      if (navLinks.contains(event.target) || mobileBtn.contains(event.target)) return;
      closeMenu();
    });
  }

  function goToPostJobPage(category) {
    const normalizedCategory = normalizeText(category);
    const destination = normalizedCategory
      ? '../customer/browse-services.html?q=' + encodeURIComponent(normalizedCategory)
      : '../customer/browse-services.html';

    if (normalizedCategory) {
      writeStorageJSON(LANDING_STORAGE_KEYS.SERVICE_SELECTION, {
        category: normalizedCategory,
        updatedAt: new Date().toISOString()
      });
    } else {
      removeStorageKey(LANDING_STORAGE_KEYS.SERVICE_SELECTION);
    }

    window.location.href = destination;
  }

  function initHomePage() {
    const bookButtons = document.querySelectorAll('[data-book-service]');
    const browseButtons = document.querySelectorAll('[data-open-post-job]');

    if (!bookButtons.length && !browseButtons.length) return;

    bookButtons.forEach((button) => {
      button.addEventListener('click', () => {
        goToPostJobPage(button.getAttribute('data-book-service'));
      });
    });

    browseButtons.forEach((button) => {
      button.addEventListener('click', () => {
        goToPostJobPage('');
      });
    });
  }

  function initRoleSelectionPage() {
    const continueBtn = document.getElementById('continueBtn');
    const roleCards = document.querySelectorAll('.role-card');
    const pageTitle = document.getElementById('pageTitle');
    const roleContainer = document.querySelector('.role-container');

    if (!continueBtn || !roleCards.length || !roleContainer) return;

    const storedContext = readStorageJSON(LANDING_STORAGE_KEYS.ROLE_CONTEXT, {});
    const urlParams = new URLSearchParams(window.location.search);
    const actionParam = normalizeText(urlParams.get('action')).toLowerCase();
    const action = actionParam === 'login' || actionParam === 'signup'
      ? actionParam
      : (storedContext.action === 'login' || storedContext.action === 'signup' ? storedContext.action : 'signup');

    let selectedRole = storedContext.role || '';

    if (pageTitle) {
      pageTitle.textContent = action === 'login' ? 'Welcome Back' : 'Join ServiceHub';
    }

    continueBtn.disabled = !selectedRole;
    continueBtn.innerHTML = action === 'login'
      ? 'Continue to Login <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>'
      : 'Continue to Sign Up <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>';

    const saveRoleContext = () => {
      writeStorageJSON(LANDING_STORAGE_KEYS.ROLE_CONTEXT, {
        action,
        role: selectedRole,
        updatedAt: new Date().toISOString()
      });
    };

    const selectRoleCard = (role) => {
      selectedRole = role;
      roleCards.forEach((card) => {
        const isSelected = card.getAttribute('data-role') === role;
        card.classList.toggle('selected', isSelected);
      });
      continueBtn.disabled = !selectedRole;
      saveRoleContext();
      clearFormStatus('roleSelectionStatus');
    };

    if (selectedRole) {
      selectRoleCard(selectedRole);
    }

    roleCards.forEach((card) => {
      card.addEventListener('click', () => {
        selectRoleCard(card.getAttribute('data-role'));
      });
    });

    continueBtn.addEventListener('click', (event) => {
      event.preventDefault();

      if (!selectedRole) {
        setFormStatus(roleContainer, 'roleSelectionStatus', 'Please select a role to continue.', 'error');
        return;
      }

      saveRoleContext();

      if (selectedRole === 'provider') {
        window.location.href = action === 'login' ? '../provider/login.html' : '../provider/signup.html';
        return;
      }

      if (selectedRole === 'arbitrator') {
        window.location.href = '../arbitrator/arbitrator_landing.html';
        return;
      }

      writeStorageJSON(LANDING_STORAGE_KEYS.ROLE_CONTEXT, {
        action,
        role: 'customer',
        updatedAt: new Date().toISOString()
      });
      window.location.href = action === 'login' ? '../customer/login.html' : '../customer/signup.html';
    });
  }

  function initPostJobForm() {
    const form = document.getElementById('postJobForm');
    if (!form) return;

    const categoryField = document.getElementById('serviceCategory');
    const postalCodeField = document.getElementById('postalCode');
    const detailsField = document.getElementById('projectDetails');
    const serviceDateField = document.getElementById('serviceDate');
    const statusId = 'postJobStatus';

    serviceDateField.min = getTodayISODate();

    const savedDraft = readStorageJSON(LANDING_STORAGE_KEYS.POST_JOB_DRAFT, {});
    const selectedService = readStorageJSON(LANDING_STORAGE_KEYS.SERVICE_SELECTION, null);

    if (savedDraft.serviceCategory) categoryField.value = savedDraft.serviceCategory;
    else if (selectedService && selectedService.category) categoryField.value = selectedService.category;

    if (savedDraft.postalCode) postalCodeField.value = savedDraft.postalCode;
    if (savedDraft.projectDetails) detailsField.value = savedDraft.projectDetails;
    if (savedDraft.serviceDate) serviceDateField.value = savedDraft.serviceDate;

    if (savedDraft.serviceCategory || savedDraft.postalCode || savedDraft.projectDetails || savedDraft.serviceDate) {
      setFormStatus(form, statusId, 'Your saved job draft was restored from this browser.', 'info');
    } else if (selectedService && selectedService.category) {
      setFormStatus(form, statusId, selectedService.category + ' was preselected from the home page. You can change it before posting.', 'info');
    }

    const persistDraft = () => {
      writeStorageJSON(LANDING_STORAGE_KEYS.POST_JOB_DRAFT, {
        serviceCategory: categoryField.value,
        postalCode: normalizePostalCode(postalCodeField.value),
        projectDetails: detailsField.value,
        serviceDate: serviceDateField.value,
        updatedAt: new Date().toISOString()
      });
    };

    [categoryField, postalCodeField, detailsField, serviceDateField].forEach((field) => {
      field.addEventListener('input', persistDraft);
      field.addEventListener('change', persistDraft);
      field.addEventListener('blur', () => clearFieldError(field));
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      clearFormStatus(statusId);

      const serviceCategory = normalizeText(categoryField.value);
      const postalCode = normalizePostalCode(postalCodeField.value);
      const projectDetails = normalizeText(detailsField.value);
      const serviceDate = serviceDateField.value;
      const todayISODate = getTodayISODate();

      let hasErrors = false;

      if (!serviceCategory) {
        setFieldError(categoryField, 'Please select a service category.');
        hasErrors = true;
      }

      if (!postalCode) {
        setFieldError(postalCodeField, 'Please enter your zip or postal code.');
        hasErrors = true;
      } else if (!isValidPostalCode(postalCode)) {
        setFieldError(postalCodeField, 'Enter a valid zip or postal code.');
        hasErrors = true;
      }

      if (!projectDetails) {
        setFieldError(detailsField, 'Please describe the project.');
        hasErrors = true;
      } else if (projectDetails.length < 20) {
        setFieldError(detailsField, 'Project details must be at least 20 characters long.');
        hasErrors = true;
      } else if (projectDetails.length > 1500) {
        setFieldError(detailsField, 'Project details must be 1500 characters or fewer.');
        hasErrors = true;
      }

      if (!serviceDate) {
        setFieldError(serviceDateField, 'Please choose a service date.');
        hasErrors = true;
      } else if (serviceDate < todayISODate) {
        setFieldError(serviceDateField, 'Service date cannot be in the past.');
        hasErrors = true;
      }

      if (hasErrors) {
        setFormStatus(form, statusId, 'Please fix the highlighted fields before posting your job.', 'error');
        return;
      }

      const postedJobs = readStorageJSON(LANDING_STORAGE_KEYS.POSTED_JOBS, []);
      const nextJobs = Array.isArray(postedJobs) ? postedJobs : [];

      nextJobs.unshift({
        id: generateRecordId('JOB'),
        serviceCategory,
        postalCode,
        projectDetails,
        serviceDate,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      });

      writeStorageJSON(LANDING_STORAGE_KEYS.POSTED_JOBS, nextJobs);
      removeStorageKey(LANDING_STORAGE_KEYS.POST_JOB_DRAFT);
      removeStorageKey(LANDING_STORAGE_KEYS.SERVICE_SELECTION);

      form.reset();
      serviceDateField.min = todayISODate;
      setFormStatus(form, statusId, 'Job request saved successfully. Providers can now be matched from this browser session flow.', 'success');
    });
  }

  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const firstNameField = document.getElementById('contactFirstName');
    const lastNameField = document.getElementById('contactLastName');
    const emailField = document.getElementById('contactEmail');
    const topicField = document.getElementById('contactTopic');
    const messageField = document.getElementById('contactMessage');
    const statusId = 'contactFormStatus';

    const savedDraft = readStorageJSON(LANDING_STORAGE_KEYS.CONTACT_DRAFT, {});
    if (savedDraft.firstName) firstNameField.value = savedDraft.firstName;
    if (savedDraft.lastName) lastNameField.value = savedDraft.lastName;
    if (savedDraft.email) emailField.value = savedDraft.email;
    if (savedDraft.topic) topicField.value = savedDraft.topic;
    if (savedDraft.message) messageField.value = savedDraft.message;

    if (savedDraft.firstName || savedDraft.lastName || savedDraft.email || savedDraft.topic || savedDraft.message) {
      setFormStatus(form, statusId, 'Your saved contact draft was restored from this browser.', 'info');
    }

    const persistDraft = () => {
      writeStorageJSON(LANDING_STORAGE_KEYS.CONTACT_DRAFT, {
        firstName: normalizeText(firstNameField.value),
        lastName: normalizeText(lastNameField.value),
        email: normalizeEmail(emailField.value),
        topic: topicField.value,
        message: messageField.value,
        updatedAt: new Date().toISOString()
      });
    };

    [firstNameField, lastNameField, emailField, topicField, messageField].forEach((field) => {
      field.addEventListener('input', persistDraft);
      field.addEventListener('change', persistDraft);
      field.addEventListener('blur', () => clearFieldError(field));
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      clearFormStatus(statusId);

      const firstName = normalizeText(firstNameField.value);
      const lastName = normalizeText(lastNameField.value);
      const email = normalizeEmail(emailField.value);
      const topic = normalizeText(topicField.value);
      const message = normalizeText(messageField.value);

      let hasErrors = false;

      if (!isValidName(firstName)) {
        setFieldError(firstNameField, 'Enter a valid first name.');
        hasErrors = true;
      }

      if (!isValidName(lastName)) {
        setFieldError(lastNameField, 'Enter a valid last name.');
        hasErrors = true;
      }

      if (!email) {
        setFieldError(emailField, 'Please enter your email address.');
        hasErrors = true;
      } else if (!isValidEmail(email)) {
        setFieldError(emailField, 'Enter a valid email address.');
        hasErrors = true;
      }

      if (!topic) {
        setFieldError(topicField, 'Please choose a support topic.');
        hasErrors = true;
      }

      if (!message) {
        setFieldError(messageField, 'Please enter your message.');
        hasErrors = true;
      } else if (message.length < 15) {
        setFieldError(messageField, 'Message must be at least 15 characters long.');
        hasErrors = true;
      } else if (message.length > 1500) {
        setFieldError(messageField, 'Message must be 1500 characters or fewer.');
        hasErrors = true;
      }

      if (hasErrors) {
        setFormStatus(form, statusId, 'Please correct the highlighted fields before sending your message.', 'error');
        return;
      }

      const messages = readStorageJSON(LANDING_STORAGE_KEYS.CONTACT_MESSAGES, []);
      const nextMessages = Array.isArray(messages) ? messages : [];

      nextMessages.unshift({
        id: generateRecordId('MSG'),
        firstName,
        lastName,
        email,
        topic,
        message,
        submittedAt: new Date().toISOString()
      });

      writeStorageJSON(LANDING_STORAGE_KEYS.CONTACT_MESSAGES, nextMessages);
      removeStorageKey(LANDING_STORAGE_KEYS.CONTACT_DRAFT);

      form.reset();
      setFormStatus(form, statusId, 'Message saved successfully. Our support team can now review it from this browser flow.', 'success');
    });
  }

  function initLocationsWaitlistForm() {
    const form = document.getElementById('locationsWaitlistForm');
    if (!form) return;

    const emailField = document.getElementById('waitlistEmail');
    const statusId = 'waitlistStatus';

    emailField.addEventListener('blur', () => clearFieldError(emailField));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFieldError(emailField);
      clearFormStatus(statusId);

      const email = normalizeEmail(emailField.value);

      if (!email) {
        setFieldError(emailField, 'Please enter your email address.');
        setFormStatus(form, statusId, 'Please enter your email to join the waitlist.', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        setFieldError(emailField, 'Enter a valid email address.');
        setFormStatus(form, statusId, 'Please enter a valid email address.', 'error');
        return;
      }

      const waitlist = readStorageJSON(LANDING_STORAGE_KEYS.WAITLIST, []);
      const nextWaitlist = Array.isArray(waitlist) ? waitlist : [];
      const alreadySubscribed = nextWaitlist.some((entry) => normalizeEmail(entry.email) === email);

      if (alreadySubscribed) {
        setFormStatus(form, statusId, 'This email is already on the waitlist for launch updates.', 'info');
        return;
      }

      nextWaitlist.unshift({
        id: generateRecordId('WAITLIST'),
        email,
        submittedAt: new Date().toISOString()
      });

      writeStorageJSON(LANDING_STORAGE_KEYS.WAITLIST, nextWaitlist);
      form.reset();
      setFormStatus(form, statusId, 'You have been added to the waitlist successfully.', 'success');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initHomePage();
    initRoleSelectionPage();
    initPostJobForm();
    initContactForm();
    initLocationsWaitlistForm();
  });
})();
