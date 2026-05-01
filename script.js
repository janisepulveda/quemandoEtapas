/* ============================================
   QUEMANDO CICLOS — script.js v6
   MD3 · Memoria · Share · Mobile FAB
   ============================================ */

/* ══ COLORES PASTEL ══ */
const COLORS = [
  { bg: '#F8BBD0', text: '#4A1535', label: 'Rosa pálido' },
  { bg: '#FFCCBC', text: '#4E1900', label: 'Terracota claro' },
  { bg: '#FFF9C4', text: '#3E3000', label: 'Amarillo suave' },
  { bg: '#B2EBF2', text: '#003D47', label: 'Celeste' },
  { bg: '#BBDEFB', text: '#0D2A5C', label: 'Azul claro' },
  { bg: '#DCEDC8', text: '#1B3A0A', label: 'Verde salvia' },
  { bg: '#E1BEE7', text: '#2E0A40', label: 'Lavanda' },
  { bg: '#FFCDD2', text: '#4A0005', label: 'Coral pálido' },
  { bg: '#C8E6C9', text: '#0A2E10', label: 'Menta' },
  { bg: '#FFE0B2', text: '#3E1A00', label: 'Durazno claro' },
  { bg: '#E3F2FD', text: '#0A2A4A', label: 'Azul cielo' },
  { bg: '#FFFDE7', text: '#3A2F00', label: 'Crema' },
  { bg: '#FCE4EC', text: '#4A0020', label: 'Rosado' },
  { bg: '#EDE7F6', text: '#1A0840', label: 'Lila' },
  { bg: '#E0F7FA', text: '#003840', label: 'Aguamarina' },
  { bg: '#F3E5F5', text: '#2E0040', label: 'Malva' },
];

/* ══ TIPOGRAFÍAS ══ */
const FONTS = [
  { label: 'Playfair Display', value: "'Playfair Display', Georgia, serif" },
  { label: 'Lora', value: "'Lora', Georgia, serif" },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'DM Serif Display', value: "'DM Serif Display', Georgia, serif" },
  { label: 'Libre Baskerville', value: "'Libre Baskerville', Georgia, serif" },
  { label: 'Fraunces', value: "'Fraunces', Georgia, serif" },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Raleway', value: "'Raleway', sans-serif" },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', 'Comic Sans', cursive" },
];

const TAGS = ['Amor', 'Amistad', 'Mascotas', 'Laboral', 'Estudios', 'Transporte', 'Otros'];

const TAG_COLORS = {
  Amor: '#EF9A9A', Amistad: '#FFE082', Mascotas: '#A5D6A7',
  Laboral: '#90CAF9', Estudios: '#CE93D8', Transporte: '#FFCC80', Otros: '#B0BEC5',
};

/* ══ MODERACIÓN ══ */
const BANNED = ['idiota', 'imbécil', 'imbecil', 'estúpido', 'estupido', 'mierda', 'puta', 'puto', 'culiao', 'pendejo', 'hdp'];
const AGGRESSION = ['te odio', 'te maldigo', 'eres lo peor', 'inútil', 'basura', 'asco de persona', 'ojalá te mueras', ...BANNED];
const CRISIS = ['suicidio', 'suicidarme', 'matarme', 'no quiero vivir', 'quiero morir', 'quitarme la vida'];

/* ══ ESTADO ══ */
let state = {
  posts: [],
  newPost: { text: '', tag: 'Otros', font: FONTS[0].value, color: COLORS[2], likes: 0, isLiked: false },
  currentPage: 'inicio',
  currentModalId: null,
  activeFilter: null,
  publishBlocked: false,
};

const SEED = [
  { text: 'Tres años esperando que cambiara. No cambió. Yo sí.', tag: 'Amor', ci: 0, fi: 0, likes: 47 },
  { text: 'El trabajo que me quitó el sueño ya no merece mis noches.', tag: 'Laboral', ci: 4, fi: 2, likes: 23 },
  { text: 'Mi gata naranja murió en mis brazos. Nunca lloré tan limpio.', tag: 'Mascotas', ci: 14, fi: 0, likes: 203 }
];

/* ══ LOCAL STORAGE ══ */
function saveToLocalStorage() {
  localStorage.setItem('quemando_ciclos_data', JSON.stringify(state.posts));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('quemando_ciclos_data');
  if (saved) state.posts = JSON.parse(saved);
}

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();

  if (state.posts.length === 0) {
    state.posts = SEED.map((s, i) => ({
      id: Date.now() + i, text: s.text, tag: s.tag,
      font: FONTS[s.fi].value, color: COLORS[s.ci],
      likes: s.likes, isLiked: false, reports: 0, hidden: false, isCrisis: false,
    }));
  }

  buildFontSelect();
  renderFilterMenu();
  renderTags();
  renderColors();
  renderPosts();
  updatePreview();

  document.getElementById('fontSelect').addEventListener('change', e => {
    state.newPost.font = e.target.value;
    document.getElementById('fontPreview').style.fontFamily = e.target.value;
    updatePreview();
  });
});

/* ══ SHARE SYSTEM ══ */
async function sharePost(id) {
  const post = state.posts.find(p => p.id === id);
  if (!post) return;
  const shareData = { title: 'Quemando Ciclos', text: `"${post.text}"`, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(`${shareData.text} - Enviado desde Quemando Ciclos`);
      showToast('Cierre copiado al portapapeles');
    }
  } catch (err) { console.log(err); }
}

function handleSharePreview() {
  const text = state.newPost.text.trim();
  if (!text) return showToast('Escribe algo primero');
  if (navigator.share) navigator.share({ title: 'Mi cierre', text: `"${text}"` });
  else {
    navigator.clipboard.writeText(text);
    showToast('Texto copiado');
  }
}

/* ══ RENDER POSTS ══ */
function renderPosts() {
  const grid = document.getElementById('postsGrid');
  const empty = document.getElementById('emptyState');
  let visible = state.posts.filter(p => !p.hidden);
  if (state.activeFilter) visible = visible.filter(p => p.tag === state.activeFilter);
  if (!visible.length) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
  empty.style.display = 'none';

  grid.innerHTML = visible.map(post => `
    <div class="post-card" style="background:${post.color.bg};color:${post.color.text}" onclick="openModal(${post.id})">
      <button class="post-card__report" onclick="cardReport(event,${post.id})"><span class="material-symbols-outlined">flag</span></button>
      <div class="post-card__text" style="font-family:${post.font}">${escHtml(post.text)}</div>
      <div class="post-card__footer">
        <button class="grid-like-container" onclick="handleGridLike(event,${post.id})" style="color:${post.color.text}">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' ${post.isLiked ? 1 : 0}">favorite</span>
          <span>${post.likes}</span>
        </button>
        <div class="post-card__hashtag">#${post.tag.toUpperCase()}</div>
        <div style="text-align:right;opacity:.4;cursor:pointer" onclick="event.stopPropagation();sharePost(${post.id})">
          <span class="material-symbols-outlined" style="font-size:14px">ios_share</span>
        </div>
      </div>
    </div>`).join('');
}

function handleGridLike(e, id) {
  e.stopPropagation();
  const p = state.posts.find(p => p.id === id); if (!p) return;
  p.isLiked = !p.isLiked; p.likes += p.isLiked ? 1 : -1;
  saveToLocalStorage();
  renderPosts();
  showToast(p.isLiked ? 'Guardado ♥' : 'Like retirado');
}

function cardReport(e, id) {
  e.stopPropagation();
  const p = state.posts.find(p => p.id === id); if (!p) return;
  p.reports = (p.reports || 0) + 1;
  if (p.reports >= 3) p.hidden = true;
  saveToLocalStorage();
  renderPosts();
  showToast('Reporte enviado');
}

function publishPost() {
  if (state.publishBlocked || !state.newPost.text.trim()) return showToast('Revisa tu mensaje');
  const { isCrisis } = checkText(state.newPost.text);
  const post = { ...state.newPost, id: Date.now(), isCrisis, reports: 0, hidden: false };
  state.posts.unshift(post);
  saveToLocalStorage();

  // Reset
  state.newPost = { text: '', tag: 'Otros', font: FONTS[0].value, color: COLORS[2], likes: 0, isLiked: false };
  document.getElementById('postText').value = '';
  showToast('Publicación creada');
  setTimeout(() => showPage('inicio'), 500);
  renderPosts();
}

function handleLike(e) {
  e.stopPropagation();
  const p = state.posts.find(p => p.id === state.currentModalId); if (!p) return;
  p.isLiked = !p.isLiked; p.likes += p.isLiked ? 1 : -1;
  document.getElementById('modalLikeCount').textContent = p.likes;
  document.querySelector('#modalLikeBtn .material-symbols-outlined').style.fontVariationSettings = `'FILL' ${p.isLiked ? 1 : 0}`;
  saveToLocalStorage();
  renderPosts();
}

/* ══ NAV ══ */
function showPage(id, navEl) {
  state.currentPage = id;
  const publishBtn = document.querySelector('.nav__cta');

  // Ocultar botón si ya estamos en publicar
  if (publishBtn) publishBtn.style.display = (id === 'publicar') ? 'none' : 'flex';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));
  document.getElementById('page-' + id).classList.add('page--active');
  document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('nav__link--active'));
  if (navEl) navEl.classList.add('nav__link--active');
  window.scrollTo(0, 0);
}

/* ══ UTILS GENÉRICOS (Mantener del código anterior) ══ */
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function lower(s) { return String(s).toLowerCase(); }
function checkText(text) {
  const t = lower(text);
  return {
    isBanned: BANNED.some(w => t.includes(w)),
    isAggressive: AGGRESSION.some(w => t.includes(w)),
    isCrisis: CRISIS.some(w => t.includes(w))
  };
}
function buildFontSelect() { document.getElementById('fontSelect').innerHTML = FONTS.map(f => `<option value="${f.value}">${f.label}</option>`).join(''); }
function toggleMenu() { document.getElementById('filterMenu').classList.toggle('open'); document.getElementById('filterBackdrop').classList.toggle('open'); }
function setFilter(tag) { state.activeFilter = tag; toggleMenu(); renderFilterMenu(); renderPosts(); const badge = document.getElementById('filterBadge'); if (tag) { badge.style.display = 'inline-flex'; badge.innerHTML = `${tag} <button onclick="setFilter(null)">✕</button>`; } else { badge.style.display = 'none'; } }
function renderFilterMenu() { const list = document.getElementById('filterList'); const all = `<li class="filter-menu__item ${!state.activeFilter ? 'active' : ''}" onclick="setFilter(null)"><span class="filter-menu__dot" style="background:#B0B0B0"></span>Todas</li>`; const items = TAGS.map(tag => `<li class="filter-menu__item ${state.activeFilter === tag ? 'active' : ''}" onclick="setFilter('${tag}')"><span class="filter-menu__dot" style="background:${TAG_COLORS[tag]}"></span>#${tag}</li>`).join(''); list.innerHTML = all + items; }
function renderTags() { document.getElementById('tagsGrid').innerHTML = TAGS.map(t => `<button class="tag ${state.newPost.tag === t ? 'selected' : ''}" onclick="setTag('${t}')">#${t}</button>`).join(''); }
function setTag(tag) { state.newPost.tag = tag; renderTags(); updatePreview(); }
function renderColors() { document.getElementById('colorGrid').innerHTML = COLORS.map(c => `<div class="color-option ${state.newPost.color.bg === c.bg ? 'selected' : ''}" onclick="setColor('${c.bg}')"><div class="color-swatch" style="background:${c.bg}"><span class="material-symbols-outlined" style="color:${c.text}">check</span></div></div>`).join(''); }
function setColor(hex) { state.newPost.color = COLORS.find(c => c.bg === hex) || COLORS[0]; renderColors(); updatePreview(); }
function updatePreview() { const preview = document.getElementById('postPreview'); const hashtag = document.getElementById('previewHashtag'); const textarea = document.getElementById('postText'); preview.style.background = state.newPost.color.bg; preview.style.color = state.newPost.color.text; textarea.style.fontFamily = state.newPost.font; hashtag.textContent = `#${state.newPost.tag.toUpperCase()}`; }
function openTyC() { document.getElementById('tycOverlay').classList.add('open'); }
function closeTyC() { document.getElementById('tycOverlay').classList.remove('open'); }
function acceptTyC() { closeTyC(); showPage('publicar'); }
function openModal(id) { state.currentModalId = id; const p = state.posts.find(p => p.id === id); const overlay = document.getElementById('modalOverlay'); const modal = document.getElementById('modal'); overlay.style.background = p.color.bg + '99'; modal.style.background = p.color.bg; modal.style.color = p.color.text; document.getElementById('modalPost').textContent = p.text; document.getElementById('modalPost').style.fontFamily = p.font; document.getElementById('modalHashtag').textContent = `#${p.tag.toUpperCase()}`; document.getElementById('modalLikeCount').textContent = p.likes; document.querySelector('#modalLikeBtn .material-symbols-outlined').style.fontVariationSettings = `'FILL' ${p.isLiked ? 1 : 0}`; overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); document.body.style.overflow = ''; }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400); }
function navigationHandler(e) { e.preventDefault(); showPage(e.target.getAttribute('data-page'), e.target); }
function syncScroll(ta) { const hl = document.getElementById('previewHighlight'); if (hl) hl.scrollTop = ta.scrollTop; }
function handleTextInput(val) { state.newPost.text = val; updatePreview(); syncScroll(document.getElementById('postText')); }