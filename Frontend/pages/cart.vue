<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useNuxtApp } from "nuxt/app";
import Swal from "sweetalert2";

const router = useRouter();
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
  }
});

const totalPrice = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
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

const proceedToCheckout = async () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn || !user.id) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินก่อนดำเนินการชำระเงิน",
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

    if (totalPrice.value <= 0) {
      Swal.fire({
        icon: "warning",
        title: "ยอดรวมไม่ถูกต้อง",
        text: "ยอดรวมต้องมากกว่า 0",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    isLoading.value = true;
    let orderId = null;
    try {
      const orderData = {
        user_id: Number(user.id),
        total_price: Number(totalPrice.value),
      };

      console.log("Sending order data:", orderData);
      const orderResponse = await $fetch("http://localhost:3000/orders", {
        method: "POST",
        body: orderData,
      });

      orderId = orderResponse.order.id;
      console.log("Created Order ID:", orderId);

      // สร้างใบเสร็จ (receipt)
      const receiptNumber = `REC-${orderId}-${Date.now()}`;
      await $fetch("http://localhost:3000/receipts", {
        method: "POST",
        body: {
          order_id: orderId,
          receipt_number: receiptNumber,
          total_amount: Number(totalPrice.value),
          issued_at: new Date().toISOString(),
        },
      });

      // สร้าง orderDetails
      const processedCart = cart.value.map((item) => ({
        id: Number(item.id),
        price: Number(item.price),
        quantity: Number(item.quantity),
        stock: Number(item.stock),
      }));

      console.log("Processed cart items:", processedCart);
      for (const item of processedCart) {
        if (!item.id || !item.quantity || !item.price) {
          throw new Error(`Invalid cart item: ${JSON.stringify(item)}`);
        }
        if (item.quantity <= 0 || item.price <= 0) {
          throw new Error(
            `Invalid quantity or price in cart item: ${JSON.stringify(item)}`
          );
        }

        const bookResponse = await $fetch(
          `http://localhost:3000/books/${item.id}`
        );
        if (
          !bookResponse.stock ||
          bookResponse.stock.quantity < item.quantity
        ) {
          throw new Error(
            `Insufficient stock for book ID ${item.id}. Available: ${
              bookResponse.stock?.quantity || 0
            }`
          );
        }

        await $fetch("http://localhost:3000/order-details", {
          method: "POST",
          body: {
            order_id: orderId,
            book_id: item.id,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      Toast.fire({
        icon: "success",
        title: "สั่งซื้อสำเร็จ",
      });
      cart.value = [];
      localStorage.setItem("cart", JSON.stringify(cart.value));
      $event.emit("cart-updated");
      router.push("/");
    } catch (error) {
      console.error("Error during checkout:", error);
      if (orderId) {
        try {
          await $fetch(`http://localhost:3000/orders/${orderId}`, {
            method: "DELETE",
          });
          console.log(`Deleted incomplete order: ${orderId}`);
        } catch (deleteError) {
          console.error("Error deleting incomplete order:", deleteError);
        }
      }
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: error.message || "เกิดข้อผิดพลาดในการสั่งซื้อ",
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mt-15 text-amber-600">
        ตะกร้าสินค้าของคุณ
      </h1>

      <div v-if="cart.length > 0" class="bg-white rounded-lg shadow p-6 mt-5">
        <!-- รายการสินค้า -->
        <div class="space-y-4">
          <div
            v-for="item in cart"
            :key="item.id"
            class="flex items-center justify-between border-b pb-4 "
          >
            <div class="flex items-center space-x-4">
              <img
                :src="item.image"
                alt="Book"
                class="w-16 h-24 object-cover rounded"
              />
              <div>
                <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                <p class="text-gray-600">
                  {{ item.price }} ฿ x {{ item.quantity }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
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
            :disabled="isLoading"
            class="mt-4 w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-all font-semibold cursor-pointer shadow"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
          >
            <span v-if="isLoading">กำลังดำเนินการ...</span>
            <span v-else>ดำเนินการชำระเงิน</span>
          </button>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6 text-center mt-5">
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
