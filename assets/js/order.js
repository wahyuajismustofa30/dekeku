let order = [];


document.addEventListener("DOMContentLoaded", async function () {
  await getPembayaranMidtrans();
  cekDanUpdateOrderKadaluarsa();
  order = await getLSJson('order');
  tampilkanOrder(order);
});


async function getPembayaranMidtrans() {
  pembayaran_action = getURLParams("pembayaran");
  if (pembayaran_action === "midtrans") {
    pembayaran();
  } else {
    order = await getLSJson('order');
  }
}
// ========================= JSON helper functions =========================
function updateJson(data, key, value, updatedData) {
  const index = data.findIndex(order => order[key] === value);
  if (index === -1) {
    console.warn(`${key} dengan nilai '${value}' tidak ditemukan dalam data.`);
    return;
  }

  data[index] = {
    ...data[index],
    ...updatedData
  };
  return data;
}
// ========================= LS Functions =========================
function cekDanUpdateOrderKadaluarsa() {
  let updated = false;
  const now = new Date();

  const updatedOrders = order.map(o => {
    const orderDate = new Date(o.waktu);
    const selisihMs = now - orderDate;
    const satuHariMs = 24 * 60 * 60 * 1000;

    if (selisihMs > satuHariMs && o.status !== 'paid' && o.status !== 'expire') {
      updated = true;
      return {
        ...o,
        status: 'expire',
        updatedAt: new Date().toISOString()
      };
    }

    return o;
  });

  if (updated) {
    order = updatedOrders;
    localStorage.setItem("order", JSON.stringify(order));
  }
}

// ========================= Local Storage JSON helper functions =========================
async function getLSJson(item) {
  const data = localStorage.getItem(item);
  return data ? JSON.parse(data) : [];
}

function addLSJson(nama, json) {
  try {
    const tersimpan = localStorage.getItem(nama);
    if (tersimpan) {
      data = JSON.parse(tersimpan);
      
      if (!Array.isArray(data)) {
        console.warn(`Data di '${nama}' bukan array. Akan ditimpa sebagai array.`);
        data = [];
      }
    }
  } catch (e) {
    console.warn(`Gagal parse data dari localStorage key '${nama}':`, e);
  }
  
  data.push(json);

  localStorage.setItem(nama, JSON.stringify(data));
}

async function updateLSJson(LS, key, value, updatedData) {
  let data = await getLSJson(LS);

  const index = data.findIndex(order => order[key] === value);
  if (index === -1) {
    console.warn(`Order ID '${value}' tidak ditemukan.`);
    return false;
  }

  data[index] = {
    ...data[index],
    ...updatedData
  };

  localStorage.setItem(LS, JSON.stringify(data));
  return true;
}

// ========================= Params Functions =========================
function getURLParams(namaparam) {
  const params = new URLSearchParams(window.location.search);

  if (namaparam) {
    return params.get(namaparam);
  }

  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

// ========================= Display Order Functions =========================
function tampilkanOrder(order) {
  const orderItemEl = document.getElementById("orderItem");
  const emptyAlertEl = document.getElementById("emptyOrderAlert");

  orderItemEl.innerHTML = "";

  if (order.length === 0) {
    emptyAlertEl.classList.remove("d-none");
    return;
  }

  emptyAlertEl.classList.add("d-none");

  order.reverse().forEach(order => {
    const waktu = new Date(order.waktu).toLocaleString("id-ID");

    // Tentukan warna badge berdasarkan status
    let statusClass = "dark";
    switch ((order.status || "").toLowerCase()) {
      case "paid":
        statusClass = "success";
        break;
      case "pending":
        statusClass = "secondary";
        break;
      case "expire":
      case "denied":
      case "unknown":
        statusClass = "danger";
        break;
    }
    switch ((order.status || "").toLowerCase()) {
      case "paid":
        button = `
          <a href="https://wa.me/${_dekeku.repo.waAdmin}?text=Saya%20sudah%20melakukan%20pembayaran%20untuk%20pesanan%20dengan%20ID%20${order.order_id}" class="btn btn-sm btn-primary" target="_blank">
            <i class="fab fa-whatsapp"></i> Konfirmasi
          </a>`;
        break;
      case "pending":
        button = `
          <a href="${order.snap_url}" class="btn btn-sm btn-primary" target="_blank">
            <i class="fas fa-wallet"></i> Bayar Sekarang
          </a>`;
        break;
      case "expire":
      case "denied":
      case "unknown":
        button = `
          <div class="btn btn-sm btn-primary disable" target="_blank">
            <i class="fas fa-wallet"></i> Bayar Sekarang
          </div>`;
        break;
    }  

    const itemList = order.items.map(item => `
      <div class="d-flex mb-3 p-2 border-light rounded shadow-inset align-items-center gap-3 flex-wrap">
        <img src="${item.img}" alt="${item.nama}" class="rounded" style="width: 80px; height: auto;">
        <div>
          <a href="${item.link_produk}" target="_blank" class="fw-semibold text-dark text-decoration-none">${item.nama}</a>
          <div class="text-muted small">Paket: ${item.paket} | Harga: Rp${item.harga.toLocaleString("id-ID")} x ${item.jumlah}</div>
        </div>
      </div>
    `).join("");
    
    const button_paid = `
    <button class="btn btn-sm btn-danger" onclick="batalkanOrder('${order.order_id}')">Batalkan</button>
    `;

    const card = `
      <div class="mb-4 rounded p-3 shadow-inset border-light">
        <div class="d-flex justify-content-between mb-2">
          <div><strong>Order ID:</strong> ${order.order_id}</div>
          <div class="text-muted small">${waktu}</div>
        </div>
        ${itemList}
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div>
            <strong>Total: Rp${order.total.toLocaleString("id-ID")}</strong><br>
          </div>
          <span class="badge badge-${statusClass} text-uppercase">${order.status || 'unknown'}</span>
          ${button}
        </div>
      </div>
    `;
    orderItemEl.insertAdjacentHTML("beforeend", card);
  });
}

// ========================= Midtrans Handlers =========================

async function pembayaran() {
  order = await getLSJson('order');
  orderId_midtrans = getURLParams("order_id");
  console.log("orderId_midtrans:", orderId_midtrans);
  if (orderId_midtrans) {
    const updatedOrder = order.find(o => o.order_id === orderId_midtrans);
    console.log("updatedOrder:", updatedOrder);
    if (updatedOrder) {
      const status_midtrans = getURLParams("status_code");
      console.log("status_midtrans:", status_midtrans);
      if (status_midtrans === "200") {
        status_pembayaran = "paid";
      } else if (status_midtrans === "201") {
        status_pembayaran = "pending";
      } else if (status_midtrans === "202") {
        status_pembayaran = "denied";
      } else {
        status_pembayaran = "unknown";
      }
      updatedOrder.status = status_pembayaran;
      console.log("status_pembayaran:", status_pembayaran);
      order = updateJson(order, 'order_id', orderId_midtrans, { status: status_pembayaran });
      localStorage.setItem("order", JSON.stringify(order));
      hapusSemuaURLParam();
    } else {
      console.warn(`Order ID '${orderId_midtrans}' tidak ditemukan.`);
    }
  } else {
  console.warn("Tidak ada order_id di URL.");
  }
}
function hapusSemuaURLParam() {
  const url = new URL(window.location.href);
  url.search = ''; // hapus semua query string
  window.history.replaceState({}, '', url.toString());
}
