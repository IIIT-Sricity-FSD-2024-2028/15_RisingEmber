/**
 * MOCK DATA STORE - ARBITRATOR MODULE
 * Centralized data store with realistic mock data.
 * Data persists in localStorage under key 'arbitrator_db'.
 */

/* ============================
   PROFILE DATA
   ============================ */
const profileData = {
    id: "ARB-7721",
    name: "Dr. Elena Vasquez",
    title: "Senior International Arbitrator",
    avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=1E3A8A&color=fff&size=128",
    email: "e.vasquez@globalarbitration.com",
    phone: "+1 (415) 892-3400",
    location: "San Francisco, CA",
    notifications: 5,
    bio: "Former federal judge with 18 years of experience in international commercial arbitration. Specialized in cross-border commercial disputes, investment treaty arbitration, and intellectual property conflicts.",
    languages: ["English", "Spanish", "French"],
    rating: 4.9,
    completedCases: 147,
    successRate: 98,
    credentials: [
        { title: "PhD in International Law", institution: "Stanford Law School" },
        { title: "LLM in Commercial Arbitration", institution: "Harvard Law School" },
        { title: "Certified Arbitrator", institution: "International Arbitration Institute" }
    ],
    expertise: ["International Commercial Law", "Investment Treaty Arbitration", "Cross-Border Disputes", "Intellectual Property", "Energy Sector"]
};

/* ============================
   STATS DATA
   ============================ */
const statsData = {
    assignedCases: 8,
    upcomingHearings: 4,
    pendingDecisions: 3,
    docsToReview: 11,
    messages: 7,
    casesThisMonth: 5,
    avgResolutionDays: 42
};

/* ============================
   ALL CASES DATA (Assigned Cases page + shared across modules)
   ============================ */
const casesData = [
    {
        id: "CASE-20491",
        type: "International Commercial Contract",
        claimant: "Meridian Holdings Ltd",
        respondent: "Pacific Rim Ventures Inc",
        amount: "$4,750,000",
        assigned: "14 Mar 2026",
        next: "28 Mar 2026",
        status: "Under Review",
        statusColor: "#1E40AF",
        statusClass: "arb-badge-blue",
        description: "Breach of distribution agreement for Asian markets. Claimant seeks damages for terminated exclusive rights.",
        hearingDate: "28 Mar 2026",
        hearingTime: "10:00 AM",
        hearingType: "Virtual Hearing"
    },
    {
        id: "CASE-20487",
        type: "Software Licensing Dispute",
        claimant: "CloudScale Technologies",
        respondent: "DataStream Solutions",
        amount: "$2,100,000",
        assigned: "10 Mar 2026",
        next: "25 Mar 2026",
        status: "Evidence Review",
        statusColor: "#92400E",
        statusClass: "arb-badge-yellow",
        description: "Dispute over software licensing terms and royalty payments for enterprise SaaS platform.",
        hearingDate: "25 Mar 2026",
        hearingTime: "2:30 PM",
        hearingType: "Virtual Hearing"
    },
    {
        id: "CASE-20483",
        type: "Construction Project Delay",
        claimant: "Apex Developers LLC",
        respondent: "BuildRight Construction Co",
        amount: "$8,200,000",
        assigned: "08 Mar 2026",
        next: "20 Mar 2026",
        status: "Hearing Scheduled",
        statusColor: "#065F46",
        statusClass: "arb-badge-green",
        description: "Claims for delays and cost overruns on a commercial office tower project in Chicago.",
        hearingDate: "20 Mar 2026",
        hearingTime: "9:00 AM",
        hearingType: "Physical Hearing",
        hearingLocation: "Chicago Arbitration Center, Room 4B"
    },
    {
        id: "CASE-20479",
        type: "Employment Contract Dispute",
        claimant: "James Thornton",
        respondent: "Sterling Financial Group",
        amount: "$875,000",
        assigned: "05 Mar 2026",
        next: "18 Mar 2026",
        status: "Under Review",
        statusColor: "#1E40AF",
        statusClass: "arb-badge-blue",
        description: "Wrongful termination and breach of employment contract including deferred compensation.",
        hearingDate: "18 Mar 2026",
        hearingTime: "11:00 AM",
        hearingType: "Virtual Hearing"
    },
    {
        id: "CASE-20475",
        type: "Intellectual Property Infringement",
        claimant: "NovaTech Innovations",
        respondent: "Quantum Devices Corp",
        amount: "$5,600,000",
        assigned: "01 Mar 2026",
        next: "15 Apr 2026",
        status: "Pending Decision",
        statusColor: "#6B21A8",
        statusClass: "arb-badge-purple",
        description: "Patent infringement claim related to semiconductor manufacturing processes.",
        hearingDate: "15 Apr 2026",
        hearingTime: "3:00 PM",
        hearingType: "Hybrid Hearing"
    },
    {
        id: "CASE-20471",
        type: "Supply Chain Disruption",
        claimant: "Global Freight Partners",
        respondent: "Pacific Logistics Corp",
        amount: "$3,400,000",
        assigned: "22 Feb 2026",
        next: "—",
        status: "Closed",
        statusColor: "#6B7280",
        statusClass: "arb-badge-gray",
        description: "Dispute resolved through mediation. Final award issued on Feb 28, 2026."
    },
    {
        id: "CASE-20468",
        type: "Shareholder Agreement Violation",
        claimant: "Maria Castellano",
        respondent: "Cascade Equity Partners",
        amount: "$1,950,000",
        assigned: "18 Feb 2026",
        next: "10 Apr 2026",
        status: "Evidence Review",
        statusColor: "#92400E",
        statusClass: "arb-badge-yellow",
        description: "Alleged breach of shareholder agreement regarding valuation rights and drag-along clauses."
    },
    {
        id: "CASE-20465",
        type: "Healthcare Billing Dispute",
        claimant: "Northwest Medical Group",
        respondent: " insurers United Healthcare",
        amount: "$1,200,000",
        assigned: "12 Feb 2026",
        next: "05 Apr 2026",
        status: "Under Review",
        statusColor: "#1E40AF",
        statusClass: "arb-badge-blue",
        description: "Dispute over insurance claim processing delays and denied reimbursement requests."
    }
];

/* ============================
   RECENT CASES (Dashboard quick view - 3 most recent)
   ============================ */
const recentCasesData = [
    { id: "CASE-20491", type: "Commercial Contract", parties: "Meridian vs Pacific Rim", date: "14 Mar 2026", status: "Under Review", next: "28 Mar 2026", statusClass: "arb-badge-blue" },
    { id: "CASE-20487", type: "Software Licensing", parties: "CloudScale vs DataStream", date: "10 Mar 2026", status: "Evidence Review", next: "25 Mar 2026", statusClass: "arb-badge-yellow" },
    { id: "CASE-20483", type: "Construction Delay", parties: "Apex vs BuildRight", date: "08 Mar 2026", status: "Hearing Scheduled", next: "20 Mar 2026", statusClass: "arb-badge-green" }
];

/* ============================
   HEARINGS DATA
   ============================ */
const hearingsData = [
    {
        id: "CASE-20491",
        parties: "Meridian Holdings vs Pacific Rim Ventures",
        date: "28 Mar 2026",
        time: "10:00 AM",
        type: "Virtual Hearing",
        status: "Scheduled",
        statusClass: "arb-badge-blue",
        link: "https://meet.google.com/abc-defg-hij"
    },
    {
        id: "CASE-20487",
        parties: "CloudScale vs DataStream Solutions",
        date: "25 Mar 2026",
        time: "2:30 PM",
        type: "Virtual Hearing",
        status: "Scheduled",
        statusClass: "arb-badge-blue",
        link: "https://meet.google.com/xyz-uvwx-rst"
    },
    {
        id: "CASE-20483",
        parties: "Apex Developers vs BuildRight Construction",
        date: "20 Mar 2026",
        time: "9:00 AM",
        type: "Physical Hearing",
        status: "Scheduled",
        statusClass: "arb-badge-blue",
        location: "Chicago Arbitration Center, Room 4B"
    },
    {
        id: "CASE-20479",
        parties: "James Thornton vs Sterling Financial",
        date: "18 Mar 2026",
        time: "11:00 AM",
        type: "Virtual Hearing",
        status: "Scheduled",
        statusClass: "arb-badge-blue",
        link: "https://meet.google.com/pqr-stuv-wxy"
    },
    {
        id: "CASE-20475",
        parties: "NovaTech vs Quantum Devices",
        date: "15 Apr 2026",
        time: "3:00 PM",
        type: "Hybrid Hearing",
        status: "Scheduled",
        statusClass: "arb-badge-blue",
        link: "https://meet.google.com/lmn-opqr-stu",
        location: "NYC International Chamber, Suite 1200"
    },
    {
        id: "CASE-20465",
        parties: "Northwest Medical vs Insurers United",
        date: "05 Apr 2026",
        time: "10:30 AM",
        type: "Virtual Hearing",
        status: "Scheduled",
        statusClass: "arb-badge-blue",
        link: "https://meet.google.com/zab-cdef-ghi"
    }
];

/* ============================
   DECISIONS DATA
   ============================ */
const decisionsData = [
    {
        id: "CASE-20475",
        parties: "NovaTech Innovations vs Quantum Devices Corp",
        type: "IP Infringement",
        deadline: "15 Apr 2026",
        status: "Awaiting Decision",
        statusClass: "arb-badge-yellow",
        priority: "High",
        amount: "$5,600,000"
    },
    {
        id: "CASE-20479",
        parties: "James Thornton vs Sterling Financial Group",
        type: "Employment Contract",
        deadline: "01 Apr 2026",
        status: "Awaiting Decision",
        statusClass: "arb-badge-yellow",
        priority: "Medium",
        amount: "$875,000"
    },
    {
        id: "CASE-20468",
        parties: "Maria Castellano vs Cascade Equity Partners",
        type: "Shareholder Agreement",
        deadline: "20 Apr 2026",
        status: "Awaiting Decision",
        statusClass: "arb-badge-yellow",
        priority: "Medium",
        amount: "$1,950,000"
    },
    {
        id: "CASE-20471",
        parties: "Global Freight vs Pacific Logistics",
        type: "Supply Chain",
        deadline: "28 Feb 2026",
        status: "Award Issued",
        statusClass: "arb-badge-green",
        priority: "—",
        amount: "$3,400,000"
    },
    {
        id: "CASE-20455",
        parties: "Summit Partners vs Meridian Capital",
        type: "Investment Dispute",
        deadline: "10 Feb 2026",
        status: "Award Issued",
        statusClass: "arb-badge-green",
        priority: "—",
        amount: "$2,800,000"
    },
    {
        id: "CASE-20450",
        parties: "TechBridge Inc vs Innovate Solutions",
        type: "Technology Contract",
        deadline: "25 Jan 2026",
        status: "Award Issued",
        statusClass: "arb-badge-green",
        priority: "—",
        amount: "$1,500,000"
    }
];

/* ============================
   DOCUMENTS DATA
   ============================ */
const documentsData = [
    { name: "Statement_of_Claim.pdf", id: "CASE-20491", type: "Claim Document", uploadedBy: "Meridian Holdings", date: "16 Mar 2026", size: "3.2 MB", typeClass: "arb-badge-blue", fileLink: "#" },
    { name: "Defense_and_Counterclaim.pdf", id: "CASE-20491", type: "Response Document", uploadedBy: "Pacific Rim Ventures", date: "19 Mar 2026", size: "4.7 MB", typeClass: "arb-badge-green", fileLink: "#" },
    { name: "Expert_Witness_Report.pdf", id: "CASE-20487", type: "Evidence", uploadedBy: "CloudScale Technologies", date: "15 Mar 2026", size: "8.1 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Source_Code_Archives.zip", id: "CASE-20487", type: "Evidence", uploadedBy: "DataStream Solutions", date: "18 Mar 2026", size: "156.4 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Project_Timeline_Report.pdf", id: "CASE-20483", type: "Evidence", uploadedBy: "Apex Developers", date: "12 Mar 2026", size: "2.9 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Employment_Contract_Signed.pdf", id: "CASE-20479", type: "Claim Document", uploadedBy: "James Thornton", date: "08 Mar 2026", size: "1.1 MB", typeClass: "arb-badge-blue", fileLink: "#" },
    { name: "Performance_Reviews_2024.pdf", id: "CASE-20479", type: "Evidence", uploadedBy: "Sterling Financial", date: "10 Mar 2026", size: "2.3 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Patent_Documentation.pdf", id: "CASE-20475", type: "Claim Document", uploadedBy: "NovaTech Innovations", date: "04 Mar 2026", size: "5.6 MB", typeClass: "arb-badge-blue", fileLink: "#" },
    { name: "Semiconductor_Test_Results.pdf", id: "CASE-20475", type: "Evidence", uploadedBy: "Quantum Devices", date: "07 Mar 2026", size: "12.8 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Shareholder_Agreement_2023.pdf", id: "CASE-20468", type: "Evidence", uploadedBy: "Maria Castellano", date: "20 Feb 2026", size: "2.1 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Board_Meeting_Minutes.pdf", id: "CASE-20468", type: "Evidence", uploadedBy: "Cascade Equity Partners", date: "22 Feb 2026", size: "0.9 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Medical_Records_Summary.pdf", id: "CASE-20465", type: "Claim Document", uploadedBy: "Northwest Medical", date: "14 Feb 2026", size: "3.7 MB", typeClass: "arb-badge-blue", fileLink: "#" },
    { name: "Insurance_Correspondence.pdf", id: "CASE-20465", type: "Evidence", uploadedBy: "Northwest Medical", date: "16 Feb 2026", size: "1.8 MB", typeClass: "arb-badge-yellow", fileLink: "#" },
    { name: "Final_Award_CASE-20471.pdf", id: "CASE-20471", type: "Award Document", uploadedBy: "Dr. Elena Vasquez", date: "28 Feb 2026", size: "0.7 MB", typeClass: "arb-badge-green", fileLink: "#" }
];

/* ============================
   MESSAGES / CHAT DATA
   ============================ */
const messagesData = {
    "CASE-20491": {
        parties: "Meridian Holdings Ltd vs Pacific Rim Ventures Inc",
        participants: [
            { name: "Richard Torres", role: "Claimant Counsel", avatar: "https://i.pravatar.cc/150?u=richardtorres" },
            { name: "Sarah Chen", role: "Respondent Counsel", avatar: "https://i.pravatar.cc/150?u=sarahchen" }
        ],
        messages: [
            { name: "Richard Torres", role: "Claimant Counsel", time: "09:15 AM", text: "Good morning, Dr. Vasquez. We have uploaded the supplementary exhibits as discussed.", avatar: "https://i.pravatar.cc/150?u=richardtorres" },
            { name: "Sarah Chen", role: "Respondent Counsel", time: "10:30 AM", text: "We will be filing our response to the supplementary materials by end of day tomorrow.", avatar: "https://i.pravatar.cc/150?u=sarahchen" },
            { name: "Dr. Elena Vasquez", role: "Arbitrator", time: "11:45 AM", text: "Thank you both. I have reviewed the supplementary exhibits and find them sufficient for the record. The hearing on March 28 remains as scheduled.", avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=1E3A8A&color=fff" }
        ]
    },
    "CASE-20487": {
        parties: "CloudScale Technologies vs DataStream Solutions",
        participants: [
            { name: "James Park", role: "Claimant Counsel", avatar: "https://i.pravatar.cc/150?u=jamespark" },
            { name: "Amanda Liu", role: "Respondent Counsel", avatar: "https://i.pravatar.cc/150?u=amandaliu" }
        ],
        messages: [
            { name: "Amanda Liu", role: "Respondent Counsel", time: "14:00 PM", text: "Dr. Vasquez, we object to the admissibility of the source code archives uploaded yesterday.", avatar: "https://i.pravatar.cc/150?u=amandaliu" },
            { name: "Amanda Liu", role: "Respondent Counsel", time: "14:05 PM", text: "They were obtained without proper chain of custody documentation. We request a ruling on this before the hearing.", avatar: "https://i.pravatar.cc/150?u=amandaliu" },
            { name: "Dr. Elena Vasquez", role: "Arbitrator", time: "15:30 PM", text: "Ms. Liu, I have noted your objection. I will issue a preliminary ruling on the chain of custody issue by March 22. Please ensure your motion is filed by March 20.", avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=1E3A8A&color=fff" }
        ]
    },
    "CASE-20483": {
        parties: "Apex Developers LLC vs BuildRight Construction Co",
        participants: [
            { name: "Marcus Webb", role: "Claimant Project Manager", avatar: "https://i.pravatar.cc/150?u=marcuswebb" },
            { name: "Lisa Rodriguez", role: "Respondent Representative", avatar: "https://i.pravatar.cc/150?u=lisarodriguez" }
        ],
        messages: [
            { name: "Marcus Webb", role: "Claimant PM", time: "08:30 AM", text: "The physical hearing location has been confirmed. Conference Room 4B at the Chicago Arbitration Center.", avatar: "https://i.pravatar.cc/150?u=marcuswebb" },
            { name: "Dr. Elena Vasquez", role: "Arbitrator", time: "09:15 AM", text: "Thank you for confirming. Please ensure all original construction documents are brought to the hearing for verification.", avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=1E3A8A&color=fff" },
            { name: "Marcus Webb", role: "Claimant PM", time: "10:00 AM", text: "Will do. We will also have our structural engineer present for questioning.", avatar: "https://i.pravatar.cc/150?u=marcuswebb" }
        ]
    },
    "CASE-20475": {
        parties: "NovaTech Innovations vs Quantum Devices Corp",
        participants: [
            { name: "Patricia Huang", role: "Claimant IP Counsel", avatar: "https://i.pravatar.cc/150?u=patriciahuang" },
            { name: "Robert Chang", role: "Respondent Counsel", avatar: "https://i.pravatar.cc/150?u=robertchang" }
        ],
        messages: [
            { name: "Patricia Huang", role: "IP Counsel", time: "16:20 PM", text: "Dr. Vasquez, the semiconductor test results have been uploaded. We believe they clearly demonstrate the process infringement.", avatar: "https://i.pravatar.cc/150?u=patriciahuang" },
            { name: "Dr. Elena Vasquez", role: "Arbitrator", time: "17:00 PM", text: "Received. I will review the test results carefully before issuing my decision by the April 15 deadline.", avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=1E3A8A&color=fff" }
        ]
    },
    "CASE-20479": {
        parties: "James Thornton vs Sterling Financial Group",
        participants: [
            { name: "Michael Torres", role: "Claimant Counsel", avatar: "https://i.pravatar.cc/150?u=michaeltorres" },
            { name: "David Kim", role: "HR Director - Respondent", avatar: "https://i.pravatar.cc/150?u=davidkim" }
        ],
        messages: [
            { name: "David Kim", role: "HR Director", time: "13:00 PM", text: "We have prepared the complete employee file for Mr. Thornton including all performance documentation.", avatar: "https://i.pravatar.cc/150?u=davidkim" },
            { name: "Dr. Elena Vasquez", role: "Arbitrator", time: "14:15 PM", text: "Good. Please ensure the documents are properly organized by date for efficient review at the hearing.", avatar: "https://ui-avatars.com/api/?name=Elena+Vasquez&background=1E3A8A&color=fff" }
        ]
    }
};

/* ============================
   NOTIFICATIONS DATA
   ============================ */
const notificationsData = [
    { id: 1, type: "case", text: "CASE-20491: New documents uploaded by Meridian Holdings", time: "2 hours ago", read: false },
    { id: 2, type: "hearing", text: "Hearing reminder: CASE-20483 on Mar 20 at 9:00 AM", time: "5 hours ago", read: false },
    { id: 3, type: "message", text: "New message from Amanda Liu (CASE-20487)", time: "Yesterday", read: false },
    { id: 4, type: "decision", text: "CASE-20475 decision deadline approaching (15 Apr 2026)", time: "Yesterday", read: false },
    { id: 5, type: "system", text: "Your profile verification is up to date", time: "2 days ago", read: true }
];

/* ============================
   ACCOUNT / SETTINGS DATA
   ============================ */
const ARBITRATOR_STORAGE_KEYS = {
    DB: "arbitrator_db",
    ACCOUNTS: "sh_arbitrators_registry",
    ACTIVE_ID: "sh_active_arbitrator_id"
};

const blankProfileData = {
    id: "",
    name: "",
    title: "Senior Arbitrator",
    avatar: "",
    email: "",
    phone: "",
    location: "",
    notifications: 0,
    bio: "",
    languages: [],
    rating: 0,
    completedCases: 0,
    successRate: 0,
    credentials: [],
    expertise: []
};

const arbitratorAuthData = {
    id: "",
    email: "",
    password: "",
    role: "arbitrator",
    approved: true
};

const settingsData = {
    language: "English",
    twoFactorEnabled: true
};

const profileDocumentsData = [];

/* ============================
   ASSEMBLE INITIAL DATA
   ============================ */
const initialData = {
    registration: {
        isComplete: false,
        lastStep: 0,
        formData: {}
    },
    profile: blankProfileData,
    auth: arbitratorAuthData,
    settings: settingsData,
    stats: statsData,
    allCases: casesData,
    recentCases: recentCasesData,
    upcomingHearings: hearingsData.slice(0, 4),
    hearingsList: hearingsData,
    decisionsList: decisionsData,
    caseDocuments: documentsData,
    profileDocuments: profileDocumentsData,
    chatData: messagesData,
    notifications: notificationsData
};

/* ============================
   DATA INITIALIZATION LOGIC
   ============================ */
function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeArbitratorEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function buildArbitratorAvatar(name) {
    const safeName = encodeURIComponent(String(name || "Arbitrator").trim() || "Arbitrator");
    return `https://ui-avatars.com/api/?name=${safeName}&background=1E3A8A&color=fff&size=128`;
}

function readArbitratorStorage() {
    try {
        const rawValue = localStorage.getItem(ARBITRATOR_STORAGE_KEYS.DB);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
        console.warn('Unable to parse "arbitrator_db" from localStorage.', error);
        return null;
    }
}

function readArbitratorAccountsStorage() {
    try {
        const rawValue = localStorage.getItem(ARBITRATOR_STORAGE_KEYS.ACCOUNTS);
        const parsedValue = rawValue ? JSON.parse(rawValue) : [];
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (error) {
        console.warn('Unable to parse arbitrator account registry from localStorage.', error);
        return [];
    }
}

function saveArbitratorAccountsStorage(accounts) {
    localStorage.setItem(ARBITRATOR_STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return accounts;
}

function getArbitratorAccounts() {
    return readArbitratorAccountsStorage().map((account) => normalizeArbitratorData(account));
}

function saveArbitratorAccounts(accounts) {
    return saveArbitratorAccountsStorage(accounts.map((account) => normalizeArbitratorData(account)));
}

function getActiveArbitratorId() {
    return localStorage.getItem(ARBITRATOR_STORAGE_KEYS.ACTIVE_ID) || "";
}

function setActiveArbitratorId(accountId) {
    if (!accountId) {
        localStorage.removeItem(ARBITRATOR_STORAGE_KEYS.ACTIVE_ID);
        return "";
    }

    localStorage.setItem(ARBITRATOR_STORAGE_KEYS.ACTIVE_ID, String(accountId));
    return String(accountId);
}

function clearActiveArbitratorId() {
    localStorage.removeItem(ARBITRATOR_STORAGE_KEYS.ACTIVE_ID);
}

function generateArbitratorId() {
    const timeComponent = Date.now().toString(36).toUpperCase();
    const randomComponent = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ARB-${timeComponent}-${randomComponent}`;
}

function personalizeArbitratorWorkspace(workspace, nextProfile = {}, previousProfile = {}) {
    if (!workspace || !workspace.profile) return workspace;

    const normalizedName = String(nextProfile.name || workspace.profile.name || "").trim();
    const normalizedAvatar = nextProfile.avatar || workspace.profile.avatar || buildArbitratorAvatar(normalizedName || "Arbitrator");
    const previousNames = new Set(
        [
            String(previousProfile.name || "").trim(),
            String(workspace.profile.name || "").trim(),
            String(profileData.name || "").trim()
        ].filter(Boolean)
    );

    workspace.profile = {
        ...workspace.profile,
        ...nextProfile,
        name: normalizedName,
        avatar: normalizedAvatar
    };

    if (workspace.chatData && typeof workspace.chatData === "object") {
        Object.values(workspace.chatData).forEach((chat) => {
            if (!chat || !Array.isArray(chat.messages)) return;

            chat.messages = chat.messages.map((message) => {
                if (message.role !== "Arbitrator") return message;

                return {
                    ...message,
                    name: workspace.profile.name || message.name,
                    avatar: workspace.profile.avatar || message.avatar
                };
            });
        });
    }

    if (Array.isArray(workspace.caseDocuments)) {
        workspace.caseDocuments = workspace.caseDocuments.map((document) => {
            if (!document || !document.uploadedBy || !previousNames.has(String(document.uploadedBy).trim())) {
                return document;
            }

            return {
                ...document,
                uploadedBy: workspace.profile.name
            };
        });
    }

    return workspace;
}

function findArbitratorAccountIndexByEmail(email, accounts = getArbitratorAccounts()) {
    const normalizedEmail = normalizeArbitratorEmail(email);
    return accounts.findIndex((account) => {
        const accountEmail = normalizeArbitratorEmail(
            (account.auth && account.auth.email) ||
            (account.profile && account.profile.email)
        );
        return accountEmail === normalizedEmail;
    });
}

function getArbitratorAccountById(accountId, accounts = getArbitratorAccounts()) {
    if (!accountId) return null;
    return accounts.find((account) => String(account.profile.id || "") === String(accountId)) || null;
}

function upsertArbitratorAccount(accountData) {
    const accounts = getArbitratorAccounts();
    const normalizedAccount = normalizeArbitratorData(accountData);

    if (!normalizedAccount.profile.id) {
        normalizedAccount.profile.id = generateArbitratorId();
    }

    normalizedAccount.auth = {
        ...normalizedAccount.auth,
        id: normalizedAccount.profile.id,
        email: normalizeArbitratorEmail(normalizedAccount.auth.email || normalizedAccount.profile.email),
        role: "arbitrator"
    };

    const existingIndex = accounts.findIndex((account) => (
        String(account.profile.id || "") === String(normalizedAccount.profile.id) ||
        normalizeArbitratorEmail((account.auth && account.auth.email) || (account.profile && account.profile.email)) === normalizedAccount.auth.email
    ));

    if (existingIndex === -1) {
        accounts.push(normalizedAccount);
    } else {
        accounts.splice(existingIndex, 1, normalizedAccount);
    }

    saveArbitratorAccounts(accounts);
    return normalizedAccount;
}

function loadArbitratorAccount(accountId) {
    const account = getArbitratorAccountById(accountId);
    if (!account) return null;

    setActiveArbitratorId(account.profile.id);
    return persistArbitratorData(account);
}

function beginNewArbitratorApplication() {
    clearActiveArbitratorId();

    const freshDraft = normalizeArbitratorData(initialData);
    freshDraft.registration = {
        isComplete: false,
        lastStep: 0,
        formData: {}
    };
    freshDraft.profile = {
        ...freshDraft.profile,
        id: "",
        name: "",
        email: "",
        phone: "",
        location: "",
        avatar: "",
        notifications: 0
    };
    freshDraft.auth = {
        id: "",
        email: "",
        password: "",
        role: "arbitrator",
        approved: true
    };

    return persistArbitratorData(freshDraft);
}

function shouldMigrateWorkspaceToRegistry(workspace) {
    if (!workspace || !workspace.registration || workspace.registration.isComplete !== true) {
        return false;
    }

    const email = normalizeArbitratorEmail(
        (workspace.auth && workspace.auth.email) ||
        (workspace.profile && workspace.profile.email)
    );

    return Boolean(email);
}

function buildRecentCases(allCases) {
    return allCases.slice(0, 3).map((item) => ({
        id: item.id,
        type: item.type,
        parties: `${item.claimant} vs ${item.respondent}`,
        date: item.assigned,
        status: item.status,
        next: item.next || "TBD",
        statusClass: item.statusClass || "arb-badge-blue"
    }));
}

function syncArbitratorDerivedData(data) {
    const syncedData = data;

    if (!Array.isArray(syncedData.allCases)) syncedData.allCases = [];
    if (!Array.isArray(syncedData.hearingsList)) syncedData.hearingsList = [];
    if (!Array.isArray(syncedData.decisionsList)) syncedData.decisionsList = [];
    if (!Array.isArray(syncedData.caseDocuments)) syncedData.caseDocuments = [];
    if (!Array.isArray(syncedData.profileDocuments)) syncedData.profileDocuments = [];
    if (!Array.isArray(syncedData.notifications)) syncedData.notifications = [];

    syncedData.recentCases = buildRecentCases(syncedData.allCases);
    syncedData.upcomingHearings = syncedData.hearingsList.slice(0, 4);
    syncedData.stats.assignedCases = syncedData.allCases.filter((item) => item.status !== "Closed").length;
    syncedData.stats.upcomingHearings = syncedData.hearingsList.length;
    syncedData.stats.pendingDecisions = syncedData.decisionsList.filter((item) => item.status === "Awaiting Decision").length;
    syncedData.stats.docsToReview = syncedData.caseDocuments.length;
    syncedData.profile.notifications = syncedData.notifications.filter((item) => !item.read).length;

    if (!syncedData.profile.avatar) {
        syncedData.profile.avatar = buildArbitratorAvatar(syncedData.profile.name);
    }

    return syncedData;
}

function normalizeArbitratorData(rawData) {
    const fallback = deepClone(initialData);

    if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
        return syncArbitratorDerivedData(fallback);
    }

    const safeRawData = deepClone(rawData);

    const normalizedData = {
        ...fallback,
        ...safeRawData,
        registration: {
            ...fallback.registration,
            ...(safeRawData.registration || {}),
            formData: {
                ...fallback.registration.formData,
                ...((safeRawData.registration && safeRawData.registration.formData) || {})
            }
        },
        profile: {
            ...fallback.profile,
            ...(safeRawData.profile || {})
        },
        auth: {
            ...fallback.auth,
            ...(safeRawData.auth || {})
        },
        settings: {
            ...fallback.settings,
            ...(safeRawData.settings || {})
        },
        stats: {
            ...fallback.stats,
            ...(safeRawData.stats || {})
        },
        allCases: Array.isArray(safeRawData.allCases) ? safeRawData.allCases : fallback.allCases,
        recentCases: Array.isArray(safeRawData.recentCases) ? safeRawData.recentCases : fallback.recentCases,
        upcomingHearings: Array.isArray(safeRawData.upcomingHearings) ? safeRawData.upcomingHearings : fallback.upcomingHearings,
        hearingsList: Array.isArray(safeRawData.hearingsList) ? safeRawData.hearingsList : fallback.hearingsList,
        decisionsList: Array.isArray(safeRawData.decisionsList) ? safeRawData.decisionsList : fallback.decisionsList,
        caseDocuments: Array.isArray(safeRawData.caseDocuments) ? safeRawData.caseDocuments : fallback.caseDocuments,
        profileDocuments: Array.isArray(safeRawData.profileDocuments) ? safeRawData.profileDocuments : fallback.profileDocuments,
        chatData: safeRawData.chatData && typeof safeRawData.chatData === "object" ? safeRawData.chatData : fallback.chatData,
        notifications: Array.isArray(safeRawData.notifications) ? safeRawData.notifications : fallback.notifications
    };

    normalizedData.profile.email = normalizeArbitratorEmail(normalizedData.profile.email);
    normalizedData.profile.id = String(normalizedData.profile.id || "");
    normalizedData.auth.email = normalizeArbitratorEmail(normalizedData.auth.email || normalizedData.profile.email);
    normalizedData.auth.id = String(normalizedData.auth.id || normalizedData.profile.id || "");
    normalizedData.auth.role = "arbitrator";
    normalizedData.auth.password = String(normalizedData.auth.password || "");
    normalizedData.auth.approved = normalizedData.auth.approved !== false;

    const hasSavedApplication = Boolean(
        normalizedData.registration.formData &&
        (
            normalizedData.registration.formData.name ||
            normalizedData.registration.formData.email ||
            normalizedData.registration.formData.password
        )
    );
    const hasCompletedAccountIdentity = normalizedData.registration.isComplete === true && Boolean(
        normalizedData.auth.email ||
        normalizedData.profile.email ||
        normalizedData.auth.id ||
        normalizedData.profile.id
    );

    if (!hasSavedApplication && !normalizedData.auth.password && !hasCompletedAccountIdentity) {
        normalizedData.registration.isComplete = false;
        normalizedData.registration.lastStep = 0;
    }

    normalizedData.registration.lastStep = normalizedData.registration.isComplete
        ? 4
        : Math.max(0, Number(normalizedData.registration.lastStep) || 0);

    return syncArbitratorDerivedData(normalizedData);
}

function persistArbitratorData(nextData) {
    const normalizedData = normalizeArbitratorData(nextData);
    localStorage.setItem(ARBITRATOR_STORAGE_KEYS.DB, JSON.stringify(normalizedData));
    window.ArbitratorData = normalizedData;
    return normalizedData;
}

const savedWorkspace = readArbitratorStorage();
const existingAccounts = getArbitratorAccounts();

if (!existingAccounts.length && shouldMigrateWorkspaceToRegistry(savedWorkspace)) {
    upsertArbitratorAccount(savedWorkspace);
}

const activeArbitratorId = getActiveArbitratorId();
const activeArbitratorAccount = getArbitratorAccountById(activeArbitratorId);
const initialWorkspace = activeArbitratorAccount || (
    savedWorkspace && savedWorkspace.registration && savedWorkspace.registration.isComplete !== true
        ? savedWorkspace
        : initialData
);

window.ArbitratorData = persistArbitratorData(initialWorkspace);

/**
 * GLOBAL UTILITY: saveData()
 * Saves current ArbitratorData state to localStorage.
 * Call this after any data modification.
 */
function saveData() {
    const savedData = persistArbitratorData(window.ArbitratorData || initialData);
    const activeId = getActiveArbitratorId();

    if (activeId && savedData.profile.id && savedData.profile.id === activeId) {
        upsertArbitratorAccount(savedData);
    }

    return savedData;
}

/**
 * GLOBAL UTILITY: updateRegistrationStep()
 */
function updateRegistrationStep(step, data = {}) {
    window.ArbitratorData.registration.lastStep = step;
    window.ArbitratorData.registration.formData = {
        ...window.ArbitratorData.registration.formData,
        ...data
    };
    saveData();
}

/**
 * Reset data to initial state (useful for testing)
 */
function resetData(redirectUrl = "") {
    localStorage.removeItem(ARBITRATOR_STORAGE_KEYS.DB);
    localStorage.removeItem(ARBITRATOR_STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(ARBITRATOR_STORAGE_KEYS.ACTIVE_ID);
    localStorage.removeItem("sh_arbitrator_auth");
    localStorage.removeItem("sh_active_session");
    localStorage.removeItem("activeUser");
    window.ArbitratorData = beginNewArbitratorApplication();
    if (redirectUrl) {
        window.location.replace(redirectUrl);
        return;
    }
    location.reload();
}
