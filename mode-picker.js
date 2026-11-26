(() => {
  function bindPicker(selectId, selectorAttribute, datasetKey, fallback) {
    const select = document.getElementById(selectId);
    const cards = [...document.querySelectorAll(`[${selectorAttribute}]`)];
    if (!select || !cards.length) return;

    function syncSelected(value) {
      cards.forEach(card => {
        card.setAttribute('aria-pressed', String(card.dataset[datasetKey] === value));
      });
    }

    cards.forEach(card => card.addEventListener('click', () => {
      select.value = card.dataset[datasetKey];
      syncSelected(select.value);
      select.dispatchEvent(new Event('change', {bubbles: true}));
    }));
    select.addEventListener('change', () => syncSelected(select.value));
    syncSelected(select.value || fallback);
  }

  bindPicker('sessionGameplayMode', 'data-game-mode', 'gameMode', 'classic');
  bindPicker('sessionOrderMode', 'data-order-mode', 'orderMode', 'fixed');
})();
