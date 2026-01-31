import fs from 'fs';
import path from 'path';

// Data directory - can be overridden via environment variable
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Dashboard Icons CDN base URL
const ICON_BASE = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png';

// Icon mapping for skill categories
const SKILL_ICONS: Record<string, string> = {
  cloud: '☁️',
  server: '🖥️',
  code: '💻',
  database: '🗄️',
  security: '🔒',
  network: '🌐',
};

interface Bookmark {
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
}

interface BookmarksData {
  bookmarks: Bookmark[];
}

interface ResumeData {
  personalInfo: {
    name: string;
    roles: string[];
    email: string;
    location: string;
    bio: string;
    social: Record<string, string>;
  };
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
    link?: string;
  }>;
  skillCategories: Array<{
    name: string;
    icon: string;
    skills: string[];
  }>;
  experience: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
    tech?: string[];
    achievements?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
    details?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

function readJsonFile<T>(filename: string): T | null {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

function replaceEnvVars(str: string): string {
  // Replace ${VAR_NAME} with environment variable value
  return str.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] || '#';
  });
}

export function getBookmarks(): Bookmark[] {
  const data = readJsonFile<BookmarksData>('bookmarks.json');
  if (!data?.bookmarks) {
    return [];
  }

  return data.bookmarks.map((bookmark) => ({
    ...bookmark,
    url: replaceEnvVars(bookmark.url),
    // Convert icon name to full CDN URL
    icon: bookmark.icon.startsWith('http')
      ? bookmark.icon
      : `${ICON_BASE}/${bookmark.icon}.png`,
  }));
}

export function getResumeData(): ResumeData | null {
  const data = readJsonFile<ResumeData>('resume.json');
  if (!data) {
    return null;
  }

  // Convert icon names to emoji for skill categories
  return {
    ...data,
    skillCategories: data.skillCategories.map((category) => ({
      ...category,
      icon: SKILL_ICONS[category.icon] || category.icon,
    })),
  };
}
