const canvas = document.getElementById("characterCanvas");
const ctx = canvas.getContext("2d");
const frameCount = 64;
const frames = [];
let centerFrame = null;
let cutoutImg = null;
let targetAngle = -Math.PI / 2;
let currentAngle = targetAngle;
let mouseX = innerWidth * .5, mouseY = innerHeight * .35;
let ready = 0;

// 3D Particles Data Structure
const particles3D = Array.from({ length: 90 }, () => ({
  x: (Math.random() - 0.5) * 2000,
  y: (Math.random() - 0.5) * 1500,
  z: Math.random() * 1000 + 100,
  size: Math.random() * 2.5 + 1.2,
  alpha: Math.random() * 0.7 + 0.3,
  vx: (Math.random() - 0.5) * 0.5,
  vy: (Math.random() - 0.5) * 0.5,
}));

function resize(){
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize", resize); resize();

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const im = new Image();
    im.onload=()=>resolve(im);
    im.onerror=reject;
    im.src=src;
  });
}

// Load character cutout and frames
loadImage("public/character_cutout.png")
  .then(im => { cutoutImg = im; })
  .catch(err => console.log("Cutout load error", err));

Promise.all(Array.from({length:frameCount},(_,i)=>loadImage(`public/frames/frame-${String(i).padStart(3,"0")}.webp`)))
.then(imgs=>{
  frames.push(...imgs);
  ready += imgs.length;
  return loadImage("public/frames/center.webp");
})
.then(im=>{
  centerFrame=im; ready++;
  requestAnimationFrame(render);
})
.catch(err=>{
  console.error("Frame loading failed:",err);
  loadImage("public/character.png").then(im => { centerFrame = im; requestAnimationFrame(render); });
});

function lerpAngle(a,b,t){
  let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI;
  return a+d*t;
}

function getHeadCenter(){
  const vw = innerWidth, vh = innerHeight;
  const iw = 1280, ih = 720;
  const scale = Math.max(vw / iw, vh / ih);
  const dh = ih * scale;
  const y = (vh - dh) / 2;
  return { cx: vw * 0.5, cy: y + 295 * scale, scale };
}

// Render Interactive 3D Canvas Background
function draw3DBackground(){
  const vw = innerWidth, vh = innerHeight;
  const cx = vw * 0.5, cy = vh * 0.5;

  // 1. Dynamic 3D lighting gradient following mouse
  const bgGrad = ctx.createRadialGradient(mouseX, mouseY, 50, cx, cy, Math.max(vw, vh));
  bgGrad.addColorStop(0, "rgba(255, 36, 79, 0.28)");
  bgGrad.addColorStop(0.35, "rgba(22, 10, 32, 0.96)");
  bgGrad.addColorStop(1, "#07080d");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, vw, vh);

  const fov = 420;

  // 2. 3D Particle Constellation & Depth Parallax
  const projected = [];
  for (let p of particles3D) {
    p.x += p.vx; p.y += p.vy;
    if (p.x > 1000) p.x = -1000; if (p.x < -1000) p.x = 1000;
    if (p.y > 800) p.y = -800; if (p.y < -800) p.y = 800;

    const rotX = p.x + (mouseX - cx) * (p.z * 0.0004);
    const rotY = p.y + (mouseY - cy) * (p.z * 0.0004);
    const pScale = fov / (p.z + fov);

    const sx = cx + rotX * pScale;
    const sy = cy + rotY * pScale;

    if (sx >= 0 && sx <= vw && sy >= 0 && sy <= vh) {
      projected.push({ sx, sy, z: p.z, alpha: p.alpha * pScale });

      ctx.beginPath();
      ctx.arc(sx, sy, p.size * pScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * pScale})`;
      ctx.fill();
    }
  }

  // Draw 3D connecting lines between near nodes
  ctx.strokeStyle = "rgba(255, 36, 79, 0.12)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < projected.length; i += 3) {
    for (let j = i + 1; j < projected.length; j += 6) {
      const dx = projected[i].sx - projected[j].sx;
      const dy = projected[i].sy - projected[j].sy;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(projected[i].sx, projected[i].sy);
        ctx.lineTo(projected[j].sx, projected[j].sy);
        ctx.stroke();
      }
    }
  }
}

function drawCover(im){
  if(!im) return;
  const vw=innerWidth, vh=innerHeight;
  const iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height;
  const scale=Math.max(vw/iw,vh/ih);
  const dw=iw*scale, dh=ih*scale;

  // 3D Parallax offset on Uday's portrait
  const shiftX = (mouseX - vw * 0.5) * 0.015;
  const shiftY = (mouseY - vh * 0.5) * 0.015;
  const x = (vw - dw) / 2 + shiftX, y = (vh - dh) / 2 + shiftY;

  // 3D Backlight Silhouette Glow
  const headPos = getHeadCenter();
  const glow = ctx.createRadialGradient(headPos.cx + shiftX, headPos.cy + shiftY, 30, headPos.cx, headPos.cy, 360 * scale);
  glow.addColorStop(0, "rgba(255, 36, 79, 0.38)");
  glow.addColorStop(0.5, "rgba(124, 60, 255, 0.20)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, vw, vh);

  ctx.drawImage(im,x,y,dw,dh);
}

function render(){
  const { cx, cy, scale } = getHeadCenter();
  targetAngle = Math.atan2(mouseY - cy, mouseX - cx);
  currentAngle = lerpAngle(currentAngle, targetAngle, 0.32);

  ctx.clearRect(0,0,innerWidth,innerHeight);

  // 1. Draw 3D Background
  draw3DBackground();

  // 2. Select character frame / cutout
  const dist = Math.hypot(mouseX - cx, mouseY - cy);
  const deadzone = 70 * Math.max(scale, 0.8);

  let im = (dist < deadzone && cutoutImg) ? cutoutImg : null;
  if(!im && frames.length){
    let rel = currentAngle + Math.PI / 2;
    rel = (rel % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const idx = Math.round((rel / (Math.PI * 2)) * frameCount) % frameCount;
    im = frames[idx];
  }
  if(!im) im = cutoutImg || centerFrame;

  // 3. Draw character with 3D depth shift
  drawCover(im);

  // Smooth magnetic cursor ring animation
  if(ring) {
    rx += (mouseX - rx) * 0.18; 
    ry += (mouseY - ry) * 0.18;
    ring.style.left = rx + "px"; 
    ring.style.top = ry + "px";
  }

  requestAnimationFrame(render);
}

// Magnetic cursor
const dot = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
let rx = mouseX, ry = mouseY;

function updateCursorPos(e){
  mouseX = e.clientX; mouseY = e.clientY;
  if(dot){ dot.style.left = mouseX + "px"; dot.style.top = mouseY + "px"; }
}

addEventListener("pointermove", updateCursorPos);
addEventListener("mousemove", updateCursorPos);

document.querySelectorAll("a,button").forEach(el=>{
  el.addEventListener("mouseenter",()=>{if(ring){ring.style.width="48px";ring.style.height="48px"}});
  el.addEventListener("mouseleave",()=>{if(ring){ring.style.width="34px";ring.style.height="34px"}});
});

// Scroll reveal
const items=document.querySelectorAll(".project,.achievement,.skill-grid div,.gallery-card");
items.forEach(el=>{el.style.opacity="0";el.style.transform="translateY(18px)";el.style.transition="opacity .6s ease,transform .6s ease"});
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";io.unobserve(e.target)}
}),{threshold:.12});
items.forEach(i=>io.observe(i));
