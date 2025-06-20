<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
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
const isMobileMenuOpen = ref(false);
const isCartSidebarOpen = ref(false);
const userIcon = ref(null);
const dropdown = ref(null);
const mobileMenu = ref(null);
const cartSidebar = ref(null);

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
  $event.emit("highlight-book", book.id);
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

    const handleClickOutside = (event) => {
      if (
        userIcon.value &&
        !userIcon.value.contains(event.target) &&
        dropdown.value &&
        !dropdown.value.contains(event.target)
      ) {
        isDropdownOpen.value = false;
      }
      if (
        mobileMenu.value &&
        !mobileMenu.value.contains(event.target) &&
        !event.target.closest(".hamburger-button")
      ) {
        isMobileMenuOpen.value = false;
      }
      if (
        cartSidebar.value &&
        !cartSidebar.value.contains(event.target) &&
        !event.target.closest(".cart-icon")
      ) {
        isCartSidebarOpen.value = false;
      }
    };
    document.addEventListener("click", handleClickOutside);

    onUnmounted(() => {
      window.removeEventListener("storage", checkUserUpdate);
      document.removeEventListener("click", handleClickOutside);
      $event.off("cart-updated");
    });
  }
});

const isLoggedIn = computed(() => user.value?.loggedIn || false);
const userName = computed(() => {
  const name = user.value?.name || user.value?.username;
  if (name) return name;
  if (user.value?.email) return user.value.email.split("@")[0];
  return "ผู้ใช้";
});
const userRole = computed(() => user.value?.role || "");
const cartCount = computed(() =>
  cart.value.reduce((total, item) => total + item.quantity, 0)
);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const toggleCartSidebar = () => {
  if (!isLoggedIn.value) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      text: "คุณต้องล็อกอินก่อนใช้งานตะกร้า",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "ไปที่หน้าล็อกอิน",
      showCancelButton: true,
      cancelButtonColor: "#d33",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/auth/login");
      }
    });
  } else {
    isCartSidebarOpen.value = !isCartSidebarOpen.value;
  }
};

const updateQuantity = (item, change) => {
  const newQuantity = item.quantity + change;
  if (newQuantity <= 0) {
    removeFromCart(item.id, event);
    return;
  }
  if (newQuantity > (item.stock || 10)) {
    Swal.fire({
      icon: "warning",
      title: "สินค้าคงเหลือไม่เพียงพอ",
      text: `คงเหลือ: ${item.stock || 10} ชิ้น`,
      confirmButtonColor: "#f59e0b",
    });
    return;
  }
  item.quantity = newQuantity;
  if (process.client) {
    localStorage.setItem("cart", JSON.stringify(cart.value));
    $event.emit("cart-updated");
  }
};

const removeFromCart = (id, event) => {
  if (event) {
    event.stopPropagation();
  }
  cart.value = cart.value.filter((item) => item.id !== id);
  if (process.client) {
    localStorage.setItem("cart", JSON.stringify(cart.value));
    $event.emit("cart-updated");
  }
};

const viewCart = () => {
  router.push("/cart");
  isCartSidebarOpen.value = false;
  isMobileMenuOpen.value = false;
};

const proceedToCheckout = () => {
  router.push({ path: "/cart", query: { step: 2 } });
  isCartSidebarOpen.value = false;
  isMobileMenuOpen.value = false;
};

const logout = () => {
  if (process.client) {
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    $event.emit("cart-updated");
  }
  user.value = { loggedIn: false, name: "", role: "" };
  cart.value = [];
  isDropdownOpen.value = false;
  isMobileMenuOpen.value = false;
  router.push("/");
  Toast.fire({
    icon: "success",
    title: "ออกจากระบบสำเร็จ",
  });
};

const handleLogoClick = () => {
  if (userRole.value === "admin" && isLoggedIn.value) {
    router.push("/admin");
  } else {
    router.push("/");
  }
};

const navigateToLogin = () => {
  router.push("/auth/login");
  isMobileMenuOpen.value = false;
};

const navigateToRegister = () => {
  router.push("/auth/register");
  isMobileMenuOpen.value = false;
};

const navigateToProfile = () => {
  router.push("/Profile");
  isMobileMenuOpen.value = false;
};

const navigateToOrderHistory = () => {
  router.push("/OrderHistory");
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <nav
    class="bg-amber-300 text-white px-6 py-8 flex justify-between items-center h-12 fixed top-0 left-0 w-full z-1000"
  >
    <!-- Logo + Slogan -->
    <div class="flex items-center ml-2">
      <button class="cursor-pointer" @click="handleLogoClick">
        <div class="w-15 h-15 shadow-xl/20 rounded-full overflow-hidden">
          <img
            src="/images/Logo.jpg"
            alt="Logo"
            class="w-full h-full object-cover"
          />
        </div>
      </button>
      <span
        class="ml-4 text-lg font-semibold whitespace-nowrap drop-shadow hidden md:block showdow-lg"
      >
        ร้านที่รวบรวมหนังสือน้อยที่สุดในประเทศไทย
        <img
          src="/images/ยิ้ม.jpg"
          alt="โป้ง"
          class="inline-block w-10 h-10 bg-amber-300 rounded-full shadow-lg"
        />
      </span>
    </div>

    <!-- Desktop Menu -->
    <div class="hidden md:flex items-center space-x-4 mr-2">
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

      <!-- ไอคอนตะกร้า -->
      <div
        v-if="userRole !== 'admin'"
        class="relative cart-icon"
        @click="toggleCartSidebar"
      >
        <img
          src="/images/ตะกร้า.png"
          alt="ตะกร้า"
          class="w-8 h-8 cursor-pointer"
        />
        <span
          v-if="cartCount > 0"
          class="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
        >
          {{ cartCount }}
        </span>
      </div>

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
              src="/images/icon.png"
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
            >เข้าสู่ระบบ</nuxt-link
          >
          <nuxt-link
            to="/auth/register"
            class="bg-white text-amber-400 px-3 py-1 rounded hover:bg-amber-100 transition font-semibold"
            >สมัครสมาชิก</nuxt-link
          >
        </div>

        <div
          v-if="isDropdownOpen"
          class="absolute -right-9 mt-3 w-48 bg-amber-100 text-amber-800 rounded-lg shadow-xl z-10 border border-amber-200"
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

    <!-- Mobile Menu Section -->
    <div class="md:hidden flex items-center space-x-4">
      <div
        v-if="userRole !== 'admin'"
        class="relative flex items-center bg-white rounded-full px-3 py-2 shadow"
      >
        <svg
          class="w-4 h-4 text-gray-500 mr-2"
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
          placeholder="ค้นหา..."
          class="outline-none w-20 text-sm text-gray-700 bg-transparent"
          @input="filterBooks"
        />
        <div
          v-if="filteredBooks.length > 0"
          class="absolute top-full right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-20"
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

      <button
        @click="toggleMobileMenu"
        class="hamburger-button flex flex-col justify-center items-center w-8 h-8 space-y-1"
      >
        <div
          :class="[
            'w-6 h-0.5 bg-white transition-transform duration-300',
            isMobileMenuOpen ? 'rotate-45 translate-y-2' : '',
          ]"
        ></div>
        <div
          :class="[
            'w-6 h-0.5 bg-white transition-opacity duration-300',
            isMobileMenuOpen ? 'opacity-0' : '',
          ]"
        ></div>
        <div
          :class="[
            'w-6 h-0.5 bg-white transition-transform duration-300',
            isMobileMenuOpen ? '-rotate-45 -translate-y-2' : '',
          ]"
        ></div>
      </button>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div
      v-if="isMobileMenuOpen"
      class="absolute top-full left-0 w-full bg-amber-100 text-amber-800 shadow-xl z-20 md:hidden"
      ref="mobileMenu"
    >
      <div class="py-4 px-6 space-y-2">
        <div
          v-if="isLoggedIn"
          class="flex items-center space-x-3 pb-3 border-b border-amber-200"
        >
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
            <img
              src="/images/icon.png"
              alt="User Icon"
              class="w-full h-full object-cover"
              @error="
                (e) =>
                  (e.target.src =
                    'https://cdn-icons-png.flaticon.com/512/149/149071.png')
              "
            />
          </div>
          <span class="font-semibold">{{ userName }}</span>
        </div>
        <template v-if="isLoggedIn">
          <button
            v-if="userRole !== 'admin'"
            @click="navigateToProfile"
            class="w-full flex items-center px-4 py-3 hover:bg-amber-200 rounded-lg transition duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 mr-3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            จัดการโปรไฟล์
          </button>
          <button
            v-if="userRole !== 'admin'"
            @click="toggleCartSidebar"
            class="w-full flex items-center px-4 py-3 hover:bg-amber-200 rounded-lg transition duration-200"
          >
            <img src="/images/ตะกร้า.png" alt="ตะกร้า" class="w-6 h-6 mr-3" />
            ตะกร้า
            <span
              v-if="cartCount > 0"
              class="ml-auto bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ cartCount }}
            </span>
          </button>
          <button
            v-if="userRole !== 'admin'"
            @click="navigateToOrderHistory"
            class="w-full flex items-center px-4 py-3 hover:bg-amber-200 rounded-lg transition duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 mr-3"
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
          </button>
          <button
            @click="logout"
            class="w-full flex items-center px-4 py-3 hover:bg-amber-200 rounded-lg transition duration-200"
          >
            <svg
              class="w-6 h-6 mr-3"
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
        </template>
        <template v-else>
          <button
            @click="navigateToLogin"
            class="w-full bg-white text-amber-400 px-4 py-3 rounded-lg hover:bg-amber-50 transition font-semibold"
          >
            เข้าสู่ระบบ
          </button>
          <button
            @click="navigateToRegister"
            class="w-full bg-white text-amber-400 px-4 py-3 rounded-lg hover:bg-amber-50 transition font-semibold"
          >
            สมัครสมาชิก
          </button>
        </template>
      </div>
    </div>

    <!-- Sidebar ตะกร้าสินค้า -->
    <div
      v-if="isCartSidebarOpen"
      class="fixed top-0 right-0 w-1/3 h-full bg-white shadow-2xl p-6 z-50 overflow-y-auto transition-transform duration-300 ease-in-out"
      :class="{
        'translate-x-0': isCartSidebarOpen,
        'translate-x-full': !isCartSidebarOpen,
      }"
      ref="cartSidebar"
    >
      <div class="flex justify-between items-center mb-6 border-b pb-3">
        <h3 class="text-2xl font-bold text-gray-900">ตะกร้าสินค้า</h3>

        <p class="mt-1 pr-30 text-sm text-gray-600">
          (มีสินค้า {{ cartCount }} ชิ้น)
        </p>

        <button
          @click="isCartSidebarOpen = false"
          class="text-gray-600 cursor-pointer hover:text-gray-900 text-3xl"
        >
          x
        </button>
      </div>

      <div v-if="cart.length > 0" class="space-y-2">
        <div
          v-for="item in cart"
          :key="item.id"
          class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-200"
        >
          <img
            :src="item.image"
            alt="Product"
            class="w-20 h-20 object-cover rounded-md mr-3"
          />
          <div class="flex-1">
            <p class="text-base font-medium text-gray-800">{{ item.title }}</p>
            <p class="mt-1 text-xs text-gray-600">
              ฿{{ item.price.toLocaleString() }} x {{ item.quantity }}
            </p>
            <p class="mt-1 text-sm text-red-500 font-semibold">
              ฿{{ (item.price * item.quantity).toLocaleString() }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="updateQuantity(item, -1)"
              class="w-6 h-6 border-1 cursor-pointer rounded-full flex items-center justify-center hover:bg-red-300 text-red-500 text-xs font-semibold"
            >
              -
            </button>
            <span class="text-sm font-semibold text-gray-800">{{
              item.quantity
            }}</span>
            <button
              @click="updateQuantity(item, 1)"
              class="w-6 h-6 border-1  cursor-pointer rounded-full flex items-center justify-center hover:bg-red-300 text-red-500 text-xs font-semibold"
            >
              +
            </button>
            <button
              @click="removeFromCart(item.id, $event)"
              class="text-red-600 cursor-pointer hover:text-red-800 text-5xl ml-2 -mt-19"
            >
              ×
            </button>
          </div>
        </div>
        <div class="mt-6 pt-4">
          <p
            class="text-lg font-bold text-white bg-red-600 p-2 rounded-lg shadow-md"
          >
            ยอดรวม: ฿{{
              cart
                .reduce((total, item) => total + item.price * item.quantity, 0)
                .toLocaleString()
            }}
          </p>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 mt-20">
        ไม่มีสินค้าในตะกร้า
      </div>
      <div class="mt-6 flex justify-between space-x-4">
        <button
          @click="viewCart"
          class="flex-1 bg-gray-200 cursor-pointer text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold transition duration-200"
        >
          ดูในตะกร้า
        </button>
        <button
          @click="proceedToCheckout"
          class="flex-1 bg-amber-500 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-semibold transition duration-200"
        >
          สั่งซื้อ
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.group:hover .group-hover\:opacity-100,
.group:focus-within .focus-within\:opacity-100 {
  opacity: 1 !important;
  pointer-events: auto !important;
}

/* Hamburger animation */
.hamburger-button div {
  transform-origin: center;
}

/* Sidebar ตะกร้า */
.cart-icon {
  position: relative;
  cursor: pointer;
}

.cart-sidebar-enter-active,
.cart-sidebar-leave-active {
  transition: transform 0.3s ease-in-out;
}

.cart-sidebar-enter-from,
.cart-sidebar-leave-to {
  transform: translateX(100%);
}
</style>
