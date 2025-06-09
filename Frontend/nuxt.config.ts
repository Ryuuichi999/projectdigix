// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  devServer: {
    port: 3001
  },
  plugins: ['~/plugins/eventBus.js'],
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css','@fortawesome/fontawesome-free/css/all.min.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})