<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useNuxtApp } from "nuxt/app";
import Swal from "sweetalert2";

const router = useRouter();
const route = useRoute();
const { $event } = useNuxtApp();
const cart = ref([]);
const isLoading = ref(false);
const currentStep = ref(1);
const savedAddresses = ref([]);
const selectedAddressId = ref(null);
const showAddressForm = ref(false);
const newAddress = ref({
  id: null,
  title: "",
  fullName: "",
  phone: "",
  address: "",
  province: "",
  postalCode: "",
  isDefault: false,
});

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

onMounted(() => {
  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn || !user.id) {
      router.push("/auth/login");
      return;
    }
    cart.value = JSON.parse(localStorage.getItem("cart") || "[]");
    savedAddresses.value = JSON.parse(
      localStorage.getItem("addresses") || "[]"
    );

    // Set default address if exists
    const defaultAddress = savedAddresses.value.find((addr) => addr.isDefault);
    if (defaultAddress) {
      selectedAddressId.value = defaultAddress.id;
    }

    // Check for step query parameter
    const step = route.query.step;
    if (step && step === "2" && cart.value.length > 0) {
      currentStep.value = 2;
    }
  }
});

const totalPrice = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
);

const shippingFee = computed(() => 0); // Free shipping
const vatAmount = computed(
  () => Math.round(totalPrice.value * 0.07 * 100) / 100
);
const grandTotal = computed(
  () => totalPrice.value + shippingFee.value + vatAmount.value
);

const updateQuantity = (item, change) => {
  const newQuantity = item.quantity + change;
  if (newQuantity <= 0) {
    removeFromCart(item.id);
    return;
  }
  if (newQuantity > item.stock) {
    Swal.fire({
      icon: "warning",
      title: "สินค้าคงเหลือไม่เพียงพอ",
      text: `คงเหลือ: ${item.stock} เล่ม`,
      confirmButtonColor: "#f59e0b",
    });
    return;
  }
  item.quantity = newQuantity;
  if (process.client) {
    localStorage.setItem("cart", JSON.stringify(cart.value));
    $event.emit("cart-updated");
  }
};

const removeFromCart = (id) => {
  cart.value = cart.value.filter((item) => item.id !== id);
  if (process.client) {
    localStorage.setItem("cart", JSON.stringify(cart.value));
    $event.emit("cart-updated");
  }
};

const goToStep = (step) => {
  if (step === 2 && cart.value.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "ตะกร้าสินค้าว่าง",
      text: "กรุณาเพิ่มสินค้าในตะกร้าก่อน",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }
  currentStep.value = step;
};

const addNewAddress = () => {
  newAddress.value = {
    id: Date.now(),
    title: "",
    fullName: "",
    phone: "",
    address: "",
    province: "",
    postalCode: "",
    isDefault: savedAddresses.value.length === 0,
  };
  showAddressForm.value = true;
};

const saveAddress = () => {
  if (
    !newAddress.value.title ||
    !newAddress.value.fullName ||
    !newAddress.value.phone ||
    !newAddress.value.address ||
    !newAddress.value.province ||
    !newAddress.value.postalCode
  ) {
    Swal.fire({
      icon: "warning",
      title: "กรุณากรอกข้อมูลให้ครบถ้วน",
      text: "กรุณากรอกข้อมูลที่อยู่ให้ครบทุกช่อง",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  // If this is set as default, remove default from others
  if (newAddress.value.isDefault) {
    savedAddresses.value.forEach((addr) => (addr.isDefault = false));
  }

  const existingIndex = savedAddresses.value.findIndex(
    (addr) => addr.id === newAddress.value.id
  );
  if (existingIndex >= 0) {
    savedAddresses.value[existingIndex] = { ...newAddress.value };
  } else {
    savedAddresses.value.push({ ...newAddress.value });
  }

  if (process.client) {
    localStorage.setItem("addresses", JSON.stringify(savedAddresses.value));
  }

  selectedAddressId.value = newAddress.value.id;
  showAddressForm.value = false;

  Toast.fire({
    icon: "success",
    title: "บันทึกที่อยู่เรียบร้อย",
  });
};

const editAddress = (address) => {
  newAddress.value = { ...address };
  showAddressForm.value = true;
};

const deleteAddress = (addressId) => {
  Swal.fire({
    title: "ยืนยันการลบ",
    text: "คุณต้องการลบที่อยู่นี้ใช่หรือไม่?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
  }).then((result) => {
    if (result.isConfirmed) {
      savedAddresses.value = savedAddresses.value.filter(
        (addr) => addr.id !== addressId
      );
      if (selectedAddressId.value === addressId) {
        selectedAddressId.value =
          savedAddresses.value.length > 0 ? savedAddresses.value[0].id : null;
      }
      if (process.client) {
        localStorage.setItem("addresses", JSON.stringify(savedAddresses.value));
      }
      Toast.fire({
        icon: "success",
        title: "ลบที่อยู่เรียบร้อย",
      });
    }
  });
};

const selectedAddress = computed(() => {
  return (
    savedAddresses.value.find((addr) => addr.id === selectedAddressId.value) ||
    null
  );
});

const confirmOrder = async () => {
  if (!selectedAddress.value) {
    Swal.fire({
      icon: "warning",
      title: "กรุณาเลือกที่อยู่จัดส่ง",
      text: "กรุณาเลือกหรือเพิ่มที่อยู่จัดส่งก่อนทำการสั่งซื้อ",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  if (process.client) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.loggedIn || !user.id) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินก่อนดำเนินการชำระเงิน",
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "ไปที่หน้าเข้าสู่ระบบ",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: "ยกเลิก",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/auth/login");
        }
      });
      return;
    }

    if (totalPrice.value <= 0) {
      Swal.fire({
        icon: "warning",
        title: "ยอดรวมไม่ถูกต้อง",
        text: "ยอดรวมต้องมากกว่า 0",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    isLoading.value = true;
    let orderId = null;
    try {
      const orderData = {
        user_id: Number(user.id),
        total_price: Number(grandTotal.value),
        shipping_address: selectedAddress.value,
      };

      console.log("Sending order data:", orderData);
      const orderResponse = await $fetch("http://localhost:3000/orders", {
        method: "POST",
        body: orderData,
      });

      orderId = orderResponse.order.id;
      console.log("Created Order ID:", orderId);

      // สร้างใบเสร็จ (receipt)
      const receiptNumber = `REC-${orderId}-${Date.now()}`;
      await $fetch("http://localhost:3000/receipts", {
        method: "POST",
        body: {
          order_id: orderId,
          receipt_number: receiptNumber,
          total_amount: Number(grandTotal.value),
          issued_at: new Date().toISOString(),
        },
      });

      // สร้าง orderDetails
      const processedCart = cart.value.map((item) => ({
        id: Number(item.id),
        price: Number(item.price),
        quantity: Number(item.quantity),
        stock: Number(item.stock),
      }));

      console.log("Processed cart items:", processedCart);
      for (const item of processedCart) {
        if (!item.id || !item.quantity || !item.price) {
          throw new Error(`Invalid cart item: ${JSON.stringify(item)}`);
        }
        if (item.quantity <= 0 || item.price <= 0) {
          throw new Error(
            `Invalid quantity or price in cart item: ${JSON.stringify(item)}`
          );
        }

        const bookResponse = await $fetch(
          `http://localhost:3000/books/${item.id}`
        );
        if (
          !bookResponse.stock ||
          bookResponse.stock.quantity < item.quantity
        ) {
          throw new Error(
            `Insufficient stock for book ID ${item.id}. Available: ${
              bookResponse.stock?.quantity || 0
            }`
          );
        }

        await $fetch("http://localhost:3000/order-details", {
          method: "POST",
          body: {
            order_id: orderId,
            book_id: item.id,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      Toast.fire({
        icon: "success",
        title: "สั่งซื้อสำเร็จ",
      });
      cart.value = [];
      localStorage.setItem("cart", JSON.stringify(cart.value));
      $event.emit("cart-updated");
      router.push("/");
    } catch (error) {
      console.error("Error during checkout:", error);
      if (orderId) {
        try {
          await $fetch(`http://localhost:3000/orders/${orderId}`, {
            method: "DELETE",
          });
          console.log(`Deleted incomplete order: ${orderId}`);
        } catch (deleteError) {
          console.error("Error deleting incomplete order:", deleteError);
        }
      }
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: error.message || "เกิดข้อผิดพลาดในการสั่งซื้อ",
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Step Navigation -->
      <div class="flex justify-center mb-8 mt-15">
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <div
              @click="goToStep(1)"
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition-colors',
                currentStep === 1 ? 'bg-red-500' : 'bg-pink-200 text-pink-500',
              ]"
            >
              1
            </div>
            <span class="ml-2 font-medium">ตะกร้าสินค้า</span>
          </div>

          <div class="w-8 h-0.5 bg-gray-300"></div>

          <div class="flex items-center">
            <div
              @click="goToStep(2)"
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition-colors',
                currentStep === 2 ? 'bg-red-500' : 'bg-pink-200 text-pink-500',
              ]"
            >
              2
            </div>
            <span class="ml-2 font-medium">ชำระเงิน</span>
          </div>
        </div>
      </div>

      <!-- Step 1: Cart -->
      <div v-if="currentStep === 1">
        <div
          v-if="cart.length > 0"
          class="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <!-- Cart Items -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="space-y-6">
                <div
                  v-for="item in cart"
                  :key="item.id"
                  class="flex items-start space-x-4 pb-6 border-b border-gray-200 last:border-b-0"
                >
                  <img
                    :src="item.image"
                    alt="Product"
                    class="w-20 h-28 object-cover rounded-lg"
                  />
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900 mb-2">
                      {{ item.title }}
                    </h3>
                    <div class="flex items-center space-x-3">
                      <button
                        @click="updateQuantity(item, -1)"
                        class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        :disabled="item.quantity <= 1"
                      >
                        -
                      </button>
                      <span class="font-medium">{{ item.quantity }}</span>
                      <button
                        @click="updateQuantity(item, 1)"
                        class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        :disabled="item.quantity >= item.stock"
                      >
                        +
                      </button>
                      <button
                        @click="removeFromCart(item.id)"
                        class="ml-4 text-gray-400 hover:text-red-500"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-red-500">
                      ฿{{ (item.price * item.quantity).toLocaleString() }}
                    </div>
                    <div class="text-sm text-gray-500 line-through">
                      ฿{{ (item.price * item.quantity * 1.2).toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 class="text-xl font-bold text-gray-900 mb-4">
                ยอดรวมทั้งหมด
              </h2>

              <div class="space-y-3 mb-6">
                <div class="flex justify-between">
                  <span class="text-gray-600">ค่าสินค้า:</span>
                  <span>฿{{ totalPrice.toLocaleString() }}</span>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600">ภาษี VAT 7%:</span>
                  <span>฿{{ vatAmount.toLocaleString() }}</span>
                </div>

                <div class="flex justify-between">
                  <span class="text-gray-600">ส่งฟรีทั่วไทย:</span>
                  <span>฿0.00</span>
                </div>
                <hr />
                <div class="flex justify-between text-lg font-bold">
                  <span>ยอดรวม</span>
                  <span class="text-red-500"
                    >฿{{ grandTotal.toLocaleString() }}</span
                  >
                </div>
                <div class="text-sm text-gray-500">
                  ยอดรวม (รวมภาษีมูลค่าเพิ่ม)
                </div>
              </div>

              <button
                @click="goToStep(2)"
                class="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                ดำเนินการต่อ
              </button>

              <div class="mt-4 text-center">
                <div
                  class="flex items-center justify-center text-blue-600 text-sm"
                >
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                    />
                  </svg>
                  ส่งฟรีทั่วไทย
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="bg-white rounded-lg shadow-sm p-8 text-center">
          <div class="text-gray-400 text-6xl mb-4">🛒</div>
          <h2 class="text-2xl font-medium text-gray-900 mb-2">
            ตะกร้าของคุณว่างเปล่า
          </h2>
          <p class="text-gray-500 mb-6">เริ่มเลือกซื้อสินค้าได้เลย</p>
          <NuxtLink
            to="/"
            class="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            เลือกซื้อสินค้า
          </NuxtLink>
        </div>
      </div>

      <!-- Step 2: Shipping Address -->
      <div v-if="currentStep === 2">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Address Selection -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                  ที่อยู่จัดส่ง
                </h2>
              </div>

              <!-- Address Selection Area -->
              <div class="space-y-4">
                <!-- Existing Addresses -->
                <div
                  v-for="address in savedAddresses"
                  :key="address.id"
                  class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-start space-x-3">
                    <input
                      v-model="selectedAddressId"
                      :value="address.id"
                      type="radio"
                      :id="`address-${address.id}`"
                      name="selectedAddress"
                      class="mt-1 text-red-500 focus:ring-red-500"
                    />
                    <label
                      :for="`address-${address.id}`"
                      class="flex-1 cursor-pointer"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="font-medium text-gray-900">
                            {{ address.title }}
                          </div>
                          <div class="text-sm text-gray-600 mt-1">
                            {{ address.fullName }} | {{ address.phone }}
                          </div>
                          <div class="text-sm text-gray-600 mt-1">
                            {{ address.address }}, {{ address.province }}
                            {{ address.postalCode }}
                          </div>
                          <div
                            v-if="address.isDefault"
                            class="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                          >
                            ที่อยู่หลัก
                          </div>
                        </div>
                        <div class="flex space-x-2">
                          <button
                            @click="editAddress(address)"
                            class="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            แก้ไข
                          </button>
                          <button
                            @click="deleteAddress(address.id)"
                            class="text-red-600 hover:text-red-800 text-sm"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Add New Address Button -->
                <div
                  class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                >
                  <button
                    @click="addNewAddress"
                    class="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      ></path>
                    </svg>
                    <span>เพิ่มที่อยู่ใหม่</span>
                  </button>
                </div>
              </div>

              <!-- Company Invoice Option -->
              <div class="mt-8 p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="companyInvoice"
                    class="text-red-500 focus:ring-red-500"
                  />
                  <label
                    for="companyInvoice"
                    class="text-sm font-medium text-gray-700"
                  >
                    ต้องการใบกำกับภาษี
                  </label>
                </div>
              </div>

              <!-- Continue Button -->
              <div class="mt-6">
                <button
                  @click="confirmOrder"
                  :disabled="!selectedAddressId || isLoading"
                  class="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isLoading">กำลังดำเนินการ...</span>
                  <span v-else>ยืนยัน</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-medium text-gray-900">
                  คำสั่งซื้อของคุณ
                </h2>
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  ></path>
                </svg>
              </div>

              <!-- Cart Items -->
              <div class="space-y-4 mb-6">
                <div
                  v-for="item in cart"
                  :key="item.id"
                  class="flex items-center space-x-3"
                >
                  <img
                    :src="item.image"
                    alt="Product"
                    class="w-12 h-16 object-cover rounded"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {{ item.title }}
                    </div>
                    <div class="text-sm text-gray-500">
                      x {{ item.quantity }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-red-500">
                      ฿{{ (item.price * item.quantity).toLocaleString() }}
                    </div>
                    <div class="text-xs text-gray-400 line-through">
                      ฿{{ (item.price * item.quantity * 1.2).toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Total Summary -->
              <div class="border-t pt-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">ราคาสินค้า:</span>
                  <span>฿{{ totalPrice.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">ภาษี VAT 7%:</span>
                  <span>฿{{ vatAmount.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">ค่าจัดส่ง:</span>
                  <span class="text-green-600">ฟรี</span>
                </div>
                <div
                  class="flex justify-between text-lg font-bold border-t pt-2"
                >
                  <span>ยอดรวมทั้งหมด:</span>
                  <span class="text-red-500"
                    >฿{{ grandTotal.toLocaleString() }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Address Form Modal -->
        <div
          v-if="showAddressForm"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div
            class="bg-white mt-18 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">เพิ่มที่อยู่ใหม่</h3>
              <button
                @click="showAddressForm = false"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

            <form @submit.prevent="saveAddress" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >ชื่อที่อยู่ *</label
                >
                <input
                  v-model="newAddress.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="เช่น บ้าน, ออฟฟิศ"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >ชื่อ-นามสกุล *</label
                >
                <input
                  v-model="newAddress.fullName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >เบอร์โทรศัพท์ *</label
                >
                <input
                  v-model="newAddress.phone"
                  type="tel"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >ที่อยู่ *</label
                >
                <textarea
                  v-model="newAddress.address"
                  required
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="กรอกที่อยู่"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >จังหวัด *</label
                  >
                  <input
                    v-model="newAddress.province"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="กรอกจังหวัด"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >รหัสไปรษณีย์ *</label
                  >
                  <input
                    v-model="newAddress.postalCode"
                    type="text"
                    required
                    pattern="[0-9]{5}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="กรอกรหัสไปรษณีย์"
                  />
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <input
                  v-model="newAddress.isDefault"
                  type="checkbox"
                  id="isDefault"
                  class="text-red-500 focus:ring-red-500"
                />
                <label for="isDefault" class="text-sm text-gray-700">
                  ตั้งเป็นที่อยู่หลัก
                </label>
              </div>

              <div class="flex space-x-3 pt-4">
                <button
                  type="button"
                  @click="showAddressForm = false"
                  class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>