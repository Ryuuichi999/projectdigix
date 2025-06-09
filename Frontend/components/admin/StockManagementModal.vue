<script setup>
import { ref, watch } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  show: Boolean,
  book: Object,
});
const emit = defineEmits(["close", "update-stock"]);

const stockChange = ref(0);
const stockReason = ref("");
const stockHistory = ref([]);

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

watch(
  () => props.show,
  async (newShow) => {
    if (newShow && props.book) {
      stockChange.value = 0;
      stockReason.value = "";
      try {
        const historyResponse = await $fetch(
          `http://localhost:3000/stocks/${props.book.stock_id}/history`
        );
        stockHistory.value = historyResponse.map((entry) => ({
          id: entry.id,
          change: entry.change,
          reason: entry.reason,
          created_at: new Date(entry.created_at).toLocaleString(),
        }));
      } catch (error) {
        console.error("Error fetching stock history:", error);
        stockHistory.value = [];
      }
    }
  }
);

const submitStockChange = async () => {
  if (!stockChange.value || !stockReason.value.trim()) {
    Swal.fire({
      icon: "warning",
      title: "กรุณากรอกข้อมูล",
      text: "กรุณาระบุจำนวนและเหตุผลในการเปลี่ยนแปลงสต็อก",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  if (stockChange.value === 0) {
    Swal.fire({
      icon: "warning",
      title: "จำนวนไม่ถูกต้อง",
      text: "จำนวนที่เปลี่ยนแปลงต้องไม่เป็นศูนย์",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  const result = await Swal.fire({
    title: "ยืนยันการเปลี่ยนแปลงสต็อก",
    text: `คุณต้องการ${stockChange.value > 0 ? "เพิ่ม" : "ลด"}สต็อก ${Math.abs(
      stockChange.value
    )} เล่มสำหรับหนังสือ "${props.book.title}" หรือไม่?`,
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
        `http://localhost:3000/stocks/${props.book.stock_id}`,
        {
          method: "PUT",
          body: {
            change: Number(stockChange.value),
            reason: stockReason.value,
          },
        }
      );

      emit("update-stock", {
        id: props.book.id,
        stock: response.stock.quantity,
        history: {
          id: response.stockHistory?.id || Date.now(),
          change: stockChange.value,
          reason: stockReason.value,
          created_at: new Date().toLocaleString(),
        },
      });

      Toast.fire({
        icon: "success",
        title: "เปลี่ยนแปลงสต็อกสำเร็จ",
      });

      stockChange.value = 0;
      stockReason.value = "";
    } catch (error) {
      console.error("Error updating stock:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          error.data?.message ||
          "เกิดข้อผิดพลาดในการเปลี่ยนแปลงสต็อก: " +
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
    class="fixed inset-0 pt-10 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-in-out"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900">
          จัดการสต็อก: {{ props.book?.title }}
        </h3>
        <button
          @click="emit('close')"
          class="text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700"
          >จำนวนที่เปลี่ยนแปลง</label
        >
        <input
          v-model.number="stockChange"
          type="number"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="ระบุจำนวน"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700">เหตุผล</label>
        <input
          v-model="stockReason"
          type="text"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="ระบุเหตุผล"
        />
      </div>
      <button
        @click="submitStockChange"
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
      <div class="mt-6">
        <h4 class="text-lg font-semibold mb-2">ประวัติการเปลี่ยนแปลงสต็อก</h4>
        <div class="overflow-x-auto max-h-96">
          <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr class="bg-amber-100 text-gray-700">
                <th class="px-6 py-3 text-left font-semibold">วันที่</th>
                <th class="px-6 py-3 text-left font-semibold">จำนวน</th>
                <th class="px-6 py-3 text-left font-semibold">เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="history in stockHistory"
                :key="history.id"
                class="border-b hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-gray-800">
                  {{ history.created_at }}
                </td>
                <td class="px-6 py-4 text-gray-800">
                  {{ history.change > 0 ? "+" : "" }}{{ history.change }}
                </td>
                <td class="px-6 py-4 text-gray-800">{{ history.reason }}</td>
              </tr>
              <tr v-if="stockHistory.length === 0" class="border-b">
                <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                  ไม่มีประวัติ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
