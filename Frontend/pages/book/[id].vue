<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNuxtApp } from "nuxt/app";
import Swal from "sweetalert2";

const route = useRoute();
const router = useRouter();
const { $event } = useNuxtApp();
const bookId = parseInt(route.params.id);

// สถานะสำหรับเก็บว่าสินค้าถูกเพิ่มแล้วหรือไม่
const isAdded = ref(false);
const isLoading = ref(true);
const showExtraInfo = ref(false);
const quantity = ref(1); // จำนวนที่ต้องการเพิ่ม

// สถานะสำหรับเก็บข้อมูลหนังสือ
const book = ref(null);

// ตั้งค่า SweetAlert Toast
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

// ฟังก์ชันสำหรับฟอร์แมตวันที่
const formatDate = (dateString) => {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// ดึงข้อมูลหนังสือจาก API
const fetchBook = async () => {
  try {
    const response = await $fetch(`http://localhost:3000/books/${bookId}`);
    if (!response) {
      book.value = null;
      return;
    }
    // ปรับโครงสร้างข้อมูลให้สอดคล้องกับ frontend
    book.value = {
      ...response,
      category: response.categories?.[0]?.category?.category_name || "ไม่ระบุ",
      stock: response.stock?.quantity ?? 0,
      publisher: response.publisher || "ไม่ระบุ",
    };
  } catch (error) {
    console.error("Error fetching book:", error);
    book.value = null;
  } finally {
    isLoading.value = false;
  }
};

// คำนวณสีพื้นหลังตามหมวดหมู่
const backgroundStyle = computed(() => {
  const category = book.value?.category.toLowerCase() || "default";
  const bgColors = {
    fiction: "bg-gradient-to-r from-blue-100 to-indigo-100",
    nonfiction: "bg-gradient-to-r from-green-100 to-emerald-100",
    fantasy: "bg-gradient-to-r from-purple-100 to-pink-100",
    default: "bg-amber-50",
  };
  return bgColors[category] || bgColors.default;
});

// จำกัดจำนวนไม่ให้เกินสต็อก
watch(quantity, (newQty) => {
  if (book.value && newQty > book.value.stock) {
    quantity.value = book.value.stock;
  } else if (newQty < 1) {
    quantity.value = 1;
  }
});

// เรียก API เมื่อ component ถูก mount
onMounted(() => {
  fetchBook();
});

// เพิ่มหรือลดจำนวน
const increaseQuantity = () => {
  if (book.value && quantity.value < book.value.stock) {
    quantity.value++;
  }
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const addToCart = () => {
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

    if (!book.value) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่พบข้อมูลหนังสือ",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (book.value.stock <= 0) {
      Swal.fire({
        icon: "warning",
        title: "สินค้าหมด",
        text: "ขออภัย สินค้าหมดสต็อก",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.id === book.value.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity.value;
      if (newQuantity > book.value.stock) {
        Swal.fire({
          icon: "warning",
          title: "สินค้าคงเหลือไม่เพียงพอ",
          text: `คงเหลือ: ${book.value.stock} เล่ม`,
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
      existingItem.quantity = newQuantity;
    } else {
      if (quantity.value > book.value.stock) {
        Swal.fire({
          icon: "warning",
          title: "สินค้าคงเหลือไม่เพียงพอ",
          text: `คงเหลือ: ${book.value.stock} เล่ม`,
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
      cart.push({ ...book.value, quantity: quantity.value });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    isAdded.value = true;
    setTimeout(() => {
      isAdded.value = false;
    }, 500);
    Toast.fire({
      icon: "success",
      title: `เพิ่ม ${quantity.value} เล่มลงตะกร้าสำเร็จ`,
    });
    $event.emit("cart-updated");
  }
};

const toggleExtraInfo = () => {
  showExtraInfo.value = !showExtraInfo.value;
};
</script>

<style scoped>
/* Animation for fade-in */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pulse {
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.extra-info {
  transition: max-height 0.3s ease-in-out;
  max-height: 0;
  overflow: hidden;
}

.extra-info.active {
  max-height: 200px;
}

/* Style for quantity controls */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.quantity-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.quantity-btn:hover {
  background-color: #d97706;
}

.quantity-input {
  width: 60px;
  padding: 5px;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1rem;
}

.add-to-cart-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
  font-weight: 600;
}

.add-to-cart-btn:hover {
  background-color: #d97706;
}

.add-to-cart-btn.added {
  background-color: #10b981;
}

.add-to-cart-btn.added:hover {
  background-color: #059669;
}
</style>

<template>
  <div :class="backgroundStyle" class="min-h-screen py-15">
    <section class="max-w-6xl mx-auto p-6 py-10">
      <NuxtLink to="/" class="text-sm text-blue-500 hover:underline mb-4 block">
        ← ย้อนกลับ
      </NuxtLink>
      <Transition name="fade">
        <div v-if="book && !isLoading" class="bg-white shadow-xl rounded-xl overflow-hidden flex flex-col md:flex-row">
          <!-- รูปภาพฝั่งซ้าย -->
          <div class="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
            <img
              :src="book.image"
              alt="book image"
              class="w-full max-w-full md:max-w-md h-auto max-h-96 rounded-lg shadow-lg object-contain"
            />
          </div>

          <!-- รายละเอียดฝั่งขวา -->
          <div class="md:w-1/2 p-6 flex flex-col justify-between">
            <div class="mb-4">
              <h1 class="text-3xl font-bold mb-2 inline-flex items-center">
                {{ book.title }}
                <span class="text-sm text-gray-500 ml-5 mt-2"
                  >(คงเหลือ: {{ book.stock }} เล่ม)</span
                >
              </h1>
              <br />
              <span
                class="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full mb-2 inline-block"
                >{{ book.category }}</span
              >
              <br />
              <br />
              <p class="text-gray-700 mb-6">{{ book.description }}</p>
            </div>

            <div class="flex flex-col md:flex-row md:space-x-4">
              <div class="md:w-1/2">
                <p class="text-gray-600 mb-2">✍️ ผู้แต่ง: {{ book.author }}</p>
                <p class="text-gray-600 mb-2">📚 ISBN: {{ book.isbn }}</p>
              </div>
              <div class="md:w-1/2">
                <p class="text-gray-600 mb-2">
                  🏢 สำนักพิมพ์: {{ book.publisher }}
                </p>
                <p class="text-gray-600 mb-2">
                  📅 วันที่ตีพิมพ์: {{ formatDate(book.published) }}
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-6 mt-6">
              <p class="text-2xl font-bold text-red-600">{{ book.price }} ฿</p>
              <div class="quantity-controls flex items-center gap-2">
                <button @click="decreaseQuantity" class="quantity-btn">-</button>
                <input
                  v-model.number="quantity"
                  type="number"
                  class="quantity-input"
                  min="1"
                  :max="book.stock"
                  @change="quantity = Math.min(Math.max(1, quantity), book.stock)"
                />
                <button @click="increaseQuantity" class="quantity-btn">+</button>
                <button
                  @click="addToCart"
                  :class="['add-to-cart-btn', { added: isAdded }]"
                  class="ml-2"
                >
                  <span v-if="!isAdded">🛒 ใส่ตะกร้า</span>
                  <span v-if="isAdded" class="flex items-center">
                    🛒 เพิ่มแล้ว
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
            </div>
          </div>
        </div>
      </Transition>

      <div v-if="isLoading" class="text-center text-gray-500 mt-12">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
      <div v-if="!isLoading && !book" class="text-center text-gray-500 mt-12">
        <p>ไม่พบข้อมูลหนังสือที่คุณต้องการ</p>
      </div>
    </section>
  </div>
</template>