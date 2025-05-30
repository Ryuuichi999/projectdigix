<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2

const activeTab = ref('users');
const users = ref([]);
const books = ref([]);
const router = useRouter();
const route = useRoute();

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

// ฟังก์ชันดึงข้อมูล
const fetchData = async () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.loggedIn || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    const storedTab = localStorage.getItem('activeTab');
    if (storedTab) {
      activeTab.value = storedTab;
    }

    try {
      const response = await $fetch('http://localhost:3000/users', { method: 'GET' });
      users.value = response.map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลผู้ใช้ได้: " + (error.message || 'Unknown error'),
        confirmButtonColor: "#f59e0b"
      });
      users.value = [];
    }

    try {
      const bookResponse = await $fetch('http://localhost:3000/books', { method: 'GET' });
      books.value = bookResponse.map(book => ({
        id: book.id,
        title: book.title,
        price: book.price,
        category: book.categories?.[0]?.category?.category_name || 'ไม่ระบุ',
        description: book.description || '',
        stock: book.stock?.quantity ?? 0,
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลหนังสือได้: " + (error.message || 'Unknown error'),
        confirmButtonColor: "#f59e0b"
      });
      books.value = [];
    }
  }
};

onMounted(fetchData);

watch(activeTab, (newTab) => {
  if (process.client) {
    localStorage.setItem('activeTab', newTab);
    searchQuery.value = '';
    filteredItems.value = [];
    selectedItem.value = null; 
  }
});

// รีเฟรชข้อมูลเมื่อกลับมาจากหน้าแก้ไข
watch(
  () => route.query.refresh,
  (refresh) => {
    if (refresh === 'true') {
      fetchData();
      router.replace({ query: {} });
    }
  }
);

const deleteUser = async (id) => {
  try {
    await $fetch(`http://localhost:3000/users/${id}`, { method: 'DELETE' });
    users.value = users.value.filter((user) => user.id !== id);
    if (selectedItem.value && selectedItem.value.id === id) {
      selectedItem.value = null;
      searchQuery.value = '';
    }
    Toast.fire({
      icon: "success",
      title: "ลบผู้ใช้สำเร็จ"
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: "เกิดข้อผิดพลาดในการลบผู้ใช้: " + (error.message || 'Unknown error'),
      confirmButtonColor: "#f59e0b"
    });
  }
};

const deleteBook = async (id) => {
  try {
    await $fetch(`http://localhost:3000/books/${id}`, { method: 'DELETE' });
    books.value = books.value.filter((book) => book.id !== id);
    if (selectedItem.value && selectedItem.value.id === id) {
      selectedItem.value = null;
      searchQuery.value = '';
    }
    Toast.fire({
      icon: "success",
      title: "ลบหนังสือสำเร็จ"
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: "เกิดข้อผิดพลาดในการลบหนังสือ: " + (error.message || 'Unknown error'),
      confirmButtonColor: "#f59e0b"
    });
  }
};

const truncateDescription = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

// การค้นหา
const searchQuery = ref('');
const filteredItems = ref([]);
const selectedItem = ref(null);

watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    filteredItems.value = [];
    return;
  }

  if (activeTab.value === 'users' && users.value.length > 0) {
    filteredItems.value = users.value.filter(user =>
      user.name.toLowerCase().includes(newQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(newQuery.toLowerCase())
    );
  } else if (activeTab.value === 'books' && books.value.length > 0) {
    filteredItems.value = books.value.filter(book =>
      book.title.toLowerCase().includes(newQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(newQuery.toLowerCase())
    );
  } else {
    filteredItems.value = [];
  }
});

const selectItem = (item) => {
  selectedItem.value = item;
  searchQuery.value = activeTab.value === 'users' ? item.name : item.title;
  filteredItems.value = [];
};

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    selectedItem.value = null;
  } else if (filteredItems.value.length === 1) {
    selectItem(filteredItems.value[0]);
  } else if (searchQuery.value && !selectedItem.value) {
    if (activeTab.value === 'users') {
      selectedItem.value = users.value.find(user =>
        user.name.toLowerCase() === searchQuery.value.toLowerCase() ||
        user.email.toLowerCase() === searchQuery.value.toLowerCase()
      );
    } else {
      selectedItem.value = books.value.find(book =>
        book.title.toLowerCase() === searchQuery.value.toLowerCase()
      );
    }
  }
};

const displayedItems = computed(() => {
  return selectedItem.value ? [selectedItem.value] : (activeTab.value === 'users' ? users.value : books.value);
});
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

      <!-- Search Bar -->
      <div class="mb-6 relative">
        <div class="flex items-center space-x-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหา..."
            class="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            @keydown.enter="performSearch"
          />
          <button
            @click="performSearch"
            class="bg-amber-500 text-white px-3 py-2 rounded hover:bg-amber-600 transition cursor-pointer"
          >
            ค้นหา
          </button>
        </div>
        <div v-if="filteredItems.length > 0" class="absolute z-10 w-full max-w-md bg-white border rounded-lg shadow-lg mt-1">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            @click="selectItem(item)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-100"
          >
            <span v-if="activeTab === 'users'">{{ item.name }} ({{ item.email }})</span>
            <span v-else>{{ item.title }} </span>
          </div>
        </div>
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
              <tr v-for="user in displayedItems" :key="user.id" class="border-b">
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
              <tr v-if="displayedItems.length === 0" class="border-b">
                <td colspan="5" class="px-4 py-2 text-center text-gray-500">ไม่มีข้อมูล</td>
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
                <th class="px-4 py-2 text-left">จำนวนสินค้าคงเหลือ</th>
                <th class="px-4 py-2 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in displayedItems" :key="book.id" class="border-b">
                <td class="px-4 py-2">{{ book.id }}</td>
                <td class="px-4 py-2">{{ book.title }}</td>
                <td class="px-4 py-2">{{ book.price }} ฿</td>
                <td class="px-4 py-2">{{ book.category }}</td>
                <td class="px-4 py-2">{{ truncateDescription(book.description) }}</td>
                <td class="px-4 py-2">{{ book.stock }}</td>
                <td class="px-4 py-2 text-right space-x-2">
                  <nuxt-link
                    :to="{ path: `/admin/books/${book.id}`, query: { refresh: 'true' }}"
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
              <tr v-if="displayedItems.length === 0" class="border-b">
                <td colspan="7" class="px-4 py-2 text-center text-gray-500">ไม่มีข้อมูล</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.autocomplete {
  position: absolute;
  z-index: 10;
  width: 100%;
  max-width: 500px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 0.25rem;
}

.autocomplete-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.autocomplete-item:hover {
  background-color: #f3f4f6;
}
</style>