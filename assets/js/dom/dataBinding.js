import { handleWhatsAppFormSubmit, handleCustomWhatsAppFormSubmit } from "../form/whatsapp.js";
import { localStorageFormHandler } from "../form/localStorage.js";
import { buttonWhatsAppUndangan, handleChatOrder } from "../whatsapp/kirimPesan.js";
import {
  handleGithubPostFormSubmit,
  handleDaftarFormSubmit,
  handleMasukFormSubmit,
  handleGithubUpdateFormSubmit
} from "../form/github.js";
import { passwordToggle } from "../form/utils.js";

const FORM_HANDLERS = {
  "github-post": handleGithubPostFormSubmit,
  "github-update": handleGithubUpdateFormSubmit,
  "whatsapp": handleWhatsAppFormSubmit,
  "custom-whatsapp": handleCustomWhatsAppFormSubmit,
  "button-whatsapp-undangan": buttonWhatsAppUndangan,
  "localStorage": localStorageFormHandler,
  "daftar": handleDaftarFormSubmit,
  "masuk": handleMasukFormSubmit,
};

const EVENT_HANDLERS = {
  click: {
    "button-whatsapp-undangan": buttonWhatsAppUndangan,
    "button-whatsapp-order": handleChatOrder
  }
};

export const dataAttributeHandlers = {
  aksi: Object.fromEntries(
    Object.entries(FORM_HANDLERS).map(([key, handler]) => [
      key,
      async el => {
        el.addEventListener("submit", async e => {
          e.preventDefault();
          try {
            await handler(el);
          } catch (err) {
            console.error(`Gagal menjalankan aksi '${key}' pada elemen:`, el, err);
          }
        });
        if (el.querySelector(".toggle-password")) {
          try {
            passwordToggle();
          } catch (err) {
            console.warn("Gagal menjalankan passwordToggle:", err);
          }
        }
      }
    ])
  ),
  variabel: {
    "link-wa": el => {
      try {
        if (!_dekeku?.repo?.waAdmin) {
          throw new Error("Nomor WA belum tersedia di _dekeku.repo.waAdmin");
        }
        el.setAttribute("href", `https://wa.me/${_dekeku.repo.waAdmin}`);
        el.setAttribute("target", "_blank");
      } catch (err) {
        console.warn("Gagal menetapkan data-variabel 'link-wa':", err);
      }
    }
  }
};

export function bindDataAttributes(context = document) {
  Object.keys(dataAttributeHandlers).forEach(attrName => {
    const selector = `[data-${attrName}]:not([data-${attrName}-bound])`;
    context.querySelectorAll(selector).forEach(el => {
      const value = el.dataset[attrName];
      const handler = dataAttributeHandlers[attrName]?.[value];
      if (typeof handler === "function") {
        try {
          handler(el);
          el.setAttribute(`data-${attrName}-bound`, "true");
        } catch (err) {
          console.error(`Error memproses data-${attrName}="${value}" pada elemen:`, el, err);
        }
      } else {
        console.warn(`Handler tidak ditemukan untuk data-${attrName}="${value}"`);
      }
    });
  });
}


export function bindDataEventAttributes(context = document) {
    Object.keys(EVENT_HANDLERS).forEach(eventName => {
        const selector = `[data-event_${eventName}]:not([data-event_${eventName}-bound])`;
        context.querySelectorAll(selector).forEach(el => {
            const value = el.dataset[`event_${eventName}`];
            const handler = EVENT_HANDLERS[eventName]?.[value];
            if (typeof handler === "function") {
                try {
                    el.addEventListener(eventName, e => handler(el, e));
                    el.setAttribute(`data-event_${eventName}-bound`, "true"); // <- ini yang menandai bound
                } catch (err) {
                    console.error(`Error memproses data-event_${eventName}="${value}" pada elemen:`, el, err);
                }
            } else {
                console.warn(`Handler tidak ditemukan untuk data-event_${eventName}="${value}"`);
            }
        });
    });
}


export function observerDataAttributes() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches?.("[data-aksi], [data-variabel]")) {
            bindDataAttributes(node.parentElement || node);
          } else if (node.querySelectorAll) {
            bindDataAttributes(node);
          }

          if (node.matches?.("[data-event_click]")) {
            bindDataEventAttributes(node.parentElement || node);
          } else if (node.querySelectorAll) {
            bindDataEventAttributes(node);
          }
        }
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
