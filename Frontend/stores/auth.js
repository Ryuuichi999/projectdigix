import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  
  actions: {
    async login(email, password) {
      try {
        const { $fetch } = useNuxtApp();
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        });
        
        this.setAuth(response.user, response.token);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.message || 'Login failed. Please check your credentials.'
        };
      }
    },
    
    async register(username, email, password) {
      try {
        const { $fetch } = useNuxtApp();
        const response = await $fetch('/api/auth/register', {
          method: 'POST',
          body: { username, email, password }
        });
        
        this.setAuth(response.user, response.token);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.message || 'Registration failed. Please try again.'
        };
      }
    },
    
    setAuth(user, token) {
      this.user = user;
      this.token = token;
      
      // Store in localStorage
      if (process.client) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
      }
    },
    
    logout() {
      this.user = null;
      this.token = null;
      
      // Remove from localStorage
      if (process.client) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    },
    
    // Initialize auth state from localStorage
    init() {
      if (process.client) {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (user && token) {
          this.user = JSON.parse(user);
          this.token = token;
        }
      }
    }
  }
});