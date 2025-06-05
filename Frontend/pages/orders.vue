<template>
  <div class="min-h-screen bg-amber-50 p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-amber-600">ประวัติการสั่งซื้อ</h1>

      <div v-if="receipts.length > 0" class="space-y-6">
        <div
          v-for="receipt in receipts"
          :key="receipt.id"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">
              คำสั่งซื้อ #{{ receipt.orderId }} - {{ receipt.status }}
            </h2>
            <span class="text-gray-500 text-sm">
              {{ new Date(receipt.createdAt).toLocaleString() }}
            </span>
          </div>
          <div class="space-y-4">
            <div
              v-for="detail in receipt.order.orderDetails"
              :key="detail.id"
              class="flex items-center justify-between border-b pb-2"
            >
              <div class="flex items-center space-x-4">
                <img
                  :src="detail.book.image"
                  alt="Book"
                  class="w-16 h-24 object-cover rounded"
                />
                <div>
                  <h3 class="text-lg font-semibold">{{ detail.book.title }}</h3>
                  <p class="text-gray-600">{{ detail.price }} ฿ x {{ detail.quantity }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-between items-center">
            <p class="text-lg font-semibold">ยอดรวม: {{ receipt.totalPrice }} ฿</p>
            <button
              v-if="receipt.status === 'PENDING'"
              @click="confirmReceipt(receipt.orderId)"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition cursor-pointer"
            >
              ได้รับของแล้ว
            </button>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-lg shadow p-6 text-center">
        <p class="text-gray-500">ไม่มีประวัติการสั่งซื้อ</p>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();
const receipts = ref([]);

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

onMounted(async () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await $fetch(`http://localhost:3000/receipts/user/${user.id}`);
      receipts.value = response;
    } catch (error) {
      console.error('Error fetching receipts:', error);
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'ไม่สามารถดึงประวัติการสั่งซื้อได้',
        confirmButtonColor: '#f59e0b',
      });
    }
  }
});

const confirmReceipt = async (orderId) => {
  const result = await Swal.fire({
    title: 'ยืนยันการรับสินค้า',
    text: 'คุณได้รับสินค้าจากคำสั่งซื้อนี้แล้วใช่หรือไม่?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, ได้รับแล้ว',
    cancelButtonText: 'ยกเลิก',
  });

  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/orders/${orderId}`, {
        method: 'PUT',
        body: { status: 'COMPLETED' },
      });

      const receipt = receipts.value.find((r) => r.orderId === orderId);
      if (receipt) {
        receipt.status = 'COMPLETED';
      }

      Toast.fire({
        icon: 'success',
        title: 'ยืนยันการรับสินค้าสำเร็จ',
      });
    } catch (error) {
      console.error('Error confirming receipt:', error);
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'ไม่สามารถยืนยันการรับสินค้าได้',
        confirmButtonColor: '#f59e0b',
      });
    }
  }
};
</script>