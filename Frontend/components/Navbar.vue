<script setup>
import { computed, onMounted, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useNuxtApp } from "nuxt/app";
import Swal from "sweetalert2";

const router = useRouter();
const { $event } = useNuxtApp();

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const user = ref(null);
const cart = ref([]);
const books = ref([]);
const searchQuery = ref("");
const filteredBooks = ref([]);
const isDropdownOpen = ref(false);
const userIcon = ref(null);
const dropdown = ref(null);

const fetchBooks = async () => {
  try {
    const response = await $fetch("http://localhost:3000/books");
    books.value = response.map((book) => ({
      id: book.id,
      title: book.title,
      category: book.categories?.[0]?.category?.category_name || "ไม่ระบุ",
    }));
  } catch (error) {
    console.error("Error fetching books:", error);
    books.value = [];
  }
};

const filterBooks = () => {
  if (!searchQuery.value.trim()) {
    filteredBooks.value = [];
    return;
  }
  filteredBooks.value = books.value.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
};

const selectBook = (book) => {
  searchQuery.value = book.title;
  filteredBooks.value = [];
  scrollToBook(book.id);
};

const scrollToBook = (bookId) => {
  const bookElement = document.querySelector(`#book-${bookId}`);
  if (bookElement) {
    bookElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

onMounted(() => {
  if (process.client) {
    const storedUser = localStorage.getItem("user");
    user.value = storedUser
      ? JSON.parse(storedUser)
      : { loggedIn: false, name: "", role: "" };
    cart.value = JSON.parse(localStorage.getItem("cart") || "[]");

    fetchBooks();

    $event.on("cart-updated", () => {
      cart.value = JSON.parse(localStorage.getItem("cart") || "[]");
    });

    const checkUserUpdate = () => {
      const newUser = localStorage.getItem("user");
      if (newUser) {
        const parsedUser = JSON.parse(newUser);
        if (user.value?.loggedIn !== parsedUser.loggedIn) {
          if (parsedUser.loggedIn) {
            Toast.fire({
              icon: "success",
              title: "ล็อกอินสำเร็จ",
            });
          }
          user.value = parsedUser;
        }
      }
    };
    window.addEventListener("storage", checkUserUpdate);
    onUnmounted(() => window.removeEventListener("storage", checkUserUpdate));
  }

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
  document.addEventListener("click", handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
    $event.off("cart-updated");
  });
});

const isLoggedIn = computed(() => user.value?.loggedIn || false);
const userName = computed(() => {
  const name = user.value?.name || user.value?.username;
  if (name) return name;
  if (user.value?.email) return user.value.email.split("@")[0];
  return "ผู้ใช้";
});
const userRole = computed(() => user.value?.role || "");
const cartCount = computed(() => cart.value.length);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleCartClick = () => {
  if (!isLoggedIn.value) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      text: "คุณต้องล็อกอินก่อนใช้งานตะกร้า",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "ไปที่หน้าล็อกอิน",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/auth/login");
      }
    });
  } else {
    router.push("/cart");
  }
};

const logout = () => {
  if (process.client) {
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
  }
  user.value = { loggedIn: false, name: "", role: "" };
  cart.value = [];
  isDropdownOpen.value = false;
  router.push("/");
  Toast.fire({
    icon: "success",
    title: "ออกจากระบบสำเร็จ",
  });
};
</script>

<style scoped>
.group:hover .group-hover\:opacity-100,
.group:focus-within .focus-within\:opacity-100 {
  opacity: 1 !important;
  pointer-events: auto !important;
}
</style>

<template>
  <nav
    class="bg-amber-300 text-white px-6 py-8 flex justify-between items-center h-12"
  >
    <!-- Logo + Slogan -->
    <div class="flex items-center ml-2">
      <button class="cursor-pointer" @click="router.push('/')">
        <div class="w-15 h-15 shadow-lg rounded-full overflow-hidden">
          <img
            src="/images/Logo.jpg"
            alt="Logo"
            class="w-full h-full object-cover"
          />
        </div>
      </button>
      <span class="ml-4 text-lg font-semibold whitespace-nowrap drop-shadow">
        ร้านที่รวบรวมหนังสือน้อยที่สุดในประเทศไทย
        <img
          src="/images/โป้ง.webp"
          alt="โป้ง"
          class="inline-block w-10 h-10 ml-2"
        />
      </span>
    </div>

    <div class="flex items-center space-x-4 mr-2">
      <!-- ช่องค้นหา -->
      <div
        v-if="userRole !== 'admin'"
        class="relative flex items-center bg-white rounded-full px-4 py-2 max-w-xl shadow"
      >
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
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาหนังสือ"
          class="outline-none w-48 text-sm text-gray-700 bg-transparent focus:w-64 transition-all duration-300"
          @input="filterBooks"
        />
        <!-- Dropdown ผลลัพธ์การค้นหา -->
        <div
          v-if="filteredBooks.length > 0"
          class="absolute top-full left-0 mt-2 w-full bg-white border rounded-lg shadow-lg z-20"
        >
          <div
            v-for="book in filteredBooks"
            :key="book.id"
            @click="selectBook(book)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-700"
          >
            {{ book.title }}
          </div>
        </div>
      </div>
      <nuxt-link to="/about" class="hover:text-amber-100 transition font-semibold"
        >เกี่ยวกับเรา</nuxt-link
      >
      <!-- ไอคอนตะกร้า -->
      <nuxt-link
        v-if="userRole !== 'admin'"
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
              @error="
                (e) =>
                  (e.target.src =
                    'https://cdn-icons-png.flaticon.com/512/149/149071.png')
              "
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
          class="absolute -right-9 ml-15 mt-3 w-48 bg-amber-100 text-amber-800 rounded-lg shadow-xl z-10 border border-amber-200"
          ref="dropdown"
        >
          <nuxt-link
            v-if="userRole !== 'admin'"
            to="/Profile"
            class="flex px-4 py-2 hover:bg-amber-200 rounded-lg transition duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>

            จัดการโปรไฟล์
          </nuxt-link>
          <nuxt-link
            v-if="userRole !== 'admin'"
            to="/OrderHistory"
            class="flex px-4 py-2 hover:bg-amber-200 rounded-lg transition duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            ประวัติการสั่งซื้อ
          </nuxt-link>
          <button
            @click="logout"
            class="w-full text-left px-4 py-2 hover:bg-amber-200 rounded-lg transition duration-200 flex items-center cursor-pointer"
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

