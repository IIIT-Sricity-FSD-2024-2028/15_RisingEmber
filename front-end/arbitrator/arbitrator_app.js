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

function getArbitratorRequestHeaders(extraHeaders = {}) {
    const actorId = typeof getArbitratorBackendActorId === "function"
        ? getArbitratorBackendActorId()
        : "";

    if (!actorId) {
        throw new Error("The arbitrator session is missing. Please sign in again.");
    }

    return {
        "x-role": "arbitrator",
        "x-actor-id": actorId,
        ...extraHeaders
    };
}

function mapArbitratorHearingTypeToBackend(value = "") {
    const normalizedValue = String(value || "").trim().toLowerCase();

    if (normalizedValue.includes("phone")) return "phone";
    if (normalizedValue.includes("physical") || normalizedValue.includes("in person")) return "in_person";
    return "video";
}

function mapArbitratorDocumentTypeToBackend(value = "") {
    const normalizedValue = String(value || "").trim().toLowerCase();

    if (normalizedValue.includes("award")) return "award_attachment";
    if (normalizedValue.includes("identity")) return "identity";
    if (normalizedValue.includes("invoice")) return "invoice";
    if (normalizedValue.includes("evidence") || normalizedValue.includes("witness")) return "evidence";
    if (normalizedValue.includes("claim") || normalizedValue.includes("contract")) return "contract";
    return "other";
}

function createArbitratorScheduledAt(dateValue, timeValue) {
    if (!dateValue || !timeValue) return "";

    const scheduledAt = new Date(`${dateValue}T${timeValue}`);
    return Number.isNaN(scheduledAt.getTime()) ? "" : scheduledAt.toISOString();
}

function readArbitratorFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file was provided."));
            return;
        }

        const reader = new FileReader();
        reader.onload = function onLoad(event) {
            resolve(event && event.target ? event.target.result : "");
        };
        reader.onerror = function onError() {
            reject(new Error("The selected file could not be read."));
        };
        reader.readAsDataURL(file);
    });
}

async function uploadArbitratorCaseDocument({
    caseId,
    file,
    title,
    description = "",
    typeLabel = "Evidence",
    typeOverride = ""
}) {
    if (!caseId) {
        throw new Error("A case must be selected before uploading a document.");
    }

    if (!file) {
        throw new Error("Please choose a file to upload.");
    }

    const headers = getArbitratorRequestHeaders();
    const content = await readArbitratorFileAsDataUrl(file);

    return requestArbitratorApi("/documents", {
        method: "POST",
        headers,
        body: {
            caseId,
            title: title || file.name,
            description,
            type: typeOverride || mapArbitratorDocumentTypeToBackend(typeLabel),
            fileName: file.name,
            content
        }
    });
}

async function upsertArbitratorAward({
    caseId,
    title,
    summary,
    status = "issued"
}) {
    const headers = getArbitratorRequestHeaders();
    const existingAwards = await requestArbitratorApi(`/awards?caseId=${encodeURIComponent(caseId)}`, { headers });
    const existingAward = Array.isArray(existingAwards) && existingAwards.length ? existingAwards[0] : null;
    const payload = { title, summary, status };

    if (existingAward && existingAward.id) {
        return requestArbitratorApi(`/awards/${existingAward.id}`, {
            method: "PATCH",
            headers,
            body: payload
        });
    }

    return requestArbitratorApi("/awards", {
        method: "POST",
        headers,
        body: {
            caseId,
            ...payload
        }
    });
}

async function issueArbitratorAwardWithAttachment({
    caseId,
    file,
    title,
    summary
}) {
    const headers = getArbitratorRequestHeaders();
    const award = await upsertArbitratorAward({
        caseId,
        title,
        summary,
        status: "issued"
    });

    if (file) {
        await uploadArbitratorCaseDocument({
            caseId,
            file,
            title: `${title} Attachment`,
            description: summary,
            typeLabel: "Award Document",
            typeOverride: "award_attachment"
        });
    }

    await requestArbitratorApi(`/cases/${encodeURIComponent(caseId)}`, {
        method: "PATCH",
        headers,
        body: {
            status: "closed",
            resolutionSummary: summary
        }
    });

    return award;
}

async function appendArbitratorCaseMessage(caseId, message) {
    if (!caseId) {
        throw new Error("A case must be selected before sending a message.");
    }

    if (!String(message || "").trim()) {
        throw new Error("Please enter a message before sending.");
    }

    return requestArbitratorApi(`/cases/${encodeURIComponent(caseId)}`, {
        method: "PATCH",
        headers: getArbitratorRequestHeaders(),
        body: {
            message: String(message).trim()
        }
    });
}
