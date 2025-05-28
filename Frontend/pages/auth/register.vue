<script setup>
definePageMeta({ layout: false })

import { ref } from 'vue'
import { useRouter } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert('รหัสผ่านไม่ตรงกัน')
    return
  }

  try {
    await $fetch('http://localhost:3000/registeruser', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value
      }
    })

    alert('สมัครสมาชิกสำเร็จ')
    router.push('/auth/login')
  } catch (err) {
    alert('สมัครสมาชิกล้มเหลว: ' + (err?.data?.message || err.message))
  }
}
</script>

<template>
  <div class="min-h-screen bg-amber-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row-reverse w-full max-w-4xl overflow-hidden">
      
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
        <h2 class="text-3xl font-bold mb-6 text-center text-amber-600">สมัครสมาชิก</h2>
        <form @submit.prevent="handleRegister">
          <div class="mb-4">
            <label for="name" class="block text-gray-700 mb-1 font-medium">ชื่อผู้ใช้</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกชื่อผู้ใช้"
              required
            />
          </div>
          <div class="mb-4">
            <label for="email" class="block text-gray-700 mb-1 font-medium">อีเมล</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกอีเมล"
              required
            />
          </div>
          <div class="mb-4">
            <label for="password" class="block text-gray-700 mb-1 font-medium">รหัสผ่าน</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>
          <div class="mb-6">
            <label for="confirmPassword" class="block text-gray-700 mb-1 font-medium">ยืนยันรหัสผ่าน</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="ยืนยันรหัสผ่าน"
              required
            />
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
          <NuxtLink to="/auth/login" class="text-amber-600 hover:underline ml-1 font-medium">
            เข้าสู่ระบบ
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
