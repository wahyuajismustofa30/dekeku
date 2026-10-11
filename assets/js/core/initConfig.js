import { showAlert } from "../utils/utils.js";
export async function initConfig() {
  try {
    const res = await fetch(`${location.origin}/config.json?t=${Date.now()}`);

    if (!res.ok) {
      console.error('Repository belum dikonfigurasi. Status:', res.status);
      showAlert("Repository belum dikonfigurasi. Silakan hubungi Admin.", "error");
      return null;
    }

    const raw = await res.text();
    const data = JSON.parse(raw);

    if (!data.repository) {
      console.warn("Properti 'repository' tidak ditemukan dalam config.json");
      showAlert("Konfigurasi tidak lengkap. Hubungi Admin.", "error");
      return null;
    }

    return data.repository;

  } catch (err) {
    console.error("Gagal mengambil konfigurasi:", err);
    showAlert("Terjadi kesalahan saat memuat konfigurasi.", "error");
    return null;
  }  
}