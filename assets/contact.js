(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const subject = document.getElementById('prestation');
  const message = document.getElementById('message');
  const status = document.getElementById('form-status');
  const button = form.querySelector('[type=submit]');
  const templates = {
    enduits: 'Bonjour Fanny, je souhaite préparer ou reprendre des surfaces.\n\nPièce(s), état des supports et surfaces approximatives : ',
    peinture: 'Bonjour Fanny, je souhaite un devis de peinture intérieure.\n\nPièce(s), murs ou plafonds, surfaces et résultat souhaité : ',
    decoration: 'Bonjour Fanny, je souhaite un enduit décoratif.\n\nPièce(s), surface(s) et effet recherché : ',
    revetements: 'Bonjour Fanny, je souhaite faire poser de la fibre ou du papier peint.\n\nPièce(s), état des supports et revêtement envisagé : ',
    global: 'Bonjour Fanny, je souhaite vous présenter un projet avec plusieurs prestations.\n\nMon projet : ',
    autre: 'Bonjour Fanny, je souhaite vous contacter au sujet de : '
  };
  let generated = '';
  function choose(key) {
    if (!Object.hasOwn(templates, key)) return;
    subject.value = key;
    if (!message.value.trim() || message.value === generated) { generated = templates[key]; message.value = generated; }
    message.setCustomValidity('');
  }
  subject.addEventListener('change', () => choose(subject.value));
  message.addEventListener('input', () => message.setCustomValidity(''));
  const requested = new URLSearchParams(location.search).get('prestation');
  if (requested) choose(requested);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.sending === 'true') return;
    if (generated && message.value.trim() === generated.trim()) {
      message.setCustomValidity('Ajoutez quelques détails à votre projet.'); message.reportValidity(); return;
    }
    if (!form.reportValidity()) return;
    if (document.getElementById('website').value) { status.textContent = 'L’envoi n’a pas pu être effectué.'; return; }
    form.dataset.sending = 'true'; button.disabled = true; status.textContent = 'Envoi de votre demande…';
    const original = button.innerHTML;
    button.textContent = 'Envoi en cours…';
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('not-confirmed');
      window.location.assign('merci.html');
    } catch {
      status.textContent = 'La transmission n’a pas été confirmée. Votre message est conservé dans ce formulaire : vérifiez votre connexion et réessayez.';
      button.disabled = false; button.innerHTML = original; form.dataset.sending = 'false';
    }
  });
})();
