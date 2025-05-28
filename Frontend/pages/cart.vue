<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-amber-600">ตะกร้าสินค้าของคุณ</h1>

      <div v-if="cart.length > 0" class="bg-white rounded-lg shadow p-6">
        <!-- รายการสินค้า -->
        <div class="space-y-4">
          <div
            v-for="item in cart"
            :key="item.id"
            class="flex items-center justify-between border-b pb-4"
          >
            <div class="flex items-center space-x-4">
              <img :src="item.image" alt="Book" class="w-16 h-24 object-cover rounded" />
              <div>
                <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                <p class="text-gray-600">{{ item.price }} ฿ x {{ item.quantity }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2 ">
              <button
                @click="updateQuantity(item, -1)"
                class="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 cursor-pointer"
                :disabled="item.quantity <= 1"
              >
                -
              </button>
              <span>{{ item.quantity }}</span>
              <button
                @click="updateQuantity(item, 1)"
                class="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 cursor-pointer"
                :disabled="item.quantity >= item.stock"
              >
                +
              </button>
              <button
                @click="removeFromCart(item.id)"
                class="text-red-500 hover:underline cursor-pointer"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>

        <!-- สรุปยอด -->
        <div class="mt-6 border-t pt-4">
          <div class="flex justify-between items-center">
            <p class="text-lg font-semibold">ยอดรวม:</p>
            <p class="text-xl font-bold text-red-600">{{ totalPrice }} ฿</p>
          </div>
          <button
            @click="proceedToCheckout"
            class="mt-4 w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-all font-semibold cursor-pointer shadow"
          >
            ดำเนินการชำระเงิน
          </button>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6 text-center">
        <p class="text-gray-500">ตะกร้าของคุณว่างเปล่า</p>
        <NuxtLink
          to="/"
          class="mt-4 inline-block cursor-pointer bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
        >
          กลับไปเลือกซื้อสินค้า
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const cart = ref([]);

onMounted(() => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn) {
      router.push('/auth/login');
      return;
    }
    cart.value = JSON.parse(localStorage.getItem('cart') || '[]');
  }
});

// คำนวณยอดรวม
const totalPrice = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
);

// อัปเดตจำนวนสินค้า
const updateQuantity = (item, change) => {
  const newQuantity = item.quantity + change;
  if (newQuantity <= 0) {
    removeFromCart(item.id);
    return;
  }
  if (newQuantity > item.stock) {
    alert(`สินค้าคงเหลือไม่เพียงพอ (คงเหลือ: ${item.stock} เล่ม)`);
    return;
  }
  item.quantity = newQuantity;
  if (process.client) {
    localStorage.setItem('cart', JSON.stringify(cart.value));
  }
};

// ลบสินค้าออกจากตะกร้า
const removeFromCart = (id) => {
  cart.value = cart.value.filter(item => item.id !== id);
  if (process.client) {
    localStorage.setItem('cart', JSON.stringify(cart.value));
  }
};

// ดำเนินการชำระเงิน
const proceedToCheckout = () => {
  alert('ดำเนินการชำระเงินเรียบร้อยแล้ว!');
  cart.value = [];
  if (process.client) {
    localStorage.setItem('cart', JSON.stringify(cart.value));
  }
  router.push('/');
};
</script>