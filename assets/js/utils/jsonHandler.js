// utils/jsonHandler.js

export function removePrefix(fullPath, filename) {
  if (!fullPath.startsWith(filename)) return fullPath;
  const rest = fullPath.slice(filename.length);
  return rest.startsWith('.') ? rest.slice(1) : rest;
}

export function getNestedValue(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
}

export function insertWithAutoId(arr, dataBaru) {
  const maxId = arr.reduce((max, item) => Math.max(max, item.id || 0), 0);
  const dataDenganId = { id: maxId + 1, ...dataBaru };
  arr.push(dataDenganId);
  return arr;
}

export function enrichWithLookups(dataList, lookups = {}) {
  return dataList.map(item => {
    const enriched = { ...item };

    // Enrich kategori (jika ada)
    if (item.kategori && Array.isArray(lookups.kategori)) {
      const match = lookups.kategori.find(k => k.id === item.kategori);
      if (match) {
        enriched.kategori = match.produk || "";
        enriched.tema = match.tema || "";
        enriched.acara = match.acara || "";
      }
    }

    // Enrich paket (jika ada)
    if (Array.isArray(item.paket) && Array.isArray(lookups.paket)) {
      enriched.paket = item.paket.map(id => {
        const match = lookups.paket.find(p => p.id === id);
        return match ? { nama: match.nama, harga: match.harga } : { nama: "", harga: 0 };
      });
    }

    return enriched;
  });
}

export function filterData(data, filters) {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (typeof value === 'string') {
        return item[key]?.toLowerCase() === value.toLowerCase();
      }
      return item[key] === value;
    });
  });
}

export function ensureArray(input) {
  if (Array.isArray(input)) {
    return input;
  }
  if (input === undefined || input === null) {
    return [];
  }
  return [input];
}

export function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

export function isNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.keys(obj).length > 0
  );
}

export function normalizeToArray(val) {
  if (Array.isArray(val)) return val;

  // Jika string dengan tanda kurung siku, seperti '[abc]', '[1,2]'
  if (typeof val === "string" && /^\[.*\]$/.test(val.trim())) {
    // Hilangkan tanda kurung lalu pecah berdasarkan koma
    const inner = val.slice(1, -1); // hapus [ dan ]
    return inner.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
  }

  // Bungkus sebagai array biasa
  return [val];
}

export function paginate(data = [], page = 1, perPage = 10) {
  const total = data.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedItems = data.slice(start, end);

  return {
    currentPage: page,
    perPage,
    total,
    totalPages,
    data: paginatedItems
  };
}
export function totalPaginate(totalItems, perPage = 10) {
  if (!totalItems || perPage <= 0) return 0;
  return Math.ceil(totalItems / perPage);
}
