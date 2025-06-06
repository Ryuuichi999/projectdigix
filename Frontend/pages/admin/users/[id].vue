<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from 'sweetalert2'; 

const route = useRoute();
const router = useRouter();
const userId = route.params.id;

const user = ref({
  id: null,
  username: "",
  email: "",
  password: "",
  role: "user",
  confirmPassword: "",
});

// กำหนดค่า Toast
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

onMounted(async () => {
  if (process.client) {
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!loggedInUser.loggedIn || loggedInUser.role !== "admin") {
      router.push("/auth/login");
      return;
    }

    if (userId !== "new") {
      try {
        const response = await $fetch(`http://localhost:3000/users/${userId}`, {
          method: "GET",
        });
        user.value = {
          id: response.id,
          username: response.username,
          email: response.email,
          password: "", 
          role: response.role,
          confirmPassword: "",
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        Swal.fire({
          icon: "error",
          title: "ข้อผิดพลาด",
          text: "ไม่สามารถดึงข้อมูลผู้ใช้ได้: " + (error.message || 'Unknown error'),
          confirmButtonColor: "#f59e0b"
        });
        router.push("/admin");
      }
    }
  }
});

const saveUser = async () => {
  try {
    if (userId === "new") {
      await $fetch("http://localhost:3000/users", {
        method: "POST",
        body: {
          username: user.value.username,
          email: user.value.email,
          password: user.value.password,
          confirmPassword: user.value.confirmPassword,
          role: user.value.role,
        },
      });
      Toast.fire({
        icon: "success",
        title: "เพิ่มผู้ใช้สำเร็จ"
      });
    } else {
      const updateData = {
        username: user.value.username,
        email: user.value.email,
        role: user.value.role,
      };
      if (user.value.password) {
        updateData.password = user.value.password;
      }
      await $fetch(`http://localhost:3000/users/${userId}`, {
        method: "PUT",
        body: updateData,
      });
      Toast.fire({
        icon: "success",
        title: "อัปเดตผู้ใช้สำเร็จ"
      });
    }
    router.push("/admin");
  } catch (error) {
    console.error("Error saving user:", error);
    if (error.status === 400) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ถูกต้อง",
        text: error.data.message || "ข้อมูลที่ส่งไม่ถูกต้อง",
        confirmButtonColor: "#f59e0b"
      });
    } else if (error.status === 500) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาดเซิร์ฟเวอร์",
        text: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
        confirmButtonColor: "#f59e0b"
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "เกิดข้อผิดพลาด: " + (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b"
      });
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6 text-amber-600">
        {{ userId === "new" ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขผู้ใช้" }}
      </h2>
      <form @submit.prevent="saveUser">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="username"
            >Username</label
          >
          <input
            id="username"
            v-model="user.username"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="email">อีเมล</label>
          <input
            id="email"
            v-model="user.email"
            type="email"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="password"
            >Password</label
          >
          <input
            id="password"
            v-model="user.password"
            type="password"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            :required="userId === 'new'"
          />
        </div>
        <div v-if="userId === 'new'" class="mb-4">
          <label class="block text-gray-700 mb-2" for="confirmPassword"
            >ยืนยันรหัสผ่าน</label
          >
          <input
            id="confirmPassword"
            v-model="user.confirmPassword"
            type="password"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="role">Role</label>
          <select
            id="role"
            v-model="user.role"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="flex space-x-4">
          <button
            type="submit"
            class="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
          >
            บันทึก
          </button>
          <nuxt-link
            to="/admin"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            ยกเลิก
          </nuxt-link>
        </div>
      </form>
    </div>
  </div>
</template>