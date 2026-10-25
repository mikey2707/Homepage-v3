import fs from 'fs';
import path from 'path';

// Data directory - can be overridden via environment variable
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Icon mapping for skill categories
const SKILL_ICONS: Record<string, string> = {
  cloud: '☁️',
  server: '🖥️',
  code: '💻',
  database: '🗄️',
  security: '🔒',
  network: '🌐',
};

export interface ResumeData {
  personalInfo: {
    name: string;
    roles: string[];
    email: string;
    location: string;
    bio: string;
    social: Record<string, string>;
  };
  quickStats?: Array<{
    label: string;
    value: string;
  }>;
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
