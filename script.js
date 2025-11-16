// ===============================================
// J4R BOX - CLEAN STABLE VERSION (LOCAL ONLY)
// ===============================================

// Shortcuts
const el = s => document.querySelector(s);
const els = s => Array.from(document.querySelectorAll(s));
const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

// Fake admin account
const ADMIN = {
    name: "Jei Raido",
    email: "JeiRaido11254@gmail.com",
    password: "JayRide4"
};

// Global State
const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem("cart") || "[]"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
    filters: { q: "", category: "all", sort: "featured" }
};

// Generate random ID
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Toast message
function toast(msg, ms = 2000) {
    const t = el("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), ms);
}

// Escape text
function escapeHtml(str = "") {
    return str.replace(/[&<>'"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;' }[c]));
}

// ===============================================
// PRODUCT LIST (fixed + corrected)
// ===============================================
const demoProducts = [
    { _id: uid(), name: "Elden Ring (PC)", category: "virtual", price: 2699, stock: 50, image: "./images/elden.jpg", description: "Award-winning ARPG. Steam key." },
    { _id: uid(), name: "God of War Ragnarok (PS5)", category: "physical", price: 3495, stock: 20, image: "./images/god.jpg", description: "Brand new physical disc." },
    { _id: uid(), name: "Genshin Genesis Crystals 6480", category: "currency", price: 4290, stock: 999, image: "./images/genshin.jpg", description: "In-game top up." },
    { _id: uid(), name: "Razer BlackShark V2 X", category: "accessory", price: 2499, stock: 35, image: "./images/razer.png", description: "Lightweight esports headset." },
    { _id: uid(), name: "Minecraft (Java & Bedrock)", category: "virtual", price: 1599, stock: 100, image: "./images/minecraft.jpeg", description: "PC digital code." },
    { _id: uid(), name: "Nintendo Switch Pro Controller", category: "accessory", price: 3495, stock: 15, image: "./images/nintendo.jpeg", description: "Official Pro Controller." },
    { _id: uid(), name: "NBA 2K24 (PS4)", category: "physical", price: 1995, stock: 25, image: "./images/nba.jpeg", description: "PS4 physical disc." },
    { _id: uid(), name: "Valorant Points 475", category: "currency", price: 249, stock: 999, image: "./images/valo.png", description: "Direct Riot top-up." },

    // Updated items you requested:
    { _id: uid(), name: "Cyberpunk Expansion Pack", category: "virtual", price: 1299, stock: 60, image: "./images/cyber.png", description: "DLC pack with skins and missions." },
    { _id: uid(), name: "Logitech Pro 2", category: "accessory", price: 2599, stock: 40, image: "./images/mouse.png", description: "High DPI esports mouse." },
    { _id: uid(), name: "Steam Wallet ₱1000", category: "currency", price: 1000, stock: 999, image: "./images/steam.png", description: "Steam wallet code." },
    { _id: uid(), name: "Oculus Quest", category: "accessory", price: 8999, stock: 6, image: "./images/oculus.png", description: "All-in-one VR headset." }
];

// Save products to local if missing
if (!localStorage.getItem("products")) {
    localStorage.setItem("products", JSON.stringify(demoProducts));
}

// ===============================================
// SIMULATED LOCAL API
// ===============================================
async function apiGetProducts() {
    return JSON.parse(localStorage.getItem("products"));
}

async function apiCreateProduct(p) {
    const list = JSON.parse(localStorage.getItem("products"));
    p._id = uid();
    list.push(p);
    localStorage.setItem("products", JSON.stringify(list));
}

async function apiUpdateProduct(id, data) {
    const list = JSON.parse(localStorage.getItem("products"));
    const i = list.findIndex(p => p._id === id);
    if (i !== -1) list[i] = { ...list[i], ...data };
    localStorage.setItem("products", JSON.stringify(list));
}

async function apiDeleteProduct(id) {
    const list = JSON.parse(localStorage.getItem("products")).filter(p => p._id !== id);
    localStorage.setItem("products", JSON.stringify(list));
}

async function apiRegister({ name, email, password }) {
    const users = JSON.parse(localStorage.getItem("localUsers") || "[]");
    if (users.find(u => u.email === email)) throw new Error("Email already exists");
    const u = { id: uid(), name, email, password };
    users.push(u);
    localStorage.setItem("localUsers", JSON.stringify(users));
}

async function apiLogin({ email, password }) {
    const users = JSON.parse(localStorage.getItem("localUsers") || "[]");
    const u = users.find(x => x.email === email && x.password === password);

    if (u) return { user: { name: u.name, email: u.email } };

    if (email === ADMIN.email && password === ADMIN.password)
        return { user: { name: ADMIN.name, email: ADMIN.email, admin: true } };

    throw new Error("Invalid credentials");
}

// ===============================================
// RENDER PRODUCTS
// ===============================================
function renderProducts() {
    const grid = el("#productGrid");
    let list = [...state.products];

    const q = state.filters.q.toLowerCase().trim();
    if (q) list = list.filter(p =>
        (p.name + p.description).toLowerCase().includes(q)
    );

    if (state.filters.category !== "all")
        list = list.filter(p => p.category === state.filters.category);

    switch (state.filters.sort) {
        case "price-asc": list.sort((a, b) => a.price - b.price); break;
        case "price-desc": list.sort((a, b) => b.price - a.price); break;
        case "name-asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case "name-desc": list.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    grid.innerHTML = list.map(p => `
        <div class="card p-4 rounded-lg flex flex-col">
            <img src="${p.image}" class="w-full h-44 object-cover rounded" />
            <div class="font-semibold mt-3 line-clamp-2">${escapeHtml(p.name)}</div>
            <div class="text-xs text-slate-400">${escapeHtml(p.description)}</div>
            <div class="text-indigo-300 font-bold mt-2">${fmt.format(p.price)}</div>

            <div class="flex justify-between mt-4">
                <span class="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">${p.category}</span>

                <button class="px-3 py-1.5 bg-white/10 rounded hover:bg-white/20"
                        data-add="${p._id}">Add to Cart</button>
            </div>
        </div>
    `).join("");

    grid.querySelectorAll("[data-add]").forEach(btn =>
        btn.addEventListener("click", () => addToCart(btn.dataset.add))
    );
}

// ===============================================
// CART
// ===============================================
function addToCart(id) {
    const p = state.products.find(x => x._id === id);
    if (!p) return;

    const item = state.cart.find(x => x._id === id);
    if (item) item.qty++;
    else state.cart.push({ ...p, qty: 1 });

    localStorage.setItem("cart", JSON.stringify(state.cart));
    renderCart();
    toast("Added to cart!");
}

function changeQty(id, n) {
    const item = state.cart.find(x => x._id === id);
    if (!item) return;
    item.qty += n;
    if (item.qty <= 0) state.cart = state.cart.filter(x => x._id !== id);
    localStorage.setItem("cart", JSON.stringify(state.cart));
    renderCart();
}

function renderCart() {
    const list = state.cart;
    const container = el("#cartDrawerContent");
    const count = el("#cartCount");

    count.textContent = list.reduce((a, b) => a + b.qty, 0);

    if (!container) return;

    container.innerHTML = list.length === 0
        ? `<div class="p-4 text-slate-400">Your cart is empty.</div>`
        : list.map(i => `
            <div class="p-3 border-b border-white/10 flex items-center gap-3">
                <img src="${i.image}" class="w-14 h-14 rounded object-cover" />
                <div class="flex-1">
                    <div class="font-semibold">${escapeHtml(i.name)}</div>
                    <div class="text-sm">${fmt.format(i.price)}</div>
                    <div class="flex gap-2 mt-1">
                        <button class="px-2" onclick="changeQty('${i._id}',-1)">-</button>
                        <span>${i.qty}</span>
                        <button class="px-2" onclick="changeQty('${i._id}',1)">+</button>
                    </div>
                </div>
            </div>
        `).join("");
}

// ===============================================
// AUTH
// ===============================================
function updateAccountUI() {
    el("#accountLabel").textContent = state.user ? state.user.name : "Login";
}

function openAuth(mode) {
    el("#loginForm").classList.toggle("hidden", mode !== "login");
    el("#registerForm").classList.toggle("hidden", mode !== "register");
    el("#authModal").classList.remove("hidden");
}

function closeAuth() {
    el("#authModal").classList.add("hidden");
}

// ===============================================
// INIT + EVENT BINDINGS
// ===============================================
document.addEventListener("DOMContentLoaded", async () => {

    // Load products
    state.products = await apiGetProducts();
    renderProducts();
    renderCart();
    updateAccountUI();

    // Search
    el("#searchInput").addEventListener("input", e => {
        state.filters.q = e.target.value;
        renderProducts();
    });

    // Category filter
    el("#categoryFilter").addEventListener("change", e => {
        state.filters.category = e.target.value;
        renderProducts();
    });

    // Sorting
    el("#sortSelect").addEventListener("change", e => {
        state.filters.sort = e.target.value;
        renderProducts();
    });

    // Open Auth
    el("#btnAccount").addEventListener("click", () => openAuth("login"));
    el("#ctaLogin").addEventListener("click", () => openAuth("login"));

    // Close Auth
    el("#closeAuth")?.addEventListener("click", closeAuth);

    // Login form
    el("#loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = el("#loginEmail").value;
        const password = el("#loginPassword").value;

        try {
            const res = await apiLogin({ email, password });
            state.user = res.user;
            localStorage.setItem("user", JSON.stringify(state.user));
            updateAccountUI();
            closeAuth();
            toast("Login successful!");
        } catch (err) {
            toast("Invalid email / password");
        }
    });

    // Register
    el("#registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = el("#regName").value;
        const email = el("#regEmail").value;
        const password = el("#regPassword").value;

        try {
            await apiRegister({ name, email, password });
            toast("Account created!");
            openAuth("login");
        } catch (err) {
            toast(err.message);
        }
    });

    // Cart
    el("#btnCart").addEventListener("click", () => {
        el("#cartDrawer").classList.remove("hidden");
    });
    el("#closeCart")?.addEventListener("click", () => {
        el("#cartDrawer").classList.add("hidden");
    });

    el("#checkoutBtn")?.addEventListener("click", () => {
        if (!state.user) return toast("Please log in first.");
        if (!state.cart.length) return toast("Your cart is empty.");
        toast("Order placed! Delivery incoming 🚚");
        state.cart = [];
        localStorage.setItem("cart", "[]");
        renderCart();
    });
});
