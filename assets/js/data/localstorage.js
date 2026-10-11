export function getLSJson(item) {
  const data = localStorage.getItem(item);
  return data ? JSON.parse(data) : [];
}

export function addLSJson(nama, json) {
  let data = [];

  // Coba ambil data sebelumnya
  try {
    const tersimpan = localStorage.getItem(nama);
    if (tersimpan) {
      data = JSON.parse(tersimpan);
      
      if (!Array.isArray(data)) {
        console.warn(`Data di '${nama}' bukan array. Akan ditimpa sebagai array.`);
        data = [];
      }
    }
  } catch (e) {
    console.warn(`Gagal parse data dari localStorage key '${nama}':`, e);
  }
  
  data.push(json);

  localStorage.setItem(nama, JSON.stringify(data));
}

export function remLSById(id, storageKey , onSuccess) {
  let data = JSON.parse(localStorage.getItem(storageKey)) || [];
  const index = data.findIndex(item => String(item.id) === String(id));

  if (index !== -1) {
    data.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(data));

    if (typeof onSuccess === "function") {
      onSuccess(data); // Kirim data baru setelah penghapusan
    }
  }
}