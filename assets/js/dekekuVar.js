// ========== Import ==========
import { initConfig } from "./core/dekeku.js";
import { getEnvironment } from "./utils/dekeku.js";

// ========== Global Context ==========
if (!window._dekeku) window._dekeku = {};
const _dekeku = window._dekeku;
// ========== Environment ==========
const { isDev, urlApi } = getEnvironment();
_dekeku.devMode = isDev;
_dekeku.urlApi = urlApi;

// ========== Inisialisasi ==========
async function initDekeku() {
  _dekeku.repo = await initConfig();
}
// ========== Event ==========
document.addEventListener("DOMContentLoaded", async () => {
  await initDekeku();
});
export default _dekeku;