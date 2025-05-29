<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const activeTab = ref('users');
const users = ref([]);
const books = ref([]);
const router = useRouter();

// ดึงข้อมูลจาก API และ localStorage
onMounted(async () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    // ดึงข้อมูลผู้ใช้จาก API
    try {
      const response = await $fetch('http://localhost:3000/users', {
        method: 'GET',
      });
      users.value = response.map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role, 
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      users.value = [];
    }

    // ยังคงใช้ localStorage สำหรับ books เนื่องจากยังไม่มี API สำหรับ books
    const storedBooks = JSON.parse(localStorage.getItem('books') || '[]');
    if (storedBooks.length === 0) {
      books.value = [
        { id: 1, title: "Your Name", price: 120, category: "นิยายโรแมนติก", description: "นิยายรักเหนือจริง" },
        { id: 2, title: "Doraemon", price: 90, category: "การ์ตูน", description: "การ์ตูนตลก" },
        { id: 3, title: "Attack on Titan", price: 150, category: "การ์ตูน", description: "การ์ตูนแอ็คชั่น" },
        { id: 4, title: "One Piece", price: 200, category: "การ์ตูน", description: "การ์ตูนผจญภัย" },
        { id: 5, title: "Naruto", price: 180, category: "การ์ตูน", description: "การ์ตูนนินจา" },
        { id: 6, title: "Dragon Ball", price: 160, category: "การ์ตูน", description: "การ์ตูนต่อสู้" },
        { id: 7, title: "My Hero Academia", price: 140, category: "การ์ตูน", description: "การ์ตูนฮีโร่" },
        { id: 8, title: "Death Note", price: 130, category: "การ์ตูน", description: "การ์ตูนลึกลับ" },
        { id: 9, title: "Harry Potter and the Philosopher's Stone", price: 250, category: "นิยาย", description: "นิยายแฟนตาซี" },
        { id: 10, title: "The Hobbit", price: 220, category: "นิยาย", description: "นิยายผจญภัย" },
        { id: 11, title: "Introduction to Algorithms", price: 800, category: "วิชาการ", description: "ตำราโปรแกรมมิ่ง" },
        { id: 12, title: "Principles of Economics", price: 750, category: "วิชาการ", description: "ตำราเศรษฐศาสตร์" },
      ];
      localStorage.setItem('books', JSON.stringify(books.value));
    } else {
      books.value = storedBooks.map(book => ({
        ...book,
        description: book.description ?? '',
      }));
    }
  }
});

// ฟังก์ชันลบผู้ใช้โดยเรียก API
const deleteUser = async (id) => {
  try {
    await $fetch(`http://localhost:3000/users/${id}`, {
      method: 'DELETE',
    });
    users.value = users.value.filter((user) => user.id !== id);
    alert('ลบผู้ใช้สำเร็จ');
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('เกิดข้อผิดพลาดในการลบผู้ใช้: ' + (error.message || 'Unknown error'));
  }
};

// ฟังก์ชันลบหนังสือ (ยังใช้ localStorage)
const deleteBook = (id) => {
  books.value = books.value.filter((book) => book.id !== id);
  localStorage.setItem('books', JSON.stringify(books.value));
};

// จำกัดข้อความ description
const truncateDescription = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-amber-600">Admin Dashboard</h1>

      <!-- Tab Navigation -->
      <div class="mb-6 flex space-x-4">
        <button
          @click="activeTab = 'users'"
          class="px-4 py-2 rounded-lg cursor-pointer"
          :class="{ 'bg-amber-500 text-white': activeTab === 'users', 'bg-gray-200': activeTab !== 'users' }"
        >
          จัดการผู้ใช้
        </button>
        <button
          @click="activeTab = 'books'"
          class="px-4 py-2 rounded-lg cursor-pointer"
          :class="{ 'bg-amber-500 text-white': activeTab === 'books', 'bg-gray-200': activeTab !== 'books' }"
        >
          จัดการหนังสือ
        </button>
      </div>

      <!-- Users Section -->
      <div v-if="activeTab === 'users'" class="mb-12">
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
              <tr v-for="user in users" :key="user.id" class="border-b">
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
            </tbody>
          </table>
        </div>
      </div>

      <!-- Books Section -->
      <div v-if="activeTab === 'books'">
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
                <th class="px-4 py-2 text-left">คำอธิบาย</th>
                <th class="px-4 py-2 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in books" :key="book.id" class="border-b">
                <td class="px-4 py-2">{{ book.id }}</td>
                <td class="px-4 py-2">{{ book.title }}</td>
                <td class="px-4 py-2">{{ book.price }} ฿</td>
                <td class="px-4 py-2">{{ book.category }}</td>
                <td class="px-4 py-2">{{ truncateDescription(book.description) }}</td>
                <td class="px-4 py-2 text-right space-x-2">
                  <nuxt-link
                    :to="`/admin/books/${book.id}`"
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>