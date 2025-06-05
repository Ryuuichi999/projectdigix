<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  show: Boolean,
  order: Object,
  statusOptions: Array,
});
const emit = defineEmits(["close", "update-status"]);

const newStatus = ref(props.order?.status || "");

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

const submitStatusChange = async () => {
  if (!newStatus.value) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเลือกสถานะ",
      text: "กรุณาเลือกสถานะใหม่สำหรับคำสั่งซื้อ",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  const result = await Swal.fire({
    title: "ยืนยันการเปลี่ยนแปลงสถานะ",
    text: `คุณต้องการเปลี่ยนสถานะคำสั่งซื้อ ID ${props.order.id} เป็น ${newStatus.value} หรือไม่?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
  });

  if (result.isConfirmed) {
    try {
      const response = await $fetch(
        `http://localhost:3000/orders/${props.order.id}`,
        {
          method: "PUT",
          body: { status: newStatus.value },
        }
      );
      emit("update-status", {
        id: props.order.id,
        status: response.order.status,
      });
      Toast.fire({ icon: "success", title: "เปลี่ยนแปลงสถานะสำเร็จ" });
      emit("close");
    } catch (error) {
      console.error("Error updating order status:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "เกิดข้อผิดพลาดในการเปลี่ยนแปลงสถานะ: " +
          (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};
</script>

<template>
  <div
    v-if="props.show"
    class="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all"
    >
      <h3 class="text-2xl font-bold mb-4">
        เปลี่ยนสถานะคำสั่งซื้อ: ID {{ props.order?.id }}
      </h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">สถานะใหม่</label>
        <select
          v-model="newStatus"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option
            v-for="status in props.statusOptions"
            :key="status"
            :value="status"
          >
            {{ status }}
          </option>
        </select>
      </div>
      <button
        @click="submitStatusChange"
        class="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600"
      >
        บันทึกการเปลี่ยนแปลง
      </button>
      <button
        @click="emit('close')"
        class="w-full mt-2 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
      >
        ยกเลิก
      </button>
    </div>
  </div>
</template>
