Clippy AI – Floating Desktop Assistant
A cross-platform Electron + React AI widget for productivity, automation & real-time AI interaction
📌 Overview

Clippy AI is a desktop-native AI assistant interface built using Electron + React + TypeScript.
It works as a floating widget on top of your desktop, draggable, resizable and built for fast AI access without opening a browser or terminal.

This project demonstrates:

✔ Cross-platform desktop development with Electron
✔ React + Tailwind UI architecture & state management
✔ Real-time OpenAI/Gemini chat integration
✔ Local storage persistence (history + settings)
✔ Custom animated canvas background + theme design
✔ Secure API key handling without storing or exposing keys

You launch it → type → get answers instantly like a system-level assistant.

✨ Features
🎛 Desktop Features

Frameless always-on-top widget

Drag & resize anywhere on screen

Minimize to compact floating bubble

Transparent background aesthetic

🤖 AI Interaction

Choose provider: OpenAI or similar

No backend server required

All calls are direct HTTPS requests

Chat history stored locally

Maintains context across messages

🧠 Commands & Utilities
Function	Example
Open websites	open google.com
Clear chat	clear
Math processing	2 + 3 * 5
Clipboard summarize	📋 button
Export chat	Save as .txt
🖌 UI/Design

TailwindCSS + custom gold cyber styling

Particle-network animated Motate background

Light/Dark Motate modes

Smooth interaction & depth shadows

🏗 Tech Stack
Layer	Technology
Runtime	Electron.js
UI	React + TypeScript
Styling	TailwindCSS
Build	Vite
AI	OpenAI API / Gemini API
Storage	localStorage (no cloud dependency)
📂 Project Structure
clippy/
│── src/                # React UI components
│── electron/           # Electron main + preload scripts
│── public/             # index.html entry
│── dist-electron/      # Auto-generated build output
│── package.json        # Scripts + dependencies
│── ...
└── README.md

🚀 Run Locally

No .env required
API key is securely entered inside the app Settings Panel.

1. Clone + Install
git clone https://github.com/<your-username>/clippy-ai
cd clippy-ai
npm install

2. Start development mode
npm run dev


This spins up:

React frontend via Vite

Electron loads window automatically

3. Inside app → Open Settings (⚙)

Enter your API key:

OpenAI → Bearer Key
Gemini → API Key


Nothing is saved to cloud.
Key remains only in your local browser storage.

🧠 How To Use
Action	How
Toggle settings	Click ⚙
Minimize widget	Click ─
Restore window	Double-click bubble
Drag window	Hold title bar & move
Resize	Drag corner handle ↘
Clipboard summarize	Press 📋
Send message	 button or Enter
