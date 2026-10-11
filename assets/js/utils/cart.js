// utils/cart.js

function getCart() {
  return JSON.parse(localStorage.getItem('keranjang')) || [];
}

function setCart(cart) {
  localStorage.setItem('keranjang', JSON.stringify(cart));
}

export function addToCart(item, onSuccess) {
  if (!item || !item.id || !item.nama) {
    console.warn("Item tidak valid untuk dimasukkan ke keranjang.", item);
    return;
  }

  const cart = getCart();
  
  const existingIndex = cart.findIndex(p => p.id === item.id && p.harga === item.harga);

  if (existingIndex !== -1) {
    cart[existingIndex].jumlah += item.jumlah || 1;
  } else {
    cart.push({ ...item, jumlah: item.jumlah || 1 });
  }

  setCart(cart);

  const message = `${item.nama} berhasil ditambahkan ke keranjang!`;
  if (typeof onSuccess === "function") {
    onSuccess(message, 'success');
  } else {
    showAlert?.(message, 'success');
  }
}

export function updateCartBadge() {
  try {
    const rawData = localStorage.getItem('keranjang');
    if (!rawData) return;

    const keranjang = JSON.parse(rawData);
    const totalJumlah = keranjang.reduce((total, item) => total + (item.jumlah || 0), 0);

    const badge = document.getElementById('cartCount');

    if (badge) {
      badge.textContent = totalJumlah;
      badge.style.display = totalJumlah > 0 ? 'inline-block' : 'none';
    }
  } catch (e) {
    console.warn('Gagal membaca keranjang:', e);
  }
}

export function hapusItemCart(keranjang,index) {
  keranjang.splice(index, 1);
  localStorage.setItem("keranjang", JSON.stringify(keranjang));
  setupKeranjang();
  updateCartBadge();
}

export { getCart, setCart };
