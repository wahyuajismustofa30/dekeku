// utils/urlParams.js

function encodeUrlSafe(str) {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeUrlSafe(str) {
  const base64 = str
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(str.length + (4 - str.length % 4) % 4, "=");
  return atob(base64);
}

export function writeURLParams(obj) {
  try {
    const jsonString = JSON.stringify(obj);
    const encoded = encodeUrlSafe(jsonString);

    const params = new URLSearchParams(window.location.search);
    params.set("d", encoded);

    const newURL = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newURL);
  } catch (err) {
    console.error("Gagal encode URL params:", err);
  }
}

export function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("d");
  if (!encoded) return {};

  try {
    const decoded = decodeUrlSafe(encoded);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Gagal decode URL params:", err);
    return {};
  }
}

export function getParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function getParams() {
  const params = new URLSearchParams(window.location.search);
  const obj = {};
  for (const [key, value] of params.entries()) {
    obj[key] = value;
  }
  return obj;
}


export function setParam(key, value, replace = true) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);

  if (replace) {
    history.replaceState(null, "", url.toString());
  } else {
    history.pushState(null, "", url.toString());
  }
}


export function setParams(obj, replace = true) {
  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(obj)) {
    url.searchParams.set(key, value);
  }

  if (replace) {
    history.replaceState(null, "", url.toString());
  } else {
    history.pushState(null, "", url.toString());
  }
}


export function deleteParam(key, replace = true) {
  const url = new URL(window.location.href);
  url.searchParams.delete(key);

  if (replace) {
    history.replaceState(null, "", url.toString());
  } else {
    history.pushState(null, "", url.toString());
  }

}

const params = {
	writeURLParams,
	readURLParams,
	getParam,
	getParams,
	setParam,
	setParams,
	deleteParam
}
export default params;