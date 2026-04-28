function getCookie(name) {
  try {
    const encoded = encodeURIComponent(name) + '=';
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
      if (cookie.startsWith(encoded)) {
        return decodeURIComponent(cookie.slice(encoded.length));
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function setCookie(name, value) {
  try {
    const encodedName = encodeURIComponent(name);
    const encodedValue = encodeURIComponent(String(value));
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${encodedName}=${encodedValue}; path=/; max-age=${oneYear}; SameSite=Lax`;
    return true;
  } catch {
    return false;
  }
}

export function storageGet(key) {
  try {
    const value = window.localStorage.getItem(key);
    if (value !== null) return value;
  } catch {
    // fallback below
  }
  return getCookie(key);
}

export function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return setCookie(key, value);
  }
}

export function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // fallback below
  }

  try {
    document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // ignore
  }
}
