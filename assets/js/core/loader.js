export function hideLoader() {
  const loader = document.getElementById('loadingScreen');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.innerHTML = '';
      loader.className = '';
      loader.style = '';        
    }, 500);
  }
}

(function addLoaderIfNotExists() {
  if (!document.getElementById("loadingScreen")) {
    const loader = document.createElement("div");
    loader.id = "loadingScreen";
    loader.className = "loader";
    document.body.appendChild(loader);
  }
})();
