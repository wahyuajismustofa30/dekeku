import { addToCart, updateCartBadge } from "../utils/cart.js";

export function showBuyModal(produk) {
  const modalIdPrefix = "buyModal";
  const submitBtnId = `${modalIdPrefix}-submit-${Date.now()}`;

  const paketHTML = Array.isArray(produk.paket) && produk.paket.length > 0
    ? `
      <legend class="h6 mb-3">Pilihan Paket</legend>
      ${produk.paket.map((paket, i) => `
        <div class="form-check mb-2">
          <input class="form-check-input" type="radio" name="paket" id="${modalIdPrefix}-paket-${i}" value="${paket.nama}" ${i === 0 ? 'checked' : ''}>
          <label class="form-check-label" for="${modalIdPrefix}-paket-${i}">
            ${paket.nama} - Rp${paket.harga.toLocaleString('id-ID')}
          </label>
        </div>
      `).join('')}
    `
    : `
      <div class="alert alert-danger shadow-soft" role="alert">
        <span class="alert-inner--text">Tidak ada paket yang tersedia pada produk ini</span>
      </div>
    `;

  const footerHTML = `
    <button class="btn btn-primary text-danger" data-dismiss="modal" type="button">Batal</button>
    <button class="btn btn-sm btn-primary ml-auto" id="${submitBtnId}" type="button">
      <span class="mr-1"><i class="fas fa-shopping-cart"></i></span>
      Tambah ke Keranjang
    </button>
  `;

  const modalId = showModal({
    modalId: `${modalIdPrefix}-${Date.now()}`,
    labelId: `${modalIdPrefix}-label`,
    title: `Pilih Paket untuk ${produk.nama}`,
    body: paketHTML,
    footer: footerHTML,
    onShow: (modalEl) => {
      // Tambah listener ke tombol submit
      const submitBtn = modalEl.querySelector(`#${submitBtnId}`);
      submitBtn?.addEventListener("click", () => {
        submitBtn.blur();
        const paketNama = modalEl.querySelector('input[name="paket"]:checked')?.value;
        if (!paketNama) return showAlert("Pilih salah satu paket dulu, ya.", "error");

        const paketDipilih = produk.paket.find(p => p.nama === paketNama);
        if (!paketDipilih) return;

        const dataKeranjang = {
          id: produk.id,
          acara: produk.acara,
          tema: produk.tema,
          nama: produk.nama,
          img: produk.img,
          link_produk: produk.link_produk,
          paket: paketDipilih.nama,
          harga: paketDipilih.harga
        };

        addToCart(dataKeranjang);
        updateCartBadge();
        closeModal(modalId);
      });
    }
  });
}

export function showBuyModalWhatsApp(produk,kontak) {
  const modalIdPrefix = "buyModalWA";
  const submitBtnId = `${modalIdPrefix}-submit-${Date.now()}`;

  const paketHTML = Array.isArray(produk.paket) && produk.paket.length > 0
    ? `
      <legend class="h6 mb-3">Pilihan Paket</legend>
      ${produk.paket.map((paket, i) => `
        <div class="form-check mb-2">
          <input class="form-check-input" type="radio" name="paket" id="${modalIdPrefix}-paket-${i}" value="${paket.nama}" ${i === 0 ? 'checked' : ''}>
          <label class="form-check-label" for="${modalIdPrefix}-paket-${i}">
            ${paket.nama} - Rp${paket.harga.toLocaleString('id-ID')}
          </label>
        </div>
      `).join('')}
    `
    : `
      <div class="alert alert-danger shadow-soft" role="alert">
        <span class="alert-inner--text">Tidak ada paket yang tersedia pada produk ini</span>
      </div>
    `;

  const footerHTML = `
    <button class="btn btn-primary text-danger" data-dismiss="modal" type="button">Batal</button>
    <button class="btn btn-sm btn-primary ml-auto" id="${submitBtnId}" type="button">
      <span class="mr-1"><i class="fab fa-whatsapp"></i></span>
      Pesan via WhatsApp
    </button>
  `;

  const modalId = showModal({
    modalId: `${modalIdPrefix}-${Date.now()}`,
    labelId: `${modalIdPrefix}-label`,
    title: `Pesan Produk: ${produk.nama}`,
    body: paketHTML,
    footer: footerHTML,
    onShow: (modalEl) => {
      const submitBtn = modalEl.querySelector(`#${submitBtnId}`);
      submitBtn?.addEventListener("click", () => {
        submitBtn.blur();

        const paketNama = modalEl.querySelector('input[name="paket"]:checked')?.value;
        if (!paketNama) return showAlert("Pilih salah satu paket dulu, ya.", "error");

        const paketDipilih = produk.paket.find(p => p.nama === paketNama);
        if (!paketDipilih) return;

        // Susun pesan WhatsApp
        const pesan = `
Halo, saya ingin memesan produk berikut:

Produk: ${produk.nama}
Acara: ${produk.acara || "-"}
Tema: ${produk.tema || "-"}
Paket: ${paketDipilih.nama}
Harga: Rp${paketDipilih.harga.toLocaleString('id-ID')}

Link Produk: ${produk.link_produk || window.location.href}
        `.trim();

        const nomorWA = kontak;
        const waUrl = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesan)}`;

        // Buka WhatsApp
        window.open(waUrl, "_blank");

        closeModal(modalId);
      });
    }
  });
}


export function showModal({ modalId, labelId, title, body, footer, onShow, onHide }) {
  const modalHTML = `
    <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${labelId}">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="h6 modal-title mb-0" id="${labelId}">${title}</h2>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">${footer}</div>
        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = modalHTML;
  const modalEl = wrapper.firstElementChild;
  document.body.appendChild(modalEl);



  const $modal = $(modalEl);
  if (typeof onShow === "function") {
    $modal.on("shown.bs.modal", () => onShow(modalEl));
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          closeModal(modalId);
        }
      });
      modalEl.querySelectorAll(`[data-dismiss="modal"]`).forEach(btn => {
        btn.addEventListener('click', () => closeModal(modalId));
      });
  }
  if (typeof onHide === "function") {
    $modal.on("hidden.bs.modal", () => onHide(modalEl));
  }


  $modal.modal("show");
  return modalId;
}

function closeModal(modalId) {
  const $modal = $(`#${modalId}`);
  
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
  $modal.on("hidden.bs.modal", () => {
    $modal.remove();
  });
  $modal.modal('hide');
}
