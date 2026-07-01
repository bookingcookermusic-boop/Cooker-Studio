// ─── CONFIG SUPABASE ───────────────────────────────────────────────
const SUPABASE_URL = 'https://vhovhcgrwaaizpsaggra.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob3ZoY2dyd2FhaXpwc2FnZ3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDk4MjMsImV4cCI6MjA5ODQ4NTgyM30.PlU3JVFVIzZLECz3cWzSz56D37nneo52S1Jrkm_uSnQ';
const BUCKET = 'cooker-media';

const sb = {
  headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
  async uploadFile(file) {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
      body: file
    });
    if (!res.ok) throw new Error('Upload échoué');
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  },
  async insertMedia(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/media`, {
      method: 'POST', headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async getMedia() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/media?order=created_at.desc`, { headers: this.headers });
    return res.json();
  },
  async deleteMedia(id, url) {
    const path = url.split(`/object/public/${BUCKET}/`)[1];
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
    });
    await fetch(`${SUPABASE_URL}/rest/v1/media?id=eq.${id}`, { method: 'DELETE', headers: this.headers });
  },
  async insertContent(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/generated_content`, {
      method: 'POST', headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async getPlanning() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/planning?order=scheduled_at.asc`, { headers: this.headers });
    return res.json();
  },
  async insertPlanning(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/planning`, {
      method: 'POST', headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// ─── TEMPLATES ─────────────────────────────────────────────────────
const TEMPLATES = {
  captions: {
    brut: [
      (media, ctx) => `${ctx || 'Sur scène.'} Pas de filtre, pas de mise en scène. Juste la musique et l'énergie de la salle.\n\nC'est ça, une nuit avec Cooker Music. 🎧`,
      (media, ctx) => `${media ? media.name + '.' : ''} ${ctx || 'Le son qui fait bouger la salle.'}\n\nDrop à minuit. T'étais là ? 🔊`,
      (media, ctx) => `Aucun plan. Juste le feeling.\n\n${ctx || 'Set improvisé, salle blindée.'} Voilà comment ça se passe quand la connexion est là. 🖤`,
    ],
    hype: [
      (media, ctx) => `⚡ ${ctx || 'LA NUIT QUI DÉCHIRE TOUT.'}\n\nQuand le drop arrive à 2h du mat et que toute la salle explose — RIEN ne bat ce feeling.\n\nCooker Music 🔥🔥🔥`,
      (media, ctx) => `🚨 ${media ? media.name.toUpperCase() + ' —' : ''} ${ctx || 'SET DE FOLIE.'}\n\nLa foule. Les lumières. Le son qui te traverse.\n\nC'EST ÇA LA NUIT. 🎶⚡`,
      (media, ctx) => `ILS ÉTAIENT PRÊTS. TOI AUSSI T'ÉTAIS LÀ ?\n\n${ctx || 'Une nuit comme ça, ça se raconte pas — ça se vit.'} 🔥\n\nNext date bientôt. Stay tuned. 👀`,
    ],
    editorial: [
      (media, ctx) => `Il y a des nuits qui laissent une trace.\n\n${ctx || 'Lumières tamisées, son cristallin, foule présente.'} Ce moment suspendu entre le set et l'aube — c'est pour ça qu'on fait ce métier.\n\nCooker Music ✦`,
      (media, ctx) => `${media ? '"' + media.name + '"' : 'Une image.'} ${ctx || 'Quelques secondes capturées entre deux drops.'}\n\nL'élégance ne se force pas. Elle se ressent. 🖤`,
      (media, ctx) => `Le DJ booth comme second chez-soi.\n\n${ctx || 'Chaque set est une conversation avec la salle.'} Pas de paroles — juste le son qui dit tout.\n\n✦ Cooker Music`,
    ],
    bts: [
      (media, ctx) => `Ce que vous ne voyez pas depuis la piste.\n\n${ctx || 'Le setup, la concentration, les 20 minutes avant d\'ouvrir les portes.'} Ce rituel-là, c'est le mien depuis le début. 🎧`,
      (media, ctx) => `Behind the decks.\n\n${ctx || 'Avant que la salle se remplisse, il y a ce moment de silence.'} J'en profite pour me connecter au son, à l'espace, à ce qui va se passer. 🖤`,
      (media, ctx) => `Coulisses.\n\n${ctx || 'On parle rarement de ce qui se passe avant.'} La préparation, les tracklists, les derniers ajustements. Ce soir-là, tout était parfait. ✦`,
    ]
  },
  hashtags: {
    post: '#djlife #housemusic #discohouse #electromusic #dj #djset #nightlife #paris #clubbing #musicproducer #rave #dancemusic #underground #techno #deephouse #djbooth #pioneerdj #festival #livemusic #musiclover #instadj #djculture #parisbynight #setlife #booknow #djagency #musicislife #frenchhouse #groovemusic #djworld',
    story: '#djlife #housemusic #paris #nightlife #djset #clubbing #discohouse #electromusic #dj #musicproducer #rave #dancemusic #djbooth #pioneerdj #musiclover #instadj #djculture #parisbynight #setlife #booknow #frenchhouse #groovemusic #djworld #underground #deephouse #techno #festival #livemusic #musicislife #djagency',
    carousel: '#djlife #housemusic #discohouse #electromusic #paris #clubbing #djset #nightlife #musicproducer #dj #rave #dancemusic #underground #deephouse #djbooth #pioneerdj #musiclover #instadj #djculture #parisbynight #setlife #booknow #djagency #musicislife #frenchhouse #groovemusic #djworld #techno #festival #livemusic',
    scratch: '#djlife #housemusic #discohouse #electromusic #paris #clubbing #nightlife #dj #djset #musicproducer #rave #dancemusic #underground #deephouse #djbooth #pioneerdj #musiclover #instadj #djculture #parisbynight #setlife #booknow #djagency #musicislife #frenchhouse #groovemusic #djworld #techno #festival #livemusic',
  },
  briefs: {
    post: (media, ctx) => `1. HOOK (0–2s) : Coupe directe sur le moment fort — drop, foule en délire ou regard caméra. Pas de transition douce, impact immédiat.\n2. MONTAGE : Cuts rythmés sur les beats, 1 coupe toutes les 1–2 secondes sur les pics musicaux.\n3. MUSIQUE : Extrait du set joué ce soir-là, volume fort, pas d'effet fade.\n4. TEXTE : Lieu + date en bas de frame, police fine blanche, apparition à 1s.\n5. AMBIANCE : Contraste élevé, tons chauds (orange/violet), légère surexposition sur les lumières de scène.`,
    story: (media, ctx) => `1. HOOK (0–1s) : Démarre sur l'action — main sur les platines, foule, ou ambiance close-up.\n2. MONTAGE : 3–4 cuts max, format vertical 9:16, durée 10–15s.\n3. MUSIQUE : Son du set en fond, volume modéré pour laisser respirer.\n4. TEXTE : Sticker lieu ou date en haut, CTA "swipe up" ou "lien en bio" en bas.\n5. AMBIANCE : Filtre léger warm, vignette douce sur les bords.`,
    carousel: (media, ctx) => `1. SLIDE 1 (accroche) : Photo ou still vidéo le plus impactant — doit donner envie de swiper.\n2. SLIDES 2–4 : Progression narrative — setup, action, réaction foule ou détail artistique.\n3. SLIDE FINAL : Citation courte ou CTA "prochain set" avec date.\n4. COHÉRENCE : Même filtre couleur sur toutes les slides, police identique.\n5. FORMAT : Carré 1:1 ou portrait 4:5, marges égales sur chaque image.`,
    scratch: (media, ctx) => `1. CONCEPT : Liberté créative totale — l'objectif est de surprendre, pas de documenter.\n2. MONTAGE : Expérimente avec slow motion, time-lapse ou split screen.\n3. MUSIQUE : Choix artistique personnel, pas forcément le set du soir.\n4. TEXTE : Optionnel — si utilisé, intégré comme élément graphique, pas comme légende.\n5. AMBIANCE : Prends un risque visuel : noir et blanc, couleurs saturées à fond, ou filtre très marqué.`,
  }
};

function generateTemplate(format, tone, media, extra) {
  const captions = TEMPLATES.captions[tone] || TEMPLATES.captions.brut;
  const caption = captions[Math.floor(Math.random() * captions.length)](media, extra);
  const hashtags = TEMPLATES.hashtags[format] || TEMPLATES.hashtags.post;
  const brief = (TEMPLATES.briefs[format] || TEMPLATES.briefs.post)(media, extra);
  return { caption, hashtags, brief };
}

// ─── STATE ─────────────────────────────────────────────────────────
let selectedMedia = null;
let selectedFormat = 'post';
let mediaList = [];

// ─── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupDropZone();
  setupFormatBtns();
  loadMedia();
  loadPlanning();
});

// ─── NAV ───────────────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`screen-${btn.dataset.screen}`).classList.add('active');
    });
  });
}

// ─── MEDIA GRID ────────────────────────────────────────────────────
async function loadMedia() {
  const grid = document.getElementById('media-grid');
  grid.innerHTML = '<div class="loading-state">Chargement des médias...</div>';
  try {
    mediaList = await sb.getMedia();
    if (!Array.isArray(mediaList) || mediaList.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Aucun média — glisse tes fichiers ci-dessus</p></div>';
      return;
    }
    grid.innerHTML = mediaList.map(m => buildMediaCard(m)).join('');
    grid.querySelectorAll('.media-card').forEach(card => {
      card.addEventListener('click', () => selectMedia(card.dataset.id));
    });
    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deleteMedia(btn.dataset.id, btn.dataset.url); });
    });
  } catch(e) {
    grid.innerHTML = '<div class="empty-state"><p>Erreur de connexion Supabase</p></div>';
  }
}

function buildMediaCard(m) {
  const isVideo = m.type === 'video';
  const thumb = isVideo
    ? `<video src="${m.url}" class="media-thumb" preload="metadata" muted></video>`
    : `<img src="${m.url}" class="media-thumb" alt="${m.name}">`;
  return `
    <div class="media-card ${selectedMedia?.id === m.id ? 'selected' : ''}" data-id="${m.id}">
      <div class="media-thumb-wrap">
        ${thumb}
        <div class="media-overlay">
          <div class="select-ring"></div>
          ${isVideo ? '<span class="video-badge">▶</span>' : ''}
        </div>
        <button class="delete-btn" data-id="${m.id}" data-url="${m.url}" title="Supprimer">✕</button>
      </div>
      <div class="media-info">
        <span class="media-name">${m.name}</span>
        <span class="media-type">${m.type === 'video' ? 'Vidéo' : 'Photo'}</span>
      </div>
    </div>`;
}

function selectMedia(id) {
  selectedMedia = mediaList.find(m => m.id === id) || null;
  document.querySelectorAll('.media-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
  const box = document.getElementById('selected-media-display');
  if (selectedMedia) {
    const isVideo = selectedMedia.type === 'video';
    box.innerHTML = isVideo
      ? `<video src="${selectedMedia.url}" style="height:48px;border-radius:6px" muted></video><span>${selectedMedia.name}</span>`
      : `<img src="${selectedMedia.url}" style="height:48px;border-radius:6px;object-fit:cover"><span>${selectedMedia.name}</span>`;
  } else {
    box.innerHTML = '<span class="no-media-text">Aucun média sélectionné</span>';
  }
}

async function deleteMedia(id, url) {
  if (!confirm('Supprimer ce média ?')) return;
  await sb.deleteMedia(id, url);
  if (selectedMedia?.id === id) selectedMedia = null;
  loadMedia();
}

// ─── DROP ZONE ─────────────────────────────────────────────────────
function setupDropZone() {
  const zone = document.getElementById('drop-zone');
  const input = document.getElementById('file-input');
  document.getElementById('browse-trigger').addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
  input.addEventListener('change', () => handleFiles(input.files));
}

async function handleFiles(files) {
  const zone = document.getElementById('drop-zone');
  zone.innerHTML = `<div class="drop-inner"><p class="drop-title">Upload en cours... 0/${files.length}</p></div>`;
  let done = 0;
  for (const file of files) {
    try {
      const url = await sb.uploadFile(file);
      const type = file.type.startsWith('video') ? 'video' : 'photo';
      await sb.insertMedia({ name: file.name.replace(/\.[^.]+$/, ''), type, url, context: '' });
      done++;
      zone.querySelector('.drop-title').textContent = `Upload en cours... ${done}/${files.length}`;
    } catch(e) { console.error(e); }
  }
  zone.innerHTML = `<div class="drop-inner">
    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" opacity=".4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    <p class="drop-title">Glisse tes fichiers ici</p>
    <p class="drop-sub">JPG, PNG, MP4, MOV — ou <span class="link-text" id="browse-trigger">parcourir</span></p>
  </div><input type="file" id="file-input" accept="image/*,video/*" multiple hidden>`;
  document.getElementById('browse-trigger').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', e => handleFiles(e.target.files));
  loadMedia();
}

// ─── FORMAT BTNS ───────────────────────────────────────────────────
function setupFormatBtns() {
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormat = btn.dataset.fmt;
    });
  });
}

// ─── GENERATE ──────────────────────────────────────────────────────
async function generateContent() {
  const btn = document.getElementById('gen-btn');
  const extra = document.getElementById('extra-context').value.trim();
  const tone = document.getElementById('tone-select').value;

  btn.disabled = true;
  btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="spin"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Génération en cours...`;
  document.getElementById('output-section').style.display = 'none';
  document.getElementById('output-empty').style.display = 'flex';

  // Petit délai pour l'effet visuel
  await new Promise(r => setTimeout(r, 600));

  const { caption, hashtags, brief } = generateTemplate(selectedFormat, tone, selectedMedia, extra);

  document.getElementById('caption-out').textContent = caption;
  document.getElementById('hashtags-out').textContent = hashtags;
  document.getElementById('brief-out').textContent = brief;
  document.getElementById('output-section').style.display = 'block';
  document.getElementById('output-empty').style.display = 'none';

  if (selectedMedia) {
    await sb.insertContent({ media_id: selectedMedia.id, format: selectedFormat, caption, hashtags, brief, tone }).catch(() => {});
  }

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 23 12 19.77 5.82 23 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Générer le contenu`;
}

function copyField(id) {
  const txt = document.getElementById(id).textContent;
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.querySelector(`[onclick="copyField('${id}')"]`);
    btn.textContent = 'Copié !';
    setTimeout(() => btn.textContent = 'Copier', 2000);
  });
}

// ─── PLANNING ──────────────────────────────────────────────────────
async function addToPlanning() {
  const day = prompt('Quel jour ? (ex: Lundi, Mardi, Mercredi...)');
  if (!day) return;
  const caption = document.getElementById('caption-out').textContent;
  const [saved] = await sb.insertContent({
    media_id: selectedMedia?.id || null,
    format: selectedFormat,
    caption,
    hashtags: document.getElementById('hashtags-out').textContent,
    brief: document.getElementById('brief-out').textContent,
    tone: document.getElementById('tone-select').value
  }).catch(() => [null]);
  await sb.insertPlanning({ day, content_type: selectedFormat, content_id: saved?.id || null, note: caption.slice(0, 80) });
  alert(`✅ Ajouté au planning — ${day}`);
  loadPlanning();
}

async function loadPlanning() {
  const grid = document.getElementById('week-grid');
  try {
    const items = await sb.getPlanning();
    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Aucun post planifié — génère du contenu et clique "Ajouter au planning"</p></div>';
      return;
    }
    grid.innerHTML = items.map(p => `
      <div class="day-card">
        <div class="day-label">${p.day}</div>
        <div class="day-type">${p.content_type}</div>
        <p class="day-note">${p.note || ''}</p>
      </div>`).join('');
  } catch(e) { console.error(e); }
}

async function generateWeekPlan() {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const types = ['story', 'story', 'post', 'story', 'story', 'post', 'story'];
  for (let i = 0; i < days.length; i++) {
    const { caption } = generateTemplate(types[i], 'brut', null, '');
    await sb.insertPlanning({ day: days[i], content_type: types[i], note: caption.slice(0, 80) }).catch(() => {});
  }
  alert('✅ Planning de la semaine généré !');
  loadPlanning();
}
