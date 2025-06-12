<script setup>
import { ref } from "vue";

const props = defineProps({
  address: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["save", "close"]);

const localAddress = ref({ ...props.address });

const submitForm = () => {
  emit("save", localAddress.value);
};
</script>

<template>
  <div class="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 mt-5">
    <div class="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-md mt-6">
      <div class="flex items-center justify-between mb-6 ">
        <h3 class="text-xl font-semibold text-gray-800">เพิ่มที่อยู่ใหม่</h3>
        <button
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

      <form @submit.prevent="submitForm" class="grid grid-cols-2 gap-6">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">ชื่อ - นามสกุล</label>
          <input
            v-model="localAddress.title"
            id="title"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-base"
            placeholder="เช่น บ้าน, ออฟฟิศ"
          />
        </div>
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
          <input
            v-model="localAddress.fullName"
            id="fullName"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-base"
            placeholder="กรอกชื่อ-นามสกุล"
          />
        </div>
        <div class="col-span-2">
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
          <input
            v-model="localAddress.phone"
            id="phone"
            type="tel"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-base"
            placeholder="กรอกเบอร์โทรศัพท์"
          />
        </div>
        <div class="col-span-2">
          <label for="address" class="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
          <textarea
            v-model="localAddress.address"
            id="address"
            required
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-base"
            placeholder="กรอกที่อยู่"
          ></textarea>
        </div>
        <div>
          <label for="province" class="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
          <input
            v-model="localAddress.province"
            id="province"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-base"
            placeholder="กรอกจังหวัด"
          />
        </div>
        <div>
          <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1"> </label>
          <input
            v-model="localAddress.postalCode"
            id="postalCode"
            type="text"
            required
            pattern="[0-9]{5}"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-base"
            placeholder="กรอกรหัสไปรษณีย์"
          />
        </div>

        <div class="col-span-2 flex justify-end space-x-4 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 cursor-pointer text-gray-700 rounded-md hover:bg-gray-100 text-base font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-red-500 text-white cursor-pointer rounded-md hover:bg-red-600 text-base font-medium"
          >
            บันทึก
          </button>
        </div>
      </form>
    </div>
  </div>
</template>