import { updateCartBadge } from "./utils/cart.js";
import { getLSJson, addLSJson, remLSById } from "./data/localstorage.js";
import { makeGlobal } from "./utils/utils.js";
import { getPayLinkByHarga } from "./api/midtrans.js";

let keranjang = [];

document.addEventListener("DOMContentLoaded", function () {
  setupKeranjang();
  setupTombolPesan();
});
function setupKeranjang(){
    keranjang = getLSJson('keranjang');
    tampilkanKeranjang(keranjang);
    setupEventQtySelector(keranjang);
}


function tampilkanKeranjang(keranjang) {
  const cartItemEl = document.getElementById("cartItem");
  const summaryCartEl = document.getElementById("summaryCart");
  const emptyAlertEl = document.getElementById("emptyCartAlert");
  cartItemEl.innerHTML = "";

  if (keranjang.length === 0) {
    emptyAlertEl.classList.remove("d-none");
    summaryCartEl.classList.add("d-none");
    return;
  }

  emptyAlertEl.classList.add("d-none");
  summaryCartEl.classList.remove("d-none");
  cartItemEl.innerHTML = "";

  let total = 0;

  keranjang.forEach((item, index) => {
    const subtotal = item.harga * item.jumlah;
    total += subtotal;

    const itemHTML = `
      <div class="card bg-primary shadow-soft border-light p-4 mb-5">
        <div class="row align-items-center">
          <div class="col-3">
            <a href="${item.link_produk}" target="_blank"> 
              <img src="${item.img}" alt="${item.nama}" class="img-fluid"> 
            </a>
          </div>
          <div class="col">
            <div class="d-flex mb-2 font-weight-bold"> 
              <a class="h5" href="${item.link_produk}" target="_blank">${item.nama}</a> 
              <span class="h5 ml-auto">Rp${item.harga.toLocaleString()}</span> 
            </div>
            <ul class="pl-3 small">
              <li>Paket: ${item.paket}</li>
              <li>Acara: ${item.acara || '-'}</li>
              <li>Tema: ${item.tema || '-'}</li>
            </ul>
            <div class="d-flex align-items-center mt-2">
              <div class="form-group mb-0">
                <label class="h6" for="qty-${index}">Jumlah</label>
                <select class="custom-select w-auto qty-select" id="qty-${index}" data-index="${index}">
                  ${[1, 2, 3, 4].map(val => `<option value="${val}" ${val === item.jumlah ? "selected" : ""}>${val}</option>`).join('')}
                </select>
              </div>
              <div class="ml-auto">
                <a class="btn-link text-dark" data-hapus-item-keranjang="${item.id}">
                  <span class="far fa-trash-alt mr-2"></span>Hapus
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    cartItemEl.insertAdjacentHTML("beforeend", itemHTML);
  });

  document.addEventListener("click", function (e) {
    const target = e.target.closest("[data-hapus-item-keranjang]");
    if (!target) return;

    const id = target.getAttribute("data-hapus-item-keranjang");
    if (!id) return;

    remLSById (id, 'keranjang', keranjangBaru => {
    tampilkanKeranjang(keranjangBaru);
    updateCartBadge();
  });

  });

  document.getElementById("subTotalCart").innerText = `Rp${total.toLocaleString()}`;
  document.getElementById("totalCart").innerText = `Rp${total.toLocaleString()}`;
}

// ✅ Tangani perubahan jumlah quantity (qty)
function setupEventQtySelector(keranjang) {
  document.querySelectorAll(".qty-select").forEach(select => {
    select.addEventListener("change", function () {
      const index = parseInt(this.dataset.index, 10);
      const newQty = parseInt(this.value, 10);
      if (!isNaN(index) && newQty > 0) {
        keranjang[index].jumlah = newQty;
        localStorage.setItem("keranjang", JSON.stringify(keranjang));
        setupKeranjang();
        updateCartBadge();
      }
    });
  });
}


// ✅ Event tombol proses pesanan
function setupTombolPesan() {
  const tombol = document.getElementById("proses-pesanan");
  if (tombol) {
    tombol.addEventListener("click", kirimPesananKeWhatsApp);
  }
}

// ✅ Kirim detail pesanan ke WhatsApp
async function kirimPesananKeWhatsApp() {
  if (keranjang.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  let pesan = `*DETAIL PESANAN ANDA:*\n____________________________\n`;
  let order = [];
  let total = 0;
  keranjang.forEach((item, i) => {
    const subtotal = item.harga * item.jumlah;
    total += subtotal;
    pesan += `*${i + 1}. ${item.nama}*\n`;
    Object.entries(item).forEach(([key, value]) => {
      if (['nama', 'link_produk', 'harga', 'jumlah','img','id'].includes(key)) return;
      if (!value) return;

      const label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      const valueFormatted = String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      pesan += `• ${label}: ${valueFormatted}\n`;

    });
    pesan += `• Jumlah: ${item.jumlah}\n`;
    pesan += `• Subtotal: Rp${subtotal.toLocaleString()}\n`;
    pesan += `• ${item.link_produk}\n____________________________\n`;
  });
  pesan += `*TOTAL: Rp${total.toLocaleString()}*\n`;

  order = await getPayLinkByHarga(total);

  addLSJson("order", {
    order_id: order.order_id,
    snap_url: order.snap_url,
    items: keranjang,
    total: total,
    status: "pending",
    waktu: new Date().toISOString()
  });

  keranjang = [];
  localStorage.removeItem("keranjang");

  pesan += `*Link Pembayaran:* ${order.snap_url}\n\n`;
  pesan += "_Silakan konfirmasi pembayaran untuk melanjutkan proses pemesanan. Terima kasih!_";

  const encoded = encodeURIComponent(pesan);
  const waLink = `https://wa.me/${_dekeku.repo.waAdmin}?text=${encoded}`;
  window.open(waLink, "_blank");
}

makeGlobal({kirimPesananKeWhatsApp});