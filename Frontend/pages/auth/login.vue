<script setup>
definePageMeta({ layout: false });

import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

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

    alert('เข้าสู่ระบบสำเร็จ');
    const role = userPayload.role || 'user';
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
    if (error.status === 401) {
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } else if (error.status === 500) {
      alert('เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล');
    } else {
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message);
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-amber-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
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
          <div class="mb-6">
            <label class="block text-gray-700 mb-2 font-medium" for="password">รหัสผ่าน</label>
            <input id="password" v-model="password" type="password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all" placeholder="กรอกรหัสผ่าน" required />
          </div>
          <button type="submit" class="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-all font-semibold shadow-md hover:shadow-lg">เข้าสู่ระบบ</button>
        </form>
        <div class="mt-6 text-center">
          <span class="text-gray-600">ยังไม่มีบัญชี?</span>
          <NuxtLink to="/auth/register" class="text-amber-600 hover:underline ml-1 font-medium">สมัครสมาชิก</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>