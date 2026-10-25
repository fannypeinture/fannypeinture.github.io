// Progressive activation: until the server is configured, the working callback link remains.
(async () => {
  const target = document.getElementById('phone-contact');
  if (!target) return;
  let config;
  try {
    const r = await fetch('content/site-settings.json', { cache: 'no-cache' }); config = await r.json();
    if (!config.phoneEndpoint || !config.turnstileSiteKey || new URL(config.phoneEndpoint).protocol !== 'https:') return;
  } catch { return; }
  const button = document.createElement('button'); button.type = 'button'; button.className = 'button'; button.textContent = 'Afficher le numéro';
  target.prepend(button);
  target.lastElementChild.style.display = 'block';
  const dialog = document.createElement('dialog'); dialog.className = 'phone-modal';
  dialog.innerHTML = '<button type="button" class="modal-close" aria-label="Fermer">×</button><h2>Contacter Fanny</h2><p>Une vérification rapide permet d’afficher le numéro.</p><div id="turnstile-box"></div><p class="phone-status" role="status"></p><div class="phone-result"></div>';
  document.body.append(dialog); dialog.querySelector('.modal-close').onclick = () => dialog.close();
  let widgetId;
  let loader;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (!loader) loader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
    return loader;
  }
  button.onclick = async () => {
    dialog.showModal();
    const status = dialog.querySelector('.phone-status'); status.textContent = '';
    try {
      await loadTurnstile();
      if (widgetId !== undefined) window.turnstile.remove(widgetId);
      widgetId = window.turnstile.render('#turnstile-box', {
        sitekey: config.turnstileSiteKey, action: 'reveal_phone', language: 'fr',
        callback: async token => {
          status.textContent = 'Vérification en cours…';
          try {
            const r = await fetch(config.phoneEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
            if (!r.ok) throw new Error();
            const data = await r.json();
            if (!/^\+\d{8,15}$/.test(data.phone)) throw new Error();
            const link = document.createElement('a'); link.href = `tel:${data.phone}`; link.className = 'button';
            link.textContent = `${data.display || data.phone} — Appeler Fanny`;
            dialog.querySelector('.phone-result').replaceChildren(link); status.textContent = '';
          } catch { status.textContent = 'Le numéro n’a pas pu être affiché. Vous pouvez demander à être rappelé avec le formulaire.'; }
        },
        'error-callback': () => { status.textContent = 'Vérification indisponible. Le formulaire de contact reste accessible.'; }
      });
    } catch { status.textContent = 'Vérification indisponible. Le formulaire de contact reste accessible.'; }
  };
})();
