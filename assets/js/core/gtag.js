export function gtag() {
  const isValidID = /^[A-Z0-9\-]+$/.test(_dekeku.repo.googleAnalitik);
  if (!isValidID) {
    console.warn("ID GTag tidak valid:", _dekeku.repo.googleAnalitik);
    return;
  }
  
  if (window._gtagInitialized) return;
  window._gtagInitialized = true;
  
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${_dekeku.repo.googleAnalitik}`;

  const inlineScript = document.createElement('script');
  inlineScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${_dekeku.repo.googleAnalitik}');
  `;

  const head = document.head || document.getElementsByTagName('head')[0];
  head.appendChild(gtagScript);
  head.appendChild(inlineScript);
}
