# Notesy Note: Future Scope & Strategic Architectural Roadmap

This document outlines the master blueprint for evolving Notesy Note from a traditional local Markdown editor into an advanced, LLM-powered "2nd brain" knowledge graph. The roadmap is structured into four progressive phases, assuming all technical debt from the *Current Design Issues* audit has been successfully remediated.

---

## Phase 1: Foundational Stabilization (Prerequisite)

Before deploying advanced compute-heavy AI features, the underlying engine must be fortified.
* **Database Index Optimization:** Deployment of compound indexes on `note_history(note_id, saved_at)` and `notes(folder_id, is_deleted)` to guarantee sub-millisecond query resolutions.
* **IPC Decoupling:** Migrating all heavy binary asset ingestions away from the Tauri IPC bridge to native Rust `std::fs` operations to ensure the UI operates at a constant 60FPS.
* **Memory Management:** Implementation of an aggressive Garbage Collector (GC) cron-job inside the Rust backend that utilizes regex to prune orphaned `assets` and auto-purges trashed items older than 30 days.

---

## Phase 2: The "2nd Brain" Local RAG Integration

Transitioning the application into an interconnected knowledge engine utilizing 100% on-device, zero-telemetry machine learning.

### 2.1. Local Vector Embeddings Pipeline
* **Architecture:** Integrate lightweight, on-device AI inference utilizing Rust frameworks like `candle` or `ort`.
* **Execution:** Run a highly efficient embedding model (e.g., `all-MiniLM-L6-v2`) entirely within the Rust backend.
* **Storage:** Upgrade the standard SQLite database with the `sqlite-vec` or `sqlite-vss` extension. Upon saving a note, the system asynchronously calculates the dense vector representation of the `content_text` and stores it natively within a new `embeddings` virtual table.

### 2.2. Semantic Bi-directional Knowledge Graph
* **Beyond Keyword Links:** Standard wikis rely on explicit `[[Note Links]]`. Notesy Note will evolve to calculate **Cosine Similarity** between note vectors in real-time.
* **Intelligent Suggestions:** As users type, the application will automatically suggest and visualize links to conceptually related notes, even if those notes share absolutely zero overlapping vocabulary.
* **Visual Topography:** The frontend will feature a 2D/3D force-directed graph (using D3.js or Three.js) visualizing the user's entire repository as a constellation of connected thoughts, colored by semantic proximity rather than manual folders.

### 2.3. Dynamic Contextual Assembly (Side-Panel)
* **The Feature:** When a user opens or writes a long-form document, an intelligent right-hand side-panel continuously surfaces the Top 3 to 5 semantically relevant notes from the past.
* **The Value:** This eliminates the "blank page" problem and effortlessly resurfaces forgotten knowledge, essentially allowing the user's past self to assist their present work.

---

## Phase 3: Autonomous Multi-Agent Workflows

Moving beyond a passive database, the system will utilize background autonomous agents to actively organize, synthesize, and tag the user's data while they sleep or work.

### 3.1. The WAL-Monitoring Summarizer Agent
* **Trigger Mechanism:** A lightweight Rust agent monitors the SQLite Write-Ahead Log (WAL). When a massive document is committed and the OS reports idle resources, the agent activates.
* **Inference:** The agent reads the raw text and feeds it through a quantized local LLM (e.g., `Llama-3-8B-Instruct` loaded via `llama.cpp` bindings in Rust).
* **Output:** It generates a concise, 2-sentence executive summary and populates a dedicated `auto_summary` column. The React frontend will display these summaries as sub-text in the Note List, making thousands of notes instantly scannable without opening them.

### 3.2. Automated Entity Extraction & Tagging
* **The Workflow:** Replace manual, tedious tagging. Upon saving a document, a specialized NLP routine scans the document payload.
* **NER (Named Entity Recognition):** It automatically identifies and extracts critical entities: technologies (e.g., "Docker", "Rust"), people, geographical locations, and recurring concepts.
* **Application:** These entities are automatically verified against the existing `tags` table and quietly assigned to the `note_tags` junction table, ensuring perfect organizational taxonomy without user intervention.

---

## Phase 4: Psychographic Visual Identity

The UI/UX must reflect the incredibly advanced, machine-learning-driven backend, catering to distinct user psychologies.

### 4.1. The "Minimalist/Clean" Architecture
* **Target Audience:** Writers, academics, and researchers.
* **Design Philosophy:** Extreme reduction of cognitive load. Hidden sidebars, expansive whitespace, and absolute focus on typography.
* **Execution:** Leverage the custom font integrations (Aptos, Helvetica, Calibri) built in `appStore.ts`. The UI chrome fades away entirely, leaving only the text and the subtle, AI-driven contextual suggestions floating gracefully in the margins.

### 4.2. The "Cyberpunk/Developer" Architecture
* **Target Audience:** AI Engineers, Data Scientists, and power-users.
* **Design Philosophy:** High-density, high-contrast, information-rich telemetry.
* **Execution:** A deep dark mode utilizing vibrant, neon accents to denote auto-generated tags vs. manual tags. The semantic graph visualizer takes center stage, featuring glowing node connections and real-time visualization of the embedding generation pipelines running in the background. Terminal-style monolithic fonts for code blocks and strict, grid-based alignment.