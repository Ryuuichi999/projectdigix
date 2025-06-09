<script setup>
import { ref, onMounted } from "vue";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const router = useRouter();
const orders = ref([]);
const userId = ref(null);
const userName = ref(null); 
const isLoading = ref(true);

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
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินเพื่อดูประวัติการสั่งซื้อ",
        confirmButtonColor: "#f59e0b",
      });
      router.push("/auth/login");
      return;
    }
    userId.value = Number(user.id);
    userName.value = user.name || user.username || "ผู้ใช้"; 
    fetchOrders();
  }
});

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch(`http://localhost:3000/orders/user/${userId.value}`);
    orders.value = response;
  } catch (error) {
    console.error("Error fetching orders:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: "ไม่สามารถดึงประวัติการสั่งซื้อได้",
      confirmButtonColor: "#f59e0b",
    });
  } finally {
    isLoading.value = false;
  }
};

const confirmReceived = async (orderId) => {
  const result = await Swal.fire({
    title: "ยืนยันการรับสินค้า",
    text: "คุณได้รับสินค้าแล้วใช่หรือไม่? การดำเนินการนี้จะเปลี่ยนสถานะเป็น สำเร็จ",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ได้รับของแล้ว",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/orders/${orderId}`, {
        method: "PUT",
        body: { status: "COMPLETE" },
      });
      Toast.fire({
        icon: "success",
        title: "อัปเดตสถานะสำเร็จ",
      });
      await fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: error.data?.message || "ไม่สามารถอัปเดตสถานะได้",
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-22">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">ประวัติการสั่งซื้อ</h1>
        <p class="text-sm text-gray-500 mt-1 font-bold">ของคุณ {{ userName || 'กำลังโหลด...' }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-10 w-10 border-t-4 border-amber-500"></div>
      </div>

      <!-- No Orders -->
      <div v-else-if="orders.length === 0" class="bg-white rounded-xl shadow-md p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
        <p class="text-gray-500 text-base font-medium">ไม่มีประวัติการสั่งซื้อ</p>
        <NuxtLink to="/" class="mt-3 inline-block bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 transition-all text-sm">
          ไปช้อปปิ้งเลย!
        </NuxtLink>
      </div>

      <!-- Orders List -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300"
        >
          <!-- Order Header -->
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-800">คำสั่งซื้อ #{{ order.id }}</h2>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-yellow-100 text-yellow-800': order.status === 'PENDING',
                'bg-green-100 text-green-800': order.status === 'COMPLETE',
              }"
            >
              <svg
                v-if="order.status === 'PENDING'"
                class="h-3 w-3 mr-1 animate-spin text-yellow-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <svg
                v-else
                class="h-3 w-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {{ order.status === 'PENDING' ? 'รอรับสินค้า' : 'สำเร็จ' }}
            </span>
          </div>

          <!-- Order Details -->
          <div class="space-y-3 text-sm text-gray-600">
            <p>
              <span class="font-medium">วันที่:</span>
              {{ new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </p>
            <p>
              <span class="font-medium">ยอดรวม:</span>
              ฿{{ order.total_price.toFixed(2) }}
            </p>
            <p>
              <span class="font-medium">ใบเสร็จ:</span>
              {{ order.receipt?.receipt_number || 'ไม่มี' }}
            </p>
          </div>

          <!-- Order Items -->
          <div class="mt-4 space-y-3 max-h-40 overflow-y-auto pr-2">
            <div
              v-for="detail in order.orderDetails"
              :key="detail.id"
              class="flex items-center space-x-3"
            >
              <img
                :src="detail.book.image || 'https://via.placeholder.com/80'"
                alt="Book cover"
                class="w-10 h-14 object-cover rounded-md"
              />
              <div class="flex-1">
                <p class="text-gray-800 font-medium text-xs truncate">{{ detail.book.title }}</p>
                <p class="text-gray-500 text-xs">จำนวน: {{ detail.quantity }} เล่ม</p>
                <p class="text-gray-500 text-xs">฿{{ detail.price.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <button
            v-if="order.status === 'PENDING'"
            @click="confirmReceived(order.id)"
            class="mt-4 w-full cursor-pointer bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-amber-600 transition-all flex items-center justify-center space-x-1"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>ได้รับของแล้ว</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>