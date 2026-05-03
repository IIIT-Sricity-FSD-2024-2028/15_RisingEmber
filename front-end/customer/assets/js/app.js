// customer/assets/js/app.js
// Shared runtime for customer auth, shell UI, storage sync, and notifications.

(function attachCustomerApp(window, document) {
  if (!window || !document) return;

  const KEYS = {
    ACCOUNTS: "serviceHub_customer_accounts",
    USER: "serviceHub_user",
    SESSION: "serviceHub_customer_session",
    BOOTSTRAP: "serviceHub_customer_bootstrapped",
    REDIRECT_AFTER_AUTH: "serviceHub_customer_redirect_after_auth",
    BOOKINGS: "serviceHub_bookings",
    DISPUTES: "serviceHub_disputes",
    NOTIFICATIONS: "serviceHub_notifications",
    PENDING_BOOKING: "pendingBooking",
    PENDING_DISPUTE: "pendingDisputeContext",
    SELECTED_SERVICE: "selectedServiceId",
    SELECTED_DISPUTE: "selectedDisputeId",
    LATEST_DISPUTE: "latestDisputeId",
    LATEST_BOOKING: "latestBookingId",
    SELECTED_BOOKING: "selectedBookingId",
    LATEST_CANCELLATION: "latestCancellationBookingId"
  };

  const AUTH_PAGES = new Set(["login.html", "signup.html"]);
  const DEFAULT_PASSWORD = "Customer@123";
  const STYLE_ID = "customer-app-runtime-styles";
  const DEFAULT_MEMBER_SINCE = "January 2024";
  const API_BASE_URL_KEY = "serviceHub_api_base_url";
  const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000/api/v1";
  let dropdownsBound = false;
  let customerReadyPromise = Promise.resolve();

  function injectRuntimeStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .customer-toast-stack {
        position: fixed;
        right: 20px;
        bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 99999;
        max-width: min(360px, calc(100vw - 32px));
        pointer-events: none;
      }
      .customer-toast {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #111827;
        color: #FFFFFF;
        padding: 14px 16px;
        border-radius: 12px;
        box-shadow: 0 12px 30px rgba(17, 24, 39, 0.18);
        border-left: 4px solid #2F54EB;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .customer-toast.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .customer-toast--success { border-left-color: #10B981; }
      .customer-toast--error { border-left-color: #EF4444; }
      .customer-toast--warning { border-left-color: #F59E0B; }
      .customer-toast--info { border-left-color: #2F54EB; }
      .customer-toast__icon {
        margin-top: 2px;
        font-size: 15px;
        flex-shrink: 0;
      }
      .customer-toast__body {
        font-size: 0.9rem;
        line-height: 1.45;
        white-space: pre-line;
      }
      .form-feedback {
        display: none;
        margin-bottom: 16px;
        padding: 12px 14px;
        border-radius: 10px;
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.45;
      }
      .form-feedback.is-visible {
        display: block;
      }
      .form-feedback--success {
        background: #ECFDF5;
        color: #047857;
        border: 1px solid #A7F3D0;
      }
      .form-feedback--error {
        background: #FEF2F2;
        color: #B91C1C;
        border: 1px solid #FECACA;
      }
      .form-feedback--info {
        background: #EFF6FF;
        color: #1D4ED8;
        border: 1px solid #BFDBFE;
      }
      .customer-dropdown-action {
        border: none;
        background: transparent;
        color: #2F54EB;
        font-weight: 700;
        font-size: 0.8rem;
      }
      .customer-dropdown-empty {
        padding: 24px 20px;
        text-align: center;
        color: #6B7280;
        font-size: 0.88rem;
      }
      .customer-dropdown-empty i {
        display: block;
        font-size: 24px;
        color: #9CA3AF;
        margin-bottom: 10px;
      }
      .customer-file-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }
      .customer-file-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid #E8ECF4;
        border-radius: 10px;
        background: #F9FAFB;
        font-size: 0.84rem;
        color: #374151;
      }
      .customer-file-chip button {
        color: #EF4444;
        font-weight: 700;
      }
      .customer-inline-note {
        font-size: 0.76rem;
        color: #6B7280;
        margin-top: 6px;
      }
      .customer-modal-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(4px);
        z-index: 100000;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .customer-modal-overlay.is-visible {
        opacity: 1;
      }
      .customer-modal {
        width: min(460px, 100%);
        background: #FFFFFF;
        border-radius: 20px;
        box-shadow: 0 30px 80px rgba(15, 23, 42, 0.22);
        overflow: hidden;
        transform: translateY(14px) scale(0.98);
        transition: transform 0.2s ease;
      }
      .customer-modal-overlay.is-visible .customer-modal {
        transform: translateY(0) scale(1);
      }
      .customer-modal__header {
        padding: 24px 24px 10px;
      }
      .customer-modal__header h3 {
        margin: 0;
        font-size: 1.18rem;
        font-weight: 800;
        color: #111827;
      }
      .customer-modal__body {
        padding: 0 24px 24px;
      }
      .customer-modal__body p {
        margin: 0;
        color: #4B5563;
        line-height: 1.6;
        font-size: 0.95rem;
        white-space: pre-line;
      }
      .customer-modal__input-wrap {
        margin-top: 16px;
      }
      .customer-modal__input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #D1D5DB;
        border-radius: 12px;
        font: inherit;
        color: #111827;
      }
      .customer-modal__input:focus {
        outline: none;
        border-color: #2F54EB;
        box-shadow: 0 0 0 3px rgba(47, 84, 235, 0.12);
      }
      .customer-modal__footer {
        display: flex;
        gap: 12px;
        padding: 0 24px 24px;
      }
      .customer-modal__btn {
        flex: 1;
        border: none;
        border-radius: 12px;
        padding: 12px 16px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }
      .customer-modal__btn:hover {
        transform: translateY(-1px);
      }
      .customer-modal__btn--cancel {
        background: #F3F4F6;
        color: #4B5563;
      }
      .customer-modal__btn--primary {
        background: #2F54EB;
        color: #FFFFFF;
        box-shadow: 0 12px 24px rgba(47, 84, 235, 0.2);
      }
      .customer-modal__btn--danger {
        background: #DC2626;
        color: #FFFFFF;
        box-shadow: 0 12px 24px rgba(220, 38, 38, 0.18);
      }
      @media (max-width: 640px) {
        .customer-toast-stack {
          left: 16px;
          right: 16px;
          bottom: 16px;
          max-width: none;
        }
        .customer-modal__footer {
          flex-direction: column-reverse;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function readJSON(key, fallback) {
    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (error) {
      console.warn(`Unable to parse localStorage key "${key}".`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function removeKeys() {
    Array.from(arguments).forEach((key) => window.localStorage.removeItem(key));
  }

  function getPageName() {
    return window.location.pathname.split("/").pop() || "customer_dashboard.html";
  }

  function isSafeRedirectTarget(target) {
    const value = String(target || "").trim();
    return Boolean(value) && !value.startsWith("http://") && !value.startsWith("https://") && !value.startsWith("//");
  }

  function getRedirectTarget() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryTarget = urlParams.get("redirect");

    if (isSafeRedirectTarget(queryTarget)) {
      writeJSON(KEYS.REDIRECT_AFTER_AUTH, queryTarget);
      return queryTarget;
    }

    const storedTarget = readJSON(KEYS.REDIRECT_AFTER_AUTH, null);
    return isSafeRedirectTarget(storedTarget) ? storedTarget : null;
  }

  function consumeRedirectTarget() {
    const target = getRedirectTarget();
    removeKeys(KEYS.REDIRECT_AFTER_AUTH);
    return isSafeRedirectTarget(target) ? target : null;
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function isValidPhone(value) {
    const digits = normalizePhone(value);
    return digits.length >= 10 && digits.length <= 15;
  }

  function isValidHumanName(value) {
    const normalizedName = String(value || "").trim().replace(/\s+/g, " ");
    return normalizedName.length >= 2 && /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/.test(normalizedName);
  }

  function isStrongPassword(value) {
    const password = String(value || "");
    return (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[char] || char;
    });
  }

  function formatDisplayDate(value, options) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");
    return date.toLocaleDateString("en-US", options || { month: "long", day: "numeric", year: "numeric" });
  }

  function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback !== undefined ? fallback : 0);
  }

  function toIsoDate(value, fallback) {
    const date = new Date(value || fallback || Date.now());
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  }

  function toIsoTimestamp(value, fallback) {
    const date = new Date(value || fallback || Date.now());
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  }

  function formatRelativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hr ago`;
    if (diffMinutes < 10080) return `${Math.round(diffMinutes / 1440)} day${diffMinutes >= 2880 ? "s" : ""} ago`;
    return formatDisplayDate(date, { month: "short", day: "numeric" });
  }

  function getMonthYearLabel(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function buildAvatarUrl(name, avatar) {
    const providedAvatar = String(avatar || "").trim();
    if (providedAvatar) return providedAvatar;

    const safeName = encodeURIComponent(String(name || "Customer").trim() || "Customer");
    return `https://ui-avatars.com/api/?name=${safeName}&background=2F54EB&color=fff`;
  }

  function sanitizeCustomerRecord(rawCustomer) {
    const source = rawCustomer && typeof rawCustomer === "object" ? rawCustomer : {};
    const name = String(source.name || "Ashwin").trim() || "Ashwin";
    const email = normalizeEmail(source.email || "ashwin@example.com");
    const phone = String(source.phone || "+1 (555) 123-4567").trim();
    const location = String(source.location || "New York, NY").trim();
    const memberSince = String(source.memberSince || DEFAULT_MEMBER_SINCE).trim();

    return {
      id: String(source.id || `CUS-${email || Date.now()}`).trim(),
      name,
      email,
      phone,
      location,
      memberSince,
      avatar: String(source.avatar || "").trim(),
      createdAt: source.createdAt || new Date().toISOString(),
      role: "customer",
      password: String(source.password || DEFAULT_PASSWORD)
    };
  }

  function toPublicCustomer(rawCustomer) {
    const customer = sanitizeCustomerRecord(rawCustomer);
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      location: customer.location,
      memberSince: customer.memberSince,
      avatar: customer.avatar,
      createdAt: customer.createdAt,
      role: customer.role
    };
  }

  function getCustomerAccounts() {
    const accounts = readJSON(KEYS.ACCOUNTS, []);
    if (!Array.isArray(accounts)) return [];
    return accounts.map(sanitizeCustomerRecord);
  }

  function saveCustomerAccounts(accounts) {
    return writeJSON(KEYS.ACCOUNTS, Array.isArray(accounts) ? accounts.map(sanitizeCustomerRecord) : []);
  }

  function findCustomerAccountIndex(identifier, accounts) {
    const lookupValue = String(identifier || "").trim();
    if (!lookupValue) return -1;

    const safeAccounts = Array.isArray(accounts) ? accounts : getCustomerAccounts();
    const lookupEmail = normalizeEmail(lookupValue);
    const lookupPhone = normalizePhone(lookupValue);

    return safeAccounts.findIndex((account) => (
      account.email === lookupEmail || normalizePhone(account.phone) === lookupPhone
    ));
  }

  async function resetCustomerPassword(identifier, nextPassword) {
    const accounts = getCustomerAccounts();
    const accountIndex = findCustomerAccountIndex(identifier, accounts);

    if (accountIndex === -1 && !isValidEmail(identifier) && !isValidPhone(identifier)) {
      throw new Error("We couldn't find an account with that email or phone.");
    }

    if (!isStrongPassword(nextPassword)) {
      throw new Error("Your new password must be at least 8 characters and include upper, lower, number, and symbol.");
    }

    const resetResult = await requestCustomerApi("/session/password-reset", {
      method: "POST",
      body: {
        role: "customer",
        identifier,
        password: String(nextPassword || "")
      }
    });

    if (accountIndex !== -1) {
      accounts[accountIndex] = sanitizeCustomerRecord({
        ...accounts[accountIndex],
        password: String(nextPassword || "")
      });
      saveCustomerAccounts(accounts);
      return accounts[accountIndex];
    }

    return mergeCustomerAccount({
      id: resetResult.profileSummary.id,
      name: resetResult.profileSummary.name,
      email: resetResult.profileSummary.email,
      phone: resetResult.profileSummary.phone,
      avatar: resetResult.profileSummary.avatarUrl || "",
      location: resetResult.profileSummary.profile && (resetResult.profileSummary.profile.address || resetResult.profileSummary.profile.city) || "",
      memberSince: getMonthYearLabel(resetResult.profileSummary.createdAt),
      createdAt: resetResult.profileSummary.createdAt,
      password: String(nextPassword || "")
    }, nextPassword);
  }

  function saveCurrentCustomer(customer, persistSession) {
    const publicCustomer = toPublicCustomer(customer);
    writeJSON(KEYS.USER, publicCustomer);
    if (persistSession !== false) {
      writeJSON(KEYS.SESSION, { ...publicCustomer, isLoggedIn: true });
    }
    return publicCustomer;
  }

  function getCurrentCustomer() {
    const session = readJSON(KEYS.SESSION, null);
    if (session && session.email) return toPublicCustomer(session);

    const user = readJSON(KEYS.USER, null);
    if (user && user.email) return toPublicCustomer(user);

    return null;
  }

  function getCustomerSession() {
    const session = readJSON(KEYS.SESSION, null);
    return session && session.email ? toPublicCustomer(session) : null;
  }

  function getSessionAccount() {
    const session = readJSON(KEYS.SESSION, null);
    if (!session || !session.email) return null;

    return getCustomerAccounts().find((account) => account.email === normalizeEmail(session.email)) || null;
  }

  function getCustomerApiBaseUrl() {
    const explicitBaseUrl = String(
      window.SERVICE_HUB_API_BASE_URL ||
      window.localStorage.getItem(API_BASE_URL_KEY) ||
      DEFAULT_API_BASE_URL
    ).trim();

    return explicitBaseUrl.replace(/\/+$/, "");
  }

  function getCustomerApiHeaders(customerOverride) {
    const customer = customerOverride || getCurrentCustomer();
    if (!customer || !customer.id) return {};

    return {
      "x-role": "customer",
      "x-actor-id": customer.id
    };
  }

  function buildApiErrorMessage(payload, fallbackMessage) {
    if (!payload) return fallbackMessage;
    if (typeof payload === "string") return payload;
    if (Array.isArray(payload.message)) return payload.message.join("\n");
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.error === "string") return payload.error;
    return fallbackMessage;
  }

  async function requestCustomerApi(path, options) {
    const config = options && typeof options === "object" ? options : {};
    const headers = { ...(config.headers || {}) };
    let requestBody = config.body;

    if (requestBody !== undefined && requestBody !== null && !(requestBody instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      requestBody = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody);
    }

    let response;
    try {
      response = await window.fetch(`${getCustomerApiBaseUrl()}${path}`, {
        method: config.method || "GET",
        headers,
        body: requestBody
      });
    } catch (error) {
      throw new Error("We couldn't reach the ServiceHub backend. Please make sure the NestJS server is running.");
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(buildApiErrorMessage(payload, "The backend request could not be completed."));
    }

    if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data")) {
      return payload.data;
    }

    return payload;
  }

  function mapCaseStatusToDisputeStatus(status) {
    const value = String(status || "").trim().toLowerCase();
    if (value === "resolved" || value === "closed") return "resolved";
    if (["under_review", "assigned", "hearing_scheduled", "evidence_review"].includes(value)) return "review";
    return "pending";
  }

  function buildServiceImage(title, category) {
    const label = String(title || category || "Service").trim() || "Service";
    const hue = Math.abs(label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue}, 72%, 60%)" />
            <stop offset="100%" stop-color="hsl(${(hue + 38) % 360}, 78%, 42%)" />
          </linearGradient>
        </defs>
        <rect width="1200" height="720" fill="url(#g)" />
        <circle cx="960" cy="160" r="180" fill="rgba(255,255,255,0.12)" />
        <circle cx="180" cy="560" r="220" fill="rgba(255,255,255,0.10)" />
        <text x="96" y="270" fill="#ffffff" font-family="Arial, sans-serif" font-size="76" font-weight="700">${escapeHTML(label).slice(0, 22)}</text>
        <text x="96" y="350" fill="rgba(255,255,255,0.85)" font-family="Arial, sans-serif" font-size="34">${escapeHTML(String(category || "ServiceHub"))}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function stripBackendWorkflowNote(note) {
    return String(note || "").replace(/^\[stage:[a-z_]+\]\s*/i, "").trim();
  }

  function formatTimeFromIso(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "10:00 AM";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function buildScheduledIso(dateValue, timeValue) {
    const safeDate = toIsoDate(dateValue, Date.now());
    const match = String(timeValue || "10:00 AM").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    let hours = 10;
    let minutes = 0;

    if (match) {
      hours = Number(match[1]) % 12;
      minutes = Number(match[2]) || 0;
      if (String(match[3]).toUpperCase() === "PM") hours += 12;
    }

    const scheduled = new Date(`${safeDate}T00:00:00`);
    scheduled.setHours(hours, minutes, 0, 0);
    return scheduled.toISOString();
  }

  function mergeCustomerAccount(customer, passwordOverride) {
    const account = sanitizeCustomerRecord({
      ...customer,
      password: passwordOverride || customer.password || DEFAULT_PASSWORD
    });
    const existingAccounts = getCustomerAccounts();
    const nextAccounts = existingAccounts.slice();
    const accountIndex = nextAccounts.findIndex((entry) => entry.email === account.email || entry.id === account.id);

    if (accountIndex === -1) nextAccounts.unshift(account);
    else nextAccounts[accountIndex] = account;

    saveCustomerAccounts(nextAccounts);
    return account;
  }

  function persistCustomerFromBackend(profileSummary, passwordOverride) {
    const profile = profileSummary && profileSummary.profile ? profileSummary.profile : {};
    const persistedAccount = mergeCustomerAccount({
      id: profileSummary.id,
      name: profileSummary.name,
      email: profileSummary.email,
      phone: profileSummary.phone,
      avatar: profileSummary.avatarUrl || "",
      location: profile.address || profile.city || "",
      memberSince: profileSummary.createdAt ? getMonthYearLabel(profileSummary.createdAt) : DEFAULT_MEMBER_SINCE,
      createdAt: profileSummary.createdAt || new Date().toISOString()
    }, passwordOverride || (getSessionAccount() && getSessionAccount().password));

    return saveCurrentCustomer(persistedAccount, true);
  }

  function mapBackendService(service) {
    return {
      id: service.id,
      title: service.title,
      providerName: service.providerName || service.businessName || "Service Professional",
      provider: service.providerName || service.businessName || "Service Professional",
      providerId: service.providerId,
      providerImage: buildAvatarUrl(service.providerName || service.businessName || "Provider"),
      price: toNumber(service.price, 0),
      category: String(service.category || "General").trim(),
      rating: toNumber(service.rating, 4.8),
      reviews: toNumber(service.reviewCount, 0),
      description: String(service.description || "").trim(),
      image: service.image || buildServiceImage(service.title, service.category),
      location: String(service.location || "").trim(),
      durationMinutes: toNumber(service.durationMinutes, 120),
      tags: Array.isArray(service.tags) ? service.tags.slice() : []
    };
  }

  function mapBackendBooking(booking) {
    return normalizeBookingRecord({
      bookingId: booking.id,
      serviceId: booking.serviceId,
      title: booking.service && booking.service.title ? booking.service.title : booking.title,
      provider: booking.provider && booking.provider.name ? booking.provider.name : booking.providerName,
      providerImage: buildAvatarUrl(
        booking.provider && booking.provider.name ? booking.provider.name : booking.providerName || "Provider"
      ),
      date: toIsoDate(booking.scheduledAt, booking.createdAt),
      time: formatTimeFromIso(booking.scheduledAt),
      address: booking.address || "",
      durationHours: Math.max(1, Math.round(toNumber(
        booking.service && booking.service.durationMinutes ? booking.service.durationMinutes / 60 : booking.durationHours,
        2
      ))),
      unitPrice: toNumber(booking.service && booking.service.price, booking.totalAmount),
      total: toNumber(booking.totalAmount, 0),
      status: booking.status,
      createdAt: booking.createdAt,
      cancellationReason: booking.cancellationReason || "",
      cancellationNotes: stripBackendWorkflowNote(booking.lastStatusNote || ""),
      cancelledAt: booking.status === "cancelled" ? booking.updatedAt : "",
      customerEmail: booking.customer && booking.customer.email ? booking.customer.email : "",
      customerId: booking.customerId
    });
  }

  function mapBackendCase(caseRecord) {
    const booking = caseRecord.booking || {};
    const messages = Array.isArray(caseRecord.messages) ? caseRecord.messages : [];
    const firstMessage = messages[0] || null;

    return normalizeDisputeRecord({
      id: caseRecord.id,
      bookingId: caseRecord.bookingId,
      service: booking.service && booking.service.title ? booking.service.title : caseRecord.title,
      provider: caseRecord.provider && caseRecord.provider.name ? caseRecord.provider.name : "",
      category: caseRecord.priority || "other",
      status: mapCaseStatusToDisputeStatus(caseRecord.status),
      date: toIsoDate(caseRecord.createdAt, caseRecord.createdAt),
      submittedAt: caseRecord.createdAt,
      desc: caseRecord.description,
      evidence: [],
      timeline: [
        {
          title: "Dispute Submitted",
          detail: caseRecord.description,
          status: "completed",
          at: caseRecord.createdAt
        }
      ].concat(messages.map((message, index) => ({
        title: index === 0 ? "Initial Statement" : "Case Update",
        detail: message.message,
        status: index === 0 ? "completed" : "active",
        at: message.createdAt || firstMessage && firstMessage.createdAt || caseRecord.updatedAt
      })))
    });
  }

  function mapBackendNotification(notification) {
    const iconMap = {
      booking: "fa-calendar-check",
      case: "fa-shield-halved",
      hearing: "fa-gavel",
      award: "fa-scale-balanced",
      service: "fa-briefcase",
      profile: "fa-user-pen",
      application: "fa-file-signature",
      document: "fa-file-lines"
    };
    const toneMap = {
      success: "green",
      warning: "orange",
      critical: "red",
      info: "blue"
    };
    const hrefMap = {
      booking: "my-bookings.html",
      case: "disputes.html",
      hearing: "disputes.html",
      award: "dispute-status.html",
      service: "browse-services.html",
      profile: "profile.html",
      application: "profile.html",
      document: "dispute-status.html"
    };

    return {
      id: notification.id,
      title: notification.title,
      message: notification.body,
      href: hrefMap[notification.entityType] || "customer_dashboard.html",
      icon: iconMap[notification.entityType] || "fa-bell",
      tone: toneMap[notification.tone] || "blue",
      unread: notification.read !== true,
      createdAt: notification.createdAt
    };
  }

  async function syncCustomerBackendData(options) {
    const config = options && typeof options === "object" ? options : {};
    const customer = getCurrentCustomer();

    try {
      const servicePromise = requestCustomerApi("/services");

      if (!customer || !customer.id) {
        const services = await servicePromise;
        writeJSON("serviceHub_services", Array.isArray(services) ? services.map(mapBackendService) : []);
        return { services };
      }

      const headers = getCustomerApiHeaders(customer);
      const [services, me, bookings, cases, notifications] = await Promise.all([
        servicePromise,
        requestCustomerApi("/users/me", { headers }),
        requestCustomerApi("/bookings", { headers }),
        requestCustomerApi("/cases", { headers }),
        requestCustomerApi("/notifications", { headers })
      ]);

      persistCustomerFromBackend(me);
      writeJSON("serviceHub_services", Array.isArray(services) ? services.map(mapBackendService) : []);
      saveCustomerBookings(Array.isArray(bookings) ? bookings.map(mapBackendBooking) : []);
      saveCustomerDisputes(Array.isArray(cases) ? cases.map(mapBackendCase) : []);
      saveNotifications(Array.isArray(notifications) ? notifications.map(mapBackendNotification) : []);
      refreshShell();

      return { services, me, bookings, cases, notifications };
    } catch (error) {
      const message = String(error && error.message || "");
      if (
        message.includes("Unknown actor context") ||
        message.includes("x-role does not match actor") ||
        message.includes("Missing x-actor-id")
      ) {
        logoutCustomer();
        if (!AUTH_PAGES.has(getPageName())) {
          window.location.replace("login.html");
        }
      } else if (!config.silent) {
        console.warn("Customer backend sync failed:", error);
      }
      throw error;
    }
  }

  async function createCustomerBooking(payload) {
    const currentCustomer = getCurrentCustomer();
    if (!currentCustomer || !currentCustomer.id) {
      throw new Error("Please sign in again before creating a booking.");
    }

    const booking = await requestCustomerApi("/bookings", {
      method: "POST",
      headers: getCustomerApiHeaders(currentCustomer),
      body: {
        serviceId: payload.serviceId,
        scheduledAt: buildScheduledIso(payload.date, payload.time),
        notes: payload.notes || payload.title || "",
        address: payload.address || ""
      }
    });

    await syncCustomerBackendData({ silent: true });
    return mapBackendBooking(booking);
  }

  async function cancelCustomerBooking(bookingId, reason, notes) {
    const currentCustomer = getCurrentCustomer();
    if (!currentCustomer || !currentCustomer.id) {
      throw new Error("Please sign in again before cancelling this booking.");
    }

    const booking = await requestCustomerApi(`/bookings/${encodeURIComponent(bookingId)}`, {
      method: "PATCH",
      headers: getCustomerApiHeaders(currentCustomer),
      body: {
        status: "cancelled",
        cancellationReason: reason,
        note: notes || reason || "Booking cancelled by customer."
      }
    });

    await syncCustomerBackendData({ silent: true });
    return mapBackendBooking(booking);
  }

  async function createCustomerDispute(payload) {
    const currentCustomer = getCurrentCustomer();
    if (!currentCustomer || !currentCustomer.id) {
      throw new Error("Please sign in again before submitting a dispute.");
    }

    const nextCase = await requestCustomerApi("/cases", {
      method: "POST",
      headers: getCustomerApiHeaders(currentCustomer),
      body: {
        bookingId: payload.bookingId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority || "medium"
      }
    });

    const evidence = Array.isArray(payload.evidence) ? payload.evidence : [];
    for (const file of evidence) {
      await requestCustomerApi("/documents", {
        method: "POST",
        headers: getCustomerApiHeaders(currentCustomer),
        body: {
          caseId: nextCase.id,
          title: file.name || "Evidence",
          description: "Uploaded from the customer dispute form.",
          type: "evidence",
          fileName: file.name || "evidence.txt",
          content: file.dataUrl || ""
        }
      });
    }

    await syncCustomerBackendData({ silent: true });
    return mapBackendCase(nextCase);
  }

  function showAppModal(title, message, options) {
    return new Promise((resolve) => {
      injectRuntimeStyles();

      if (!document.body) {
        resolve(false);
        return;
      }

      const config = options && typeof options === "object" ? options : {};
      const isConfirm = config.confirm === true || config.prompt === true;
      const tone = config.type === "danger" ? "danger" : "primary";

      const overlay = document.createElement("div");
      overlay.className = "customer-modal-overlay";

      const dialog = document.createElement("div");
      dialog.className = "customer-modal";

      const header = document.createElement("div");
      header.className = "customer-modal__header";

      const heading = document.createElement("h3");
      heading.textContent = String(title || "Notice");
      header.appendChild(heading);

      const body = document.createElement("div");
      body.className = "customer-modal__body";

      const copy = document.createElement("p");
      copy.textContent = String(message || "");
      body.appendChild(copy);

      let input = null;
      if (config.prompt) {
        const inputWrap = document.createElement("div");
        inputWrap.className = "customer-modal__input-wrap";

        input = document.createElement("input");
        input.className = "customer-modal__input";
        input.type = config.inputType || "text";
        input.placeholder = config.placeholder || "";
        input.value = config.defaultValue || "";
        input.autocomplete = "off";
        inputWrap.appendChild(input);
        body.appendChild(inputWrap);
      }

      const footer = document.createElement("div");
      footer.className = "customer-modal__footer";

      let cancelButton = null;
      if (isConfirm) {
        cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "customer-modal__btn customer-modal__btn--cancel";
        cancelButton.textContent = config.cancelText || "Cancel";
        footer.appendChild(cancelButton);
      }

      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = `customer-modal__btn customer-modal__btn--${tone}`;
      confirmButton.textContent = config.okText || (config.prompt ? "Continue" : isConfirm ? "Confirm" : "Got it");
      footer.appendChild(confirmButton);

      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      function close(result) {
        overlay.classList.remove("is-visible");
        window.setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 180);
      }

      confirmButton.addEventListener("click", () => {
        if (config.prompt) {
          close(input ? input.value : "");
          return;
        }
        close(true);
      });

      if (cancelButton) {
        cancelButton.addEventListener("click", () => close(false));
      }

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay && isConfirm) {
          close(false);
        }
      });

      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          close(isConfirm ? false : true);
        }
      });

      if (input) {
        window.setTimeout(() => input.focus(), 40);
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            confirmButton.click();
          }
          if (event.key === "Escape") {
            close(false);
          }
        });
      } else {
        window.setTimeout(() => confirmButton.focus(), 40);
      }

      requestAnimationFrame(() => overlay.classList.add("is-visible"));
    });
  }

  function showAppPrompt(title, message, options) {
    return showAppModal(title, message, { ...(options || {}), prompt: true });
  }

  async function requestConfirmation(title, message, options) {
    if (typeof window.showAppModal === "function") {
      return Boolean(await window.showAppModal(title, message, options || {}));
    }

    showToast(message, options && options.type === "danger" ? "warning" : "info");
    return true;
  }

  async function requestPrompt(title, message, options) {
    if (typeof window.showAppPrompt === "function") {
      return window.showAppPrompt(title, message, options || {});
    }

    showToast(message, "info");
    return null;
  }

  function showDialogMessage(title, message, options) {
    if (typeof window.showAppModal === "function") {
      return window.showAppModal(title, message, options || {});
    }

    showToast(message, options && options.type === "danger" ? "error" : "info");
    return Promise.resolve(true);
  }

  function normalizeBookingStatus(status) {
    const value = String(status || "").trim().toLowerCase();
    if (value === "completed" || value === "done" || value === "resolved") return "Completed";
    if (value === "cancelled" || value === "canceled") return "Cancelled";
    return "Confirmed";
  }

  function normalizeBookingRecord(rawBooking, index) {
    const source = rawBooking && typeof rawBooking === "object" ? rawBooking : {};
    const durationHours = Math.max(1, toNumber(source.durationHours, 2));
    const explicitTotal = toNumber(source.total, NaN);
    const unitPrice = toNumber(source.unitPrice, toNumber(source.price, 0));
    const normalizedDate = toIsoDate(
      source.date || source.serviceDate || source.bookingDate || source.scheduledDate,
      Date.now() + (index + 1) * 86400000
    );

    return {
      bookingId: String(source.bookingId || source.id || `BK-${Date.now() + index}`).trim(),
      serviceId: String(source.serviceId || source.serviceRef || source.service || "").trim(),
      title: String(source.title || source.service || source.serviceName || source.name || "Booked Service").trim(),
      provider: String(source.provider || source.providerName || source.professional || source.company || "Service Professional").trim(),
      providerImage: String(source.providerImage || source.providerAvatar || "").trim(),
      date: normalizedDate,
      time: String(source.time || source.timeSlot || source.slot || "10:00 AM").trim(),
      address: String(source.address || source.serviceAddress || source.location || "").trim(),
      durationHours,
      unitPrice,
      total: Number.isFinite(explicitTotal) ? Number(explicitTotal.toFixed(2)) : Number((unitPrice * durationHours).toFixed(2)),
      status: normalizeBookingStatus(source.status),
      createdAt: toIsoTimestamp(source.createdAt || source.bookedAt, `${normalizedDate}T09:00:00`),
      cancellationReason: source.cancellationReason || "",
      cancellationNotes: source.cancellationNotes || "",
      cancelledAt: source.cancelledAt ? toIsoTimestamp(source.cancelledAt, `${normalizedDate}T09:00:00`) : "",
      customerEmail: normalizeEmail(source.customerEmail || source.email || ""),
      customerId: String(source.customerId || "").trim()
    };
  }

  function getCustomerBookings() {
    const bookings = readJSON(KEYS.BOOKINGS, []);
    if (!Array.isArray(bookings)) return [];
    return bookings.map(normalizeBookingRecord);
  }

  function saveCustomerBookings(bookings) {
    const safeBookings = Array.isArray(bookings) ? bookings.map(normalizeBookingRecord) : [];
    return writeJSON(KEYS.BOOKINGS, safeBookings);
  }

  function normalizeDisputeStatus(status) {
    const value = String(status || "").trim().toLowerCase();
    if (value === "resolved" || value === "closed") return "resolved";
    if (value === "review" || value === "under review" || value === "under_review" || value === "in_review") return "review";
    return "pending";
  }

  function normalizeEvidenceFile(file, index, fallbackTimestamp) {
    const source = file && typeof file === "object" ? file : {};
    const name = String(source.name || source.fileName || `Evidence-${index + 1}`).trim();
    return {
      name,
      size: Math.max(0, toNumber(source.size, 0)),
      type: String(source.type || "application/octet-stream").trim(),
      uploadedAt: toIsoTimestamp(source.uploadedAt || source.createdAt, fallbackTimestamp),
      dataUrl: String(source.dataUrl || source.fileLink || "").trim()
    };
  }

  function normalizeDisputeRecord(rawDispute, index) {
    const source = rawDispute && typeof rawDispute === "object" ? rawDispute : {};
    const submittedAt = toIsoTimestamp(source.submittedAt || source.createdAt || source.date, Date.now() - index * 86400000);
    const timeline = Array.isArray(source.timeline) ? source.timeline : [];

    return {
      id: String(source.id || `DSP-${String(Date.now() + index).slice(-8)}`).trim(),
      bookingId: String(source.bookingId || source.bookingRef || "").trim(),
      service: String(source.service || source.title || "Service Issue").trim(),
      provider: String(source.provider || source.providerName || "Service Professional").trim(),
      category: String(source.category || "other").trim(),
      status: normalizeDisputeStatus(source.status),
      date: toIsoDate(source.date || submittedAt, submittedAt),
      submittedAt,
      desc: String(source.desc || source.description || source.details || "").trim(),
      evidence: (Array.isArray(source.evidence) ? source.evidence : []).map((file, evidenceIndex) => (
        normalizeEvidenceFile(file, evidenceIndex, submittedAt)
      )),
      timeline: timeline.map((item, timelineIndex) => ({
        title: String(item && item.title || `Update ${timelineIndex + 1}`).trim(),
        detail: String(item && (item.detail || item.description) || "").trim(),
        status: String(item && item.status || "pending").trim(),
        at: item && item.at ? toIsoTimestamp(item.at, submittedAt) : ""
      }))
    };
  }

  function getCustomerDisputes() {
    const disputes = readJSON(KEYS.DISPUTES, []);
    if (!Array.isArray(disputes)) return [];
    return disputes.map(normalizeDisputeRecord);
  }

  function saveCustomerDisputes(disputes) {
    const safeDisputes = Array.isArray(disputes) ? disputes.map(normalizeDisputeRecord) : [];
    return writeJSON(KEYS.DISPUTES, safeDisputes);
  }

  function createDefaultNotifications(customer) {
    const firstName = String(customer.name || "Ashwin").split(" ")[0];
    return [
      {
        id: "NTF-001",
        title: "Upcoming appointment",
        message: `${firstName}, your Plumbing Repair booking is still on track for April 15.`,
        href: "my-bookings.html",
        icon: "fa-calendar-check",
        tone: "blue",
        unread: true,
        createdAt: "2026-04-01T08:30:00.000Z"
      },
      {
        id: "NTF-002",
        title: "Dispute update",
        message: "Your most recent dispute moved to Under Review.",
        href: "disputes.html",
        icon: "fa-shield-halved",
        tone: "orange",
        unread: true,
        createdAt: "2026-03-31T15:45:00.000Z"
      },
      {
        id: "NTF-003",
        title: "Profile tip",
        message: "Add your location in Profile so booking forms fill faster next time.",
        href: "profile.html",
        icon: "fa-user-gear",
        tone: "green",
        unread: false,
        createdAt: "2026-03-30T10:15:00.000Z"
      }
    ];
  }

  function getNotifications() {
    const notifications = readJSON(KEYS.NOTIFICATIONS, []);
    if (!Array.isArray(notifications)) return [];

    return notifications
      .filter((item) => item && typeof item === "object")
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  }

  function saveNotifications(notifications) {
    return writeJSON(KEYS.NOTIFICATIONS, Array.isArray(notifications) ? notifications : []);
  }

  function addNotification(title, message, options) {
    const config = options && typeof options === "object" ? options : {};
    const notifications = getNotifications();

    notifications.unshift({
      id: `NTF-${Date.now()}`,
      title: String(title || "Update"),
      message: String(message || ""),
      href: String(config.href || "customer_dashboard.html"),
      icon: String(config.icon || "fa-bell"),
      tone: String(config.tone || "blue"),
      unread: config.unread !== false,
      createdAt: new Date().toISOString()
    });

    saveNotifications(notifications.slice(0, 20));
    refreshShell();
  }

  function markAllNotificationsRead() {
    const notifications = getNotifications().map((item) => ({ ...item, unread: false }));
    saveNotifications(notifications);
    refreshShell();
  }

  function showToast(message, type) {
    injectRuntimeStyles();
    const text = String(message || "").trim();
    if (!text) return;

    let stack = document.querySelector(".customer-toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "customer-toast-stack";
      document.body.appendChild(stack);
    }

    const tone = ["success", "error", "warning", "info"].includes(type) ? type : "info";
    const iconMap = {
      success: "fa-circle-check",
      error: "fa-circle-exclamation",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info"
    };

    const toast = document.createElement("div");
    toast.className = `customer-toast customer-toast--${tone}`;
    toast.innerHTML = `
      <i class="fa-solid ${iconMap[tone]} customer-toast__icon" aria-hidden="true"></i>
      <div class="customer-toast__body"></div>
    `;
    toast.querySelector(".customer-toast__body").textContent = text;
    stack.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  function setFormFeedback(element, message, tone) {
    if (!element) return;
    const text = String(message || "").trim();

    element.className = "form-feedback";

    if (!text) {
      element.textContent = "";
      return;
    }

    element.textContent = text;
    element.classList.add("is-visible", `form-feedback--${tone || "info"}`);
  }

  function ensureCustomerStorage() {
    injectRuntimeStyles();

    let accounts = getCustomerAccounts();
    const legacyUser = readJSON(KEYS.USER, null);

    if (!accounts.length) {
      const starterAccount = sanitizeCustomerRecord(legacyUser || {});
      accounts = saveCustomerAccounts([starterAccount]);
    }

    const firstAccount = accounts[0];
    const storedSession = readJSON(KEYS.SESSION, null);

    if (storedSession && storedSession.email) {
      const matchingAccount = accounts.find((account) => account.email === normalizeEmail(storedSession.email));
      if (matchingAccount) {
        saveCurrentCustomer(matchingAccount, true);
      } else {
        removeKeys(KEYS.SESSION, KEYS.USER);
      }
    }

    if (!window.localStorage.getItem(KEYS.BOOTSTRAP)) {
      // Bootstrapping storage once, but NOT logging in anymore
      window.localStorage.setItem(KEYS.BOOTSTRAP, "true");
    } else if (!readJSON(KEYS.USER, null) && getSessionAccount()) {
      saveCurrentCustomer(getSessionAccount(), true);
    }

    const notifications = readJSON(KEYS.NOTIFICATIONS, null);
    if (!Array.isArray(notifications) || !notifications.length) {
      saveNotifications(createDefaultNotifications(getCurrentCustomer() || firstAccount));
    }

    saveCustomerBookings(getCustomerBookings());
    saveCustomerDisputes(getCustomerDisputes());
  }

  function protectCustomerPages() {
    const pageName = getPageName();
    if (AUTH_PAGES.has(pageName)) return;

    const session = getCustomerSession();
    if (!session) {
      const redirectTarget = `${pageName}${window.location.search || ""}${window.location.hash || ""}`;
      writeJSON(KEYS.REDIRECT_AFTER_AUTH, redirectTarget);
      window.location.replace(`login.html?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }

  function findAccountByLogin(identifier) {
    const loginValue = String(identifier || "").trim();
    const normalizedEmail = normalizeEmail(loginValue);
    const normalizedPhone = normalizePhone(loginValue);

    return getCustomerAccounts().find((account) => {
      return account.email === normalizedEmail || normalizePhone(account.phone) === normalizedPhone;
    }) || null;
  }

  async function loginCustomer(identifier, password) {
    const loginValue = String(identifier || "").trim();
    const passwordValue = String(password || "");

    if (!loginValue || !passwordValue) {
      throw new Error("Email or phone and password are required.");
    }

    const matchedAccount = findAccountByLogin(loginValue);
    const backendEmail = matchedAccount ? matchedAccount.email : normalizeEmail(loginValue);

    const loginData = await requestCustomerApi("/session/login", {
      method: "POST",
      body: {
        role: "customer",
        email: backendEmail,
        password: passwordValue
      }
    });

    const sessionCustomer = persistCustomerFromBackend(loginData.profileSummary, passwordValue);
    await syncCustomerBackendData({ silent: true });

    addNotification("Signed in", "You are now logged in to your customer account.", {
      href: "customer_dashboard.html",
      icon: "fa-right-to-bracket",
      tone: "green",
      unread: false
    });

    return sessionCustomer;
  }

  async function registerCustomer(payload) {
    const data = payload && typeof payload === "object" ? payload : {};
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email);
    const phone = String(data.phone || "").trim();
    const password = String(data.password || "");
    const location = String(data.location || "Location not set").trim();

    if (!isValidHumanName(name)) throw new Error("Please enter a valid full name using letters only.");
    if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
    if (!isValidPhone(phone)) throw new Error("Please enter a valid phone number.");
    if (!isStrongPassword(password)) {
      throw new Error("Password must be 8+ characters and include uppercase, lowercase, number, and symbol.");
    }

    const registration = await requestCustomerApi("/customers/register", {
      method: "POST",
      body: {
        name,
        email,
        phone,
        password,
        city: location
      }
    });

    const publicCustomer = persistCustomerFromBackend(registration.profileSummary, password);
    await syncCustomerBackendData({ silent: true });

    addNotification("Welcome to ServiceHub", "Your customer account is ready to use.", {
      href: "customer_dashboard.html",
      icon: "fa-user-plus",
      tone: "green",
      unread: false
    });

    return publicCustomer;
  }

  async function updateCustomerProfile(payload) {
    const sessionAccount = getSessionAccount();
    if (!sessionAccount) throw new Error("You need to log in again before updating your profile.");

    const updates = payload && typeof payload === "object" ? payload : {};
    const nextName = String(updates.name || "").trim();
    const nextEmail = normalizeEmail(updates.email);
    const nextPhone = String(updates.phone || "").trim();
    const nextLocation = String(updates.location || "").trim();

    if (!isValidHumanName(nextName)) throw new Error("Please enter a valid full name using letters only.");
    if (!isValidEmail(nextEmail)) throw new Error("Please enter a valid email address.");
    if (!isValidPhone(nextPhone)) throw new Error("Please enter a valid phone number.");
    if (nextLocation.length < 2) throw new Error("Please enter your city or service location.");

    const updatedProfile = await requestCustomerApi("/users/me", {
      method: "PATCH",
      headers: getCustomerApiHeaders(sessionAccount),
      body: {
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        avatarUrl: updates.avatar || sessionAccount.avatar || "",
        city: nextLocation,
        address: nextLocation
      }
    });

    const updatedCustomer = persistCustomerFromBackend(updatedProfile, sessionAccount.password);
    await syncCustomerBackendData({ silent: true });

    addNotification("Profile updated", "Your customer profile details were saved successfully.", {
      href: "profile.html",
      icon: "fa-user-pen",
      tone: "green",
      unread: false
    });

    return updatedCustomer;
  }

  async function updateCustomerPassword(currentPassword, newPassword) {
    const sessionAccount = getSessionAccount();
    if (!sessionAccount) throw new Error("You need to log in again before changing your password.");

    const currentValue = String(currentPassword || "");
    const nextValue = String(newPassword || "");

    if (!currentValue || !nextValue) {
      throw new Error("Please complete all password fields.");
    }
    if (sessionAccount.password !== currentValue) {
      throw new Error("Your current password is incorrect.");
    }
    if (currentValue === nextValue) {
      throw new Error("Your new password must be different from the current password.");
    }
    if (!isStrongPassword(nextValue)) {
      throw new Error("Password must be 8+ characters and include uppercase, lowercase, number, and symbol.");
    }

    await requestCustomerApi("/users/me", {
      method: "PATCH",
      headers: getCustomerApiHeaders(sessionAccount),
      body: {
        password: nextValue
      }
    });

    const updatedAccount = mergeCustomerAccount({
      ...sessionAccount,
      password: nextValue
    }, nextValue);
    saveCurrentCustomer(updatedAccount, true);

    addNotification("Password updated", "Your account password was changed successfully.", {
      href: "profile.html",
      icon: "fa-lock",
      tone: "green",
      unread: false
    });
  }

  function logoutCustomer() {
    removeKeys(
      KEYS.SESSION,
      KEYS.USER,
      KEYS.REDIRECT_AFTER_AUTH,
      KEYS.PENDING_BOOKING,
      KEYS.PENDING_DISPUTE,
      KEYS.SELECTED_SERVICE,
      KEYS.SELECTED_DISPUTE,
      KEYS.LATEST_DISPUTE,
      KEYS.LATEST_BOOKING,
      KEYS.SELECTED_BOOKING,
      KEYS.LATEST_CANCELLATION
    );
  }

  function syncCustomerDisplay() {
    const customer = getCurrentCustomer();
    if (!customer) return;

    const avatarUrl = buildAvatarUrl(customer.name, customer.avatar);
    const firstName = customer.name.split(" ")[0];

    document.querySelectorAll(".user-display-name").forEach((element) => {
      element.textContent = customer.name;
    });

    document.querySelectorAll(".user-display-email").forEach((element) => {
      element.textContent = customer.email;
    });

    document.querySelectorAll(".user-display-avatar, .navbar__avatar").forEach((element) => {
      if (element.tagName === "IMG") {
        element.src = avatarUrl;
        element.alt = `${customer.name} avatar`;
      }
    });

    const memberSince = document.getElementById("member-since");
    if (memberSince) {
      memberSince.textContent = `Member since ${customer.memberSince || DEFAULT_MEMBER_SINCE}`;
    }

    const welcomeHeading = document.querySelector(".welcome-banner__text h1");
    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome back, ${firstName}!`;
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-menu.active").forEach((menu) => menu.classList.remove("active"));
    document.querySelectorAll(".customer-dropdown-trigger").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  function ensureTriggerWrapper(trigger) {
    if (!trigger) return null;

    const existingWrapper = trigger.parentElement && trigger.parentElement.classList.contains("dropdown-wrapper")
      ? trigger.parentElement
      : null;
    if (existingWrapper) return existingWrapper;

    const wrapper = document.createElement("div");
    wrapper.className = "dropdown-wrapper";
    trigger.parentNode.insertBefore(wrapper, trigger);
    wrapper.appendChild(trigger);
    return wrapper;
  }

  function updateNotificationBadge(trigger) {
    if (!trigger) return;

    let badge = trigger.querySelector(".badge");
    const unreadCount = getNotifications().filter((item) => item.unread).length;

    if (unreadCount <= 0) {
      if (badge) badge.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "badge";
      trigger.appendChild(badge);
    }

    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
  }

  function renderNotificationsMenu(menu) {
    if (!menu) return;

    const notifications = getNotifications();
    const unreadCount = notifications.filter((item) => item.unread).length;
    const toneMap = {
      blue: "background: #DBEAFE; color: #1D4ED8;",
      green: "background: #D1FAE5; color: #047857;",
      orange: "background: #FEF3C7; color: #B45309;",
      red: "background: #FEE2E2; color: #B91C1C;"
    };

    let bodyMarkup = "";
    if (!notifications.length) {
      bodyMarkup = `
        <div class="customer-dropdown-empty">
          <i class="fa-regular fa-bell-slash"></i>
          No notifications yet.
        </div>
      `;
    } else {
      bodyMarkup = notifications.map((item) => {
        const href = escapeHTML(item.href || "customer_dashboard.html");
        return `
          <a href="${href}" class="notif-item ${item.unread ? "unread" : ""}" data-notification-id="${escapeHTML(item.id)}">
            <div class="notif-icon" style="${toneMap[item.tone] || toneMap.blue}">
              <i class="fa-solid ${escapeHTML(item.icon || "fa-bell")}"></i>
            </div>
            <div class="notif-content">
              <p><strong>${escapeHTML(item.title)}</strong><br>${escapeHTML(item.message)}</p>
              <span>${escapeHTML(formatRelativeTime(item.createdAt))}</span>
            </div>
          </a>
        `;
      }).join("");
    }

    menu.innerHTML = `
      <div class="dropdown-header">
        <h4>Notifications</h4>
        ${unreadCount ? '<button type="button" class="customer-dropdown-action" data-action="mark-all-read">Mark all read</button>' : ""}
      </div>
      <div class="dropdown-body">${bodyMarkup}</div>
      <div class="dropdown-footer" style="font-size: 0.8rem; color: var(--text-soft); text-align: center;">You are all caught up.</div>
    `;
  }

  function renderProfileMenu(menu) {
    if (!menu) return;

    const customer = getCurrentCustomer();
    if (!customer) return;

    const avatarMarkup = buildAvatarUrl(customer.name, customer.avatar);

    menu.innerHTML = `
      <div class="profile-header">
        <img src="${escapeHTML(avatarMarkup)}" alt="${escapeHTML(customer.name)} avatar" class="profile-avatar-large" />
        <div>
          <h4>${escapeHTML(customer.name)}</h4>
          <p>${escapeHTML(customer.email)}</p>
        </div>
      </div>
      <ul class="profile-links">
        <li><a href="profile.html"><i class="fa-regular fa-user"></i>Profile Settings</a></li>
        <li><a href="my-bookings.html"><i class="fa-regular fa-calendar-check"></i>My Bookings</a></li>
        <li><a href="disputes.html"><i class="fa-solid fa-triangle-exclamation"></i>Disputes</a></li>
        <li class="divider"></li>
        <li><a href="../Landing_Page/index.html" data-customer-logout="true" class="text-danger"><i class="fa-solid fa-arrow-right-from-bracket"></i>Logout</a></li>
      </ul>
    `;
  }

  function initShell() {
    syncCustomerDisplay();

    const notificationTrigger = document.querySelector(".navbar__notif");
    if (notificationTrigger) {
      notificationTrigger.classList.add("customer-dropdown-trigger");
      const notificationWrapper = ensureTriggerWrapper(notificationTrigger);
      let notificationMenu = notificationWrapper.querySelector(".dropdown-menu");
      if (!notificationMenu) {
        notificationMenu = document.createElement("div");
        notificationMenu.className = "dropdown-menu";
        notificationWrapper.appendChild(notificationMenu);
      }

      renderNotificationsMenu(notificationMenu);
      updateNotificationBadge(notificationTrigger);

      if (!notificationTrigger.dataset.bound) {
        notificationTrigger.dataset.bound = "true";
        notificationTrigger.setAttribute("aria-expanded", "false");
        notificationTrigger.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const isOpen = notificationMenu.classList.contains("active");
          closeAllDropdowns();
          if (!isOpen) {
            renderNotificationsMenu(notificationMenu);
            notificationMenu.classList.add("active");
            notificationTrigger.setAttribute("aria-expanded", "true");
          }
        });

        notificationMenu.addEventListener("click", (event) => {
          const actionButton = event.target.closest("[data-action='mark-all-read']");
          if (actionButton) {
            event.preventDefault();
            markAllNotificationsRead();
            renderNotificationsMenu(notificationMenu);
            updateNotificationBadge(notificationTrigger);
            return;
          }

          const notificationLink = event.target.closest("[data-notification-id]");
          if (!notificationLink) return;

          const notificationId = notificationLink.getAttribute("data-notification-id");
          const notifications = getNotifications().map((item) => {
            return item.id === notificationId ? { ...item, unread: false } : item;
          });
          saveNotifications(notifications);
          updateNotificationBadge(notificationTrigger);
        });
      }
    }

    const avatarTrigger = document.querySelector(".navbar__avatar");
    if (avatarTrigger) {
      avatarTrigger.classList.add("customer-dropdown-trigger");
      avatarTrigger.setAttribute("tabindex", "0");

      const profileWrapper = ensureTriggerWrapper(avatarTrigger);
      let profileMenu = profileWrapper.querySelector(".dropdown-menu.profile-menu");
      if (!profileMenu) {
        profileMenu = document.createElement("div");
        profileMenu.className = "dropdown-menu profile-menu";
        profileWrapper.appendChild(profileMenu);
      }

      renderProfileMenu(profileMenu);

      if (!avatarTrigger.dataset.bound) {
        avatarTrigger.dataset.bound = "true";
        avatarTrigger.setAttribute("aria-expanded", "false");
        avatarTrigger.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const isOpen = profileMenu.classList.contains("active");
          closeAllDropdowns();
          if (!isOpen) {
            renderProfileMenu(profileMenu);
            profileMenu.classList.add("active");
            avatarTrigger.setAttribute("aria-expanded", "true");
          }
        });

        avatarTrigger.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            avatarTrigger.click();
          }
        });
      }
    }

    if (!dropdownsBound) {
      dropdownsBound = true;
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".dropdown-wrapper")) {
          closeAllDropdowns();
        }
      });
    }

    bindLogoutLinks();
  }

  function bindLogoutLinks() {
    document.querySelectorAll(".sidebar__logout, [data-customer-logout='true']").forEach((link) => {
      if (link.dataset.logoutBound) return;

      link.dataset.logoutBound = "true";
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        const confirmed = await requestConfirmation("Confirm Logout", "Are you sure you want to log out?", {
          confirm: true,
          type: "danger",
          okText: "Logout"
        });
        if (!confirmed) return;

        logoutCustomer();
        const target = link.getAttribute("href") || "login.html";
        window.location.href = target;
      });
    });
  }

  function refreshShell() {
    syncCustomerDisplay();
    const notificationMenu = document.querySelector(".dropdown-menu:not(.profile-menu)");
    if (notificationMenu) {
      renderNotificationsMenu(notificationMenu);
    }
    const profileMenu = document.querySelector(".dropdown-menu.profile-menu");
    if (profileMenu) {
      renderProfileMenu(profileMenu);
    }
    updateNotificationBadge(document.querySelector(".navbar__notif"));
  }

  function updatePasswordVisibility(inputId, triggerButton) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const icon = triggerButton && triggerButton.querySelector("i");
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";

    if (icon) {
      icon.classList.toggle("fa-eye", isHidden);
      icon.classList.toggle("fa-eye-slash", !isHidden);
    }
  }

  function updatePasswordStrengthBars(password) {
    const bars = document.querySelectorAll("#strengthMeter .strength-bar");
    if (!bars.length) return;

    let score = 0;
    const value = String(password || "");

    if (value.length >= 8) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    bars.forEach((bar, index) => {
      bar.className = "strength-bar";
      if (index < score) {
        bar.classList.add(score === 4 ? "strong" : "active");
      }
    });
  }

  function initAuthForms() {
    window.togglePassword = updatePasswordVisibility;

    const forgotPasswordLink = document.querySelector(".forgot-password");
    if (forgotPasswordLink && !forgotPasswordLink.dataset.bound) {
      forgotPasswordLink.dataset.bound = "true";
      forgotPasswordLink.addEventListener("click", async (event) => {
        event.preventDefault();
        const identifierInput = document.getElementById("loginIdentifier");
        const identifier = identifierInput ? identifierInput.value.trim() : "";

        if (!identifier) {
          showToast("Enter your email or phone first so we know which account to reset.", "warning");
          return;
        }

        const nextPassword = await requestPrompt("Reset Password", `Enter a new password for account: ${identifier}`, {
          inputType: "password",
          placeholder: "New password (8+ chars)"
        });
        if (nextPassword === null || nextPassword === false) return;

        try {
          await resetCustomerPassword(identifier, nextPassword);
          showToast("Success! Your password has been updated. You can now log in.", "success");
        } catch (error) {
          showDialogMessage("Reset Failed", error.message, { type: "danger" });
        }
      });
    }

    const loginForm = document.getElementById("customerLoginForm");
    if (loginForm && !loginForm.dataset.bound) {
      loginForm.dataset.bound = "true";
      const loginFeedback = document.getElementById("loginMessage");
      const submitButton = loginForm.querySelector("button[type='submit']");

      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setFormFeedback(loginFeedback, "", "info");

        const identifier = document.getElementById("loginIdentifier").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
          if (submitButton) submitButton.disabled = true;
          await loginCustomer(identifier, password);
          setFormFeedback(loginFeedback, "Login successful. Redirecting to your dashboard...", "success");
          window.setTimeout(() => {
            window.location.href = consumeRedirectTarget() || "customer_dashboard.html";
          }, 700);
        } catch (error) {
          setFormFeedback(loginFeedback, error.message, "error");
        } finally {
          window.setTimeout(() => {
            if (submitButton) submitButton.disabled = false;
          }, 200);
        }
      });
    }

    const signupForm = document.getElementById("customerSignupForm");
    if (signupForm && !signupForm.dataset.bound) {
      signupForm.dataset.bound = "true";
      const feedback = document.getElementById("signupMessage");
      const passwordInput = document.getElementById("signupPassword");
      const confirmPasswordInput = document.getElementById("confirmPassword");
      const submitButton = signupForm.querySelector("button[type='submit']");

      if (passwordInput) {
        passwordInput.addEventListener("input", () => updatePasswordStrengthBars(passwordInput.value));
        updatePasswordStrengthBars(passwordInput.value);
      }

      signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setFormFeedback(feedback, "", "info");

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

        if (password !== confirmPassword) {
          setFormFeedback(feedback, "Passwords do not match. Please try again.", "error");
          return;
        }

        try {
          if (submitButton) submitButton.disabled = true;
          await registerCustomer({
            name,
            email,
            phone,
            password
          });
          setFormFeedback(feedback, "Account created successfully. Redirecting to your dashboard...", "success");
          window.setTimeout(() => {
            window.location.href = consumeRedirectTarget() || "customer_dashboard.html";
          }, 700);
        } catch (error) {
          setFormFeedback(feedback, error.message, "error");
        } finally {
          window.setTimeout(() => {
            if (submitButton) submitButton.disabled = false;
          }, 200);
        }
      });
    }
  }

  function init() {
    ensureCustomerStorage();
    if (!AUTH_PAGES.has(getPageName())) {
      protectCustomerPages();
    }
    customerReadyPromise = syncCustomerBackendData({ silent: true }).catch((error) => {
      console.warn("Customer runtime backend sync failed:", error);
      return null;
    });
    if (window.CustomerApp) {
      window.CustomerApp.ready = customerReadyPromise;
    }
    initShell();
    initAuthForms();
  }

  if (typeof window.showAppModal !== "function") {
    window.showAppModal = showAppModal;
  }

  if (typeof window.showAppPrompt !== "function") {
    window.showAppPrompt = showAppPrompt;
  }

  if (!window.__serviceHubNativeAlert && typeof window.alert === "function") {
    window.__serviceHubNativeAlert = window.alert.bind(window);
    window.alert = function patchedCustomerAlert(message) {
      showAppModal("Notice", String(message || ""), { okText: "Got it" });
    };
  }

  window.CustomerApp = {
    keys: KEYS,
    readJSON,
    writeJSON,
    removeKeys,
    getCurrentCustomer,
    getCustomerSession,
    getCustomerAccounts,
    saveCustomerAccounts,
    getCustomerBookings,
    saveCustomerBookings,
    getCustomerDisputes,
    saveCustomerDisputes,
    getSessionAccount,
    loginCustomer,
    registerCustomer,
    updateCustomerProfile,
    updateCustomerPassword,
    logoutCustomer,
    showToast,
    showAppModal,
    showAppPrompt,
    setFormFeedback,
    addNotification,
    getNotifications,
    markAllNotificationsRead,
    refreshShell,
    isValidEmail,
    isValidHumanName,
    isValidPhone,
    isStrongPassword,
    normalizePhone,
    normalizeEmail,
    formatDisplayDate,
    formatRelativeTime,
    buildAvatarUrl,
    requestCustomerApi,
    getCustomerApiHeaders,
    syncCustomerBackendData,
    createCustomerBooking,
    cancelCustomerBooking,
    createCustomerDispute,
    saveCurrentCustomer,
    updatePasswordStrengthBars,
    normalizeBookingRecord,
    normalizeDisputeRecord,
    ready: customerReadyPromise
  };

  document.addEventListener("DOMContentLoaded", init);
})(window, document);
