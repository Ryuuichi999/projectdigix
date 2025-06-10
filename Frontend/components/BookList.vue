<script setup>
import { onMounted, ref, watch } from "vue";
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

const addedBooks = ref({});
const books = ref([]);
const filteredBooks = ref([]);
const categories = ref([]);
const selectedCategory = ref("");
const sortBy = ref("title-asc");
const highlightedBookId = ref(null); // เก็บ ID ของหนังสือที่เน้น

const fetchBooks = async () => {
  try {
    const response = await $fetch("http://localhost:3000/books");
    books.value = response.map((book) => ({
      id: book.id,
      title: book.title,
      price: book.price,
      image: book.image,
      stock: book.stock?.quantity ?? 0,
      category: book.categories?.[0]?.category?.category_name || "ไม่ระบุ",
      categoryId: book.categories?.[0]?.category?.id || null,
    }));
    filteredBooks.value = [...books.value];
    sortBooks();
  } catch (error) {
    console.error("Error fetching books:", error);
    books.value = [];
    filteredBooks.value = [];
  }
};

const fetchCategories = async () => {
  try {
    const response = await $fetch("http://localhost:3000/categories");
    categories.value = response.map((category) => ({
      id: category.id,
      category_name: category.category_name,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    categories.value = [];
  }
};

const filterBooks = () => {
  filteredBooks.value = books.value.filter((book) =>
    selectedCategory.value
      ? book.categoryId === Number(selectedCategory.value)
      : true
  );
  sortBooks();
};

const sortBooks = () => {
  const [field, order] = sortBy.value.split("-");
  filteredBooks.value.sort((a, b) => {
    if (field === "title") {
      return order === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (field === "price") {
      return order === "asc" ? a.price - b.price : b.price - a.price;
    } else if (field === "stock") {
      return order === "asc" ? a.stock - b.stock : b.stock - a.stock;
    }
    return 0;
  });
};

onMounted(() => {
  fetchBooks();
  fetchCategories();

  // รับ event เพื่อเน้นหนังสือ
  $event.on("highlight-book", (bookId) => {
    highlightedBookId.value = bookId;
    // รีเซ็ตการเน้นหลังจาก 3 วินาที
    setTimeout(() => {
      highlightedBookId.value = null;
    }, 3000);
  });
});

const addToCart = (book) => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า",
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "ไปที่หน้าเข้าสู่ระบบ",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: "ยกเลิก",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/auth/login");
        }
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.id === book.id);

    if (existingItem) {
      if (existingItem.quantity >= book.stock) {
        Swal.fire({
          icon: "warning",
          title: "สินค้าคงเหลือไม่เพียงพอ",
          text: `คงเหลือ: ${book.stock} เล่ม`,
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
      existingItem.quantity += 1;
    } else {
      if (book.stock <= 0) {
        Swal.fire({
          icon: "warning",
          title: "สินค้าหมด",
          text: "ขออภัย สินค้าหมดสต็อก",
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
      cart.push({
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.image,
        stock: book.stock,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    addedBooks.value[book.id] = true;
    setTimeout(() => {
      addedBooks.value[book.id] = false;
    }, 2000);
    $event.emit("cart-updated");
    Toast.fire({
      icon: "success",
      title: "เพิ่มสินค้าในตะกร้าสำเร็จ",
    });
  }
};
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes highlightPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 10px 5px rgba(255, 193, 7, 0.5);
  }
}
select option {
  color: #1f2937;
  background-color: #ffffff;
  font-size: 1rem;
  padding: 0.5rem 1rem;
}
select option:hover,
select option:focus,
select option:checked {
  color: #1f2937;
}

/* Custom responsive styles */
@media (max-width: 640px) {
  .book-card {
    min-height: 280px;
  }

  .book-card.highlighted {
    animation: highlightPulse 1.5s ease-in-out;
    border-color: #ffc107 !important; /* สีขอบเด่น */
    transform: scale(1.1); /* ขยายขนาด */
    z-index: 10; /* อยู่ชั้นบน */
    transition: all 1s ease;
  }
  .book-image {
    height: 160px;
  }

  .filter-controls {
    gap: 0.5rem;
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    min-width: 100px;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .book-card {
    min-height: 320px;
  }
  .book-card.highlighted {
    animation: highlightPulse 1s ease-in-out;
    border-color: #ffc107 !important; /* สีขอบเด่น */
    transform: scale(1.05); /* ขยายขนาด */
    z-index: 10; /* อยู่ชั้นบน */
    transition: all 0.3s ease;
  }
  .book-image {
    height: 180px;
  }
}

@media (min-width: 769px) {
  .book-card {
    min-height: 350px;
  }
  .book-card.highlighted {
    animation: highlightPulse 1s ease-in-out;
    border-color: #ffc107 !important; /* สีขอบเด่น */
    transform: scale(1.05); /* ขยายขนาด */
    z-index: 10; /* อยู่ชั้นบน */
    transition: all 0.3s ease;
  }
  .book-image {
    height: 200px;
  }
}
</style>

<template>
  <section class="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <!-- Header with responsive layout -->
    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0"
    >
      <h2 class="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
        หนังสือทั้งหมด
      </h2>

      <!-- Filter controls with responsive layout -->
      <div
        class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 filter-controls"
      >
        <!-- Filter by Category -->
        <div class="relative">
          <select
            v-model="selectedCategory"
            @change="filterBooks"
            class="filter-select appearance-none bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold py-2 sm:py-2.5 px-3 sm:px-4 pr-8 sm:pr-10 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all duration-300 transform hover:scale-105 cursor-pointer text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="">ทุกหมวดหมู่</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.category_name }}
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-2 sm:right-3 flex items-center pointer-events-none"
          >
            <svg
              class="w-3 h-3 sm:w-4 sm:h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Sort By -->
        <div class="relative">
          <select
            v-model="sortBy"
            @change="sortBooks"
            class="filter-select appearance-none bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold py-2 sm:py-2.5 px-3 sm:px-4 pr-8 sm:pr-10 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-300 transform hover:scale-105 cursor-pointer text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="title-asc">ชื่อ: A-Z</option>
            <option value="title-desc">ชื่อ: Z-A</option>
            <option value="price-asc">ราคา: ต่ำ-สูง</option>
            <option value="price-desc">ราคา: สูง-ต่ำ</option>
            <option value="stock-asc">สต็อก: น้อย-มาก</option>
            <option value="stock-desc">สต็อก: มาก-น้อย</option>
          </select>
          <div
            class="absolute inset-y-0 right-2 sm:right-3 flex items-center pointer-events-none"
          >
            <svg
              class="w-3 h-3 sm:w-4 sm:h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Responsive book grid -->
    <div
      id="book-list"
      class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6"
    >
      <nuxt-link
        v-for="book in filteredBooks"
        :key="book.id"
        :to="`/book/${book.id}`"
        :id="`book-${book.id}`"
        :class="{ highlighted: highlightedBookId === book.id }"
        class="book-card bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 hover:border-amber-300 group flex flex-col"
      >
        <!-- Book image with responsive sizing -->
        <div class="relative mb-3 flex-shrink-0">
          <img
            :src="book.image"
            :alt="book.title"
            class="book-image w-full object-cover rounded transition-transform duration-300 group-hover:scale-105"
          />
          <div
            v-if="book.stock <= 0"
            class="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-sm sm:text-lg lg:text-xl font-bold rounded"
          >
            หมด
          </div>
        </div>

        <!-- Book details with flexible layout -->
        <div class="flex flex-col flex-grow space-y-2">
          <h3
            class="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2 leading-tight"
          >
            {{ book.title }}
          </h3>

          <p class="text-xs sm:text-sm text-gray-500 flex-shrink-0">
            คงเหลือ: {{ book.stock }} เล่ม
          </p>

          <!-- Price and cart button -->
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-auto pt-2 space-y-2 sm:space-y-0"
          >
            <p
              class="text-red-600 font-bold text-sm sm:text-base lg:text-lg order-2 sm:order-1"
            >
              {{ book.price || 0 }}฿
            </p>

            <button
              @click.prevent="addToCart(book)"
              class="flex items-center justify-center gap-1 cursor-pointer bg-amber-400 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all duration-300 order-1 sm:order-2 w-full sm:w-auto"
              :class="{
                'bg-green-500 hover:bg-green-600': addedBooks[book.id],
              }"
            >
              <img
                src="/images/ตะกร้า.png"
                alt="ตะกร้า"
                class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              />
              <span v-if="!addedBooks[book.id]" class="hidden sm:inline"
                >ใส่ตะกร้า</span
              >
              <span v-if="!addedBooks[book.id]" class="sm:hidden">ใส่</span>
              <span v-else class="flex items-center">
                <span class="hidden sm:inline">เพิ่มแล้ว</span>
                <span class="sm:hidden">✓</span>
                <svg
                  class="w-3 h-3 sm:w-4 sm:h-4 ml-1 hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </nuxt-link>

      <!-- No books found message -->
      <div
        v-if="filteredBooks.length === 0"
        class="col-span-full text-center text-gray-500 py-8 sm:py-12"
      >
        <div class="text-4xl sm:text-6xl mb-4">📚</div>
        <p class="text-base sm:text-lg">ไม่พบหนังสือ</p>
        <p class="text-sm sm:text-base text-gray-400 mt-2">
          ลองเปลี่ยนเงื่อนไขการค้นหาดู
        </p>
      </div>
    </div>
  </section>
</template>
