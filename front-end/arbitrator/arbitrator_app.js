function getArbitratorRegistration() {
    return window.ArbitratorData && window.ArbitratorData.registration
        ? window.ArbitratorData.registration
        : null;
}

function getLoggedInArbitrator() {
    if (typeof getActiveUser === "function") {
        const activeUser = getActiveUser();
        if (activeUser && activeUser.role === "arbitrator" && activeUser.isLoggedIn) {
            return activeUser;
        }
    }

    if (typeof getArbitratorSession === "function") {
        const session = getArbitratorSession();
        if (session && session.role === "arbitrator" && session.isLoggedIn) {
            return session;
        }
    }

    return null;
}

function syncArbitratorSessionWithProfile() {
    if (
        typeof writeStorageJSON !== "function" ||
        typeof persistActiveUser !== "function" ||
        !window.ArbitratorData ||
        !window.ArbitratorData.profile
    ) {
        return null;
    }

    const currentUser = getLoggedInArbitrator();
    if (!currentUser) return null;

    const normalizedEmail = typeof normalizeEmail === "function"
        ? normalizeEmail(window.ArbitratorData.profile.email)
        : String(window.ArbitratorData.profile.email || "").trim().toLowerCase();

    const syncedSession = {
        ...currentUser,
        name: window.ArbitratorData.profile.name,
        email: normalizedEmail,
        phone: String(window.ArbitratorData.profile.phone || "").trim(),
        role: "arbitrator",
        isLoggedIn: true
    };

    if (window.ArbitratorData.auth) {
        window.ArbitratorData.auth.email = normalizedEmail;
        window.ArbitratorData.auth.role = "arbitrator";
        saveData();
    }

    writeStorageJSON(AUTH_KEYS.ARBITRATOR, syncedSession);
    persistActiveUser(syncedSession);
    return syncedSession;
}

function redirectToArbitratorDashboard() {
    window.location.replace("arbitrator_dashboard.html");
}

function redirectToArbitratorLogin() {
    window.location.replace("arbitrator_login.html");
}

function redirectToArbitratorLanding() {
    window.location.replace("arbitrator_landing.html");
}

function getApplicationStepUrl(stepNumber) {
    switch (stepNumber) {
        case 1:
            return "arbitrator_form_1.html";
        case 2:
            return "arbitrator_form_2.html";
        case 3:
            return "arbitrator_form_3.html";
        case 4:
            return "arbitrator_form_review.html";
        default:
            return "arbitrator_form_1.html";
    }
}

function getArbitratorStepLabel(stepNumber) {
    switch (Number(stepNumber) || 0) {
        case 1:
            return "Basic Details";
        case 2:
            return "Professional Details";
        case 3:
            return "Documents";
        case 4:
            return "Review & Submit";
        default:
            return "Application Start";
    }
}

function hasMeaningfulArbitratorFormValue(value) {
    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return !Number.isNaN(value);
    }

    if (value && typeof value === "object") {
        return Object.keys(value).length > 0;
    }

    return String(value ?? "").trim() !== "";
}

function hasArbitratorDraftApplication() {
    const registration = getArbitratorRegistration();
    if (!registration || registration.isComplete === true) {
        return false;
    }

    const formData = registration.formData || {};
    return (Number(registration.lastStep) || 0) > 0 || Object.values(formData).some(hasMeaningfulArbitratorFormValue);
}

function getArbitratorDraftProgress() {
    const registration = getArbitratorRegistration();
    const hasDraft = hasArbitratorDraftApplication();
    const lastCompletedStep = Math.max(0, Number(registration && registration.lastStep) || 0);
    const nextStep = hasDraft ? Math.min(lastCompletedStep + 1, 4) : 1;

    return {
        hasDraft,
        lastCompletedStep,
        nextStep,
        nextStepLabel: getArbitratorStepLabel(nextStep)
    };
}

function getArbitratorApplicationRoute() {
    const registration = getArbitratorRegistration();

    if (!registration) {
        return getApplicationStepUrl(1);
    }

    if (registration.isComplete) {
        const formData = registration.formData || {};
        const hasCompletedApplicationData = Boolean(formData.name && formData.email);
        return hasCompletedApplicationData ? getApplicationStepUrl(4) : getApplicationStepUrl(1);
    }

    const lastCompletedStep = Math.max(0, Number(registration.lastStep) || 0);
    return getApplicationStepUrl(Math.min(lastCompletedStep + 1, 4));
}

function goToArbitratorApplication() {
    if (typeof beginNewArbitratorApplication === "function") {
        beginNewArbitratorApplication();
    }

    window.location.href = getApplicationStepUrl(1);
}

function resumeArbitratorApplication() {
    window.location.href = getArbitratorApplicationRoute();
}

function ensureApplicationStep(stepNumber) {
    const registration = getArbitratorRegistration();

    if (!registration) {
        window.location.replace(getApplicationStepUrl(1));
        return false;
    }

    const lastCompletedStep = Number(registration.lastStep) || 0;
    if (stepNumber > 1 && lastCompletedStep < stepNumber - 1) {
        const redirectStep = Math.max(1, lastCompletedStep + 1);
        window.location.replace(getApplicationStepUrl(redirectStep));
        return false;
    }

    return true;
}

function guardArbitratorPage() {
    const registration = getArbitratorRegistration();
    if (!registration || registration.isComplete !== true) {
        redirectToArbitratorLanding();
        return false;
    }

    const activeSession = typeof getActiveSession === "function" ? getActiveSession() : null;
    const activeUser = getLoggedInArbitrator();

    if (
        !activeSession ||
        !activeUser ||
        activeSession.isLoggedIn !== true ||
        activeSession.role !== "arbitrator" ||
        activeUser.role !== "arbitrator"
    ) {
        redirectToArbitratorLogin();
        return false;
    }

    syncArbitratorSessionWithProfile();
    return true;
}

function redirectAuthenticatedArbitrator() {
    const registration = getArbitratorRegistration();
    const loggedInUser = getLoggedInArbitrator();

    if (registration && registration.isComplete && loggedInUser) {
        redirectToArbitratorDashboard();
        return true;
    }

    return false;
}

function getArbitratorCaseIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("case");
    return caseId ? caseId.trim().toUpperCase() : "";
}

function getArbitratorCaseById(caseId) {
    if (!caseId || !window.ArbitratorData || !Array.isArray(window.ArbitratorData.allCases)) {
        return null;
    }

    const normalizedCaseId = String(caseId).trim().toUpperCase();
    return window.ArbitratorData.allCases.find((item) => item.id.toUpperCase() === normalizedCaseId) || null;
}

function getCurrentArbitratorCase(fallbackCaseId = "") {
    const requestedCaseId = getArbitratorCaseIdFromUrl();
    return (
        getArbitratorCaseById(requestedCaseId) ||
        getArbitratorCaseById(fallbackCaseId) ||
        (window.ArbitratorData && window.ArbitratorData.allCases
            ? window.ArbitratorData.allCases.find((item) => item.status !== "Closed") || window.ArbitratorData.allCases[0]
            : null)
    );
}

function buildCaseDetailsUrl(caseId) {
    return `arbitrator_case_details.html?case=${encodeURIComponent(caseId)}`;
}

function buildMessagesUrl(caseId) {
    return `arbitrator_messages.html?case=${encodeURIComponent(caseId)}`;
}

function buildHearingsUrl(caseId) {
    return `arbitrator_hearings.html?case=${encodeURIComponent(caseId)}`;
}

function buildDecisionsUrl(caseId) {
    return `arbitrator_decisions.html?case=${encodeURIComponent(caseId)}`;
}

function getArbitratorCaseParties(caseData) {
    if (!caseData) return "Unknown Case";
    return caseData.parties || `${caseData.claimant} vs ${caseData.respondent}`;
}

function createArbitratorFileSizeLabel(sizeInBytes) {
    if (!sizeInBytes || Number.isNaN(Number(sizeInBytes))) {
        return "0.0 MB";
    }

    return `${(Number(sizeInBytes) / 1024 / 1024).toFixed(1)} MB`;
}

function createArbitratorDisplayDate(dateInput = new Date()) {
    return new Date(dateInput).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}
