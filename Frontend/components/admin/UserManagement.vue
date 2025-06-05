<script setup>
import { ref } from "vue";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const props = defineProps({
  users: Array,
  searchQuery: String,
  selectedItem: Object,
});
const emit = defineEmits([
  "delete-user",
  "update-search-query",
  "update-selected-item",
]);

const router = useRouter();

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

const deleteUser = async (id) => {
  const result = await Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "การลบผู้ใช้จะไม่สามารถกู้คืนได้!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
  });
  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/users/${id}`, { method: "DELETE" });
      emit("delete-user", id);
      Toast.fire({
        icon: "success",
        title: "ลบผู้ใช้สำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "เกิดข้อผิดพลาดในการลบผู้ใช้: " + (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};
</script>

<template>
  <div class="mb-12">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">จัดการผู้ใช้</h2>
      <nuxt-link
        to="/admin/users/new"
        class="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
      >
        เพิ่มผู้ใช้
      </nuxt-link>
    </div>
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="bg-amber-200">
            <th class="px-4 py-2 text-left">ID</th>
            <th class="px-4 py-2 text-left">Username</th>
            <th class="px-4 py-2 text-left">Email</th>
            <th class="px-4 py-2 text-left">Role</th>
            <th class="px-4 py-2 text-right">Management</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in props.users" :key="user.id" class="border-b">
            <td class="px-4 py-2">{{ user.id }}</td>
            <td class="px-4 py-2">{{ user.name }}</td>
            <td class="px-4 py-2">{{ user.email }}</td>
            <td class="px-4 py-2">{{ user.role }}</td>
            <td class="px-4 py-2 text-right space-x-2">
              <nuxt-link
                :to="`/admin/users/${user.id}`"
                class="text-blue-500 hover:underline cursor-pointer"
              >
                แก้ไข
              </nuxt-link>
              <button
                @click="deleteUser(user.id)"
                class="text-red-500 hover:underline cursor-pointer"
              >
                ลบ
              </button>
            </td>
          </tr>
          <tr v-if="props.users.length === 0" class="border-b">
            <td colspan="5" class="px-4 py-2 text-center text-gray-500">
              ไม่มีข้อมูล
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
