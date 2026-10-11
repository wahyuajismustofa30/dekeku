// localStorage.js
export async function localStorageFormHandler(form) {
  if (!form) return;

  const storageKey = form.dataset.nama || "tamuUndangan";
  const scema = JSON.parse(form.dataset.scema || "{}");
  const proxy = form.dataset.dekeku_proxy;

  // Ambil data dari form
  const formData = {};
  for (const key in scema) {
    const type = scema[key];
    let value = form.elements[key]?.value?.trim();
    if (!value) {
      return showAlert(`${key} harus diisi!`,"error");
    }
    formData[key] = type === "array"
      ? value.split(",").map(v => v.trim()).filter(v => v)
      : value;
  }

  // Ambil data lama
  let data = JSON.parse(localStorage.getItem(storageKey)) || [];

  // Array keys
  const arrayKeys = Object.keys(scema).filter(k => scema[k] === "array");

  // Cartesian product untuk kombinasi array
  function cartesian(arrays) {
    return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
  }

  const arrayValues = arrayKeys.map(k => formData[k]);
  const combinations = cartesian(arrayValues);

  combinations.forEach(comb => {
    const newItem = {};
    let i = 0;
    for (const key in scema) {
      newItem[key] = scema[key] === "array" ? comb[i++] : formData[key];
    }

    const exists = data.some(d =>
      Object.keys(scema).every(k => d[k] === newItem[k])
    );

    if (!exists) data.push(newItem);
  });

  localStorage.setItem(storageKey, JSON.stringify(data));
  if (proxy){
	  _dekeku.proxy[proxy].value = true;
  }

  if (typeof showAlert === "function") {
    showAlert("Berhasil menambahkan data!", "success");
  } else {
    alert("Berhasil menambahkan data!");
  }

  setTimeout(() => form.reset(), 100);
}
