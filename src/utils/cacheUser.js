
export function setCorreoCache(registro, correo) {
  const key = `correo_${registro}`;
  const value = {
    correo,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCorreoCache(registro, maxAgeMinutes = 60) {
  const key = `correo_${registro}`;
  const raw = localStorage.getItem(key);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const ageMinutes = (Date.now() - parsed.timestamp) / 60000;
    if (ageMinutes > maxAgeMinutes) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.correo;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function clearCorreoCache(registro = null) {
  if (registro) {
    localStorage.removeItem(`correo_${registro}`);
  } else {
    // Borra todos los correos cacheados
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("correo_")) {
        localStorage.removeItem(key);
      }
    });
  }
}
