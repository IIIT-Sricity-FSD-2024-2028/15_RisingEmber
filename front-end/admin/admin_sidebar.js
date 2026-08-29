document.addEventListener('DOMContentLoaded', () => {
    // Get the current file name from the URL
    const currentPage = window.location.pathname.split("/").pop() || 'admin_dashboard.html';
    const isIn = (...pages) => pages.includes(currentPage);

    const sidebarHTML = `
    <div class="admin-sidebar">
        <div class="admin-logo">
            <span>Admin Hub</span>
        </div>
        <nav class="admin-nav-list">
            <a href="admin_dashboard.html" class="nav-item ${isIn('admin_dashboard.html') ? 'active' : ''}">
                <i class="fa-solid fa-chart-line"></i> Dashboard
            </a>

            <a href="admin_users.html" class="nav-item ${isIn('admin_users.html', 'admin_create_user.html', 'admin_user_details.html') ? 'active' : ''}">
                <i class="fa-solid fa-users-gear"></i> User Management
            </a>

            <a href="admin_cases.html" class="nav-item ${isIn('admin_cases.html', 'admin_case_details.html') ? 'active' : ''}">
                <i class="fa-solid fa-folder-open"></i> Case Management
            </a>

            <a href="admin_arbitrators.html" class="nav-item ${isIn('admin_arbitrators.html', 'admin_arbitrator_profile.html') ? 'active' : ''}">
                <i class="fa-solid fa-user-tie"></i> Arbitrators
            </a>

            <a href="admin_hearings.html" class="nav-item ${isIn('admin_hearings.html', 'admin_hearing_details.html') ? 'active' : ''}">
                <i class="fa-solid fa-calendar-check"></i> Hearings
            </a>

            <a href="admin_documents.html" class="nav-item ${isIn('admin_documents.html', 'admin_document_details.html') ? 'active' : ''}">
                <i class="fa-solid fa-file-contract"></i> Documents
            </a>

            <a href="admin_awards.html" class="nav-item ${isIn('admin_awards.html', 'admin_award_details.html') ? 'active' : ''}">
                <i class="fa-solid fa-award"></i> Awards
            </a>

            <a href="admin_messages.html" class="nav-item ${isIn('admin_messages.html') ? 'active' : ''}">
                <i class="fa-solid fa-message"></i> Messages
            </a>

            <div class="nav-divider"></div>

            <a href="admin_reports.html" class="nav-item ${isIn('admin_reports.html') ? 'active' : ''}">
                <i class="fa-solid fa-file-invoice-dollar"></i> Reports
            </a>

            <a href="admin_settings.html" class="nav-item ${isIn('admin_settings.html') ? 'active' : ''}">
                <i class="fa-solid fa-gear"></i> Settings
            </a>

            <a href="admin_profile.html" class="nav-item ${isIn('admin_profile.html') ? 'active' : ''}">
                <i class="fa-solid fa-circle-user"></i> Profile
            </a>
        </nav>
    </div>`;

    const placeholder = document.getElementById('admin-sidebar-placeholder');
    if (placeholder) {
        placeholder.innerHTML = sidebarHTML;
    }
});
