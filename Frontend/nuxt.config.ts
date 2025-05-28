// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
   devServer: {
    port: 3001 
  },
  
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui','@nuxt/ui-pro','@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
   plugins: [
     tailwindcss(),
   ],
 },
})