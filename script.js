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
  const p = state.posts.find(post => post.id === id);
  const overlay = document.getElementById('modalOverlay');
  const modal   = document.getElementById('modal');
 
  // Fondo del overlay = color del post-it con mucha opacidad
  overlay.style.background = p.color.bg + '88';
 
  // El post-it del modal hereda el color exacto
  modal.style.background = p.color.bg;
  modal.style.color       = p.color.text;
 
  // Contenido
  document.getElementById('modalPost').textContent      = p.text;
  document.getElementById('modalPost').style.fontFamily = p.font;
  document.getElementById('modalHashtag').textContent   = `#${p.tag.toUpperCase()}`;
  document.getElementById('modalLikeCount').textContent = p.likes || 0;
 
  // Like: sincronizar estado
  const likeIcon = document.querySelector('#modalLikeBtn .material-symbols-outlined');
  if (likeIcon) likeIcon.style.fontVariationSettings = `'FILL' ${p.isLiked ? 1 : 0}`;
 
  // Recursos de crisis
  document.getElementById('modalSupport').style.display = p.isCrisis ? 'flex' : 'none';
 
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
 
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
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

/* ══════════════════════════════════════
   SHARE FIX — agregar al final de script.js
   (reemplaza también la función sharePost existente)
══════════════════════════════════════ */

async function sharePost(id) {
  const post = state.posts.find(p => p.id === id);
  if (!post) return;

  showToast('Generando imagen...');

  // 1 — Crear el nodo del post-it temporalmente fuera de pantalla
  const node = buildShareNode(post);
  document.body.appendChild(node);

  try {
    // 2 — Capturar con html2canvas
    const canvas = await html2canvas(node, {
      scale: 3,                  // alta resolución para stories
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });

    document.body.removeChild(node);

    // 3 — Convertir a blob
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], 'postdata.png', { type: 'image/png' });

    // 4a — En móvil: Web Share API (abre selector de apps directo)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Postdata',
        text: `"${post.text}" — postdata.app`,
      });
      return;
    }

    // 4b — En desktop: descargar la imagen
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'postdata.png';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Imagen descargada — ¡compártela donde quieras!');

  } catch (err) {
    if (document.body.contains(node)) document.body.removeChild(node);
    // Si el usuario canceló el share no mostramos error
    if (err.name !== 'AbortError') showToast('No se pudo generar la imagen');
  }
}

/* Construye un div post-it listo para capturar */
function buildShareNode(post) {
  const SIZE = 540; // px — proporción cuadrada ideal para stories/feed

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${SIZE}px;
    height: ${SIZE}px;
    background: ${post.color.bg};
    color: ${post.color.text};
    font-family: ${post.font};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 44px 36px;
    box-sizing: border-box;
    border-radius: 4px;
  `;

  // Cinta adhesiva
  const tape = document.createElement('div');
  tape.style.cssText = `
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 72px;
    height: 28px;
    background: rgba(255,255,255,.55);
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 2px;
  `;
  wrap.appendChild(tape);

  // Texto del post
  const txt = document.createElement('p');
  txt.textContent = post.text;
  txt.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 28px;
    line-height: 1.55;
    word-break: break-word;
    width: 100%;
    margin: 0;
    font-family: ${post.font};
  `;
  // html2canvas no soporta display:flex en <p>, usamos div
  const txtWrap = document.createElement('div');
  txtWrap.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  `;
  txtWrap.appendChild(txt);
  wrap.appendChild(txtWrap);

  // Separador
  const sep = document.createElement('div');
  sep.style.cssText = `
    width: 100%;
    height: 1px;
    background: rgba(0,0,0,.12);
    margin: 16px 0 12px;
  `;
  wrap.appendChild(sep);

  // Footer: hashtag + marca
  const footer = document.createElement('div');
  footer.style.cssText = `
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-family: 'Raleway', sans-serif;
    opacity: .55;
    letter-spacing: .06em;
    text-transform: uppercase;
  `;
  footer.innerHTML = `
    <span>#${post.tag.toUpperCase()}</span>
    <span>postdata</span>
  `;
  wrap.appendChild(footer);

  return wrap;
}