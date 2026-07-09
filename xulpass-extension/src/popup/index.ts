import { supabase } from '../lib/supabase'

const XULPASS_WEB_URL = 'https://xulpass.xul.es'

interface VaultEntry {
  id: string
  title: string
  username: string
  encrypted_password: string
  url: string | null
  category: string
  favorite: boolean
  notes: string | null
}

let currentUser: { id: string; email: string } | null = null
let allEntries: VaultEntry[] = []
let currentTab = 'all'
let searchQuery = ''
let copiedId: string | null = null
let revealedId: string | null = null

const $ = (id: string) => document.getElementById(id)!
const val = (id: string) => ($(`${id}`) as HTMLInputElement).value.trim()

// ── Init ──
async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    currentUser = { id: session.user.id, email: session.user.email! }
    showVault()
    loadEntries()
  } else {
    showScreen('login')
  }
}

// ── Screens ──
function showScreen(name: 'login' | 'vault' | 'add') {
  $('screen-login').classList.toggle('hidden', name !== 'login')
  $('screen-vault').classList.toggle('hidden', name !== 'vault')
  $('screen-add').classList.toggle('hidden', name !== 'add')
}

function showVault() {
  showScreen('vault')
  $('user-email').textContent = currentUser?.email ?? ''
}

// ── Login ──
$('btn-login').addEventListener('click', async () => {
  const email = val('input-email')
  const password = ($('input-password') as HTMLInputElement).value
  const errEl = $('login-error')
  errEl.textContent = ''
  ;($('btn-login') as HTMLButtonElement).textContent = 'Entrando...'

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  ;($('btn-login') as HTMLButtonElement).textContent = 'Iniciar sesión'

  if (error || !data.user) {
    errEl.textContent = 'Email o contraseña incorrectos'
    return
  }

  currentUser = { id: data.user.id, email: data.user.email! }
  showVault()
  loadEntries()
})

// ── Logout ──
$('btn-logout').addEventListener('click', async () => {
  await supabase.auth.signOut()
  currentUser = null
  allEntries = []
  showScreen('login')
})

// ── Open web ──
$('btn-open-web').addEventListener('click', () => {
  chrome.tabs.create({ url: XULPASS_WEB_URL })
})

// ── Load entries ──
async function loadEntries() {
  const { data } = await supabase
    .from('vault_entries_dec')
    .select('*')
    .order('favorite', { ascending: false })
    .order('title')
  allEntries = data ?? []

  // Auto-detect current tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const url = tab?.url ?? ''
    if (url.startsWith('http')) {
      const domain = new URL(url).hostname.replace('www.', '')
      const match = allEntries.some(e => e.url?.includes(domain))
      if (match) {
        searchQuery = domain
        ;($('search-input') as HTMLInputElement).value = domain
      }
    }
  } catch {}

  renderEntries()
}

// ── Search ──
$('search-input').addEventListener('input', e => {
  searchQuery = (e.target as HTMLInputElement).value
  renderEntries()
})

// ── Tabs ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = (btn as HTMLElement).dataset.tab ?? 'all'
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderEntries()
  })
})

// ── Open add form ──
$('btn-add-entry').addEventListener('click', async () => {
  // Pre-fill URL from current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const url = tab?.url ?? ''
    if (url.startsWith('http')) {
      ;($('add-url') as HTMLInputElement).value = url
      const domain = new URL(url).hostname.replace('www.', '')
      ;($('add-title') as HTMLInputElement).value = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
    }
  } catch {}
  $('save-error').textContent = ''
  showScreen('add')
})

$('btn-back').addEventListener('click', () => showScreen('vault'))

// ── Generate password ──
$('btn-gen').addEventListener('click', () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  const arr = new Uint32Array(20)
  crypto.getRandomValues(arr)
  const pwd = Array.from(arr, n => chars[n % chars.length]).join('')
  const input = $('add-password') as HTMLInputElement
  input.value = pwd
  input.type = 'text'
  setTimeout(() => input.type = 'password', 2000)
  showToast('Contraseña generada')
})

// ── Save entry ──
$('btn-save').addEventListener('click', async () => {
  const title    = val('add-title')
  const username = val('add-username')
  const password = ($('add-password') as HTMLInputElement).value
  const url      = val('add-url')
  const category = ($('add-category') as HTMLSelectElement).value
  const notes    = val('add-notes')
  const favorite = ($('add-favorite') as HTMLInputElement).checked

  $('save-error').textContent = ''

  if (!title || !username || !password) {
    $('save-error').textContent = 'Título, usuario y contraseña son obligatorios'
    return
  }

  const btn = $('btn-save') as HTMLButtonElement
  btn.textContent = 'Guardando...'
  btn.disabled = true

  const { error } = await supabase.from('vault_entries_dec').insert({
    user_id: currentUser!.id,
    title,
    username,
    encrypted_password: password,
    url: url || null,
    category,
    notes: notes || null,
    favorite,
  })

  btn.textContent = 'Guardar contraseña'
  btn.disabled = false

  if (error) {
    $('save-error').textContent = 'Error al guardar. Inténtalo de nuevo.'
    return
  }

  // Reset form
  ;['add-title','add-username','add-password','add-url','add-notes'].forEach(id => {
    ($(id) as HTMLInputElement).value = ''
  })
  ;($('add-favorite') as HTMLInputElement).checked = false

  await loadEntries()
  showScreen('vault')
  showToast('¡Contraseña guardada!')
})

// ── Render entries ──
function renderEntries() {
  const list = $('entries-list')
  const q = searchQuery.toLowerCase()

  const filtered = allEntries.filter(e => {
    const matchSearch = !q ||
      e.title.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      (e.url ?? '').toLowerCase().includes(q)
    const matchTab =
      currentTab === 'all'       ? true :
      currentTab === 'favorites' ? e.favorite :
      e.category === currentTab
    return matchSearch && matchTab
  })

  $('count').textContent = `${filtered.length} entrada${filtered.length !== 1 ? 's' : ''}`

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">${allEntries.length === 0 ? 'No tienes entradas guardadas' : 'Sin resultados'}</div>`
    return
  }

  list.innerHTML = filtered.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div class="entry-icon">${getFavicon(e)}</div>
      <div class="entry-info">
        <div class="entry-title">${esc(e.title)}${e.favorite ? ' <span class="star">★</span>' : ''}</div>
        <div class="entry-user">${esc(e.username)}</div>
        <div class="entry-pwd" id="pwd-${e.id}">
          ${revealedId === e.id
            ? `<span class="pwd-text">${esc(e.encrypted_password)}</span>`
            : '<span class="pwd-dots">••••••••</span>'}
        </div>
      </div>
      <div class="entry-actions">
        <button class="btn-icon btn-reveal" data-id="${e.id}" title="${revealedId === e.id ? 'Ocultar' : 'Ver'}">
          ${revealedId === e.id ? '🙈' : '👁️'}
        </button>
        <button class="btn-icon btn-copy-user" data-val="${esc(e.username)}" title="Copiar usuario">👤</button>
        <button class="btn-icon btn-copy-pwd" data-id="${e.id}" data-val="${esc(e.encrypted_password)}" title="Copiar contraseña">
          ${copiedId === e.id ? '✅' : '🔑'}
        </button>
        ${e.url ? `<button class="btn-icon btn-autofill btn-autofill-item" data-user="${esc(e.username)}" data-pwd="${esc(e.encrypted_password)}" title="Autocompletar">⚡</button>` : ''}
      </div>
    </div>
  `).join('')

  list.querySelectorAll('.btn-reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id!
      revealedId = revealedId === id ? null : id
      renderEntries()
    })
  })

  list.querySelectorAll('.btn-copy-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText((btn as HTMLElement).dataset.val!)
      showToast('Usuario copiado')
    })
  })

  list.querySelectorAll('.btn-copy-pwd').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id!
      await navigator.clipboard.writeText((btn as HTMLElement).dataset.val!)
      copiedId = id
      renderEntries()
      setTimeout(() => { copiedId = null; renderEntries() }, 1500)
    })
  })

  list.querySelectorAll('.btn-autofill-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const el = btn as HTMLElement
      await chrome.runtime.sendMessage({ type: 'AUTOFILL', username: el.dataset.user, password: el.dataset.pwd })
      showToast('¡Autocompletado!')
      window.close()
    })
  })
}

// ── Helpers ──
function getFavicon(e: VaultEntry) {
  if (e.url) {
    try {
      const domain = new URL(e.url).hostname
      return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" onerror="this.style.display='none'" />`
    } catch {}
  }
  return `<span class="fallback-icon">${e.title.charAt(0).toUpperCase()}</span>`
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

let toastTimer: ReturnType<typeof setTimeout>
function showToast(msg: string) {
  const t = $('toast')
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800)
}

init()
