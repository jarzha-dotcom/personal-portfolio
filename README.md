# 🌟 Personal Portfolio & AI Multi-Agent Ecosystem

> **Official Portfolio Website of K. Arzhaning Jagad (Arzha)**  
> *Indie Developer & Corporate Audit Specialist (7+ Years of Experience)*  
> 📍 Cibitung, Bekasi, Jawa Barat | 🌐 [arzhaning.my.id](https://arzhaning.my.id)

---

## 📖 Overview

This repository powers the official portfolio website of **K. Arzhaning Jagad**, engineered to showcase high-performance full-stack web applications, realtime game architectures, corporate data systems, and an enterprise-grade multi-agent AI assistant infrastructure.

---

## 🚀 Key Features

### 1. 🤖 Multi-Persona AI Assistant System
- **Zannah (Sales & Tech Consultant)**: Interactive consultative assistant for prospective clients, project cost estimation (RAB), timeline breakdowns, and automated transcript generation.
- **Rajendra (AI & Architecture Showcase)**: Technical demo bot capable of proving code feasibility and running live prototypes.
- **Kania (HR & Career Interviewer)**: Specialized HR assistant that answers recruiter questions regarding Arzha's 7+ years of professional audit and software engineering track record.
- **Radit (Offline/Hybrid FAQ Fallback)**: Zero-quota semantic FAQ search powered by Gemini Embeddings with fuzzy Fuse.js fallback.

### 2. ⚡ Google Antigravity Autonomous Agent (Interactions API)
- **Live Tool Execution**: Runs code, analyzes files (PNG, WebP, PDF, CSV), and searches the web inside a remote sandbox.
- **Autonomous File Extraction**: Unpacks and delivers client-ready downloadable deliverables (`.html`, `.txt`, `.pdf`, `.xlsx`) dynamically generated in the sandbox.
- **Quota Protection**: Global daily cap + per-IP rate limiting to safeguard preview quotas and ensure 100% uptime.

### 3. 🔄 Resilient Multi-Layer AI Cascade (100% Free Tier AI Studio)
```
[User Request]
       │
       ├──► Layer 1: Google Antigravity Agent (Opt-in preview, AI Studio)
       │         └── [If unavailable / quota reached]
       ├──► Layer 2: Google AI Studio Cascade (Gemini 3.8 / 3.5-Lite / 3.7 / 3.1-Lite / 3.6 / 3.5)
       │         └── [If rate limited / high demand 503 / 20 RPD exhausted]
       ├──► Layer 3: Gemma 4 Open-Weight Powerhouse (Gemma 4 31B & 26B — 14.400 RPD, 30 RPM)
       │         └── [If all AI offline]
       └──► Layer 4: Semantic Embedding FAQ + Fuse.js Client Search (Zero-quota)
```

### 4. ⚡ High-Performance Frontend & UX
- **React 19 + Vite 6 + Tailwind CSS v4**: Ultra-fast build with minimal client bundle size.
- **Largest Contentful Paint (LCP) Optimized**: Priority hero image loading, async decoding, static class maps.
- **IndexedDB Multi-Session Storage**: Persistent multi-conversation history per persona with automatic pruning of stale sessions (> 30 days).
- **Dark / Light Theme**: Seamless toggle with system preference synchronization.
- **Audio TTS Integration**: Natural speech synthesis with dynamic number formatting and text normalization.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion, Lucide React, Fuse.js |
| **Backend / API** | Vercel Serverless Functions (`/api/chat`, `/api/tts`), Node.js |
| **AI & LLM** | Google Gemini 3.8/3.7/3.5/3.1, Google Antigravity (Interactions API), Gemma 4, Gemini Embeddings |
| **Testing & Quality** | Vitest, TypeScript (`tsc --noEmit`), ESLint |

---

## 📂 Project Structure

```
personal-portfolio/
├── api/                        # Vercel Serverless Functions
│   ├── chat.ts                 # Chat & streaming orchestrator endpoint
│   ├── tts.ts                  # Text-to-speech audio endpoint
│   ├── lib/                    # Modularized backend engine
│   │   ├── prompts.ts          # Persona system instructions (Zannah, Rajendra, Kania)
│   │   ├── rateLimiter.ts      # Per-IP rate limiting & daily Antigravity caps
│   │   ├── documentGenerator.ts# RAB & research HTML/TXT export builders
│   │   ├── antigravity.ts      # Antigravity agent client & tar unpacker
│   │   ├── intentDetector.ts   # Intent classification & readiness gating
│   │   ├── semanticFaq.ts      # Vector embeddings for semantic FAQ lookup
│   │   └── geminiModels.ts     # Multi-LLM cascade calling routines
│   └── __tests__/              # Backend unit tests
├── src/
│   ├── components/             # UI Components (Hero, About, Projects, AIChatbotShowcase, etc.)
│   ├── data/                   # Portfolio data, FAQ items, and experience records
│   ├── services/               # Frontend API client (Gemini & TTS services)
│   ├── utils/                  # Storage (IndexedDB), formatters, and utilities
│   └── utils/__tests__/        # Frontend unit tests
├── vitest.config.ts            # Vitest test configuration
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env.local` or configure in the Vercel Project Settings:

```env
# Primary Google AI Studio Key (Interactions API, Gemini & Gemma cascade — Free Tier)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Platform Key for Text-to-Speech (WaveNet Free Tier 1M chars/mo)
GCP_API_KEY=your_gcp_tts_api_key_here
GCP_TTS=true
```

---

## 🧪 Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Dev Server
```bash
npm run dev
```

### 3. Run Automated Unit Tests (Vitest)
```bash
npm run test
```

### 4. Run TypeScript Type Check
```bash
npm run lint
```

### 5. Build for Production
```bash
npm run build
```

---

## 📄 License

Proprietary © 2026 **K. Arzhaning Jagad (Arzha)**. All Rights Reserved.  
Unauthorized duplication or re-distribution without license is strictly prohibited.