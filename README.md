# ✨ Kanban Board (Trello Clone)

A modern, glassmorphic Kanban board built with React, Vite, and `@dnd-kit`. This project was built step-by-step to demonstrate state management, drag-and-drop interactivity, and data persistence in React.

## 🚀 How to Run the Project

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies
Open your terminal, navigate to the project folder (`newtry`), and run the following command to install all necessary packages (like React, Vite, and dnd-kit):
```bash
npm install
```

### 2. Start the Development Server
Once the dependencies are installed, you can start the local development server by running:
```bash
npm run dev
```

### 3. Open the App
The terminal will output a local URL (usually `http://localhost:5173/`). Hold `Ctrl` (or `Cmd` on Mac) and click the link, or copy and paste it into your browser to view and interact with the app!

---

## 🛠️ Tech Stack & Features
- **Frontend Framework:** React + Vite
- **Styling:** Custom CSS with CSS Variables for a dynamic, glassmorphic UI.
- **Drag & Drop:** Powered by `@dnd-kit` for smooth, native-feeling interactions.
- **Data Persistence:** Uses the browser's `localStorage` to save your board automatically.

## 📁 Project Structure
- `src/App.jsx`: The main React component containing the State Management, Drag & Drop logic, and UI rendering.
- `src/App.css`: The styling for the layout, task cards, columns, and buttons.
- `src/index.css`: The global CSS containing the color palette (`--accent-1`, etc.) and the animated background.
