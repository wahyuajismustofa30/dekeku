export async function getUserData(token,singed) {
  try {
    const payload = {token:token,singed:singed};
    const response = await fetch(`${_dekeku.urlApi}/data/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result) {
      return result.user;
    } else {
      showAlert(result.error || "Gagal mendapatkan data user", "error");
    }
  } catch (err) {
    console.error("Gagal login:", err);
    showAlert("Terjadi kesalahan saat mengambil data user", "error");
  }  
}