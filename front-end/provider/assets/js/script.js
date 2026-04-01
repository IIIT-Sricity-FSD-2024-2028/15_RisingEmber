/* =============================================
   ServiceHub – Provider Dashboard JS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Sidebar Active State ── */
  const currentPage = window.location.pathname.split('/').pop() || 'provider_dashboard.html';
  document.querySelectorAll('.sidebar__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  /* ── 2. Header Dropdowns (Notifications & Profile) ── */
  const navbarActions = document.querySelector('.navbar__actions');
  if (navbarActions) {
    if (!document.getElementById('notifMenu')) {
      const notifBtn = document.querySelector('.navbar__notif');
      if (notifBtn) {
        const notifWrapper = document.createElement('div');
        notifWrapper.className = 'dropdown-wrapper';
        notifBtn.parentNode.insertBefore(notifWrapper, notifBtn);
        notifWrapper.appendChild(notifBtn);
        notifBtn.id = 'notifDropdownBtn';
        notifWrapper.insertAdjacentHTML('beforeend', `
          <div class="dropdown-menu" id="notifMenu">
            <div class="dropdown-header"><h4>Notifications</h4></div>
            <div class="dropdown-body">
              <div class="notif-item unread">
                <div class="notif-icon" style="background:#DBEAFE;color:#3B82F6;"><i class="fa-solid fa-briefcase"></i></div>
                <div class="notif-content"><p><strong>New job request</strong> from Sarah</p><span>2 mins ago</span></div>
              </div>
            </div>
            <div class="dropdown-footer" style="text-align:center;">
              <a href="jobs.html" style="font-size:0.85rem; font-weight:600; color:var(--primary);">View all</a>
            </div>
          </div>
        `);
      }

      const profileImg = document.querySelector('.navbar__avatar');
      if (profileImg) {
        const profileWrapper = document.createElement('div');
        profileWrapper.className = 'dropdown-wrapper';
        profileImg.parentNode.insertBefore(profileWrapper, profileImg);
        profileWrapper.appendChild(profileImg);
        profileImg.id = 'profileDropdownBtn';
        profileWrapper.insertAdjacentHTML('beforeend', `
          <div class="dropdown-menu profile-menu" id="profileMenu">
            <div class="profile-header">
              <div class="profile-avatar-large"><i class="fa-regular fa-user"></i></div>
              <div>
                <h4 id="dropdownProfileName">Provider</h4>
                <p id="dropdownProfileRole">Service Provider</p>
              </div>
            </div>
            <ul class="profile-links">
              <li><a href="profile.html"><i class="fa-regular fa-user"></i> My Profile</a></li>
              <li><a href="../Landing_Page/index.html" class="text-danger" onclick="event.preventDefault(); logoutProvider();"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a></li>
            </ul>
          </div>
        `);
      }
    }
  }

  const notifBtn = document.getElementById('notifDropdownBtn');
  const notifMenu = document.getElementById('notifMenu');
  const profileBtn = document.getElementById('profileDropdownBtn');
  const profileMenu = document.getElementById('profileMenu');

  // Toggle Notifications
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifMenu.classList.toggle('active');
      if (profileMenu) profileMenu.classList.remove('active');
    });
  }

  // Toggle Profile
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
      if (notifMenu) notifMenu.classList.remove('active');
    });
  }

  // Close dropdowns when clicking anywhere else
  document.addEventListener('click', (e) => {
    if (notifMenu && !notifMenu.contains(e.target)) notifMenu.classList.remove('active');
    if (profileMenu && !profileMenu.contains(e.target)) profileMenu.classList.remove('active');
  });

  /* ── 3. Logout Logic ── */
  document.addEventListener('click', (e) => {
    const logoutLink = e.target.closest('.sidebar__logout');
    if (!logoutLink) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    if (typeof logoutProvider === 'function') {
      logoutProvider();
    }
  }, true);

  /* ── 4. Stat Card Counter Animation ── */
  function animateValue(el, target, isMonetary = false) {
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = target / (duration / step);
    if (increment === 0) {
      el.textContent = isMonetary ? '$0' : '0';
      return;
    }
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { start = target; clearInterval(timer); }
      const display = Math.floor(start).toLocaleString();
      el.textContent = isMonetary ? `$${display}` : display;
    }, step);
  }

  const PROVIDER_FLASH_KEY = 'sh_provider_ui_flash';

  function showToast(message, type = 'info', duration = 3200) {
    if (typeof window.showAppToast === 'function') {
      window.showAppToast(message, type, { duration });
      return;
    }

    console[type === 'error' ? 'error' : 'log'](message);
  }

  function setProviderFlash(message, type = 'success') {
    if (typeof writeStorageJSON !== 'function') return;
    writeStorageJSON(PROVIDER_FLASH_KEY, {
      message: String(message || ''),
      type,
      createdAt: new Date().toISOString()
    });
  }

  function consumeProviderFlash() {
    if (typeof readStorageJSON !== 'function') return;
    const flash = readStorageJSON(PROVIDER_FLASH_KEY, null);
    if (!flash || !flash.message) return;
    localStorage.removeItem(PROVIDER_FLASH_KEY);
    showToast(flash.message, flash.type || 'success');
  }

  function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function buildProviderUrl(page, id) {
    return id ? `${page}?id=${encodeURIComponent(id)}` : page;
  }

  function formatStatusLabel(status) {
    const value = String(status || 'pending')
      .replace(/_/g, ' ')
      .trim();
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Pending';
  }

  function formatCurrency(value) {
    return '$' + Number(value || 0).toLocaleString();
  }

  function normalizeTextValue(value) {
    return String(value || '').trim();
  }

  function buildProviderAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizeTextValue(name) || 'Provider')}&background=2F54EB&color=fff&size=200`;
  }

  function getProviderAvatarSource(user) {
    return normalizeTextValue(user && user.avatar) || buildProviderAvatarUrl(user && user.name);
  }

  function getFieldErrorElement(input) {
    if (!input) return null;

    const fieldKey = input.id || input.name || 'provider-field';
    const group = input.closest('.form-group') || input.parentNode;
    if (!group) return null;

    let errorSpan = group.querySelector(`.error-msg[data-for="${fieldKey}"]`);
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'error-msg';
      errorSpan.dataset.for = fieldKey;
      errorSpan.style.color = '#EF4444';
      errorSpan.style.fontSize = '0.75rem';
      errorSpan.style.marginTop = '4px';
      errorSpan.style.display = 'block';
      group.appendChild(errorSpan);
    }

    return errorSpan;
  }

  function setFieldError(input, message) {
    if (!input) return;
    input.style.borderColor = '#EF4444';
    const errorSpan = getFieldErrorElement(input);
    if (errorSpan) errorSpan.textContent = message;
  }

  function clearFieldError(input) {
    if (!input) return;
    input.style.borderColor = '';
    const fieldKey = input.id || input.name || 'provider-field';
    const group = input.closest('.form-group') || input.parentNode;
    const errorSpan = group ? group.querySelector(`.error-msg[data-for="${fieldKey}"]`) : null;
    if (errorSpan) errorSpan.remove();
  }

  function clearFieldErrors(scope = document) {
    scope.querySelectorAll('input, select, textarea').forEach((field) => clearFieldError(field));
  }

  function bindLiveValidation(scope = document) {
    scope.querySelectorAll('input, select, textarea').forEach((field) => {
      if (field.dataset.validationBound === 'true') return;
      field.dataset.validationBound = 'true';

      ['input', 'change', 'blur'].forEach((eventName) => {
        field.addEventListener(eventName, () => clearFieldError(field));
      });
    });
  }

  function validateFileList(files, options = {}) {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return { valid: true, files: [] };

    const allowedTypes = Array.isArray(options.allowedTypes) ? options.allowedTypes : [];
    const allowedExtensions = Array.isArray(options.allowedExtensions)
      ? options.allowedExtensions.map((ext) => String(ext).toLowerCase())
      : [];
    const maxSizeMB = Number(options.maxSizeMB) || 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const maxFiles = Number(options.maxFiles) || 0;

    if (maxFiles && selectedFiles.length > maxFiles) {
      return {
        valid: false,
        message: `You can upload up to ${maxFiles} files here.`
      };
    }

    for (const file of selectedFiles) {
      const fileType = String(file.type || '').toLowerCase();
      const fileName = String(file.name || '').toLowerCase();
      const matchesType = !allowedTypes.length || allowedTypes.some((type) => (
        type.endsWith('/*')
          ? fileType.startsWith(type.slice(0, -1))
          : fileType === type
      ));
      const matchesExtension = !allowedExtensions.length || allowedExtensions.some((ext) => fileName.endsWith(ext));

      if (!matchesType && !matchesExtension) {
        return {
          valid: false,
          message: options.invalidTypeMessage || 'Please upload a supported file type.'
        };
      }

      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          message: `${file.name} is larger than ${maxSizeMB}MB.`
        };
      }
    }

    return { valid: true, files: selectedFiles };
  }

  function getPaginationState(items, requestedPage, pageSize) {
    const safeItems = Array.isArray(items) ? items : [];
    const totalItems = safeItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
    const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
    const startIndex = totalItems ? (currentPage - 1) * pageSize : 0;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      items: safeItems.slice(startIndex, endIndex)
    };
  }

  function createPaginationButton({ label, icon, active = false, disabled = false, onClick }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `page-btn${active ? ' active' : ''}`;
    button.disabled = disabled;

    if (icon) {
      button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    } else {
      button.textContent = String(label);
    }

    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  function renderPaginationControls(container, currentPage, totalPages, onPageChange) {
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';
    container.appendChild(createPaginationButton({
      icon: 'fa-chevron-left',
      disabled: currentPage === 1,
      onClick: () => onPageChange(currentPage - 1)
    }));

    for (let page = 1; page <= totalPages; page += 1) {
      container.appendChild(createPaginationButton({
        label: page,
        active: page === currentPage,
        onClick: () => onPageChange(page)
      }));
    }

    container.appendChild(createPaginationButton({
      icon: 'fa-chevron-right',
      disabled: currentPage === totalPages,
      onClick: () => onPageChange(currentPage + 1)
    }));
  }

  function updateShowingText(element, startIndex, endIndex, totalItems, noun = 'entries') {
    if (!element) return;
    element.textContent = totalItems
      ? `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} ${noun}`
      : `Showing 0 of 0 ${noun}`;
  }

  function formatJobBadgeClass(status) {
    if (status === 'completed') return 'completed';
    if (status === 'pending') return 'pending';
    return 'active';
  }

  function getFallbackAddress(job) {
    return job.address || job.location || 'Service address shared after confirmation';
  }

  function normalizeJobRecord(job) {
    const serviceName = job.service || 'Service Request';
    const customerName = job.customerName || 'Customer';
    const inferredLocation = job.location || job.address || 'Location to be confirmed';
    const inferredPhone = job.customerPhone || '+1 (555) 000-0000';
    const inferredTime = job.time || 'Time to be confirmed';
    const inferredDescription = job.description || `Customer requested ${serviceName.toLowerCase()} support.`;
    const inferredStage = job.progressStage || (
      job.status === 'completed'
        ? 'completed'
        : (job.status === 'progress' ? 'in_progress' : (job.status === 'active' ? 'accepted' : 'pending'))
    );

    return {
      ...job,
      service: serviceName,
      customerName,
      customerAvatar: job.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=DBEAFE&color=1E3A8A&size=128`,
      date: job.date || 'Date to be confirmed',
      time: inferredTime,
      location: inferredLocation,
      address: getFallbackAddress({ ...job, location: inferredLocation }),
      customerPhone: inferredPhone,
      description: inferredDescription,
      status: job.status || 'pending',
      progressStage: inferredStage,
      statusUpdates: Array.isArray(job.statusUpdates) ? job.statusUpdates : [],
      notes: job.notes || ''
    };
  }

  function normalizeServiceRecord(service) {
    return {
      ...service,
      name: service.name || 'Untitled Service',
      category: service.category || 'Other',
      duration: service.duration || 'Custom Quote',
      description: service.description || `Professional ${String(service.name || 'service').toLowerCase()} support.`,
      image: service.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
      price: Number(service.price) || 0,
      status: service.status === 'paused' ? 'paused' : 'active'
    };
  }

  function normalizeDisputeRecord(dispute) {
    return {
      ...dispute,
      id: normalizeTextValue(dispute.id) || `JOB-${Date.now()}`,
      customerName: normalizeTextValue(dispute.customerName) || 'Customer',
      issue: normalizeTextValue(dispute.issue || dispute.category) || 'General dispute',
      description: normalizeTextValue(dispute.description),
      status: ['pending', 'under_review', 'resolved'].includes(dispute.status) ? dispute.status : 'pending',
      evidence: Array.isArray(dispute.evidence) ? dispute.evidence : [],
      createdAt: dispute.createdAt || new Date().toISOString()
    };
  }

  function getProviderCollections(activeEmail) {
    const allServices = typeof readStorageJSON === 'function'
      ? readStorageJSON('sh_services', (typeof getDB === 'function' ? getDB('sh_services') : []))
      : [];
    const allJobs = typeof readStorageJSON === 'function'
      ? readStorageJSON('sh_jobs', (typeof getDB === 'function' ? getDB('sh_jobs') : []))
      : [];

    const safeServices = Array.isArray(allServices) ? allServices.map(normalizeServiceRecord) : [];
    const safeJobs = Array.isArray(allJobs) ? allJobs.map(normalizeJobRecord) : [];

    return {
      allServices: safeServices,
      visibleServices: activeEmail
        ? safeServices.filter((service) => !service.providerEmail || service.providerEmail.toLowerCase() === activeEmail)
        : safeServices,
      allJobs: safeJobs,
      visibleJobs: activeEmail
        ? safeJobs.filter((job) => !job.providerEmail || job.providerEmail.toLowerCase() === activeEmail)
        : safeJobs
    };
  }

  function saveServicesCollection(services) {
    if (typeof writeStorageJSON === 'function') {
      writeStorageJSON('sh_services', services);
    } else if (typeof updateDB === 'function') {
      updateDB('sh_services', services);
    }
  }

  function saveJobsCollection(jobs) {
    if (typeof writeStorageJSON === 'function') {
      writeStorageJSON('sh_jobs', jobs);
    } else if (typeof updateDB === 'function') {
      updateDB('sh_jobs', jobs);
    }
  }

  function saveDisputesCollection(disputes) {
    if (typeof writeStorageJSON === 'function') {
      writeStorageJSON('sh_disputes', disputes);
    } else if (typeof updateDB === 'function') {
      updateDB('sh_disputes', disputes);
    }
  }

  function createStatusUpdate(stage, notes, evidence) {
    return {
      stage,
      notes: String(notes || '').trim(),
      evidence: Array.isArray(evidence) ? evidence : [],
      updatedAt: new Date().toISOString()
    };
  }

  let activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
  let activeEmail = activeUser && activeUser.email ? activeUser.email.toLowerCase() : null;
  let stagedProfileAvatar = normalizeTextValue(activeUser && activeUser.avatar);

  function refreshActiveIdentity(nextUser = null) {
    activeUser = nextUser || (typeof getActiveUser === 'function' ? getActiveUser() : null);
    activeEmail = activeUser && activeUser.email ? activeUser.email.toLowerCase() : null;
    stagedProfileAvatar = normalizeTextValue(activeUser && activeUser.avatar) || stagedProfileAvatar;
    return activeUser;
  }

  consumeProviderFlash();

  document.querySelectorAll('.stat-card__value, .earnings-summary__amount').forEach(el => {
    // Skip elements that will be updated by dynamic data — they handle their own animation
    if (el.hasAttribute('data-dynamic')) return;
    const raw = el.textContent.trim();
    const isMonetary = raw.startsWith('$');
    const numStr = raw.replace(/[$,]/g, '');
    const target = parseFloat(numStr);
    if (isNaN(target)) return;
    animateValue(el, target, isMonetary);
  });

  /* ── 5. Profile Photo Upload Preview ── */
  const photoInput = document.getElementById('photoInput');
  const avatarImg = document.getElementById('avatarImg');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarFallbackIcon = avatarPreview ? avatarPreview.querySelector('i') : null;
  const profileNameInput = document.getElementById('fullName');
  const profilePhoneInput = document.getElementById('phone');
  const profileEmailInput = document.getElementById('email');
  const profileCategoryInput = document.getElementById('category');
  const profileExperienceInput = document.getElementById('experience');
  const profileLocationInput = document.getElementById('location');
  const profileBioInput = document.getElementById('bio');
  const profileCharCount = document.getElementById('charCount');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  function renderProfileAvatar(avatarSource, fallbackName) {
    if (!avatarImg) return;

    const nextAvatar = normalizeTextValue(avatarSource);
    if (nextAvatar) {
      avatarImg.src = nextAvatar;
      avatarImg.style.display = 'block';
      if (avatarFallbackIcon) avatarFallbackIcon.style.display = 'none';
      return;
    }

    avatarImg.src = buildProviderAvatarUrl(fallbackName || (activeUser && activeUser.name));
    avatarImg.style.display = 'block';
    if (avatarFallbackIcon) avatarFallbackIcon.style.display = 'none';
  }

  function updateBioHint() {
    if (!profileBioInput || !profileCharCount) return;
    profileCharCount.textContent = `${profileBioInput.value.length}/500 characters`;
  }

  function populateProfileForm(profile) {
    if (!profile) return;

    if (profileNameInput) profileNameInput.value = profile.name || '';
    if (profilePhoneInput) profilePhoneInput.value = profile.phone || '';
    if (profileEmailInput) profileEmailInput.value = profile.email || '';
    if (profileCategoryInput) profileCategoryInput.value = profile.category || '';
    if (profileExperienceInput) profileExperienceInput.value = profile.experience || '';
    if (profileLocationInput) profileLocationInput.value = profile.location || '';
    if (profileBioInput) profileBioInput.value = profile.bio || '';

    stagedProfileAvatar = normalizeTextValue(profile.avatar);
    renderProfileAvatar(stagedProfileAvatar, profile.name);
    updateBioHint();
  }

  bindLiveValidation(document);

  if (photoInput && avatarImg) {
    photoInput.addEventListener('change', async function handleAvatarSelection() {
      const file = this.files && this.files[0] ? this.files[0] : null;
      if (!file) return;

      const fileValidation = validateFileList([file], {
        allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        maxSizeMB: 5,
        invalidTypeMessage: 'Please upload a JPG, PNG, GIF, or WebP image.'
      });

      if (!fileValidation.valid) {
        showToast(fileValidation.message, 'error');
        this.value = '';
        return;
      }

      stagedProfileAvatar = await readFileAsDataUrl(file);
      renderProfileAvatar(stagedProfileAvatar, profileNameInput ? profileNameInput.value.trim() : '');
    });
  }

  if (profileBioInput) {
    profileBioInput.addEventListener('input', updateBioHint);
    updateBioHint();
  }

  if (saveBtn) {
    const currentProfile = (activeUser && activeUser.role === 'provider')
      ? activeUser
      : (typeof getDB === 'function' ? getDB('sh_provider') : null);

    populateProfileForm(currentProfile);

    if (cancelBtn) {
      cancelBtn.addEventListener('click', (event) => {
        event.preventDefault();
        clearFieldErrors(document);
        refreshActiveIdentity();
        populateProfileForm((activeUser && activeUser.role === 'provider')
          ? activeUser
          : (typeof getDB === 'function' ? getDB('sh_provider') : null));
        if (photoInput) photoInput.value = '';
        showToast('Unsaved profile changes were discarded.', 'info');
      });
    }

    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearFieldErrors(document);

      const providerList = typeof getProviderUsers === 'function' ? getProviderUsers() : [];
      const storedProfile = typeof getDB === 'function' ? getDB('sh_provider') : {};
      const previousIdentity = activeUser && activeUser.role === 'provider' ? activeUser : storedProfile;
      const previousEmail = normalizeEmail(previousIdentity.email || '');
      const previousPhone = normalizePhone(previousIdentity.phone || '');

      const fullName = normalizeTextValue(profileNameInput && profileNameInput.value);
      const email = normalizeEmail(profileEmailInput && profileEmailInput.value);
      const phoneValue = normalizeTextValue(profilePhoneInput && profilePhoneInput.value);
      const normalizedPhone = normalizePhone(phoneValue);
      const category = normalizeTextValue(profileCategoryInput && profileCategoryInput.value);
      const experience = normalizeTextValue(profileExperienceInput && profileExperienceInput.value);
      const location = normalizeTextValue(profileLocationInput && profileLocationInput.value);
      const bio = normalizeTextValue(profileBioInput && profileBioInput.value);

      let isValid = true;

      if (!fullName) {
        setFieldError(profileNameInput, 'Full name is required.');
        isValid = false;
      } else if (fullName.length < 2 || !/^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/.test(fullName)) {
        setFieldError(profileNameInput, 'Please enter a valid full name.');
        isValid = false;
      }

      if (!email) {
        setFieldError(profileEmailInput, 'Email is required.');
        isValid = false;
      } else if (typeof isValidEmail === 'function' && !isValidEmail(email)) {
        setFieldError(profileEmailInput, 'Please enter a valid email address.');
        isValid = false;
      }

      if (!phoneValue) {
        setFieldError(profilePhoneInput, 'Phone number is required.');
        isValid = false;
      } else if (!(normalizedPhone.length === 10 || (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')))) {
        setFieldError(profilePhoneInput, 'Please enter a valid phone number.');
        isValid = false;
      }

      if (!category) {
        setFieldError(profileCategoryInput, 'Please choose a service category.');
        isValid = false;
      }

      if (!experience) {
        setFieldError(profileExperienceInput, 'Please select your experience level.');
        isValid = false;
      }

      if (!location) {
        setFieldError(profileLocationInput, 'Location is required.');
        isValid = false;
      } else if (location.length < 2) {
        setFieldError(profileLocationInput, 'Please enter a valid service area.');
        isValid = false;
      }

      if (!bio) {
        setFieldError(profileBioInput, 'Please add a short professional bio.');
        isValid = false;
      } else if (bio.length < 30) {
        setFieldError(profileBioInput, 'Bio must be at least 30 characters long.');
        isValid = false;
      } else if (bio.length > 500) {
        setFieldError(profileBioInput, 'Bio must be 500 characters or fewer.');
        isValid = false;
      }

      const duplicateEmail = providerList.some((provider) => normalizeEmail(provider.email) === email && normalizeEmail(provider.email) !== previousEmail);
      if (duplicateEmail) {
        setFieldError(profileEmailInput, 'Another provider account already uses this email.');
        isValid = false;
      }

      const duplicatePhone = providerList.some((provider) => normalizePhone(provider.phone) === normalizedPhone && normalizeEmail(provider.email) !== previousEmail);
      if (duplicatePhone) {
        setFieldError(profilePhoneInput, 'Another provider account already uses this phone number.');
        isValid = false;
      }

      if (!isValid) return;

      const nextUser = {
        ...storedProfile,
        ...previousIdentity,
        name: fullName,
        email,
        phone: phoneValue,
        category,
        experience,
        location,
        bio,
        avatar: stagedProfileAvatar || normalizeTextValue(previousIdentity.avatar),
        walletBalance: Number(previousIdentity.walletBalance ?? storedProfile.walletBalance ?? 0),
        role: 'provider'
      };

      const accountIndex = providerList.findIndex((provider) => {
        const providerEmail = normalizeEmail(provider.email);
        return providerEmail === previousEmail || providerEmail === email;
      });

      if (accountIndex === -1) {
        providerList.unshift({
          ...nextUser,
          password: '',
          role: 'provider'
        });
      } else {
        providerList[accountIndex] = {
          ...providerList[accountIndex],
          ...nextUser,
          role: 'provider'
        };
      }

      if (typeof saveProviderUsers === 'function') {
        saveProviderUsers(providerList);
      } else if (typeof writeStorageJSON === 'function') {
        writeStorageJSON('sh_providers_list', providerList);
      }

      if (previousEmail && previousEmail !== email) {
        const syncedServices = allServices.map((service) => (
          normalizeEmail(service.providerEmail) === previousEmail
            ? normalizeServiceRecord({ ...service, providerEmail: email })
            : normalizeServiceRecord(service)
        ));
        const syncedJobs = allJobs.map((job) => (
          normalizeEmail(job.providerEmail) === previousEmail
            ? normalizeJobRecord({ ...job, providerEmail: email })
            : normalizeJobRecord(job)
        ));
        const existingDisputes = typeof readStorageJSON === 'function'
          ? readStorageJSON('sh_disputes', [])
          : [];
        const syncedDisputes = (Array.isArray(existingDisputes) ? existingDisputes : []).map((dispute) => (
          normalizeEmail(dispute.providerEmail) === previousEmail
            ? normalizeDisputeRecord({ ...dispute, providerEmail: email })
            : normalizeDisputeRecord(dispute)
        ));

        allServices = syncedServices;
        allJobs = syncedJobs;
        saveServicesCollection(syncedServices);
        saveJobsCollection(syncedJobs);
        saveDisputesCollection(syncedDisputes);
      }

      const persistedUser = typeof persistProviderSession === 'function'
        ? persistProviderSession(nextUser)
        : nextUser;

      refreshActiveIdentity({ ...nextUser, ...persistedUser });

      const headerName = document.getElementById('headerProviderName');
      const headerEmail = document.getElementById('headerProviderEmail');
      const dropdownName = document.getElementById('dropdownProfileName');
      const navbarAvatar = document.querySelector('.navbar__avatar');

      if (headerName) headerName.textContent = nextUser.name;
      if (headerEmail) headerEmail.textContent = nextUser.email;
      if (dropdownName) dropdownName.textContent = nextUser.name;
      if (navbarAvatar) navbarAvatar.src = getProviderAvatarSource(nextUser);

      refreshProviderCollections();
      if (photoInput) photoInput.value = '';
      showToast('Profile saved successfully.', 'success');
    });
  }

  /* ── 6. Services Page: Toggle & Delete ── */
  document.querySelectorAll('.status-toggle').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const card = this.closest('.service-card');
      const label = this.closest('.toggle-wrapper').querySelector('.toggle-label');
      if(this.checked) {
        card.classList.remove('service-card--paused');
        label.textContent = 'Active';
        label.className = 'toggle-label status-text-active';
      } else {
        card.classList.add('service-card--paused');
        label.textContent = 'Paused';
        label.className = 'toggle-label status-text-paused';
      }
    });
  });

  document.querySelectorAll('.delete-service-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const card = this.closest('.service-card');
      const title = card.querySelector('.service-title').textContent;
      if(confirm(`Delete "${title}"? This cannot be undone.`)) {
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
      }
    });
  });

  /* ── 7. Drag & Drop File Uploads ── */
  function setupDragDrop(zoneId, inputId, textId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        updateText(e.dataTransfer.files);
      }
    });
    input.addEventListener('change', () => updateText(input.files));

    function updateText(files) {
      const txt = document.getElementById(textId) || zone.querySelector('strong');
      if (txt) txt.textContent = files.length === 1 ? `Selected: ${files[0].name}` : `${files.length} files selected`;
    }
  }

  setupDragDrop('dropZone', 'serviceImageInput', 'editUploadText');
  setupDragDrop('editDropZone', 'editImageInput', 'editUploadText');
  setupDragDrop('statusDropZone', 'statusImageInput', 'statusUploadText');
  setupDragDrop('evidenceDropZone', 'evidenceFileInput', 'evidenceUploadText');

  /* ── 8. Dynamic Data Rendering (Step 2) ── */
  let { allServices, visibleServices, allJobs, visibleJobs } = getProviderCollections(activeEmail);

  function refreshProviderCollections() {
    ({ allServices, visibleServices, allJobs, visibleJobs } = getProviderCollections(activeEmail));
  }

  function updateJobById(jobId, updater) {
    const jobIndex = allJobs.findIndex((job) => job.id === jobId);
    if (jobIndex === -1) return null;

    const currentJob = normalizeJobRecord(allJobs[jobIndex]);
    const nextJob = normalizeJobRecord(
      typeof updater === 'function'
        ? updater({ ...currentJob })
        : { ...currentJob, ...updater }
    );

    allJobs[jobIndex] = nextJob;
    saveJobsCollection(allJobs);
    refreshProviderCollections();
    return nextJob;
  }

  function updateServiceById(serviceId, updater) {
    const serviceIndex = allServices.findIndex((service) => service.id === serviceId);
    if (serviceIndex === -1) return null;

    const currentService = normalizeServiceRecord(allServices[serviceIndex]);
    const nextService = normalizeServiceRecord(
      typeof updater === 'function'
        ? updater({ ...currentService })
        : { ...currentService, ...updater }
    );

    allServices[serviceIndex] = nextService;
    saveServicesCollection(allServices);
    refreshProviderCollections();
    return nextService;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
      if (!file) {
        resolve('');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => resolve(String(event.target && event.target.result ? event.target.result : ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  function createTimelineMarkup(job) {
    const stage = job.progressStage || 'pending';
    const stages = [
      {
        key: 'accepted',
        icon: 'fa-check',
        title: 'Job Accepted',
        description: 'You accepted this service request'
      },
      {
        key: 'en_route',
        icon: 'fa-car',
        title: 'Provider On The Way',
        description: 'En route to the customer location'
      },
      {
        key: 'arrived',
        icon: 'fa-location-dot',
        title: 'Arrived On Site',
        description: 'You have arrived at the service location'
      },
      {
        key: 'in_progress',
        icon: 'fa-screwdriver-wrench',
        title: 'Service In Progress',
        description: 'Work is currently underway'
      },
      {
        key: 'completed',
        icon: 'fa-circle-check',
        title: 'Service Completed',
        description: 'This job has been completed'
      }
    ];

    const stageOrder = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
    const currentIndex = stageOrder.indexOf(stage);
    const activeIndex = currentIndex === -1
      ? (job.status === 'completed' ? stageOrder.indexOf('completed') : stageOrder.indexOf('pending'))
      : currentIndex;

    return stages.map((item) => {
      const itemIndex = stageOrder.indexOf(item.key);
      let className = 'pending';
      if (itemIndex < activeIndex) className = 'completed';
      if (itemIndex === activeIndex && stage !== 'completed') className = 'active';
      if (stage === 'completed') className = 'completed';

      const matchingUpdate = job.statusUpdates.find((update) => update.stage === item.key);
      const timeLabel = matchingUpdate
        ? new Date(matchingUpdate.updatedAt).toLocaleString()
        : (item.key === 'accepted' && job.date ? `${job.date}${job.time ? ` • ${job.time}` : ''}` : '');

      const description = matchingUpdate && matchingUpdate.notes
        ? matchingUpdate.notes
        : item.description;

      return `
        <div class="timeline-item ${className}">
          <div class="timeline-icon"><i class="fa-solid ${item.icon}"></i></div>
          <div class="timeline-content">
            <h4>${item.title}</h4>
            <p>${description}</p>
            ${timeLabel ? `<span class="timeline-time">${timeLabel}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── 8B. Profile Page Auto-Populate ── */
  if (window.location.pathname.includes('profile.html') && activeUser) {
    populateProfileForm(activeUser);
  }

  if (activeUser) {
    const headerName = document.getElementById('headerProviderName');
    const headerEmail = document.getElementById('headerProviderEmail');
    const dropdownName = document.getElementById('dropdownProfileName');
    if (headerName) headerName.textContent = activeUser.name;
    if (dropdownName) dropdownName.textContent = activeUser.name;
    if (headerEmail) headerEmail.textContent = activeUser.email;

    const profileImg = document.querySelector('.navbar__avatar');
    if (profileImg) {
      profileImg.src = getProviderAvatarSource(activeUser);
    }
  }

  const statServices = document.getElementById('statTotalServices');
  if (statServices) animateValue(statServices, visibleServices.length, false);

  const statJobs = document.getElementById('statActiveJobs');
  if (statJobs) {
    const activeJobCount = visibleJobs.filter((job) => ['pending', 'active', 'progress'].includes(job.status)).length;
    animateValue(statJobs, activeJobCount, false);
  }

  const statWalletBalance = document.getElementById('statWalletBalance');
  if (statWalletBalance) animateValue(statWalletBalance, Number(activeUser && activeUser.walletBalance) || 0, true);

  const recentJobsList = document.getElementById('recentJobsList');
  if (recentJobsList) {
    const dashboardJobs = visibleJobs.slice(0, 4);
    recentJobsList.innerHTML = '';

    if (!dashboardJobs.length) {
      recentJobsList.innerHTML = `
        <div style="padding: 12px 0; color: var(--text-soft); text-align: center;">
          No job requests yet. New bookings will show up here.
        </div>
      `;
    } else {
      dashboardJobs.forEach((job) => {
        const statusClass = `status--${formatJobBadgeClass(job.status)}`;
        const actionUrl = job.status === 'pending'
          ? buildProviderUrl('job-details.html', job.id)
          : buildProviderUrl('track-status.html', job.id);
        const actionLabel = job.status === 'pending' ? 'View' : 'Track';

        recentJobsList.innerHTML += `
          <div class="job-item">
            <div class="job-item__customer">
              <img src="${job.customerAvatar}" alt="${job.customerName}"/>
              <div><span class="job-item__name">${job.customerName}</span><span class="job-item__service">${job.service}</span></div>
            </div>
            <div class="job-item__meta">
              <div class="job-item__date"><span class="meta-label">Date</span><span>${job.date}</span></div>
              <span class="status ${statusClass}">${formatStatusLabel(job.status)}</span>
              <a href="${actionUrl}" class="btn btn--primary btn--sm">${actionLabel}</a>
            </div>
          </div>
        `;
      });
    }
  }

  const jobsGrid = document.querySelector('.jobs-grid');
  if (jobsGrid && window.location.pathname.includes('jobs.html')) {
    let currentFilter = 'all';
    let currentJobsPage = 1;
    const jobsPagination = document.getElementById('jobsPagination') || document.querySelector('.pagination');
    const jobsShowingText = document.getElementById('jobsShowingText');

    function renderJobs() {
      const filteredJobs = visibleJobs.filter((job) => {
        if (currentFilter === 'pending') return job.status === 'pending';
        if (currentFilter === 'active') return ['active', 'progress'].includes(job.status);
        if (currentFilter === 'completed') return job.status === 'completed';
        return true;
      });
      const paginationState = getPaginationState(filteredJobs, currentJobsPage, 6);
      currentJobsPage = paginationState.currentPage;

      jobsGrid.innerHTML = '';

      if (!filteredJobs.length) {
        jobsGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-soft);">
            <i class="fa-solid fa-briefcase" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <h3>No ${currentFilter === 'all' ? 'matching' : currentFilter} jobs yet</h3>
            <p>Customer requests will appear here as they are assigned to you.</p>
          </div>
        `;
        renderPaginationControls(jobsPagination, 1, 1, () => {});
        updateShowingText(jobsShowingText, 0, 0, 0, 'jobs');
      } else {
        paginationState.items.forEach((job) => {
          const isPending = job.status === 'pending';
          const isCompleted = job.status === 'completed';
          const statusClass = isPending ? 'job-status--pending' : (isCompleted ? 'job-status--completed' : 'job-status--progress');
          const statusText = isPending ? 'Pending' : (isCompleted ? 'Completed' : 'In Progress');
          const primaryAction = isCompleted
            ? `<button class="btn btn--readonly btn--job-action" disabled>Completed</button>`
            : (isPending
              ? `<button class="btn btn--primary btn--job-action accept-job-btn" data-id="${job.id}">Accept Job</button>`
              : `<a href="${buildProviderUrl('update-status.html', job.id)}" class="btn btn--primary btn--job-action">Update Status</a>`);

          jobsGrid.innerHTML += `
            <div class="job-card">
              <div class="job-card__header">
                <div class="job-customer">
                  <img src="${job.customerAvatar}" alt="Customer" />
                  <div class="job-customer-info">
                    <h3>${job.customerName}</h3>
                    <span>Customer</span>
                  </div>
                </div>
                <span class="job-status ${statusClass}">${statusText}</span>
              </div>
              <div class="job-details-list">
                <div class="job-detail-item"><i class="fa-solid fa-wrench"></i> ${job.service}</div>
                <div class="job-detail-item"><i class="fa-regular fa-calendar"></i> ${job.date}</div>
                <div class="job-detail-item"><i class="fa-solid fa-location-dot"></i> ${job.location}</div>
              </div>
              <div class="job-actions">
                ${primaryAction}
                <a href="${buildProviderUrl('job-details.html', job.id)}" class="btn btn--outline">View Details</a>
              </div>
            </div>
          `;
        });

        renderPaginationControls(jobsPagination, paginationState.currentPage, paginationState.totalPages, (page) => {
          currentJobsPage = page;
          renderJobs();
        });
        updateShowingText(jobsShowingText, paginationState.startIndex, paginationState.endIndex, paginationState.totalItems, 'jobs');
      }

      const tabsContainer = document.querySelector('.jobs-tabs');
      if (tabsContainer) {
        const allCount = visibleJobs.length;
        const pendingCount = visibleJobs.filter((job) => job.status === 'pending').length;
        const progressCount = visibleJobs.filter((job) => ['active', 'progress'].includes(job.status)).length;
        const completedCount = visibleJobs.filter((job) => job.status === 'completed').length;

        tabsContainer.innerHTML = `
          <div class="job-tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all" style="cursor:pointer;">All Jobs (${allCount})</div>
          <div class="job-tab ${currentFilter === 'pending' ? 'active' : ''}" data-filter="pending" style="cursor:pointer;">Pending (${pendingCount})</div>
          <div class="job-tab ${currentFilter === 'active' ? 'active' : ''}" data-filter="active" style="cursor:pointer;">In Progress (${progressCount})</div>
          <div class="job-tab ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed" style="cursor:pointer;">Completed (${completedCount})</div>
        `;
      }
    }

    renderJobs();

    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.job-tab');
      if (tab) {
        currentFilter = tab.getAttribute('data-filter') || 'all';
        currentJobsPage = 1;
        renderJobs();
        return;
      }

      const acceptBtn = e.target.closest('.accept-job-btn');
      if (acceptBtn) {
        const jobId = acceptBtn.getAttribute('data-id');
        const updatedJob = updateJobById(jobId, (job) => ({
          ...job,
          status: 'active',
          progressStage: 'accepted',
          statusUpdates: [...job.statusUpdates, createStatusUpdate('accepted', 'Job accepted by provider.', [])]
        }));

        if (updatedJob) {
          showToast(`${updatedJob.service} accepted.`, 'success');
          renderJobs();
        }
      }
    });
  }

  const servicesGrid = document.querySelector('.services-grid');
  if (servicesGrid && window.location.pathname.includes('services.html')) {
    const serviceSearchInput = document.getElementById('serviceSearch');
    const filterSelects = document.querySelectorAll('.filter-select');
    const categoryFilter = filterSelects[0] || null;
    const statusFilter = filterSelects[1] || null;

    function renderServices() {
      const searchValue = serviceSearchInput ? serviceSearchInput.value.trim().toLowerCase() : '';
      const categoryValue = categoryFilter ? categoryFilter.value : 'all';
      const statusValue = statusFilter ? statusFilter.value : 'all';

      const filteredServices = visibleServices.filter((service) => {
        const matchesSearch = !searchValue
          || service.name.toLowerCase().includes(searchValue)
          || service.description.toLowerCase().includes(searchValue)
          || service.category.toLowerCase().includes(searchValue);
        const matchesCategory = !categoryValue || categoryValue === 'all'
          || service.category.toLowerCase() === categoryValue.toLowerCase();
        const matchesStatus = !statusValue || statusValue === 'all' || service.status === statusValue;
        return matchesSearch && matchesCategory && matchesStatus;
      });

      servicesGrid.innerHTML = '';

      if (!filteredServices.length) {
        servicesGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-soft);">
            <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <h3>No services match these filters</h3>
            <p>Try a different keyword or filter, or add a new service.</p>
          </div>
        `;
        return;
      }

      filteredServices.forEach((service) => {
        const isPaused = service.status === 'paused';
        servicesGrid.innerHTML += `
          <div class="service-card ${isPaused ? 'service-card--paused' : ''}" data-id="${service.id}">
            <div class="service-card__image">
              <span class="service-badge">${service.category}</span>
              <img src="${service.image}" alt="${service.name}" />
            </div>
            <div class="service-card__body">
              <div class="service-card__header">
                <h3 class="service-title">${service.name}</h3>
                <div class="service-price">$${service.price.toFixed(2)}</div>
              </div>
              <p class="service-desc">${service.description}</p>
              <div class="service-card__meta">
                <div class="meta-item"><i class="fa-regular fa-clock"></i> ${service.duration}</div>
                <div class="meta-item"><i class="fa-solid fa-layer-group"></i> ${service.category}</div>
              </div>
            </div>
            <div class="service-card__actions">
              <div class="toggle-wrapper">
                <label class="switch">
                  <input type="checkbox" class="status-toggle" data-id="${service.id}" ${!isPaused ? 'checked' : ''}>
                  <span class="slider round"></span>
                </label>
                <span class="toggle-label ${!isPaused ? 'status-text-active' : 'status-text-paused'}">${!isPaused ? 'Active' : 'Paused'}</span>
              </div>
              <div class="action-buttons">
                <a href="${buildProviderUrl('edit-service.html', service.id)}" class="btn-icon" title="Edit Service"><i class="fa-regular fa-pen-to-square"></i></a>
                <button class="btn-icon btn-icon--danger delete-service-btn" data-id="${service.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        `;
      });
    }

    renderServices();

    if (serviceSearchInput) serviceSearchInput.addEventListener('input', renderServices);
    if (categoryFilter) categoryFilter.addEventListener('change', renderServices);
    if (statusFilter) statusFilter.addEventListener('change', renderServices);

    document.addEventListener('change', (e) => {
      const toggle = e.target.closest('.status-toggle');
      if (!toggle) return;

      const serviceId = toggle.getAttribute('data-id');
      const nextStatus = toggle.checked ? 'active' : 'paused';
      const updatedService = updateServiceById(serviceId, { status: nextStatus });
      if (updatedService) {
        showToast(`${updatedService.name} is now ${nextStatus}.`, 'success');
        renderServices();
      }
    });

    document.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-service-btn');
      if (!deleteBtn) return;
      e.preventDefault();

      const serviceId = deleteBtn.getAttribute('data-id');
      const service = allServices.find((entry) => entry.id === serviceId);
      if (!service) return;

      if (confirm(`Delete "${service.name}"? This cannot be undone.`)) {
        allServices = allServices.filter((entry) => entry.id !== serviceId);
        saveServicesCollection(allServices);
        refreshProviderCollections();
        renderServices();
        showToast(`${service.name} deleted.`, 'success');
      }
    });
  }

  function serviceNameExists(name, excludeId = '') {
    const normalizedName = normalizeTextValue(name).toLowerCase();
    if (!normalizedName) return false;

    return visibleServices.some((service) => (
      service.id !== excludeId
      && normalizeTextValue(service.name).toLowerCase() === normalizedName
    ));
  }

  const saveServiceBtn = document.getElementById('saveServiceBtn');
  if (saveServiceBtn) {
    saveServiceBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('serviceName');
      const categoryInput = document.getElementById('serviceCategory');
      const priceInput = document.getElementById('servicePrice');
      const durationInput = document.getElementById('serviceDuration');
      const descInput = document.getElementById('serviceDesc');
      const imageInput = document.getElementById('serviceImageInput');

      const serviceName = nameInput ? nameInput.value.trim() : '';
      const category = categoryInput ? categoryInput.value.trim() : '';
      const price = priceInput ? Number(priceInput.value) : 0;
      const duration = durationInput ? durationInput.value.trim() : '';
      const description = descInput ? descInput.value.trim() : '';

      if (!serviceName) {
        showToast('Please provide a service name.', 'error');
        if (nameInput) nameInput.focus();
        return;
      }
      if (serviceName.length < 3 || serviceName.length > 80) {
        showToast('Service name must be between 3 and 80 characters.', 'error');
        if (nameInput) nameInput.focus();
        return;
      }
      if (serviceNameExists(serviceName)) {
        showToast('You already have a service with this name.', 'error');
        if (nameInput) nameInput.focus();
        return;
      }
      if (!category) {
        showToast('Please choose a service category.', 'error');
        if (categoryInput) categoryInput.focus();
        return;
      }
      if (!Number.isFinite(price) || price <= 0) {
        showToast('Please enter a valid service price greater than 0.', 'error');
        if (priceInput) priceInput.focus();
        return;
      }
      if (!duration) {
        showToast('Please select an estimated duration.', 'error');
        if (durationInput) durationInput.focus();
        return;
      }
      if (description.length < 20) {
        showToast('Service description must be at least 20 characters long.', 'error');
        if (descInput) descInput.focus();
        return;
      }
      if (description.length > 500) {
        showToast('Service description must be 500 characters or fewer.', 'error');
        if (descInput) descInput.focus();
        return;
      }

      const imageValidation = validateFileList(imageInput && imageInput.files ? imageInput.files : [], {
        allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        maxSizeMB: 10,
        maxFiles: 1,
        invalidTypeMessage: 'Please upload a JPG, PNG, GIF, or WebP service image.'
      });
      if (!imageValidation.valid) {
        showToast(imageValidation.message, 'error');
        if (imageInput) imageInput.focus();
        return;
      }

      const uploadedImage = imageInput && imageInput.files && imageInput.files[0]
        ? await readFileAsDataUrl(imageInput.files[0])
        : '';

      const newService = normalizeServiceRecord({
        id: 's' + Date.now(),
        providerEmail: activeUser ? activeUser.email : 'unknown',
        name: serviceName,
        category,
        price,
        duration,
        description,
        status: 'active',
        image: uploadedImage
      });

      allServices.unshift(newService);
      saveServicesCollection(allServices);
      refreshProviderCollections();
      setProviderFlash('Service added successfully.', 'success');
      window.location.href = buildProviderUrl('services.html');
    });
  }

  const editServiceNameInput = document.getElementById('editServiceName');
  if (editServiceNameInput && window.location.pathname.includes('edit-service.html')) {
    const selectedServiceId = getQueryParam('id');
    const selectedService = (selectedServiceId && visibleServices.find((service) => service.id === selectedServiceId))
      || visibleServices[0]
      || null;

    const categoryInput = document.getElementById('editServiceCategory');
    const priceInput = document.getElementById('editServicePrice');
    const durationInput = document.getElementById('editServiceDuration');
    const descInput = document.getElementById('editServiceDesc');
    const statusToggle = document.getElementById('editStatusToggle');
    const statusLabel = document.getElementById('editStatusLabel');
    const currentImage = document.getElementById('currentServiceImage');
    const currentImageName = document.getElementById('currentImageName');
    const currentImageMeta = document.getElementById('currentImageMeta');
    const replaceImageBtn = document.getElementById('replaceImageBtn');
    const editDropZone = document.getElementById('editDropZone');
    const editImageInput = document.getElementById('editImageInput');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const deleteServiceBtn = document.getElementById('deleteServiceBtn');

    if (!selectedService) {
      showToast('No service found to edit.', 'error');
      window.setTimeout(() => {
        window.location.href = 'services.html';
      }, 900);
    } else {
      editServiceNameInput.value = selectedService.name;
      if (categoryInput) categoryInput.value = selectedService.category;
      if (priceInput) priceInput.value = selectedService.price.toFixed(2);
      if (durationInput) durationInput.value = selectedService.duration;
      if (descInput) descInput.value = selectedService.description;
      if (statusToggle) statusToggle.checked = selectedService.status !== 'paused';
      if (statusLabel) {
        statusLabel.textContent = selectedService.status === 'paused' ? 'Paused' : 'Active';
        statusLabel.className = `toggle-label ${selectedService.status === 'paused' ? 'status-text-paused' : 'status-text-active'}`;
      }
      if (currentImage) currentImage.src = selectedService.image;
      if (currentImageName) currentImageName.textContent = `${selectedService.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      if (currentImageMeta) currentImageMeta.textContent = `Category: ${selectedService.category}`;

      if (replaceImageBtn && editDropZone) {
        replaceImageBtn.addEventListener('click', (event) => {
          event.preventDefault();
          editDropZone.style.display = 'flex';
          if (editImageInput) editImageInput.click();
        });
      }

      if (editImageInput && currentImage) {
        editImageInput.addEventListener('change', () => {
          const file = editImageInput.files && editImageInput.files[0];
          if (!file) return;

          const imageValidation = validateFileList([file], {
            allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            maxSizeMB: 10,
            maxFiles: 1,
            invalidTypeMessage: 'Please upload a JPG, PNG, GIF, or WebP service image.'
          });
          if (!imageValidation.valid) {
            showToast(imageValidation.message, 'error');
            editImageInput.value = '';
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            currentImage.src = String(event.target && event.target.result ? event.target.result : currentImage.src);
          };
          reader.readAsDataURL(file);
          if (currentImageName) currentImageName.textContent = file.name;
          if (currentImageMeta) currentImageMeta.textContent = `Ready to save replacement image`;
        });
      }

      if (statusToggle && statusLabel) {
        statusToggle.addEventListener('change', () => {
          const isActive = statusToggle.checked;
          statusLabel.textContent = isActive ? 'Active' : 'Paused';
          statusLabel.className = `toggle-label ${isActive ? 'status-text-active' : 'status-text-paused'}`;
        });
      }

      if (saveEditBtn) {
        saveEditBtn.addEventListener('click', async (event) => {
          event.preventDefault();

          const nextName = editServiceNameInput.value.trim();
          const nextCategory = categoryInput ? categoryInput.value.trim() : '';
          const nextPrice = priceInput ? Number(priceInput.value) : 0;
          const nextDuration = durationInput ? durationInput.value.trim() : '';
          const nextDescription = descInput ? descInput.value.trim() : '';

          if (!nextName) {
            showToast('Please provide a service name.', 'error');
            editServiceNameInput.focus();
            return;
          }
          if (nextName.length < 3 || nextName.length > 80) {
            showToast('Service name must be between 3 and 80 characters.', 'error');
            editServiceNameInput.focus();
            return;
          }
          if (serviceNameExists(nextName, selectedService.id)) {
            showToast('You already have another service with this name.', 'error');
            editServiceNameInput.focus();
            return;
          }
          if (!nextCategory) {
            showToast('Please choose a service category.', 'error');
            if (categoryInput) categoryInput.focus();
            return;
          }
          if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
            showToast('Please enter a valid service price.', 'error');
            if (priceInput) priceInput.focus();
            return;
          }
          if (!nextDuration) {
            showToast('Please select a duration.', 'error');
            if (durationInput) durationInput.focus();
            return;
          }
          if (nextDescription.length < 20) {
            showToast('Service description must be at least 20 characters long.', 'error');
            if (descInput) descInput.focus();
            return;
          }
          if (nextDescription.length > 500) {
            showToast('Service description must be 500 characters or fewer.', 'error');
            if (descInput) descInput.focus();
            return;
          }

          let nextImage = selectedService.image;
          const replacementFile = editImageInput && editImageInput.files && editImageInput.files[0]
            ? editImageInput.files[0]
            : null;
          if (replacementFile) {
            const imageValidation = validateFileList([replacementFile], {
              allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
              allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
              maxSizeMB: 10,
              maxFiles: 1,
              invalidTypeMessage: 'Please upload a JPG, PNG, GIF, or WebP service image.'
            });
            if (!imageValidation.valid) {
              showToast(imageValidation.message, 'error');
              if (editImageInput) editImageInput.focus();
              return;
            }
            nextImage = await readFileAsDataUrl(replacementFile) || nextImage;
          }

          const updatedService = updateServiceById(selectedService.id, {
            name: nextName,
            category: nextCategory,
            price: nextPrice,
            duration: nextDuration,
            description: nextDescription,
            image: nextImage,
            status: statusToggle && !statusToggle.checked ? 'paused' : 'active'
          });

          if (updatedService) {
            setProviderFlash('Service updated successfully.', 'success');
            window.location.href = 'services.html';
          }
        });
      }

      if (deleteServiceBtn) {
        deleteServiceBtn.addEventListener('click', (event) => {
          event.preventDefault();
          if (!confirm(`Delete "${selectedService.name}"? This cannot be undone.`)) return;

          allServices = allServices.filter((service) => service.id !== selectedService.id);
          saveServicesCollection(allServices);
          refreshProviderCollections();
          setProviderFlash(`${selectedService.name} deleted.`, 'success');
          window.location.href = 'services.html';
        });
      }
    }
  }

  const detailJobId = document.getElementById('detailJobId');
  if (detailJobId && window.location.pathname.includes('job-details.html')) {
    const selectedJobId = getQueryParam('id');
    let selectedJob = (selectedJobId && visibleJobs.find((job) => job.id === selectedJobId)) || visibleJobs[0] || null;

    if (!selectedJob) {
      showToast('No job details are available right now.', 'error');
      window.setTimeout(() => {
        window.location.href = 'jobs.html';
      }, 900);
    } else {
      const detailJobStatus = document.getElementById('detailJobStatus');
      const detailServiceType = document.getElementById('detailServiceType');
      const detailJobDate = document.getElementById('detailJobDate');
      const detailJobTime = document.getElementById('detailJobTime');
      const detailJobLocation = document.getElementById('detailJobLocation');
      const detailCustomerAvatar = document.getElementById('detailCustomerAvatar');
      const detailCustomerName = document.getElementById('detailCustomerName');
      const detailCustomerPhone = document.getElementById('detailCustomerPhone');
      const detailCustomerAddress = document.getElementById('detailCustomerAddress');
      const detailJobDescription = document.getElementById('detailJobDescription');
      const acceptJobBtn = document.getElementById('acceptJobBtn');
      const startJobBtn = document.getElementById('startJobBtn');
      const completeJobBtn = document.getElementById('completeJobBtn');

      const renderSelectedJob = () => {
        selectedJob = normalizeJobRecord((selectedJobId && visibleJobs.find((job) => job.id === selectedJob.id)) || selectedJob);
        detailJobId.textContent = `#${selectedJob.id}`;
        if (detailJobStatus) {
          detailJobStatus.textContent = formatStatusLabel(selectedJob.status);
          detailJobStatus.className = selectedJob.status === 'completed'
            ? 'status-text-active'
            : (selectedJob.status === 'pending' ? 'status-text-paused' : 'status-text-active');
          detailJobStatus.style.fontSize = '0.75rem';
        }
        if (detailServiceType) detailServiceType.textContent = selectedJob.service;
        if (detailJobDate) detailJobDate.textContent = selectedJob.date;
        if (detailJobTime) detailJobTime.textContent = selectedJob.time;
        if (detailJobLocation) detailJobLocation.textContent = selectedJob.location;
        if (detailCustomerAvatar) {
          detailCustomerAvatar.src = selectedJob.customerAvatar;
          detailCustomerAvatar.alt = selectedJob.customerName;
        }
        if (detailCustomerName) detailCustomerName.textContent = selectedJob.customerName;
        if (detailCustomerPhone) detailCustomerPhone.innerHTML = `<i class="fa-solid fa-phone text-primary"></i> ${selectedJob.customerPhone}`;
        if (detailCustomerAddress) {
          detailCustomerAddress.innerHTML = `
            <i class="fa-solid fa-location-dot text-primary" style="margin-top: 4px;"></i>
            <span>${selectedJob.address}</span>
          `;
        }
        if (detailJobDescription) detailJobDescription.textContent = selectedJob.description;

        if (acceptJobBtn) acceptJobBtn.disabled = selectedJob.status !== 'pending';
        if (completeJobBtn) completeJobBtn.disabled = selectedJob.status === 'completed';
        if (startJobBtn) startJobBtn.disabled = selectedJob.status === 'pending';
      };

      renderSelectedJob();

      if (acceptJobBtn) {
        acceptJobBtn.addEventListener('click', () => {
          const updatedJob = updateJobById(selectedJob.id, (job) => ({
            ...job,
            status: 'active',
            progressStage: 'accepted',
            statusUpdates: [...job.statusUpdates, createStatusUpdate('accepted', 'Job accepted by provider.', [])]
          }));
          if (!updatedJob) return;
          selectedJob = updatedJob;
          renderSelectedJob();
          showToast('Job accepted successfully.', 'success');
        });
      }

      if (startJobBtn) {
        startJobBtn.addEventListener('click', () => {
          window.location.href = buildProviderUrl('track-status.html', selectedJob.id);
        });
      }

      if (completeJobBtn) {
        completeJobBtn.addEventListener('click', () => {
          const updatedJob = updateJobById(selectedJob.id, (job) => ({
            ...job,
            status: 'completed',
            progressStage: 'completed',
            statusUpdates: [...job.statusUpdates, createStatusUpdate('completed', 'Job marked as completed.', [])]
          }));
          if (!updatedJob) return;
          selectedJob = updatedJob;
          renderSelectedJob();
          showToast('Job marked as completed.', 'success');
        });
      }
    }
  }

  const trackJobId = document.getElementById('trackJobId');
  if (trackJobId && window.location.pathname.includes('track-status.html')) {
    const selectedJobId = getQueryParam('id');
    let selectedJob = (selectedJobId && visibleJobs.find((job) => job.id === selectedJobId)) || visibleJobs[0] || null;

    if (!selectedJob) {
      showToast('No job found to track.', 'error');
      window.setTimeout(() => {
        window.location.href = 'jobs.html';
      }, 900);
    } else {
      const trackServiceName = document.getElementById('trackServiceName');
      const trackCustomerName = document.getElementById('trackCustomerName');
      const trackJobLocation = document.getElementById('trackJobLocation');
      const trackJobDate = document.getElementById('trackJobDate');
      const trackJobTime = document.getElementById('trackJobTime');
      const trackTimeline = document.getElementById('trackTimeline');
      const trackStartServiceBtn = document.getElementById('trackStartServiceBtn');
      const trackUpdateStatusBtn = document.getElementById('trackUpdateStatusBtn');
      const trackCompleteJobBtn = document.getElementById('trackCompleteJobBtn');
      const trackCallCustomerBtn = document.getElementById('trackCallCustomerBtn');
      const trackMessageCustomerBtn = document.getElementById('trackMessageCustomerBtn');
      const trackReportIssueBtn = document.getElementById('trackReportIssueBtn');

      const renderTrackPage = () => {
        selectedJob = normalizeJobRecord((selectedJobId && visibleJobs.find((job) => job.id === selectedJob.id)) || selectedJob);
        trackJobId.textContent = `#${selectedJob.id}`;
        if (trackServiceName) trackServiceName.textContent = selectedJob.service;
        if (trackCustomerName) trackCustomerName.textContent = selectedJob.customerName;
        if (trackJobLocation) trackJobLocation.textContent = selectedJob.location;
        if (trackJobDate) trackJobDate.textContent = selectedJob.date;
        if (trackJobTime) trackJobTime.textContent = selectedJob.time;
        if (trackTimeline) trackTimeline.innerHTML = createTimelineMarkup(selectedJob);

        const jobIsPending = selectedJob.status === 'pending';
        const jobIsCompleted = selectedJob.status === 'completed';
        if (trackStartServiceBtn) trackStartServiceBtn.disabled = jobIsPending || jobIsCompleted;
        if (trackUpdateStatusBtn) trackUpdateStatusBtn.disabled = jobIsPending || jobIsCompleted;
        if (trackCompleteJobBtn) trackCompleteJobBtn.disabled = jobIsPending || jobIsCompleted;
      };

      renderTrackPage();

      if (trackStartServiceBtn) {
        trackStartServiceBtn.addEventListener('click', () => {
          const updatedJob = updateJobById(selectedJob.id, (job) => ({
            ...job,
            status: 'progress',
            progressStage: 'in_progress',
            statusUpdates: [...job.statusUpdates, createStatusUpdate('in_progress', 'Service started.', [])]
          }));
          if (!updatedJob) return;
          selectedJob = updatedJob;
          renderTrackPage();
          showToast('Service marked as in progress.', 'success');
        });
      }

      if (trackUpdateStatusBtn) {
        trackUpdateStatusBtn.addEventListener('click', () => {
          window.location.href = buildProviderUrl('update-status.html', selectedJob.id);
        });
      }

      if (trackCompleteJobBtn) {
        trackCompleteJobBtn.addEventListener('click', () => {
          const updatedJob = updateJobById(selectedJob.id, (job) => ({
            ...job,
            status: 'completed',
            progressStage: 'completed',
            statusUpdates: [...job.statusUpdates, createStatusUpdate('completed', 'Job completed from tracking page.', [])]
          }));
          if (!updatedJob) return;
          selectedJob = updatedJob;
          renderTrackPage();
          showToast('Job marked as completed.', 'success');
        });
      }

      if (trackCallCustomerBtn) {
        trackCallCustomerBtn.addEventListener('click', () => {
          showToast(`Call ${selectedJob.customerName} at ${selectedJob.customerPhone}`, 'info');
        });
      }

      if (trackMessageCustomerBtn) {
        trackMessageCustomerBtn.addEventListener('click', () => {
          showToast(`Messaging for ${selectedJob.customerName} will be available here next.`, 'info');
        });
      }

      if (trackReportIssueBtn) {
        trackReportIssueBtn.addEventListener('click', () => {
          window.location.href = buildProviderUrl('raise-dispute.html', selectedJob.id);
        });
      }
    }
  }

  const submitStatusBtn = document.getElementById('submitStatusBtn');
  if (submitStatusBtn && window.location.pathname.includes('update-status.html')) {
    const selectedJobId = getQueryParam('id');
    const selectedJob = (selectedJobId && visibleJobs.find((job) => job.id === selectedJobId)) || visibleJobs[0] || null;
    const statusBannerJobInfo = document.getElementById('statusBannerJobInfo');
    const statusBannerCustomerAvatar = document.getElementById('statusBannerCustomerAvatar');
    const statusBannerCustomerName = document.getElementById('statusBannerCustomerName');
    const cancelStatusUpdateBtn = document.getElementById('cancelStatusUpdateBtn');
    const notesInput = document.getElementById('statusNotes');
    const imageInput = document.getElementById('statusImageInput');

    if (!selectedJob) {
      showToast('No job found to update.', 'error');
      window.setTimeout(() => {
        window.location.href = 'jobs.html';
      }, 900);
    } else {
      if (statusBannerJobInfo) statusBannerJobInfo.textContent = `#${selectedJob.id} • ${selectedJob.service}`;
      if (statusBannerCustomerAvatar) {
        statusBannerCustomerAvatar.src = selectedJob.customerAvatar;
        statusBannerCustomerAvatar.alt = selectedJob.customerName;
      }
      if (statusBannerCustomerName) statusBannerCustomerName.textContent = selectedJob.customerName;
      if (cancelStatusUpdateBtn) {
        cancelStatusUpdateBtn.addEventListener('click', (event) => {
          event.preventDefault();
          window.location.href = buildProviderUrl('track-status.html', selectedJob.id);
        });
      }

      const currentStage = selectedJob.progressStage || 'in_progress';
      const stageToRadio = {
        accepted: 'in_progress',
        en_route: 'en_route',
        arrived: 'arrived',
        in_progress: 'in_progress',
        completed: 'completed'
      };
      const matchingRadio = document.querySelector(`input[name="job_status"][value="${stageToRadio[currentStage] || 'in_progress'}"]`);
      if (matchingRadio) matchingRadio.checked = true;
      if (notesInput) notesInput.value = selectedJob.notes || '';

      submitStatusBtn.addEventListener('click', (event) => {
        event.preventDefault();

        const selectedStatus = document.querySelector('input[name="job_status"]:checked');
        if (!selectedStatus) {
          showToast('Please choose a new status before saving.', 'error');
          return;
        }

        const statusValue = selectedStatus.value;
        const notes = notesInput ? notesInput.value.trim() : '';
        const evidenceValidation = validateFileList(imageInput && imageInput.files ? imageInput.files : [], {
          allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
          allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
          maxSizeMB: 5,
          maxFiles: 6,
          invalidTypeMessage: 'Please upload JPG, PNG, or WebP evidence images only.'
        });
        if (!evidenceValidation.valid) {
          showToast(evidenceValidation.message, 'error');
          return;
        }
        if (notes.length > 500) {
          showToast('Update notes must be 500 characters or fewer.', 'error');
          if (notesInput) notesInput.focus();
          return;
        }

        const evidence = evidenceValidation.files.map((file) => file.name);

        const stageMap = {
          en_route: { status: 'active', progressStage: 'en_route' },
          arrived: { status: 'active', progressStage: 'arrived' },
          in_progress: { status: 'progress', progressStage: 'in_progress' },
          completed: { status: 'completed', progressStage: 'completed' }
        };

        if (statusValue === (stageToRadio[currentStage] || 'in_progress') && !notes && !evidence.length) {
          showToast('Choose a new status or add notes/evidence before saving.', 'error');
          return;
        }
        if (statusValue === 'completed' && !notes && !evidence.length) {
          showToast('Add completion notes or upload at least one photo before marking the job completed.', 'error');
          return;
        }

        const nextStage = stageMap[statusValue] || stageMap.in_progress;
        const updatedJob = updateJobById(selectedJob.id, (job) => ({
          ...job,
          status: nextStage.status,
          progressStage: nextStage.progressStage,
          notes,
          statusUpdates: [...job.statusUpdates, createStatusUpdate(nextStage.progressStage, notes || `Status updated to ${formatStatusLabel(nextStage.progressStage)}.`, evidence)]
        }));

        if (!updatedJob) return;

        setProviderFlash(`Status updated for ${updatedJob.service}.`, 'success');
        window.location.href = buildProviderUrl('track-status.html', updatedJob.id);
      });
    }
  }

  const submitDisputeBtn = document.getElementById('submitDisputeBtn');
  if (submitDisputeBtn && window.location.pathname.includes('raise-dispute.html')) {
    const disputeJobIdInput = document.getElementById('disputeJobId');
    const disputeCustomerInput = document.getElementById('disputeCustomer');
    const disputeCategoryInput = document.getElementById('disputeCategory');
    const disputeDescriptionInput = document.getElementById('disputeDescription');
    const disputeEvidenceInput = document.getElementById('evidenceFileInput');
    const selectedJobId = getQueryParam('id');
    const selectedJob = selectedJobId
      ? visibleJobs.find((job) => job.id === selectedJobId)
      : null;

    if (selectedJob) {
      if (disputeJobIdInput) disputeJobIdInput.value = selectedJob.id;
      if (disputeCustomerInput) disputeCustomerInput.value = selectedJob.customerName;
    }

    submitDisputeBtn.addEventListener('click', (event) => {
      event.preventDefault();

      const rawJobId = normalizeTextValue(disputeJobIdInput && disputeJobIdInput.value).replace(/^#+/, '').toUpperCase();
      const customerName = normalizeTextValue(disputeCustomerInput && disputeCustomerInput.value);
      const issueCategory = normalizeTextValue(disputeCategoryInput && disputeCategoryInput.value);
      const description = normalizeTextValue(disputeDescriptionInput && disputeDescriptionInput.value);
      const evidenceValidation = validateFileList(disputeEvidenceInput && disputeEvidenceInput.files ? disputeEvidenceInput.files : [], {
        allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
        allowedExtensions: ['.png', '.jpg', '.jpeg', '.pdf'],
        maxSizeMB: 10,
        maxFiles: 8,
        invalidTypeMessage: 'Please upload PNG, JPG, or PDF evidence files only.'
      });

      if (!rawJobId) {
        showToast('Please enter the related job ID.', 'error');
        if (disputeJobIdInput) disputeJobIdInput.focus();
        return;
      }
      if (!/^JOB-[A-Z0-9-]+$/.test(rawJobId) && !/^[A-Z0-9-]{4,}$/.test(rawJobId)) {
        showToast('Enter a valid job ID, for example JOB-20471.', 'error');
        if (disputeJobIdInput) disputeJobIdInput.focus();
        return;
      }
      if (!customerName || customerName.length < 2 || !/^[A-Za-z]+(?:[ '.-][A-Za-z]+)*$/.test(customerName)) {
        showToast('Please enter the customer’s full name.', 'error');
        if (disputeCustomerInput) disputeCustomerInput.focus();
        return;
      }
      if (!issueCategory) {
        showToast('Please choose an issue category.', 'error');
        if (disputeCategoryInput) disputeCategoryInput.focus();
        return;
      }
      if (!description || description.length < 20) {
        showToast('Dispute description must be at least 20 characters long.', 'error');
        if (disputeDescriptionInput) disputeDescriptionInput.focus();
        return;
      }
      if (description.length > 1500) {
        showToast('Dispute description must be 1500 characters or fewer.', 'error');
        if (disputeDescriptionInput) disputeDescriptionInput.focus();
        return;
      }
      if (!evidenceValidation.valid) {
        showToast(evidenceValidation.message, 'error');
        return;
      }

      const currentDisputes = typeof readStorageJSON === 'function'
        ? readStorageJSON('sh_disputes', (typeof getDB === 'function' ? getDB('sh_disputes') : []))
        : [];
      const safeDisputes = Array.isArray(currentDisputes) ? currentDisputes.map(normalizeDisputeRecord) : [];
      const hasOpenDuplicate = safeDisputes.some((dispute) => dispute.id.toUpperCase() === rawJobId && dispute.status !== 'resolved');
      if (hasOpenDuplicate) {
        showToast('An open dispute already exists for this job ID.', 'error');
        if (disputeJobIdInput) disputeJobIdInput.focus();
        return;
      }

      const nextDispute = normalizeDisputeRecord({
        id: rawJobId,
        customerName,
        issue: issueCategory,
        description,
        status: 'pending',
        providerEmail: activeEmail || '',
        evidence: evidenceValidation.files.map((file) => file.name),
        createdAt: new Date().toISOString()
      });

      safeDisputes.unshift(nextDispute);
      saveDisputesCollection(safeDisputes);
      setProviderFlash(`Dispute submitted for ${nextDispute.id}.`, 'success');
      window.location.href = 'disputes.html';
    });
  }

  const earningsTableBody = document.querySelector('table.data-table tbody');
  if (window.location.pathname.includes('earnings.html')) {
    const completedJobs = visibleJobs.filter((job) => job.status === 'completed');
    const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.price || 150), 0);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthNames[new Date().getMonth()];
    let currentEarningsPage = 1;

    const earningTotal = document.getElementById('earningTotal');
    const earningMonth = document.getElementById('earningMonth');
    const earningJobCount = document.getElementById('earningJobCount');
    const earningMonthLabel = document.getElementById('earningMonthLabel');
    const earningsPagination = document.getElementById('earningsPagination') || document.querySelector('.pagination');
    const earningsShowingText = document.getElementById('earningsShowingText') || document.querySelector('.table-showing-text');

    if (earningTotal) animateValue(earningTotal, totalEarnings, true);
    if (earningMonth) animateValue(earningMonth, totalEarnings, true);
    if (earningJobCount) animateValue(earningJobCount, completedJobs.length, false);
    if (earningMonthLabel) earningMonthLabel.textContent = 'Earnings in ' + currentMonth;

    function renderEarningsTable() {
      if (!earningsTableBody) return;

      const paginationState = getPaginationState(completedJobs, currentEarningsPage, 5);
      currentEarningsPage = paginationState.currentPage;
      earningsTableBody.innerHTML = '';

      if (!completedJobs.length) {
        earningsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No completed transactions found.</td></tr>`;
        renderPaginationControls(earningsPagination, 1, 1, () => {});
        updateShowingText(earningsShowingText, 0, 0, 0, 'transactions');
      } else {
        paginationState.items.forEach((job) => {
          earningsTableBody.innerHTML += `
            <tr>
              <td class="job-id-cell"><a href="${buildProviderUrl('job-details.html', job.id)}">#${job.id}</a></td>
              <td>${job.service}</td>
              <td>
                <div class="table-customer">
                  <img src="${job.customerAvatar}" alt="Customer"/>
                  <span>${job.customerName}</span>
                </div>
              </td>
              <td>${job.date}</td>
              <td class="amount-cell">$${(job.price || 150).toFixed(2)}</td>
            </tr>
          `;
        });

        renderPaginationControls(earningsPagination, paginationState.currentPage, paginationState.totalPages, (page) => {
          currentEarningsPage = page;
          renderEarningsTable();
        });
        updateShowingText(earningsShowingText, paginationState.startIndex, paginationState.endIndex, paginationState.totalItems, 'transactions');
      }
    }

    renderEarningsTable();

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        let csvContent = 'data:text/csv;charset=utf-8,Job ID,Service,Customer,Date,Amount\n';
        completedJobs.forEach((job) => {
          csvContent += `#${job.id},${job.service},${job.customerName},${job.date},$${(job.price || 150).toFixed(2)}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'earnings_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }

  let disputesDB = typeof readStorageJSON === 'function'
    ? readStorageJSON('sh_disputes', (typeof getDB === 'function' ? getDB('sh_disputes') : []))
    : [];
  disputesDB = Array.isArray(disputesDB) ? disputesDB.map(normalizeDisputeRecord) : [];
  if (activeEmail) {
    disputesDB = disputesDB.filter((dispute) => !dispute.providerEmail || normalizeEmail(dispute.providerEmail) === activeEmail);
  }

  const disputesTableBody = document.querySelector('table.data-table tbody');
  if (window.location.pathname.includes('disputes.html')) {
    let currentDisputesPage = 1;
    const disputeTotal = document.getElementById('disputeTotal');
    const disputeReview = document.getElementById('disputeReview');
    const disputeResolved = document.getElementById('disputeResolved');
    const disputesPagination = document.getElementById('disputesPagination') || document.querySelector('.pagination');
    const disputesShowingText = document.getElementById('disputesShowingText') || document.querySelector('.table-showing-text');

    if (disputeTotal) animateValue(disputeTotal, disputesDB.length, false);
    if (disputeReview) animateValue(disputeReview, disputesDB.filter((dispute) => dispute.status === 'under_review').length, false);
    if (disputeResolved) animateValue(disputeResolved, disputesDB.filter((dispute) => dispute.status === 'resolved').length, false);

    function renderDisputesTable() {
      if (!disputesTableBody) return;

      const paginationState = getPaginationState(disputesDB, currentDisputesPage, 6);
      currentDisputesPage = paginationState.currentPage;
      disputesTableBody.innerHTML = '';
      if (!disputesDB.length) {
        disputesTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No open disputes found.</td></tr>`;
        renderPaginationControls(disputesPagination, 1, 1, () => {});
        updateShowingText(disputesShowingText, 0, 0, 0, 'disputes');
      } else {
        paginationState.items.forEach((dispute) => {
          const disputeDetailsUrl = buildProviderUrl('job-details.html', dispute.id);
          let statusPill = '';
          if (dispute.status === 'pending') statusPill = '<span class="status-dot-pill status-dot-pill--pending"><i></i>Pending</span>';
          else if (dispute.status === 'under_review') statusPill = '<span class="status-dot-pill status-dot-pill--review"><i></i>Under Review</span>';
          else statusPill = '<span class="status-dot-pill status-dot-pill--resolved"><i></i>Resolved</span>';

          disputesTableBody.innerHTML += `
            <tr>
              <td class="job-id-cell"><a href="${disputeDetailsUrl}">${dispute.id}</a></td>
              <td>
                <div class="table-customer">
                  <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.customerName)}&background=random" alt="Customer"/>
                  <span>${dispute.customerName}</span>
                </div>
              </td>
              <td>${dispute.issue}</td>
              <td>${statusPill}</td>
              <td><a href="${disputeDetailsUrl}" class="text-link">View Details</a></td>
            </tr>
          `;
        });

        renderPaginationControls(disputesPagination, paginationState.currentPage, paginationState.totalPages, (page) => {
          currentDisputesPage = page;
          renderDisputesTable();
        });
        updateShowingText(disputesShowingText, paginationState.startIndex, paginationState.endIndex, paginationState.totalItems, 'disputes');
      }
    }

    renderDisputesTable();

    const exportDisputesBtn = document.getElementById('exportDisputesBtn');
    if (exportDisputesBtn) {
      exportDisputesBtn.addEventListener('click', () => {
        let csvContent = 'data:text/csv;charset=utf-8,Job ID,Customer,Issue,Status\n';
        disputesDB.forEach((dispute) => {
          csvContent += `${dispute.id},${dispute.customerName},${dispute.issue},${dispute.status}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'disputes_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }

});
