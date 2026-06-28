'use strict';

// ===================== STATE =====================
const STORAGE_KEY = 'memories_v1';
let memories = [];
let currentView = 'timeline';
let viewingId = null;

// ===================== UTILS =====================
const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getYear(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : 'ไม่ระบุปี';
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===================== STORAGE =====================
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memories = raw ? JSON.parse(raw) : [];
  } catch {
    memories = [];
  }
  // seed demo data if empty
  if (memories.length === 0) seedDemo();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
}

function seedDemo() {
  memories = [
    {
      id: uid(), title: 'วันที่เราเริ่มต้น', date: '2024-01-01',
      category: 'ชีวิต', mood: '😊', content: 'ทุกการเดินทางต้องมีจุดเริ่มต้น\nวันนี้คือวันแรกที่เราตัดสินใจเก็บทุกความทรงจำไว้ด้วยกัน\nเพราะเวลาผ่านไปเร็วมาก ถ้าไม่บันทึกไว้ก็อาจลืมเลือน',
      tags: ['เริ่มต้น', 'ใหม่'], image: ''
    },
    {
      id: uid(), title: 'ทะเลยามเช้า', date: '2024-03-15',
      category: 'การเดินทาง', mood: '😌', content: 'ตื่นมาตั้งแต่ 5 โมงเช้าเพื่อดูพระอาทิตย์ขึ้น\nเสียงคลื่นซัดเบาๆ ลมเย็นพัดมา รู้สึกสงบมาก\nช่วงเวลาแบบนี้ทำให้รู้สึกว่าชีวิตมีความหมาย',
      tags: ['ทะเล', 'พระอาทิตย์ขึ้น', 'สงบ'], image: ''
    },
    {
      id: uid(), title: 'วันเกิดครั้งพิเศษ', date: '2024-07-20',
      category: 'ครอบครัว', mood: '🥹', content: 'ครอบครัวมาเซอร์ไพรส์ถึงบ้าน\nเค้กวานิลลากับเทียนสีชมพู แม่ร้องไห้นิดหน่อย\nช่วงเวลาแบบนี้คือสิ่งที่มีค่าที่สุดในชีวิต',
      tags: ['วันเกิด', 'ครอบครัว', 'ความประหลาดใจ'], image: ''
    }
  ];
  save();
}

// ===================== RENDER =====================
function getFiltered() {
  const q = $('searchInput').value.toLowerCase().trim();
  const cat = $('filterCategory').value;
  const mood = $('filterMood').value;
  const sort = $('sortOrder').value;

  let list = memories.filter(m => {
    const matchQ = !q || m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || (m.tags || []).some(t => t.toLowerCase().includes(q));
    const matchCat = !cat || m.category === cat;
    const matchMood = !mood || m.mood === mood;
    return matchQ && matchCat && matchMood;
  });

  list.sort((a, b) => sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  return list;
}

function renderStats() {
  const total = memories.length;
  const years = new Set(memories.map(m => getYear(m.date))).size;
  const latest = memories.length ? memories.slice().sort((a, b) => b.date.localeCompare(a.date))[0] : null;

  $('totalCount').textContent = total;
  $('yearCount').textContent = years;
  $('latestDate').textContent = latest ? formatDate(latest.date).replace(/\d{4}$/, '').trim() || formatDate(latest.date) : '-';
}

function renderMemories() {
  const list = getFiltered();
  const timeline = $('timeline');
  const empty = $('emptyState');
  timeline.innerHTML = '';

  if (list.length === 0) {
    empty.style.display = memories.length === 0 ? 'block' : 'none';
    if (memories.length > 0) {
      timeline.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:60px 0">ไม่พบความทรงจำที่ตรงกับการค้นหา</p>';
    }
    return;
  }

  empty.style.display = 'none';

  let currentYear = null;
  list.forEach((m, i) => {
    const yr = getYear(m.date);
    if (yr !== currentYear) {
      currentYear = yr;
      const yl = document.createElement('div');
      yl.className = 'year-label';
      yl.innerHTML = `<span>${yr}</span>`;
      timeline.appendChild(yl);
    }

    const item = document.createElement('div');
    item.className = 'memory-item';
    item.style.animationDelay = `${i * 0.05}s`;

    const imageHtml = m.image
      ? `<div class="card-image"><img src="${escHtml(m.image)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
      : '';

    const tagsHtml = (m.tags || []).length
      ? `<div class="card-tags">${m.tags.map(t => `<span class="tag">#${escHtml(t)}</span>`).join('')}</div>`
      : '';

    item.innerHTML = `
      <div class="memory-dot"></div>
      <div class="memory-card" data-id="${m.id}">
        <div class="card-top">
          <div class="card-mood">${m.mood || '😊'}</div>
          <div class="card-meta">
            <div class="card-category">${escHtml(m.category || '')}</div>
            <div class="card-date">${formatDate(m.date)}</div>
          </div>
        </div>
        <div class="card-title">${escHtml(m.title)}</div>
        <div class="card-excerpt">${escHtml(m.content)}</div>
        ${imageHtml}
        ${tagsHtml}
      </div>
    `;

    item.querySelector('.memory-card').addEventListener('click', () => openView(m.id));
    timeline.appendChild(item);
  });

  renderStats();
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===================== VIEW MODAL =====================
function openView(id) {
  const m = memories.find(x => x.id === id);
  if (!m) return;
  viewingId = id;

  const imageHtml = m.image
    ? `<img class="view-image" src="${escHtml(m.image)}" alt="" onerror="this.style.display='none'" />`
    : '';

  const tagsHtml = (m.tags || []).length
    ? `<div class="view-tags">${m.tags.map(t => `<span class="tag">#${escHtml(t)}</span>`).join('')}</div>`
    : '';

  $('viewContent').innerHTML = `
    ${imageHtml}
    <div class="view-meta">
      <span class="view-mood">${m.mood || '😊'}</span>
      <span class="view-category">${escHtml(m.category || '')}</span>
      <span class="view-date">${formatDate(m.date)}</span>
    </div>
    <div class="view-title">${escHtml(m.title)}</div>
    <div class="view-body">${escHtml(m.content)}</div>
    ${tagsHtml}
  `;

  $('viewOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeView() {
  $('viewOverlay').classList.remove('open');
  document.body.style.overflow = '';
  viewingId = null;
}

// ===================== ADD / EDIT MODAL =====================
function openAdd() {
  $('modalTitle').textContent = '✨ เพิ่มความทรงจำ';
  $('memoryForm').reset();
  $('memoryId').value = '';
  $('memDate').value = new Date().toISOString().slice(0, 10);
  $('imagePreview').innerHTML = '';
  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('memTitle').focus(), 100);
}

function openEdit(id) {
  const m = memories.find(x => x.id === id);
  if (!m) return;

  $('modalTitle').textContent = '✏️ แก้ไขความทรงจำ';
  $('memoryId').value = m.id;
  $('memTitle').value = m.title;
  $('memDate').value = m.date;
  $('memCategory').value = m.category || 'ชีวิต';
  $('memMood').value = m.mood || '😊';
  $('memContent').value = m.content;
  $('memImage').value = m.image || '';
  $('memTags').value = (m.tags || []).join(', ');
  $('imagePreview').innerHTML = m.image ? `<img src="${escHtml(m.image)}" />` : '';

  closeView();
  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===================== SAVE =====================
$('memoryForm').addEventListener('submit', e => {
  e.preventDefault();

  const id = $('memoryId').value;
  const tags = $('memTags').value.split(',').map(t => t.trim()).filter(Boolean);

  const data = {
    id: id || uid(),
    title: $('memTitle').value.trim(),
    date: $('memDate').value,
    category: $('memCategory').value,
    mood: $('memMood').value,
    content: $('memContent').value.trim(),
    image: $('memImage').value.trim(),
    tags,
  };

  if (id) {
    const idx = memories.findIndex(m => m.id === id);
    if (idx !== -1) memories[idx] = data;
  } else {
    memories.unshift(data);
  }

  save();
  closeModal();
  renderMemories();
  showToast(id ? '✅ แก้ไขเรียบร้อยแล้ว' : '✨ บันทึกความทรงจำใหม่แล้ว');
});

// ===================== DELETE =====================
function deleteMemory(id) {
  if (!confirm('ต้องการลบความทรงจำนี้ใช่ไหม?')) return;
  memories = memories.filter(m => m.id !== id);
  save();
  closeView();
  renderMemories();
  showToast('🗑 ลบความทรงจำแล้ว');
}

// ===================== IMAGE UPLOAD =====================
$('memImageFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('⚠️ ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    $('memImage').value = ev.target.result;
    $('imagePreview').innerHTML = `<img src="${ev.target.result}" />`;
  };
  reader.readAsDataURL(file);
});

$('memImage').addEventListener('input', () => {
  const val = $('memImage').value.trim();
  $('imagePreview').innerHTML = val ? `<img src="${escHtml(val)}" onerror="this.style.display='none'" />` : '';
});

// ===================== EVENTS =====================
$('btnAdd').addEventListener('click', openAdd);
$('modalClose').addEventListener('click', closeModal);
$('btnCancel').addEventListener('click', closeModal);
$('viewClose').addEventListener('click', closeView);

$('btnEditView').addEventListener('click', () => { if (viewingId) openEdit(viewingId); });
$('btnDeleteView').addEventListener('click', () => { if (viewingId) deleteMemory(viewingId); });

// Close overlay on backdrop click
$('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeModal(); });
$('viewOverlay').addEventListener('click', e => { if (e.target === $('viewOverlay')) closeView(); });

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeView();
  }
});

// Filters
$('searchInput').addEventListener('input', renderMemories);
$('filterCategory').addEventListener('change', renderMemories);
$('filterMood').addEventListener('change', renderMemories);
$('sortOrder').addEventListener('change', renderMemories);

// View Toggle
$('viewTimeline').addEventListener('click', () => {
  currentView = 'timeline';
  $('viewTimeline').classList.add('active');
  $('viewGrid').classList.remove('active');
  $('memoriesContainer').classList.remove('grid-view');
});

$('viewGrid').addEventListener('click', () => {
  currentView = 'grid';
  $('viewGrid').classList.add('active');
  $('viewTimeline').classList.remove('active');
  $('memoriesContainer').classList.add('grid-view');
});

// ===================== INIT =====================
load();
renderMemories();
