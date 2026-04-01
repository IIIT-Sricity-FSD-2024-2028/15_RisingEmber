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
  let dropdownsBound = false;

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
      @media (max-width: 640px) {
        .customer-toast-stack {
          left: 16px;
          right: 16px;
          bottom: 16px;
          max-width: none;
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

  function resetCustomerPassword(identifier, nextPassword) {
    const accounts = getCustomerAccounts();
    const accountIndex = findCustomerAccountIndex(identifier, accounts);

    if (accountIndex === -1) {
      throw new Error("We couldn't find an account with that email or phone.");
    }

    if (!isStrongPassword(nextPassword)) {
      throw new Error("Your new password must be at least 8 characters and include upper, lower, number, and symbol.");
    }

    accounts[accountIndex] = sanitizeCustomerRecord({
      ...accounts[accountIndex],
      password: String(nextPassword || "")
    });
    saveCustomerAccounts(accounts);
    return accounts[accountIndex];
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

  async function requestConfirmation(title, message, options) {
    if (typeof window.showAppModal === "function") {
      return Boolean(await window.showAppModal(title, message, options || {}));
    }

    if (typeof window.confirm === "function") {
      return window.confirm(message);
    }

    return true;
  }

  async function requestPrompt(title, message, options) {
    if (typeof window.showAppPrompt === "function") {
      return window.showAppPrompt(title, message, options || {});
    }

    const placeholder = options && options.placeholder ? `\n\n${options.placeholder}` : "";
    if (typeof window.prompt === "function") {
      return window.prompt(`${message}${placeholder}`, "");
    }

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

  function loginCustomer(identifier, password) {
    const loginValue = String(identifier || "").trim();
    const passwordValue = String(password || "");

    if (!loginValue || !passwordValue) {
      throw new Error("Email or phone and password are required.");
    }

    const matchedAccount = findAccountByLogin(loginValue);
    if (!matchedAccount) {
      throw new Error("No customer account was found with that email or phone.");
    }

    if (matchedAccount.password !== passwordValue) {
      throw new Error("That password does not match our records.");
    }

    saveCurrentCustomer(matchedAccount, true);
    addNotification("Signed in", "You are now logged in to your customer account.", {
      href: "customer_dashboard.html",
      icon: "fa-right-to-bracket",
      tone: "green",
      unread: false
    });

    return toPublicCustomer(matchedAccount);
  }

  function registerCustomer(payload) {
    const data = payload && typeof payload === "object" ? payload : {};
    const name = String(data.name || "").trim();
    const email = normalizeEmail(data.email);
    const phone = String(data.phone || "").trim();
    const password = String(data.password || "");
    const location = String(data.location || "Location not set").trim();

    if (name.length < 2) throw new Error("Please enter your full name.");
    if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
    if (!isValidPhone(phone)) throw new Error("Please enter a valid phone number.");
    if (!isStrongPassword(password)) {
      throw new Error("Password must be 8+ characters and include uppercase, lowercase, number, and symbol.");
    }

    const accounts = getCustomerAccounts();
    const emailExists = accounts.some((account) => account.email === email);
    if (emailExists) throw new Error("An account with that email already exists.");

    const phoneExists = accounts.some((account) => normalizePhone(account.phone) === normalizePhone(phone));
    if (phoneExists) throw new Error("An account with that phone number already exists.");

    const newAccount = sanitizeCustomerRecord({
      id: `CUS-${Date.now()}`,
      name,
      email,
      phone,
      location,
      memberSince: getMonthYearLabel(),
      password
    });

    accounts.unshift(newAccount);
    saveCustomerAccounts(accounts);
    saveCurrentCustomer(newAccount, true);

    addNotification("Welcome to ServiceHub", "Your customer account is ready to use.", {
      href: "customer_dashboard.html",
      icon: "fa-user-plus",
      tone: "green",
      unread: false
    });

    return toPublicCustomer(newAccount);
  }

  function updateCustomerProfile(payload) {
    const sessionAccount = getSessionAccount();
    if (!sessionAccount) throw new Error("You need to log in again before updating your profile.");

    const updates = payload && typeof payload === "object" ? payload : {};
    const nextName = String(updates.name || "").trim();
    const nextEmail = normalizeEmail(updates.email);
    const nextPhone = String(updates.phone || "").trim();
    const nextLocation = String(updates.location || "").trim();

    if (nextName.length < 2) throw new Error("Please enter your full name.");
    if (!isValidEmail(nextEmail)) throw new Error("Please enter a valid email address.");
    if (!isValidPhone(nextPhone)) throw new Error("Please enter a valid phone number.");
    if (nextLocation.length < 2) throw new Error("Please enter your city or service location.");

    const accounts = getCustomerAccounts();
    const emailTaken = accounts.some((account) => account.email === nextEmail && account.email !== sessionAccount.email);
    if (emailTaken) throw new Error("That email is already being used by another customer account.");

    const phoneTaken = accounts.some((account) => {
      return normalizePhone(account.phone) === normalizePhone(nextPhone) && account.email !== sessionAccount.email;
    });
    if (phoneTaken) throw new Error("That phone number is already being used by another customer account.");

    const updatedAccount = sanitizeCustomerRecord({
      ...sessionAccount,
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      location: nextLocation,
      avatar: updates.avatar || sessionAccount.avatar
    });

    const nextAccounts = accounts.map((account) => {
      return account.email === sessionAccount.email ? updatedAccount : account;
    });

    saveCustomerAccounts(nextAccounts);
    saveCurrentCustomer(updatedAccount, true);

    addNotification("Profile updated", "Your customer profile details were saved successfully.", {
      href: "profile.html",
      icon: "fa-user-pen",
      tone: "green",
      unread: false
    });

    return toPublicCustomer(updatedAccount);
  }

  function updateCustomerPassword(currentPassword, newPassword) {
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

    const accounts = getCustomerAccounts().map((account) => {
      return account.email === sessionAccount.email
        ? sanitizeCustomerRecord({ ...account, password: nextValue })
        : account;
    });

    saveCustomerAccounts(accounts);
    saveCurrentCustomer(accounts.find((account) => account.email === sessionAccount.email), true);

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
          resetCustomerPassword(identifier, nextPassword);
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

      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        setFormFeedback(loginFeedback, "", "info");

        const identifier = document.getElementById("loginIdentifier").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
          if (submitButton) submitButton.disabled = true;
          loginCustomer(identifier, password);
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

      signupForm.addEventListener("submit", (event) => {
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
          registerCustomer({
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
    initShell();
    initAuthForms();
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
    setFormFeedback,
    addNotification,
    getNotifications,
    markAllNotificationsRead,
    refreshShell,
    isValidEmail,
    isValidPhone,
    isStrongPassword,
    normalizePhone,
    normalizeEmail,
    formatDisplayDate,
    formatRelativeTime,
    buildAvatarUrl,
    saveCurrentCustomer,
    updatePasswordStrengthBars,
    normalizeBookingRecord,
    normalizeDisputeRecord
  };

  document.addEventListener("DOMContentLoaded", init);
})(window, document);
