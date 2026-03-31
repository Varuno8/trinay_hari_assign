# AI Workflow Evaluator

A lightweight web application that ingests AI coding session transcripts and evaluates the quality of the engineering workflow using LLM-powered analysis.

Built for the Slait take-home assignment: *"How effectively is this engineer using AI during software development?"*

## How It Works

1. **Upload** one or more transcript files (.txt, .md, .json, .log) from your AI coding sessions
2. **Evaluate** — the app sends transcripts to an LLM which grades the workflow against a structured rulebook
3. **Review** — get a detailed breakdown with scores, evidence, strengths, gaps, and recommendations

## Evaluation Rulebook

Transcripts are graded on **9 weighted criteria** (scored 1-10 each, totalling 100%):

| Criterion | Weight | What It Checks |
|---|---|---|
| Instruction Clarity | 15% | Are prompts clear, specific, and unambiguous? |
| Problem Understanding | 15% | Does the user decompose the problem before coding? |
| Destructive Action Safeguards | 15% | Are there checks against deleting DBs, force-pushing, etc.? |
| Permission Management | 10% | Does the user review actions before granting access? |
| Context Provision | 10% | Does the user share tech stack, errors, constraints? |
| Incremental Verification | 10% | Does the user test after each step? |
| Security Awareness | 10% | Does the user catch exposed secrets, injection risks? |
| Scope Control | 10% | Does the user prevent over-engineering and keep AI focused? |
| Error Handling & Recovery | 5% | Does the user diagnose errors or retry blindly? |

### Grade Scale

| Grade | Score | Verdict |
|---|---|---|
| A+ | 90-100 | Exceptional |
| A | 80-89 | Excellent |
| B | 70-79 | Good |
| C | 60-69 | Satisfactory |
| D | 50-59 | Needs Improvement |
| F | 0-49 | Poor |

Each score is **evidence-based** — the LLM must cite specific moments from the transcript to justify every rating.

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** Vanilla HTML/CSS/TypeScript (black & white monospace theme)
- **LLM:** Cerebras API (llama3.1-8b) via native `fetch` (no axios)
- **File Upload:** Multer (memory storage)

## Setup & Run

### Prerequisites
- Node.js (v18+)
- npm

### Install

```bash
git clone https://github.com/Varuno8/trinay_hari_assign.git
cd trinay_hari_assign
npm install
```

### Configure

Create a `.env` file (or edit the existing one):

```
LLM_API_KEY=your_cerebras_api_key
LLM_MODEL=llama3.1-8b
PORT=3000
```

### Build & Run

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Build TypeScript + start server |
| `npm run build` | Compile TypeScript only |
| `npm start` | Run compiled server (after build) |

## Project Structure

```
.
├── src/
│   ├── server.ts          # Express backend, file upload, LLM evaluation
│   └── rulebook.ts        # 9 evaluation criteria, weights, scoring guides, grade scale
├── public/
│   ├── index.html         # Frontend UI (black & white monospace theme)
│   ├── app.ts             # Frontend TypeScript (upload, evaluate, render results)
│   └── tsconfig.json      # Frontend TS config
├── sample_transcripts/    # Real AI coding session transcripts
│   ├── trinay_hari_assign_transcript.txt
│   ├── video_frame_pose_transcript.txt
│   └── agent_swarm_360view_transcript.txt
├── .env                   # API key config
├── package.json
└── tsconfig.json          # Backend TS config
```

## Transcripts

Three real transcripts from my own AI coding sessions are included in `sample_transcripts/`:

1. **trinay_hari_assign_transcript.txt** — Building this very evaluator tool (meta!)
2. **video_frame_pose_transcript.txt** — Working on a video frame pose estimation project
3. **agent_swarm_360view_transcript.txt** — Building an agent swarm for 360-degree view analysis

## Approach & Design Decisions

**Why a rulebook?** Instead of letting the LLM freestyle its evaluation, I built a structured rulebook (`src/rulebook.ts`) with 9 specific criteria, each with weighted scores and 4-level scoring guides. This makes evaluations consistent, comparable, and grounded in concrete engineering signals.

**Why these 9 criteria?** They cover the full lifecycle of AI-assisted coding:
- **Before coding:** Instruction clarity, problem understanding, context provision
- **During coding:** Permission management, destructive action safeguards, scope control, incremental verification
- **Cross-cutting:** Security awareness, error handling

**Why native fetch over axios?** axios was compromised in a supply chain attack on March 31, 2026. Using native `fetch` eliminates this dependency risk entirely.

**Why black & white UI?** The assignment is about workflow quality, not UI polish. A clean monospace interface keeps focus on the content and is readable.
