// ── STATE ──
const state = {
  selectedMedia: null,
  format: 'post',
  mediaLib: [],
  planning: [],
  followers: 1115,
  lastGenerated: null
};

// ── NAVIGATION ──
function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });
}

function switchScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name)?.classList.add('active');
  document.querySelectorAll(`[data-screen="${name}"]`).forEach(b => b.classList.add('active'));
  window.scrollTo(0, 0);
}

// ── MEDIA ──
function initMedia() {
  const dz = document.getElementById('drop-zone');
  const fi = document.getElementById('file-input');

  dz.addEventListener('click', () => fi.click());
  document.getElementById('browse-trigger')?.addEventListener('click', e => { e.stopPropagation(); fi.click(); });

  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
  fi.addEventListener('change', e => handleFiles(e.target.files));

  document.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', () => selectMedia(card));
  });
}

function selectMedia(card) {
  document.querySelectorAll('.media-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  state.selectedMedia = {
    id: card.dataset.id,
    ctx: card.dataset.ctx,
    name: card.querySelector('.media-name')?.textContent || 'Média',
    type: card.querySelector('.media-type')?.textContent || 'Photo'
  };
  updateSelectedDisplay();
}

function updateSelectedDisplay() {
  const el = document.getElementById('selected-media-display');
  if (!el) return;
  if (state.selectedMedia) {
    el.classList.add('has-media');
    el.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" style="flex-shrink:0;color:var(--accent)"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      <div>
        <div style="font-size:.88rem;font-weight:500">${state.selectedMedia.name}</div>
        <div style="font-size:.75rem;color:var(--text2)">${state.selectedMedia.type}</div>
      </div>`;
  } else {
    el.classList.remove('has-media');
    el.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      <span class="no-media-text">Aucun média — va dans Médias pour en sélectionner un, ou génère de zéro</span>`;
  }
}

function handleFiles(files) {
  const grid = document.getElementById('media-grid');
  Array.from(files).forEach(file => {
    const id = 'u' + Date.now() + Math.random().toString(36).slice(2, 7);
    const isVideo = file.type.startsWith('video');
    const url = URL.createObjectURL(file);

    const card = document.createElement('div');
    card.className = 'media-card';
    card.dataset.id = id;
    card.dataset.ctx = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');

    if (isVideo) {
      card.innerHTML = `
        <div class="media-thumb-wrap">
          <video src="${url}" muted style="width:100%;height:100%;object-fit:cover;display:block"></video>
          <div class="media-overlay"><div class="select-ring"></div></div>
        </div>
        <div class="media-info">
          <span class="media-name">${file.name.slice(0, 18)}</span>
          <span class="media-type">Vidéo</span>
        </div>`;
    } else {
      card.innerHTML = `
        <div class="media-thumb-wrap">
          <img src="${url}" alt="${file.name}" style="width:100%;height:100%;object-fit:cover;display:block">
          <div class="media-overlay"><div class="select-ring"></div></div>
        </div>
        <div class="media-info">
          <span class="media-name">${file.name.slice(0, 18)}</span>
          <span class="media-type">Photo</span>
        </div>`;
    }

    card.addEventListener('click', () => selectMedia(card));
    grid.appendChild(card);
    state.mediaLib.push({ id, name: file.name, file });
  });
}

// ── FORMAT BUTTONS ──
function initFormatBtns() {
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.format = btn.dataset.fmt;
    });
  });
}

// ── GENERATE ──
async function generateContent() {
  const btn = document.getElementById('gen-btn');
  const outputSection = document.getElementById('output-section');
  const outputEmpty = document.getElementById('output-empty');
  const captionOut = document.getElementById('caption-out');
  const hashtagsOut = document.getElementById('hashtags-out');
  const briefOut = document.getElementById('brief-out');
  const extra = document.getElementById('extra-context')?.value || '';
  const tone = document.getElementById('tone-select')?.value || 'brut';

  const fmtLabels = { post: 'Post Reel Instagram', story: 'Story Instagram (15 secondes max)', carousel: 'Carrousel Instagram (3-5 slides)', scratch: 'Post original sans média associé' };
  const toneLabels = {
    brut: 'Brut et direct — faits concrets, pas de superlatif',
    hype: 'Ultra hype — énergie maximale, électrisant',
    editorial: 'Éditorial lifestyle — élégant, aspirationnel',
    bts: 'Behind-the-scenes intime — authentique, coulisses'
  };

  const mediaCtx = state.selectedMedia
    ? `Média sélectionné : "${state.selectedMedia.name}" (${state.selectedMedia.type})\nDescription du média : ${state.selectedMedia.ctx}`
    : 'Aucun média sélectionné — crée du contenu de toutes pièces basé sur le contexte fourni';

  const prompt = `Tu es le directeur créatif Instagram du DJ et producteur parisien Cooker (Samuel Passicot, @cooker_music).

IDENTITÉ DE LA MARQUE :
- Univers : brut, hype, authentique, behind-the-scenes
- Style musical : Disco, Tech House, Indie House
- Références de booking : Zénith de Paris (5000 personnes), La Démesure (résident), Lacoste VIP Arena, Fun Radio Ofenbach & Friends, Polaris Festival Suisse
- Cercle pro : Ofenbach, Bagheera, Arthur Nozen, @techthesun
- Ville : Paris — public cible : clubbeurs parisiens + bookeurs de clubs

FORMAT DEMANDÉ : ${fmtLabels[state.format] || 'Post Reel'}
TON : ${toneLabels[tone] || toneLabels.brut}
${mediaCtx}
CONTEXTE ADDITIONNEL : ${extra || 'Aucun contexte supplémentaire'}

RÈGLES ABSOLUES :
1. Hook (3-5 premiers mots) : jamais "soirée de folie", jamais "merci à tous", jamais "POV" seul — TOUJOURS un fait brut concret (lieu, heure, chiffre, sensation physique)
2. Légende : 2-3 phrases max (story = 1 phrase + texte overlay 5 mots max)
3. Hashtags : 8-12, mix entre #paris #techhouse #djparis #discohouse #nightlife + lieux réels (#lademesure #zenithparis etc.)
4. Brief montage : 2-3 instructions concrètes de montage (durée de coupe, plan, overlay texte)
5. Si c'est une story : inclure une suggestion de sticker interactif (sondage, quiz, slider)

RÉPONDS UNIQUEMENT EN JSON VALIDE (sans markdown, sans texte avant ou après) :
{"caption":"...","hashtags":"...","brief":"...","sticker":"...ou null si pas story"}`;

  btn.disabled = true;
  btn.innerHTML = `<svg class="spin" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="animation:spin .7s linear infinite"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Génération en cours...`;

  outputSection.style.display = 'block';
  outputEmpty.style.display = 'none';
  captionOut.textContent = '';
  captionOut.classList.add('loading');
  hashtagsOut.textContent = '';
  briefOut.textContent = '';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const rawText = data.content?.find(c => c.type === 'text')?.text || '';
    let parsed;

    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        caption: rawText.slice(0, 300) || 'Erreur de parsing. Réessaie.',
        hashtags: '#paris #techhouse #djparis #disco #nightlife #music #dj',
        brief: 'Coupe rythmique sur le tempo. Plan large sur la salle, puis zoom mains sur platines.',
        sticker: null
      };
    }

    captionOut.classList.remove('loading');
    captionOut.textContent = parsed.caption || '';
    hashtagsOut.textContent = parsed.hashtags || '';
    let briefText = parsed.brief || '';
    if (parsed.sticker && parsed.sticker !== 'null') briefText += '\n\nSticker suggéré : ' + parsed.sticker;
    briefOut.textContent = briefText;
    state.lastGenerated = { ...parsed, format: state.format, mediaName: state.selectedMedia?.name || 'De zéro' };

  } catch (err) {
    captionOut.classList.remove('loading');
    captionOut.textContent = 'Erreur de connexion à l\'API. Vérifie ta clé API dans le fichier app.js.';
    hashtagsOut.textContent = '';
    briefOut.textContent = '';
    console.error('API Error:', err);
  }

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 23 12 19.77 5.82 23 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Générer le contenu`;
}

function copyField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).catch(() => {});
  const btn = el.previousElementSibling?.querySelector('.copy-btn') || document.querySelector(`[onclick="copyField('${id}')"]`);
  if (btn) { const orig = btn.textContent; btn.textContent = 'Copié !'; setTimeout(() => btn.textContent = orig, 2000); }
}

// ── PLANNING ──
const defaultPlan = [
  { day: 'Lun', title: 'Story — pic d\'énergie soirée', sub: 'Plan foule depuis platines · 10 secondes', badge: 'green', badgeText: 'Prêt' },
  { day: 'Mar', title: 'Story — mains sur platines', sub: 'Texte overlay court · lumière de scène', badge: 'green', badgeText: 'Prêt' },
  { day: 'Mer', title: 'Post Reel — récap soirée', sub: 'Montage 5 plans · 20 secondes · avec légende IA', badge: 'yellow', badgeText: 'À poster', isPost: true },
  { day: 'Jeu', title: 'Story — foule de dos', sub: 'Sondage "Vous étiez là ?" · tag lieu', badge: 'yellow', badgeText: 'À préparer' },
  { day: 'Ven', title: 'Story — backstage / setup', sub: 'Arrivée salle vide · teasing prochaine date', badge: 'red', badgeText: 'Vide' },
  { day: 'Sam', title: 'DATE LIVE — filmer les 5 plans', sub: 'Priorité : foule de dos + mains platines', badge: 'accent', badgeText: 'Live', isLive: true },
  { day: 'Dim', title: 'Story — retour fin de soirée', sub: 'Teasing prochaine date · lien bio', badge: 'red', badgeText: 'Vide' }
];

function renderPlanning() {
  const grid = document.getElementById('week-grid');
  if (!grid) return;
  const items = state.planning.length ? state.planning : defaultPlan;
  grid.innerHTML = items.map(item => `
    <div class="week-row${item.isLive ? ' live' : ''}">
      <div class="week-day">${item.day}</div>
      <div>
        <div class="week-content-title">${item.title}</div>
        <div class="week-content-sub">${item.sub}</div>
      </div>
      <span class="badge ${item.badge}">${item.badgeText}</span>
    </div>
  `).join('');
}

function addToPlanning() {
  if (!state.lastGenerated) return;
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const fmtLabel = { post: 'Post Reel', story: 'Story', carousel: 'Carrousel', scratch: 'Post' };
  const newItem = {
    day: days[Math.floor(Math.random() * 7)],
    title: `${fmtLabel[state.lastGenerated.format] || 'Post'} — ${(state.lastGenerated.caption || '').slice(0, 40)}...`,
    sub: `Généré par IA · ${state.lastGenerated.mediaName}`,
    badge: 'green',
    badgeText: 'Prêt'
  };
  const base = state.planning.length ? state.planning : [...defaultPlan];
  state.planning = [...base, newItem];
  renderPlanning();
  switchScreen('planning');
}

async function generateWeekPlan() {
  const grid = document.getElementById('week-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text2);font-size:.88rem">Génération du planning en cours...</div>';

  const prompt = `Tu es le stratège contenu du DJ parisien Cooker (@cooker_music). Il joue 2-3 soirées par semaine, direction brut + hype, résident La Démesure Paris.

Génère un planning de contenu pour une semaine complète : 1 story par jour + 1 post Reel en milieu de semaine.

Contraintes :
- Les stories doivent exploiter les 5 plans définis (arrivée/setup, mains platines, foule de dos, pic énergie, retour fin de soirée)
- Le post du milieu de semaine est un Reel récap de soirée
- Un jour = la date live (samedi ou vendredi)
- Varier les types de contenu pour ne pas répéter le même plan 2 jours de suite
- Inclure au moins 1 story studio/production dans la semaine

Réponds UNIQUEMENT en JSON valide (tableau de 7 objets, sans markdown) :
[{"day":"Lun","title":"...","sub":"...","badge":"green|yellow|red|accent|blue","badgeText":"Prêt|À poster|À préparer|Vide|Live","isLive":false},...]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    const raw = data.content?.find(c => c.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    state.planning = JSON.parse(clean);
    renderPlanning();
  } catch {
    state.planning = defaultPlan;
    renderPlanning();
  }
}

// ── STATS ──
function updateFollowers() {
  const input = document.getElementById('followers-input');
  const val = parseInt(input?.value);
  if (!val || val < 0) return;

  const prev = state.followers;
  state.followers = val;
  const target = 2500;
  const pct = Math.min(Math.round((val / target) * 100), 100);
  const circumference = 2 * Math.PI * 24;

  document.getElementById('disp-followers').textContent = val.toLocaleString('fr-FR');
  document.getElementById('disp-delta').textContent = val >= target ? 'Objectif atteint !' : `Objectif : 2 500 (${target - val} restants)`;
  document.getElementById('ring-pct').textContent = pct + '%';
  document.getElementById('ring-fill').style.strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;

  const delta = val - 1115;
  const newKpi = document.getElementById('new-followers-kpi');
  if (newKpi) {
    newKpi.textContent = (delta >= 0 ? '+' : '') + delta;
    newKpi.className = 'kpi-value ' + (delta > 0 ? 'success' : delta < 0 ? 'danger' : '');
  }

  if (input) input.value = '';
}

// ── MOBILE NAV ──
function injectMobileNav() {
  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.innerHTML = `
    <button class="mobile-nav-btn active" data-screen="media">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      Médias
    </button>
    <button class="mobile-nav-btn" data-screen="generate">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 23 12 19.77 5.82 23 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      Générer
    </button>
    <button class="mobile-nav-btn" data-screen="planning">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      Planning
    </button>
    <button class="mobile-nav-btn" data-screen="stats">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      Perfs
    </button>`;
  document.body.appendChild(nav);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMedia();
  initFormatBtns();
  renderPlanning();
  injectMobileNav();
  updateSelectedDisplay();

  // Init ring
  const circumference = 2 * Math.PI * 24;
  const initPct = Math.round((1115 / 2500) * 100);
  const ring = document.getElementById('ring-fill');
  if (ring) {
    setTimeout(() => {
      ring.style.strokeDasharray = `${(initPct / 100) * circumference} ${circumference}`;
    }, 300);
  }
});

// CSS spin keyframe injection
const style = document.createElement('style');
style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(style);
