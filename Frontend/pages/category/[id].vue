<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNuxtApp } from "nuxt/app";
import Swal from "sweetalert2";

const route = useRoute();
const router = useRouter();
const { $event } = useNuxtApp();

// กำหนดค่า Toast
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

// ดึง category id จาก URL
const categoryId = parseInt(route.params.id);

// สถานะสำหรับเก็บข้อมูล
const categoryName = ref("");
const allBooks = ref([]);
const filteredBooks = computed(() =>
  allBooks.value.filter((book) =>
    book.categories?.some((cat) => cat.category_id === categoryId)
  )
);
const addedBooks = ref({});

// ดึงข้อมูลหนังสือจาก API /books
const fetchBooks = async () => {
  try {
    if (isNaN(categoryId)) {
      categoryName.value = "ไม่ทราบหมวดหมู่";
      allBooks.value = [];
      return;
    }

    const response = await $fetch("http://localhost:3000/books");
    console.log("API Response from /books:", response); 
    if (!response || !Array.isArray(response)) {
      categoryName.value = "ไม่ทราบหมวดหมู่";
      allBooks.value = [];
      return;
    }

    categoryName.value =
      response
        .find((book) =>
          book.categories?.some((cat) => cat.category_id === categoryId)
        )
        ?.categories?.find((cat) => cat.category_id === categoryId)?.category
        ?.category_name || "ไม่ทราบหมวดหมู่";

    allBooks.value = response.map((book) => ({
      id: book.id,
      title: book.title,
      price: book.price,
      image: book.image || "/images/default-book.jpg",
      stock: book.stock?.quantity ?? 0,
      categories: book.categories || [],
    }));
  } catch (error) {
    console.error("Error fetching books:", error);
    categoryName.value = "ไม่ทราบหมวดหมู่";
    allBooks.value = [];
  }
};

// เพิ่มสินค้าลงตะกร้า
const addToCart = (book) => {
  if (process.client) {
    console.log("Adding to cart - Book:", book);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินก่อนเพิ่มสินค้าลงตะกร้า",
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "ไปที่หน้าล็อกอิน",
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
      console.log("Stock value:", book.stock);
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

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchBooks();
});
</script>

<template>
  <div class="bg-amber-50 min-h-screen">
    <section class="py-8 max-w-5xl mx-auto">
      <NuxtLink to="/" class="text-sm text-blue-500 hover:underline mb-4 block">
        ← ย้อนกลับ
      </NuxtLink>
      <h2 class="text-xl font-semibold mb-4">หมวดหมู่: {{ categoryName }}</h2>
      <div
        v-if="filteredBooks.length"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <nuxt-link
          v-for="book in filteredBooks"
          :key="book.id"
          :to="`/book/${book.id}`"
          class="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 hover:border-amber-300 group"
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
          <p class="text-sm text-red-400 font-bold">คงเหลือ: {{ book.stock }} เล่ม</p>

          <div class="flex items-center justify-between mt-2">
            <p class="text-red-600 font-bold text-sm">{{ book.price || 0 }}฿</p>
            <button
              @click.prevent="addToCart(book)"
              class="flex items-center cursor-pointer gap-1 bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold py-1 px-2 rounded transition"
              :class="{
                'bg-green-500 hover:bg-green-600': addedBooks[book.id],
              }"
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
      </div>
      <p v-else class="text-center text-gray-500 mt-12">
        ไม่พบหนังสือในหมวดหมู่ {{ categoryName }}
      </p>
    </section>
  </div>
</template>

