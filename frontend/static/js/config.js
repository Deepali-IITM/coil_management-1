// Central API base URL — adapts to browser, Electron, and Capacitor contexts.
const isCapacitor = !!(window.Capacitor?.isNativePlatform?.());
const isElectron  = !!(window.__ELECTRON__);

// Capacitor / Electron override their own base via window.__COILMS_API__
export const API_BASE =
  (isCapacitor || isElectron)
    ? (window.__COILMS_API__ || 'https://coilms.onrender.com')
    : window.location.origin;
