(function(global) {
  function showAlert(message, type = 'info', duration = 3000) {
    const existing = document.getElementById('wrapperAlert');
    if (existing){
      existing.remove();
    }
    const typeMap = {
      error: 'danger',
      success: 'success',
      info: 'info',
      warning: 'warning'
    };
    type = typeMap[type] || type;
    
    const wrapper = document.createElement('div');
    wrapper.id = 'wrapperAlert';
    wrapper.className = 'position-fixed start-50 translate-middle-x mt-3';
    wrapper.style.zIndex = '1055';
    wrapper.style.width = '80vw';
    wrapper.style.top = '20px';
    wrapper.style.left = '50%';
    wrapper.style.transform = 'translateX(-50%)';

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} shadow-soft`;
    alert.role = 'alert';

    const messageSpan = document.createElement('span');
    messageSpan.className = 'alert-inner--text';
    messageSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'close';
    closeBtn.setAttribute('data-dismiss', 'alert');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `<span aria-hidden="true">&times;</span>`;

    alert.appendChild(closeBtn);
    alert.appendChild(messageSpan);
    wrapper.appendChild(alert);
    document.body.appendChild(wrapper);

    // Auto-close jika durasi > 0
    if (duration > 0) {
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => wrapper.remove(), 300);
      }, duration);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function copyToClipboard(text) {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
  }

  function formatDate(date = new Date()) {
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      date.getFullYear()
    ].join('/');
  }

  function getFormData(formElement) {
    const formData = new FormData(formElement);
    return Object.fromEntries(formData.entries());
  }

  function debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

function waitForVariable(valueGetter, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      try {
        const value = valueGetter();
        if (value && typeof value === 'object' && Object.keys(value).length > 0) {
          resolve(value);
        } else if (typeof value === 'string' && value.trim() !== '') {
          resolve(value);
        } else if (Array.isArray(value) && value.length > 0) {
          resolve(value);
        } else if (Date.now() - start >= timeout) {
          reject(new Error(`Variabel tidak tersedia dalam ${timeout}ms`));
        } else {
          setTimeout(check, 100);
        }
      } catch (e) {
        if (Date.now() - start >= timeout) {
          reject(new Error(`Variabel error atau belum tersedia dalam ${timeout}ms`));
        } else {
          setTimeout(check, 100);
        }
      }
    };

    check();
  });
}


  const utils = {
    showAlert,
    sleep,
    copyToClipboard,
    formatDate,
    getFormData,
    debounce,
    waitForVariable,
  };

  // Simpan sebagai utils
  global.utils = utils;

  // Ekspor semua fungsi ke global (window)
  Object.entries(utils).forEach(([key, value]) => {
    global[key] = value;
  });

})(window);
