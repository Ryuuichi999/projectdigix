<script setup>
definePageMeta({ layout: false });

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2'; 
import { Eye, EyeOff, X } from 'lucide-vue-next'; 

const email = ref('');
const password = ref('');
const showPassword = ref(false);
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

const handleLogin = async () => {
  try {
    console.log("Sending login request:", { email: email.value, password: password.value });
    const response = await $fetch('http://localhost:3000/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    });

    const { token } = response;
    console.log("Received token:", token);

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const userPayload = JSON.parse(jsonPayload);
    console.log("Decoded userPayload:", userPayload);

    if (process.client) {
      const userData = {
        loggedIn: true,
        name: userPayload.email.split('@')[0], 
        role: userPayload.role || 'user',
        id: userPayload.id,
      };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log("Stored user data:", userData);
    }

    // แสดงการแจ้งเตือนแบบ Toast เมื่อล็อกอินสำเร็จ
    Toast.fire({
      icon: "success",
      title: "ล็อกอินสำเร็จ"
    });

    const role = userPayload.role || 'user';
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
    if (error.status === 401) {
      Swal.fire({
        icon: "error",
        title: "ล็อกอินล้มเหลว",
        text: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        confirmButtonColor: "#f59e0b" 
      });
    } else if (error.status === 500) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาดเซิร์ฟเวอร์",
        text: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล",
        confirmButtonColor: "#f59e0b"
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "ล็อกอินล้มเหลว",
        text: `เกิดข้อผิดพลาด: ${error.message}`,
        confirmButtonColor: "#f59e0b"
      });
    }
  }
};

const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-amber-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden relative">
      <button
        @click="goToHome"
        class="absolute top-4 right-4 cursor-pointer text-white hover:text-gray-700 transition-colors borderr-1 border-gray-300 rounded-full p-1 bg-amber-500 hover:bg-amber-600"
      >
        <X size="24" />
      </button>
      <ClientOnly>
        <div class="md:w-1/2 hidden md:block">
          <img src="/images/Potologin.jpg" alt="Login Illustration" class="w-full h-full object-cover" />
        </div>
      </ClientOnly>
      <div class="md:w-1/2 p-8 flex flex-col justify-center">
        <h2 class="text-3xl font-bold mb-6 text-center text-amber-600">เข้าสู่ระบบ</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-5">
            <label class="block text-gray-700 mb-2 font-medium" for="email">อีเมล</label>
            <input id="email" v-model="email" type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all" placeholder="กรอกอีเมล" required />
          </div>
          <div class="mb-6 relative">
            <label class="block text-gray-700 mb-2 font-medium" for="password">รหัสผ่าน</label>
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
          <button type="submit" class="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-all font-semibold shadow-md hover:shadow-lg">เข้าสู่ระบบ</button>
        </form>
        <div class="mt-6 text-center">
          <span class="text-gray-500">ยังไม่มีบัญชี?</span>
          <NuxtLink to="/auth/register" class="text-amber-600 hover:underline ml-1 font-medium">สมัครสมาชิก</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>