export function setupAccessPage() {
  if (typeof window._accessPage !== "undefined") {
    const access = window._accessPage;
    delete window._accessPage;
    _dekeku.accessPage = access;
    return access;
  }
  return null;
}

export function checkAccess({ requireLogin = false, requireGuest = false, allowedRoles = [] } = {}) {
  const user = _dekeku?.user || null;
  
  if (requireLogin && user === null) {
    window.location.href = "/dev/akun/masuk.html";
    return false;
  }
  
  if (requireGuest && user !== null) {
    window.location.href = "/dev/akun/";
    return false;
  }
  
  if (requireLogin && allowedRoles.length && !allowedRoles.includes(user?.role)) {
    window.location.href = "/dev/403.html";
    return false;
  }

  return true;
}