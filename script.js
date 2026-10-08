// -------------------------------------------------------------
// CANVAS 3D PARTICLES & CHARACTER RENDERER
// -------------------------------------------------------------
const canvas = document.getElementById("characterCanvas");
const ctx = canvas.getContext("2d");
let characterImg = null;

// 3D Particles Data Structure
const particles3D = Array.from({ length: 90 }, () => ({
  x: (Math.random() - 0.5) * 2000,
  y: (Math.random() - 0.5) * 1500,
  z: Math.random() * 1000 + 100,
  size: Math.random() * 2.5 + 1.2,
  alpha: Math.random() * 0.7 + 0.3,
  vx: (Math.random() - 0.5) * 0.4,
  vy: (Math.random() - 0.5) * 0.4,
}));

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

// Load static 3D portrait character image
loadImage("public/character_cutout.png")
  .then(im => { characterImg = im; requestAnimationFrame(render); })
  .catch(() => {
    loadImage("public/character.png").then(im => { characterImg = im; requestAnimationFrame(render); });
  });

// Render 3D Ambient Space Background
function draw3DBackground() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = vw * 0.5, cy = vh * 0.5;

  // 1. Ambient 3D Glow Gradient
  const bgGrad = ctx.createRadialGradient(cx, cy * 0.6, 50, cx, cy, Math.max(vw, vh));
  bgGrad.addColorStop(0, "rgba(255, 36, 79, 0.28)");
  bgGrad.addColorStop(0.4, "rgba(20, 10, 30, 0.95)");
  bgGrad.addColorStop(1, "#07080d");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, vw, vh);

  const fov = 420;

  // 2. 3D Particle Constellation
  const projected = [];
  for (let p of particles3D) {
    p.x += p.vx; p.y += p.vy;
    if (p.x > 1000) p.x = -1000; if (p.x < -1000) p.x = 1000;
    if (p.y > 800) p.y = -800; if (p.y < -800) p.y = 800;

    const pScale = fov / (p.z + fov);
    const sx = cx + p.x * pScale;
    const sy = cy + p.y * pScale;

    if (sx >= 0 && sx <= vw && sy >= 0 && sy <= vh) {
      projected.push({ sx, sy, alpha: p.alpha * pScale });

      ctx.beginPath();
      ctx.arc(sx, sy, p.size * pScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * pScale})`;
      ctx.fill();
    }
  }

  // Draw 3D connecting lines between close particles
  ctx.strokeStyle = "rgba(255, 36, 79, 0.12)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < projected.length; i += 3) {
    for (let j = i + 1; j < projected.length; j += 6) {
      const dx = projected[i].sx - projected[j].sx;
      const dy = projected[i].sy - projected[j].sy;
      if (Math.hypot(dx, dy) < 120) {
        ctx.beginPath();
        ctx.moveTo(projected[i].sx, projected[i].sy);
        ctx.lineTo(projected[j].sx, projected[j].sy);
        ctx.stroke();
      }
    }
  }
}

function drawCover(im) {
  if (!im) return;
  const vw = window.innerWidth, vh = window.innerHeight;
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  
  // Scale character intelligently for portrait (mobile) vs landscape (laptop)
  let scale = Math.max(vw / iw, vh / ih);
  let dw = iw * scale, dh = ih * scale;
  let x = (vw - dw) / 2;
  let y = (vh - dh) / 2;

  // On mobile devices, slightly nudge down so character head/body integrates nicely
  if (vw <= 600) {
    scale = Math.max(vw / iw, (vh * 0.85) / ih);
    dw = iw * scale;
    dh = ih * scale;
    x = (vw - dw) / 2;
    y = vh - dh;
  }

  // 3D Ambient Backlight Silhouette Glow
  const glow = ctx.createRadialGradient(vw * 0.5, vh * 0.4, 40, vw * 0.5, vh * 0.4, 380 * scale);
  glow.addColorStop(0, "rgba(255, 36, 79, 0.35)");
  glow.addColorStop(0.5, "rgba(124, 60, 255, 0.18)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, vw, vh);

  ctx.drawImage(im, x, y, dw, dh);
}

function render() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  draw3DBackground();
  if (characterImg) drawCover(characterImg);
  requestAnimationFrame(render);
}

// -------------------------------------------------------------
// MOBILE NAVIGATION MENU TOGGLE
// -------------------------------------------------------------
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
  });

  // Close menu when clicking any nav link
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (navMenu.classList.contains("active") && 
        !navMenu.contains(e.target) && 
        !menuToggle.contains(e.target)) {
      navMenu.classList.remove("active");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// -------------------------------------------------------------
// SCROLL REVEAL & ACTIVE SECTION HIGHLIGHTING
// -------------------------------------------------------------
const items = document.querySelectorAll(".project, .achievement, .edu-card, .exp-card, .skill-grid div, .cert-grid div, .gallery-card");
items.forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(22px)";
  el.style.transition = "opacity .6s ease, transform .6s ease";
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

items.forEach(i => revealObserver.observe(i));

// Highlight active nav link on scroll
const sections = document.querySelectorAll("section[id]");
window.addEventListener("scroll", () => {
  let scrollY = window.scrollY;
  sections.forEach(current => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 120;
    const sectionId = current.getAttribute("id");
    const activeLink = document.querySelector(`.nav-menu a[href*="#${sectionId}"]`);
    
    if (activeLink) {
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        activeLink.classList.add("active");
      } else {
        activeLink.classList.remove("active");
      }
    }
  });
});

// -------------------------------------------------------------
// CUSTOM CURSOR (LAPTOP / DESKTOP ONLY)
// -------------------------------------------------------------
const cursorDot = document.getElementById("cursorDot");
const cursorRing = document.getElementById("cursorRing");

if (cursorDot && cursorRing && window.matchMedia("(pointer: fine)").matches) {
  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  function animateCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover state for interactive elements
  const hoverables = document.querySelectorAll("a, button, .project, .btn, .gallery-card");
  hoverables.forEach(el => {
    el.addEventListener("mouseenter", () => cursorRing.classList.add("active"));
    el.addEventListener("mouseleave", () => cursorRing.classList.remove("active"));
  });
}
