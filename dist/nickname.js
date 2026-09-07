(() => {
  const SAVE_KEY = 'misterio-maleta:partida-v1';
  const OLD_NICK_KEY = 'misterio-maleta:mote';
  const DEFAULT_NAME = 'Julito';
  let resumeBound = false;
  let dialogueBound = false;

  const clean = value => String(value || '').trim().replace(/\s+/g, ' ').replace(/[<>]/g, '').slice(0, 18);
  const readSave = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; } };
  const currentNickname = () => clean(readSave()?.state?.nickname || localStorage.getItem(OLD_NICK_KEY)) || DEFAULT_NAME;
  const clearProgress = () => { try { localStorage.removeItem(SAVE_KEY); } catch {} };

  function writeNickname(value) {
    const nickname = clean(value) || DEFAULT_NAME;
    let save = readSave();
    if (!save || !save.state) save = {version:1,savedAt:Date.now(),state:{introCompleted:false,nickname}};
    save.version = 1;
    save.savedAt = Date.now();
    save.state.nickname = nickname;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    localStorage.setItem(OLD_NICK_KEY, nickname);
    return nickname;
  }

  function button(label, id, title) {
    const b = document.createElement('button');
    b.type = 'button';
    if (id) b.id = id;
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
        <p class="nickname-note">Se conserva en este navegador. Al guardarlo se recarga una sola vez; después pulsa CONTINUAR para volver a la partida con el nuevo mote.</p>
        <button id="nickname-cancel" type="button">CANCELAR</button>
      </form>`;
    const holder = dialog.querySelector('.nickname-presets');
    const apply = value => {
      const nickname = writeNickname(value);
      sessionStorage.setItem('misterio-maleta:nick-toast', nickname);
      sessionStorage.removeItem('misterio-maleta:resume-after-nick');
      location.reload();
    };
    ['Julito','Topo','El Riojano'].forEach(name => {
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

  function bindResume() {
    if (resumeBound) return;
    resumeBound = true;
    document.addEventListener('click', event => {
      const target = event.target.closest?.('#start');
      if (!target || target.dataset.resume !== 'true') return;
      setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})), 90);
    }, true);
  }

  function decorateStart() {
    const start = document.getElementById('start');
    const newGame = document.getElementById('new-game');
    const save = readSave();
    const canContinue = Boolean(save?.state?.introCompleted);
    if (!start) return;
    if (canContinue) {
      if (start.textContent !== 'CONTINUAR') start.textContent = 'CONTINUAR';
      start.dataset.resume = 'true';
      if (newGame) newGame.hidden = false;
    } else {
      delete start.dataset.resume;
      if (!start.disabled && start.textContent === 'CONTINUAR') start.textContent = 'COMENZAR';
      if (newGame) newGame.hidden = true;
    }
    bindResume();
  }

  function refineDialogueText() {
    const line = document.getElementById('line');
    if (!line || !line.textContent) return;
    const exact = line.textContent;
    const replacements = new Map([
      ['Muy bien, [MOTE]. Intentaré recordarlo.', `Muy bien, ${currentNickname()}. Intentaré recordarlo.`],
      ['Yo soy María. Dime una cosa importante: ¿bailas salsa?', 'Yo soy María. Esta noche estamos intentando montar una clase de salsa. Dime una cosa importante: ¿bailas salsa?'],
      ['Definitivamente, en el CMD el nivel de las chicas supera al de mis pasos de baile.', 'Con la salsa voy a necesitar más de una clase. Con las excusas, en cambio, creo que puedo convalidar créditos.'],
      ['La cantera del Madrid. Hablan de un chaval de 17 años que promete mucho.', 'Raúl González, 17 años. Apuntaré el nombre por si acaso.'],
      ['Un paquete blando de tabaco, bastante arrugado.', 'Un paquete blando de Fortuna, bastante arrugado. Por una vez, el nombre de la marca parece una descripción del hallazgo.'],
      ['Todavía quedan algunos cigarrillos. El anterior dueño cuidaba mejor el sofá que el paquete.', 'Todavía quedan algunos cigarrillos. Menos mal: mi madre me quitó el tabaco de la maleta antes de salir. Según ella era por mi bien. Según yo, era un intento de asesinato a medio plazo.'],
      ['Un paquete de tabaco. Por fin alguien ha dejado una bienvenida con futuro.', 'Un paquete de Fortuna. Literalmente. Mi madre me quitó el mío de la maleta antes de salir y yo empezaba a calcular cuánto podía sobrevivir sin fumar.'],
      ['No puedo subir así.', 'No puedo subir así. Me falta algo esencial para la supervivencia universitaria.'],
      ['Necesito encontrar tabaco antes de enfrentarme a una tercera planta.', 'Necesito encontrar tabaco antes de enfrentarme a una tercera planta. Mi madre retiró el mío de la maleta en un acto que ella llama educación y yo llamo sabotaje.'],
      ['Un hombre no vive solo de llave, maleta y puré naranja.', 'Un hombre no vive solo de llave, maleta y puré naranja. Y yo, desde luego, no pienso averiguar cuánto dura sin tabaco.']
    ]);
    if (replacements.has(exact)) line.textContent = replacements.get(exact);
  }

  function addDiegeticNicknameChoice() {
    const choices = document.getElementById('choices');
    if (!choices || choices.hidden || document.getElementById('change-nickname-dialogue')) return;
    const labels = [...choices.querySelectorAll('button')].map(b => b.textContent);
    if (!labels.some(t => /Eso es todo|Vengo a por la llave|¿Dónde estoy exactamente|¿Y este perro/.test(t))) return;
    const b = button('Por cierto, ¿cómo has dicho que querías que te llamásemos?', 'change-nickname-dialogue');
    b.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      choices.hidden = true;
      openNicknameDialog();
    });
    choices.insertBefore(b, choices.lastElementChild || null);
  }

  function bindDialogueRefinements() {
    if (dialogueBound) return;
    dialogueBound = true;
    const line = document.getElementById('line');
    const choices = document.getElementById('choices');
    const observer = new MutationObserver(() => {
      refineDialogueText();
      addDiegeticNicknameChoice();
    });
    if (line) observer.observe(line, {childList:true, subtree:true, characterData:true});
    if (choices) observer.observe(choices, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
  }

  function enhanceUI() {
    const settings = document.querySelector('.settings');
    if (settings && !document.getElementById('nickname-settings')) {
      const nick = button('MOTE', 'nickname-settings', 'Cambiar mote del protagonista');
      nick.addEventListener('click', openNicknameDialog);
      settings.insertBefore(nick, document.getElementById('help'));

      const saved = document.createElement('span');
      saved.id = 'save-status';
      saved.textContent = readSave()?.state?.introCompleted ? 'GUARDADO' : '';
      saved.title = 'El avance se guarda automáticamente en este navegador';
      settings.insertBefore(saved, nick);
    }

    const titleButtons = document.querySelector('.title-buttons');
    if (titleButtons && !document.getElementById('new-game')) {
      const fresh = button('NUEVA PARTIDA', 'new-game');
      fresh.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!confirm('¿Empezar desde cero? Se borrará el avance guardado de este episodio.')) return;
        clearProgress();
        location.reload();
      });
      titleButtons.insertBefore(fresh, document.getElementById('credits'));
    }
    bindDialogueRefinements();
    bindResume();
  }

  document.addEventListener('click', event => {
    if (!event.target.closest?.('#again')) return;
    clearProgress();
  }, true);

  window.addEventListener('maleta-save', () => {
    const status = document.getElementById('save-status');
    if (!status) return;
    status.textContent = 'GUARDADO ✓';
    status.classList.add('saved-flash');
    setTimeout(() => { status.textContent = 'GUARDADO'; status.classList.remove('saved-flash'); }, 1100);
  });

  const boot = () => {
    try { sessionStorage.removeItem('misterio-maleta:resume-after-nick'); } catch {}
    enhanceUI();
    const start = document.getElementById('start');
    if (!start) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (!start.disabled || attempts >= 100) {
        clearInterval(timer);
        decorateStart();
      }
    }, 50);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
