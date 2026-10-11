const templateUndangan = {
  pernikahan: ({ namaTamu, link, pengundang }) => `
Assalamu’alaikum Warahmatullahi Wabarakatuh.

Dengan memohon rahmat dan ridho Allah SWT, kami mengundang ${namaTamu} untuk menghadiri acara pernikahan kami.

Link Undangan:
${link}

Merupakan kehormatan dan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.

Wassalamu’alaikum Warahmatullahi Wabarakatuh.

Hormat kami,
${pengundang}
`.trim(),

  khitanan: ({ namaTamu, link, pengundang }) => `
Assalamu’alaikum Warahmatullahi Wabarakatuh.

Dengan izin Allah SWT, kami mengundang ${namaTamu} untuk menghadiri acara khitanan putra/putri kami.

Link Undangan:
${link}

Merupakan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.

Wassalamu’alaikum Warahmatullahi Wabarakatuh.

Hormat kami,
${pengundang}
`.trim()
};

export function buttonWhatsAppUndangan(button) {
  const namaTamu = button.dataset.nama || "Tamu";
  const link = button.dataset.link || "#";
  const pengundang = button.dataset.pengundang;
  const jenisAcara = button.dataset.acara || "pernikahan";

  const templateFn = templateUndangan[jenisAcara] || templateUndangan.pernikahan;
  const pesan = templateFn({ namaTamu, link, pengundang });

  const waNumber = button.dataset.kontak || "";
  const waURL = `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`;

  window.open(waURL, "_blank");
}

export function handleChatOrder(button) {
  try {
    const dataAttr = button.dataset.produk;
    const nomorWA = (button.dataset.kontak || "").replace(/\D/g, ""); // hanya angka

    if (!dataAttr || !nomorWA) {
      console.warn("Data produk atau nomor WA tidak ada");
      return;
    }

    let produk;
    try {
      produk = JSON.parse(dataAttr);
    } catch (err) {
      console.error("JSON produk tidak valid:", err);
      return;
    }

    // buat pesan
    let pesan = "Hallo, saya ingin memesan produk berikut:\n\n";
    for (const [key, value] of Object.entries(produk)) {
      pesan += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
    }

    // encode untuk URL
    const encodedPesan = encodeURIComponent(pesan.trim());

    // buka WhatsApp
    window.open(`https://wa.me/${nomorWA}?text=${encodedPesan}`, "_blank");
  } catch (err) {
    console.error("handleChatOrder error:", err);
  }
}
