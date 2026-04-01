/**
 * ADMIN MODULE - INTERACTIVE NAVBAR
 * Handles global search navigation, dropdown toggles, notifications, and secure sign-out.
 */
document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('admin-navbar-placeholder');
    if (!placeholder || !window.AdminData) return;

    const profile = window.AdminData.profile || {};
    const notifications = typeof window.getAdminNotifications === 'function'
        ? window.getAdminNotifications(window.AdminData)
        : [];

    const notificationItems = notifications.length > 0
        ? notifications.map((item) => `
            <div class="notif-item">
                <i class="fa-solid ${item.icon}" style="color:${item.color}"></i>
                <div>
                    <p>${escapeHtml(item.title)}</p>
                    <small>${escapeHtml(item.meta)}</small>
                </div>
            </div>
        `).join('')
        : `
            <div class="notif-item">
                <i class="fa-solid fa-check-circle" style="color:#10b981"></i>
                <div>
                    <p>All quiet for now</p>
                    <small>No new admin alerts</small>
                </div>
            </div>
        `;

    const navbarHTML = `
    <header class="admin-top-nav">
        <div class="search-bar-container">
            <div class="search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="global-search" placeholder="Search applications, cases, arbitrators..." autocomplete="off">
            </div>
            <div id="search-results-dropdown" class="search-results-pop"></div>
        </div>

        <div class="nav-right-actions">
            <div class="notif-wrapper" id="notif-trigger">
                <div class="notif-bell">
                    <i class="fa-solid fa-bell"></i>
                    <span class="badge">${notifications.length}</span>
                </div>
                <div class="notif-dropdown" id="notif-menu">
                    <div class="menu-header">Notifications</div>
                    ${notificationItems}
                    <div class="menu-footer" style="padding:10px; text-align:center; font-size:0.75rem; color:#2563eb; font-weight:700;">
                        Admin watchlist is live
                    </div>
                </div>
            </div>

            <div class="admin-profile-wrapper">
                <div class="admin-profile-trigger" id="profile-dropdown-trigger">
                    <img src="${escapeHtml(profile.avatar || 'https://i.pravatar.cc/150?u=admin_m')}" alt="Admin" id="nav-avatar">
                    <div class="admin-info">
                        <span class="name">${escapeHtml(profile.name || 'Admin')}</span>
                        <span class="role">${escapeHtml(profile.role || 'Administrator')}</span>
                    </div>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>

                <div class="profile-menu-dropdown" id="profile-menu">
                    <div class="menu-header">
                        <strong style="display:block; color:#1e293b;">${escapeHtml(profile.name || 'Admin')}</strong>
                        <span style="font-size:0.7rem; color:#64748b;">${escapeHtml(profile.email || '')}</span>
                    </div>
                    <ul>
                        <li onclick="window.location.href='admin_profile.html'"><i class="fa-solid fa-user"></i> My Profile</li>
                        <li onclick="window.location.href='admin_settings.html'"><i class="fa-solid fa-gear"></i> Platform Settings</li>
                        <li class="logout-item" id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</li>
                    </ul>
                </div>
            </div>
        </div>
    </header>`;

    placeholder.innerHTML = navbarHTML;

    const profileTrigger = document.getElementById('profile-dropdown-trigger');
    const profileMenu = document.getElementById('profile-menu');
    const notifTrigger = document.getElementById('notif-trigger');
    const notifMenu = document.getElementById('notif-menu');
    const searchInput = document.getElementById('global-search');
    const resultsBox = document.getElementById('search-results-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileTrigger && profileMenu && notifMenu) {
        profileTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            notifMenu.classList.remove('show');
            profileMenu.classList.toggle('show');
        });
    }

    if (notifTrigger && notifMenu && profileMenu) {
        notifTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            profileMenu.classList.remove('show');
            notifMenu.classList.toggle('show');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (searchInput && resultsBox) {
        searchInput.addEventListener('input', (event) => {
            const query = event.target.value.toLowerCase().trim();
            if (query.length < 2) {
                resultsBox.style.display = 'none';
                resultsBox.innerHTML = '';
                return;
            }

            const results = [];
            (window.AdminData.cases || []).forEach((caseItem) => {
                if (
                    caseItem.id.toLowerCase().includes(query) ||
                    (caseItem.title && caseItem.title.toLowerCase().includes(query))
                ) {
                    results.push({
                        label: caseItem.title || 'Case',
                        sub: `ID: ${caseItem.id}`,
                        link: `admin_case_details.html?id=${encodeURIComponent(caseItem.id)}`,
                        icon: 'fa-briefcase'
                    });
                }
            });

            (window.AdminData.arbitrators || []).forEach((arbitrator) => {
                if (
                    arbitrator.name.toLowerCase().includes(query) ||
                    arbitrator.id.toLowerCase().includes(query) ||
                    arbitrator.email.toLowerCase().includes(query)
                ) {
                    results.push({
                        label: arbitrator.name,
                        sub: `Arbitrator ${arbitrator.id}`,
                        link: `admin_arbitrator_profile.html?id=${encodeURIComponent(arbitrator.id)}`,
                        icon: 'fa-user-tie'
                    });
                }
            });

            (window.AdminData.users || []).forEach((user) => {
                if (
                    user.name.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.id.toLowerCase().includes(query)
                ) {
                    results.push({
                        label: user.name,
                        sub: `${user.role} ${user.id}`,
                        link: `admin_user_details.html?id=${encodeURIComponent(user.id)}`,
                        icon: 'fa-user'
                    });
                }
            });

            if (results.length === 0) {
                resultsBox.innerHTML = `<div class="search-result-item">No records match "${escapeHtml(query)}"</div>`;
                resultsBox.style.display = 'block';
                return;
            }

            resultsBox.innerHTML = results.slice(0, 6).map((item) => `
                <div class="search-result-item" data-link="${item.link}">
                    <i class="fa-solid ${item.icon}"></i>
                    <div>
                        <strong>${escapeHtml(item.label)}</strong>
                        <span>${escapeHtml(item.sub)}</span>
                    </div>
                </div>
            `).join('');

            resultsBox.style.display = 'block';
            resultsBox.querySelectorAll('.search-result-item[data-link]').forEach((item) => {
                item.addEventListener('mousedown', function navigateToResult(event) {
                    event.preventDefault();
                    window.location.href = this.getAttribute('data-link');
                });
            });
        });
    }

    document.addEventListener('click', () => {
        if (profileMenu) profileMenu.classList.remove('show');
        if (notifMenu) notifMenu.classList.remove('show');
        if (resultsBox) resultsBox.style.display = 'none';
    });
});

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function handleLogout() {
    const confirmed = typeof window.showAppModal === 'function'
        ? await window.showAppModal("Confirm Sign Out", "Your session will be terminated. Are you sure?", {
            confirm: true,
            type: "danger",
            okText: "Sign Out"
        })
        : window.confirm("Your session will be terminated. Are you sure?");
    if (!confirmed) return;

    if (window.AdminData && window.AdminData.session) {
        window.AdminData.session.isLoggedIn = false;
        saveAdminData();
    }

    window.location.replace('admin_landing.html');
}
