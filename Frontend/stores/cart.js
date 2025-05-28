import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
  }),
  
  getters: {
    cartItemsCount: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    },
    
    cartTotal: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
  },
  
  actions: {
    addItem(book) {
      const existingItem = this.items.find(item => item.id === book.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.items.push({
          id: book.id,
          title: book.title,
          price: book.price,
          image_url: book.image_url,
          quantity: 1
        });
      }
      
      this.saveCart();
    },
    
    updateItemQuantity(bookId, quantity) {
      const item = this.items.find(item => item.id === bookId);
      
      if (item) {
        if (quantity > 0) {
          item.quantity = quantity;
        } else {
          this.removeItem(bookId);
        }
        
        this.saveCart();
      }
    },
    
    removeItem(bookId) {
      this.items = this.items.filter(item => item.id !== bookId);
      this.saveCart();
    },
    
    clearCart() {
      this.items = [];
      this.saveCart();
    },
    
    saveCart() {
      if (process.client) {
        localStorage.setItem('cart', JSON.stringify(this.items));
      }
    },
    
    loadCart() {
      if (process.client) {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          this.items = JSON.parse(savedCart);
        }
      }
    }
  }
});