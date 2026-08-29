/* =============================================
   ServiceHub – Backend API cache and LocalStorage compatibility layer
   ============================================= */

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
      return {};
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

}

function getDB(key, fallback = null) {
  const value = readDBValue(key, null);

  if (isValidStorageShape(key, value)) {
    return value;
  }

  return fallback === null ? cloneSeed(getDefaultValueForKey(key)) : cloneSeed(fallback);
}

function updateDB(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

initializeStorage();
