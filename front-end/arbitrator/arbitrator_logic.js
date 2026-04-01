/**
 * ARBITRATOR REGISTRATION LOGIC
 *
 * NOTE: The multi-step form logic is embedded directly in each form HTML file
 * (arbitrator_form_1.html, arbitrator_form_2.html, arbitrator_form_3.html,
 * arbitrator_form_review.html) for simplicity. This file is kept for reference
 * but is not currently loaded by any page.
 */

/* ============================
   STAGE 1: Personal Information
   ============================ */
function next() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const country = document.getElementById('country').value.trim();

    if (!name || name.length < 3) {
        alert("Please enter a valid name (at least 3 characters).");
        return;
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!phone) {
        alert("Please enter your phone number.");
        return;
    }

    if (!country) {
        alert("Please select your country.");
        return;
    }

    if (window.ArbitratorData?.registration) {
        window.ArbitratorData.registration.formData.name = name;
        window.ArbitratorData.registration.formData.email = email;
        window.ArbitratorData.registration.formData.phone = phone;
        window.ArbitratorData.registration.formData.country = country;
        window.ArbitratorData.registration.formData.linkedin = document.getElementById('linkedin')?.value.trim() || '';
        window.ArbitratorData.registration.formData.title = document.getElementById('title')?.value.trim() || '';
        window.ArbitratorData.registration.lastStep = 1;
        saveData();
    }

    window.location.href = "arbitrator_form_2.html";
}

/* ============================
   STAGE 2: Professional Background
   ============================ */
function validateStage2() {
    const exp = document.getElementById('experience')?.value.trim();
    const expertise = document.getElementById('expertise')?.value.trim();
    const org = document.getElementById('organization')?.value.trim();

    if (!exp || !expertise || !org) {
        alert("Please enter all Professional Background details.");
        return;
    }

    if (window.ArbitratorData?.registration) {
        window.ArbitratorData.registration.formData.experience = exp;
        window.ArbitratorData.registration.formData.expertise = expertise;
        window.ArbitratorData.registration.formData.organization = org;
        window.ArbitratorData.registration.formData.prevExperience = document.getElementById('prevExperience')?.value.trim() || '';
        window.ArbitratorData.registration.lastStep = 2;
        saveData();
    }

    window.location.href = "arbitrator_form_3.html";
}

/* ============================
   STAGE 3: Document Upload
   ============================ */
function validateStage3() {
    window.location.href = "arbitrator_form_review.html";
}

/* ============================
   STAGE 4: Review & Submit
   ============================ */
function loadReviewData() {
    const regData = window.ArbitratorData?.registration?.formData;

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val || "N/A";
    };

    setText('rev-name', regData?.name);
    setText('rev-email', regData?.email);
    setText('rev-phone', regData?.phone);
    setText('rev-country', regData?.country);
    setText('rev-linkedin', regData?.linkedin);
    setText('rev-title', regData?.title);

    setText('rev-exp', regData?.experience);
    setText('rev-expertise', regData?.expertise);
    setText('rev-org', regData?.organization);
    setText('rev-history', regData?.prevExperience);

    if (regData?.fileName_resume) document.getElementById('rev-file-resume').innerText = regData.fileName_resume;
    if (regData?.fileName_license) document.getElementById('rev-file-license').innerText = regData.fileName_license;
}

function submitFinalApplication() {
    const isConfirmed = document.getElementById('finalConfirm')?.checked;
    if (!isConfirmed) {
        alert("Please confirm the information is accurate.");
        return;
    }

    if (window.ArbitratorData?.registration) {
        window.ArbitratorData.registration.isComplete = true;
        window.ArbitratorData.registration.lastStep = 4;
        const formData = window.ArbitratorData.registration.formData;
        window.ArbitratorData.profile.name = formData.name;
        window.ArbitratorData.profile.email = formData.email;
        window.ArbitratorData.profile.phone = formData.phone;
        window.ArbitratorData.profile.location = formData.country;
        window.ArbitratorData.profile.title = formData.title || "Senior Arbitrator";
        saveData();
    }

    window.location.href = "arbitrator_success.html";
}
