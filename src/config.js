import { storageGet } from './lib/storage.js';

function resolveBackendURL() {
  const override = storageGet('ucm_backend_url');
  if (override) {
    return override;
  }

  return 'https://ucm.neelyinno.com';
}

/**
 * UCM Userscript Configuration
 */
export const CONFIG = {
  BACKEND_URL: resolveBackendURL(),
  PASS_DEFAULT_TTL_SECONDS: 45,
  MUTATION_OBSERVER_DEBOUNCE_MS: 100,

  // Attack button selectors from PRD
  SELECTORS: {
    CSS: '#react-root > div > div.playersModelWrap___dkqHO > div > div:nth-child(2) > div.playerArea___AEVBU > div.playerWindow___aDeDI > div.modal___lMj6N.defender___niX1M > div > div > div > button',
    XPATH: '/html/body/div[6]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[3]/div[2]/div[2]/div/div/div/button',
  },

  // LocalStorage keys
  STORAGE: {
    SESSION_TOKEN: 'ucm_session_token',
    MEMBER_ID: 'ucm_member_id',
    FACTION_ID: 'ucm_faction_id',
    EVENT_CURSOR: 'ucm_event_cursor',
    PERMISSIONS: 'ucm_permissions',
  },
};
