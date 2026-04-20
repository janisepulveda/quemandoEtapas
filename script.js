const COLORS = [
  { bg: '#FF5F85', text: '#ffffff' }, { bg: '#FF8C42', text: '#ffffff' },
  { bg: '#FFD93D', text: '#1a1a1a' }, { bg: '#5CC8C2', text: '#ffffff' },
  { bg: '#2D89CF', text: '#ffffff' }, { bg: '#A8D52E', text: '#1a1a1a' },
  { bg: '#C084FC', text: '#ffffff' }, { bg: '#FF4757', text: '#ffffff' },
  { bg: '#6ECFB0', text: '#1a1a1a' }, { bg: '#FFAB76', text: '#1a1a1a' },
  { bg: '#72C3F7', text: '#1a1a1a' }, { bg: '#FFF176', text: '#1a1a1a' },
  { bg: '#F48FB1', text: '#ffffff' }, { bg: '#B39DDB', text: '#ffffff' },
  { bg: '#80CBC4', text: '#1a1a1a' }, { bg: '#FFCC02', text: '#1a1a1a' }
];

const TAGS = ['Amor', 'Amistad', 'Mascotas', 'Laboral', 'Estudios', 'Otros'];

// ESTADO REACTIVO
let state = {
  posts: [
    { id: 1, text: "Tres años esperando que cambiara. No cambió. Yo sí.", tag: "Amor", font: "'JetBrains Mono', monospace", color: COLORS[0], likes: 12 },
    { id: 2, text: "El trabajo que me quitó el sueño ya no merece mis noches.", tag: "Laboral", font: "'JetBrains Mono', monospace", color: COLORS[4], likes: 8 }
  ],
  newPost: { text: "", tag: "Otros", font: "'JetBrains Mono', monospace", color: COLORS[2] },
  currentPage: 'inicio',
  currentModalId: null
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderTags();
  renderColors();
  renderPosts();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('postText').addEventListener('input', (e) => {
    state.newPost.text = e.target.value;
    updatePreview();
  });

  document.getElementById('fontSelect').addEventListener('change', (e) => {
    state.newPost.font = e.target.value;
    updatePreview();
  });
}

// RENDERING FUNCTIONS
function renderPosts() {
  const grid = document.getElementById('postsGrid');
  grid.innerHTML = state.posts.map((post) => `
    <div class="post-card" style="background:${post.color.bg}; color:${post.color.text}" onclick="openModal(${post.id})">
      <div class="post-card__text" style="font-family:${post.font}">${post.text}</div>
      <div class="post-card__footer">
        <div style="text-align:left">heart ${post.likes}</div>
        <div class="post-card__hashtag">#${post.tag.toUpperCase()}</div>
        <div style="text-align:right">ExternalLink</div>
      </div>
    </div>
  `).join('');
}

function renderTags() {
  const container = document.getElementById('tagsGrid');
  container.innerHTML = TAGS.map(tag => `
    <button class="tag ${state.newPost.tag === tag ? 'selected' : ''}" 
            onclick="setTag('${tag}')">#${tag}</button>
  `).join('');
}

function renderColors() {
  const grid = document.getElementById('colorGrid');
  grid.innerHTML = COLORS.map(c => `
    <div class="color-swatch ${state.newPost.color.bg === c.bg ? 'selected' : ''}" 
         style="background:${c.bg}" onclick="setColor('${c.bg}')"></div>
  `).join('');
}

// ACTION HANDLERS
function setTag(tag) {
  state.newPost.tag = tag;
  renderTags();
  updatePreview();
}

function setColor(hex) {
  state.newPost.color = COLORS.find(c => c.bg === hex);
  renderColors();
  updatePreview();
}

function updatePreview() {
  const preview = document.getElementById('postPreview');
  const hashtag = document.getElementById('previewHashtag');
  const textarea = document.getElementById('postText');
  
  preview.style.backgroundColor = state.newPost.color.bg;
  preview.style.color = state.newPost.color.text;
  textarea.style.fontFamily = state.newPost.font;
  hashtag.textContent = `#${state.newPost.tag.toUpperCase()}`;
}

function publishPost() {
  if (!state.newPost.text) return;
  const post = {
    ...state.newPost,
    id: Date.now(),
    likes: 0
  };
  state.posts.unshift(post);
  state.newPost.text = "";
  document.getElementById('postText').value = "";
  showPage('inicio');
  renderPosts();
}

function handleLike(e) {
  e.stopPropagation();
  const post = state.posts.find(p => p.id === state.currentModalId);
  if (post) {
    post.likes++;
    document.getElementById('modalLikeCount').textContent = post.likes;
    renderPosts(); // Update background grid
  }
}

// NAVIGATION & MODAL
function navigationHandler(e) {
  e.preventDefault();
  const page = e.target.getAttribute('data-page');
  showPage(page, e.target);
}

function showPage(id, navElement = null) {
  state.currentPage = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));
  document.getElementById('page-' + id).classList.add('page--active');
  
  document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('nav__link--active'));
  if (navElement) navElement.classList.add('nav__link--active');
  
  window.scrollTo(0, 0);
}

function openModal(id) {
  state.currentModalId = id;
  const post = state.posts.find(p => p.id === id);
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  
  overlay.style.backgroundColor = post.color.bg;
  modal.style.color = post.color.text;
  document.getElementById('modalPost').textContent = post.text;
  document.getElementById('modalPost').style.fontFamily = post.font;
  document.getElementById('modalHashtag').textContent = `#${post.tag.toUpperCase()}`;
  document.getElementById('modalLikeCount').textContent = post.likes;
  
  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}