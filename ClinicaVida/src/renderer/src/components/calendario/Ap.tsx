import React from 'react';

declare global {
  interface Window {
    electronAPI: { openChildWindow: () => void };
  }
}

export default function App(): JSX.Element {
  return (
    <main className="h-screen flex items-center justify-center bg-slate-100">
      <button
        onClick={() => window.electronAPI.openChildWindow()}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
      >
        Abrir ventana secundaria
      </button>
    </main>
  );
}
