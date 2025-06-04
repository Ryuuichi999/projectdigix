<template>
  <section class="py-2 max-w-5xl mx-auto">
    <h2 class="text-xl font-semibold mb-4">หนังสือทั้งหมด</h2>
    <div
      id="book-list"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <nuxt-link
        v-for="book in books"
        :key="book.id"
        :to="`/book/${book.id}`"
        :id="book.id ? `book-${book.id}` : `book-unknown`"
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
        <p class="text-sm ext-gray-500">คงเหลือ: {{ book.stock }} เล่ม</p>

        <div class="flex items-center justify-between mt-2">
          <p class="text-red-600 font-bold text-sm">{{ book.price || 0 }}฿</p>

          <!-- ปุ่มใส่ตะกร้า -->
          <button
            @click.prevent="addToCart(book)"
            class="flex items-center gap-1 cursor-pointer bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold py-1 px-2 rounded transition relative"
            :class="{ 'bg-green-500 hover:bg-green-600': addedBooks[book.id] }"
          >
            <!-- รูปไอคอนตะกร้า -->
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
        v-if="books.length === 0"
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

// สถานะสำหรับเก็บว่าสินค้าถูกเพิ่มแล้วหรือไม่
const addedBooks = ref({});

// สถานะสำหรับเก็บรายการหนังสือ
const books = ref([]);

// ดึงข้อมูลหนังสือจาก API
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
    }));
  } catch (error) {
    console.error("Error fetching books:", error);
    books.value = [];
  }
};

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchBooks();
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
      // ตรวจสอบสต็อกก่อนเพิ่มจำนวน
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
      // ตรวจสอบว่ามีสต็อกหรือไม่
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

    // อัปเดตสถานะว่าเพิ่มแล้ว
    addedBooks.value[book.id] = true;
    setTimeout(() => {
      addedBooks.value[book.id] = false;
    }, 2000);

    // ส่ง event เพื่ออัปเดตตะกร้าใน Navbar
    $event.emit("cart-updated");

    Toast.fire({
      icon: "success",
      title: "เพิ่มสินค้าในตะกร้าสำเร็จ",
    });
  }
};
</script>
