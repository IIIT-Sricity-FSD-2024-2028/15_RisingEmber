document.addEventListener('DOMContentLoaded', () => {
    const SIDEBAR_STORAGE_KEY = 'arbitratorSidebarCollapsed';
    // Determine which page we're on
    const currentPage = window.location.pathname.split("/").pop();

    // Build sidebar HTML with toggle button in header
    const sidebarHTML = `
        <aside class="arbitrator-sidebar" id="arbSidebar">
            <div class="arbitrator-sidebar-header">
                <div class="arbitrator-sidebar-logo">
                    <i class="fa-solid fa-gavel" style="font-size: 1.2rem;"></i>
                    <span>Arbitration</span>
                </div>
                <button class="sidebar-toggle-btn" id="sidebarToggleBtn" title="Toggle Sidebar" onclick="toggleSidebar()">
                    <i class="fa-solid fa-chevron-left" id="sidebarToggleIcon"></i>
                </button>
            </div>
            <ul class="arbitrator-nav-list">
                <li class="arbitrator-nav-item"><a href="arbitrator_dashboard.html"><i class="fa-solid fa-house"></i> Dashboard</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_assigned_cases.html"><i class="fa-solid fa-briefcase"></i> Assigned Cases</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_documents.html"><i class="fa-solid fa-file-lines"></i> Case Documents</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_hearings.html"><i class="fa-solid fa-calendar"></i> Hearings & Schedule</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_decisions.html"><i class="fa-solid fa-gavel"></i> Decisions & Awards</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_messages.html"><i class="fa-solid fa-envelope"></i> Messages</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_profile.html"><i class="fa-solid fa-user-gear"></i> Profile & Credentials</a></li>
                <li class="arbitrator-nav-item"><a href="arbitrator_settings.html"><i class="fa-solid fa-cog"></i> Settings</a></li>
                <li class="arbitrator-nav-item"><a href="../Landing_Page/index.html" onclick="event.preventDefault(); logoutArbitrator();"><i class="fa-solid fa-sign-out-alt"></i> Logout</a></li>
            </ul>
        </aside>
        <button class="sidebar-toggle-float" id="sidebarFloatBtn" title="Open Sidebar" onclick="toggleSidebar()">
            <i class="fa-solid fa-bars" id="sidebarFloatIcon"></i>
        </button>
    `;

    const placeholder = document.getElementById('arbitrator-sidebar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = sidebarHTML;

        // Restore collapsed state
        const isCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
        if (isCollapsed) {
            applyCollapsedState();
        }

        // Highlight active nav link
        const links = document.querySelectorAll('.arbitrator-nav-item a');
        links.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }
});

/**
 * Toggle sidebar open/closed
 */
function toggleSidebar() {
    const SIDEBAR_STORAGE_KEY = 'arbitratorSidebarCollapsed';
    const sidebar = document.getElementById('arbSidebar');
    const floatBtn = document.getElementById('sidebarFloatBtn');
    const icon = document.getElementById('sidebarToggleIcon');
    const floatIcon = document.getElementById('sidebarFloatIcon');
    const mainContent = document.querySelector('.arb-main');

    const isCollapsed = sidebar.classList.contains('collapsed');

    if (isCollapsed) {
        // Open sidebar
        sidebar.classList.remove('collapsed');
        floatBtn.classList.remove('visible');
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-left');
        if (floatIcon) {
            floatIcon.classList.remove('fa-bars');
            floatIcon.classList.add('fa-chevron-left');
        }
        if (mainContent) mainContent.classList.remove('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
    } else {
        // Close sidebar
        sidebar.classList.add('collapsed');
        floatBtn.classList.add('visible');
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
        if (floatIcon) {
            floatIcon.classList.remove('fa-chevron-left');
            floatIcon.classList.add('fa-bars');
        }
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
    }
}

/**
 * Apply collapsed state without toggling (on page load)
 */
function applyCollapsedState() {
    const sidebar = document.getElementById('arbSidebar');
    const floatBtn = document.getElementById('sidebarFloatBtn');
    const icon = document.getElementById('sidebarToggleIcon');
    const floatIcon = document.getElementById('sidebarFloatIcon');
    const mainContent = document.querySelector('.arb-main');

    if (sidebar) sidebar.classList.add('collapsed');
    if (floatBtn) {
        floatBtn.classList.add('visible');
        if (floatIcon) {
            floatIcon.classList.remove('fa-chevron-left');
            floatIcon.classList.add('fa-bars');
        }
    }
    if (icon) {
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
    }
    if (mainContent) mainContent.classList.add('sidebar-collapsed');
}
