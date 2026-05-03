document.addEventListener('DOMContentLoaded', () => {
    const pageTitles = {
        'arbitrator_dashboard.html': 'Dashboard',
        'arbitrator_assigned_cases.html': 'Assigned Cases',
        'arbitrator_documents.html': 'Case Documents',
        'arbitrator_case_details.html': 'Case Details',
        'arbitrator_hearings.html': 'Hearings & Schedule',
        'arbitrator_decisions.html': 'Decisions & Awards',
        'arbitrator_messages.html': 'Messages',
        'arbitrator_profile.html': 'Profile & Credentials',
        'arbitrator_settings.html': 'Settings'
    };

    const currentPage = window.location.pathname.split("/").pop();
    const title = pageTitles[currentPage] || "Arbitration";

    // Get user data from global ArbitratorData
    const profile = (window.ArbitratorData && window.ArbitratorData.profile) ? window.ArbitratorData.profile : {};
    const notifications = (window.ArbitratorData && window.ArbitratorData.notifications) ? window.ArbitratorData.notifications : [];
    const unreadCount = notifications.filter(n => !n.read).length;
    const userInitials = profile.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';
    const userName = profile.name ? profile.name.split(' ')[0] : 'User';

    const navbarHTML = `
        <header class="arbitrator-top-bar">
            <div style="font-weight: 800; font-size: 1.2rem; color: #111827; cursor: pointer;"
                 onclick="window.location.href='arbitrator_dashboard.html'">${title}</div>

            <div style="display: flex; align-items: center; gap: 24px;">
                <div style="position: relative; display: flex; align-items: center;">
                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; color: #9CA3AF; font-size: 0.9rem;"></i>
                    <input type="text" id="navbarSearch" class="arbitrator-search" placeholder="Search cases, documents..."
                           style="padding-left: 38px; height: 38px; border: 1px solid #D1D5DB; border-radius: 6px; width: 280px; outline: none; font-size: 0.85rem;">
                </div>

                <div style="display: flex; gap: 18px; color: #111827; font-size: 1.1rem; position: relative; align-items: center;">
                    <div id="notif-trigger" style="position: relative; cursor: pointer; padding: 6px;">
                        <i class="fa-solid fa-bell" style="font-size: 1rem; color: #6B7280;"></i>
                        ${unreadCount > 0 ? `<span id="notif-count" style="position: absolute; top: 0; right: -4px; background: #EF4444; color: white; border-radius: 50%; width: 17px; height: 17px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; border: 2px solid white;">${unreadCount}</span>` : ''}

                        <div id="notif-dropdown" style="display: none; position: absolute; top: 42px; right: 0; width: 320px; background: white; border: 1px solid #E5E7EB; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); z-index: 1000; overflow: hidden;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #F3F4F6;">
                                <span style="font-size: 0.9rem; font-weight: 700; color: #111827;">Notifications</span>
                                <span id="markAllRead" style="color: #1E40AF; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Mark all as read</span>
                            </div>
                            <div style="max-height: 320px; overflow-y: auto;">
                                ${notifications.slice(0, 5).map(n => `
                                    <div style="padding: 12px 16px; border-bottom: 1px solid #F9FAFB; ${!n.read ? 'background: #F8FAFF;' : ''}">
                                        <p style="font-size: 0.8rem; color: #374151; line-height: 1.4;">${n.text}</p>
                                        <p style="font-size: 0.7rem; color: #9CA3AF; margin-top: 4px;">${n.time}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <i class="fa-solid fa-envelope" style="font-size: 1rem; color: #6B7280; cursor: pointer;" onclick="window.location.href='arbitrator_messages.html'" title="Messages"></i>
                </div>

                <div style="display: flex; align-items: center; gap: 12px; border-left: 1px solid #E5E7EB; padding-left: 20px;">
                    <div class="profile-circle"
                         style="width: 36px; height: 36px; background: #E5E7EB; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #1E3A8A; cursor: pointer;"
                         onclick="window.location.href='arbitrator_profile.html'">${userInitials}</div>
                    <div style="display: flex; align-items: center; gap: 5px; cursor: pointer;" onclick="window.location.href='arbitrator_profile.html'">
                        <span style="font-size: 0.9rem; font-weight: 600; color: #374151;">${userName}</span>
                        <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem; color: #9CA3AF;"></i>
                    </div>
                </div>
            </div>
        </header>
    `;

    const placeholder = document.getElementById('arbitrator-navbar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = navbarHTML;

        // Search
        const searchInput = document.getElementById('navbarSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && searchInput.value.trim() !== "") {
                    const query = searchInput.value.trim().toLowerCase();
                    const caseMatch = (window.ArbitratorData?.allCases || []).find((item) =>
                        [item.id, item.type, item.claimant, item.respondent]
                            .filter(Boolean)
                            .some((value) => String(value).toLowerCase().includes(query))
                    );
                    if (caseMatch) {
                        window.location.href = buildCaseDetailsUrl(caseMatch.id);
                        return;
                    }

                    const documentMatch = (window.ArbitratorData?.caseDocuments || []).find((item) =>
                        [item.name, item.id, item.uploadedBy, item.type]
                            .filter(Boolean)
                            .some((value) => String(value).toLowerCase().includes(query))
                    );
                    if (documentMatch) {
                        window.location.href = `arbitrator_documents.html?case=${encodeURIComponent(documentMatch.id)}`;
                        return;
                    }

                    const decisionMatch = (window.ArbitratorData?.decisionsList || []).find((item) =>
                        [item.id, item.parties, item.type]
                            .filter(Boolean)
                            .some((value) => String(value).toLowerCase().includes(query))
                    );
                    if (decisionMatch) {
                        window.location.href = buildDecisionsUrl(decisionMatch.id);
                        return;
                    }

                    if (typeof window.showAppToast === 'function') {
                        window.showAppToast(`No arbitration records matched "${searchInput.value.trim()}".`, 'warning');
                    }
                }
            });
        }

        // Notification dropdown
        const notifTrigger = document.getElementById('notif-trigger');
        const notifDropdown = document.getElementById('notif-dropdown');
        const markAllRead = document.getElementById('markAllRead');

        if (notifTrigger && notifDropdown) {
            notifTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
            });

            document.addEventListener('click', () => {
                notifDropdown.style.display = 'none';
            });

            notifDropdown.addEventListener('click', (e) => e.stopPropagation());
        }

        if (markAllRead) {
            markAllRead.addEventListener('click', () => {
                if (window.ArbitratorData && window.ArbitratorData.notifications) {
                    window.ArbitratorData.notifications.forEach(n => n.read = true);
                    saveData();
                    const countEl = document.getElementById('notif-count');
                    if (countEl) countEl.style.display = 'none';
                    notifDropdown.style.display = 'none';
                }
            });
        }
    }
});
