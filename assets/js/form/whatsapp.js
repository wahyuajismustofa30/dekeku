export async function handleWhatsAppFormSubmit(form){
  const keterangan = form.dataset.keterangan || '';
  const heading = keterangan ? `*${keterangan.toUpperCase()}*\n\n` : '';
  const fields = form.querySelectorAll('input[name], textarea[name], select[name]');
  let pesan = heading;

  fields.forEach(field => {
    const name = field.name;
    const label = name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const value = field.value.trim();
    if (value) {
      pesan += `${label}: ${value}\n`;
    }
  });

  const waURL = `https://wa.me/${_dekeku.repo.waAdmin}?text=${encodeURIComponent(pesan)}`;
  window.open(waURL, '_blank');  
}
export async function handleCustomWhatsAppFormSubmit(form){
  const keterangan = form.dataset.keterangan || '';
  const kontak = form.dataset.kontak || '6285161517176';
  const heading = keterangan ? `*${keterangan.toUpperCase()}*\n\n` : '';
  const fields = form.querySelectorAll('input[name], textarea[name], select[name]');
  let pesan = heading;

  fields.forEach(field => {
    const name = field.name;
    const label = name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const value = field.value.trim();
    if (value) {
      pesan += `${label}: ${value}\n`;
    }
  });

  const waURL = `https://wa.me/${kontak}?text=${encodeURIComponent(pesan)}`;
  window.open(waURL, '_blank');  
}