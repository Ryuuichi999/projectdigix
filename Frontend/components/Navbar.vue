<template>
  <nav
    class="bg-amber-300 text-white px-6 py-8 flex justify-between items-center h-12"
  >
    <!-- Logo + Slogan -->
    <div class="flex items-center ml-2">
      <div class="w-15 h-15 shadow-lg rounded-full overflow-hidden">
        <img src="/images/Logo.jpg" alt="Logo" class="w-full h-full object-cover" />
      </div>
      <span class="ml-4 text-lg font-semibold whitespace-nowrap drop-shadow">
        ร้านที่รวบรวมหนังสือน้อยที่สุดในประเทศไทย
        <img src="/images/โป้ง.webp" alt="โป้ง" class="inline-block w-10 h-10 ml-2" />
      </span>
    </div>

    <div class="flex items-center space-x-4 mr-2">
      <!-- ช่องค้นหา -->
      <div class="flex items-center bg-white rounded-full px-4 py-2 max-w-xl shadow">
        <svg
          class="w-5 h-5 text-gray-500 mr-2"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="ค้นหาหนังสือ"
          class="outline-none w-48 text-sm text-gray-700 bg-transparent focus:w-64 transition-all duration-300"
        />
      </div>

      <!-- ไอคอนตะกร้า -->
      <nuxt-link
        to="/cart"
        @click.prevent="handleCartClick"
        class="relative flex items-center"
      >
        <img src="/images/ตะกร้า.png" alt="ตะกร้า" class="w-8 h-8" />
        <span
          v-if="cartCount > 0"
          class="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
        >
          {{ cartCount }}
        </span>
      </nuxt-link>

      <!-- เมนูผู้ใช้ -->
      <div class="relative">
        <div
          v-if="isLoggedIn"
          class="flex items-center space-x-2 cursor-pointer"
          @click="toggleDropdown"
          ref="userIcon"
        >
  
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
            <img
              src="/images/icon.jpg"
              alt="User Icon"
              class="w-full h-full object-cover"
            />
          </div>
          <span class="text-white font-semibold">{{ userName }}</span>
        </div>
        <div v-else class="flex space-x-2">
          <nuxt-link
            to="/auth/login"
            class="bg-white text-amber-400 px-3 py-1 rounded hover:bg-amber-100 transition font-semibold"
          >
            เข้าสู่ระบบ
          </nuxt-link>
          <nuxt-link
            to="/auth/register"
            class="bg-white text-amber-400 px-3 py-1 rounded hover:bg-amber-100 transition font-semibold"
          >
            สมัครสมาชิก
          </nuxt-link>
        </div>

        <!-- Dropdown เมนู -->
        <div
          v-if="isDropdownOpen"
          class="absolute  mt-2 w-48 bg-amber-100 text-amber-800 rounded-lg shadow-xl z-10 border border-amber-200"
          ref="dropdown"
        >
          <button
            @click="logout"
            class="w-full text-left px-4 py-2 hover:bg-amber-200 rounded-lg transition duration-200 flex items-center"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// เก็บข้อมูลผู้ใช้และตะกร้า
const user = ref(null);
const cart = ref([]);
const isDropdownOpen = ref(false);
const userIcon = ref(null);
const dropdown = ref(null);

onMounted(() => {
  if (process.client) {
    user.value = JSON.parse(localStorage.getItem('user') || '{}');
    cart.value = JSON.parse(localStorage.getItem('cart') || '[]');
  }

  // ปิด Dropdown เมื่อคลิกนอก
  const handleClickOutside = (event) => {
    if (
      userIcon.value &&
      !userIcon.value.contains(event.target) &&
      dropdown.value &&
      !dropdown.value.contains(event.target)
    ) {
      isDropdownOpen.value = false;
    }
  };
  document.addEventListener('click', handleClickOutside);

  // ทำความสะอาด event listener
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});

// อัปเดตตะกร้าเมื่อ localStorage เปลี่ยน
watch(
  () => localStorage.getItem('cart'),
  (newCart) => {
    cart.value = JSON.parse(newCart || '[]');
  }
);

const isLoggedIn = computed(() => user.value?.loggedIn || false);
const userName = computed(() => user.value?.name || '');
const userRole = computed(() => user.value?.role || '');
const cartCount = computed(() => cart.value.length);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleCartClick = () => {
  if (!isLoggedIn.value) {
    alert('กรุณาเข้าสู่ระบบก่อนใช้งานตะกร้า');
    router.push('/auth/login');
  } else {
    router.push('/cart');
  }
};

const logout = () => {
  if (process.client) {
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // ลบตะกร้าเมื่อออกจากระบบ
  }
  user.value = { loggedIn: false, name: '', role: '' };
  cart.value = [];
  isDropdownOpen.value = false;
  router.push('/');
  alert('ออกจากระบบเรียบร้อยแล้ว');
};
</script>

<style scoped>
.group:hover .group-hover\:opacity-100,
.group:focus-within .focus-within\:opacity-100 {
  opacity: 1 !important;
  pointer-events: auto !important;
}
</style>