export interface ExperienceRole {
  role: string;
  period?: string;
  isCurrent?: boolean;
  tasks: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  period: string;
  location: string;
  roles: ExperienceRole[];
  type?: string;
}

export interface HardSkill {
  name: string;
  level: number;
  category: string;
  description: string;
}

export interface SoftSkill {
  name: string;
  iconName: string;
  description: string;
}

export interface EducationItem {
  institution: string;
  period: string;
  location: string;
  degree: string;
  description?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  displayPhone: string;
  location: string;
  availableForWork: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  category: 'Game & App' | 'Edukasi' | 'Web App';
  badge: string;
  description: string;
  longDescription?: string;
  highlights: string[];
  techStack: string[];
  role: string;
  year: string;
  demoUrl?: string;
  githubUrl?: string;
  isFeatured?: boolean;
  colorScheme?: 'amber' | 'teal' | 'indigo' | 'emerald';
  iconType?: string;
}

export interface TechStackGroup {
  category: string;
  items: string[];
}
