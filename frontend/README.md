# SOLY — AI Coding Assistant for Web3

> Your AI coding assistant built for Solidity and Web3 development.

## What is SOLY?

SOLY is an AI assistant that understands Solidity like a senior engineer with 8+ years of smart contract experience. Ask architecture questions, get code reviewed, understand LSP standards, and ship better contracts — faster.

## Tech Stack

- **Next.js 15** — App Router, TypeScript
- **Tailwind CSS v4** — Dark theme, futuristic design
- **Vercel AI SDK** — Streaming AI responses
- **Anthropic Claude** — AI brain (claude-sonnet)
- **react-syntax-highlighter** — Code block rendering

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

Get an API key at: https://console.anthropic.com

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── chat/page.tsx         # Chat interface
│   ├── layout.tsx            # Root layout + nav
│   ├── globals.css           # Global styles + design tokens
│   └── api/chat/route.ts     # AI streaming API route
└── components/
    ├── Nav.tsx               # Navigation bar
    ├── chat/
    │   ├── ChatInterface.tsx # Main chat component
    │   ├── ChatInput.tsx     # Auto-resize input
    │   ├── MessageList.tsx   # Message rendering
    │   ├── CodeBlock.tsx     # Syntax highlighted code
    │   └── StarterPrompts.tsx# Empty state prompts
    └── landing/              # (future: extract landing sections)
```

## MVP Scope

- [x] Landing page with hero, features, how it works
- [x] Streaming chat with Solidity AI expertise
- [x] Syntax-highlighted code blocks with copy button
- [x] Starter prompts for new users
- [x] Responsive dark design

## Roadmap

### V2
- [ ] SOLY animated character (Ethereum diamond head)
- [ ] File upload for contract review
- [ ] Chat history (localStorage)
- [ ] Suggested follow-up questions

### V3
- [ ] RAG over Solidity docs + LSP specs + All About Solidity articles
- [ ] GitHub integration for PR review
- [ ] Multi-model support (Opus for audits, Sonnet for chat)
- [ ] User auth + saved sessions
