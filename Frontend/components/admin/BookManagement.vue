<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  books: Array,
  searchQuery: String,
  selectedItem: Object,
});
const emit = defineEmits([
  "delete-book",
  "manage-stock",
  "update-search-query",
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

const deleteBook = async (id) => {
  const result = await Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "การลบหนังสือจะไม่สามารถกู้คืนได้!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
  });
  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/books/${id}`, { method: "DELETE" });
      emit("delete-book", id);
      Toast.fire({
        icon: "success",
        title: "ลบหนังสือสำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "เกิดข้อผิดพลาดในการลบหนังสือ: " + (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};

const truncateDescription = (text, maxLength = 30) => {
  if (!text) return "";
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};
</script>

<template>
  <div class="mb-12">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">จัดการหนังสือ</h2>
      <nuxt-link
        to="/admin/books/new"
        class="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
      >
        เพิ่มหนังสือ
      </nuxt-link>
    </div>
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="bg-amber-200">
            <th class="px-4 py-2 text-left">ID</th>
            <th class="px-4 py-2 text-left">ชื่อหนังสือ</th>
            <th class="px-4 py-2 text-left">ราคา</th>
            <th class="px-4 py-2 text-left">หมวดหมู่</th>
            <th class="px-4 py-2 text-left">สินค้าคงเหลือ</th>
            <th class="px-4 py-2 text-left">ยอดขาย</th>
            <th class="px-4 py-2 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="book in props.books"
            :key="book.id"
            class="border-b hover:bg-gray-50"
          >
            <td class="px-4 py-2">{{ book.id }}</td>
            <td class="px-4 py-2">{{ book.title }}</td>
            <td class="px-4 py-2">{{ book.price }} ฿</td>
            <td class="px-4 py-2">{{ book.category }}</td>

            <td class="px-4 py-2">{{ book.stock }}</td>
            <td class="px-4 py-2">{{ book.soldQuantity }}</td>
            <td class="px-4 py-2 text-right space-x-3">
              <button
                @click="emit('manage-stock', book)"
                class="text-green-500 hover:underline cursor-pointer"
              >
                จัดการสต็อก
              </button>
              <nuxt-link
                :to="{
                  path: `/admin/books/${book.id}`,
                  query: { refresh: 'true' },
                }"
                class="text-blue-500 hover:underline cursor-pointer"
              >
                แก้ไข
              </nuxt-link>
              <button
                @click="deleteBook(book.id)"
                class="text-red-500 hover:underline cursor-pointer"
              >
                ลบ
              </button>
            </td>
          </tr>
          <tr v-if="props.books.length === 0" class="border-b">
            <td colspan="8" class="px-4 py-2 text-center text-gray-500">
              ไม่มีข้อมูล
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>