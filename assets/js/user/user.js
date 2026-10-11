export function loadUserSession(key = "user") {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : null;
}

export async function logout() {
  try {
    const response = await fetch(`${_dekeku.urlApi}/logout`);
    const result = await response.json();

    if (result.success) {
      localStorage.removeItem("user");
      window.location.href = "./masuk.html";
    } else {
      console.warn("Logout gagal:", result.error || "Tidak diketahui");
    }
  } catch (err) {
    console.error("Gagal memproses logout:", err);
  }
}