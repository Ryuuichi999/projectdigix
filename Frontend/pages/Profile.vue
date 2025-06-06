<script setup>
import { ref, onMounted } from "vue";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const router = useRouter();
const userId = ref(null);
const userName = ref("");
const userEmail = ref("");
const password = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);

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
      Swal.fire({
        icon: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องล็อกอินเพื่อจัดการโปรไฟล์",
        confirmButtonColor: "#f59e0b",
      });
      router.push("/auth/login");
      return;
    }
    userId.value = Number(user.id);
    userName.value = user.username || user.email?.split("@")[0] || "ผู้ใช้";
    userEmail.value = user.email || "";
    fetchUser();
  }
});

const fetchUser = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch(
      `http://localhost:3000/users/${userId.value}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    userName.value =
      response.username || response.email?.split("@")[0] || "ผู้ใช้";
    userEmail.value = response.email || "";
  } catch (error) {
    console.error("Error fetching user:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
      confirmButtonColor: "#f59e0b",
    });
  } finally {
    isLoading.value = false;
  }
};

const updateProfile = async () => {
  if (!userName.value.trim() || !userEmail.value.trim()) {
    Swal.fire({
      icon: "warning",
      title: "ข้อมูลไม่ครบ",
      text: "กรุณากรอกชื่อและอีเมล",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  if (password.value && password.value !== confirmPassword.value) {
    Swal.fire({
      icon: "warning",
      title: "รหัสผ่านไม่ตรงกัน",
      text: "กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่าน",
      confirmButtonColor: "#f59e0b",
    });
    return;
  }

  isLoading.value = true;
  try {
    const body = {
      username: userName.value,
      email: userEmail.value,
    };
    if (password.value) {
      body.password = password.value;
    }

    await $fetch(`http://localhost:3000/users/${userId.value}`, {
      method: "PUT",
      body,
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        username: userName.value,
        email: userEmail.value,
      })
    );

    Toast.fire({
      icon: "success",
      title: "อัปเดตโปรไฟล์สำเร็จ",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    Swal.fire({
      icon: "error",
      title: "ข้อผิดพลาด",
      text: error.data?.message || "ไม่สามารถอัปเดตโปรไฟล์ได้",
      confirmButtonColor: "#f59e0b",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-amber-100 via-white to-amber-100 py-12"
  >
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="text-sm text-blue-500 hover:underline mb-4 block ml-50">
        ← ย้อนกลับ
      </NuxtLink>
      <!-- Header -->
      <div class="mb-8 text-center animate-fade-in">
        <h1 class="text-2xl font-bold text-gray-900 sm:text-4xl drop-shadow-md">
          จัดการข้อมูลส่วนตัว
        </h1>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500"
        ></div>
      </div>

      <!-- Profile Form -->
      <div v-else class="flex justify-center mx-auto animate-slide-up">
        <div
          class="flex-1 max-w-md bg-white rounded-2xl shadow-xl p-8 border border-amber-100 sm:p-6"
        >
          <!-- Form -->
          <div class="space-y-5">
            <!-- Name -->
            <div class="relative">
              <label for="name" class="block text-sm font-medium text-gray-700"
                >ชื่อ</label
              >
              <div class="relative mt-1.5 rounded-md">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  v-model="userName"
                  id="name"
                  type="text"
                  class="block w-full pl-10 pr-3 py-2 rounded-md border-gray-200 focus:border-amber-500 focus:ring-amber-500 sm:text-sm transition duration-200"
                  placeholder="กรอกชื่อของคุณ"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="relative">
              <label for="email" class="block text-sm font-medium text-gray-700"
                >อีเมล</label
              >
              <div class="relative mt-1.5 rounded-md">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  v-model="userEmail"
                  id="email"
                  type="email"
                  class="block w-full pl-10 pr-3 py-2 rounded-md border-gray-200 focus:border-amber-500 focus:ring-amber-500 sm:text-sm transition duration-200"
                  placeholder="กรอกอีเมลของคุณ"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="relative">
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
                >รหัสผ่านใหม่</label
              >
              <div class="relative mt-1.5 rounded-md">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 .9 2 2zm6 8H6v-1c0-2.2 3.6-4 6-4s6 1.8 6 4v1z"
                    />
                  </svg>
                </div>
                <input
                  v-model="password"
                  id="password"
                  type="password"
                  class="block w-full pl-10 pr-3 py-2 rounded-md border-gray-200 focus:border-amber-500 focus:ring-amber-500 sm:text-sm transition duration-200"
                  placeholder="กรอกรหัสผ่านใหม่"
                />
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="relative">
              <label
                for="confirm-password"
                class="block text-sm font-medium text-gray-700"
                >ยืนยันรหัสผ่าน</label
              >
              <div class="relative mt-1.5 rounded-md">
                <div
                  class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                >
                  <svg
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 .9 2 2zm6 8H6v-1c0-2.2 3.6-4 6-4s6 1.8 6 4v1z"
                    />
                  </svg>
                </div>
                <input
                  v-model="confirmPassword"
                  id="confirm-password"
                  type="password"
                  class="block w-full pl-10 pr-3 py-2 rounded-md border-gray-200 focus:border-amber-500 focus:ring-amber-500 sm:text-sm transition duration-200"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-3">
              <button
                @click="router.push('/')"
                class="px-6 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200ms"
              >
                ยกเลิก
              </button>
              <button
                @click="updateProfile"
                class="px-16 py-2 cursor-pointer text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-amber-600 rounded-lg hover:from-rose-600 hover:to-rose-700 transition duration-200 flex items-center space-x-2 shadow-md"
                :disabled="isLoading"
              >
                <svg
                  v-if="isLoading"
                  class="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span>{{
                  isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}
</style>
