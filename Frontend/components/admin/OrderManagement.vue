<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  orders: Array,
  searchQuery: String,
  selectedItem: Object,
});
const emit = defineEmits([
  "delete-order",
  "view-order-details",
  "manage-order-status",
  "update-selected-item",
]);

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

const deleteOrder = async (id) => {
  const result = await Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "การลบคำสั่งซื้อจะไม่สามารถคืนได้!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
  });
  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/orders/${id}`, { method: "DELETE" });
      emit("delete-order", id);
      Toast.fire({
        icon: "success",
        title: "ลบคำสั่งซื้อสำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "เกิดข้อผิดพลาดในการลบคำสั่งซื้อ: " +
          (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};
</script>

<template>
  <div class="mb-12">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">จัดการคำสั่งซื้อ</h2>
    </div>
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="bg-amber-200">
            <th class="px-4 py-2 text-left">ID</th>
            <th class="px-4 py-2 text-left">ชื่อผู้ใช้</th>
            <th class="px-4 py-2 text-left">ราคารวม</th>
            <th class="px-4 py-2 text-left">สถานะ</th>
            <th class="px-4 py-2 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in props.orders" :key="order.id" class="border-b">
            <td class="px-4 py-2">{{ order.id }}</td>
            <td class="px-4 py-2">{{ order.user_name }}</td>
            <td class="px-4 py-2">{{ order.total_price }} ฿</td>
            <td class="px-4 py-2">{{ order.status }}</td>
            <td class="px-4 py-2 text-right space-x-2">
              <button
                @click="emit('manage-order-status', order)"
                class="text-yellow-500 hover:underline cursor-pointer"
              >
                เปลี่ยนสถานะ
              </button>
              <button
                @click="emit('view-order-details', order)"
                class="text-blue-500 hover:underline cursor-pointer"
              >
                ดูรายละเอียด
              </button>
              <button
                @click="deleteOrder(order.id)"
                class="text-red-500 hover:underline cursor-pointer"
              >
                ลบ
              </button>
            </td>
          </tr>
          <tr v-if="props.orders.length === 0" class="border-b">
            <td colspan="5" class="px-4 py-2 text-center text-gray-500">
              ไม่มีข้อมูล
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
