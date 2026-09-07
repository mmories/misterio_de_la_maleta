(() => {
  const STORAGE_KEY = 'misterio-maleta:mote';
  const TRIGGER = 'Aquí todavía estás a tiempo de cambiar de nombre.';
  const DEFAULT_NAME = 'Julito';
  let nickname = clean(localStorage.getItem(STORAGE_KEY)) || DEFAULT_NAME;
  let chosen = Boolean(localStorage.getItem(STORAGE_KEY));
  let chooserOpen = false;
  let resumeOnce = false;

  function clean(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[<>]/g, '')
      .slice(0, 18);
  }

  function save(value) {
    nickname = clean(value) || DEFAULT_NAME;
    chosen = true;
    localStorage.setItem(STORAGE_KEY, nickname);
    refreshDialogueName();
  }

  function refreshDialogueName() {
    const speaker = document.getElementById('speaker');
    if (speaker && speaker.textContent.trim() === 'JULITO') {
      speaker.textContent = nickname.toUpperCase();
    }

    if (!chosen) return;
    const line = document.getElementById('line');
    if (!line || !line.textContent) return;
    if (line.textContent.includes('Julio. Tu llave.')) {
      line.textContent = line.textContent.replace('Julio. Tu llave.', `${nickname}. Tu llave.`);
    }
  }

  function closeChooser(dialog) {
    chooserOpen = false;
    dialog.close();
    dialog.remove();
    resumeOnce = true;
    document.getElementById('next')?.click();
  }

  function openChooser() {
    chooserOpen = true;
    const dialog = document.createElement('dialog');
    dialog.id = 'nickname-dialog';
    dialog.setAttribute('aria-labelledby', 'nickname-title');
    dialog.innerHTML = `
      <form method="dialog" style="min-width:min(520px,82vw);max-width:620px;background:#101719;color:#fff0c9;border:2px solid #d6b36a;padding:22px;font-family:inherit;box-shadow:0 18px 60px #000b">
        <small style="letter-spacing:.16em;color:#d6b36a">RECEPCIÓN · OCTUBRE DE 1994</small>
        <h2 id="nickname-title" style="margin:.45rem 0 .35rem">¿Cómo quieres que te llamen?</h2>
        <p style="margin:0 0 1rem;opacity:.82">Pedro te da una oportunidad que no suele repetirse en una matrícula universitaria.</p>
        <div data-presets style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px"></div>
        <label style="display:block;margin:.6rem 0 .35rem">OTRO MOTE</label>
        <div style="display:flex;gap:8px">
          <input id="nickname-input" maxlength="18" autocomplete="off" placeholder="Escribe tu mote" value="${nickname === DEFAULT_NAME ? '' : nickname}" style="flex:1;min-width:0;background:#081012;color:#fff0c9;border:1px solid #7c704f;padding:10px 12px;font:inherit">
          <button id="nickname-save" type="button" style="background:#d6b36a;color:#111;border:0;padding:10px 15px;font:inherit;font-weight:700;cursor:pointer">ACEPTAR</button>
        </div>
        <p style="font-size:.78rem;opacity:.62;margin:.8rem 0 0">Se guardará en este navegador y podrás cambiarlo al volver a hablar con Pedro en una nueva partida.</p>
      </form>`;

    const presets = [DEFAULT_NAME, 'Julio', 'El Riojano'];
    const presetBox = dialog.querySelector('[data-presets]');
    presets.forEach(name => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name.toUpperCase();
      button.style.cssText = 'background:#162326;color:#fff0c9;border:1px solid #7c704f;padding:10px 8px;font:inherit;cursor:pointer';
      button.addEventListener('click', () => {
        save(name);
        closeChooser(dialog);
      });
      presetBox.append(button);
    });

    const input = dialog.querySelector('#nickname-input');
    const accept = () => {
      const value = clean(input.value);
      if (!value) {
        input.focus();
        return;
      }
      save(value);
      closeChooser(dialog);
    };
    dialog.querySelector('#nickname-save').addEventListener('click', accept);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        accept();
      }
    });
    dialog.addEventListener('cancel', event => event.preventDefault());
    document.body.append(dialog);
    dialog.showModal();
    setTimeout(() => input.focus(), 0);
  }

  document.addEventListener('click', event => {
    if (resumeOnce) {
      resumeOnce = false;
      return;
    }
    if (chooserOpen) return;
    const target = event.target.closest?.('#next, #speech');
    if (!target) return;
    const speaker = document.getElementById('speaker')?.textContent.trim();
    const line = document.getElementById('line')?.textContent.trim();
    if (speaker === 'PEDRO' && line === TRIGGER) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openChooser();
    }
  }, true);

  const observer = new MutationObserver(refreshDialogueName);
  const startObserver = () => {
    const speaker = document.getElementById('speaker');
    const line = document.getElementById('line');
    if (speaker) observer.observe(speaker, { childList: true, subtree: true, characterData: true });
    if (line) observer.observe(line, { childList: true, subtree: true, characterData: true });
    refreshDialogueName();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver);
  else startObserver();
})();
