(() => {
  function bindPicker(selectId, attribute, fallback) {
    const select = document.getElementById(selectId);
    const cards = [...document.querySelectorAll(`[data-${attribute}]`)];
    if (!select || !cards.length) return;

    function syncSelected(value) {
      cards.forEach(card => {
        card.setAttribute('aria-pressed', String(card.dataset[attribute] === value));
      });
    }

    cards.forEach(card => card.addEventListener('click', () => {
      select.value = card.dataset[attribute];
      syncSelected(select.value);
      select.dispatchEvent(new Event('change', {bubbles: true}));
    }));
    select.addEventListener('change', () => syncSelected(select.value));
    syncSelected(select.value || fallback);
  }

  bindPicker('sessionGameplayMode', 'gameMode', 'classic');
  bindPicker('sessionOrderMode', 'orderMode', 'fixed');
})();
