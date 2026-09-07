(() => {
  const SAVE_KEY = 'misterio-maleta:partida-v1';
  const OLD_NICK_KEY = 'misterio-maleta:mote';
  const DEFAULT_NAME = 'Julito';

  const clean = value => String(value || '').trim().replace(/\s+/g, ' ').replace(/[<>]/g, '').slice(0, 18);
  const readSave = () => {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
  };
  const writeNickname = value => {
    const nickname = clean(value) || DEFAULT_NAME;
    let save = readSave();
    if (!save || !save.state) save = {version:1,savedAt:Date.now(),state:{introCompleted:false,nickname}};
    save.version = 1;
    save.savedAt = Date.now();
    save.state.nickname = nickname;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    localStorage.setItem(OLD_NICK_KEY, nickname);
    return nickname;
  };
  const currentNickname = () => clean(readSave()?.state?.nickname || localStorage.getItem(OLD_NICK_KEY)) || DEFAULT_NAME;

  function button(label, id, title) {
    const b = document.createElement('button');
    b.id = id;
    b.type = 'button';
    b.textContent = label;
    if (title) b.title = title;
    return b;
  }

  function openNicknameDialog() {
    if (document.getElementById('nickname-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'nickname-dialog';
    dialog.innerHTML = `
      <form method="dialog" class="nickname-screen">
        <small>FICHA DEL RESIDENTE · OCTUBRE DE 1994</small>
        <h2>Tu mote en el Colegio Mayor</h2>
        <p>Pedro puede equivocarse con una llave, pero no debería equivocarse con tu mote.</p>
        <div class="nickname-presets"></div>
        <label for="nickname-input">OTRO MOTE</label>
        <div class="nickname-custom">
          <input id="nickname-input" maxlength="18" autocomplete="off" value="${currentNickname()}" aria-label="Nuevo mote">
          <button id="nickname-accept" type="button">GUARDAR</button>
        </div>
        <p class="nickname-note">El cambio se conserva en este navegador. Al guardarlo se recarga la partida en el mismo punto para que todos los diálogos usen el nuevo mote.</p>
        <button id="nickname-cancel" type="button">CANCELAR</button>
      </form>`;
    const presets = ['Julito', 'Topo', 'El Riojano'];
    const holder = dialog.querySelector('.nickname-presets');
    const apply = value => {
      const nickname = writeNickname(value);
      dialog.close();
      dialog.remove();
      sessionStorage.setItem('misterio-maleta:resume-after-nick', '1');
      sessionStorage.setItem('misterio-maleta:nick-toast', nickname);
      location.reload();
    };
    presets.forEach(name => {
      const b = button(name.toUpperCase(), '', 'Usar este mote');
      b.addEventListener('click', () => apply(name));
      holder.append(b);
    });
    const input = dialog.querySelector('#nickname-input');
    dialog.querySelector('#nickname-accept').addEventListener('click', () => {
      if (!clean(input.value)) { input.focus(); return; }
      apply(input.value);
    });
    input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); dialog.querySelector('#nickname-accept').click(); } });
    dialog.querySelector('#nickname-cancel').addEventListener('click', () => { dialog.close(); dialog.remove(); });
    dialog.addEventListener('cancel', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    setTimeout(() => input.select(), 0);
  }

  function enhanceUI() {
    const settings = document.querySelector('.settings');
    if (settings && !document.getElementById('nickname-settings')) {
      const nick = button('MOTE', 'nickname-settings', 'Cambiar mote del protagonista');
      nick.addEventListener('click', openNicknameDialog);
      settings.insertBefore(nick, document.getElementById('help'));
    }

    const titleButtons = document.querySelector('.title-buttons');
    const start = document.getElementById('start');
    const save = readSave();
    const canContinue = Boolean(save?.state?.introCompleted);
    if (start && canContinue) {
      start.textContent = 'CONTINUAR';
      start.dataset.resume = 'true';
    }
    if (titleButtons && !document.getElementById('new-game')) {
      const fresh = button('NUEVA PARTIDA', 'new-game');
      fresh.hidden = !canContinue;
      fresh.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!confirm('¿Empezar desde cero? Se borrará el avance guardado de este episodio.')) return;
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(OLD_NICK_KEY);
        globalThis.__maletaForceNewGame = true;
        location.reload();
      });
      titleButtons.insertBefore(fresh, document.getElementById('credits'));
    }

    // Continue skips the cinematic but reuses the game's own Enter/Escape path,
    // preserving all restored state and avoiding duplicated scene logic.
    document.addEventListener('click', event => {
      const target = event.target.closest?.('#start');
      if (!target || target.dataset.resume !== 'true') return;
      setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})), 80);
    }, true);

    const resumeAfterNick = sessionStorage.getItem('misterio-maleta:resume-after-nick');
    if (resumeAfterNick && canContinue && start) {
      sessionStorage.removeItem('misterio-maleta:resume-after-nick');
      setTimeout(() => start.click(), 180);
    }
  }

  const observer = new MutationObserver(() => {
    const start = document.getElementById('start');
    if (start && !start.disabled) {
      const save = readSave();
      if (save?.state?.introCompleted) { start.textContent = 'CONTINUAR'; start.dataset.resume = 'true'; }
    }
  });

  const boot = () => {
    enhanceUI();
    const start = document.getElementById('start');
    if (start) observer.observe(start, {attributes:true, childList:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
