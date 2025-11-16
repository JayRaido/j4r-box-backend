// ===============================================
// J4R BOX - E-COMMERCE LOGIC
// ===============================================

const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

const ADMIN_CREDENTIALS = { name: "Jei Raido", email: "JeiRaido11254@gmail.com", password: "JayRide4" };

const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    filters: { q: '', category: 'all', sort: 'featured' }
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function toast(msg, ms = 2200) {
    const t = el('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.style.animation = 'none';
    requestAnimationFrame(() => t.style.animation = 'toastIn 220ms ease forwards');
    setTimeout(() => t.classList.add('hidden'), ms);
}

const demoProducts = [
    { _id: uid(), name: 'Elden Ring (PC)', category: 'virtual', price: 2699, stock: 50, image: './images/elden.jpg', description: 'Award-winning ARPG. Steam key (instant delivery).' },
    { _id: uid(), name: 'God of War Ragnarok (PS5)', category: 'physical', price: 3495, stock: 20, image: './images/god.jpg', description: 'Physical disc for PS5. Brand new, sealed.' },
    { _id: uid(), name: 'Genshin Genesis Crystals 6480', category: 'currency', price: 4290, stock: 999, image: './images/genshin.jpg', description: 'In-game top-up.' },
    { _id: uid(), name: 'Razer BlackShark V2 X', category: 'accessory', price: 2499, stock: 35, image: './images/razer.png', description: 'Lightweight esports headset.' },
    { _id: uid(), name: 'Minecraft (Java & Bedrock)', category: 'virtual', price: 1599, stock: 100, image: './images/minecraft.jpeg', description: 'PC digital code.' },
    { _id: uid(), name: 'Nintendo Switch Pro Controller', category: 'accessory', price: 3495, stock: 15, image: './images/nintendo.jpeg', description: 'Official Pro Controller.' },
    { _id: uid(), name: 'NBA 2K24 (PS4)', category: 'physical', price: 1995, stock: 25, image: './images/nba.jpeg', description: 'Physical disc for PS4.' },
    { _id: uid(), name: 'Valorant Points 475', category: 'currency', price: 249, stock: 999, image: './images/valo.png', description: 'Direct top-up for Riot.' },
    { _id: uid(), name: 'Cyberpunk Expansion Pack', category: 'virtual', price: 1299, stock: 60, image: 'https://picsum.photos/seed/cp/600/400', description: 'DLC pack with skins and missions.' },
    { _id: uid(), name: 'Gaming Mouse Pro', category: 'accessory', price: 2599, stock: 40, image: 'https://picsum.photos/seed/mouse/600/400', description: 'High DPI programmable mouse.' },
    { _id: uid(), name: 'Steam Wallet ₱1000', category: 'currency', price: 1000, stock: 999, image: 'https://picsum.photos/seed/steam/600/400', description: 'Steam wallet code.' },
    { _id: uid(), name: 'VR Starter Kit', category: 'accessory', price: 8999, stock: 6, image: 'https://picsum.photos/seed/vr/600/400', description: 'Entry-level VR bundle.' }
];

if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify(demoProducts));

// --- API Helpers (Local Simulation) ---
async function apiGetProducts() { return JSON.parse(localStorage.getItem('products') || '[]'); }

async function apiCreateProduct(p) {
    const local = JSON.parse(localStorage.getItem('products') || '[]');
    const withId = { ...p, _id: uid() };
    local.unshift(withId);
    localStorage.setItem('products', JSON.stringify(local));
    return withId;
}

async function apiUpdateProduct(id, p) {
    const local = JSON.parse(localStorage.getItem('products') || '[]');
    const idx = local.findIndex(x => x._id === id);
    if (idx >= 0) {
        local[idx] = { ...local[idx], ...p };
        localStorage.setItem('products', JSON.stringify(local));
        return local[idx];
    }
    return null;
}

async function apiDeleteProduct(id) {
    const local = JSON.parse(localStorage.getItem('products') || '[]');
    const filtered = local.filter(x => x._id !== id);
    localStorage.setItem('products', JSON.stringify(filtered));
    return true;
}

async function apiRegister({ name, email, password }) {
    const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
    if (users.find(u => u.email === email)) throw new Error('Email already exists');
    const u = { id: uid(), name, email, password };
    users.push(u);
    localStorage.setItem('localUsers', JSON.stringify(users));
    return { user: { name, email }, token: 'local-' + uid() };
}

async function apiLogin({ email, password }) {
    const users = JSON.parse(localStorage.getItem('localUsers') || '[]');
    const u = users.find(x => x.email === email && x.password === password);
    if (u) return { user: { name: u.name, email: u.email }, token: 'local-' + uid() };

    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        return { user: { name: ADMIN_CREDENTIALS.name, email: ADMIN_CREDENTIALS.email, admin: true }, token: 'local-admin-' + uid() };
    }
    throw new Error('Invalid credentials');
}

// --- UI Renderers ---
function renderProducts() {
    const grid = el('#productGrid');
    let list = [...state.products];

    const q = state.filters.q.trim().toLowerCase();
    if (q) list = list.filter(p => (p.name + ' ' + (p.description || '')).toLowerCase().includes(q));
    if (state.filters.category !== 'all') list = list.filter(p => p.category === state.filters.category);

    switch (state.filters.sort) {
        case 'price-asc': list.sort((a, b) => a.price - b.price); break;
        case 'price-desc': list.sort((a, b) => b.price - a.price); break;
        case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
        default: break;
    }

    grid.innerHTML = list.map(p => {
        const thumb = p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" class="w-full h-44 object-cover rounded" />` :
            `<div class="h-44 img-fallback rounded text-sm">No image</div>`;
        const isAdmin = state.user && state.user.email === ADMIN_CREDENTIALS.email;

        return `
        <div class="card p-4 rounded-lg flex flex-col">
            <div class="mb-3">${thumb}</div>
            <div class="flex-grow">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="font-semibold leading-tight line-clamp-2">${escapeHtml(p.name)}</div>
                        <div class="text-xs text-slate-400">${escapeHtml(p.description || '')}</div>
                    </div>
                    <div class="text-indigo-300 font-bold whitespace-nowrap">${fmt.format(p.price)}</div>
                </div>
            </div>
            <div class="mt-4 flex items-center justify-between">
                <span class="text-xs px-2 py-1 rounded border border-white/10 bg-white/5 text-slate-300 capitalize">${p.category}</span>
                <div class="flex items-center gap-2">
                    ${isAdmin ? `
                    <button class="px-2 py-1 rounded border border-white/10 text-xs" data-edit="${p._id}">Edit</button>
                    <button class="px-2 py-1 rounded border border-red-500/50 text-red-400 text-xs" data-del="${p._id}">Del</button>
                    ` : ''}
                    <button class="px-3 py-1.5 rounded bg-white/10 text-slate-100 text-sm hover:bg-white/20" data-add="${p._id}">Add to Cart</button>
                </div>
            </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add'))));
    if (state.user && state.user.email === ADMIN_CREDENTIALS.email) {
        grid.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => loadProductIntoForm(btn.getAttribute('data-edit'))));
        grid.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-del');
            if (confirm('Are you sure you want to delete this product?')) {
                await apiDeleteProduct(id);
                await loadProducts();
                toast('Product deleted');
            }
        }));
    }
}

function renderAdminList() {
    const box = el('#adminProductList');
    if (!box) return;
    box.innerHTML = state.products.map(p => `
      <div class="py-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="font-medium truncate">${escapeHtml(p.name)}</div>
          <div class="text-xs text-slate-400">${p.category} • ${fmt.format(p.price)} • stock: ${p.stock ?? 0}</div>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <button class="px-2 py-1 rounded border" data-edit="${p._id}">Edit</button>
          <button class="px-2 py-1 rounded border text-red-500" data-del="${p._id}">Delete</button>
        </div>
      </div>
    `).join('');

    box.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => loadProductIntoForm(btn.getAttribute('data-edit'))));
    box.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        if (confirm('Are you sure you want to delete this product?')) {
            await apiDeleteProduct(id);
            await loadProducts();
            toast('Product deleted');
        }
    }));
}

function renderCart() {
    const items = state.cart.map(ci => {
        const p = state.products.find(x => x._id === ci.id);
        if (!p) return null;
        return { ...p, qty: ci.qty };
    }).filter(Boolean);

    const wrap = el('#cartItems');
    if (!wrap) return;
    wrap.innerHTML = items.length ? items.map(it => `
      <div class="flex gap-3 items-center">
        <div class="w-20 h-16 rounded overflow-hidden ${it.image ? '' : 'img-fallback'}">
          ${it.image ? `<img src="${it.image}" alt="${escapeHtml(it.name)}" class="w-full h-full object-cover">` : ''}
        </div>
        <div class="min-w-0 grow">
          <div class="font-medium truncate">${escapeHtml(it.name)}</div>
          <div class="text-xs text-slate-400">${fmt.format(it.price)} • <span class="uppercase text-[10px] px-1 py-0.5 rounded bg-white/3">${it.category}</span></div>
          <div class="mt-2 flex items-center gap-2 text-sm">
            <button class="px-2 py-1 border rounded" data-qty="dec" data-id="${it._id}">-</button>
            <span>${it.qty}</span>
            <button class="px-2 py-1 border rounded" data-qty="inc" data-id="${it._id}">+</button>
            <button class="ml-auto text-red-400 text-sm" data-remove="${it._id}">Remove</button>
          </div>
        </div>
      </div>
    `).join('') : `<div class="text-slate-400">Your cart is empty.</div>`;

    wrap.querySelectorAll('[data-qty]').forEach(btn => btn.addEventListener('click', () => changeQty(btn.getAttribute('data-id'), btn.getAttribute('data-qty') === 'inc' ? 1 : -1)));
    wrap.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-remove'))));

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    el('#cartSubtotal').textContent = fmt.format(subtotal);
    el('#cartCount').textContent = state.cart.reduce((a, b) => a + b.qty, 0);
}


// --- Admin, Cart, Modal Helpers ---
function loadProductIntoForm(id) {
    const p = state.products.find(x => x._id === id);
    if (!p) return;
    el('#prodId').value = p._id;
    el('#prodName').value = p.name;
    el('#prodCategory').value = p.category;
    el('#prodPrice').value = p.price;
    el('#prodStock').value = p.stock ?? 0;
    el('#prodImage').value = p.image || '';
    el('#prodDesc').value = p.description || '';
    el('#saveProductBtn').textContent = 'Update Product';
    toast('Loaded product into form');
    window.scrollTo({ top: el('#adminPanel').offsetTop - 80, behavior: 'smooth' });
}

function resetProductForm() {
    el('#productForm').reset();
    el('#prodId').value = '';
    el('#saveProductBtn').textContent = 'Save Product';
}

function addToCart(id) {
    const idx = state.cart.findIndex(ci => ci.id === id);
    if (idx >= 0) state.cart[idx].qty += 1;
    else state.cart.push({ id, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(state.cart));
    renderCart();
    toast('Added to cart');
    openCart();
}

function changeQty(id, delta) {
    const idx = state.cart.findIndex(ci => ci.id === id);
    if (idx >= 0) {
        state.cart[idx].qty += delta;
        if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
        localStorage.setItem('cart', JSON.stringify(state.cart));
        renderCart();
    }
}

function removeFromCart(id) {
    state.cart = state.cart.filter(ci => ci.id !== id);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    renderCart();
}

function openCart() {
    const layer = el('#cartDrawer');
    if (!layer) return;
    const aside = layer.querySelector('aside');
    layer.classList.remove('hidden');
    requestAnimationFrame(() => aside.classList.replace('drawer-closed', 'drawer-open'));
}

function closeCart() {
    const layer = el('#cartDrawer');
    if (!layer) return;
    const aside = layer.querySelector('aside');
    aside.classList.replace('drawer-open', 'drawer-closed');
    setTimeout(() => layer.classList.add('hidden'), 260);
}

function openModal(sel) {
    const m = el(sel);
    if (!m) return;
    m.classList.remove('hidden');
    const box = m.querySelector('.modal-pop');
    if (box) { box.classList.add('modal-open'); }
}

function closeModal(sel) {
    const m = el(sel);
    if (!m) return;
    const box = m.querySelector('.modal-pop');
    if (box) box.classList.remove('modal-open');
    setTimeout(() => m.classList.add('hidden'), 220);
}

async function loadProducts() {
    const data = await apiGetProducts();
    state.products = data.map(p => ({ ...p, _id: p._id || p.id || uid() }));
    renderProducts();
    renderAdminList();
    renderCart();
}

// --- Auth & Account UI ---
function updateAccountUI() {
    const label = el('#accountLabel');
    if (state.user) {
        label.textContent = state.user.name.split(' ')[0];
        el('#logoutBtn')?.classList?.remove('hidden');
        el('#openAuthBtnSmall')?.classList?.add('hidden');
    } else {
        label.textContent = 'Login';
        el('#logoutBtn')?.classList?.add('hidden');
        el('#openAuthBtnSmall')?.classList?.remove('hidden');
    }
    setAdminMode(state.user && state.user.email === ADMIN_CREDENTIALS.email);
}

function setAdminMode(isAdmin) {
    el('#adminPanel').classList.toggle('hidden', !isAdmin);
    renderProducts();
}


// --- Auth Modal Global Listeners ---
function openAuth(mode = 'login') {
    el('#loginForm').classList.toggle('hidden', mode !== 'login');
    el('#registerForm').classList.toggle('hidden', mode !== 'register');
    el('#authTitle').textContent = mode === 'login' ? 'Login' : 'Register';
    openModal('#authModal');
}
el('#ctaLogin').addEventListener('click', () => openAuth('login'));
el('#switchToRegister').addEventListener('click', () => openAuth('register'));
el('#switchToLogin').addEventListener('click', () => openAuth('login'));
el('#closeAuth').addEventListener('click', () => closeModal('#authModal'));


// --- Main Application Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {

    el('#btnMobileMenu').addEventListener('click', () => el('#mobileNav').classList.toggle('hidden'));
    el('#btnCart').addEventListener('click', openCart);
    el('#closeCart').addEventListener('click', closeCart);
    el('#cartBackdrop').addEventListener('click', closeCart);

    el('#clearCartBtn').addEventListener('click', () => {
        state.cart = [];
        localStorage.setItem('cart', '[]');
        renderCart();
    });

    el('#checkoutBtn').addEventListener('click', () => {
        if (!state.cart.length) return toast('Your cart is empty.');
        if (!state.user) {
            toast('Please log in to check out.');
            closeCart();
            openAuth('login');
            return;
        }
        toast('Checkout complete! Your order is on its way.');
        state.cart = [];
        localStorage.setItem('cart', '[]');
        renderCart();
        closeCart();
    });

    el('#searchInput').addEventListener('input', (e) => { state.filters.q = e.target.value; renderProducts(); });
    el('#categoryFilter').addEventListener('change', (e) => { state.filters.category = e.target.value; renderProducts(); });
    el('#sortSelect').addEventListener('change', (e) => { state.filters.sort = e.target.value; renderProducts(); });

    if (el('#productForm')) {
        el('#productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = el('#prodId').value;
            const payload = {
                name: el('#prodName').value.trim(),
                category: el('#prodCategory').value,
                price: Number(el('#prodPrice').value) || 0,
                stock: Number(el('#prodStock').value) || 0,
                image: el('#prodImage').value.trim(),
                description: el('#prodDesc').value.trim()
            };
            if (!payload.name) return toast('Product name is required.');
            if (id) {
                await apiUpdateProduct(id, payload);
                toast('Product updated');
            } else {
                await apiCreateProduct(payload);
                toast('Product created');
            }
            resetProductForm();
            await loadProducts();
        });
        el('#resetProductBtn').addEventListener('click', resetProductForm);
    }
    
    el('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = el('#loginEmail').value.trim();
        const password = el('#loginPassword').value;
        try {
            const { user } = await apiLogin({ email, password });
            state.user = user;
            localStorage.setItem('user', JSON.stringify(user));
            updateAccountUI();
            toast(`Welcome back, ${user.name.split(' ')[0]}!`);
            closeModal('#authModal');
        } catch (err) {
            toast(err.message || 'Login failed');
        }
    });

    el('#registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = el('#regName').value.trim();
        const email = el('#regEmail').value.trim();
        const password = el('#regPassword').value;
        if (!name || !email) return toast('Name and email are required.');
        if (password.length < 6) return toast('Password must be at least 6 characters.');
        try {
            const { user } = await apiRegister({ name, email, password });
            state.user = user;
            localStorage.setItem('user', JSON.stringify(user));
            updateAccountUI();
            toast('Account created! Welcome to J4R Box.');
            closeModal('#authModal');
        } catch (err) {
            toast(err.message || 'Registration failed');
        }
    });

    el('#contactForm').addEventListener('submit', (e) => { e.preventDefault(); toast('Message sent successfully!'); e.target.reset(); });
    
    function escapeHtml(str) {
        if (!str) return '';
        return ('' + str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
    }
    
    (function injectAccountMenu() {
        const wrapper = document.createElement('div');
        wrapper.id = 'accountMenu';
        wrapper.className = 'hidden absolute right-4 top-16 w-48 bg-[#071726] border border-white/10 rounded-md shadow-lg p-2 text-sm';
        wrapper.style.zIndex = 60;
        wrapper.innerHTML = `
            <button id="openAuthBtnSmall" class="w-full text-left px-3 py-2 rounded hover:bg-white/10">Login / Register</button>
            <button id="logoutBtn" class="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-red-400 hidden">Logout</button>
        `;
        document.body.appendChild(wrapper);

        el('#btnAccount').addEventListener('click', () => {
            wrapper.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#accountMenu') && !e.target.closest('#btnAccount')) {
                wrapper.classList.add('hidden');
            }
        });

        el('#openAuthBtnSmall').addEventListener('click', () => { openAuth('login'); wrapper.classList.add('hidden'); });
        el('#logoutBtn').addEventListener('click', () => {
            state.user = null;
            localStorage.removeItem('user');
            updateAccountUI();
            toast('You have been logged out.');
            wrapper.classList.add('hidden');
        });
    })();

    (function init() {
        el('#year').textContent = new Date().getFullYear();
        updateAccountUI();
        loadProducts();

        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        if (!localUsers.find(u => u.email === ADMIN_CREDENTIALS.email)) {
            localUsers.push({ id: uid(), ...ADMIN_CREDENTIALS });
            localStorage.setItem('localUsers', JSON.stringify(localUsers));
        }
    })();
});


// ===============================================
// MOUSE TRAIL EFFECT
// ===============================================
var canvas = document.querySelector('#c'),
    ctx = canvas.getContext('2d'),
    points = [],
    m = { x: null, y: null };

var a = 20, b = 5, c = 0.1, d = 100;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

m.x = canvas.width / 2;
m.y = canvas.height / 2;

window.addEventListener('mousemove', function (e) {
    TweenMax.to(m, 0.3, { x: e.clientX, y: e.clientY, ease: 'linear' });
});

for (var i = 0; i < a; i++) {
    points.push({
        r: 360 / a * i,
        p: { x: null, y: null },
        c: '#fff',
        d: Math.random() * (d + 5) - 5,
        s: Math.random() * (b + 5) - 5
    });
}

function render() {
    if (m.x == null || m.y == null) return;
    ctx.fillStyle = `rgba(5, 8, 11, ${c})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.r += p.s;
        if (p.r >= 360) p.r = p.r - 360;
        var vel = {
            x: p.d * Math.cos(p.r * Math.PI / 180),
            y: p.d * Math.sin(p.r * Math.PI / 180)
        };
        if (p.p.x != null && p.p.y != null) {
            ctx.strokeStyle = p.c;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.p.x, p.p.y);
            ctx.lineTo(m.x + vel.x, m.y + vel.y);
            ctx.stroke();
            ctx.closePath();
        }
        p.p.x = m.x + vel.x;
        p.p.y = m.y + vel.y;
    }
}

window.requestAnimFrame = (() => {
    return window.requestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };
})();

(function animloop() {
    requestAnimFrame(animloop);
    render();
})();