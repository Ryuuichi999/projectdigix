<template>
  <section class="py-6 max-w-5xl mx-auto">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-800">หนังสือทั้งหมด</h2>
      <div class="flex space-x-4">
        <!-- Filter by Category -->
        <div class="relative">
          <select
            v-model="selectedCategory"
            @change="filterBooks"
            class="appearance-none bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-semibold py-2.5 px-4 pr-8 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all duration-300 transform hover:scale-105 cursor-pointer"
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
            class="absolute inset-y-0 right-3 flex items-center pointer-events-none"
          >
            <svg
              class="w-4 h-4 text-white"
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
            class="appearance-none bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold py-2.5 px-4 pr-8 rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-300 transform hover:scale-105 cursor-pointer"
          >
            <option value="title-asc">ชื่อ: A-Z</option>
            <option value="title-desc">ชื่อ: Z-A</option>
            <option value="price-asc">ราคา: ต่ำ-สูง</option>
            <option value="price-desc">ราคา: สูง-ต่ำ</option>
            <option value="stock-asc">สต็อก: น้อย-มาก</option>
            <option value="stock-desc">สต็อก: มาก-น้อย</option>
          </select>
          <div
            class="absolute inset-y-0 right-3 flex items-center pointer-events-none"
          >
            <svg
              class="w-4 h-4 text-white"
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
    <div
      id="book-list"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <nuxt-link
        v-for="book in filteredBooks"
        :key="book.id"
        :to="`/book/${book.id}`"
        :id="`book-${book.id}`"
        class="bg-white p-5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 hover:border-amber-300 group"
      >
        <div class="relative">
          <img
            :src="book.image"
            alt="Book"
            class="w-full aspect-[3/4] object-cover rounded"
          />
          <div
            v-if="book.stock <= 0"
            class="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-xl font-bold rounded"
          >
            หมด
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-2">{{ book.title }}</h3>
        <p class="text-sm text-gray-500">คงเหลือ: {{ book.stock }} เล่ม</p>
        <div class="flex items-center justify-between mt-2">
          <p class="text-red-600 font-bold text-sm">{{ book.price || 0 }}฿</p>
          <button
            @click.prevent="addToCart(book)"
            class="flex items-center gap-1 cursor-pointer bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold py-1 px-2 rounded transition"
            :class="{ 'bg-green-500 hover:bg-green-600': addedBooks[book.id] }"
          >
            <img src="/images/ตะกร้า.png" alt="ตะกร้า" class="w-6 h-6" />
            <span v-if="!addedBooks[book.id]">ใส่ตะกร้า</span>
            <span v-else class="flex items-center">
              เพิ่มแล้ว
              <svg
                class="w-4 h-4 ml-1"
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
      </nuxt-link>
      <div
        v-if="filteredBooks.length === 0"
        class="col-span-full text-center text-gray-500"
      >
        ไม่พบหนังสือ
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
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

const fetchBooks = async () => {
  try {
    const response = await $fetch("http://localhost:3000/books");
    books.value = response.map((book) => ({
      id: book.id,
      title: book.title,
      price: book.price,
      image: book.image || "/images/default-book.jpg",
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
});

const addToCart = (book) => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินก่อนเพิ่มสินค้าลงตะกร้า",
        confirmButtonColor: "#f59e0b",
      });
      router.push("/auth/login");
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
</style>
