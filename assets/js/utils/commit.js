// utils/commit.js
import { encryptAESGCM } from "../crypto/aesgcm.js";

export function createCommit(_dekeku) {
  return async function commit(data) {
    const res = await fetch(`${_dekeku.urlApi}/gh/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal commit");
    return json;
  };
}

export async function getEncryptedPayload(data, urlApi) {
  const tokenRes = await fetch(`${urlApi}/token`);
  const tokenData = await tokenRes.json();

  if (!tokenData?.token || !tokenData?.key) {
    throw new Error("Token atau kunci tidak valid.");
  }

  const dataEn = await encryptAESGCM(JSON.stringify(data), tokenData.key);
  return { token: tokenData.token, data: dataEn };
}
