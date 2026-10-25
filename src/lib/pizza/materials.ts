import * as THREE from 'three';

// Generate procedural checkered tile texture for the floor
export function createCheckeredFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const tileSize = 64;
  for (let x = 0; x < canvas.width; x += tileSize) {
    for (let y = 0; y < canvas.height; y += tileSize) {
      const isEven = (x / tileSize + y / tileSize) % 2 === 0;
      // Classic Italian/NYC pizzeria floor: off-white cream and deep charcoal / terracotta red
      if (isEven) {
        ctx.fillStyle = '#f4ede2';
        ctx.fillRect(x, y, tileSize, tileSize);
        // Subtle marble grain
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      } else {
        ctx.fillStyle = '#1e1c1b';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }

      // Grout line
      ctx.strokeStyle = '#2a2725';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Generate procedural mosaic brick texture for the Neapolitan Pizza Oven dome
export function createOvenDomeMosaicTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Terracotta & soot gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#2e1810'); // Dark soot at top
  bgGrad.addColorStop(0.3, '#752817'); // Rich burnt terracotta
  bgGrad.addColorStop(0.7, '#a63b22'); // Warm artisanal brick red
  bgGrad.addColorStop(1, '#541c10'); // Darker hearth base
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Concentric rows of artisanal mosaic tiles
  const rowHeight = 20;
  const tileWidth = 32;
  const mortar = 3;

  let row = 0;
  for (let y = 0; y < canvas.height; y += rowHeight + mortar) {
    const offset = (row % 2 === 0) ? 0 : tileWidth / 2;
    for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth + mortar) {
      const actualX = x + offset;
      const variant = Math.sin(x * 0.05 + y * 0.08);
      const r = Math.floor(150 + variant * 35);
      const g = Math.floor(50 + variant * 20);
      const b = Math.floor(30 + variant * 15);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(actualX, y, tileWidth, rowHeight);

      // 3D tile highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(actualX, y, tileWidth, 2);
      ctx.fillRect(actualX, y, 2, rowHeight);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(actualX, y + rowHeight - 2, tileWidth, 2);
      ctx.fillRect(actualX + tileWidth - 2, y, 2, rowHeight);
    }
    row++;
  }

  // Soot smoke stain over the front mouth
  const sootGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height, 20, canvas.width / 2, canvas.height, 220);
  sootGrad.addColorStop(0, 'rgba(15, 10, 8, 0.85)');
  sootGrad.addColorStop(0.6, 'rgba(30, 20, 15, 0.45)');
  sootGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sootGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Generate authentic Biscotto di Sorrento clay refractory floor texture with ember scorch marks
export function createBiscottoFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm refractory clay base
  ctx.fillStyle = '#8f4f34';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle circular tile segments
  ctx.strokeStyle = 'rgba(60, 25, 15, 0.45)';
  ctx.lineWidth = 3;
  const cx = 256;
  const cy = 256;
  for (let r = 50; r <= 240; r += 55) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
    ctx.stroke();
  }

  // Scorched ember and ash gradient on left side (where wood logs burn)
  const ashGrad = ctx.createRadialGradient(120, 260, 20, 120, 260, 200);
  ashGrad.addColorStop(0, 'rgba(25, 15, 12, 0.95)');
  ashGrad.addColorStop(0.5, 'rgba(45, 25, 20, 0.65)');
  ashGrad.addColorStop(0.8, 'rgba(180, 80, 40, 0.3)');
  ashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ashGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle flour dust speckled on stone landing
  for (let i = 0; i < 400; i++) {
    const fx = Math.random() * canvas.width;
    const fy = Math.random() * canvas.height;
    const alpha = Math.random() * 0.15;
    ctx.fillStyle = `rgba(255, 245, 230, ${alpha})`;
    ctx.fillRect(fx, fy, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate authentic Firebrick Arch texture for the oven mouth portal
export function createFirebrickArchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6e301e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Staggered brick rows
  const brickH = 32;
  const brickW = 64;
  let row = 0;
  for (let y = 0; y < canvas.height; y += brickH) {
    const offset = (row % 2 === 0) ? 0 : brickW / 2;
    for (let x = -brickW; x < canvas.width + brickW; x += brickW) {
      const actualX = x + offset;
      const shade = (Math.sin(x * 0.08 + y * 0.12) + 1) * 0.5;
      const r = Math.floor(160 + shade * 40);
      const g = Math.floor(65 + shade * 25);
      const b = Math.floor(40 + shade * 15);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(actualX + 2, y + 2, brickW - 4, brickH - 4);

      // Mortar bevel
      ctx.strokeStyle = '#381c14';
      ctx.lineWidth = 3;
      ctx.strokeRect(actualX + 1, y + 1, brickW - 2, brickH - 2);
    }
    row++;
  }

  // Soot smoke rim along bottom and top
  const sootTop = ctx.createLinearGradient(0, 0, 0, 80);
  sootTop.addColorStop(0, 'rgba(18, 12, 10, 0.9)');
  sootTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sootTop;
  ctx.fillRect(0, 0, canvas.width, 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Generate realistic Carrara White Marble texture for the counter
export function createMarbleCounterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5f3ef';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(140, 140, 145, 0.25)';
  ctx.lineWidth = 3;

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let x = Math.random() * canvas.width;
    let y = 0;
    ctx.moveTo(x, y);

    while (y < canvas.height) {
      x += (Math.random() - 0.45) * 40;
      y += 20 + Math.random() * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(100, 100, 110, 0.15)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 50;
      y += (Math.random() - 0.3) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

// Generate Firewood End-Grain Texture
export function createFirewoodLogTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;
  const r = 120;

  ctx.fillStyle = '#302218';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c9a26d';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(90, 60, 30, 0.35)';
  ctx.lineWidth = 2;
  for (let ring = 15; ring < r - 15; ring += 12) {
    ctx.beginPath();
    ctx.arc(cx, cy, ring, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = '#281a10';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (r - 10), cy + Math.sin(angle) * (r - 10));
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// Generate Retro Arcade Cabinet Side-Art Texture
export function createArcadeSideArtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0814';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 255, 200, 0.2)';
  ctx.lineWidth = 2;
  for (let y = canvas.height / 2; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const sunGrad = ctx.createRadialGradient(canvas.width / 2, 400, 20, canvas.width / 2, 400, 180);
  sunGrad.addColorStop(0, '#ffff00');
  sunGrad.addColorStop(0.5, '#ff007f');
  sunGrad.addColorStop(1, 'rgba(100, 0, 150, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 400, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 280);
  ctx.lineTo(canvas.width / 2 - 120, 480);
  ctx.lineTo(canvas.width / 2 + 120, 480);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff0055';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = '#cc0022';
  [
    [canvas.width / 2, 360],
    [canvas.width / 2 - 40, 430],
    [canvas.width / 2 + 40, 430]
  ].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 22, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 58px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText('HOMELAB', canvas.width / 2, 600);

  ctx.fillStyle = '#ff007f';
  ctx.shadowColor = '#ff007f';
  ctx.fillText('ARCADE', canvas.width / 2, 670);

  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#ffea00';
  ctx.shadowBlur = 10;
  ctx.fillText('INSERT COIN', canvas.width / 2, 750);
  ctx.fillText('1 PLAY 25¢', canvas.width / 2, 800);

  return new THREE.CanvasTexture(canvas);
}

// Generate Fresh Margherita Pizza Texture
export function createMargheritaPizzaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const r = 240;

  const crustGradient = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
  crustGradient.addColorStop(0, '#e8aa61');
  crustGradient.addColorStop(0.7, '#c27429');
  crustGradient.addColorStop(1, '#422008');
  ctx.fillStyle = crustGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b32414';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fill();

  const medallions = [
    [cx, cy, 55],
    [cx - 75, cy - 65, 48],
    [cx + 80, cy - 60, 52],
    [cx - 80, cy + 70, 50],
    [cx + 70, cy + 75, 48],
    [cx + 10, cy - 110, 42],
    [cx - 10, cy + 115, 44]
  ];

  medallions.forEach(([mx, my, mr]) => {
    const mozGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mozGrad.addColorStop(0, '#ffffff');
    mozGrad.addColorStop(0.7, '#fcf5d9');
    mozGrad.addColorStop(1, '#e3c06d');
    ctx.fillStyle = mozGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + (Math.random() * 0.4);
    const dist = 35 + Math.random() * 115;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.fillStyle = '#227031';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

// Generate procedural rustic brick wall texture
export function createBrickWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a201c'; // Mortar base
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brickHeight = 28;
  const brickWidth = 64;
  const mortar = 4;

  let row = 0;
  for (let y = 0; y < canvas.height; y += brickHeight + mortar) {
    const offset = (row % 2 === 0) ? 0 : brickWidth / 2;
    for (let x = -brickWidth; x < canvas.width + brickWidth; x += brickWidth + mortar) {
      const actualX = x + offset;
      // Slight color variation for rustic artisanal brick
      const shade = Math.floor(Math.random() * 25);
      const r = 160 + shade;
      const g = 65 + Math.floor(shade * 0.6);
      const b = 45 + Math.floor(shade * 0.4);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(actualX, y, brickWidth, brickHeight);

      // Highlight on top edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(actualX, y, brickWidth, 2);
      // Shadow on bottom edge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(actualX, y + brickHeight - 3, brickWidth, 3);
    }
    row++;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

export interface ChalkboardManager {
  texture: THREE.CanvasTexture;
  setPage: (pageIndex: number) => void;
  getPage: () => number;
}

// Ultra-sharp 2048x1536 multi-page chalkboard renderer for direct in-world reading
export function createChalkboardManager(): ChalkboardManager {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;

  let currentPage = 0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  function renderPage(page: number) {
    currentPage = page;

    // 1. Dark Slate Blackboard Base
    ctx.fillStyle = '#141a16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle chalk dust specks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 2400; i++) {
      const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * canvas.width;
      const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * canvas.height;
      ctx.fillRect(x, y, (i % 3) + 1, (i % 2) + 1);
    }

    // 2. Handcrafted Chalk Border
    ctx.strokeStyle = '#e0a96d';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

    // 3. Top Banner: Title & Tab Switchers
    ctx.fillStyle = '#fceabb';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("🍕 MIKEY'S PIZZERIA & HOMELAB 🍕", canvas.width / 2, 130);

    ctx.fillStyle = '#a8e6cf';
    ctx.font = 'italic 32px sans-serif';
    ctx.fillText("Chef Michael Chavez • Artisanal Systems & Infrastructure Architecture", canvas.width / 2, 180);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(90, 215);
    ctx.lineTo(canvas.width - 90, 215);
    ctx.stroke();

    // Chalk Navigation Tabs
    const tabs = [
      { id: 0, label: '⭐ 1. CHEF SPECIALS' },
      { id: 1, label: '💼 2. EXPERIENCE' },
      { id: 2, label: '🧀 3. INGREDIENTS' },
      { id: 3, label: '📜 4. EDUCATION' }
    ];

    const tabWidth = 440;
    const tabStart = (canvas.width - tabWidth * 4) / 2;
    tabs.forEach((tab, idx) => {
      const tx = tabStart + idx * tabWidth + 10;
      const isActive = tab.id === currentPage;

      if (isActive) {
        ctx.fillStyle = '#e0a96d';
        ctx.fillRect(tx, 235, tabWidth - 20, 60);
        ctx.fillStyle = '#141a16';
        ctx.font = 'bold 28px monospace';
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, 235, tabWidth - 20, 60);
        ctx.fillStyle = '#cccccc';
        ctx.font = '28px monospace';
      }
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tx + (tabWidth - 20) / 2, 275);
    });

    // Content Separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 315);
    ctx.lineTo(canvas.width - 90, 315);
    ctx.stroke();

    // 4. Render Active Page Content
    if (currentPage === 0) {
      renderSpecialsPage();
    } else if (currentPage === 1) {
      renderExperiencePage();
    } else if (currentPage === 2) {
      renderIngredientsPage();
    } else if (currentPage === 3) {
      renderEducationPage();
    }

    // 5. Chalkboard Footer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, canvas.height - 110);
    ctx.lineTo(canvas.width - 90, canvas.height - 110);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fceabb';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText("📍 LOCATION: SOUTH CAROLINA  •  EMAIL: MICHAELCHAVEZM@GMAIL.COM  •  GITHUB: MIKEY2707", canvas.width / 2, canvas.height - 65);

    texture.needsUpdate = true;
  }

  // Page 0: Chef's Specials & Executive Summary
  function renderSpecialsPage() {
    // Left Column: Chef Profile & Stats
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd3b6';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText("CHEF'S PROFILE & BIO", 110, 380);

    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    const bioLines = [
      "Experienced data center and cloud systems technician with",
      "5+ years architecting high-reliability bare-metal virtualization,",
      "enterprise ZFS storage pools, and zero-trust network topologies.",
      "Passionate about privacy-first infrastructure, automation,",
      "and maintaining 99.99% operational homelab uptime."
    ];
    bioLines.forEach((line, i) => {
      ctx.fillText(line, 110, 440 + i * 44);
    });

    // Quick Stats Chalk Box
    ctx.strokeStyle = '#a8e6cf';
    ctx.lineWidth = 3;
    ctx.strokeRect(110, 680, 840, 360);

    ctx.fillStyle = '#a8e6cf';
    ctx.font = 'bold 34px monospace';
    ctx.fillText("HARDWARE & INFRASTRUCTURE STATS", 140, 740);

    ctx.fillStyle = '#ffffff';
    ctx.font = '29px monospace';
    ctx.fillText("[•] SERVICES HOSTED : 35+ Active Services", 140, 810);
    ctx.fillText("[•] STORAGE POOLS   : 55.4 TiB (3 ZFS Pools)", 140, 875);
    ctx.fillText("[•] CORE COMPUTE    : 2 Bare-Metal Servers", 140, 940);
    ctx.fillText("[•] UPTIME RECORD   : 99.99% Continuous", 140, 1005);

    // Right Column: Featured System Recipes
    ctx.fillStyle = '#ffaaa5';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText("TODAY'S SPECIALTY PIPELINES", 1060, 380);

    const recipes = [
      { name: "Server 1: TrueNAS SCALE Storage", desc: "AMD Threadripper 3970X (32c/64t), 251.6 GiB RAM, 55.4 TiB ZFS" },
      { name: "Server 2: Proxmox VE 9 (pve01)", desc: "Intel 2.8GHz KVM Hypervisor, 64 GiB DDR4, 6 VMs & LXCs" },
      { name: "Enterprise Gateway & Ingress", desc: "UniFi UDM-Pro Zeus with Cloudflare wildcard strict SSL ingress" },
      { name: "AdGuard Home DNS Sinkhole", desc: "House DNS resolver on docker1:53 blocking telemetry & threats" },
      { name: "Media Pipeline Automation", desc: "TrueNAS apps: Jellyfin, Sonarr, Radarr, Seerr, Tdarr, Prowlarr" },
      { name: "CrowdSec & Wazuh SIEM Shield", desc: "Real-time edge IPS threat banning and top-IP request tracking" }
    ];

    recipes.forEach((rec, idx) => {
      const ry = 440 + idx * 145;
      ctx.fillStyle = '#e0a96d';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(`🍕 0${idx + 1}. ${rec.name}`, 1060, ry);

      ctx.fillStyle = '#cccccc';
      ctx.font = '28px sans-serif';
      ctx.fillText(`     ${rec.desc}`, 1060, ry + 42);
    });

    // Page indicator notice
    ctx.fillStyle = '#9fd3c7';
    ctx.font = 'italic 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("👉 Use the navigation buttons below to view Experience, Skills & Credentials", canvas.width / 2, 1370);
  }

  // Page 1: Experience
  function renderExperiencePage() {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd3b6';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText("CULINARY CAREER // WORK EXPERIENCE", 110, 380);

    const roles = [
      {
        title: "Data Center Technician 2",
        company: "Google",
        period: "2025 - Present",
        bullets: [
          "Maintain Google Cloud server operations across mission-critical hardware, fiber topologies, and global scale infrastructure.",
          "Perform optical fiber continuity testing, high-availability rack diagnostics, and rapid hardware component replacements."
        ]
      },
      {
        title: "Level 2 Support Engineer",
        company: "Dyopath",
        period: "2024 - 2025",
        bullets: [
          "Provided Tier-3 escalation support for enterprise customers; resolved advanced infrastructure and server incidents.",
          "Automated server administration via PowerShell, managed Microsoft Intune devices, and configured Active Directory."
        ]
      },
      {
        title: "Network Administrator - Consultant",
        company: "PrePaidIQ",
        period: "2022 - 2024",
        bullets: [
          "Architected Active Directory (AD), Entra ID, DHCP, and DNS configurations alongside enterprise Windows Server clusters.",
          "Engineered Ubiquiti UniFi routing with VLAN segmentation and secure multi-site WireGuard VPN tunnels."
        ]
      },
      {
        title: "R&D Technician & Support Specialist",
        company: "Corsair",
        period: "2021 - 2024",
        bullets: [
          "Executed rigorous validation protocols for high-performance hardware components, collecting deep diagnostic telemetry.",
          "Troubleshot complex hardware and firmware issues; authored standard operating procedures (SOPs)."
        ]
      }
    ];

    roles.forEach((r, idx) => {
      const ry = 440 + idx * 225;

      ctx.fillStyle = '#a8e6cf';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`▸ ${r.title}`, 110, ry);

      ctx.fillStyle = '#e0a96d';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(`${r.company}   [${r.period}]`, 110, ry + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = '28px sans-serif';
      r.bullets.forEach((b, bi) => {
        ctx.fillText(`   • ${b}`, 110, ry + 88 + bi * 38);
      });
    });
  }

  // Page 2: Skills / Ingredients
  function renderIngredientsPage() {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd3b6';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText("HOUSE INGREDIENTS // TECHNICAL SKILLS", 110, 380);

    const categories = [
      {
        title: "VIRTUALIZATION & SYSTEMS",
        skills: ["Proxmox VE Cluster", "TrueNAS Scale", "ZFS File System", "Debian / Ubuntu Linux", "Windows Server", "Active Directory / Entra ID"]
      },
      {
        title: "CONTAINERS & CLOUD INFRASTRUCTURE",
        skills: ["Docker & Docker Compose", "Portainer Management", "Google Cloud Platform (GCP)", "Terraform IaC", "Ansible Automation", "CI/CD Deployment Pipelines"]
      },
      {
        title: "NETWORKING & SECURITY SHIELD",
        skills: ["UniFi Dream Machine Pro ('Zeus')", "UniFi U7 Lite ('Hermes')", "Isolated VLAN Segmentation", "WireGuard & Gluetun VPN", "AdGuard Home DNS Sinkhole", "Fiber Optics & SFP+ Cabling"]
      },
      {
        title: "MEDIA, HOMELAB & AUTOMATION",
        skills: ["Jellyfin Hardware Transcoding", "Sonarr, Radarr & Jellyseerr", "Immich AI Photos", "Home Assistant Automation", "Local Ollama LLM Pipelines", "Prometheus & Grafana Monitoring"]
      }
    ];

    categories.forEach((cat, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 110 + col * 940;
      const by = 430 + row * 440;

      // Box
      ctx.strokeStyle = '#e0a96d';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, 880, 390);

      ctx.fillStyle = '#ffd3b6';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`🧀 ${cat.title}`, bx + 30, by + 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '30px monospace';
      cat.skills.forEach((skill, si) => {
        ctx.fillText(`[✓] ${skill}`, bx + 35, by + 125 + si * 44);
      });
    });
  }

  // Page 3: Education & Certifications
  function renderEducationPage() {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd3b6';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText("SECRET RECIPES // EDUCATION & CERTIFICATIONS", 110, 380);

    // Left Box: Degree
    ctx.strokeStyle = '#a8e6cf';
    ctx.lineWidth = 4;
    ctx.strokeRect(110, 440, 880, 520);

    ctx.fillStyle = '#a8e6cf';
    ctx.font = 'bold 40px monospace';
    ctx.fillText("🎓 FORMAL EDUCATION", 150, 520);

    ctx.fillStyle = '#e0a96d';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText("Bachelor of Science in Information Technology", 150, 590);

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.fillText("Institution: Florida International University (FIU)", 150, 650);
    ctx.fillText("Period     : 2018 - 2023", 150, 705);
    ctx.fillText("Focus      : Network Engineering, Cloud Computing,", 150, 760);
    ctx.fillText("             and Enterprise Infrastructure Architecture.", 150, 805);

    // Right Box: Certifications & Continuous R&D
    ctx.strokeStyle = '#ffaaa5';
    ctx.lineWidth = 4;
    ctx.strokeRect(1050, 440, 880, 520);

    ctx.fillStyle = '#ffaaa5';
    ctx.font = 'bold 40px monospace';
    ctx.fillText("📜 INDUSTRY CERTIFICATIONS", 1090, 520);

    ctx.fillStyle = '#e0a96d';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText("CompTIA A+ Certified", 1090, 590);

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.fillText("Issuer : CompTIA", 1090, 650);
    ctx.fillText("Date   : 2024", 1090, 705);
    ctx.fillText("Scope  : Hardware diagnostics, operational procedures,", 1090, 760);
    ctx.fillText("         cloud configuration, and network troubleshooting.", 1090, 805);

    // Bottom Box: Homelab R&D
    ctx.strokeStyle = '#e0a96d';
    ctx.lineWidth = 3;
    ctx.strokeRect(110, 1010, 1820, 280);

    ctx.fillStyle = '#ffd3b6';
    ctx.font = 'bold 36px monospace';
    ctx.fillText("🔬 CONTINUOUS 24/7 BARE-METAL RESEARCH & DEVELOPMENT", 150, 1080);

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.fillText("5+ years of daily hands-on engineering across live Proxmox nodes, ZFS data redundancy experiments,", 150, 1140);
    ctx.fillText("UniFi perimeter defense hardening, and high-throughput multi-gigabit media transcode delivery.", 150, 1195);
  }

  // Initial render
  renderPage(0);

  return {
    texture,
    setPage: (p: number) => renderPage(p),
    getPage: () => currentPage
  };
}

// Fallback convenience function
export function createChalkboardTexture(): THREE.CanvasTexture {
  return createChalkboardManager().texture;
}

// Generate animated Wood-Fired Oven Fire Shader Material
export function createOvenFireMaterial(): THREE.ShaderMaterial {
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vUv = uv;
      vPosition = position;
      vec3 pos = position;
      // Flickering heat distortion
      pos.y += sin(pos.x * 12.0 + uTime * 6.0) * 0.05 * vUv.y;
      pos.x += cos(pos.y * 10.0 + uTime * 5.0) * 0.03 * vUv.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;

    // Simple pseudo noise
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      
      // Moving flame tongues
      float n1 = noise(uv * 4.0 + vec2(0.0, -uTime * 3.5));
      float n2 = noise(uv * 8.0 + vec2(sin(uTime * 2.0) * 0.5, -uTime * 5.0));
      float flame = (1.0 - uv.y) * 1.4;
      flame += (n1 * 0.4 + n2 * 0.3) * (1.0 - uv.y);

      // Fire colors: Yellow core -> Orange -> Deep Ember Red
      vec3 coreColor = vec3(1.0, 0.95, 0.4);
      vec3 midColor = vec3(1.0, 0.4, 0.05);
      vec3 edgeColor = vec3(0.65, 0.08, 0.02);

      vec3 color = mix(edgeColor, midColor, smoothstep(0.3, 0.7, flame));
      color = mix(color, coreColor, smoothstep(0.7, 1.2, flame));

      float alpha = smoothstep(0.15, 0.6, flame);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

// Generate Arcade Screen CRT canvas texture
export function createArcadeScreenTexture(): { texture: THREE.CanvasTexture; update: (time: number) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);

  const update = (time: number) => {
    // Cyber CRT background
    ctx.fillStyle = '#06130e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 255, 128, 0.06)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // Glow border
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Arcade header
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOMELAB 84', canvas.width / 2, 70);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#80ffcc';
    ctx.fillText('SYS.MONITOR // STATUS: ONLINE', canvas.width / 2, 105);

    // Divider
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 125);
    ctx.lineTo(canvas.width - 40, 125);
    ctx.stroke();

    // Live telemetry simulation
    ctx.textAlign = 'left';
    ctx.font = '20px monospace';
    ctx.fillStyle = '#66ffb2';

    const pulse = Math.sin(time * 3);
    const cpuVal = 14 + Math.floor(pulse * 6);
    const ramVal = 42 + Math.floor(Math.cos(time * 2) * 4);
    const zfsHealth = 'ONLINE [OPTIMAL]';

    ctx.fillText(`> PROXMOX NODE 1: ${cpuVal}% CPU`, 48, 175);
    ctx.fillText(`> MEMORY USAGE  : ${ramVal}% OF 64GB`, 48, 215);
    ctx.fillText(`> ZFS POOL 16TB : ${zfsHealth}`, 48, 255);
    ctx.fillText(`> ADGUARD SHIELD: 48,219 BLOCKED`, 48, 295);
    ctx.fillText(`> JELLYFIN 4K   : 2 ACTIVE STREAMS`, 48, 335);

    // Flashing Press Start
    if (Math.sin(time * 4) > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ CLICK TO LAUNCH DASHBOARD ]', canvas.width / 2, 420);
    }

    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS TEAR TICKET FOR ADMIN LOGIN', canvas.width / 2, 465);

    texture.needsUpdate = true;
  };

  return { texture, update };
}

// Generate Pizza Top Texture (Crispy cheese + pepperoni)
export function createPizzaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const r = 240;

  // Crust edge
  const crustGradient = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
  crustGradient.addColorStop(0, '#e5a158');
  crustGradient.addColorStop(0.7, '#c6782b');
  crustGradient.addColorStop(1, '#6d3910'); // Charred oven edge
  ctx.fillStyle = crustGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Tomato sauce
  ctx.fillStyle = '#a62419';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fill();

  // Melted mozzarella cheese
  const cheeseGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.85);
  cheeseGradient.addColorStop(0, '#fff4cc');
  cheeseGradient.addColorStop(0.7, '#f7db8b');
  cheeseGradient.addColorStop(1, '#e0aa48');
  ctx.fillStyle = cheeseGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Charred cheese bubbles
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * r * 0.75;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const br = 4 + Math.random() * 9;
    ctx.fillStyle = 'rgba(120, 50, 10, 0.45)';
    ctx.beginPath();
    ctx.arc(px, py, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pepperoni slices
  const pepCount = 14;
  for (let i = 0; i < pepCount; i++) {
    const angle = (i / pepCount) * Math.PI * 2 + (Math.random() * 0.3);
    const dist = 60 + (i % 2 === 0 ? 80 : 40) + Math.random() * 20;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const pr = 26 + Math.random() * 5;

    // Pepperoni gradient
    const pepGrad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    pepGrad.addColorStop(0, '#9e1b1b');
    pepGrad.addColorStop(0.8, '#701010');
    pepGrad.addColorStop(1, '#450808');
    ctx.fillStyle = pepGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();

    // Pepperoni paprika specs
    ctx.fillStyle = 'rgba(255, 200, 150, 0.4)';
    for (let j = 0; j < 5; j++) {
      ctx.fillRect(px - 10 + Math.random() * 20, py - 10 + Math.random() * 20, 2, 2);
    }
  }

  // Basil leaves
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 110;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillStyle = '#2d6a36';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Slice cut lines
  ctx.strokeStyle = 'rgba(60, 20, 10, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * r, cy - Math.sin(angle) * r);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate Pizza Box Top texture
export function createPizzaBoxTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Kraft cardboard base
  ctx.fillStyle = '#c8a168';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Red pizzeria badge
  ctx.strokeStyle = '#a62419';
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  ctx.strokeStyle = '#2d6a36';
  ctx.lineWidth = 4;
  ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

  // Retro Logo Text
  ctx.fillStyle = '#a62419';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("MIKEY'S PIZZA", canvas.width / 2, 160);

  ctx.fillStyle = '#2d6a36';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText("ARTISANAL WOOD-FIRED HOMELAB", canvas.width / 2, 210);

  // Pizza slice graphic in center
  ctx.fillStyle = '#e5a158';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 250);
  ctx.lineTo(canvas.width / 2 - 60, 360);
  ctx.lineTo(canvas.width / 2 + 60, 360);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a62419';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#1e1c1b';
  ctx.font = '18px monospace';
  ctx.fillText("HOT & FRESH INFRASTRUCTURE", canvas.width / 2, 420);
  ctx.fillText("EST. 2021 • SOUTH CAROLINA", canvas.width / 2, 445);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate Pizzeria POS Customer Display screen texture
export function createRegisterScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  // Dark slate modern POS background
  ctx.fillStyle = '#0f1412';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header bar
  ctx.fillStyle = '#1c2420';
  ctx.fillRect(0, 0, canvas.width, 50);

  ctx.fillStyle = '#e0a96d';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText("🍕 MIKEY'S PIZZA POS", 20, 34);

  ctx.fillStyle = '#a8e6cf';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('ONLINE • ORDER #084', canvas.width - 20, 34);

  // Line items
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('1x Wood-Fired Margherita', 24, 90);
  ctx.textAlign = 'right';
  ctx.fillText('$18.00', canvas.width - 24, 90);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('1x San Pellegrino Blood Orange', 24, 125);
  ctx.textAlign = 'right';
  ctx.fillText('$3.50', canvas.width - 24, 125);

  ctx.textAlign = 'left';
  ctx.fillText('1x Garlic Knots (4pc)', 24, 160);
  ctx.textAlign = 'right';
  ctx.fillText('$5.00', canvas.width - 24, 160);

  // Divider
  ctx.strokeStyle = '#334038';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 185);
  ctx.lineTo(canvas.width - 20, 185);
  ctx.stroke();

  // Subtotal & Total
  ctx.textAlign = 'left';
  ctx.font = '16px monospace';
  ctx.fillStyle = '#8e9e95';
  ctx.fillText('Subtotal: $26.50   Tax (8%): $2.12', 24, 215);

  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ffd3b6';
  ctx.fillText('TOTAL:', 24, 255);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ffaa';
  ctx.fillText('$28.62', canvas.width - 24, 255);

  // Bottom action bar: Tap Card prompt
  ctx.fillStyle = '#227031';
  ctx.fillRect(16, 275, canvas.width - 32, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('💳 TAP CARD OR INSERT CHIP', canvas.width / 2, 307);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate printed receipt paper texture
export function createReceiptPaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Off-white thermal paper
  ctx.fillStyle = '#f8f7f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#222222';
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px monospace';
  ctx.fillText("MIKEY'S PIZZERIA", canvas.width / 2, 35);
  ctx.font = '11px monospace';
  ctx.fillText('WOOD-FIRED HOMELAB SLICES', canvas.width / 2, 55);
  ctx.fillText('SOUTH CAROLINA • HOST: MIKEY.HOST', canvas.width / 2, 70);
  ctx.fillText('--------------------------------', canvas.width / 2, 85);

  ctx.textAlign = 'left';
  ctx.font = '12px monospace';
  ctx.fillText('1x MARGHERITA PIE    $18.00', 16, 110);
  ctx.fillText('1x SAN PELLEGRINO     $3.50', 16, 130);
  ctx.fillText('1x GARLIC KNOTS       $5.00', 16, 150);
  ctx.fillText('--------------------------------', 16, 175);
  ctx.fillText('SUBTOTAL             $26.50', 16, 195);
  ctx.fillText('TAX                   $2.12', 16, 215);
  ctx.font = 'bold 14px monospace';
  ctx.fillText('TOTAL PAID           $28.62', 16, 240);

  ctx.textAlign = 'center';
  ctx.font = '11px monospace';
  ctx.fillText('AUTH: 098482 // VISA *4242', canvas.width / 2, 275);
  ctx.fillText('THANK YOU FOR VISITING!', canvas.width / 2, 305);

  // Barcode
  for (let x = 30; x < canvas.width - 30; x += 4) {
    if (Math.sin(x * 37) > -0.2) {
      ctx.fillRect(x, 335, (x % 3) + 1, 45);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate Pizzeria Storefront Window glass decal texture
export function createStorefrontWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Transparent glass with subtle warm city reflection
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gold Leaf Arched Sign
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c374';
  ctx.shadowColor = '#d4af37';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText("MIKEY'S PIZZERIA", canvas.width / 2, 160);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AUTHENTIC WOOD-FIRED ARTISANAL HOMELAB', canvas.width / 2, 210);

  ctx.font = 'italic 20px serif';
  ctx.fillStyle = '#e8c374';
  ctx.fillText('• EST. 2021 • DINE IN & TAKEOUT •', canvas.width / 2, 250);

  // Hour decal
  ctx.font = '16px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('OPEN 24/7/365 • 99.99% UPTIME', canvas.width / 2, 310);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate Wood Coffered Ceiling texture
export function createCeilingWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep dark warm walnut
  ctx.fillStyle = '#1e130c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Planks
  const plankW = 64;
  for (let x = 0; x < canvas.width; x += plankW) {
    ctx.fillStyle = (x % 128 === 0) ? '#26180f' : '#1e130c';
    ctx.fillRect(x, 0, plankW, canvas.height);

    ctx.strokeStyle = '#120b07';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 0, plankW, canvas.height);

    // Subtle wood grain lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 10, 0);
      ctx.lineTo(x + i * 10 + 4, canvas.height);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Generate Fridge Digital Temperature Controller LED texture
export function createFridgeLedTexture(tempC: number = 38.2, tempF: number = 100.8, statusText: string = 'COOLING [OK]'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d0c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#22332a';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#00ffcc';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${tempC.toFixed(1)}°C`, 14, 46);

  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = '#70ffdb';
  ctx.fillText(`${tempF.toFixed(1)}°F DIE`, 14, 74);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(statusText, canvas.width - 14, 42);

  ctx.fillStyle = '#88a398';
  ctx.font = '11px monospace';
  ctx.fillText('TRUENAS LOOP', canvas.width - 14, 68);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Generate High-Res Pinned Fridge To-Do List Paper Texture (With homelab information)
export function createFridgeTodoListTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d')!;

  // 1. Soft Matte Warm Cream Legal Pad Paper (avoids ACES highlight clipping under light)
  ctx.fillStyle = '#efeae0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain/shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  // Top header binding strip (kraft brown tape)
  ctx.fillStyle = '#b88f52';
  ctx.fillRect(0, 0, canvas.width, 36);

  // Red Left Margin Line
  ctx.strokeStyle = '#d46565';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(110, 36);
  ctx.lineTo(110, canvas.height);
  ctx.stroke();

  // Faint Blue Ruled Horizontal Lines
  ctx.strokeStyle = '#cbd6e2';
  ctx.lineWidth = 1.5;
  for (let y = 160; y < canvas.height - 180; y += 52) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = '#0a0e14';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("📋 CHEF MIKEY'S KITCHEN & HOMELAB OPS", canvas.width / 2, 112);

  ctx.fillStyle = '#143826';
  ctx.font = 'bold 21px monospace';
  ctx.fillText("HOMELAB 84 • 2 PHYSICAL SERVERS • 55.4 TiB ZFS • 99.99% UPTIME", canvas.width / 2, 148);

  // To-Do List Items
  const tasks = [
    { done: true, title: "Server 1: TrueNAS SCALE 25.04", note: "Threadripper 3970X (32c/64t), 251.6 GiB RAM, 55.4 TiB ZFS" },
    { done: true, title: "Server 2: Proxmox VE 9.0.5 (pve01)", note: "Intel 2.8GHz Hypervisor, 64 GiB DDR4, 6 VMs/LXCs (docker1)" },
    { done: true, title: "UniFi Dream Machine Pro 'Zeus'", note: "Enterprise perimeter router/firewall & U7 Lite Hermes AP" },
    { done: true, title: "Cloudflare & NPM Wildcard Ingress", note: "*.mikey.host with strict SSL termination & Zero Trust policy" },
    { done: true, title: "AdGuard Home DNS Sinkhole", note: "House DNS resolver on docker1:53 filtering malicious telemetry" },
    { done: true, title: "Gluetun VPN & qBittorrent Stack", note: "WireGuard encrypted egress namespace for automated torrent stack" },
    { done: true, title: "Media Pipeline Automation", note: "Jellyfin, Sonarr, Radarr, Seerr, Prowlarr & Tdarr transcoding live" },
    { done: true, title: "CrowdSec & Wazuh SIEM Defense", note: "Real-time edge brute-force banning and centralized server auditing" },
    { done: true, title: "48-Hour Neapolitan Sourdough", note: "Cold bulk fermentation resting safely in walk-in chiller (38°F)" },
    { done: false, title: "Encrypted Cloudflare / B2 Sync", note: "Nightly automated Rclone snapshot scheduled at 03:00 EST" }
  ];

  ctx.textAlign = 'left';
  tasks.forEach((t, idx) => {
    const y = 222 + idx * 104;

    // Checkbox
    if (t.done) {
      ctx.fillStyle = '#1b5e20';
      ctx.font = 'bold 36px monospace';
      ctx.fillText("[✓]", 36, y);
      ctx.fillStyle = '#0a1d12';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(t.title, 136, y);
    } else {
      ctx.fillStyle = '#b78103';
      ctx.font = 'bold 36px monospace';
      ctx.fillText("[ ]", 36, y);
      ctx.fillStyle = '#1c1f24';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(t.title, 136, y);
    }

    // Task details
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 21px monospace';
    ctx.fillText(`   ${t.note}`, 136, y + 36);
  });

  // Yellow Sticky Note at bottom
  ctx.fillStyle = '#fffa65';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.fillRect(80, canvas.height - 210, canvas.width - 160, 160);
  ctx.strokeStyle = '#e6df44';
  ctx.lineWidth = 2;
  ctx.strokeRect(80, canvas.height - 210, canvas.width - 160, 160);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#856404';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("📌 CLICK TO OPEN HOMELAB TELEMETRY & DASHBOARD", canvas.width / 2, canvas.height - 145);

  ctx.fillStyle = '#1c2833';
  ctx.font = 'bold 20px monospace';
  ctx.fillText("🎟️ INCLUDES SECRET ORDER TICKET TEARABLE LOGIN", canvas.width / 2, canvas.height - 95);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// -------------------------------------------------------------
// RIGHT WALL ARTWORK TEXTURES (3 Pictures for the Framed Art)
// -------------------------------------------------------------

// 1. Technical Architectural Blueprint: Neapolitan Oven & 42U Homelab Rack
export function createWallArtBlueprintTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Blueprint navy background
  ctx.fillStyle = '#0c2238';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fine blueprint grid
  ctx.strokeStyle = '#14385c';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Major blueprint grid
  ctx.strokeStyle = '#1d5182';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= canvas.width; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Double white drafting border
  ctx.strokeStyle = '#64b5f6';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
  ctx.strokeStyle = '#2196f3';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, canvas.width - 92, canvas.height - 92);

  // Corner registration ticks
  [[46, 46], [canvas.width - 46, 46], [46, canvas.height - 46], [canvas.width - 46, canvas.height - 46]].forEach(([cx, cy]) => {
    ctx.strokeStyle = '#90caf9';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();
  });

  // Header Title Block
  ctx.fillStyle = '#e3f2fd';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TECHNICAL SPECIFICATION // FIG. 84', canvas.width / 2, 90);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#90caf9';
  ctx.fillText('FORNO NAPOLETANO (450°C) & 42U BARE-METAL CLUSTER', canvas.width / 2, 118);
  ctx.fillText('PATENT NO. US-1984-PZ • ARCHITECT: MICHAEL CHAVEZ', canvas.width / 2, 142);

  ctx.strokeStyle = '#64b5f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 160);
  ctx.lineTo(canvas.width - 60, 160);
  ctx.stroke();

  // DRAWING 1: Pizza Dome Oven Architectural Cross-Section (Top Half)
  const ovenCenterX = canvas.width / 2;
  const ovenCenterY = 320;

  // Oven Dome Arch
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ovenCenterX, ovenCenterY, 150, Math.PI, 0);
  ctx.stroke();

  // Inner Dome
  ctx.strokeStyle = '#90caf9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ovenCenterX, ovenCenterY, 125, Math.PI, 0);
  ctx.stroke();

  // Voussoir brick wedges
  for (let a = Math.PI; a <= 2 * Math.PI; a += Math.PI / 12) {
    const x1 = ovenCenterX + 125 * Math.cos(a);
    const y1 = ovenCenterY + 125 * Math.sin(a);
    const x2 = ovenCenterX + 150 * Math.cos(a);
    const y2 = ovenCenterY + 150 * Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Stone Hearth Floor Slab
  ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
  ctx.fillRect(ovenCenterX - 180, ovenCenterY, 360, 32);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(ovenCenterX - 180, ovenCenterY, 360, 32);

  // Oven Mouth Arch
  ctx.strokeStyle = '#64b5f6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ovenCenterX, ovenCenterY, 70, Math.PI, 0);
  ctx.stroke();

  // Chimney Exhaust Flue
  ctx.strokeRect(ovenCenterX - 28, ovenCenterY - 210, 56, 70);
  ctx.strokeStyle = '#90caf9';
  // Flue arrows
  ctx.beginPath();
  ctx.moveTo(ovenCenterX, ovenCenterY - 140);
  ctx.lineTo(ovenCenterX, ovenCenterY - 200);
  ctx.lineTo(ovenCenterX - 8, ovenCenterY - 185);
  ctx.moveTo(ovenCenterX, ovenCenterY - 200);
  ctx.lineTo(ovenCenterX + 8, ovenCenterY - 185);
  ctx.stroke();

  // Oven Callouts
  ctx.fillStyle = '#64b5f6';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('◄ REFRACTORY CLAY DOME (VESUVIAN VOLCANIC ASH)', 70, 240);
  ctx.fillText('◄ BISCOTTO STONE HEARTH (450°C BALANCED FLOOR)', 70, 375);
  ctx.textAlign = 'right';
  ctx.fillText('FLUE DRAFT (NATURAL DRAW) ►', canvas.width - 70, 230);
  ctx.fillText('90-SEC NEAPOLITAN BAKE ►', canvas.width - 70, 375);

  ctx.strokeStyle = '#64b5f6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 420);
  ctx.lineTo(canvas.width - 60, 420);
  ctx.stroke();

  // DRAWING 2: 42U Server Rack Schematic (Bottom Half)
  const rackX = 220;
  const rackY = 460;
  const rackW = 328;
  const rackH = 430;

  // Outer Rack Frame
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(rackX, rackY, rackW, rackH);

  // Vertical 19" Rails
  ctx.strokeStyle = '#64b5f6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rackX + 24, rackY + 16, rackW - 48, rackH - 32);

  // Rack U units (caddies & chassis)
  const chassis = [
    { name: '1U UNIFI DREAM MACHINE PRO (ZEUS)', color: 'rgba(33, 150, 243, 0.3)', h: 32 },
    { name: '2U PROXMOX VE 9 HYPERVISOR (PVE01)', color: 'rgba(76, 175, 80, 0.25)', h: 56 },
    { name: '4U TRUENAS THREADRIPPER 3970X (256GB)', color: 'rgba(255, 152, 0, 0.25)', h: 96 },
    { name: '1U 10GbE FIBER SFP+ / SWITCHING', color: 'rgba(156, 39, 176, 0.25)', h: 32 },
    { name: '2U CYBERPOWER PURE SINE WAVE UPS', color: 'rgba(96, 125, 139, 0.25)', h: 56 }
  ];

  let currentChassisY = rackY + 28;
  chassis.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(rackX + 30, currentChassisY, rackW - 60, item.h);
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 1;
    ctx.strokeRect(rackX + 30, currentChassisY, rackW - 60, item.h);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, rackX + rackW / 2, currentChassisY + item.h / 2 + 4);

    currentChassisY += item.h + 8;
  });

  // Rack Callouts
  ctx.fillStyle = '#64b5f6';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('◄ 10GbE FIBER SFP+', 70, 500);
  ctx.fillText('◄ LIVE LXC/VM HA', 70, 560);
  ctx.fillText('◄ ZFS RESILIENT POOL', 70, 680);

  ctx.textAlign = 'right';
  ctx.fillText('EIA-310-D 19" STANDARD ►', canvas.width - 70, 500);
  ctx.fillText('ZERO TRUST SEGREGATION ►', canvas.width - 70, 680);
  ctx.fillText('BATTERY BACKUP PROTECT ►', canvas.width - 70, 780);

  // Bottom Title Block & Stamp
  ctx.strokeRect(canvas.width - 290, canvas.height - 100, 230, 50);
  ctx.fillStyle = '#e3f2fd';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STATUS: APPROVED / HEALTHY', canvas.width - 175, canvas.height - 78);
  ctx.fillStyle = '#64b5f6';
  ctx.font = '10px monospace';
  ctx.fillText('REVISION 3.4 • PROD CLUSTER', canvas.width - 175, canvas.height - 60);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 2. Vintage Italian Certificate: Associazione Vera Pizza Napoletana
export function createWallArtCertificateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Aged warm parchment background
  ctx.fillStyle = '#f8f1e3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paper grain texture
  ctx.fillStyle = 'rgba(160, 120, 80, 0.03)';
  for (let i = 0; i < 3000; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  // Antique aged vignette around edges
  const edgeGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 300, canvas.width / 2, canvas.height / 2, 540);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(0.85, 'rgba(180, 140, 90, 0.2)');
  edgeGrad.addColorStop(1, 'rgba(120, 80, 40, 0.45)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ornate Double Gold & Burgundy Filigree Border
  ctx.strokeStyle = '#8b2635'; // Deep burgundy
  ctx.lineWidth = 6;
  ctx.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);

  ctx.strokeStyle = '#c59b27'; // Antique gold
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  ctx.strokeStyle = '#8b2635';
  ctx.lineWidth = 1;
  ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

  // Ornate Corner Flourishes
  const drawCornerFlourish = (x: number, y: number, flipX: number, flipY: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX, flipY);
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 35);
    ctx.bezierCurveTo(10, 10, 20, 10, 35, 10);
    ctx.stroke();

    ctx.fillStyle = '#8b2635';
    ctx.beginPath();
    ctx.arc(22, 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCornerFlourish(54, 54, 1, 1);
  drawCornerFlourish(canvas.width - 54, 54, -1, 1);
  drawCornerFlourish(54, canvas.height - 54, 1, -1);
  drawCornerFlourish(canvas.width - 54, canvas.height - 54, -1, -1);

  // Top Heraldic Crest / Crown
  ctx.fillStyle = '#c59b27';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 110, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8b2635';
  ctx.font = 'bold 26px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍕', canvas.width / 2, 119);

  // Header Titles
  ctx.fillStyle = '#8b2635';
  ctx.font = 'bold 30px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('ASSOCIAZIONE VERA PIZZA NAPOLETANA', canvas.width / 2, 175);

  ctx.fillStyle = '#6d4c41';
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('DISCIPLINARE INTERNAZIONALE • CERTIFICATO N° 1984', canvas.width / 2, 205);

  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 225);
  ctx.lineTo(canvas.width - 140, 225);
  ctx.stroke();

  // Certificate Subtitle
  ctx.fillStyle = '#2b1b17';
  ctx.font = 'bold 38px "Playfair Display", Georgia, serif';
  ctx.fillText('ATTESTATO DI MAESTRIA', canvas.width / 2, 290);

  ctx.fillStyle = '#5c4033';
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('Si certifica con la presente che il Maestro Pizzaiolo & Tecnico', canvas.width / 2, 335);

  // Recipient Name
  ctx.fillStyle = '#8b2635';
  ctx.font = 'bold 46px "Brush Script MT", "Great Vibes", Georgia, cursive';
  ctx.fillText('Michael Chavez', canvas.width / 2, 395);

  // Underline beneath name
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, 415);
  ctx.lineTo(canvas.width - 220, 415);
  ctx.stroke();

  // Citation Body Text
  ctx.fillStyle = '#3e2723';
  ctx.font = '17px Georgia, serif';
  const lines = [
    'Ha superato con massimo encomio la perizia tecnica per la creazione',
    'della Vera Pizza Napoletana a 48 ore di lenta fermentazione naturale,',
    'dimostrando eccellenza artigianale nei forni a legna ad alta temperatura (450°C),',
    'nonché la perfetta orchestrazione di cluster server e servizi homelab.',
    '',
    'Farina Tipo 00 • San Marzano D.O.P. • Fiordilatte Campano • ZFS Raid-Z2'
  ];
  lines.forEach((l, idx) => {
    ctx.fillText(l, canvas.width / 2, 465 + idx * 30);
  });

  // Center Emblem: Stylized Mt. Vesuvius & Laurel Wreath
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 700, 55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#8b2635';
  ctx.font = '36px serif';
  ctx.fillText('🌋', canvas.width / 2, 712);

  // Signatures
  ctx.fillStyle = '#2b1b17';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('Napoli, Anno Domini 1984', 180, 840);
  ctx.strokeStyle = '#4e342e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(110, 890);
  ctx.lineTo(260, 890);
  ctx.stroke();
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('Il Presidente AVPN', 180, 915);

  // Embossed Crimson Wax Seal Stamp (Bottom Right)
  const sealX = canvas.width - 180;
  const sealY = 855;

  // Ribbon tails
  ctx.fillStyle = '#8b1e2a';
  ctx.beginPath();
  ctx.moveTo(sealX - 18, sealY);
  ctx.lineTo(sealX - 35, sealY + 80);
  ctx.lineTo(sealX - 18, sealY + 68);
  ctx.lineTo(sealX, sealY + 80);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sealX + 18, sealY);
  ctx.lineTo(sealX, sealY + 80);
  ctx.lineTo(sealX + 18, sealY + 68);
  ctx.lineTo(sealX + 35, sealY + 80);
  ctx.closePath();
  ctx.fill();

  // Wax Seal Medallion
  ctx.fillStyle = '#a61c28';
  ctx.beginPath();
  ctx.arc(sealX, sealY, 48, 0, Math.PI * 2);
  ctx.fill();

  // Scalloped edges
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
    const sx = sealX + 46 * Math.cos(a);
    const sy = sealY + 46 * Math.sin(a);
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gold embossed inner ring & text
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('ORIGINALE', sealX, sealY - 14);
  ctx.font = 'bold 18px serif';
  ctx.fillText('★ 100% ★', sealX, sealY + 6);
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('DOCG NAPOLI', sealX, sealY + 22);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 3. Retro Cyber-Modern Pop Art: "Pizza & Packets (Homelab '84)"
export function createWallArtPopArtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian cyber background
  ctx.fillStyle = '#0f141d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Diagonal subtle tech accent lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = -canvas.height; i < canvas.width; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + canvas.height, canvas.height);
    ctx.stroke();
  }

  // Top retro badge
  ctx.fillStyle = '#ff5722';
  ctx.fillRect(50, 48, 140, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOMELAB 84', 120, 70);

  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(200, 48, 180, 32);
  ctx.fillStyle = '#0f141d';
  ctx.fillText('100% SELF-HOSTED', 290, 70);

  // Big Bold Headline
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff7043';
  ctx.font = '900 76px Impact, Arial Black, sans-serif';
  ctx.fillText('PIZZA &', 50, 165);

  ctx.fillStyle = '#ffd54f';
  ctx.fillText('PACKETS', 50, 240);

  ctx.fillStyle = '#e0e6ed';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('CRISP DOUGH • LOW LATENCY • ZERO TRUST', 50, 280);

  // Center Geometric Pop-Art Pizza Slice with Circuit Traces
  const centerX = canvas.width / 2;
  const centerY = 520;

  // Background neon aura circle
  const auraGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 240);
  auraGrad.addColorStop(0, 'rgba(255, 112, 67, 0.35)');
  auraGrad.addColorStop(0.6, 'rgba(0, 229, 255, 0.15)');
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 240, 0, Math.PI * 2);
  ctx.fill();

  // Geometric Pizza Wedge
  ctx.save();
  ctx.translate(centerX, centerY);

  // Golden Crust Arc
  ctx.fillStyle = '#d87d27';
  ctx.beginPath();
  ctx.arc(0, -160, 190, 0.35 * Math.PI, 0.65 * Math.PI);
  ctx.lineTo(0, 160);
  ctx.closePath();
  ctx.fill();

  // Cheese Surface
  ctx.fillStyle = '#ffca28';
  ctx.beginPath();
  ctx.arc(0, -150, 170, 0.38 * Math.PI, 0.62 * Math.PI);
  ctx.lineTo(0, 140);
  ctx.closePath();
  ctx.fill();

  // Printed circuit board trace lines on pizza slice
  ctx.strokeStyle = '#00bcd4';
  ctx.lineWidth = 3;

  // Bus line 1
  ctx.beginPath();
  ctx.moveTo(-60, -40);
  ctx.lineTo(-20, 20);
  ctx.lineTo(-20, 80);
  ctx.lineTo(0, 120);
  ctx.stroke();

  // Bus line 2
  ctx.beginPath();
  ctx.moveTo(60, -40);
  ctx.lineTo(20, 20);
  ctx.lineTo(20, 80);
  ctx.lineTo(0, 120);
  ctx.stroke();

  // Vias (circuit pads)
  ctx.fillStyle = '#ffffff';
  [[-60, -40], [60, -40], [-20, 20], [20, 20], [0, 120]].forEach(([vx, vy]) => {
    ctx.beginPath();
    ctx.arc(vx, vy, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Pepperoni Data Discs
  ctx.fillStyle = '#d32f2f';
  [[-40, -10], [40, -10], [0, 50]].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 26, 0, Math.PI * 2);
    ctx.fill();

    // Inner gold ring
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Core fiber dot
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d32f2f';
  });

  ctx.restore();

  // Lower Pop Art Stat Cards
  const stats = [
    { title: 'HYDRATION', value: '70% SOURDOUGH' },
    { title: 'LATENCY', value: '< 1ms INTRA-RACK' },
    { title: 'UPTIME', value: '99.99% BARE METAL' }
  ];

  stats.forEach((st, idx) => {
    const bx = 50 + idx * 230;
    const by = 750;
    ctx.fillStyle = '#18202c';
    ctx.fillRect(bx, by, 210, 80);
    ctx.strokeStyle = '#ff7043';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 210, 80);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(st.title, bx + 16, by + 28);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(st.value, bx + 16, by + 58);
  });

  // Bottom Barcode & Serial
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SYS-SERIES-1984 // MIKEY CHAVEZ', 50, 890);

  // Barcode lines
  let barX = 50;
  ctx.fillStyle = '#e0e6ed';
  while (barX < canvas.width - 50) {
    const bw = Math.floor(Math.random() * 4) + 2;
    ctx.fillRect(barX, 915, bw, 35);
    barX += bw + Math.floor(Math.random() * 5) + 3;
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 6. Nonna Rosa's 1924 Secret Sourdough Codex Parchment Texture
export function createSecretCodexTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Aged warm parchment gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#fdf7ea');
  bgGrad.addColorStop(0.5, '#f4e5c8');
  bgGrad.addColorStop(1, '#e5cca0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Antique paper fibers
  ctx.fillStyle = 'rgba(130, 90, 50, 0.04)';
  for (let i = 0; i < 2500; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  // Aged burnt edge vignette
  const edgeGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 180, canvas.width / 2, canvas.height / 2, 380);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(0.8, 'rgba(160, 110, 60, 0.25)');
  edgeGrad.addColorStop(1, 'rgba(100, 60, 20, 0.55)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Double Antique Filigree Border
  ctx.strokeStyle = '#8a252c'; // Tuscan wine red
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.strokeStyle = '#c59b27'; // Antique gold
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  // Corner Flourishes
  const drawCorner = (x: number, y: number, flipX: number, flipY: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX, flipY);
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 26);
    ctx.quadraticCurveTo(6, 6, 26, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10, 10, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#8a252c';
    ctx.fill();
    ctx.restore();
  };
  drawCorner(32, 32, 1, 1);
  drawCorner(canvas.width - 32, 32, -1, 1);
  drawCorner(32, canvas.height - 32, 1, -1);
  drawCorner(canvas.width - 32, canvas.height - 32, -1, -1);

  // Header Typography
  ctx.fillStyle = '#8a252c';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ CASERTA, CAMPANIA • EST. 1924 ★', canvas.width / 2, 65);

  ctx.fillStyle = '#2c1810';
  ctx.font = 'bold italic 22px "Playfair Display", Georgia, serif';
  ctx.fillText('Nonna Rosa’s Heirloom', canvas.width / 2, 98);

  ctx.font = '900 24px Georgia, serif';
  ctx.fillStyle = '#1a0d08';
  ctx.fillText('SECRET SOURDOUGH CODEX', canvas.width / 2, 128);

  ctx.fillStyle = '#b8860b';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('LIEVITO MADRE // 48-HR COLD FERMENTATION', canvas.width / 2, 148);

  // Divider Line
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 162);
  ctx.lineTo(canvas.width - 60, 162);
  ctx.stroke();

  // Vintage Handwritten Formula (simulated vintage recipe lore)
  ctx.fillStyle = '#2e1c14';
  ctx.font = 'italic 14px "Baskerville", Georgia, serif';
  ctx.textAlign = 'left';

  const recipeLines = [
    '“Tradizione di Famiglia dal 1924...”',
    '',
    '• Farina Tipo 00 di Grano Antico (1000g)',
    '• Acqua Minerale Fredda di Sorgente (650g)',
    '• Lievito Madre Centenario Casertano (150g)',
    '• Sale Marino Integrale di Trapani (28g)',
    '',
    '1. Riposo in camera fredda per 48 ore.',
    '2. Cottura a legna a 485°C per 90 secondi.',
    '3. Maculatura dorata e cornicione arioso.',
    '',
    'Segreto del Mastro: Ciò che sembra antico',
    'nasconde la fiamma viva del futuro...'
  ];

  let lineY = 195;
  recipeLines.forEach((line) => {
    if (line.startsWith('“') || line.startsWith('Segreto')) {
      ctx.fillStyle = '#7a1f26';
      ctx.font = 'bold italic 13px Georgia, serif';
    } else if (line.startsWith('•')) {
      ctx.fillStyle = '#1c100b';
      ctx.font = '13px monospace';
    } else {
      ctx.fillStyle = '#3a2318';
      ctx.font = 'italic 13px Georgia, serif';
    }
    ctx.fillText(line, 55, lineY);
    lineY += 24;
  });

  // Embossed Crimson Wax Seal (bottom right)
  const sealX = canvas.width - 100;
  const sealY = canvas.height - 150;

  // Ribbon tails
  ctx.fillStyle = '#a82c35';
  ctx.beginPath();
  ctx.moveTo(sealX - 15, sealY + 20);
  ctx.lineTo(sealX - 25, sealY + 70);
  ctx.lineTo(sealX - 10, sealY + 60);
  ctx.lineTo(sealX + 5, sealY + 70);
  ctx.lineTo(sealX - 5, sealY + 20);
  ctx.fill();

  // Wax seal circle
  const waxGrad = ctx.createRadialGradient(sealX - 10, sealY - 10, 5, sealX, sealY, 36);
  waxGrad.addColorStop(0, '#e53935');
  waxGrad.addColorStop(0.7, '#b71c1c');
  waxGrad.addColorStop(1, '#5f0909');
  ctx.fillStyle = waxGrad;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 36, 0, Math.PI * 2);
  ctx.fill();

  // Gold seal emblem
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 28, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('1924', sealX, sealY - 6);
  ctx.fillText('★ NAPOLI ★', sealX, sealY + 10);

  // Weathered Red Stamp (bottom left)
  ctx.save();
  ctx.translate(140, canvas.height - 145);
  ctx.rotate(-0.15);
  ctx.strokeStyle = 'rgba(180, 40, 40, 0.75)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-80, -22, 160, 44);
  ctx.fillStyle = 'rgba(180, 40, 40, 0.85)';
  ctx.font = '900 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED TRADITIONAL', 0, -4);
  ctx.fillText('★ S.T.G. SPECIALITÀ ★', 0, 12);
  ctx.restore();

  // Bottom Interactive Call to Action Banner
  ctx.fillStyle = '#8a252c';
  ctx.fillRect(40, canvas.height - 68, canvas.width - 80, 36);
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, canvas.height - 66, canvas.width - 84, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('📜 CLICK TO OPEN FULL RECIPE & LORE', canvas.width / 2, canvas.height - 45);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}


