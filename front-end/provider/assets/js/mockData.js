/* =============================================
   ServiceHub – Mock Data & LocalStorage Engine
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

const initialServices = [
  createServiceSeed({
    id: 'svc-plumb-001',
    name: 'Plumbing Leak Repair',
    category: 'Plumbing',
    price: 89,
    duration: 'Fixed (1-2 Hours)',
    description: 'Emergency leak repair for faucets, traps, supply lines, and under-sink plumbing issues.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400'
  }),
  createServiceSeed({
    id: 'svc-elec-002',
    name: 'Electrical Wiring Inspection',
    category: 'Electrical',
    price: 95,
    duration: 'Per Hour',
    description: 'Inspection and troubleshooting for outlets, switches, breakers, and faulty residential wiring.',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400'
  }),
  createServiceSeed({
    id: 'svc-hvac-003',
    name: 'HVAC Preventive Maintenance',
    category: 'HVAC Maintenance',
    price: 120,
    duration: 'Fixed (Half Day)',
    status: 'paused',
    description: 'Seasonal tune-ups for heating and cooling systems with filter checks and airflow balancing.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400'
  }),
  createServiceSeed({
    id: 'svc-clean-004',
    name: 'Deep Home Cleaning',
    category: 'Cleaning',
    price: 210,
    duration: 'Fixed (Full Day)',
    description: 'Deep cleaning for kitchens, bathrooms, living areas, and high-touch surfaces.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400'
  }),
  createServiceSeed({
    id: 'svc-paint-005',
    name: 'Interior Wall Painting',
    category: 'Painting',
    price: 340,
    duration: 'Fixed (Full Day)',
    description: 'Single-room interior painting with prep, patching, edging, and clean finish work.',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=400'
  }),
  createServiceSeed({
    id: 'svc-carp-006',
    name: 'Custom Shelving Installation',
    category: 'Carpentry',
    price: 180,
    duration: 'Fixed (1-2 Hours)',
    description: 'Wall-mounted shelf installation, leveling, anchoring, and finish alignment.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400'
  }),
  createServiceSeed({
    id: 'svc-outdoor-007',
    name: 'Garden Cleanup and Trim',
    category: 'Landscaping',
    price: 150,
    duration: 'Fixed (Half Day)',
    description: 'Seasonal outdoor cleanup including trimming, debris removal, and curb appeal touch-ups.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400'
  })
];

const initialJobs = [
  createJobSeed({
    id: 'JOB-20471',
    customerName: 'Sarah Johnson',
    service: 'Plumbing Leak Repair',
    date: 'Apr 02, 2026',
    time: '09:00 AM - 11:00 AM',
    location: 'Downtown, San Francisco',
    address: '145 Oak Street, San Francisco, CA 94102',
    customerPhone: '+1 (415) 555-0181',
    status: 'pending',
    price: 185,
    description: 'Kitchen sink leak has worsened overnight and water is pooling inside the cabinet.'
  }),
  createJobSeed({
    id: 'JOB-20470',
    customerName: 'Michael Chen',
    service: 'Electrical Wiring Inspection',
    date: 'Apr 02, 2026',
    time: '01:00 PM - 03:00 PM',
    location: 'Mission Bay, San Francisco',
    address: '88 Channel Street, San Francisco, CA 94158',
    customerPhone: '+1 (415) 555-0192',
    status: 'active',
    progressStage: 'accepted',
    timelineBase: '2026-04-02T08:30:00.000Z',
    price: 210,
    description: 'Intermittent outlet failures in the living room and office need inspection.'
  }),
  createJobSeed({
    id: 'JOB-20469',
    customerName: 'Emily Rodriguez',
    service: 'HVAC Preventive Maintenance',
    date: 'Apr 01, 2026',
    time: '11:30 AM - 02:00 PM',
    location: 'SOMA, San Francisco',
    address: '510 Howard Street, San Francisco, CA 94105',
    customerPhone: '+1 (415) 555-0114',
    status: 'completed',
    timelineBase: '2026-04-01T11:15:00.000Z',
    price: 340,
    description: 'Quarterly maintenance visit for rooftop HVAC unit and thermostat calibration.'
  }),
  createJobSeed({
    id: 'JOB-20468',
    customerName: 'David Thompson',
    service: 'Custom Shelving Installation',
    date: 'Apr 03, 2026',
    time: '10:00 AM - 12:30 PM',
    location: 'North Beach, San Francisco',
    address: '31 Columbus Avenue, San Francisco, CA 94133',
    customerPhone: '+1 (415) 555-0120',
    status: 'progress',
    progressStage: 'in_progress',
    timelineBase: '2026-04-03T09:10:00.000Z',
    price: 265,
    description: 'Install three floating shelves and reinforce one loose wall anchor in the study.'
  }),
  createJobSeed({
    id: 'JOB-20467',
    customerName: 'Jessica Martinez',
    service: 'Deep Home Cleaning',
    date: 'Apr 04, 2026',
    time: '08:00 AM - 12:00 PM',
    location: 'Sunset District, San Francisco',
    address: '770 Noriega Street, San Francisco, CA 94122',
    customerPhone: '+1 (415) 555-0128',
    status: 'pending',
    price: 240,
    description: 'Move-out cleaning for a two-bedroom apartment before final inspection.'
  }),
  createJobSeed({
    id: 'JOB-20466',
    customerName: 'Robert Williams',
    service: 'Interior Wall Painting',
    date: 'Apr 04, 2026',
    time: '02:00 PM - 06:00 PM',
    location: 'Richmond District, San Francisco',
    address: '402 Clement Street, San Francisco, CA 94118',
    customerPhone: '+1 (415) 555-0137',
    status: 'active',
    progressStage: 'en_route',
    timelineBase: '2026-04-04T13:10:00.000Z',
    price: 420,
    description: 'Touch-up and repaint two bedroom accent walls after furniture move.'
  }),
  createJobSeed({
    id: 'JOB-20465',
    customerName: 'Lisa Anderson',
    service: 'Garden Cleanup and Trim',
    date: 'Apr 05, 2026',
    time: '09:30 AM - 01:30 PM',
    location: 'Noe Valley, San Francisco',
    address: '625 Castro Street, San Francisco, CA 94114',
    customerPhone: '+1 (415) 555-0142',
    status: 'completed',
    timelineBase: '2026-04-05T09:00:00.000Z',
    price: 190,
    description: 'Front and back yard cleanup with hedge trimming and debris haul-away.'
  }),
  createJobSeed({
    id: 'JOB-20464',
    customerName: 'James Wilson',
    service: 'Plumbing Leak Repair',
    date: 'Apr 05, 2026',
    time: '03:00 PM - 05:00 PM',
    location: 'Pacific Heights, San Francisco',
    address: '1520 California Street, San Francisco, CA 94109',
    customerPhone: '+1 (415) 555-0148',
    status: 'pending',
    price: 165,
    description: 'Bathroom vanity pipe is leaking after a recent fixture replacement.'
  }),
  createJobSeed({
    id: 'JOB-20463',
    customerName: 'Ava Patel',
    service: 'Electrical Wiring Inspection',
    date: 'Apr 06, 2026',
    time: '12:00 PM - 02:00 PM',
    location: 'Hayes Valley, San Francisco',
    address: '245 Fell Street, San Francisco, CA 94102',
    customerPhone: '+1 (415) 555-0154',
    status: 'progress',
    progressStage: 'arrived',
    timelineBase: '2026-04-06T11:10:00.000Z',
    price: 230,
    description: 'Breaker trips when the washer and dryer run together. Needs diagnostics.'
  }),
  createJobSeed({
    id: 'JOB-20462',
    customerName: 'Noah Green',
    service: 'HVAC Preventive Maintenance',
    date: 'Apr 06, 2026',
    time: '03:00 PM - 05:30 PM',
    location: 'Bernal Heights, San Francisco',
    address: '318 Cortland Avenue, San Francisco, CA 94110',
    customerPhone: '+1 (415) 555-0161',
    status: 'completed',
    timelineBase: '2026-04-06T14:00:00.000Z',
    price: 355,
    description: 'Inspect outdoor condenser and replace worn filter before the summer season.'
  }),
  createJobSeed({
    id: 'JOB-20461',
    customerName: 'Olivia Brooks',
    service: 'Deep Home Cleaning',
    date: 'Apr 07, 2026',
    time: '08:30 AM - 11:30 AM',
    location: 'Potrero Hill, San Francisco',
    address: '980 22nd Street, San Francisco, CA 94107',
    customerPhone: '+1 (415) 555-0169',
    status: 'pending',
    price: 215,
    description: 'Post-renovation cleaning for one bedroom and shared living space.'
  }),
  createJobSeed({
    id: 'JOB-20460',
    customerName: 'Ethan Kim',
    service: 'Custom Shelving Installation',
    date: 'Apr 07, 2026',
    time: '01:30 PM - 04:00 PM',
    location: 'Marina District, San Francisco',
    address: '1400 Lombard Street, San Francisco, CA 94123',
    customerPhone: '+1 (415) 555-0173',
    status: 'active',
    progressStage: 'accepted',
    timelineBase: '2026-04-07T09:15:00.000Z',
    price: 275,
    description: 'Install new office shelving and correct the spacing from a previous contractor.'
  }),
  createJobSeed({
    id: 'JOB-20459',
    customerName: 'Sophia Turner',
    service: 'Interior Wall Painting',
    date: 'Apr 08, 2026',
    time: '09:00 AM - 01:00 PM',
    location: 'Twin Peaks, San Francisco',
    address: '170 Panorama Drive, San Francisco, CA 94131',
    customerPhone: '+1 (415) 555-0177',
    status: 'completed',
    timelineBase: '2026-04-08T08:20:00.000Z',
    price: 390,
    description: 'Refresh paint in a nursery with low-odor paint and careful floor protection.'
  }),
  createJobSeed({
    id: 'JOB-20458',
    customerName: 'Liam Foster',
    service: 'Plumbing Leak Repair',
    date: 'Apr 08, 2026',
    time: '02:30 PM - 04:00 PM',
    location: 'Inner Sunset, San Francisco',
    address: '1222 Irving Street, San Francisco, CA 94122',
    customerPhone: '+1 (415) 555-0183',
    status: 'progress',
    progressStage: 'in_progress',
    timelineBase: '2026-04-08T13:40:00.000Z',
    price: 195,
    description: 'Water heater closet has an active drip and corrosion around one of the valves.'
  }),
  createJobSeed({
    id: 'JOB-20457',
    customerName: 'Mia Sanchez',
    service: 'Garden Cleanup and Trim',
    date: 'Apr 09, 2026',
    time: '10:00 AM - 01:00 PM',
    location: 'Outer Mission, San Francisco',
    address: '905 Geneva Avenue, San Francisco, CA 94112',
    customerPhone: '+1 (415) 555-0188',
    status: 'pending',
    price: 175,
    description: 'Backyard cleanup requested before hosting a family event over the weekend.'
  }),
  createJobSeed({
    id: 'JOB-20456',
    customerName: 'Daniel Rivera',
    service: 'Electrical Wiring Inspection',
    date: 'Apr 09, 2026',
    time: '02:00 PM - 04:30 PM',
    location: 'Dogpatch, San Francisco',
    address: '620 18th Street, San Francisco, CA 94107',
    customerPhone: '+1 (415) 555-0191',
    status: 'completed',
    timelineBase: '2026-04-09T13:00:00.000Z',
    price: 260,
    description: 'Lighting flickers in two rooms and GFCI outlet reset is no longer working.'
  }),
  createJobSeed({
    id: 'JOB-20455',
    customerName: 'Charlotte Reed',
    service: 'Deep Home Cleaning',
    date: 'Apr 10, 2026',
    time: '09:00 AM - 12:00 PM',
    location: 'Russian Hill, San Francisco',
    address: '1000 Hyde Street, San Francisco, CA 94109',
    customerPhone: '+1 (415) 555-0195',
    status: 'active',
    progressStage: 'arrived',
    timelineBase: '2026-04-10T08:25:00.000Z',
    price: 225,
    description: 'Recurring monthly cleaning with extra attention to bathrooms and kitchen tile.'
  }),
  createJobSeed({
    id: 'JOB-20454',
    customerName: 'Benjamin Hall',
    service: 'HVAC Preventive Maintenance',
    date: 'Apr 10, 2026',
    time: '01:00 PM - 03:30 PM',
    location: 'Glen Park, San Francisco',
    address: '276 Bosworth Street, San Francisco, CA 94131',
    customerPhone: '+1 (415) 555-0199',
    status: 'completed',
    timelineBase: '2026-04-10T12:10:00.000Z',
    price: 365,
    description: 'Inspect duct airflow and address new rattling sound near the condenser.'
  })
];

const initialDisputes = [
  createDisputeSeed({
    id: 'JOB-20444',
    customerName: 'Zoe Collins',
    issue: 'Service quality concern',
    status: 'pending',
    description: 'Customer reported that one leaking fitting started dripping again the next day.'
  }),
  createDisputeSeed({
    id: 'JOB-20441',
    customerName: 'Nathan Price',
    issue: 'Payment dispute',
    status: 'under_review',
    description: 'Customer disputed the final invoice after approving the estimate on site.'
  }),
  createDisputeSeed({
    id: 'JOB-20438',
    customerName: 'Grace Mitchell',
    issue: 'Incomplete work',
    status: 'resolved',
    description: 'Resolution team confirmed a follow-up visit completed the remaining checklist items.'
  }),
  createDisputeSeed({
    id: 'JOB-20435',
    customerName: 'Jacob Murphy',
    issue: 'Delayed completion',
    status: 'under_review',
    description: 'Timeline shifted by a day because replacement parts were backordered.'
  }),
  createDisputeSeed({
    id: 'JOB-20432',
    customerName: 'Hannah Ross',
    issue: 'Pricing disagreement',
    status: 'resolved',
    description: 'Updated invoice accepted after line items were clarified and approved.'
  }),
  createDisputeSeed({
    id: 'JOB-20429',
    customerName: 'Lucas Perry',
    issue: 'Communication issues',
    status: 'pending',
    description: 'Customer requested escalation after missed messages about an arrival window.'
  }),
  createDisputeSeed({
    id: 'JOB-20426',
    customerName: 'Amelia Ward',
    issue: 'Damage claim',
    status: 'under_review',
    description: 'Customer claims a hallway wall was scratched while tools were being moved in.'
  }),
  createDisputeSeed({
    id: 'JOB-20423',
    customerName: 'Logan Bennett',
    issue: 'Cancellation request',
    status: 'resolved',
    description: 'Cancellation resolved under the platform policy with no payout adjustment.'
  }),
  createDisputeSeed({
    id: 'JOB-20420',
    customerName: 'Ella Hughes',
    issue: 'Scope of work creep',
    status: 'under_review',
    description: 'Customer asked for additional tasks beyond the accepted quote and disputed the add-on charge.'
  }),
  createDisputeSeed({
    id: 'JOB-20417',
    customerName: 'Henry Gray',
    issue: 'Reschedule disagreement',
    status: 'pending',
    description: 'Conflicting messages about the approved reschedule created a service delay complaint.'
  }),
  createDisputeSeed({
    id: 'JOB-20414',
    customerName: 'Aria Bennett',
    issue: 'Work quality dispute',
    status: 'resolved',
    description: 'Independent review found the work met the original specification after follow-up photos were submitted.'
  }),
  createDisputeSeed({
    id: 'JOB-20411',
    customerName: 'Sebastian Long',
    issue: 'Parts reimbursement',
    status: 'under_review',
    description: 'Provider is requesting reimbursement for emergency replacement parts approved during the visit.'
  })
];

const initialProvider = {
  name: 'Paul Repair',
  email: DEFAULT_PROVIDER_EMAIL,
  phone: '1234567890',
  category: 'Plumbing',
  experience: '6 – 10 years',
  location: 'San Francisco, CA',
  bio: 'Licensed home services provider specializing in plumbing, light electrical troubleshooting, and maintenance visits for residential clients.',
  avatar: buildAvatar('Paul Repair', '2F54EB', 'FFFFFF'),
  walletBalance: 3450
};

const initialProvidersList = [
  {
    ...initialProvider,
    password: 'Password123!',
    role: 'provider'
  }
];

function cloneSeed(data) {
  return JSON.parse(JSON.stringify(data));
}

function getDefaultValueForKey(key) {
  switch (key) {
    case 'sh_services':
      return cloneSeed(initialServices);
    case 'sh_jobs':
      return cloneSeed(initialJobs);
    case 'sh_provider':
      return cloneSeed(initialProvider);
    case 'sh_providers_list':
      return cloneSeed(initialProvidersList);
    case 'sh_disputes':
      return cloneSeed(initialDisputes);
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

  const currentServices = readDBValue('sh_services', []);
  const currentJobs = readDBValue('sh_jobs', []);
  const currentDisputes = readDBValue('sh_disputes', []);
  const currentProviders = readDBValue('sh_providers_list', []);

  localStorage.setItem('sh_services', JSON.stringify(mergeCollectionByKey(currentServices, initialServices, 'id')));
  localStorage.setItem('sh_jobs', JSON.stringify(mergeCollectionByKey(currentJobs, initialJobs, 'id')));
  localStorage.setItem('sh_disputes', JSON.stringify(mergeCollectionByKey(currentDisputes, initialDisputes, 'id')));
  localStorage.setItem('sh_providers_list', JSON.stringify(mergeProviderAccounts(currentProviders)));
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
