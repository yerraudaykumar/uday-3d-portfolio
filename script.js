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

// Load static 3D portrait character image
loadImage("public/character_cutout.png")
  .then(im => { characterImg = im; requestAnimationFrame(render); })
  .catch(() => {
    loadImage("public/character.png").then(im => { characterImg = im; requestAnimationFrame(render); });
  });

// Render 3D Ambient Space Background
function draw3DBackground(){
  const vw = innerWidth, vh = innerHeight;
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

function drawCover(im){
  if(!im) return;
  const vw=innerWidth, vh=innerHeight;
  const iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height;
  const scale=Math.max(vw/iw,vh/ih);
  const dw=iw*scale, dh=ih*scale;
  const x=(vw-dw)/2, y=(vh-dh)/2;

  // 3D Ambient Backlight Silhouette Glow
  const glow = ctx.createRadialGradient(vw * 0.5, vh * 0.4, 40, vw * 0.5, vh * 0.4, 380 * scale);
  glow.addColorStop(0, "rgba(255, 36, 79, 0.35)");
  glow.addColorStop(0.5, "rgba(124, 60, 255, 0.18)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, vw, vh);

  ctx.drawImage(im,x,y,dw,dh);
}

function render(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  draw3DBackground();
  if(characterImg) drawCover(characterImg);
  requestAnimationFrame(render);
}

// Scroll reveal
const items=document.querySelectorAll(".project,.achievement,.skill-grid div,.gallery-card");
items.forEach(el=>{el.style.opacity="0";el.style.transform="translateY(18px)";el.style.transition="opacity .6s ease,transform .6s ease"});
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";io.unobserve(e.target)}
}),{threshold:.12});
items.forEach(i=>io.observe(i));
