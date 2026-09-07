(() => {
  const SAVE_KEY = 'misterio-maleta:partida-v1';
  const OLD_NICK_KEY = 'misterio-maleta:mote';
  const DEFAULT_NAME = 'Julito';

  const clean = value => String(value || '').trim().replace(/\s+/g, ' ').replace(/[<>]/g, '').slice(0, 18);
  const readSave = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; } };
  const currentNickname = () => clean(readSave()?.state?.nickname || localStorage.getItem(OLD_NICK_KEY)) || DEFAULT_NAME;
  const clearProgress = () => { try { localStorage.removeItem(SAVE_KEY); } catch {} };

  function writeNickname(value) {
    const nickname = clean(value) || DEFAULT_NAME;
    localStorage.setItem(OLD_NICK_KEY, nickname);
    window.dispatchEvent(new CustomEvent('maleta-set-nickname', {detail:{nickname}}));
    return nickname;
  }

  function makeButton(label, id) {
    const b = document.createElement('button');
    b.type = 'button';
    if (id) b.id = id;
    b.textContent = label;
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
        <p class="nickname-note">El cambio se aplica inmediatamente y se conserva en esta partida.</p>
        <button id="nickname-cancel" type="button">CANCELAR</button>
      </form>`;

    const apply = value => {
      const nickname = writeNickname(value);
      dialog.close();
      dialog.remove();
      window.dispatchEvent(new CustomEvent('maleta-nickname-changed', {detail:{nickname}}));
    };

    const holder = dialog.querySelector('.nickname-presets');
    ['Julito','Topo','El Riojano'].forEach(name => {
      const b = makeButton(name.toUpperCase());
      b.addEventListener('click', () => apply(name));
      holder.append(b);
    });

    const input = dialog.querySelector('#nickname-input');
    dialog.querySelector('#nickname-accept').addEventListener('click', () => {
      const value = clean(input.value);
      if (!value) { input.focus(); return; }
      apply(value);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        dialog.querySelector('#nickname-accept').click();
      }
    });
    dialog.querySelector('#nickname-cancel').addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });
    dialog.addEventListener('cancel', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    setTimeout(() => input.select(), 0);
  }

  function decorateStableUI() {
    const oldNicknameButton = document.getElementById('nickname-settings');
    if (oldNicknameButton) oldNicknameButton.remove();

    const titleButtons = document.querySelector('.title-buttons');
    if (titleButtons && !document.getElementById('new-game')) {
      const fresh = makeButton('NUEVA PARTIDA', 'new-game');
      fresh.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!confirm('¿Empezar desde cero? Se borrará el avance guardado de este episodio.')) return;
        clearProgress();
        location.reload();
      });
      titleButtons.insertBefore(fresh, document.getElementById('credits'));
    }
  }

  function updateStartOnce() {
    const start = document.getElementById('start');
    const newGame = document.getElementById('new-game');
    if (!start || start.disabled) return;
    const canContinue = Boolean(readSave()?.state?.introCompleted);
    if (canContinue) {
      start.textContent = 'CONTINUAR';
      start.dataset.resume = 'true';
      if (newGame) newGame.hidden = false;
    } else {
      delete start.dataset.resume;
      if (newGame) newGame.hidden = true;
    }
  }

  document.addEventListener('click', event => {
    const start = event.target.closest?.('#start');
    if (!start || start.dataset.resume !== 'true') return;
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})), 120);
  }, true);

  document.addEventListener('click', event => {
    if (event.target.closest?.('#again')) clearProgress();
  }, true);

  window.MaletaNickname = {open: openNicknameDialog, current: currentNickname};

  const boot = () => {
    decorateStableUI();
    setTimeout(updateStartOnce, 300);
    setTimeout(updateStartOnce, 1200);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
