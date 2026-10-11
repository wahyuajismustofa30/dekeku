async function importKeyAESGCM(secret) {
  const rawKey = new TextEncoder().encode(secret.padEnd(32, "_"));
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAESGCM(text, secret) {
  const key = await importKeyAESGCM(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptAESGCM(enText, secret) {
  const key = await importKeyAESGCM(secret);
  const encryptedBytes = Uint8Array.from(atob(enText), c => c.charCodeAt(0));
  const iv = encryptedBytes.slice(0, 12);
  const data = encryptedBytes.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}