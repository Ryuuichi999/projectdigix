<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useNuxtApp } from "nuxt/app";
import Swal from "sweetalert2";

const router = useRouter();
const route = useRoute();
const { $event } = useNuxtApp();
const cart = ref([]);
const isLoading = ref(false);

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

onMounted(() => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn || !user.id) {
      router.push("/auth/login");
      return;
    }
    cart.value = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check for step query parameter
    const step = route.query.step;
    if (step && step === "2" && cart.value.length > 0) {
      router.push("/checkout");
    }
  }
});

const totalPrice = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
);

const shippingFee = computed(() => 0); // Free shipping
const vatAmount = computed(
  () => Math.round(totalPrice.value * 0.07 * 100) / 100
);
const grandTotal = computed(
  () => totalPrice.value + shippingFee.value + vatAmount.value
);

const updateQuantity = (item, change) => {
  const newQuantity = item.quantity + change;
  if (newQuantity <= 0) {
    removeFromCart(item.id);
    return;
  }
  if (newQuantity > item.stock) {
    Swal.fire({
      icon: "warning",
      title: "สินค้าคงเหลือไม่เพียงพอ",
      text: `คงเหลือ: ${item.stock} เล่ม`,
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

const removeFromCart = (id) => {
  cart.value = cart.value.filter((item) => item.id !== id);
  if (process.client) {
    localStorage.setItem("cart", JSON.stringify(cart.value));
    $event.emit("cart-updated");
  }
};

const goToCheckout = () => {
  if (cart.value.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "ตะกร้าสินค้าว่าง",
      text: "กรุณาเพิ่มสินค้าในตะกร้าก่อน",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }
  router.push("/checkout");
};

const goToCart = () => {
  router.push("/cart");
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Step Navigation -->
      <div class="flex justify-center mb-8 mt-15">
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <div
              @click="goToCart"
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition-colors',
                'bg-red-500',
              ]"
            >
              1
            </div>
            <span class="ml-2 font-medium">ตะกร้าสินค้า</span>
          </div>

          <div class="w-8 h-0.5 bg-gray-300"></div>

          <div class="flex items-center">
            <div
              @click="goToCheckout"
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition-colors',
                'bg-pink-200 text-pink-500',
              ]"
            >
              2
            </div>
            <span class="ml-2 font-medium">ชำระเงิน</span>
          </div>
        </div>
      </div>

      <!-- Step 1: Cart -->
      <div v-if="cart.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="space-y-6">
              <div
                v-for="item in cart"
                :key="item.id"
                class="flex items-start space-x-4 pb-6 border-b border-gray-200 last:border-b-0"
              >
                <img
                  :src="item.image"
                  alt="Product"
                  class="w-20 h-28 object-cover rounded-lg"
                />
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 mb-2">
                    {{ item.title }}
                  </h3>
                  <div class="flex items-center space-x-3">
                    <button
                      @click="updateQuantity(item, -1)"
                      class="w-8 h-8 cursor-pointer border-1 rounded-full flex items-center justify-center hover:bg-red-300 text-red-500 text-xs font-semibold"
                      :disabled="item.quantity <= 1"
                    >
                      -
                    </button>
                    <span class="font-medium">{{ item.quantity }}</span>
                    <button
                      @click="updateQuantity(item, 1)"
                      class="w-8 h-8 cursor-pointer border-1 rounded-full flex items-center justify-center hover:bg-red-300 text-red-500 text-xs font-semibold"
                      :disabled="item.quantity >= item.stock"
                    >
                      +
                    </button>
                    <button
                      @click="removeFromCart(item.id)"
                      class="ml-4 text-gray-400 cursor-pointer hover:text-red-500"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-red-500">
                    ฿{{ (item.price * item.quantity).toLocaleString() }}
                  </div>
                  <div class="text-sm text-gray-500 line-through">
                    ฿{{ (item.price * item.quantity * 1.2).toLocaleString() }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 class="text-xl font-bold text-gray-900 mb-4">
              ยอดรวมทั้งหมด
            </h2>

            <div class="space-y-3 mb-6">
              <div class="flex justify-between">
                <span class="text-gray-600">ค่าสินค้า:</span>
                <span>฿{{ totalPrice.toLocaleString() }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">ภาษี VAT 7%:</span>
                <span>฿{{ vatAmount.toLocaleString() }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">ส่งฟรีทั่วไทย:</span>
                <span>฿0.00</span>
              </div>
              <hr />
              <div class="flex justify-between text-lg font-bold">
                <span>ยอดรวม</span>
                <span class="text-red-500">฿{{ grandTotal.toLocaleString() }}</span>
              </div>
              <div class="text-sm text-gray-500">
                ยอดรวม (รวมภาษีมูลค่าเพิ่ม)
              </div>
            </div>

            <button
              @click="goToCheckout"
              class="w-full bg-red-500 cursor-pointer text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              ดำเนินการต่อ
            </button>

            <NuxtLink
              to="/"
              class="mt-4 w-full inline-block bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium text-center"
            >
              กลับไปหน้าแรก
            </NuxtLink>

            <div class="mt-4 text-center">
              <div
                class="flex items-center justify-center text-blue-600 text-sm"
              >
                <svg
                  class="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  />
                </svg>
                ส่งฟรีทั่วไทย
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="text-gray-400 text-6xl mb-4">🛒</div>
        <h2 class="text-2xl font-medium text-gray-900 mb-2">
          ตะกร้าของคุณว่างเปล่า
        </h2>
        <p class="text-gray-500 mb-6">เริ่มเลือกซื้อสินค้าได้เลย</p>
        <NuxtLink
          to="/"
          class="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          เลือกซื้อสินค้า
        </NuxtLink>
        <NuxtLink
          to="/"
          class="mt-4 inline-block bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
        >
          กลับไปหน้าแรก
        </NuxtLink>
      </div>
    </div>
  </div>
</template>