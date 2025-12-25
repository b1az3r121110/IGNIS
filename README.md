
# Ignis Engine & Creator 🔥

![Ignis Badge](https://img.shields.io/badge/Ignis-Engine_v2.6.2-ff5e3a?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge)
![ThreeJS](https://img.shields.io/badge/Three.js-r160-white?style=for-the-badge)

**Ignis** is a next-generation, web-based game engine and design suite capable of rendering 2D, 3D, and 4D geometries. Built with a Firewatch-inspired aesthetic, it combines high-performance visual scripting, a custom hybrid programming language (Tendr), and the Flint Physics engine into a seamless creator experience.

---

## 🌟 Key Features

### 🎮 Viewport & Rendering
*   **Hybrid Dimension Rendering**: Seamlessly switch between 2D, 3D, and **4D (Tesseract/Glome)** rendering modes.
*   **Real-time Raytracing support**: (Experimental) material properties including roughness, metalness, and emission.
*   **Ember Particle Engine**: A GPU-accelerated particle system supporting hyper-dimensional velocity and spread.

### 🧩 Visual & Code Logic
*   **Visual Scripting**: A node-based blueprint system for gameplay logic without writing code.
*   **Tendr Language**: A custom, Rust-inspired scripting language (`.tdr`) compiled in real-time within the browser.
*   **JavaScript Bridge**: Native support for standard JS scripting.

### ⚛️ Physics (Flint Engine v2.1)
*   **Rigid Body Dynamics**: Mass, friction, restitution, and gravity scaling.
*   **Fluid Dynamics**: Particle-based fluid simulation.
*   **4D Physics**: Interactions extending into the W-axis (Hyper-gravity, W-Mass).
*   **Quantum Mechanics**: Experimental nodes for Superposition and Entanglement logic.

### 🎨 Editors & Tools
*   **Shader Editor**: A node-based GLSL shader graph editor with real-time preview.
*   **Audio Suite**: Ray-traced 3D spatial audio mixer with Doppler effect and EQ.
*   **Asset Browser**: Drag-and-drop asset management for Meshes, Textures, Scripts, and Audio.
*   **GenAI Asset Creator**: Integrated Gemini 2.5 Flash support for generating 3D/4D geometry from text prompts.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ignis-engine.git
    cd ignis-engine
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file in the root and add your Google Gemini API Key for AI features:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  Start the development server:
    ```bash
    npm start
    ```

---

## 🕹️ Controls

### Viewport Navigation
*   **Orbit**: Left Click + Drag (Background)
*   **Pan**: Right Click + Drag
*   **Zoom**: Mouse Wheel

### Simulation Mode
*   **W / A / S / D**: Move Player (when a Controller is active)
*   **Space**: Jump
*   **Shift**: Sprint

### Visual Editors (Shader / Logic)
*   **Pan Canvas**: Right Click + Drag or Middle Click + Drag
*   **Add Node**: Right Click (Open Context Menu)
*   **Delete Node**: Select + Delete Key or Trash Icon
*   **Connect**: Drag from Output Pin to Input Pin

---

## 📂 Project Structure

*   `components/Editor/` - Core editor tools (Viewport, CodeEditor, ShaderEditor, etc.)
*   `components/Layout/` - UI shell (Sidebar, Toolbar)
*   `types.ts` - TypeScript definitions for Entities, Assets, and Engine subsystems.
*   `App.tsx` - Main entry point and global state manager.

---

## 🔮 Future Roadmap

*   **Multiplayer Networking**: WebSocket integration for real-time collaboration.
*   **Native Export**: Electron-based wrappers for Windows/Mac builds.
*   **Advanced AI**: Local LLM inference for NPC behavior.

---

Made with ❤️ by the Ignis Team.
