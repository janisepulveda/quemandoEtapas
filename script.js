/* ============================================
   POSTDATA — script.js v10 (FINAL)
   Lógica para el diseño "Post-it" + Firebase
   ============================================ */

/* ══ CONFIGURACIÓN UI ══ */
const COLORS = [
  { bg: '#F8BBD0', text: '#4A1535', label: 'Rosa' },
  { bg: '#FFCCBC', text: '#4E1900', label: 'Naranja' },
  { bg: '#FFF9C4', text: '#3E3000', label: 'Amarillo' },
  { bg: '#B2EBF2', text: '#003D47', label: 'Cian' },
  { bg: '#BBDEFB', text: '#0D2A5C', label: 'Azul' },
  { bg: '#DCEDC8', text: '#1B3A0A', label: 'Verde' },
  { bg: '#E1BEE7', text: '#2E0A40', label: 'Morado' },
  { bg: '#FFCDD2', text: '#4A0005', label: 'Rojo' }
];

const FONTS = [
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif" },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Raleway', value: "'Raleway', sans-serif" }
];

const TAGS = ['Amor', 'Amistad', 'Mascotas', 'Laboral', 'Estudios', 'Transporte', 'Otros'];
const BANNED = ['idiota', 'imbécil', 'estúpido', 'mierda', 'puta', 'puto', 'culiao'];
const CRISIS = ['suicidio', 'matarme', 'no quiero vivir', 'quiero morir', 'terminar con mi vida'];

/* ══ ESTADO GLOBAL ══ */
let state = {
  posts: [],
  newPost: { 
    text: '', 
    tag: 'Otros', 
    font: FONTS[0].value, 
    color: COLORS[2] 
  },
  activeFilter: null,
  currentModalId: null
};

/* ══ INICIALIZACIÓN ══ */
document.addEventListener('DOMContentLoaded', () => {
  initFirebaseSync();
  buildFontSelect();
  renderFilterMenu();
  renderTags();
  renderColors();
  updatePreview();
});

/* ══ FIREBASE SYNC ══ */
function initFirebaseSync() {
  database.ref('posts').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      state.posts = Object.keys(data).map(key => ({ ...data[key], id: key })).reverse();
    } else { 
      state.posts = []; 
    }
    renderPosts();
  });
}

/* ══ NAVEGACIÓN ══ */
function navigationHandler(event) {
  event.preventDefault();
  const targetPage = event.currentTarget.getAttribute('data-page');
  showPage(targetPage, event.currentTarget);
}

function showPage(id, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('page--active');

  // FAB (Botón publicar) visibility
  const publishBtn = document.querySelector('.nav__cta');
  if (publishBtn) publishBtn.style.display = (id === 'publicar') ? 'none' : 'flex';

  document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('nav__link--active'));
  if (navEl && navEl.classList.contains('nav__link')) navEl.classList.add('nav__link--active');
  
  window.scrollTo(0, 0);
}

/* ══ LÓGICA DE PUBLICACIÓN ══ */
function publishPost() {
  const text = state.newPost.text.trim();
  if (!text) return showToast('Escribe algo para soltar...');
  
  const isCrisis = CRISIS.some(w => text.toLowerCase().includes(w));

  const postToUpload = {
    text: text,
    tag: state.newPost.tag,
    font: state.newPost.font,
    color: state.newPost.color,
    likes: 0,
    reports: 0,
    hidden: false,
    isCrisis: isCrisis,
    timestamp: Date.now()
  };

  database.ref('posts').push(postToUpload).then(() => {
    showToast('Publicado en el muro');
    state.newPost.text = '';
    document.getElementById('postText').value = '';
    showPage('inicio', document.querySelector('[data-page="inicio"]'));
  });
}

/* ══ RENDERING ══ */
function renderPosts() {
  const grid = document.getElementById('postsGrid');
  const empty = document.getElementById('emptyState');
  let visible = state.posts.filter(p => !p.hidden);
  
  if (state.activeFilter) {
    visible = visible.filter(p => p.tag === state.activeFilter);
    document.getElementById('filterBadge').textContent = '#' + state.activeFilter;
    document.getElementById('filterBadge').style.display = 'inline-flex';
  } else {
    document.getElementById('filterBadge').style.display = 'none';
  }
  
  if (!visible.length) { 
    grid.innerHTML = ''; 
    if (empty) empty.style.display = 'flex'; 
    return; 
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = visible.map(post => `
    <div class="post-card" style="background:${post.color.bg};color:${post.color.text}" onclick="openModal('${post.id}')">
      <div class="post-card__text" style="font-family:${post.font}">${esc(post.text)}</div>
      <div class="post-card__footer">
        <button class="grid-like-container" onclick="handleGridLike(event,'${post.id}')" style="color:${post.color.text}">
          <span class="material-symbols-outlined">favorite</span>
          <span>${post.likes || 0}</span>
        </button>
        <div class="post-card__hashtag">#${post.tag.toUpperCase()}</div>
        <div class="preview-share" onclick="event.stopPropagation(); sharePost('${post.id}')">
           <span class="material-symbols-outlined">ios_share</span>
        </div>
      </div>
    </div>`).join('');
}

/* ══ GESTIÓN DE LIKES Y COMPARTIR ══ */
function handleGridLike(e, id) {
  e.stopPropagation();
  const p = state.posts.find(post => post.id === id);
  if (p) database.ref('posts/' + id).update({ likes: (p.likes || 0) + 1 });
}

function handleLike(e) {
  if (!state.currentModalId) return;
  const p = state.posts.find(post => post.id === state.currentModalId);
  if (p) database.ref('posts/' + state.currentModalId).update({ likes: (p.likes || 0) + 1 });
}

async function sharePost(id) {
  const post = state.posts.find(p => p.id === id);
  const text = `"${post.text}" — Visto en Postdata`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Postdata', text: text, url: window.location.href }); } catch (e) {}
  } else {
    navigator.clipboard.writeText(text + " " + window.location.href);
    showToast('Copiado al portapapeles');
  }
}

/* ══ MODALES ══ */
function openModal(id) {
  state.currentModalId = id;
  const p = state.posts.find(p => p.id === id);
  const overlay = document.getElementById('modalOverlay');
  const m = document.getElementById('modal');
  
  m.style.background = p.color.bg; 
  m.style.color = p.color.text;
  document.getElementById('modalPost').textContent = p.text;
  document.getElementById('modalPost').style.fontFamily = p.font;
  document.getElementById('modalHashtag').textContent = `#${p.tag.toUpperCase()}`;
  document.getElementById('modalLikeCount').textContent = p.likes || 0;
  
  // Mostrar recursos de ayuda si es crisis
  document.getElementById('modalSupport').style.display = p.isCrisis ? 'flex' : 'none';
  
  overlay.classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function openTyC() { document.getElementById('tycOverlay').classList.add('open'); }
function closeTyC() { document.getElementById('tycOverlay').classList.remove('open'); }
function acceptTyC() { closeTyC(); showPage('publicar'); }

/* ══ FILTROS Y MENÚ ══ */
function toggleMenu() {
  document.getElementById('filterMenu').classList.toggle('open');
  document.getElementById('filterBackdrop').classList.toggle('open');
}

function setFilter(tag) {
  state.activeFilter = tag;
  renderPosts();
  toggleMenu();
}

function renderFilterMenu() {
  const list = document.getElementById('filterList');
  list.innerHTML = `<li class="filter-menu__item" onclick="setFilter(null)">Todas</li>` + 
    TAGS.map(t => `<li class="filter-menu__item" onclick="setFilter('${t}')">#${t}</li>`).join('');
}

/* ══ PANEL DE CONTROL (EDICIÓN) ══ */
function handleTextInput(v) {
  state.newPost.text = v;
  document.getElementById('charCount').textContent = v.length;
  
  // Detectar palabras prohibidas
  const hasBanned = BANNED.some(w => v.toLowerCase().includes(w));
  document.getElementById('aggressionWarning').style.display = hasBanned ? 'flex' : 'none';
  
  // Detectar palabras de crisis
  const hasCrisis = CRISIS.some(w => v.toLowerCase().includes(w));
  document.getElementById('crisisBanner').style.display = hasCrisis ? 'flex' : 'none';
  
  updatePreview();
}

function setTag(t) {
  state.newPost.tag = t;
  document.getElementById('previewHashtag').textContent = `#${t.toUpperCase()}`;
  renderTags();
}

function setColor(index) {
  state.newPost.color = COLORS[index];
  renderColors();
  updatePreview();
}

function updatePreview() {
  const preview = document.getElementById('postPreview');
  const txt = document.getElementById('postText');
  preview.style.background = state.newPost.color.bg;
  preview.style.color = state.newPost.color.text;
  txt.style.fontFamily = state.newPost.font;
}

function renderTags() {
  document.getElementById('tagsGrid').innerHTML = TAGS.map(t => 
    `<button class="tag ${state.newPost.tag === t ? 'selected' : ''}" onclick="setTag('${t}')">#${t}</button>`
  ).join('');
}

function renderColors() {
  document.getElementById('colorGrid').innerHTML = COLORS.map((c, i) => `
    <div class="color-option ${state.newPost.color.bg === c.bg ? 'selected' : ''}" onclick="setColor(${i})" data-label="${c.label}">
      <div class="color-swatch" style="background:${c.bg}">
        <span class="material-symbols-outlined">check</span>
      </div>
    </div>`).join('');
}

function buildFontSelect() {
  const sel = document.getElementById('fontSelect');
  sel.innerHTML = FONTS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
  sel.addEventListener('change', (e) => {
    state.newPost.font = e.target.value;
    updatePreview();
  });
}

/* ══ HELPERS ══ */
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function reportPost() {
  if (!state.currentModalId) return;
  database.ref('posts/' + state.currentModalId).update({ hidden: true });
  closeModal();
  showToast('Publicación reportada y oculta');
}