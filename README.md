# Home Page

A personal website built with Astro featuring a resume/CV section and a services dashboard that connects to various media server APIs.

## Features

- **Resume/CV Section**: Display your professional experience, skills, and education
- **Services Dashboard**: Monitor and interact with your media services:
  - Sonarr (TV Series Management)
  - Radarr (Movie Management)
  - Jellyfin (Media Server)
  - Plex (Media Server)
  - qBittorrent (Torrent Client)
  - Transmission (Torrent Client)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment variables template:
```bash
cp .env.example .env
```

3. Configure your service API keys and URLs in `.env`:
   - Get your Sonarr API key from Settings > General
   - Get your Radarr API key from Settings > General
   - Get your Jellyfin API key from Dashboard > API Keys
   - Get your Plex token from your Plex account settings
   - Configure qBittorrent and Transmission credentials if needed

4. Customize your resume data in `src/components/ResumeSection.astro`

5. Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:4321`

## Building for Production

```bash
npm run build
```

The built site will be in the `dist/` directory.

## Configuration

### Environment Variables

All service configurations are stored in `.env` file. Make sure to:
- Use the correct URLs for your services (they may be on different ports or domains)
- Keep your API keys secure and never commit them to version control
- The `.env` file is already in `.gitignore` for security

### Customizing Resume

Edit `src/components/ResumeSection.astro` to update:
- Personal information
- Work experience
- Skills
- Education

### Adding More Services

To add more services:
1. Create a new API endpoint in `src/pages/api/[service-name].ts`
2. Add the service to the `services` array in `src/components/ServicesDashboard.astro`
3. Update your `.env` file with the new service's configuration

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Navigation.astro      # Navigation bar
│   │   ├── ResumeSection.astro   # Resume/CV display
│   │   └── ServicesDashboard.astro # Services dashboard
│   ├── layouts/
│   │   └── Layout.astro          # Base layout
│   └── pages/
│       ├── index.astro           # Home page
│       └── api/                  # API endpoints for services
│           ├── sonarr.ts
│           ├── radarr.ts
│           ├── jellyfin.ts
│           ├── plex.ts
│           ├── qbittorrent.ts
│           └── transmission.ts
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## License

MIT

