import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves a project site from /<repo-name>/, so every asset URL
  // needs that prefix. Set VITE_BASE_PATH at build time (e.g. "/chat-app/");
  // it stays "/" for local dev and for a user/organisation site.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
})
