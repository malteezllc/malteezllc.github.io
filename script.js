// Initialize Icons (guarded in case the external script fails to load)
if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
}
// Load events data and render cards
loadEvents().catch(err => console.error('loadEvents error', err));
// Load menu data and render sections
loadMenu && typeof loadMenu === 'function' ? loadMenu().catch(err => console.error('loadMenu error', err)) : (function(){ /* loadMenu will be invoked after it's defined if hoisting rules differ */ })();

// --- Mobile Menu Logic ---
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// --- Events loader / renderer ---
async function loadEvents(source = 'data/events.json') {
    const container = document.getElementById('eventsGrid');
    if (!container) {
        console.warn('eventsGrid container not found');
        return;
    }

    // simple loading state
    container.innerHTML = '<div class="col-span-3 text-center text-gray-400">Loading events...</div>';

    try {
        const resp = await fetch(source);
        if (!resp.ok) throw new Error('Network response was not ok');
        const data = await resp.json();
        if (!Array.isArray(data)) throw new Error('Events JSON is not an array');

        container.innerHTML = '';
        data.forEach(ev => {
            const node = renderEventCard(ev);
            container.appendChild(node);
        });

        // render any icons inside injected content
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="col-span-3 text-center text-red-400">Failed to load events. <button id="retryEvents" class="underline ml-2">Retry</button></div>';
        const btn = document.getElementById('retryEvents');
        if (btn) btn.addEventListener('click', () => loadEvents(source));
    }
}

function renderEventCard(ev) {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl overflow-hidden group transition-colors';

    // hero band
    const hero = document.createElement('div');
    const fromClass = ev.gradient && ev.gradient.from ? `from-${ev.gradient.from}` : 'from-pink-800';
    const toClass = ev.gradient && ev.gradient.to ? `to-${ev.gradient.to}` : 'to-purple-900';
    hero.className = `h-48 bg-gradient-to-br ${fromClass} ${toClass} relative flex items-center justify-center overflow-hidden`;
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors';
    const emoji = document.createElement('span');
    emoji.className = 'text-6xl group-hover:scale-110 transition-transform duration-500';
    emoji.textContent = ev.emoji || '🎨';
    hero.appendChild(overlay);
    hero.appendChild(emoji);

    // body
    const body = document.createElement('div');
    body.className = 'p-6';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex justify-between items-start mb-4';

    const left = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.className = 'text-xl font-bold text-white mb-1';
    h3.textContent = ev.title || 'Untitled Event';
    const theme = document.createElement('p');
    theme.className = 'text-anime-pink text-sm';
    theme.textContent = ev.theme || '';
    left.appendChild(h3);
    left.appendChild(theme);

    const right = document.createElement('div');
    right.className = 'text-right';
    const price = document.createElement('p');
    price.className = 'font-display text-2xl';
    if (typeof ev.price === 'number') {
        const symbol = ev.currency === 'USD' || !ev.currency ? '$' : ev.currency + ' ';
        price.textContent = `${symbol}${ev.price}`;
    } else {
        price.textContent = ev.priceDisplay || (ev.price || 'TBD');
    }
    const dateP = document.createElement('p');
    dateP.className = 'text-xs text-gray-500';
    if (ev.dateISO) {
        try {
            const dt = new Date(ev.dateISO);
            dateP.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(dt);
        } catch (e) {
            dateP.textContent = ev.dateDisplay || '';
        }
    } else {
        dateP.textContent = ev.dateDisplay || '';
    }
    right.appendChild(price);
    right.appendChild(dateP);

    headerRow.appendChild(left);
    headerRow.appendChild(right);

    // features
    const ul = document.createElement('ul');
    ul.className = 'text-sm text-gray-400 mb-6 space-y-2';
    (ev.features || []).forEach(f => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2';
        const ico = document.createElement('i');
        ico.setAttribute('data-lucide', 'check');
        ico.className = 'w-4 h-4 text-green-500';
        const span = document.createElement('span');
        span.textContent = f;
        li.appendChild(ico);
        li.appendChild(span);
        ul.appendChild(li);
    });

    // cta (link to Eventbrite)
    const btn = document.createElement('a');
    btn.className = `w-full inline-block py-3 rounded-xl border text-anime-pink hover:text-white transition-colors font-bold text-center`;
    // choose border/text color based on gradient if possible
    if (ev.gradient && ev.gradient.from && ev.gradient.from.includes('pink')) btn.classList.add('border-anime-pink');
    else if (ev.gradient && ev.gradient.from && ev.gradient.from.includes('yellow')) btn.classList.add('border-anime-yellow', 'text-anime-yellow');
    else if (ev.gradient && ev.gradient.from && ev.gradient.from.includes('blue')) btn.classList.add('border-anime-cyan', 'text-anime-cyan');
    else btn.classList.add('border-anime-pink');
    btn.textContent = ev.ctaLabel || 'Reserve Spot';
    // default to the site Eventbrite URL if no specific link provided
    const eventbriteUrl = 'https://www.eventbrite.com/o/malteez-nyc-anime-paint-sip-120877481547';
    btn.href = ev.link || eventbriteUrl;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';

    body.appendChild(headerRow);
    body.appendChild(ul);
    body.appendChild(btn);

    card.appendChild(hero);
    card.appendChild(body);

    return card;
}

// --- Menu loader / renderer ---
async function loadMenu(source = 'data/menu.json') {
    const container = document.getElementById('menuGrid');
    if (!container) {
        console.warn('menuGrid container not found');
        return;
    }

    container.innerHTML = '<div class="col-span-2 text-center text-gray-400">Loading menu...</div>';

    try {
        const resp = await fetch(source);
        if (!resp.ok) throw new Error('Network response was not ok');
        const data = await resp.json();
        if (!Array.isArray(data)) throw new Error('Menu JSON is not an array');

        container.innerHTML = '';
        data.forEach(section => {
            const node = renderMenuSection(section);
            container.appendChild(node);
        });

        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="col-span-2 text-center text-red-400">Failed to load menu.</div>';
    }
}

function renderMenuSection(section = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'glass-card p-8 rounded-2xl';

    let headingColor = 'text-anime-pink';
    if (section.icon === 'utensils' || section.id === 'snack-bites') headingColor = 'text-anime-yellow';

    const h3 = document.createElement('h3');
    h3.className = `text-2xl font-bold ${headingColor} mb-6 flex items-center gap-2`;

    if (section.icon) {
        const iconNode = document.createElement('i');
        iconNode.setAttribute('data-lucide', section.icon);
        iconNode.className = 'w-5 h-5';
        h3.appendChild(iconNode);
    }

    const titleText = document.createElement('span');
    titleText.textContent = section.title || section.id || 'Menu';
    h3.appendChild(titleText);
    wrap.appendChild(h3);

    const list = document.createElement('div');
    list.className = 'space-y-6';

    (section.items || []).forEach(item => {
        const row = document.createElement('div');
        row.className = 'flex justify-between border-b border-gray-700 pb-2';

        const left = document.createElement('div');
        const name = document.createElement('h4');
        name.className = 'font-bold';
        name.textContent = item.name || 'Item';
        const desc = document.createElement('p');
        desc.className = 'text-xs text-gray-400';
        desc.textContent = item.description || '';
        left.appendChild(name);
        left.appendChild(desc);

        const price = document.createElement('span');
        price.className = 'font-display text-xl text-anime-cyan';
        if (typeof item.price === 'number') price.textContent = `$${item.price}`;
        else price.textContent = item.price || '';

        row.appendChild(left);
        row.appendChild(price);
        list.appendChild(row);
    });

    wrap.appendChild(list);
    return wrap;
}

// --- Navbar Scroll Effect ---
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('shadow-lg');
        nav.style.background = 'rgba(15, 23, 42, 0.9)';
    } else {
        nav.classList.remove('shadow-lg');
        nav.style.background = 'rgba(15, 23, 42, 0.7)';
    }
});

// --- Booking Modal Logic ---
function openBooking(eventName) {
    const modal = document.getElementById('bookingModal');
    const eventLabel = document.getElementById('modalEventName');
    
    if (eventName) {
        eventLabel.textContent = `Event: ${eventName}`;
        eventLabel.classList.add('text-anime-pink');
    } else {
        eventLabel.textContent = "General Booking";
        eventLabel.classList.remove('text-anime-pink');
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeBooking() {
    const modal = document.getElementById('bookingModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function handleBooking(e) {
    e.preventDefault();
    closeBooking();
    showToast();
    e.target.reset();
}

// --- Toast Notification ---
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// --- Canvas Logic (Try It Section) - Acrylic-like brush ---
const canvas = document.getElementById('paintCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let painting = false;
let currentColor = '#ec4899'; // Default pink

// Brush parameters
let brushSize = 24; // base px
let activeBrushSize = brushSize; // current active size (shrinks while held)
let coloredBrushCache = {}; // cache colored stamps by color+size
let lastPos = null;
let guideDrawn = false; // whether the practice circle has been drawn

function generateBrush(size) {
    const b = document.createElement('canvas');
    b.width = b.height = size;
    const bc = b.getContext('2d');

    // base radial gradient (soft edges)
    const g = bc.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    bc.fillStyle = g;
    bc.fillRect(0,0,size,size);

    // add bristle/noise texture by adjusting alpha per-pixel
    try {
        const img = bc.getImageData(0,0,size,size);
        for (let i = 0; i < img.data.length; i += 4) {
            // reduce alpha randomly to create grain (values between 0.55 - 1)
            const alphaFactor = 0.55 + Math.random() * 0.8;
            img.data[i+3] = img.data[i+3] * alphaFactor;
        }
        bc.putImageData(img, 0, 0);
    } catch (e) {
        // getImageData can fail on some cross-origin contexts; fallback to light strokes
        for (let i=0; i<200; i++) {
            bc.globalAlpha = 0.08 + Math.random()*0.12;
            bc.beginPath();
            const rx = Math.random()*size;
            const ry = Math.random()*size;
            const rw = 1 + Math.random()*3;
            bc.fillRect(rx, ry, rw, size*0.6);
        }
        bc.globalAlpha = 1;
    }

    return b;
}

function getColoredBrush(color, size) {
    const key = `${color}_${size}`;
    if (coloredBrushCache[key]) return coloredBrushCache[key];

    const brushBase = generateBrush(size);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cc = c.getContext('2d');

    // draw brush alpha into temporary canvas
    cc.drawImage(brushBase, 0, 0);
    // colorize using source-in
    cc.globalCompositeOperation = 'source-in';
    cc.fillStyle = color;
    cc.fillRect(0,0,size,size);
    cc.globalCompositeOperation = 'source-over';

    coloredBrushCache[key] = c;
    return c;
}

// Set canvas size dynamically based on parent
function resizeCanvas() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    // preserve current drawing by copying to temp canvas
    const prev = document.createElement('canvas');
    prev.width = canvas.width || 1;
    prev.height = canvas.height || 1;
    const pctx = prev.getContext('2d');
    if (canvas.width && canvas.height) pctx.drawImage(canvas, 0, 0);

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // redraw preserved content
    ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, canvas.width, canvas.height);
    // draw practice guide circle once after initial sizing
    if (!guideDrawn) {
        drawPracticeCircle();
        guideDrawn = true;
    }
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

function startPosition(e) {
    painting = true;
    // shrink brush while pointer is held
    activeBrushSize = Math.max(6, Math.floor(brushSize * 0.6));
    lastPos = getEventPos(e);
    // stamp once immediately using active size
    stampAt(lastPos.x, lastPos.y, activeBrushSize);
}

function endPosition() {
    painting = false;
    lastPos = null;
    // restore brush size
    activeBrushSize = brushSize;
    if (ctx) ctx.beginPath();
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
}

function stampAt(x, y, sizeOverride) {
    if (!ctx) return;
    const size = sizeOverride || activeBrushSize || brushSize;
    const stamp = getColoredBrush(currentColor, size);
    // slight random rotation and scale to mimic brush variability
    const jitter = (Math.random() - 0.5) * 0.15; // +/-15%
    const drawSize = size * (1 + jitter);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random()-0.5)*0.4);
    ctx.globalAlpha = 0.9; // thick acrylic feel
    ctx.drawImage(stamp, -drawSize/2, -drawSize/2, drawSize, drawSize);
    ctx.restore();
}

function draw(e) {
    if (!painting || !canvas || !ctx) return;
    e.preventDefault();
    const pos = getEventPos(e);
    if (!lastPos) { lastPos = pos; stampAt(pos.x, pos.y); return; }

    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;
    const dist = Math.hypot(dx, dy);
    const spacing = Math.max(2, Math.floor((activeBrushSize || brushSize) * 0.25));
    const steps = Math.max(1, Math.floor(dist / spacing));

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ix = lastPos.x + dx * t;
        const iy = lastPos.y + dy * t;
        stampAt(ix, iy);
    }

    // subtle edge: overlay a faint directional streak to simulate brush drag
    if (Math.random() < 0.05) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = Math.max(1, brushSize * 0.2);
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
    }

    lastPos = pos;
}

function changeColor(color) {
    currentColor = color;
    // clear cached stamps for this color (keys are stored as `${color}_${size}`)
    Object.keys(coloredBrushCache).forEach(k => {
        if (k.startsWith(color + '_')) delete coloredBrushCache[k];
    });
    // precompute brush stamp for the current base size
    getColoredBrush(color, brushSize);
}

function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // redraw the practice guide so users can keep practicing
    drawPracticeCircle();
    guideDrawn = true;
}

// Event Listeners for Canvas
if (canvas) {
    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseleave', endPosition);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', startPosition, { passive: false });
    canvas.addEventListener('touchend', endPosition);
    canvas.addEventListener('touchmove', draw, { passive: false });
}

// --- Practice guide: draw a black circle in the center for coloring practice ---
function drawPracticeCircle() {
    // Draw a hollow star centered in the canvas for coloring practice
    if (!canvas || !ctx) return;
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    // outer radius about 25% of the smallest dimension, clamped
    const outerR = Math.max(30, Math.floor(Math.min(canvas.width, canvas.height) * 0.25));
    const innerR = Math.max(10, Math.floor(outerR * 0.45));
    const points = 5;

    // helper to compute star points
    function starPoints(cx, cy, outerR, innerR, pts) {
        const arr = [];
        const step = Math.PI / pts; // half-angle between outer and inner
        const start = -Math.PI / 2; // point up
        for (let i = 0; i < pts * 2; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const angle = start + i * step;
            arr.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        return arr;
    }

    const pts = starPoints(cx, cy, outerR, innerR, points);

    ctx.save();
    ctx.lineWidth = Math.max(4, Math.floor(outerR * 0.06));
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}
