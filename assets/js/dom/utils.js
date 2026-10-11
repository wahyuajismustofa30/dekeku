export function wrapElement(el, wrapper) {
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
}


export function getUniqueId(prefix) {
  let index = 1;
  let id;
  do {
    id = `${prefix}-${index}`;
    index++;
  } while (document.getElementById(id));
  return id;
}