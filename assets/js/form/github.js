import { getEncryptedPayload } from "../utils/commit.js";

export async function handleGithubPostFormSubmit(form) {
  try {
    const fileKey = form.dataset.file;
    if (!fileKey) return _dekeku.function.showAlert("Data-file tidak ditemukan", "error");
	let data;
  try{
    data = getDataForm(form);
  }catch (err){
    if (err.message){
      return _dekeku.function.showAlert(err.message, "error");
    }
  }
  
  _dekeku.function.showAlert("Mengirim data", "info");
    const res = await fetch(`${_dekeku.urlApi}/gh/data?action=post`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detailFile:fileKey, newData: data })
      });

    const resJson = await res.json();

    if (res.ok) {
      _dekeku.function.showAlert("Data Berhasil Dikirim", "success");
      let file = _dekeku.daftarJson.filter(item => item.file === fileKey)[0];
      let setItem = _dekeku.function.setDataJson(file,resJson.data);
        if (setItem){
          _dekeku.proxy.saveDekeku.value = true;
        }
      if (form.dataset.dekeku_proxy){
        _dekeku.proxy[file.nama].value = true
      };
    } else {
      _dekeku.function.showAlert(resJson.message || "Gagal mengirim data", "error");
    }
  } catch (err) {
    console.error("Error handleGithubPostFormSubmit:", err);
  }
}

export async function handleGithubUpdateFormSubmit(form) {
  try {
    const fileKey = form.dataset.file;
    const fileFilter = form.dataset.filter;
    if (!fileKey) return _dekeku.function.showAlert("data-file belum di setting", "error");
    if (!fileFilter) return _dekeku.function.showAlert("data-filter belum di setting", "error");
    const query = JSON.parse(fileFilter);
    let data;
    try{
      data = getDataForm(form);
    }catch (err){
      if (err.message){
        return _dekeku.function.showAlert(err.message, "error");
      }
    }

    _dekeku.function.showAlert("Mengirim data", "info");
    const res = await fetch(`${_dekeku.urlApi}/gh/data?action=update`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detailFile:fileKey, newData: data, query: query })
      });

    const resJson = await res.json();
    if (res.ok) {
      _dekeku.function.showAlert("Data Berhasil Dikirim", "success");
      let file = _dekeku.daftarJson.filter(item => item.file === fileKey)[0];
      let setItem = _dekeku.function.setDataJson(file,resJson.data);
      if (setItem){
        _dekeku.proxy.saveDekeku.value = true;
      }
      if (form.dataset.dekeku_proxy){
        _dekeku.proxy[file.nama].value = true
      };
    } else {
      _dekeku.function.showAlert(resJson.message || "Gagal mengirim data", "error");
    }
  } catch (err) {
    console.error("Error handleGithubPostFormSubmit:", err);
  }
}

export async function handleDaftarFormSubmit(form) {
  const data = getDataForm(form);

  if (!data.username || !data.password || !data.confirm_password) {
    return _dekeku.function.showAlert("Semua field wajib diisi", "error");
  }

  data.username = data.username.toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(data.username)) {
    return _dekeku.function.showAlert("Username harus 3–20 karakter, huruf kecil, angka, atau underscore", "error");
  }

  if (
    !/^.{8,20}$/.test(data.password) ||
    !/[A-Z]/.test(data.password) ||
    !/[a-z]/.test(data.password) ||
    !/[0-9]/.test(data.password) ||
    !/[!@#\$%\^\&\*]/.test(data.password)
  ) {
    return _dekeku.function.showAlert(
      "Password min 8 karakter dan mengandung huruf besar, kecil, angka, dan simbol.",
      "error"
    );
  }

  if (data.password !== data.confirm_password) {
    return _dekeku.function.showAlert("Password dan konfirmasi tidak sama", "error");
  }

  try {
    const payload = await getEncryptedPayload(data, _dekeku.urlApi);
    const res = await fetch(`${_dekeku.urlApi}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const response = await res.json();
    if (!res.ok) {
      _dekeku.function.showAlert(response.error || "Gagal mendaftar", "error");
    } else {
      localStorage.setItem("user", JSON.stringify(response.data));
      notifySuccess("Pendaftaran berhasil!", './');
    }
  } catch (err) {
    console.error("Gagal daftar:", err);
    _dekeku.function.showAlert("Pendaftaran gagal", "error");
  }
}

export async function handleMasukFormSubmit(form) {
  const data = getDataForm(form);

  if (!data.username || !data.password) {
    return _dekeku.function.showAlert("Username dan password wajib diisi", "error");
  }

  data.username = data.username.toLowerCase();

  try {
    const payload = await getEncryptedPayload(data, _dekeku.urlApi);
    const response = await fetch(`${_dekeku.urlApi}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok && result.success) {
      localStorage.setItem("user", JSON.stringify(result.data));
      notifySuccess("Login berhasil!", './');
    } else {
      _dekeku.function.showAlert(result.error || "Login gagal", "error");
    }
  } catch (err) {
    console.error("Gagal login:", err);
    _dekeku.function.showAlert("Terjadi kesalahan saat login", "error");
  }
}

function validateRequiredField(form, field, rawKey, value) {
  if (!field || !field.hasAttribute("data-required")) return;

  let isEmpty = false;

  if (field.type === "checkbox") {
    isEmpty = !field.checked;
  } else if (field.type === "radio") {
    const checked = form.querySelector(`[name="${rawKey}"]:checked`);
    isEmpty = !checked;
  } else {
    isEmpty = (value === "" || value === null);
  }

  if (isEmpty) {
    const err = new Error(`${rawKey} wajib diisi`);
    err.field = rawKey;
    err.code = "REQUIRED_FIELD_EMPTY";
    throw err;
  }
}

function resetFieldValue(field) {
  if (field && !(field.tagName === "INPUT" && field.type === "hidden")) {
    field.value = "";
  }
}

function normalizeKey(rawKey) {
  return rawKey.endsWith("[]") ? rawKey.slice(0, -2) : rawKey;
}

function getDataForm(form) {
  const fd = new FormData(form);
  const obj = {};

  for (const [rawKey, value] of fd.entries()) {
    const field = form.querySelector(`[name="${rawKey}"]`);
    if (field && field.hasAttribute("data-ignore")) continue;

    if (field && field.dataset.type === "timestamp") {
      obj[rawKey] = new Date().toISOString();
      continue;
    }

    const key = normalizeKey(rawKey);
    const isArrayField =
      rawKey.endsWith("[]") ||
      (field && field.type === "checkbox") ||
      (field && field.multiple);

    validateRequiredField(form, field, rawKey, value);

    if (field && field.tagName === "SELECT" && field.multiple) {
      obj[key] = Array.from(field.selectedOptions).map(opt => opt.value);
      continue;
    }

    if (!(key in obj)) {
      obj[key] = isArrayField ? [value] : value;
    } else if (Array.isArray(obj[key])) {
      obj[key].push(value);
    } else {
      obj[key] = [obj[key], value];
    }

    resetFieldValue(field);
  }

  form.querySelectorAll("[name][data-required]").forEach(el => {
    const key = normalizeKey(el.name);
    if (!(key in obj)) {
      validateRequiredField(form, el, key, null);
    }
  });

  const checkboxNames = new Set(
    Array.from(form.querySelectorAll('input[type="checkbox"][name]'))
      .filter(el => !el.hasAttribute("data-ignore"))
      .map(el => normalizeKey(el.name))
  );
  checkboxNames.forEach(name => {
    if (!(name in obj)) obj[name] = [];
  });

  form.querySelectorAll("[name][data-default]").forEach(el => {
    const key = normalizeKey(el.name);
    if (!obj[key] || obj[key].length === 0) {
      obj[key] = el.getAttribute("data-default");
    }
  });

  return obj;
}



function notifySuccess(message, redirectTo = null) {
  _dekeku.function.showAlert(message, 'success');
  if (redirectTo) window.location.replace(redirectTo);
}