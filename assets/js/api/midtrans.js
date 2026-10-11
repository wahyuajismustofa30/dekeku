export async function getPayLinkByHarga(harga) {
  try {
    const res = await fetch("https://midtrans-worker.wahyuajismustofa333.workers.dev/sandbox-transaksi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ harga })
    });

    const data = await res.json();

    if (data.snap_url) {
      return data
    } else {
      console.log("Gagal membuat pembayaran: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.log("Terjadi kesalahan: " + err.message);
  }
}