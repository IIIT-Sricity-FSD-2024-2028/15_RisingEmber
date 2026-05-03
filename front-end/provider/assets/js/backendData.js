/* =============================================
   ServiceHub – Backend API cache and LocalStorage compatibility layer
   ============================================= */

const DEFAULT_PROVIDER_EMAIL = 'paul@example.com';
const PROVIDER_SEED_VERSION_KEY = 'sh_provider_seed_version';
const PROVIDER_SEED_VERSION = '2026-04-01-provider-v4';

function buildAvatar(name, background = 'DBEAFE', color = '1E3A8A') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=${color}&size=128`;
}

function buildStatusUpdate(stage, notes, updatedAt, evidence = []) {
  return {
    stage,
    notes,
    evidence,
    updatedAt
  };
}

function buildStatusHistory(progressStage, baseISODate) {
  const stageOrder = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
  const stageNotes = {
    accepted: 'Job accepted by provider.',
    en_route: 'Provider is on the way.',
    arrived: 'Provider arrived on site.',
    in_progress: 'Service work is underway.',
    completed: 'Job completed successfully.'
  };

  const targetIndex = stageOrder.indexOf(progressStage);
  if (targetIndex === -1) return [];

  const baseDate = new Date(baseISODate);
  if (Number.isNaN(baseDate.getTime())) return [];

  return stageOrder.slice(0, targetIndex + 1).map((stage, index) => (
    buildStatusUpdate(
      stage,
      stageNotes[stage],
      new Date(baseDate.getTime() + (index * 35 * 60000)).toISOString()
    )
  ));
}

function createServiceSeed(service) {
  return {
    providerEmail: DEFAULT_PROVIDER_EMAIL,
    status: 'active',
    duration: 'Custom Quote',
    description: 'Professional home service support.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
    ...service
  };
}

function createJobSeed(job) {
  const progressStage = job.progressStage || (
    job.status === 'completed'
      ? 'completed'
      : (job.status === 'progress' ? 'in_progress' : (job.status === 'active' ? 'accepted' : 'pending'))
  );

  return {
    providerEmail: DEFAULT_PROVIDER_EMAIL,
    customerAvatar: buildAvatar(job.customerName, job.avatarBg || 'DBEAFE', job.avatarColor || '1E3A8A'),
    customerPhone: job.customerPhone || '+1 (555) 000-0000',
    address: job.address || job.location,
    progressStage,
    description: job.description || `Customer requested ${String(job.service || 'service support').toLowerCase()}.`,
    statusUpdates: Array.isArray(job.statusUpdates)
      ? job.statusUpdates
      : buildStatusHistory(progressStage, job.timelineBase || new Date().toISOString()),
    ...job
  };
}

function createDisputeSeed(dispute) {
  return {
    providerEmail: DEFAULT_PROVIDER_EMAIL,
    status: 'pending',
    evidence: [],
    description: '',
    ...dispute
  };
}

const initialServices = [];

const initialJobs = [];

const initialDisputes = [];

function cloneSeed(data) {
  return JSON.parse(JSON.stringify(data));
}

function getDefaultValueForKey(key) {
  switch (key) {
    case 'sh_services':
      return [];
    case 'sh_jobs':
      return [];
    case 'sh_provider':
      return cloneSeed(initialProvider);
    case 'sh_providers_list':
      return [];
    case 'sh_disputes':
      return [];
    default:
      return null;
  }
}

function isValidStorageShape(key, value) {
  switch (key) {
    case 'sh_services':
    case 'sh_jobs':
    case 'sh_providers_list':
    case 'sh_disputes':
      return Array.isArray(value);
    case 'sh_provider':
      return value && typeof value === 'object' && !Array.isArray(value);
    default:
      return value !== null;
  }
}

function readDBValue(key, fallback = null) {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Unable to parse localStorage key "${key}".`, error);
    return fallback;
  }
}

function mergeCollectionByKey(existingItems, seedItems, keyName) {
  const safeExisting = Array.isArray(existingItems) ? existingItems.slice() : [];
  const existingKeys = new Set(
    safeExisting
      .map((item) => (item && item[keyName] !== undefined && item[keyName] !== null ? String(item[keyName]) : ''))
      .filter(Boolean)
  );

  const additions = seedItems.filter((item) => !existingKeys.has(String(item[keyName])));
  return safeExisting.concat(cloneSeed(additions));
}

function mergeProviderAccounts(existingAccounts) {
  const safeExisting = Array.isArray(existingAccounts) ? existingAccounts.slice() : [];
  const existingEmails = new Set(
    safeExisting
      .map((account) => String((account && account.email) || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const additions = initialProvidersList.filter((account) => !existingEmails.has(String(account.email).trim().toLowerCase()));
  return safeExisting.concat(cloneSeed(additions));
}

function backfillProviderProfileDefaults() {
  const currentProfile = readDBValue('sh_provider', null);
  if (!currentProfile || typeof currentProfile !== 'object' || Array.isArray(currentProfile)) return;

  const normalizedEmail = String(currentProfile.email || '').trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail === DEFAULT_PROVIDER_EMAIL) {
    localStorage.setItem('sh_provider', JSON.stringify({
      ...cloneSeed(initialProvider),
      ...currentProfile
    }));
  }
}

function applyProviderSeedMigration() {
  if (localStorage.getItem(PROVIDER_SEED_VERSION_KEY) === PROVIDER_SEED_VERSION) return;
  localStorage.setItem(PROVIDER_SEED_VERSION_KEY, PROVIDER_SEED_VERSION);
}

// Initializes localStorage ONLY if the key is missing or invalid
function initializeStorage() {
  if (!localStorage.getItem('sh_db_v2_clean')) {
    localStorage.removeItem('sh_providers_list');
    localStorage.removeItem('activeUser');
    localStorage.removeItem('sh_active_session');
    localStorage.removeItem('sh_provider_auth');
    localStorage.setItem('sh_db_v2_clean', 'true');
  }

  ['sh_services', 'sh_jobs', 'sh_provider', 'sh_providers_list', 'sh_disputes'].forEach((key) => {
    const currentValue = readDBValue(key, null);
    if (!isValidStorageShape(key, currentValue)) {
      localStorage.setItem(key, JSON.stringify(getDefaultValueForKey(key)));
    }
  });

  backfillProviderProfileDefaults();
  applyProviderSeedMigration();
}

function getDB(key, fallback = getDefaultValueForKey(key)) {
  const value = readDBValue(key, null);

  if (isValidStorageShape(key, value)) {
    return value;
  }

  return fallback === null ? null : cloneSeed(fallback);
}

function updateDB(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

initializeStorage();
