<script setup>
import { ref, onMounted } from "vue";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const router = useRouter();
const orders = ref([]);
const userId = ref(null); 

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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn || !user.id) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินเพื่อดูประวัติการสั่งซื้อ",
        confirmButtonColor: "#f59e0b",
      });
      router.push('/auth/login');
      return;
    }
    userId.value = Number(user.id); 
    fetchOrders();
  }
});

const fetchOrders = async () => {
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
  }
};

const confirmReceived = async (orderId) => {
  const result = await Swal.fire({
    title: "ยืนยันการรับสินค้า",
    text: "คุณได้รับสินค้าแล้วใช่หรือไม่? การดำเนินการนี้จะเปลี่ยนสถานะเป็น COMPLETE",
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
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">ประวัติการสั่งซื้อ</h1>
    <div v-if="orders.length === 0" class="text-center text-gray-500">
      ไม่มีประวัติการสั่งซื้อ
    </div>
    <div v-else class="space-y-6">
      <div v-for="order in orders" :key="order.id" class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">คำสั่งซื้อ #{{ order.id }}</h2>
          <span :class="{
            'text-yellow-600': order.status === 'PENDING',
            'text-green-600': order.status === 'COMPLETE'
          }">
            สถานะ: {{ order.status === 'PENDING' ? 'Pedning' : 'Complete' }}
          </span>
        </div>
        <div class="mb-4">
          <p class="text-gray-600">วันที่สั่งซื้อ: {{ new Date(order.created_at).toLocaleDateString('th-TH') }}</p>
          <p class="text-gray-600">ยอดรวม: ฿{{ order.total_price.toFixed(2) }}</p>
          <p class="text-gray-600">ใบเสร็จ: {{ order.receipt?.receipt_number || 'ไม่มี' }}</p>
        </div>
        <div class="space-y-4">
          <div v-for="detail in order.orderDetails" :key="detail.id" class="flex items-center space-x-4">
            <img :src="detail.book.image || 'https://via.placeholder.com/80'" alt="Book cover" class="w-20 h-20 object-cover rounded">
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ detail.book.title }}</p>
              <p class="text-gray-600">จำนวน: {{ detail.quantity }} เล่ม</p>
              <p class="text-gray-600">ราคา: ฿{{ detail.price.toFixed(2) }}</p>
            </div>
          </div>
        </div>
        <button
          v-if="order.status === 'PENDING'"
          @click="confirmReceived(order.id)"
          class="mt-4 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
        >
          ได้รับของแล้ว
        </button>
      </div>
    </div>
  </div>
</template>