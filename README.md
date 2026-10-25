# Mikey's Pizzeria & Homelab 84 — Interactive 3D Portfolio & Telemetry Portal

An interactive 3D Neapolitan pizzeria portfolio (`/`), physics-based tearable parchment login (`/login`), and read-only dual-server homelab telemetry portal (`/dashboard`) built with **Astro 4 SSR (`@astrojs/node`)**, **Three.js**, **GSAP**, and **TailwindCSS**.

---

## 🤖 Hermes Agent — Release Reason & Deployment Instructions

### Why This Update Was Pushed
This release upgrades the entire `mikey-homepage` application into a 3D interactive diorama portfolio and hardened read-only homelab telemetry portal:
1. **3D Interactive Pizzeria (`/`)**:
   - Full Three.js pizzeria environment featuring a wood-fired brick oven (Projects), multi-page interactive chalkboard menu (Resume/Experience/Skills/Education), walk-in chiller with live TrueNAS CPU die temperature LED & diffused matte ops checklist, cashier POS counter (Contact), and cozy/dark lighting modes.
   - Contextual single bottom HUD bar with station camera flight locking (`GSAP`) and keyboard/arrow page navigation.
2. **Tearable Cloth Login (`/login`)**:
   - Interactive Verlet physics parchment/order-ticket login screen (`TearableClothLogin.astro`) that tears open to reveal the authentication portal.
3. **Read-Only Dual-Server Homelab Dashboard (`/dashboard`)**:
   - Explicitly separates **Server 01 (`truenas` — TrueNAS SCALE, AMD Threadripper 3970X 32c/64t, 251.6 GiB RAM, 55.4 TiB ZFS across 3 pools)** and **Server 02 (`pve01` — Proxmox VE 9.0.5, Intel 2.80 GHz KVM Hypervisor, 64 GiB DDR4, 6 VMs/LXCs including `docker1`)**.
   - Live read-only telemetry for ZFS storage pools (`Vault`, `Library`, `SSD-Locker`), Jellyfin streams, qBittorrent + Gluetun WireGuard VPN bandwidth, Arr automation stack (`Sonarr`, `Radarr`, `Jellyseerr`, `Prowlarr`, `Tdarr`), Proxmox guests, AdGuard DNS, and **Wazuh SIEM / CrowdSec IPS / Nginx Proxy Manager Top Requesting External IPs**.
4. **Security & Performance Hardening**:
   - Zero private LAN IPs (`10.0.0.x`) exposed in client HTML, textures, or JSON responses.
   - Constant-time SHA-256 credential verification, bounded rate limiting, URL-normalized middleware protection on `/dashboard` and `/api/*`, and `escapeHtml()` sanitization.
   - Parallelized telemetry polling (`Promise.all`) with server-side caching and background-tab pause.

### How Hermes Should Deploy (`docker1`)
1. Pull the latest `main` branch in the repository directory on `docker1`:
   ```bash
   git pull origin main
   ```
2. Rebuild and restart the `mikey-homepage` container on port `4321`:
   ```bash
   docker compose up -d --build
   ```
3. Verify container health:
   ```bash
   docker ps --filter "name=mikey-homepage"
   curl -I http://localhost:4321/
   ```

---

## 🏗️ Architecture & Project Structure

```text
Home-page/
├── data/
│   └── resume.json                    # Portfolio, experience, projects & skills data
├── public/
│   └── models/                        # 3D GLTF/GLB assets (pizza.glb)
├── src/
│   ├── components/
│   │   ├── pizza/
│   │   │   ├── PizzaShopScene.astro   # Three.js canvas mount & render loop
│   │   │   ├── PizzaHUD.astro         # Preloader, lighting/audio toggles & contextual station HUD
│   │   │   └── PizzaModals.astro      # Station modals (Projects, Fridge Telemetry, Cashier Contact)
│   │   └── TearableClothLogin.astro   # Verlet physics tearable parchment login
│   ├── layouts/
│   │   └── Layout.astro               # Base HTML shell & metadata
│   ├── lib/
│   │   ├── auth.ts                    # Session token signing, constant-time auth & rate limiting
│   │   ├── data.ts                    # Resume & portfolio data loader
│   │   └── pizza/
│   │       ├── scene.ts               # Core Three.js scene, lighting modes & animation loop
│   │       ├── camera.ts              # GSAP station flight transitions & OrbitControls locking
│   │       ├── world.ts               # Procedural pizzeria meshes, oven, fridge & hitboxes
│   │       ├── materials.ts           # Dynamic 2D canvas textures (chalkboard, LED, checklist)
│   │       └── raycaster.ts           # rAF-throttled hover & click station interaction
│   ├── middleware.ts                  # Route protection for /dashboard and private /api/* routes
│   └── pages/
│       ├── index.astro                # 3D Pizzeria Portfolio experience
│       ├── login.astro                # Secret tearable parchment login page
│       ├── dashboard.astro            # Read-only Dual-Server Homelab Telemetry Dashboard
│       └── api/                       # Server-side proxy endpoints (truenas, proxmox, wazuh, etc.)
├── Dockerfile                         # Multi-stage Node 20 Alpine production container
├── docker-compose.yml                 # Container orchestration & runtime environment config
└── astro.config.mjs                   # Astro SSR configuration (@astrojs/node standalone)
```

---

## ⚙️ Environment Variables

Configure these in `.env` (local) or via Portainer / `docker-compose.yml` (`environment:`) in production:

| Variable | Description |
|---|---|
| `AUTH_USERNAME` | Admin username for `/login` |
| `AUTH_PASSWORD` | Admin password for `/login` |
| `AUTH_SECRET` | 32+ character secret for signing session tokens |
| `TRUENAS_URL` / `TRUENAS_API_KEY` | TrueNAS SCALE API endpoint & Bearer key (Server 01) |
| `PROXMOX_URL` / `PROXMOX_TOKEN_ID` / `PROXMOX_TOKEN_SECRET` | Proxmox VE 9 API endpoint & token (Server 02 `pve01`) |
| `PORTAINER_URL` / `PORTAINER_API_KEY` | Portainer API endpoint & key (`docker1` containers & NPM/CrowdSec logs) |
| `JELLYFIN_URL` / `JELLYFIN_API_KEY` | Jellyfin media server URL & API key |
| `QBITTORRENT_URL` / `QBITTORRENT_USERNAME` / `QBITTORRENT_PASSWORD` | qBittorrent WebUI credentials |
| `SONARR_URL` / `SONARR_API_KEY` | Sonarr API v3 URL & key |
| `RADARR_URL` / `RADARR_API_KEY` | Radarr API v3 URL & key |
| `JELLYSEERR_URL` / `JELLYSEERR_API_KEY` | Jellyseerr API URL & key |
| `ADGUARD_URL` / `ADGUARD_USERNAME` / `ADGUARD_PASSWORD` | AdGuard Home URL & credentials |

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server at http://localhost:4321
npm run dev

# Build production bundle
npm run build
```

## License

MIT
