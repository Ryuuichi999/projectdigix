<script setup>
definePageMeta({ layout: false });

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2'; 
import { Eye, EyeOff, X } from 'lucide-vue-next'; // เพิ่ม X สำหรับปุ่มกากบาท

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false); // สถานะสำหรับ toggle การแสดงรหัสผ่าน
const showConfirmPassword = ref(false); // สถานะสำหรับ toggle การยืนยันรหัสผ่าน
const router = useRouter();

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

const handleRegister = async () => {
  // Client-side validation
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    Swal.fire({
      icon: "warning",
      title: "กรุณากรอกข้อมูล",
      text: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
      confirmButtonColor: "#f59e0b"
    });
    return;
  }
  if (password.value !== confirmPassword.value) {
    Swal.fire({
      icon: "error",
      title: "รหัสผ่านไม่ตรงกัน",
      text: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
      confirmButtonColor: "#f59e0b"
    });
    return;
  }

  try {
    const response = await $fetch('http://localhost:3000/registeruser', {
      method: 'POST',
      body: {
        username: username.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        role: 'user',
      },
    });

    // แสดงการแจ้งเตือนแบบ Toast เมื่อสมัครสมาชิกสำเร็จ
    Toast.fire({
      icon: "success",
      title: "สมัครสมาชิกสำเร็จ"
    });
    router.push('/');
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "สมัครสมาชิกล้มเหลว",
      text: err?.data?.message || err.message,
      confirmButtonColor: "#f59e0b"
    });
  }
};

const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-amber-50 flex items-center justify-center p-4">
    <div
      class="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row-reverse w-full max-w-4xl overflow-hidden relative"
    >
      <button
        @click="goToHome"
        class="absolute top-4 right-4 text-white cursor-pointer hover:text-gray-700 transition-colors borderr-1 border-gray-300 rounded-full p-1 bg-amber-500 hover:bg-amber-600"
      >
        <X size="24" />
      </button>
      <!-- รูปภาพฝั่งขวา -->
      <ClientOnly>
        <div class="md:w-1/2 hidden md:block">
          <img
            src="/images/Logoregister.jpg"
            alt="Register Illustration"
            class="w-full h-full object-cover"
          />
        </div>
      </ClientOnly>

      <!-- ฟอร์มฝั่งซ้าย -->
      <div class="md:w-1/2 p-8 flex flex-col justify-center">
        <h2 class="text-3xl font-bold mb-6 text-center text-amber-600">
          สมัครสมาชิก
        </h2>
        <form @submit.prevent="handleRegister">
          <div class="mb-4">
            <label for="username" class="block text-gray-700 mb-1 font-medium"
              >ชื่อผู้ใช้</label
            >
            <input
              id="username"
              v-model="username"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกชื่อผู้ใช้"
              required
            />
          </div>
          <div class="mb-4">
            <label for="email" class="block text-gray-700 mb-1 font-medium"
              >อีเมล</label
            >
            <input
              id="email"
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกอีเมล"
              required
            />
          </div>
          <div class="mb-4 relative">
            <label for="password" class="block text-gray-700 mb-1 font-medium"
              >รหัสผ่าน</label
            >
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all pr-10"
              placeholder="กรอกรหัสผ่าน"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute mt-3 right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <component :is="showPassword ? EyeOff : Eye" size="20" />
            </button>
          </div>
          <div class="mb-6 relative">
            <label for="confirmPassword" class="block text-gray-700 mb-1 font-medium"
              >ยืนยันรหัสผ่าน</label
            >
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all pr-10"
              placeholder="ยืนยันรหัสผ่าน"
              required
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute mt-3 right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <component :is="showConfirmPassword ? EyeOff : Eye" size="20" />
            </button>
          </div>
          <button
            type="submit"
            class="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            สมัครสมาชิก
          </button>
        </form>
        <div class="mt-6 text-center">
          <span class="text-gray-600">มีบัญชีอยู่แล้ว?</span>
          <NuxtLink
            to="/auth/login"
            class="text-amber-600 hover:underline ml-1 font-medium"
          >
            เข้าสู่ระบบ
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>