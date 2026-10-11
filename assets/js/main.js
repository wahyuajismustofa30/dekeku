import { includeElement} from "./dom/include.js";
import { updateCartBadge } from "./utils/cart.js";
import dekeku, { dekekuFunction as _dF } from "./dekeku.js";


document.addEventListener('DOMContentLoaded', async () => {
  await includeElement();
  updateCartBadge();
  try{
    await _dF.waitUntilTrue(() => typeof dekeku !== "undefined" && dekeku.ready === true);
    dekeku.params = _dF.readURLParams();
    dekeku.params_1 = _dF.params.getParams();
    _dF.initDekeku();
  }catch (err) {
      console.error("❌ Gagal:", err.message);
  }  
});