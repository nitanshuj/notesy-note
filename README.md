# Noetesy Note

Noetesy Note is a high-performance, privacy-focused desktop note-taking and knowledge base application designed to streamline personal organization, documentation, and creative writing. Combining the safety and speed of a native desktop application with the rich interactivity of a modern web interface, Noetesy Note offers a distraction-free workspace for managing ideas.

At its core, the application features a powerful rich-text editor built on Tiptap and ProseMirror, supporting advanced formatting, code block syntax highlighting (powered by highlight.js), custom links, tables, and task lists. To prevent data loss, the editor employs a real-time, debounced autosave system that commits changes directly to a local database.

Organization is handled via a nested hierarchical folder system, allowing users to build a structured workspace with infinite levels of depth. Additionally, users can apply customizable, color-coded tags to cross-reference topics across different folders. A global, near-instantaneous search engine powered by SQLite’s FTS5 (Full-Text Search) allows users to query phrases across titles and note contents instantly.

Noetesy Note also includes robust local asset management, allowing users to drag and drop or paste images and PDFs directly into their notes, which are sandboxed locally in the application’s dedicated data folder. Finally, the application supports export options to standard Markdown and consolidated JSON packages, ensuring users retain complete control and ownership of their data without cloud dependency.

---

## Tech Stack

- **Frontend Framework:** React 18 & Vite
- **Programming Languages:** TypeScript (Frontend), Rust (Backend)
- **Desktop Wrapper:** Tauri v2 (Type-safe IPC, native APIs)
- **State Management:** Zustand (Separate global UI and editor stores)
- **Rich-Text Editor:** Tiptap & ProseMirror (Code highlighting, tables, tasks)
- **Database:** SQLite (Relational structure, migrations, connection pool)
- **Search Engine:** SQLite FTS5 (Full-Text Search)
- **Styling:** Tailwind CSS & Custom CSS
- **Icons:** Lucide React

---

## Setup & Installation

Follow these steps to set up and run Noetesy Note locally on your device:

1. **Install Prerequisites:**
   - **Node.js** (v18 or higher)
   - **Rust** (via [rustup](https://rustup.rs/))
   - **System Build Tools**:
     - *Windows*: Visual Studio C++ Build Tools
     - *macOS*: Xcode Command Line Tools (`xcode-select --install`)
     - *Linux*: `build-essential`, `curl`, `libssl-dev`, `libgtk-3-dev`, `webkit2gtk-4.0` (or `4.1`)

2. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd notesy-note
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run the Application:**
   - **Desktop mode (Tauri + React):**
     ```bash
     npm run tauri dev
     ```
   - **Web-only frontend preview:**
     ```bash
     npm run dev
     ```

5. **Build for Production:**
   ```bash
   npm run tauri build
   ```
