```vue
<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import Swal from "sweetalert2";
import UserManagement from "~/components/admin/UserManagement.vue";
import BookManagement from "~/components/admin/BookManagement.vue";
import OrderManagement from "~/components/admin/OrderManagement.vue";
import OrderDetailsModal from "~/components/admin/OrderDetailsModal.vue";
import OrderStatusModal from "~/components/admin/OrderStatusModal.vue";
import StockManagementModal from "~/components/admin/StockManagementModal.vue";

const activeTab = ref("users");
const users = ref([]);
const books = ref([]);
const orders = ref([]);
const selectedOrderDetails = ref([]);
const showOrderDetailsModal = ref(false);
const showOrderStatusModal = ref(false);
const showStockModal = ref(false);
const selectedOrder = ref(null);
const selectedBook = ref(null);
const statusOptions = ["PENDING", "COMPLETE"];
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
      const orderResponse = await $fetch("http://localhost:3000/orders", {
        method: "GET",
      });

      // คำนวณจำนวนหนังสือที่ขายไป
      const soldQuantities = {};
      orderResponse.forEach((order) => {
        order.orderDetails?.forEach((detail) => {
          const bookId = detail.book_id;
          if (bookId) {
            soldQuantities[bookId] =
              (soldQuantities[bookId] || 0) + detail.quantity;
          }
        });
      });

      books.value = bookResponse.map((book) => ({
        id: book.id,
        title: book.title,
        price: book.price,
        category: book.categories?.[0]?.category?.category_name || "ไม่ระบุ",
        description: book.description || "",
        stock: book.stock?.quantity ?? 0,
        stock_id: book.stock?.id,
        soldQuantity: soldQuantities[book.id] || 0,
      }));
    } catch (error) {
      console.error("Error fetching books or orders:", error);
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text:
          "ไม่สามารถดึงข้อมูลหนังสือหรือคำสั่งซื้อได้: " +
          (error.message || "Unknown error"),
        confirmButtonColor: "#f59e0b",
      });
      books.value = [];
    }

    try {
      const orderResponse = await $fetch("http://localhost:3000/orders", {
        method: "GET",
      });
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

const handleDeleteUser = (id) => {
  users.value = users.value.filter((user) => user.id !== id);
  if (selectedItem.value && selectedItem.value.id === id) {
    selectedItem.value = null;
    searchQuery.value = "";
  }
};

const handleDeleteBook = (id) => {
  books.value = books.value.filter((book) => book.id !== id);
  if (selectedItem.value && selectedItem.value.id === id) {
    selectedItem.value = null;
    searchQuery.value = "";
  }
};

const handleDeleteOrder = (id) => {
  orders.value = orders.value.filter((order) => order.id !== id);
  if (selectedItem.value && selectedItem.value.id === id) {
    selectedItem.value = null;
    searchQuery.value = "";
  }
};

const handleViewOrderDetails = (order) => {
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

const handleManageOrderStatus = (order) => {
  selectedOrder.value = order;
  showOrderStatusModal.value = true;
};

const handleUpdateOrderStatus = ({ id, status }) => {
  const updatedOrder = orders.value.find((o) => o.id === id);
  if (updatedOrder) {
    updatedOrder.status = status;
  }
};

const handleManageStock = (book) => {
  selectedBook.value = book;
  showStockModal.value = true;
};

const handleUpdateStock = ({ id, stock, history }) => {
  const updatedBook = books.value.find((b) => b.id === id);
  if (updatedBook) {
    updatedBook.stock = stock;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-20 text-amber-600"></h1>

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

      <!-- Sections -->
      <UserManagement
        v-if="activeTab === 'users'"
        :users="displayedItems"
        :search-query="searchQuery"
        :selected-item="selectedItem"
        @delete-user="handleDeleteUser"
        @update-search-query="(value) => (searchQuery = value)"
        @update-selected-item="(value) => (selectedItem = value)"
      />
      <BookManagement
        v-if="activeTab === 'books'"
        :books="displayedItems"
        :search-query="searchQuery"
        :selected-item="selectedItem"
        @delete-book="handleDeleteBook"
        @manage-stock="handleManageStock"
        @update-search-query="(value) => (searchQuery = value)"
        @update-selected-item="(value) => (selectedItem = value)"
      />
      <OrderManagement
        v-if="activeTab === 'orders'"
        :orders="displayedItems"
        :search-query="searchQuery"
        :selected-item="selectedItem"
        @delete-order="handleDeleteOrder"
        @view-order-details="handleViewOrderDetails"
        @manage-order-status="handleManageOrderStatus"
        @update-selected-item="(value) => (selectedItem = value)"
      />

      <!-- Modals -->
      <OrderDetailsModal
        :show="showOrderDetailsModal"
        :order-details="selectedOrderDetails"
        @close="
          showOrderDetailsModal = false;
          selectedOrderDetails = [];
        "
      />
      <OrderStatusModal
        :show="showOrderStatusModal"
        :order="selectedOrder"
        :status-options="statusOptions"
        @close="showOrderStatusModal = false"
        @update-status="handleUpdateOrderStatus"
      />
      <StockManagementModal
        :show="showStockModal"
        :book="selectedBook"
        @close="
          showStockModal = false;
          selectedBook = null;
        "
        @update-stock="handleUpdateStock"
      />
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
