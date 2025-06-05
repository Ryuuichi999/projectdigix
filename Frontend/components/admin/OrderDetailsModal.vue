<script setup>
const props = defineProps({
  show: Boolean,
  orderDetails: Array,
});
const emit = defineEmits(["close"]);
</script>

<template>
  <div
    v-if="props.show"
    class="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-in-out"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900">รายละเอียดคำสั่งซื้อ</h3>
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
      <div class="overflow-x-auto max-h-96">
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr class="bg-amber-100 text-gray-700">
              <th class="px-6 py-3 text-left font-semibold">ID</th>
              <th class="px-6 py-3 text-left font-semibold">ชื่อหนังสือ</th>
              <th class="px-6 py-3 text-left font-semibold">จำนวน</th>
              <th class="px-6 py-3 text-left font-semibold">ราคา</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="detail in props.orderDetails"
              :key="detail.id"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 text-gray-800">{{ detail.id }}</td>
              <td class="px-6 py-4 text-gray-800">{{ detail.book_title }}</td>
              <td class="px-6 py-4 text-gray-800">{{ detail.quantity }}</td>
              <td class="px-6 py-4 text-gray-800">{{ detail.price }} ฿</td>
            </tr>
            <tr v-if="props.orderDetails.length === 0" class="border-b">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                ไม่มีรายละเอียด
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
