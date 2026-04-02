/**
 * ServiceHub – Shared Authentication System
 * Handles login/signup/logout for Provider and Arbitrator portals.
 * Data stored in localStorage.
 */

/* ============================================
   SHARED AUTH KEYS
   ============================================ */
const AUTH_KEYS = {
  PROVIDER: 'sh_provider_auth',     // { name, email, phone, isLoggedIn, role: 'provider' }
  ARBITRATOR: 'sh_arbitrator_auth', // { name, email, isLoggedIn, role: 'arbitrator' }
  ACTIVE_SESSION: 'sh_active_session', // { role, email, isLoggedIn }
  ACTIVE_USER: 'activeUser' // { name, email, phone?, role, isLoggedIn }
};

const APP_TOAST_STYLE_ID = 'sh-app-toast-styles';
const APP_TOAST_CONTAINER_ID = 'sh-app-toast-container';

function ensureAppToastStyles() {
  if (typeof document === 'undefined' || document.getElementById(APP_TOAST_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = APP_TOAST_STYLE_ID;
  style.textContent = `
    .sh-app-toast-stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 99999;
      pointer-events: none;
      max-width: min(360px, calc(100vw - 32px));
    }
    .sh-app-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #111827;
      color: #FFFFFF;
      padding: 14px 16px;
      border-radius: 12px;
      box-shadow: 0 16px 30px rgba(17, 24, 39, 0.18);
      transform: translateY(14px);
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: auto;
      border-left: 4px solid #3B82F6;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .sh-app-toast.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .sh-app-toast--success { border-left-color: #10B981; }
    .sh-app-toast--error { border-left-color: #EF4444; }
    .sh-app-toast--warning { border-left-color: #F59E0B; }
    .sh-app-toast__icon {
      font-size: 16px;
      line-height: 1;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .sh-app-toast--success .sh-app-toast__icon { color: #34D399; }
    .sh-app-toast--error .sh-app-toast__icon { color: #F87171; }
    .sh-app-toast--warning .sh-app-toast__icon { color: #FBBF24; }
    .sh-app-toast--info .sh-app-toast__icon { color: #60A5FA; }
    .sh-app-toast__content {
      font-size: 0.92rem;
      line-height: 1.45;
      white-space: pre-line;
      word-break: break-word;
    }
    @media (max-width: 640px) {
      .sh-app-toast-stack {
        left: 16px;
        right: 16px;
        bottom: 16px;
        max-width: none;
      }
    }
  `;

  document.head.appendChild(style);
}

function ensureAppToastContainer() {
  if (typeof document === 'undefined') return null;
  ensureAppToastStyles();

  let container = document.getElementById(APP_TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = APP_TOAST_CONTAINER_ID;
    container.className = 'sh-app-toast-stack';
    document.body.appendChild(container);
  }

  return container;
}

function showAppToast(message, type = 'info', options = {}) {
  const toastMessage = String(message || '').trim();
  if (!toastMessage || typeof document === 'undefined') return;

  const renderToast = () => {
    const container = ensureAppToastContainer();
    if (!container) return;

    const tone = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const iconMap = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `sh-app-toast sh-app-toast--${tone}`;
    toast.innerHTML = `
      <i class="fa-solid ${iconMap[tone]} sh-app-toast__icon" aria-hidden="true"></i>
      <div class="sh-app-toast__content"></div>
    `;
    toast.querySelector('.sh-app-toast__content').textContent = toastMessage;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    const duration = Math.max(1800, Number(options.duration) || 3200);
    const removeToast = () => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => toast.remove(), 220);
    };

    window.setTimeout(removeToast, duration);
  };

  if (document.body) {
    renderToast();
  } else {
    document.addEventListener('DOMContentLoaded', renderToast, { once: true });
  }
}

if (typeof window !== 'undefined') {
  window.showAppToast = showAppToast;

  if (!window.__serviceHubNativeAlert) {
    window.__serviceHubNativeAlert = window.alert.bind(window);
    window.alert = function patchedAlert(message) {
      if (typeof showAppModal === 'function') {
        showAppModal('Notice', message, { okText: 'Got it' });
      } else {
        showAppToast(message, 'info');
      }
    };
  }

  if (!window.__serviceHubNativeConfirm) {
    window.__serviceHubNativeConfirm = window.confirm.bind(window);
    window.confirm = function patchedConfirm(message) {
      // Note: Native confirm is synchronous. Custom modals are asynchronous.
      // This patch is mainly for safety; explicit showAppModal is preferred.
      console.warn('Native confirm() called. Use showAppModal() for a better experience.');
      return window.__serviceHubNativeConfirm(message);
    };
  }
}

const APP_MODAL_STYLE_ID = 'sh-app-modal-styles';

function ensureAppModalStyles() {
  if (typeof document === 'undefined' || document.getElementById(APP_MODAL_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = APP_MODAL_STYLE_ID;
  style.textContent = `
    .sh-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      opacity: 0;
      transition: opacity 0.3s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .sh-modal-overlay.is-visible {
      opacity: 1;
    }
    .sh-modal-container {
      background: #FFFFFF;
      width: 100%;
      max-width: 420px;
      margin: 20px;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(0.95);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }
    .sh-modal-overlay.is-visible .sh-modal-container {
      transform: scale(1);
    }
    .sh-modal-header {
      padding: 24px 24px 12px;
      text-align: center;
    }
    .sh-modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }
    .sh-modal-body {
      padding: 0 24px 24px;
      text-align: center;
    }
    .sh-modal-body p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.6;
      color: #4B5563;
      white-space: pre-line;
    }
    .sh-modal-input-wrapper {
      margin-top: 16px;
      text-align: left;
    }
    .sh-modal-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .sh-modal-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .sh-modal-footer {
      padding: 0 24px 24px;
      display: flex;
      gap: 12px;
    }
    .sh-modal-btn {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .sh-modal-btn--cancel {
      background: #F3F4F6;
      color: #4B5563;
    }
    .sh-modal-btn--cancel:hover {
      background: #E5E7EB;
    }
    .sh-modal-btn--primary {
      background: #3B82F6;
      color: #FFFFFF;
    }
    .sh-modal-btn--primary:hover {
      background: #2563EB;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }
    .sh-modal-btn--danger {
      background: #EF4444;
      color: #FFFFFF;
    }
    .sh-modal-btn--danger:hover {
      background: #DC2626;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }
  `;

  document.head.appendChild(style);
}

/**
 * showAppModal
 * Returns a Promise that resolves when the user clicks a button.
 * options = { confirm: boolean, type: 'primary'|'danger', okText: string, cancelText: string }
 */
function showAppModal(title, message, options = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    ensureAppModalStyles();

    const overlay = document.createElement('div');
    overlay.className = 'sh-modal-overlay';

    const isConfirm = options.confirm === true;
    const btnType = options.type || 'primary';
    const okText = options.okText || (isConfirm ? 'Confirm' : 'OK');
    const cancelText = options.cancelText || 'Cancel';

    const container = document.createElement('div');
    container.className = 'sh-modal-container';

    const header = document.createElement('div');
    header.className = 'sh-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.textContent = String(title || 'Notice');
    header.appendChild(titleEl);

    const body = document.createElement('div');
    body.className = 'sh-modal-body';

    const messageEl = document.createElement('p');
    messageEl.textContent = String(message || '');
    body.appendChild(messageEl);

    let input = null;
    if (options.prompt) {
      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'sh-modal-input-wrapper';

      input = document.createElement('input');
      input.type = options.inputType || 'text';
      input.className = 'sh-modal-input';
      input.placeholder = options.placeholder || '';
      input.value = options.defaultValue || '';
      input.autocomplete = 'off';

      inputWrapper.appendChild(input);
      body.appendChild(inputWrapper);
    }

    const footer = document.createElement('div');
    footer.className = 'sh-modal-footer';

    let cancelBtn = null;
    if (isConfirm || options.prompt) {
      cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sh-modal-btn sh-modal-btn--cancel';
      cancelBtn.textContent = cancelText;
      footer.appendChild(cancelBtn);
    }

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = `sh-modal-btn sh-modal-btn--${btnType}`;
    okBtn.textContent = okText;
    footer.appendChild(okBtn);

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    if (input) {
      window.setTimeout(() => input.focus(), 100);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') okBtn.click();
        if (e.key === 'Escape') cancelBtn ? cancelBtn.click() : close(false);
      });
    }

    function close(result) {
      overlay.classList.remove('is-visible');
      window.setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    }

    okBtn.addEventListener('click', () => {
      if (options.prompt) {
        close(input.value);
      } else {
        close(true);
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => close(false));
    }

    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  });
}

/**
 * showAppPrompt
 * Returns a Promise that resolves with the input value or null if cancelled.
 */
function showAppPrompt(title, message, options = {}) {
  return showAppModal(title, message, { ...options, prompt: true });
}

if (typeof window !== 'undefined') {
  window.showAppModal = showAppModal;
  window.showAppPrompt = showAppPrompt;
}

function readStorageJSON(key, fallback = null) {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Unable to parse localStorage key "${key}".`, error);
    return fallback;
  }
}

function writeStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function removeStorageKeys(...keys) {
  keys.forEach((key) => localStorage.removeItem(key));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function getProviderUsers() {
  const storedUsers = readStorageJSON('sh_providers_list', []);
  return Array.isArray(storedUsers) ? storedUsers : [];
}

function saveProviderUsers(users) {
  return writeStorageJSON('sh_providers_list', Array.isArray(users) ? users : []);
}

function findProviderUserIndex(identifier, users = getProviderUsers()) {
  const lookupValue = String(identifier || '').trim();
  if (!lookupValue) return -1;

  const lookupEmail = normalizeEmail(lookupValue);
  const lookupPhone = normalizePhone(lookupValue);

  return users.findIndex((user) => (
    normalizeEmail(user.email) === lookupEmail ||
    normalizePhone(user.phone) === lookupPhone
  ));
}

function getProviderProfile() {
  const storedProfile = readStorageJSON('sh_provider', {});
  return storedProfile && typeof storedProfile === 'object' && !Array.isArray(storedProfile)
    ? storedProfile
    : {};
}

function saveProviderProfile(profile) {
  const currentProfile = getProviderProfile();
  return writeStorageJSON('sh_provider', { ...currentProfile, ...profile });
}

function persistActiveUser(user) {
  const activeUser = { ...user, isLoggedIn: true };
  writeStorageJSON(AUTH_KEYS.ACTIVE_USER, activeUser);
  writeStorageJSON(AUTH_KEYS.ACTIVE_SESSION, {
    role: activeUser.role,
    email: activeUser.email,
    isLoggedIn: true
  });
  return activeUser;
}

function buildProviderSession(user) {
  return {
    name: String(user.name || '').trim(),
    email: normalizeEmail(user.email),
    phone: String(user.phone || '').trim(),
    walletBalance: Number(user.walletBalance) || 0,
    category: String(user.category || '').trim(),
    experience: String(user.experience || '').trim(),
    location: String(user.location || '').trim(),
    bio: String(user.bio || '').trim(),
    avatar: String(user.avatar || '').trim(),
    isLoggedIn: true,
    role: 'provider'
  };
}

function persistProviderSession(user) {
  const sessionUser = buildProviderSession(user);

  saveProviderProfile({
    name: sessionUser.name,
    email: sessionUser.email,
    phone: sessionUser.phone,
    walletBalance: sessionUser.walletBalance,
    category: sessionUser.category,
    experience: sessionUser.experience,
    location: sessionUser.location,
    bio: sessionUser.bio,
    avatar: sessionUser.avatar
  });

  writeStorageJSON(AUTH_KEYS.PROVIDER, sessionUser);
  persistActiveUser(sessionUser);

  return sessionUser;
}

function resetProviderPassword(identifier, nextPassword) {
  const users = getProviderUsers();
  const userIndex = findProviderUserIndex(identifier, users);

  if (userIndex === -1) {
    throw new Error('We could not find a provider account with that email or phone.');
  }

  if (!isStrongPassword(nextPassword)) {
    throw new Error('Your new password must be at least 8 characters and include upper, lower, number, and symbol.');
  }

  users[userIndex] = {
    ...users[userIndex],
    password: String(nextPassword || '')
  };
  saveProviderUsers(users);
  return users[userIndex];
}

/* ============================================
   VALIDATION HELPERS
   ============================================ */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHumanName(name) {
  const normalizedName = String(name || '').trim().replace(/\s+/g, ' ');
  return normalizedName.length >= 2 && /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/.test(normalizedName);
}

function isValidPhone(phone) {
  // Accepts formats: 1234567890, 123-456-7890, (123) 456-7890, +1 123 456 7890
  return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone.replace(/\s/g, ''));
}

function isStrongPassword(password) {
  return password.length >= 8;
}

if (typeof window !== 'undefined') {
  window.isValidHumanName = isValidHumanName;
}

/* ============================================
   PROVIDER AUTH FUNCTIONS
   ============================================ */
function providerLogin(email, password, expectedRole = 'provider') {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const loginValue = String(email || '').trim();
      const normalizedEmail = normalizeEmail(loginValue);
      const normalizedPhone = normalizePhone(loginValue);
      const isEmailLogin = isValidEmail(loginValue);
      const isPhoneLogin = normalizedPhone.length >= 10;

      if (!loginValue || !password) {
        reject(new Error('Email or phone and password are required'));
        return;
      }

      if (!isEmailLogin && !isPhoneLogin) {
        reject(new Error('Please enter a valid email address or phone number'));
        return;
      }

      const providersList = getProviderUsers();
      let matchedUser = null;

      for (const registeredUser of providersList) {
        if (!registeredUser || typeof registeredUser !== 'object') continue;

        const registeredEmail = normalizeEmail(registeredUser.email);
        const registeredPhone = normalizePhone(registeredUser.phone);
        const emailMatches = isEmailLogin && registeredEmail === normalizedEmail;
        const phoneMatches = isPhoneLogin && registeredPhone && registeredPhone === normalizedPhone;

        if (emailMatches || phoneMatches) {
          matchedUser = registeredUser;
          break;
        }
      }

      if (!matchedUser) {
        reject(new Error('No account found with this email or phone. Please sign up first.'));
        return;
      }

      const userRole = matchedUser.role || 'provider';
      if (userRole !== expectedRole) {
        reject(new Error('This account is not registered as a provider.'));
        return;
      }

      if (!matchedUser.password) {
        // Fallback for corrupted sessions due to the previous bug: Auto-repair the password.
        matchedUser.password = password; 
        const userIndex = providersList.findIndex(u => u.email === matchedUser.email);
        if (userIndex !== -1) {
          providersList[userIndex].password = password;
          saveProviderUsers(providersList);
        }
      } else if (matchedUser.password !== password) {
        reject(new Error('Incorrect password. Please try again.'));
        return;
      }

      resolve(persistProviderSession(matchedUser));
    }, 500);
  });
}

function providerSignup(name, email, phone, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const trimmedName = String(name || '').trim();
      const normalizedEmail = normalizeEmail(email);
      const trimmedPhone = String(phone || '').trim();
      const normalizedPhone = normalizePhone(phone);

      // --- Field presence validation ---
      if (!trimmedName || !normalizedEmail || !trimmedPhone || !password) {
        reject(new Error('All fields are required'));
        return;
      }

      // --- Name validation ---
      if (!isValidHumanName(trimmedName)) {
        reject(new Error('Please enter a valid full name using letters only.'));
        return;
      }

      // --- Email format validation ---
      if (!isValidEmail(normalizedEmail)) {
        reject(new Error('Please enter a valid email address (e.g. name@example.com)'));
        return;
      }

      // --- Phone validation ---
      if (!isValidPhone(phone)) {
        reject(new Error('Please enter a valid 10-digit phone number'));
        return;
      }

      // --- Password strength validation ---
      if (!isStrongPassword(password)) {
        reject(new Error('Password must be at least 8 characters long'));
        return;
      }

      const providersList = getProviderUsers();

      for (const registeredUser of providersList) {
        const registeredEmail = normalizeEmail(registeredUser.email);
        const registeredPhone = normalizePhone(registeredUser.phone);

        if (registeredEmail === normalizedEmail) {
          reject(new Error('An account with this email already exists. Please log in instead.'));
          return;
        }

        if (registeredPhone && registeredPhone === normalizedPhone) {
          reject(new Error('An account with this phone number already exists. Please log in instead.'));
          return;
        }
      }

      const newProvider = {
        name: trimmedName,
        email: normalizedEmail,
        phone: trimmedPhone,
        password,
        walletBalance: 0,
        role: 'provider'
      };

      providersList.push(newProvider);
      saveProviderUsers(providersList);

      resolve(persistProviderSession(newProvider));
    }, 500);
  });
}

function getProviderSession() {
  const sessionData = readStorageJSON(AUTH_KEYS.PROVIDER, null);

  if (sessionData && sessionData.email) {
    const providerProfile = getProviderProfile();
    const normalizedSession = {
      ...providerProfile,
      ...sessionData,
      email: normalizeEmail(sessionData.email || providerProfile.email),
      phone: String(sessionData.phone || providerProfile.phone || '').trim(),
      walletBalance: Number(
        Object.prototype.hasOwnProperty.call(sessionData, 'walletBalance')
          ? sessionData.walletBalance
          : providerProfile.walletBalance
      ) || 0,
      category: String(sessionData.category || providerProfile.category || '').trim(),
      experience: String(sessionData.experience || providerProfile.experience || '').trim(),
      location: String(sessionData.location || providerProfile.location || '').trim(),
      bio: String(sessionData.bio || providerProfile.bio || '').trim(),
      avatar: String(sessionData.avatar || providerProfile.avatar || '').trim(),
      role: 'provider',
      isLoggedIn: sessionData.isLoggedIn !== false
    };

    writeStorageJSON(AUTH_KEYS.PROVIDER, normalizedSession);
    return normalizedSession;
  }

  const activeUser = getActiveUser();
  if (activeUser && activeUser.role === 'provider') {
    writeStorageJSON(AUTH_KEYS.PROVIDER, activeUser);
    return activeUser;
  }

  return null;
}

function providerLogout() {
  const activeUser = getActiveUser();

  localStorage.removeItem(AUTH_KEYS.PROVIDER);

  if (!activeUser || activeUser.role === 'provider') {
    removeStorageKeys(AUTH_KEYS.ACTIVE_USER, AUTH_KEYS.ACTIVE_SESSION);
  }
}

/* ============================================
   ARBITRATOR AUTH FUNCTIONS
   ============================================ */
function getArbitratorDatabase() {
  const arbitratorDB = readStorageJSON('arbitrator_db', null);
  return arbitratorDB && typeof arbitratorDB === 'object' && !Array.isArray(arbitratorDB)
    ? arbitratorDB
    : null;
}

function getArbitratorAccountRegistry() {
  if (typeof getArbitratorAccounts === 'function') {
    return getArbitratorAccounts();
  }

  const fallbackAccount = getArbitratorDatabase();
  return fallbackAccount ? [fallbackAccount] : [];
}

function saveArbitratorDatabase(database) {
  if (typeof persistArbitratorData === 'function') {
    return persistArbitratorData(database);
  }

  writeStorageJSON('arbitrator_db', database);
  if (typeof window !== 'undefined') {
    window.ArbitratorData = database;
  }
  return database;
}

function getArbitratorSession() {
  const sessionData = readStorageJSON(AUTH_KEYS.ARBITRATOR, null);

  if (sessionData && sessionData.email) {
    const normalizedSession = {
      ...sessionData,
      email: normalizeEmail(sessionData.email),
      phone: String(sessionData.phone || '').trim(),
      role: 'arbitrator',
      isLoggedIn: sessionData.isLoggedIn !== false
    };

    writeStorageJSON(AUTH_KEYS.ARBITRATOR, normalizedSession);
    return normalizedSession;
  }

  const activeUser = getActiveUser();
  if (activeUser && activeUser.role === 'arbitrator') {
    writeStorageJSON(AUTH_KEYS.ARBITRATOR, activeUser);
    return activeUser;
  }

  return null;
}

function arbitratorLogin(email, password, expectedRole = 'arbitrator') {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedEmail = normalizeEmail(email);
      const providedPassword = String(password || '');

      if (!normalizedEmail || !providedPassword) {
        reject(new Error('Email and password are required'));
        return;
      }

      if (!isValidEmail(normalizedEmail)) {
        reject(new Error('Please enter a valid email address'));
        return;
      }

      const arbitratorAccounts = getArbitratorAccountRegistry();
      const matchedAccount = arbitratorAccounts.find((account) => {
        const accountEmail = normalizeEmail(
          (account.auth && account.auth.email) ||
          (account.profile && account.profile.email)
        );
        return accountEmail === normalizedEmail;
      });

      if (!matchedAccount) {
        reject(new Error('No registered arbitrator found. Please complete the registration process.'));
        return;
      }

      const account = {
        ...(matchedAccount.auth || {}),
        email: normalizeEmail((matchedAccount.auth && matchedAccount.auth.email) || matchedAccount.profile.email),
        role: (matchedAccount.auth && matchedAccount.auth.role) || 'arbitrator',
        approved: matchedAccount.auth ? matchedAccount.auth.approved !== false : true,
        password: String((matchedAccount.auth && matchedAccount.auth.password) || '')
      };

      if (!matchedAccount.registration || matchedAccount.registration.isComplete !== true) {
        reject(new Error('Please complete the registration process before logging in.'));
        return;
      }

      if (account.email !== normalizedEmail) {
        reject(new Error('Invalid credentials. Only registered arbitrators can access this portal.'));
        return;
      }

      if (account.role !== expectedRole) {
        reject(new Error('This account is not registered as an arbitrator.'));
        return;
      }

      if (!account.approved) {
        reject(new Error('Your arbitrator account is not active yet.'));
        return;
      }

      // Backward-compatible migration for existing local demo accounts with no stored password yet.
      if (!account.password) {
        account.password = providedPassword;
        matchedAccount.auth = account;
      } else if (account.password !== providedPassword) {
        reject(new Error('Incorrect password. Please try again.'));
        return;
      }

      const authData = {
        name: matchedAccount.profile.name,
        email: account.email,
        phone: String(matchedAccount.profile.phone || '').trim(),
        isLoggedIn: true,
        role: 'arbitrator'
      };

      matchedAccount.profile.email = authData.email;

      if (typeof setActiveArbitratorId === 'function' && matchedAccount.profile && matchedAccount.profile.id) {
        setActiveArbitratorId(matchedAccount.profile.id);
      }

      if (typeof upsertArbitratorAccount === 'function') {
        upsertArbitratorAccount(matchedAccount);
      }

      saveArbitratorDatabase(matchedAccount);
      writeStorageJSON(AUTH_KEYS.ARBITRATOR, authData);
      persistActiveUser(authData);

      resolve(authData);
    }, 500);
  });
}

function arbitratorSignup(name, email, password, metadata = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const trimmedName = String(name || '').trim();
      const normalizedEmail = normalizeEmail(email);
      const providedPassword = String(password || '');

      if (!trimmedName || !normalizedEmail || !providedPassword) {
        reject(new Error('All fields are required'));
        return;
      }

      if (!isValidHumanName(trimmedName)) {
        reject(new Error('Please enter a valid full name using letters only.'));
        return;
      }

      if (!isValidEmail(normalizedEmail)) {
        reject(new Error('Please enter a valid email address'));
        return;
      }

      if (!isStrongPassword(providedPassword)) {
        reject(new Error('Password must be at least 8 characters long'));
        return;
      }

      const existingAccount = getArbitratorAccountRegistry().find((account) => {
        const accountEmail = normalizeEmail(
          (account.auth && account.auth.email) ||
          (account.profile && account.profile.email)
        );
        return accountEmail === normalizedEmail;
      });

      if (existingAccount) {
        reject(new Error('An arbitrator account with this email already exists. Please log in instead.'));
        return;
      }

      const arbitratorDB = getArbitratorDatabase() || {};
      const previousProfile = { ...(arbitratorDB.profile || {}) };
      arbitratorDB.registration = {
        ...(arbitratorDB.registration || {}),
        isComplete: true,
        lastStep: 4,
        formData: {
          ...((arbitratorDB.registration && arbitratorDB.registration.formData) || {}),
          password: providedPassword
        }
      };
      arbitratorDB.profile = {
        ...(arbitratorDB.profile || {}),
        name: trimmedName,
        email: normalizedEmail,
        phone: String(metadata.phone || (arbitratorDB.profile && arbitratorDB.profile.phone) || '').trim(),
        location: String(metadata.location || (arbitratorDB.profile && arbitratorDB.profile.location) || '').trim(),
        title: String(metadata.title || (arbitratorDB.profile && arbitratorDB.profile.title) || 'Senior Arbitrator').trim(),
        avatar: String(
          metadata.avatar ||
          (arbitratorDB.profile && arbitratorDB.profile.avatar) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=1E3A8A&color=fff&size=128`
        )
      };
      arbitratorDB.auth = {
        ...(arbitratorDB.auth || {}),
        id: String((arbitratorDB.profile && arbitratorDB.profile.id) || (typeof generateArbitratorId === 'function' ? generateArbitratorId() : `ARB-${Date.now()}`)),
        email: normalizedEmail,
        password: providedPassword,
        role: 'arbitrator',
        approved: metadata.approved !== false
      };
      arbitratorDB.profile.id = arbitratorDB.auth.id;

      if (typeof personalizeArbitratorWorkspace === 'function') {
        personalizeArbitratorWorkspace(arbitratorDB, arbitratorDB.profile, previousProfile);
      }

      if (typeof setActiveArbitratorId === 'function') {
        setActiveArbitratorId(arbitratorDB.profile.id);
      }

      if (typeof upsertArbitratorAccount === 'function') {
        upsertArbitratorAccount(arbitratorDB);
      }

      saveArbitratorDatabase(arbitratorDB);

      const authData = {
        name: trimmedName,
        email: normalizedEmail,
        phone: arbitratorDB.profile.phone,
        isLoggedIn: true,
        role: 'arbitrator'
      };

      writeStorageJSON(AUTH_KEYS.ARBITRATOR, authData);
      persistActiveUser(authData);

      resolve(authData);
    }, 500);
  });
}

function arbitratorLogout() {
  const activeUser = getActiveUser();

  localStorage.removeItem(AUTH_KEYS.ARBITRATOR);

  if (!activeUser || activeUser.role === 'arbitrator') {
    removeStorageKeys(AUTH_KEYS.ACTIVE_USER, AUTH_KEYS.ACTIVE_SESSION);
  }

  if (typeof clearActiveArbitratorId === 'function') {
    clearActiveArbitratorId();
  }

  if (typeof beginNewArbitratorApplication === 'function') {
    beginNewArbitratorApplication();
  }
}

function resetArbitratorPassword(identifier, nextPassword) {
  const lookupValue = normalizeEmail(identifier);
  if (!lookupValue) {
    throw new Error('Enter a valid arbitrator email address first.');
  }

  if (!isStrongPassword(nextPassword)) {
    throw new Error('Your new password must be at least 8 characters and include upper, lower, number, and symbol.');
  }

  const accounts = getArbitratorAccountRegistry();
  const account = accounts.find((entry) => normalizeEmail(
    (entry.auth && entry.auth.email) || (entry.profile && entry.profile.email)
  ) === lookupValue);

  if (!account) {
    throw new Error('We could not find a registered arbitrator with that email address.');
  }

  account.auth = {
    ...(account.auth || {}),
    email: lookupValue,
    password: String(nextPassword || ''),
    role: 'arbitrator',
    approved: account.auth ? account.auth.approved !== false : true
  };

  if (typeof upsertArbitratorAccount === 'function') {
    upsertArbitratorAccount(account);
  } else if (typeof saveArbitratorAccounts === 'function') {
    const updatedAccounts = accounts.map((entry) => (
      String((entry.profile && entry.profile.id) || '') === String((account.profile && account.profile.id) || '')
        ? account
        : entry
    ));
    saveArbitratorAccounts(updatedAccounts);
  }

  const activeArbitrator = typeof getActiveArbitratorId === 'function'
    ? getActiveArbitratorId()
    : '';
  if (activeArbitrator && account.profile && String(account.profile.id || '') === String(activeArbitrator)) {
    saveArbitratorDatabase(account);
  }

  return account;
}

/* ============================================
   SHARED SESSION FUNCTIONS
   ============================================ */
function getActiveSession() {
  const sessionData = readStorageJSON(AUTH_KEYS.ACTIVE_SESSION, null);
  if (sessionData && sessionData.email && sessionData.role) {
    return {
      ...sessionData,
      email: normalizeEmail(sessionData.email),
      isLoggedIn: sessionData.isLoggedIn !== false
    };
  }

  const activeUser = getActiveUser();
  if (!activeUser) return null;

  return writeStorageJSON(AUTH_KEYS.ACTIVE_SESSION, {
    role: activeUser.role,
    email: activeUser.email,
    isLoggedIn: true
  });
}

function getActiveUser() {
  const activeUser = readStorageJSON(AUTH_KEYS.ACTIVE_USER, null);
  if (activeUser && activeUser.email && activeUser.role) {
    return {
      ...activeUser,
      email: normalizeEmail(activeUser.email),
      isLoggedIn: activeUser.isLoggedIn !== false
    };
  }

  const providerSession = readStorageJSON(AUTH_KEYS.PROVIDER, null);
  if (providerSession && providerSession.email) {
    return persistActiveUser({
      ...providerSession,
      email: normalizeEmail(providerSession.email),
      role: 'provider'
    });
  }

  const arbitratorSession = readStorageJSON(AUTH_KEYS.ARBITRATOR, null);
  if (arbitratorSession && arbitratorSession.email) {
    return persistActiveUser({
      ...arbitratorSession,
      email: normalizeEmail(arbitratorSession.email),
      role: 'arbitrator'
    });
  }

  return null;
}

function isLoggedIn() {
  const session = getActiveSession();
  return session && session.isLoggedIn !== false;
}

async function logout() {
  const confirmed = await showAppModal("Confirm Sign Out", "Are you sure you want to log out from ServiceHub?", {
    confirm: true,
    type: "danger",
    okText: "Sign Out"
  });
  if (!confirmed) return;

  const session = getActiveSession();
  if (session) {
    if (session.role === 'provider') providerLogout();
    else if (session.role === 'arbitrator') arbitratorLogout();
  }
  window.location.href = '../Landing_Page/index.html';
}

async function logoutArbitrator() {
  const confirmed = await showAppModal("Confirm Logout", "Are you sure you want to end your arbitrator session?", {
    confirm: true,
    type: "danger",
    okText: "Logout"
  });
  if (!confirmed) return;

  arbitratorLogout();
  window.location.href = 'arbitrator_landing.html';
}

async function logoutProvider() {
  const confirmed = await showAppModal("Confirm Logout", "Are you sure you want to end your provider session?", {
    confirm: true,
    type: "danger",
    okText: "Logout"
  });
  if (!confirmed) return;

  providerLogout();
  window.location.href = 'login.html';
}

function handleLogoClick(e) {
  if (e) e.preventDefault();
  const session = getActiveSession();

  const path = window.location.pathname;
  let prefix = '';

  if (path.includes('/Landing_Page/')) {
    prefix = '../';
  }

  if (session && session.isLoggedIn) {
    if (session.role === 'provider') {
      if (path.includes('/provider/')) {
        window.location.href = 'provider_dashboard.html';
      } else {
        window.location.href = prefix + 'provider/provider_dashboard.html';
      }
    } else if (session.role === 'arbitrator') {
      if (path.includes('/arbitrator/')) {
        window.location.href = 'arbitrator_dashboard.html';
      } else {
        window.location.href = prefix + 'arbitrator/arbitrator_dashboard.html';
      }
    }
  } else {
    // Logged out
    if (path.includes('/Landing_Page/')) {
      window.location.href = 'index.html';
    } else {
      window.location.href = '../Landing_Page/index.html';
    }
  }
}

/**
 * Protect a page: redirect to login if not authenticated.
 * Usage: call protectPage('provider') at the top of dashboard pages.
 */
function protectPage(role) {
  const session = getActiveSession();
  const activeUser = getActiveUser();

  if (!session || !activeUser || !session.isLoggedIn || session.role !== role || activeUser.role !== role) {
    // Redirect based on role
    if (role === 'provider') {
      window.location.href = 'login.html';
    } else if (role === 'arbitrator') {
      window.location.href = 'arbitrator_login.html';
    }
    return false;
  }
  return true;
}
