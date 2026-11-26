(() => {
  const select = document.getElementById('sessionGameplayMode');
  const cards = [...document.querySelectorAll('[data-game-mode]')];
  if (!select || !cards.length) return;

  function syncSelected(value) {
    cards.forEach(card => {
      const selected = card.dataset.gameMode === value;
      card.setAttribute('aria-pressed', String(selected));
    });
  }

  cards.forEach(card => card.addEventListener('click', () => {
    select.value = card.dataset.gameMode;
    syncSelected(select.value);
    select.dispatchEvent(new Event('change', {bubbles: true}));
  }));
  select.addEventListener('change', () => syncSelected(select.value));
  syncSelected(select.value || 'classic');
})();
