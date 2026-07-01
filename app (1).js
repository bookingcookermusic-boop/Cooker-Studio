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
  if (selectedMedia?.id === id) { selectedMedia = null; }
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
    } catch(e) {
      console.error(e);
    }
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

  const tones = { brut: 'brut et direct, sans fioritures', hype: 'ultra énergique et hype', editorial: 'éditorial lifestyle premium', bts: 'behind-the-scenes intime et authentique' };
  const formats = { post: 'Post / Reel Instagram', story: 'Story Instagram', carousel: 'Carrousel Instagram', scratch: 'Post créatif libre' };

  let mediaCtx = '';
  if (selectedMedia) {
    mediaCtx = `Le média sélectionné est : "${selectedMedia.name}" (${selectedMedia.type}).`;
    if (selectedMedia.context) mediaCtx += ` Contexte image : ${selectedMedia.context}.`;
  }

  const prompt = `Tu es le social media manager de Cooker Music, DJ House/Disco basé à Paris, qui joue dans des clubs et festivals premium (Zénith, Lacoste events, festivals internationaux). Son univers : élégance nocturne, platines Pioneer, lumières de scène, foule qui danse.

Format demandé : ${formats[selectedFormat]}
Ton : ${tones[tone]}
${mediaCtx}
${extra ? `Contexte supplémentaire : ${extra}` : ''}

Génère exactement ce JSON (sans markdown, sans backticks) :
{
  "caption": "légende Instagram complète, max 150 mots, ton ${tone}, emojis appropriés, fin avec un call-to-action",
  "hashtags": "30 hashtags optimisés séparés par des espaces, mix français/anglais, du plus au moins populaire",
  "brief": "brief montage/visuel en 5 points numérotés : timing, transitions, musique suggérée, texte à superposer, ambiance couleurs"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    document.getElementById('caption-out').textContent = parsed.caption;
    document.getElementById('hashtags-out').textContent = parsed.hashtags;
    document.getElementById('brief-out').textContent = parsed.brief;
    document.getElementById('output-section').style.display = 'block';
    document.getElementById('output-empty').style.display = 'none';

    if (selectedMedia) {
      await sb.insertContent({ media_id: selectedMedia.id, format: selectedFormat, caption: parsed.caption, hashtags: parsed.hashtags, brief: parsed.brief, tone });
    }
  } catch(e) {
    alert('Erreur lors de la génération. Vérifie ta clé API Anthropic.');
    console.error(e);
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
  const day = prompt('Quel jour ? (ex: Lundi, Mardi...)');
  if (!day) return;
  const caption = document.getElementById('caption-out').textContent;
  const [saved] = await sb.insertContent({
    media_id: selectedMedia?.id || null,
    format: selectedFormat,
    caption,
    hashtags: document.getElementById('hashtags-out').textContent,
    brief: document.getElementById('brief-out').textContent,
    tone: document.getElementById('tone-select').value
  });
  await sb.insertPlanning({ day, content_type: selectedFormat, content_id: saved?.id || null, note: caption.slice(0, 80) });
  alert(`Ajouté au planning — ${day}`);
  loadPlanning();
}

async function loadPlanning() {
  const grid = document.getElementById('week-grid');
  try {
    const items = await sb.getPlanning();
    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Aucun post planifié — génère du contenu et ajoute-le ici</p></div>';
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
  alert('Génère d\'abord du contenu dans l\'onglet Générer, puis clique "Ajouter au planning"');
}
