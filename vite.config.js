import { defineConfig } from 'vite'

// `base` precisa bater com o nome do repositório no GitHub Pages.
// Ex: repo "violino-partitura" => site em https://<user>.github.io/violino-partitura/
// Em dev (npm run dev) o base é ignorado, então não atrapalha local.
export default defineConfig({
  base: process.env.GH_PAGES_BASE || '/violino-partitura/',
})
