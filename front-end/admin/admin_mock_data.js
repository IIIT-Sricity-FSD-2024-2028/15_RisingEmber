/**
 * ADMIN MODULE - PERSISTENT DATA ENGINE
 * Keeps the admin panel stable by normalizing localStorage data and enforcing session access.
 */
(function initAdminDataStore() {
    const ADMIN_DB_KEY = 'admin_db';
    const ADMIN_PUBLIC_PAGES = new Set(['admin_landing.html']);
    const ADMIN_FEEDBACK_STYLE_ID = 'admin-app-feedback-styles';

    function ensureAdminFeedbackStyles() {
        if (typeof document === 'undefined' || document.getElementById(ADMIN_FEEDBACK_STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = ADMIN_FEEDBACK_STYLE_ID;
        style.textContent = `
            .admin-app-toast-stack {
                position: fixed;
                right: 20px;
                bottom: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                z-index: 100000;
                max-width: min(360px, calc(100vw - 32px));
                pointer-events: none;
            }
            .admin-app-toast {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 14px 16px;
                border-radius: 14px;
                background: #0f172a;
                color: #ffffff;
                border-left: 4px solid #2563eb;
                box-shadow: 0 18px 36px rgba(15, 23, 42, 0.24);
                opacity: 0;
                transform: translateY(12px);
                transition: opacity 0.18s ease, transform 0.18s ease;
                font-family: 'Inter', 'Segoe UI', sans-serif;
            }
            .admin-app-toast.is-visible {
                opacity: 1;
                transform: translateY(0);
            }
            .admin-app-toast--success { border-left-color: #16a34a; }
            .admin-app-toast--error { border-left-color: #dc2626; }
            .admin-app-toast--warning { border-left-color: #d97706; }
            .admin-app-toast__body {
                font-size: 0.92rem;
                line-height: 1.45;
                white-space: pre-line;
            }
            .admin-app-modal-overlay {
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(15, 23, 42, 0.45);
                backdrop-filter: blur(4px);
                z-index: 100001;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            .admin-app-modal-overlay.is-visible {
                opacity: 1;
            }
            .admin-app-modal {
                width: min(460px, 100%);
                background: #ffffff;
                border-radius: 20px;
                box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
                overflow: hidden;
                transform: translateY(12px) scale(0.98);
                transition: transform 0.2s ease;
                font-family: 'Inter', 'Segoe UI', sans-serif;
            }
            .admin-app-modal-overlay.is-visible .admin-app-modal {
                transform: translateY(0) scale(1);
            }
            .admin-app-modal__header {
                padding: 24px 24px 10px;
            }
            .admin-app-modal__header h3 {
                margin: 0;
                font-size: 1.16rem;
                font-weight: 800;
                color: #0f172a;
            }
            .admin-app-modal__body {
                padding: 0 24px 24px;
            }
            .admin-app-modal__body p {
                margin: 0;
                color: #475569;
                font-size: 0.95rem;
                line-height: 1.6;
                white-space: pre-line;
            }
            .admin-app-modal__input-wrap {
                margin-top: 16px;
            }
            .admin-app-modal__input {
                width: 100%;
                padding: 12px 14px;
                border: 1px solid #cbd5e1;
                border-radius: 12px;
                font: inherit;
                color: #0f172a;
            }
            .admin-app-modal__input:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
            }
            .admin-app-modal__footer {
                display: flex;
                gap: 12px;
                padding: 0 24px 24px;
            }
            .admin-app-modal__btn {
                flex: 1;
                border: none;
                border-radius: 12px;
                padding: 12px 16px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .admin-app-modal__btn:hover {
                transform: translateY(-1px);
            }
            .admin-app-modal__btn--cancel {
                background: #f1f5f9;
                color: #475569;
            }
            .admin-app-modal__btn--primary {
                background: #2563eb;
                color: #ffffff;
                box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
            }
            .admin-app-modal__btn--danger {
                background: #dc2626;
                color: #ffffff;
                box-shadow: 0 12px 24px rgba(220, 38, 38, 0.18);
            }
            @media (max-width: 640px) {
                .admin-app-toast-stack {
                    left: 16px;
                    right: 16px;
                    bottom: 16px;
                    max-width: none;
                }
                .admin-app-modal__footer {
                    flex-direction: column-reverse;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function showAppToast(message, type = 'info', options = {}) {
        const text = String(message || '').trim();
        if (!text || typeof document === 'undefined') return;

        ensureAdminFeedbackStyles();

        const renderToast = () => {
            let stack = document.querySelector('.admin-app-toast-stack');
            if (!stack) {
                stack = document.createElement('div');
                stack.className = 'admin-app-toast-stack';
                document.body.appendChild(stack);
            }

            const tone = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
            const iconMap = {
                success: 'fa-circle-check',
                error: 'fa-circle-exclamation',
                warning: 'fa-triangle-exclamation',
                info: 'fa-circle-info'
            };

            const toast = document.createElement('div');
            toast.className = `admin-app-toast admin-app-toast--${tone}`;
            toast.innerHTML = `
                <i class="fa-solid ${iconMap[tone]}" aria-hidden="true"></i>
                <div class="admin-app-toast__body"></div>
            `;
            toast.querySelector('.admin-app-toast__body').textContent = text;
            stack.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('is-visible'));

            window.setTimeout(() => {
                toast.classList.remove('is-visible');
                window.setTimeout(() => toast.remove(), 200);
            }, Math.max(1800, Number(options.duration) || 3200));
        };

        if (document.body) {
            renderToast();
        } else {
            document.addEventListener('DOMContentLoaded', renderToast, { once: true });
        }
    }

    function showAppModal(title, message, options = {}) {
        return new Promise((resolve) => {
            if (typeof document === 'undefined') {
                resolve(false);
                return;
            }

            ensureAdminFeedbackStyles();

            const config = options && typeof options === 'object' ? options : {};
            const isConfirm = config.confirm === true || config.prompt === true;
            const tone = config.type === 'danger' ? 'danger' : 'primary';

            const overlay = document.createElement('div');
            overlay.className = 'admin-app-modal-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'admin-app-modal';

            const header = document.createElement('div');
            header.className = 'admin-app-modal__header';

            const heading = document.createElement('h3');
            heading.textContent = String(title || 'Notice');
            header.appendChild(heading);

            const body = document.createElement('div');
            body.className = 'admin-app-modal__body';

            const copy = document.createElement('p');
            copy.textContent = String(message || '');
            body.appendChild(copy);

            let input = null;
            if (config.prompt) {
                const inputWrap = document.createElement('div');
                inputWrap.className = 'admin-app-modal__input-wrap';

                input = document.createElement('input');
                input.className = 'admin-app-modal__input';
                input.type = config.inputType || 'text';
                input.placeholder = config.placeholder || '';
                input.value = config.defaultValue || '';
                input.autocomplete = 'off';
                inputWrap.appendChild(input);
                body.appendChild(inputWrap);
            }

            const footer = document.createElement('div');
            footer.className = 'admin-app-modal__footer';

            let cancelBtn = null;
            if (isConfirm) {
                cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'admin-app-modal__btn admin-app-modal__btn--cancel';
                cancelBtn.textContent = config.cancelText || 'Cancel';
                footer.appendChild(cancelBtn);
            }

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = `admin-app-modal__btn admin-app-modal__btn--${tone}`;
            confirmBtn.textContent = config.okText || (config.prompt ? 'Continue' : isConfirm ? 'Confirm' : 'Got it');
            footer.appendChild(confirmBtn);

            dialog.appendChild(header);
            dialog.appendChild(body);
            dialog.appendChild(footer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            function close(result) {
                overlay.classList.remove('is-visible');
                window.setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 180);
            }

            confirmBtn.addEventListener('click', () => {
                if (config.prompt) {
                    close(input ? input.value : '');
                    return;
                }
                close(true);
            });

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => close(false));
            }

            if (input) {
                window.setTimeout(() => input.focus(), 40);
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        confirmBtn.click();
                    }
                    if (event.key === 'Escape') {
                        close(false);
                    }
                });
            } else {
                window.setTimeout(() => confirmBtn.focus(), 40);
            }

            requestAnimationFrame(() => overlay.classList.add('is-visible'));
        });
    }

    function showAppPrompt(title, message, options = {}) {
        return showAppModal(title, message, { ...options, prompt: true });
    }

    const initialAdminData = {
        session: {
            isLoggedIn: false,
            lastLogin: null
        },
        profile: {
            name: "Michael Thompson",
            role: "System Administrator",
            email: "michael.thompson@arbitratepro.com",
            phone: "+1 (555) 123-4567",
            department: "System Administration",
            avatar: "https://i.pravatar.cc/150?u=admin_m"
        },
        settings: {
            general: {
                name: "ArbitrateHub",
                email: "admin@arbitratehub.com",
                phone: "+1 (555) 123-4567",
                timezone: "UTC-5 (Eastern Time)",
                language: "English"
            },
            arbitration: {
                maxResolutionTime: 90,
                defaultHearingDuration: 2,
                maxFileSize: 50,
                allowedFileTypes: "PDF, DOC, DOCX, JPG, PNG"
            },
            userManagement: {
                allowNewUserRegistrations: true,
                requireEmailVerification: true,
                allowArbitratorApplications: false
            },
            notifications: {
                emailNewCases: true,
                hearingReminders: true,
                awardIssued: false,
                systemAlerts: true
            },
            security: {
                minPasswordLength: 8,
                sessionTimeout: 30,
                twoFactorAuth: "Enabled"
            }
        },
        stats: {
            newApplications: 0,
            pendingReviews: 0,
            verifiedArbitrators: 0,
            activeDisputes: 0,
            totalUsers: 0,
            resolvedCases: 0,
            systemHealth: "98.2%"
        },
        userStats: {
            totalUsers: 0,
            activeUsers: 0,
            pendingApprovals: 0,
            suspendedUsers: 0
        },
        users: [
            {
                id: "USR-1001",
                name: "Sarah Johnson",
                email: "sarah.johnson@techcorp.com",
                role: "Service Provider",
                status: "Active",
                date: "March 15, 2023",
                avatar: "https://i.pravatar.cc/150?u=sarah",
                phone: "+1 (555) 123-4567",
                org: "TechCorp Solutions",
                address: "123 Business Ave, Suite 100, New York, NY 10001",
                lastLogin: "March 30, 2026 at 2:30 PM",
                stats: { involved: 24, won: 18, lost: 3, pending: 3 },
                permissions: ["Manage Cases", "Upload Documents"]
            },
            {
                id: "USR-1002",
                name: "John Smith",
                email: "john@smith.com",
                role: "Customer",
                status: "Active",
                date: "January 8, 2024",
                avatar: "https://i.pravatar.cc/150?u=johnsmith",
                phone: "+1 (555) 0101-7788",
                org: "Independent",
                address: "88 Lakeview Drive, Austin, TX 78701",
                lastLogin: "March 31, 2026 at 9:12 AM",
                stats: { involved: 6, won: 2, lost: 1, pending: 3 },
                permissions: ["Upload Documents"]
            },
            {
                id: "USR-1003",
                name: "Maya Patel",
                email: "maya.patel@bluecart.io",
                role: "Customer",
                status: "Pending",
                date: "March 21, 2026",
                avatar: "https://i.pravatar.cc/150?u=mayapatel",
                phone: "+1 (555) 443-2281",
                org: "BlueCart",
                address: "240 Market Street, San Francisco, CA 94105",
                lastLogin: "Never",
                stats: { involved: 1, won: 0, lost: 0, pending: 1 },
                permissions: ["Upload Documents"]
            },
            {
                id: "USR-1004",
                name: "Dr. Sarah Mitchell",
                email: "sarah.j@lawfirm.com",
                role: "Arbitrator",
                status: "Active",
                date: "November 2, 2022",
                avatar: "https://i.pravatar.cc/150?u=sarahm",
                phone: "+1 (555) 887-1133",
                org: "Mitchell & Associates",
                address: "425 Lexington Ave, New York, NY 10017",
                lastLogin: "March 31, 2026 at 4:45 PM",
                stats: { involved: 342, won: 0, lost: 0, pending: 14 },
                permissions: ["Manage Cases", "Schedule Hearings", "Access Reports"]
            }
        ],
        arbitrators: [
            {
                id: "#ARB001",
                name: "Dr. Sarah Mitchell",
                email: "sarah.j@lawfirm.com",
                specialization: "Commercial Arbitration",
                experience: "15",
                location: "New York, USA",
                phone: "+1 (555) 123-4567",
                organization: "Mitchell & Associates",
                certification: "AAA Certified",
                expertise: "Commercial Law",
                status: "Active",
                avatar: "https://i.pravatar.cc/150?u=sarahm",
                metrics: { activeCases: 14, closedCases: 328, avgResolution: "45 days", upcomingHearings: 7, rating: 4.9, totalReviews: 287, successRate: "96%" },
                casesHandled: 342,
                pastCases: [{ id: "CS-2024-045", title: "Service Agreement Dispute", type: "Commercial", status: "Closed", date: "Jan 15, 2024" }],
                documents: [{ name: "AAA_Certification.pdf" }],
                adminNotes: "Senior expert."
            },
            {
                id: "#ARB002",
                name: "David Chen",
                email: "david.chen@lexbridge.com",
                specialization: "Technology",
                experience: "11",
                location: "Singapore",
                phone: "+65 8123 4567",
                organization: "LexBridge",
                certification: "CIArb Member",
                expertise: "Technology Contracts",
                status: "Active",
                avatar: "https://i.pravatar.cc/150?u=davidchen",
                metrics: { activeCases: 6, closedCases: 112, avgResolution: "39 days", upcomingHearings: 3, rating: 4.7, totalReviews: 94, successRate: "93%" },
                casesHandled: 118,
                pastCases: [{ id: "CS-2026-118", title: "Late Delivery Compensation Claim", type: "Consumer", status: "Under Review", date: "Mar 09, 2026" }],
                documents: [{ name: "CIArb_Good_Standing.pdf" }],
                adminNotes: "Strong on cross-border digital service disputes."
            },
            {
                id: "#ARB003",
                name: "Amara Okafor",
                email: "amara.okafor@oaklegal.ng",
                specialization: "Contract",
                experience: "9",
                location: "Lagos, Nigeria",
                phone: "+234 801 555 0198",
                organization: "Oak Legal Chambers",
                certification: "Regional Arbitration Board",
                expertise: "Contract Enforcement",
                status: "Suspended",
                avatar: "https://i.pravatar.cc/150?u=amaraokafor",
                metrics: { activeCases: 0, closedCases: 64, avgResolution: "52 days", upcomingHearings: 0, rating: 4.4, totalReviews: 41, successRate: "88%" },
                casesHandled: 64,
                pastCases: [],
                documents: [{ name: "Regional_Board_Certificate.pdf" }],
                adminNotes: "Temporarily suspended pending document refresh."
            }
        ],
        cases: [
            {
                id: "CS-2024-045",
                title: "Service Agreement Dispute",
                customer: { name: "John Smith", email: "john@smith.com", phone: "+1 555-0101" },
                provider: { company: "TechSolutions Inc.", name: "Sarah Johnson", email: "sarah.johnson@techcorp.com", phone: "+1 (555) 123-4567" },
                arbitrator: { id: "#ARB001", name: "Dr. Sarah Mitchell", email: "sarah.j@lawfirm.com", status: "Assigned" },
                type: "Commercial",
                status: "Hearing Scheduled",
                filedDateISO: "2024-03-15",
                filedDate: "March 15, 2024",
                timeline: [
                    { event: "Case filed", date: "March 15, 2024", completed: true },
                    { event: "Evidence reviewed", date: "March 18, 2024", completed: true },
                    { event: "Hearing scheduled", date: "March 25, 2024", completed: true }
                ],
                messages: [
                    { user: "John Smith", text: "I have uploaded the signed agreement and invoice trail.", time: "Today at 09:30 AM" },
                    { user: "Sarah Johnson", text: "Our team disputes the revised payment terms cited in the complaint.", time: "Today at 10:05 AM" }
                ],
                notes: "Priority commercial dispute. Keep hearing window intact."
            },
            {
                id: "CS-2026-118",
                title: "Late Delivery Compensation Claim",
                customer: { name: "Maya Patel", email: "maya.patel@bluecart.io", phone: "+1 (555) 443-2281" },
                provider: { company: "QuickMove Logistics", name: "Eric Hall", email: "eric@quickmove.com", phone: "+1 (555) 118-4500" },
                arbitrator: { id: "#ARB002", name: "David Chen", email: "david.chen@lexbridge.com", status: "Assigned" },
                type: "Consumer",
                status: "Under Review",
                filedDateISO: "2026-03-09",
                filedDate: "March 9, 2026",
                timeline: [
                    { event: "Case filed", date: "March 9, 2026", completed: true },
                    { event: "Provider response received", date: "March 10, 2026", completed: true }
                ],
                messages: [
                    { user: "Maya Patel", text: "The delivery deadline was missed by eleven days.", time: "Yesterday at 04:15 PM" }
                ],
                notes: "Check courier logs and revised ETA emails."
            },
            {
                id: "CS-2026-203",
                title: "Platform Billing Reversal",
                customer: { name: "Liam Carter", email: "liam.carter@northpeak.co", phone: "+1 (555) 302-9901" },
                provider: { company: "CleanWave Services", name: "Nina Young", email: "ops@cleanwave.com", phone: "+1 (555) 530-4401" },
                arbitrator: { id: "", name: "Unassigned", email: "", status: "Unassigned" },
                type: "Billing",
                status: "Open",
                filedDateISO: "2026-03-22",
                filedDate: "March 22, 2026",
                timeline: [
                    { event: "Case filed", date: "March 22, 2026", completed: true },
                    { event: "Awaiting review", date: "March 22, 2026", completed: false }
                ],
                messages: [],
                notes: ""
            },
            {
                id: "CS-2026-214",
                title: "Maintenance Contract Breach",
                customer: { name: "Olivia Brooks", email: "olivia@brooksholdings.com", phone: "+1 (555) 614-1122" },
                provider: { company: "Prime Facility Care", name: "Marco Ruiz", email: "marco@primefacility.com", phone: "+1 (555) 720-4488" },
                arbitrator: { id: "#ARB001", name: "Dr. Sarah Mitchell", email: "sarah.j@lawfirm.com", status: "Assigned" },
                type: "Contract",
                status: "Awarded",
                filedDateISO: "2026-02-27",
                filedDate: "February 27, 2026",
                timeline: [
                    { event: "Case filed", date: "February 27, 2026", completed: true },
                    { event: "Hearing completed", date: "March 20, 2026", completed: true },
                    { event: "Award drafted", date: "March 26, 2026", completed: true }
                ],
                messages: [
                    { user: "Olivia Brooks", text: "Please attach the maintenance inspection summary to the record.", time: "March 24, 2026 at 11:18 AM" }
                ],
                notes: "Award pending final signature."
            }
        ],
        hearings: [
            { id: "H-2024-001", caseId: "CS-2024-045", arbitrator: "Dr. Sarah Mitchell", date: "2026-04-14", time: "10:00 AM", type: "Virtual", status: "Scheduled" },
            { id: "H-2026-002", caseId: "CS-2026-214", arbitrator: "Dr. Sarah Mitchell", date: "2026-03-20", time: "02:00 PM", type: "In-Person", status: "Completed" },
            { id: "H-2026-003", caseId: "CS-2026-118", arbitrator: "David Chen", date: "2026-04-07", time: "11:30 AM", type: "Virtual", status: "Scheduled" }
        ],
        documents: [
            { id: "#DOC-001", name: "Contract_Agreement.pdf", caseId: "CS-2024-045", uploader: "John Smith", uploaderRole: "Customer", type: "Legal Contract", date: "Jan 15, 2024", status: "Verified", size: "1.2 MB" },
            { id: "#DOC-002", name: "Delivery_Timeline.xlsx", caseId: "CS-2026-118", uploader: "QuickMove Logistics", uploaderRole: "Service Provider", type: "Evidence", date: "Mar 10, 2026", status: "Pending", size: "0.8 MB" },
            { id: "#DOC-003", name: "Billing_Receipt.png", caseId: "CS-2026-203", uploader: "Liam Carter", uploaderRole: "Customer", type: "Evidence", date: "Mar 22, 2026", status: "Flagged", size: "0.4 MB" },
            { id: "#DOC-004", name: "Expert_Assessment.pdf", caseId: "CS-2026-214", uploader: "Admin", uploaderRole: "Admin", type: "Expert Report", date: "Mar 25, 2026", status: "Verified", size: "2.1 MB" }
        ],
        awards: [
            { id: "AWD-2024-001", caseId: "CS-2024-045", title: "Service Agreement Dispute", arbitrator: "Dr. Sarah Mitchell", date: "2026-03-30", status: "Issued" },
            { id: "AWD-2026-002", caseId: "CS-2026-214", title: "Maintenance Contract Breach", arbitrator: "Dr. Sarah Mitchell", date: "2026-03-26", status: "Draft" }
        ],
        applications: [
            { id: 2001, name: "Elena Rossi", email: "elena.rossi@lexnova.it", country: "Italy", flag: "IT", exp: "8 years", spec: "Commercial", status: "Pending Review", statusClass: "stat-pending" },
            { id: 2002, name: "Kwame Mensah", email: "kwame@mensahlegal.com", country: "Ghana", flag: "GH", exp: "12 years", spec: "Contract", status: "Under Review", statusClass: "stat-review" },
            { id: 2003, name: "Priya Kapoor", email: "priya.kapoor@arblegal.in", country: "India", flag: "IN", exp: "10 years", spec: "Technology", status: "Approved", statusClass: "stat-approved" },
            { id: 2004, name: "Sofia Alvarez", email: "sofia@resolve.com.mx", country: "Mexico", flag: "MX", exp: "6 years", spec: "Consumer", status: "Pending Review", statusClass: "stat-pending" }
        ],
        distribution: [],
        filterOptions: {
            arbitrators: []
        },
        conversations: [
            {
                id: "#1024",
                participants: "Sarah Mitchell vs. David Chen",
                type: "Dispute Related",
                lastMessage: "I need clarification on the contract terms...",
                time: "2m ago",
                status: "Unread",
                isFlagged: false,
                isReviewed: false,
                messages: [
                    { sender: "Sarah Mitchell", time: "Today at 10:30 AM", text: "Hello, I would like to discuss the contract terms.", flagged: false },
                    { sender: "David Chen", time: "Today at 10:34 AM", text: "Please share the signed amendment for review.", flagged: false }
                ]
            },
            {
                id: "#1031",
                participants: "Maya Patel vs. QuickMove Logistics",
                type: "Case Monitoring",
                lastMessage: "The provider has now uploaded the shipment log.",
                time: "1h ago",
                status: "Open",
                isFlagged: true,
                isReviewed: false,
                messages: [
                    { sender: "Maya Patel", time: "Today at 08:12 AM", text: "The late delivery caused a store launch delay.", flagged: true },
                    { sender: "QuickMove Logistics", time: "Today at 08:20 AM", text: "We uploaded our routing evidence a few minutes ago.", flagged: false }
                ]
            }
        ],
        logs: [
            { event: "System Initialized", date: new Date().toLocaleString() }
        ]
    };

    function isPlainObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    function deepMerge(defaults, source) {
        if (!isPlainObject(defaults)) {
            return source !== undefined ? source : defaults;
        }

        const result = { ...defaults };
        const payload = isPlainObject(source) ? source : {};

        Object.keys(payload).forEach((key) => {
            const nextValue = payload[key];
            if (Array.isArray(defaults[key])) {
                result[key] = Array.isArray(nextValue) ? nextValue : defaults[key].slice();
            } else if (isPlainObject(defaults[key])) {
                result[key] = deepMerge(defaults[key], nextValue);
            } else if (nextValue !== undefined) {
                result[key] = nextValue;
            }
        });

        return result;
    }

    function safeParseAdminDb(rawValue) {
        if (!rawValue) return null;
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            console.warn('Failed to parse admin_db. Re-seeding admin storage.', error);
            return null;
        }
    }

    function buildAvatarUrl(name, seed) {
        const safeName = encodeURIComponent(name || seed || 'Admin User');
        return `https://ui-avatars.com/api/?name=${safeName}&background=random`;
    }

    function isValidHumanName(name) {
        const normalizedName = String(name || '').trim().replace(/\s+/g, ' ');
        return normalizedName.length >= 2 && /^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/.test(normalizedName);
    }

    function toIsoDate(value, fallbackValue) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        const fallbackDate = fallbackValue || new Date();
        const parsed = value ? new Date(value) : new Date(fallbackDate);
        if (Number.isNaN(parsed.getTime())) {
            const safeFallback = new Date(fallbackDate);
            return Number.isNaN(safeFallback.getTime()) ? new Date().toISOString().split('T')[0] : safeFallback.toISOString().split('T')[0];
        }
        return parsed.toISOString().split('T')[0];
    }

    function formatLongDate(isoDate) {
        const safeIso = toIsoDate(isoDate);
        return new Date(`${safeIso}T00:00:00`).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function getApplicationStatusClass(status) {
        if (status === 'Approved') return 'stat-approved';
        if (status === 'Rejected') return 'stat-rejected';
        if (status === 'Under Review') return 'stat-review';
        return 'stat-pending';
    }

    function normalizeSession(session) {
        return deepMerge(initialAdminData.session, session);
    }

    function normalizeProfile(profile) {
        const normalized = deepMerge(initialAdminData.profile, profile);
        normalized.avatar = normalized.avatar || initialAdminData.profile.avatar;
        return normalized;
    }

    function normalizeUser(user, index) {
        const defaults = {
            id: `USR-${1001 + index}`,
            name: "New User",
            email: "new.user@example.com",
            role: "Customer",
            status: "Pending",
            date: formatLongDate(new Date()),
            avatar: "",
            phone: "",
            org: "",
            address: "",
            lastLogin: "Never",
            stats: { involved: 0, won: 0, lost: 0, pending: 0 },
            permissions: []
        };

        const normalized = deepMerge(defaults, user);
        normalized.avatar = normalized.avatar || buildAvatarUrl(normalized.name, normalized.id);
        normalized.stats = deepMerge(defaults.stats, normalized.stats);
        normalized.permissions = Array.isArray(normalized.permissions) ? normalized.permissions : [];
        return normalized;
    }

    function normalizeArbitrator(arbitrator, index) {
        const defaults = {
            id: `#ARB${String(index + 1).padStart(3, '0')}`,
            name: "New Arbitrator",
            email: "pending@verification.com",
            specialization: "General",
            experience: "0",
            location: "Not Specified",
            phone: "",
            organization: "",
            certification: "",
            expertise: "General",
            status: "Pending",
            avatar: "",
            metrics: { activeCases: 0, closedCases: 0, avgResolution: "0 days", upcomingHearings: 0, rating: 0, totalReviews: 0, successRate: "0%" },
            casesHandled: 0,
            pastCases: [],
            documents: [],
            adminNotes: ""
        };

        const normalized = deepMerge(defaults, arbitrator);
        normalized.avatar = normalized.avatar || buildAvatarUrl(normalized.name, normalized.id);
        normalized.metrics = deepMerge(defaults.metrics, normalized.metrics);
        normalized.pastCases = Array.isArray(normalized.pastCases) ? normalized.pastCases : [];
        normalized.documents = Array.isArray(normalized.documents) ? normalized.documents : [];
        return normalized;
    }

    function normalizeCustomer(customer) {
        const defaults = { name: "Unknown Customer", email: "", phone: "" };
        if (typeof customer === 'string') {
            return { ...defaults, name: customer || defaults.name };
        }
        return deepMerge(defaults, customer);
    }

    function normalizeProvider(provider) {
        const defaults = { company: "Pending Assignment", name: "", email: "", phone: "" };
        if (typeof provider === 'string') {
            return { ...defaults, company: provider || defaults.company };
        }
        const normalized = deepMerge(defaults, provider);
        normalized.company = normalized.company || normalized.name || defaults.company;
        return normalized;
    }

    function normalizeArbitratorRef(arbitrator) {
        const defaults = { id: "", name: "Unassigned", email: "", status: "Unassigned" };
        if (typeof arbitrator === 'string') {
            return {
                ...defaults,
                name: arbitrator || defaults.name,
                status: arbitrator && arbitrator !== 'Unassigned' ? 'Assigned' : defaults.status
            };
        }
        const normalized = deepMerge(defaults, arbitrator);
        normalized.name = normalized.name || defaults.name;
        normalized.status = normalized.status || (normalized.name !== 'Unassigned' ? 'Assigned' : 'Unassigned');
        return normalized;
    }

    function normalizeTimeline(timeline, filedDateIso, status) {
        if (Array.isArray(timeline) && timeline.length > 0) {
            return timeline.map((item) => ({
                event: item && item.event ? item.event : "Timeline event",
                date: item && item.date ? item.date : formatLongDate(filedDateIso),
                completed: Boolean(item && item.completed)
            }));
        }

        return [
            { event: "Case filed", date: formatLongDate(filedDateIso), completed: true },
            {
                event: status === 'Open' ? "Awaiting review" : "Admin review started",
                date: formatLongDate(filedDateIso),
                completed: status !== 'Open'
            }
        ];
    }

    function normalizeMessages(messages) {
        if (!Array.isArray(messages)) return [];
        return messages.map((message) => ({
            user: message && (message.user || message.sender) ? (message.user || message.sender) : "System",
            sender: message && (message.sender || message.user) ? (message.sender || message.user) : "System",
            text: message && message.text ? message.text : "",
            time: message && message.time ? message.time : "Just now",
            flagged: Boolean(message && message.flagged)
        }));
    }

    function normalizeCaseRecord(caseItem, index) {
        const rawCase = isPlainObject(caseItem) ? caseItem : {};
        const fallbackIso = new Date(Date.now() - index * 86400000);
        const filedDateISO = toIsoDate(rawCase.filedDateISO || rawCase.filedDate || rawCase.date, fallbackIso);
        const defaults = {
            id: `CS-${new Date().getFullYear()}-${String(100 + index).padStart(3, '0')}`,
            title: "Untitled Case",
            customer: normalizeCustomer(),
            provider: normalizeProvider(),
            arbitrator: normalizeArbitratorRef(),
            type: "General",
            status: "Open",
            filedDateISO,
            filedDate: formatLongDate(filedDateISO),
            timeline: [],
            messages: [],
            notes: ""
        };

        const normalized = deepMerge(defaults, rawCase);
        normalized.customer = normalizeCustomer(rawCase.customer !== undefined ? rawCase.customer : defaults.customer);
        normalized.provider = normalizeProvider(rawCase.provider !== undefined ? rawCase.provider : defaults.provider);
        normalized.arbitrator = normalizeArbitratorRef(rawCase.arbitrator !== undefined ? rawCase.arbitrator : defaults.arbitrator);
        normalized.filedDateISO = filedDateISO;
        normalized.filedDate = normalized.filedDate && !/^\d{4}-\d{2}-\d{2}$/.test(normalized.filedDate)
            ? normalized.filedDate
            : formatLongDate(filedDateISO);
        normalized.timeline = normalizeTimeline(normalized.timeline, filedDateISO, normalized.status);
        normalized.messages = normalizeMessages(normalized.messages);
        return normalized;
    }

    function normalizeHearing(hearing, index, cases) {
        const linkedCase = (cases || []).find((item) => item.id === hearing.caseId);
        const defaults = {
            id: `H-${new Date().getFullYear()}-${String(100 + index).padStart(3, '0')}`,
            caseId: linkedCase ? linkedCase.id : "",
            arbitrator: linkedCase ? linkedCase.arbitrator.name : "Unassigned",
            date: toIsoDate(hearing && hearing.date, new Date()),
            time: "10:00 AM",
            type: "Virtual",
            status: "Scheduled"
        };

        const normalized = deepMerge(defaults, hearing);
        normalized.date = toIsoDate(normalized.date, new Date());
        return normalized;
    }

    function inferDocumentUploaderRole(document, cases) {
        if (document && document.uploaderRole) return document.uploaderRole;
        const linkedCase = (cases || []).find((item) => item.id === document.caseId);
        if (document.uploader === 'Admin') return 'Admin';
        if (linkedCase) {
            if (linkedCase.customer.name === document.uploader) return 'Customer';
            if (linkedCase.provider.company === document.uploader || linkedCase.provider.name === document.uploader) {
                return 'Service Provider';
            }
        }
        return 'Customer';
    }

    function normalizeDocument(document, index, cases) {
        const defaults = {
            id: `#DOC-${String(index + 1).padStart(3, '0')}`,
            name: "Untitled_Document.pdf",
            caseId: "",
            uploader: "Admin",
            uploaderRole: "Admin",
            type: "Evidence",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: "Pending",
            size: "N/A"
        };

        const normalized = deepMerge(defaults, document);
        normalized.uploaderRole = inferDocumentUploaderRole(normalized, cases);
        return normalized;
    }

    function normalizeAward(award, index, cases) {
        const linkedCase = (cases || []).find((item) => item.id === award.caseId);
        const defaults = {
            id: `AWD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
            caseId: linkedCase ? linkedCase.id : "",
            title: linkedCase ? linkedCase.title : "Untitled Award",
            arbitrator: linkedCase ? linkedCase.arbitrator.name : "Unassigned",
            date: toIsoDate(award && award.date, new Date()),
            status: "Draft"
        };

        const normalized = deepMerge(defaults, award);
        normalized.date = toIsoDate(normalized.date, new Date());
        return normalized;
    }

    function normalizeApplication(application, index) {
        const defaults = {
            id: 2000 + index + 1,
            name: "New Applicant",
            email: "applicant@example.com",
            country: "USA",
            flag: "US",
            exp: "0 years",
            spec: "General",
            status: "Pending Review",
            statusClass: "stat-pending"
        };

        const normalized = deepMerge(defaults, application);
        normalized.statusClass = getApplicationStatusClass(normalized.status);
        return normalized;
    }

    function normalizeConversation(conversation, index) {
        const defaults = {
            id: `#10${String(index + 20)}`,
            participants: "Conversation",
            type: "General",
            lastMessage: "",
            time: "Just now",
            status: "Open",
            isFlagged: false,
            isReviewed: false,
            messages: []
        };

        const normalized = deepMerge(defaults, conversation);
        normalized.messages = normalizeMessages(normalized.messages).map((message) => ({
            sender: message.sender,
            time: message.time,
            text: message.text,
            flagged: message.flagged
        }));
        normalized.lastMessage = normalized.lastMessage || (normalized.messages[normalized.messages.length - 1] || {}).text || "";
        return normalized;
    }

    function normalizeLogs(logs) {
        if (!Array.isArray(logs) || logs.length === 0) {
            return initialAdminData.logs.slice();
        }

        return logs
            .filter((log) => log && log.event)
            .map((log) => ({
                event: log.event,
                date: log.date || new Date().toLocaleString()
            }))
            .slice(0, 15);
    }

    function buildDistribution(applications) {
        if (!Array.isArray(applications) || applications.length === 0) {
            return [];
        }

        const counts = applications.reduce((accumulator, app) => {
            const key = `${app.flag}||${app.country}`;
            if (!accumulator[key]) {
                accumulator[key] = { flag: app.flag, country: app.country, count: 0 };
            }
            accumulator[key].count += 1;
            return accumulator;
        }, {});

        const maxCount = Math.max(...Object.values(counts).map((item) => item.count), 1);
        return Object.values(counts)
            .sort((left, right) => right.count - left.count)
            .map((item) => ({
                ...item,
                percentage: Math.max(15, Math.round((item.count / maxCount) * 100))
            }));
    }

    function buildArbitratorFilterOptions(data) {
        const names = new Set();
        (data.arbitrators || []).forEach((arb) => {
            if (arb && arb.name) names.add(arb.name);
        });
        (data.cases || []).forEach((caseItem) => {
            if (caseItem && caseItem.arbitrator && caseItem.arbitrator.name && caseItem.arbitrator.name !== 'Unassigned') {
                names.add(caseItem.arbitrator.name);
            }
        });
        return ['All Arbitrators', ...Array.from(names).sort()];
    }

    function syncDerivedData(data) {
        const cases = Array.isArray(data.cases) ? data.cases : [];
        const arbitrators = Array.isArray(data.arbitrators) ? data.arbitrators : [];
        const applications = Array.isArray(data.applications) ? data.applications : [];
        const users = Array.isArray(data.users) ? data.users : [];

        data.filterOptions = {
            arbitrators: buildArbitratorFilterOptions(data)
        };
        data.distribution = buildDistribution(applications);
        data.userStats = {
            totalUsers: users.length,
            activeUsers: users.filter((user) => user.status === 'Active').length,
            pendingApprovals: users.filter((user) => user.status === 'Pending').length,
            suspendedUsers: users.filter((user) => user.status === 'Suspended').length
        };
        data.stats = {
            ...data.stats,
            newApplications: applications.length,
            pendingReviews: applications.filter((app) => app.status === 'Pending Review' || app.status === 'Under Review').length,
            verifiedArbitrators: arbitrators.filter((arb) => arb.status === 'Active').length,
            activeDisputes: cases.filter((caseItem) => caseItem.status !== 'Closed').length,
            totalUsers: users.length,
            resolvedCases: cases.filter((caseItem) => caseItem.status === 'Closed' || caseItem.status === 'Awarded').length
        };
        return data;
    }

    function normalizeAdminData(rawData) {
        const source = isPlainObject(rawData) ? rawData : {};
        const normalized = {
            session: normalizeSession(source.session),
            profile: normalizeProfile(source.profile),
            settings: deepMerge(initialAdminData.settings, source.settings),
            stats: deepMerge(initialAdminData.stats, source.stats),
            userStats: deepMerge(initialAdminData.userStats, source.userStats),
            users: (Array.isArray(source.users) ? source.users : initialAdminData.users).map(normalizeUser),
            arbitrators: (Array.isArray(source.arbitrators) ? source.arbitrators : initialAdminData.arbitrators).map(normalizeArbitrator),
            cases: (Array.isArray(source.cases) ? source.cases : initialAdminData.cases).map(normalizeCaseRecord),
            hearings: [],
            documents: [],
            awards: [],
            applications: (Array.isArray(source.applications) ? source.applications : initialAdminData.applications).map(normalizeApplication),
            distribution: [],
            filterOptions: { arbitrators: [] },
            conversations: (Array.isArray(source.conversations) ? source.conversations : initialAdminData.conversations).map(normalizeConversation),
            logs: normalizeLogs(source.logs)
        };

        normalized.hearings = (Array.isArray(source.hearings) ? source.hearings : initialAdminData.hearings)
            .map((hearing, index) => normalizeHearing(hearing, index, normalized.cases));
        normalized.documents = (Array.isArray(source.documents) ? source.documents : initialAdminData.documents)
            .map((document, index) => normalizeDocument(document, index, normalized.cases));
        normalized.awards = (Array.isArray(source.awards) ? source.awards : initialAdminData.awards)
            .map((award, index) => normalizeAward(award, index, normalized.cases));

        return syncDerivedData(normalized);
    }

    function getAdminCurrentPage() {
        return window.location.pathname.split('/').pop() || 'admin_dashboard.html';
    }

    function isAdminPublicPage(pageName) {
        return ADMIN_PUBLIC_PAGES.has(pageName || getAdminCurrentPage());
    }

    function createAdminCaseRecord(overrides) {
        const baseDate = toIsoDate(new Date());
        return normalizeCaseRecord({
            id: `CS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            title: "New Arbitration Case",
            customer: { name: "New Applicant", email: "", phone: "" },
            provider: { company: "Pending Assignment", name: "", email: "", phone: "" },
            arbitrator: { id: "", name: "Unassigned", email: "", status: "Unassigned" },
            type: "General",
            status: "Open",
            filedDateISO: baseDate,
            filedDate: formatLongDate(baseDate),
            timeline: [
                { event: "Case filed", date: formatLongDate(baseDate), completed: true },
                { event: "Awaiting review", date: formatLongDate(baseDate), completed: false }
            ],
            messages: [],
            notes: "",
            ...(isPlainObject(overrides) ? overrides : {})
        }, 0);
    }

    function getAdminNotifications(sourceData) {
        const data = sourceData || window.AdminData || {};
        const notifications = [];
        const latestCase = (data.cases || []).slice().sort((left, right) => right.filedDateISO.localeCompare(left.filedDateISO))[0];
        const flaggedDocument = (data.documents || []).find((document) => document.status === 'Flagged');
        const flaggedConversation = (data.conversations || []).find((conversation) =>
            conversation.isFlagged || conversation.messages.some((message) => message.flagged)
        );

        if (latestCase) {
            notifications.push({
                icon: 'fa-circle-info',
                color: '#2563eb',
                title: `New case filed: ${latestCase.id}`,
                meta: latestCase.customer.name
            });
        }
        if (flaggedDocument) {
            notifications.push({
                icon: 'fa-triangle-exclamation',
                color: '#f59e0b',
                title: `Flagged document: ${flaggedDocument.id}`,
                meta: flaggedDocument.name
            });
        }
        if (flaggedConversation) {
            notifications.push({
                icon: 'fa-flag',
                color: '#ef4444',
                title: `Message flagged in ${flaggedConversation.id}`,
                meta: flaggedConversation.participants
            });
        }

        return notifications.slice(0, 4);
    }

    function saveAdminData() {
        window.AdminData = normalizeAdminData(window.AdminData);
        localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(window.AdminData));
        return window.AdminData;
    }

    function logAdminActivity(message) {
        if (!message) return;
        if (!window.AdminData.logs) window.AdminData.logs = [];
        window.AdminData.logs.unshift({
            event: message,
            date: new Date().toLocaleString()
        });
        if (window.AdminData.logs.length > 15) {
            window.AdminData.logs = window.AdminData.logs.slice(0, 15);
        }
        saveAdminData();
    }

    function enforceAdminSession() {
        const currentPage = getAdminCurrentPage();
        const isLoggedIn = Boolean(window.AdminData && window.AdminData.session && window.AdminData.session.isLoggedIn);

        if (isAdminPublicPage(currentPage)) {
            if (currentPage === 'admin_landing.html' && isLoggedIn) {
                window.location.replace('admin_dashboard.html');
                return false;
            }
            return true;
        }

        if (!isLoggedIn) {
            window.location.replace('admin_landing.html');
            return false;
        }

        return true;
    }

    const savedAdminDb = localStorage.getItem(ADMIN_DB_KEY);
    const parsedAdminDb = safeParseAdminDb(savedAdminDb);
    window.AdminData = normalizeAdminData(parsedAdminDb || initialAdminData);

    const normalizedSnapshot = JSON.stringify(window.AdminData);
    if (normalizedSnapshot !== savedAdminDb) {
        localStorage.setItem(ADMIN_DB_KEY, normalizedSnapshot);
    }

    window.initialAdminData = initialAdminData;
    window.saveAdminData = saveAdminData;
    window.logAdminActivity = logAdminActivity;
    window.getAdminCurrentPage = getAdminCurrentPage;
    window.isAdminPublicPage = isAdminPublicPage;
    window.enforceAdminSession = enforceAdminSession;
    window.getAdminNotifications = getAdminNotifications;
    window.createAdminCaseRecord = createAdminCaseRecord;
    window.showAppToast = window.showAppToast || showAppToast;
    window.showAppModal = window.showAppModal || showAppModal;
    window.showAppPrompt = window.showAppPrompt || showAppPrompt;
    window.isValidHumanName = window.isValidHumanName || isValidHumanName;

    if (!window.__serviceHubNativeAlert && typeof window.alert === 'function') {
        window.__serviceHubNativeAlert = window.alert.bind(window);
        window.alert = function patchedAdminAlert(message) {
            showAppModal('Notice', String(message || ''), { okText: 'Got it' });
        };
    }

    enforceAdminSession();
})();
