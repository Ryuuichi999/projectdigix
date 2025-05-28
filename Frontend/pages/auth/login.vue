<script setup>
definePageMeta({ layout: false });

import { ref } from 'vue';
import { useRouter } from 'vue-router';

// ข้อมูลจำลองสำหรับ User และ Admin
const mockUsers = [
  { email: 'user1@example.com', password: '123', name: 'Ryuuichi', role: 'user' },
  { email: 'user2@example.com', password: 'password456', name: 'สมหญิง', role: 'user' },
  { email: 'admin@example.com', password: 'admin123', name: 'แอดมิน', role: 'admin' },
];

const email = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  const user = mockUsers.find(
    (u) => u.email === email.value && u.password === password.value
  );
  if (user) {
    if (process.client) {
      localStorage.setItem('user', JSON.stringify({ name: user.name, role: user.role, loggedIn: true }));
    }
    alert('เข้าสู่ระบบสำเร็จ');
    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } else {
    alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
};
</script>

<template>
  <div class="min-h-screen bg-amber-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
      <!-- รูปภาพฝั่งซ้าย -->
      <ClientOnly>
        <div class="md:w-1/2 hidden md:block">
          <img
            src="/images/Potologin.jpg"
            alt="Login Illustration"
            class="w-full h-full object-cover"
           
          />
        </div>
      </ClientOnly>

      <!-- ฟอร์มฝั่งขวา -->
      <div class="md:w-1/2 p-8 flex flex-col justify-center">
        <h2 class="text-3xl font-bold mb-6 text-center text-amber-600">เข้าสู่ระบบ</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-5">
            <label class="block text-gray-700 mb-2 font-medium" for="email">อีเมล</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกอีเมล"
              required
            />
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 mb-2 font-medium" for="password">รหัสผ่าน</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        <div class="mt-6 text-center">
          <span class="text-gray-600">ยังไม่มีบัญชี?</span>
          <NuxtLink to="/auth/register" class="text-amber-600 hover:underline ml-1 font-medium">
            สมัครสมาชิก
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>