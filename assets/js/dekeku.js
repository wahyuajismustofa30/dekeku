// assets/js/dekeku.js
// Last Update 27/08/2025 04:55 WIB 
// ========== Import ==========
import { hideLoader, initConfig, gtag } from "./core/dekeku.js";
import { loadAllData, setDataJson } from "./data/fetch.js";
import { bindDataAttributes, observerDataAttributes } from "./dom/dataBinding.js";
import { getEnvironment } from "./utils/dekeku.js";
import { showAlert, waitForCondition, getDekeku, saveDekeku, pushUniqueObj, makeFlagProxy, waitUntilTrue, updateDataAtt, flattenWithPrefix, urwah } from "./utils/utils.js";
import params, { writeURLParams, readURLParams } from "./utils/urlParams.js";

// ========== Global Context ==========
if (!window._dekeku) window._dekeku = {};
const _dekeku = window._dekeku;
export default _dekeku;

export const dekekuFunction = {
  waitForCondition,
  loadAllData,
  pushUniqueObj,
  writeURLParams,
  readURLParams,
  setDataJson,
  showAlert,
  makeFlagProxy,
  initDekeku,
  waitUntilTrue,
  updateDataAtt,
  flattenWithPrefix,
  params
};

// ========== Inisialisasi ==========
async function init() {
  urwah();
  const cachedDekeku = getDekeku();

  if (cachedDekeku) {
    console.log("Memuat dekeku dari cache");
    Object.assign(_dekeku, cachedDekeku);
  } else {
    console.log("Memuat dekeku dari server");
    _dekeku.repo = await initConfig();
    const { isDev, urlApi } = getEnvironment();
    _dekeku.devMode = isDev;
    _dekeku.urlApi = urlApi;
    _dekeku.daftarJson = _dekeku.daftarJson || [];
    _dekeku.prosesJs = 0;
  }
    
  for (const [key, fn] of Object.entries(dekekuFunction)) {
    if (typeof fn === "function") {
      _dekeku.function ??= {};
      _dekeku.function[key] = fn;
    }
  }
  _dekeku.proxy = {};    
  _dekeku.proxy.loadFile = makeFlagProxy(loadAllData);
  _dekeku.proxy.saveDekeku = makeFlagProxy(saveDekeku);
  console.log(_dekeku.devMode ? "Huff.. 🛠️" : "Yatta!..🚀");
}


// ========== Selesai ==========
function selesai() {
  waitForCondition(
    () => _dekeku.prosesJs === 0,
    () => 
      hideLoader(),
    _dekeku.proxy.saveDekeku.value = true,
    {
      interval: 100,
      timeout: 5000,
      onTimeout: () => {
        _dekeku.prosesJs = 0;
        console.warn("hideLoader() dijalankan paksa karena proses terlalu lama.");
        hideLoader();
      }
    }
  );
}


function initDekeku() {
  _dekeku.prosesJs += 1;
  gtag();
  bindDataAttributes();
  observerDataAttributes();  
  _dekeku.prosesJs -= 1;
  selesai();
}

// ========== Event ==========
document.addEventListener("DOMContentLoaded", async () => {
  await init();
  _dekeku.ready = true;

});