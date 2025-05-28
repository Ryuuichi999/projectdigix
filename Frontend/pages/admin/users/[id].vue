<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const userId = route.params.id;

const user = ref({
  id: null,
  name: '',
  email: '',
  password: '',
});

onMounted(() => {
  if (process.client) {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (userId === 'new') {
      user.value.id = storedUsers.length ? Math.max(...storedUsers.map(u => u.id)) + 1 : 1;
    } else {
      const foundUser = storedUsers.find(u => u.id === parseInt(userId));
      if (foundUser) {
        user.value = { ...foundUser };
      } else {
        router.push('/admin');
      }
    }
  }
});

const saveUser = () => {
  if (process.client) {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (userId === 'new') {
      storedUsers.push({ ...user.value });
    } else {
      const index = storedUsers.findIndex(u => u.id === parseInt(userId));
      if (index !== -1) {
        storedUsers[index] = { ...user.value };
      }
    }
    localStorage.setItem('users', JSON.stringify(storedUsers));
    router.push('/admin');
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6 text-amber-600">
        {{ userId === 'new' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้' }}
      </h2>
      <form @submit.prevent="saveUser">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="name">ชื่อ</label>
          <input
            id="name"
            v-model="user.name"
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
          <label class="block text-gray-700 mb-2" for="password">รหัสผ่าน</label>
          <input
            id="password"
            v-model="user.password"
            type="password"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
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