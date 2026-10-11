async function loadComponentContent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Gagal memuat ${url}`);
    const html = await response.text();
    el.innerHTML = html;
  } catch (err) {
    console.error(err);
    el.innerHTML = "<p class='text-danger'>Gagal memuat konten</p>";
  }
}
export async function includeElement() {
  await Promise.all([
    loadComponentContent("#header-global", "/component/header.html"),
    loadComponentContent("#footer-global", "/component/footer.html")
  ]);
}