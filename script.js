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

let state = {
  posts: [
    { id: 1, text: "Tres años esperando que cambiara. No cambió. Yo sí.", tag: "Amor", font: "'JetBrains Mono', monospace", color: COLORS[0], likes: 12, isLiked: false },
    { id: 2, text: "El trabajo que me quitó el sueño ya no merece mis noches.", tag: "Laboral", font: "'JetBrains Mono', monospace", color: COLORS[4], likes: 8, isLiked: false }
  ],
  newPost: { text: "", tag: "Otros", font: "'JetBrains Mono', monospace", color: COLORS[2], likes: 0, isLiked: false },
  currentPage: 'inicio',
  currentModalId: null
};

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

function renderPosts() {
  const grid = document.getElementById('postsGrid');
  grid.innerHTML = state.posts.map((post) => `
    <div class="post-card" style="background:${post.color.bg}; color:${post.color.text}" onclick="openModal(${post.id})">
      <div class="post-card__text" style="font-family:${post.font}">${post.text}</div>
      <div class="post-card__footer">
        <div class="grid-like-container" onclick="handleGridLike(event, ${post.id})">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${post.isLiked ? 1 : 0}">favorite</span> 
          <span>${post.likes}</span>
        </div>
        <div class="post-card__hashtag">#${post.tag.toUpperCase()}</div>
        <div style="text-align:right">
          <span class="material-symbols-outlined">ios_share</span>
        </div>
      </div>
    </div>
  `).join('');
}

function handleGridLike(e, id) {
  e.stopPropagation();
  const post = state.posts.find(p => p.id === id);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
    renderPosts();
  }
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

function handlePreviewLike(e) {
  e.stopPropagation();
  state.newPost.isLiked = !state.newPost.isLiked;
  state.newPost.likes += state.newPost.isLiked ? 1 : -1;
  document.getElementById('previewLikeCount').textContent = state.newPost.likes;
  document.getElementById('previewLikeIcon').style.fontVariationSettings = `'FILL' ${state.newPost.isLiked ? 1 : 0}`;
}

function publishPost() {
  if (!state.newPost.text) return;
  const post = { ...state.newPost, id: Date.now() };
  state.posts.unshift(post);
  state.newPost = { text: "", tag: "Otros", font: "'JetBrains Mono', monospace", color: COLORS[2], likes: 0, isLiked: false };
  document.getElementById('postText').value = "";
  document.getElementById('previewLikeCount').textContent = "0";
  document.getElementById('previewLikeIcon').style.fontVariationSettings = "'FILL' 0";
  showPage('inicio');
  renderPosts();
}

function handleLike(e) {
  e.stopPropagation();
  const post = state.posts.find(p => p.id === state.currentModalId);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
    document.getElementById('modalLikeCount').textContent = post.likes;
    document.querySelector('#modalLikeBtn .material-symbols-outlined').style.fontVariationSettings = `'FILL' ${post.isLiked ? 1 : 0}`;
    renderPosts();
  }
}

function navigationHandler(e) {
  e.preventDefault();
  showPage(e.target.getAttribute('data-page'), e.target);
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
  overlay.style.backgroundColor = post.color.bg;
  document.getElementById('modal').style.color = post.color.text;
  document.getElementById('modalPost').textContent = post.text;
  document.getElementById('modalPost').style.fontFamily = post.font;
  document.getElementById('modalHashtag').textContent = `#${post.tag.toUpperCase()}`;
  document.getElementById('modalLikeCount').textContent = post.likes;
  document.querySelector('#modalLikeBtn .material-symbols-outlined').style.fontVariationSettings = `'FILL' ${post.isLiked ? 1 : 0}`;
  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}