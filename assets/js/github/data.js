import { fetchDataJsonAPI } from "../data/fetch.js";
import sift from "https://cdn.jsdelivr.net/npm/sift@16.0.0/es/index.min.js";
import dekeku from "../dekekuVar.js";

// POST (add)
export async function ghPost(payload) {
    const { detailFile, newData } = payload;
  try {
    const { data, targetArray, lastKey } = await prepareData(detailFile, false, true, null, newData);

    const idCounterKey = `lastId_${lastKey}`;
    const lastId = Number(data._detail[idCounterKey]) || 0;
    const newId = lastId + 1;

    data._detail[idCounterKey] = newId;
    targetArray.push({ id: newId, ...newData });

    return await finalizeCommit(data);
  } catch (err) {
    console.error("Commit gagal:", err);
  }
}

// UPDATE
export async function ghUpdate(payload) {
    const { detailFile, query, newData } = payload;
  try {
    const { data, targetArray } = await prepareData(detailFile, true, true, query, newData);

    const filterFn = sift(query);
    let updatedCount = 0;

    targetArray.forEach((item, idx) => {
      if (filterFn(item)) {
        targetArray[idx] = { ...item, ...newData };
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      throw new Error("Tidak ada data yang cocok untuk diupdate.");
    }

    return await finalizeCommit(data);
  } catch (err) {
    console.error("Update gagal:", err);
  }
}

// UPDATE OR ADD
export async function ghUpdateOrAdd(payload) {
    const { detailFile, query, newData } = payload;
  try {
    const { data, targetArray, lastKey } = await prepareData(detailFile, true, true, query, newData);

    const index = targetArray.findIndex(sift(query));
    let record;

    if (index >= 0) {
      targetArray[index] = { ...targetArray[index], ...newData };
      record = targetArray[index];
    } else {
      const idCounterKey = `lastId_${lastKey}`;
      const lastId = Number(data._detail[idCounterKey]) || 0;
      const newId = lastId + 1;

      data._detail[idCounterKey] = newId;
      record = { id: newId, ...newData };
      targetArray.push(record);
    }

    return await finalizeCommit(data);
  } catch (err) {
    console.error("Proses update/tambah gagal:", err);
  }
}

// DELETE
export async function ghDelete(payload) {
    const { detailFile, query } = payload;
  try {
    const { data, targetArray } = await prepareData(detailFile, true, false, query);

    const beforeCount = targetArray.length;
    const filterFn = sift(query);

    const newArray = targetArray.filter(item => !filterFn(item));
    const deletedCount = beforeCount - newArray.length;

    if (deletedCount === 0) {
      throw new Error("Tidak ada data yang cocok untuk dihapus.");
    }

    targetArray.length = 0;
    targetArray.push(...newArray);

    await finalizeCommit(data);
  } catch (err) {
    console.error("Delete gagal:", err);
  }
}

export function createCommit(dekeku) {
  return async function commit(data) {
    const res = await fetch(`${dekeku.urlApi}/gh/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal commit");
    return json;
  };
}

async function prepareData(detailFile, needQuery = false, needNewData = false, query = null, newData = null) {
  if (!detailFile || typeof detailFile !== "string") {
    throw new Error("detailFile harus berupa string.");
  }
  if (needQuery && (!query || typeof query !== "object")) {
    throw new Error("query harus berupa object.");
  }
  if (needNewData && (!newData || typeof newData !== "object")) {
    throw new Error("newData harus berupa object.");
  }

  const infoFile = detailFile.split(".");
  const fileName = infoFile.shift();
  const path = infoFile;

  if (path.length === 0) {
    throw new Error("detailFile harus punya minimal satu path setelah nama file.");
  }

  let data = await fetchDataJsonAPI(fileName, dekeku.urlApi);

  if (!data || Object.keys(data).length === 0) {
    console.warn(`File ${fileName}.json tidak ditemukan, membuat data baru.`);
    data = { _detail: { fileName } };
  }

  if (!data._detail) {
    data._detail = { fileName };
  }

  let target = data;
  for (let i = 0; i < path.length - 1; i++) {
    if (!target[path[i]]) {
      target[path[i]] = {};
    }
    target = target[path[i]];
  }

  const lastKey = path[path.length - 1];
  if (!Array.isArray(target[lastKey])) {
    target[lastKey] = [];
  }

  return { data, targetArray: target[lastKey], lastKey };
}

async function finalizeCommit(data) {
  data._detail.lastUpdate = new Date().toISOString();
  const commit = createCommit(dekeku);
  const res = await commit(data);
  if(res.status === 200){
    return true;
  }else{
    console.warn(res.error);
    return false;
  }
}

/*
==============================
Daftar Operator Sift.js
==============================

Perbandingan:
- $eq      → Sama dengan
- $ne      → Tidak sama dengan
- $gt      → Lebih besar dari
- $gte     → Lebih besar atau sama dengan
- $lt      → Lebih kecil dari
- $lte     → Lebih kecil atau sama dengan

Logika:
- $and     → Semua kondisi harus benar
- $or      → Salah satu kondisi benar
- $nor     → Semua kondisi salah
- $not     → Negasi dari kondisi

Pencarian Teks/Pattern:
- $regex   → Cocok dengan RegExp
- $mod     → Sisa hasil pembagian (modulus)

Array:
- $in      → Nilai ada di dalam array
- $nin     → Nilai tidak ada di dalam array
- $all     → Semua elemen ada di array target
- $size    → Panjang array cocok

Elemen:
- $exists  → Cek apakah field ada atau tidak
- $type    → Cek tipe data field

Evaluasi:
- $where   → Fungsi custom untuk filter
*/
