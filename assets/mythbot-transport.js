(function () {
  'use strict';

  const DEFAULT_ENDPOINT = 'https://bot.harmonicbeacon.com/ready';
  const TIMEOUT_MS = 5000;

  function whatsappIsReady(payload) {
    return payload?.status === 'ready' && payload?.components?.whatsapp === 'ready';
  }

  async function checkTransport(endpoint) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) return false;
      return whatsappIsReady(await response.json());
    } catch (_error) {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function mount(container) {
    const ctas = container.querySelectorAll('[data-mythbot-cta]');
    const fallback = container.querySelector('[data-mythbot-fallback]');
    ctas.forEach((cta) => { cta.hidden = true; });
    if (fallback) fallback.hidden = false;

    const ready = await checkTransport(container.dataset.mythbotReadyUrl || DEFAULT_ENDPOINT);
    ctas.forEach((cta) => { cta.hidden = !ready; });
    if (fallback) fallback.hidden = ready;
    container.dataset.mythbotTransportState = ready ? 'ready' : 'unavailable';
  }

  document.querySelectorAll('[data-mythbot-transport]').forEach((container) => {
    void mount(container);
  });
}());
