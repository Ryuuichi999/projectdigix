<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";

const activeTab = ref("users");
const users = ref([]);
const books = ref([]);
const orders = ref([]);
const selectedOrderDetails = ref([]);
const showOrderDetailsModal = ref(false);
const router = useRouter();
const route = useRoute();

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

const fetchData = async () => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn || user.role !== "admin") {
      router.push("/auth/login");
      return;
    }

    const storedTab = localStorage.getItem("activeTab");
    if (storedTab) {
      activeTab.value = storedTab;
    }

    try {
      const response = await $fetch("http://localhost:3000/users", {
        method: "GET",
      });
      users.value = response.map((user) => ({
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "ไม่สามารถดึงข้อมูลผู้ใช้ได้: " + (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
      users.value = [];
    }

    try {
      const bookResponse = await $fetch("http://localhost:3000/books", {
        method: "GET",
      });
      books.value = bookResponse.map((book) => ({
        id: book.id,
        title: book.title,
        price: book.price,
        category: book.categories?.[0]?.category?.category_name || "ไม่ระบุ",
        description: book.description || "",
        stock: book.stock?.quantity ?? 0,
      }));
    } catch (error) {
      console.error("Error fetching books:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "ไม่สามารถดึงข้อมูลหนังสือได้: " + (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
      books.value = [];
    }

    try {
      const orderResponse = await $fetch("http://localhost:3000/orders", {
        method: "GET",
      });
      console.log("Order Response:", orderResponse); // ตรวจสอบข้อมูล
      orders.value = orderResponse.map((order) => ({
        id: order.id,
        user_id: order.user_id,
        user_name: order.user?.username || "ไม่ระบุ",
        total_price: order.total_price,
        status: order.status,
        orderDetails: order.orderDetails || [],
      }));
    } catch (error) {
      console.error("Error fetching orders:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้: " +
          (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
      orders.value = [];
    }
  }
};

onMounted(fetchData);

watch(activeTab, (newTab) => {
  if (process.client) {
    localStorage.setItem("activeTab", newTab);
    searchQuery.value = "";
    filteredItems.value = [];
    selectedItem.value = null;
  }
});

watch(
  () => route.query.refresh,
  (refresh) => {
    if (refresh === "true") {
      fetchData();
      router.replace({ query: {} });
    }
  }
);

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
      users.value = users.value.filter((user) => user.id !== id);
      if (selectedItem.value && selectedItem.value.id === id) {
        selectedItem.value = null;
        searchQuery.value = "";
      }
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

const deleteBook = async (id) => {
  const result = await Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "การลบหนังสือจะไม่สามารถกู้คืนได้!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
  });
  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/books/${id}`, { method: "DELETE" });
      books.value = books.value.filter((book) => book.id !== id);
      if (selectedItem.value && selectedItem.value.id === id) {
        selectedItem.value = null;
        searchQuery.value = "";
      }
      Toast.fire({
        icon: "success",
        title: "ลบหนังสือสำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "เกิดข้อผิดพลาดในการลบหนังสือ: " + (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};

const deleteOrder = async (id) => {
  const result = await Swal.fire({
    title: "คุณแน่ใจหรือไม่?",
    text: "การลบคำสั่งซื้อจะไม่สามารถกู้คืนได้!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#d33",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
  });
  if (result.isConfirmed) {
    try {
      await $fetch(`http://localhost:3000/orders/${id}`, { method: "DELETE" });
      orders.value = orders.value.filter((order) => order.id !== id);
      if (selectedItem.value && selectedItem.value.id === id) {
        selectedItem.value = null;
        searchQuery.value = "";
      }
      Toast.fire({
        icon: "success",
        title: "ลบคำสั่งซื้อสำเร็จ",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "เกิดข้อผิดพลาดในการลบคำสั่งซื้อ: " +
          (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
    }
  }
};

const viewOrderDetails = (order) => {
  console.log("Order Details:", order.orderDetails); // ตรวจสอบข้อมูล
  selectedOrderDetails.value = order.orderDetails?.length
    ? order.orderDetails.map((detail) => ({
        id: detail.id,
        book_title: detail.book?.title || "ไม่ระบุ",
        quantity: detail.quantity,
        price: detail.price,
      }))
    : [];
  showOrderDetailsModal.value = true;
};

const closeOrderDetailsModal = () => {
  showOrderDetailsModal.value = false;
  selectedOrderDetails.value = [];
};

const truncateDescription = (text, maxLength = 40) => {
  if (!text) return "";
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

const searchQuery = ref("");
const filteredItems = ref([]);
const selectedItem = ref(null);

watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    filteredItems.value = [];
    return;
  }

  if (activeTab.value === "users" && users.value.length > 0) {
    filteredItems.value = users.value.filter(
      (user) =>
        user.name.toLowerCase().includes(newQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(newQuery.toLowerCase())
    );
  } else if (activeTab.value === "books" && books.value.length > 0) {
    filteredItems.value = books.value.filter(
      (book) =>
        book.title.toLowerCase().includes(newQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(newQuery.toLowerCase())
    );
  } else if (activeTab.value === "orders" && orders.value.length > 0) {
    filteredItems.value = orders.value.filter(
      (order) =>
        order.user_name.toLowerCase().includes(newQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(newQuery.toLowerCase())
    );
  } else {
    filteredItems.value = [];
  }
});

const selectItem = (item) => {
  selectedItem.value = item;
  searchQuery.value =
    activeTab.value === "users"
      ? item.name
      : activeTab.value === "books"
      ? item.title
      : item.user_name;
  filteredItems.value = [];
};

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    selectedItem.value = null;
  } else if (filteredItems.value.length === 1) {
    selectItem(filteredItems.value[0]);
  } else if (searchQuery.value && !selectedItem.value) {
    if (activeTab.value === "users") {
      selectedItem.value = users.value.find(
        (user) =>
          user.name.toLowerCase() === searchQuery.value.toLowerCase() ||
          user.email.toLowerCase() === searchQuery.value.toLowerCase()
      );
    } else if (activeTab.value === "books") {
      selectedItem.value = books.value.find(
        (book) => book.title.toLowerCase() === searchQuery.value.toLowerCase()
      );
    } else if (activeTab.value === "orders") {
      selectedItem.value = orders.value.find(
        (order) =>
          order.user_name.toLowerCase() === searchQuery.value.toLowerCase()
      );
    }
  }
};

const displayedItems = computed(() => {
  if (selectedItem.value) return [selectedItem.value];
  if (activeTab.value === "users") return users.value;
  if (activeTab.value === "books") return books.value;
  if (activeTab.value === "orders") return orders.value;
  return [];
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
          :class="{
            'bg-amber-500 text-white': activeTab === 'users',
            'bg-gray-200': activeTab !== 'users',
          }"
        >
          จัดการผู้ใช้
        </button>
        <button
          @click="activeTab = 'books'"
          class="px-4 py-2 rounded-lg cursor-pointer"
          :class="{
            'bg-amber-500 text-white': activeTab === 'books',
            'bg-gray-200': activeTab !== 'books',
          }"
        >
          จัดการหนังสือ
        </button>
        <button
          @click="activeTab = 'orders'"
          class="px-4 py-2 rounded-lg cursor-pointer"
          :class="{
            'bg-amber-500 text-white': activeTab === 'orders',
            'bg-gray-200': activeTab !== 'orders',
          }"
        >
          จัดการคำสั่งซื้อ
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
        <div
          v-if="filteredItems.length > 0"
          class="absolute z-10 w-full max-w-md bg-white border rounded-lg shadow-lg mt-1"
        >
          <div
            v-for="item in filteredItems"
            :key="item.id"
            @click="selectItem(item)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-100"
          >
            <span v-if="activeTab === 'users'"
              >{{ item.name }} ({{ item.email }})</span
            >
            <span v-else-if="activeTab === 'books'">{{ item.title }}</span>
            <span v-else-if="activeTab === 'orders'"
              >Order #{{ item.id }} - {{ item.user_name }}</span
            >
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
              <tr
                v-for="user in displayedItems"
                :key="user.id"
                class="border-b"
              >
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
                <td colspan="5" class="px-4 py-2 text-center text-gray-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Books Section -->
      <div v-if="activeTab === 'books'" class="mb-12">
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
              <tr
                v-for="book in displayedItems"
                :key="book.id"
                class="border-b"
              >
                <td class="px-4 py-2">{{ book.id }}</td>
                <td class="px-4 py-2">{{ book.title }}</td>
                <td class="px-4 py-2">{{ book.price }} ฿</td>
                <td class="px-4 py-2">{{ book.category }}</td>
                <td class="px-4 py-2">
                  {{ truncateDescription(book.description) }}
                </td>
                <td class="px-4 py-2">{{ book.stock }}</td>
                <td class="px-4 py-2 text-right space-x-2">
                  <nuxt-link
                    :to="{
                      path: `/admin/books/${book.id}`,
                      query: { refresh: 'true' },
                    }"
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
                <td colspan="7" class="px-4 py-2 text-center text-gray-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Orders Section -->
      <div v-if="activeTab === 'orders'" class="mb-12">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">จัดการคำสั่งซื้อ</h2>
        </div>
        <div class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="bg-amber-200">
                <th class="px-4 py-2 text-left">ID</th>
                <th class="px-4 py-2 text-left">ผู้ใช้</th>
                <th class="px-4 py-2 text-left">ราคารวม</th>
                <th class="px-4 py-2 text-left">สถานะ</th>
                <th class="px-4 py-2 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in displayedItems"
                :key="order.id"
                class="border-b"
              >
                <td class="px-4 py-2">{{ order.id }}</td>
                <td class="px-4 py-2">{{ order.user_name }}</td>
                <td class="px-4 py-2">{{ order.total_price }} ฿</td>
                <td class="px-4 py-2">{{ order.status }}</td>
                <td class="px-4 py-2 text-right space-x-2">
                  <button
                    @click="viewOrderDetails(order)"
                    class="text-blue-500 hover:underline cursor-pointer"
                  >
                    ดูรายละเอียด
                  </button>
                  <button
                    @click="deleteOrder(order.id)"
                    class="text-red-500 hover:underline cursor-pointer"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
              <tr v-if="displayedItems.length === 0" class="border-b">
                <td colspan="5" class="px-4 py-2 text-center text-gray-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Details Modal -->
      <div
        v-if="showOrderDetailsModal"
        class="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div
          class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-in-out"
        >
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">
              รายละเอียดคำสั่งซื้อ
            </h3>
            <button
              @click="closeOrderDetailsModal"
              class="text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
          <div class="overflow-x-auto max-h-96">
            <table
              class="min-w-full bg-white border border-gray-200 rounded-lg"
            >
              <thead>
                <tr class="bg-amber-100 text-gray-700">
                  <th class="px-6 py-3 text-left font-semibold">ID</th>
                  <th class="px-6 py-3 text-left font-semibold">ชื่อหนังสือ</th>
                  <th class="px-6 py-3 text-left font-semibold">จำนวน</th>
                  <th class="px-6 py-3 text-left font-semibold">ราคา</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="detail in selectedOrderDetails"
                  :key="detail.id"
                  class="border-b hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-gray-800">{{ detail.id }}</td>
                  <td class="px-6 py-4 text-gray-800">
                    {{ detail.book_title }}
                  </td>
                  <td class="px-6 py-4 text-gray-800">{{ detail.quantity }}</td>
                  <td class="px-6 py-4 text-gray-800">{{ detail.price }} ฿</td>
                </tr>
                <tr v-if="selectedOrderDetails.length === 0" class="border-b">
                  <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    ไม่มีรายละเอียด
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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