<template>
  <footer class="bg-amber-100 text-gray-700 py-6 mt-8">
    <div
      class="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center"
    >
      <!-- คอลัมน์ข้อมูล -->
      <div class="mb-6 md:mb-0 text-center pl-20">
        <h3 class="text-xl font-semibold text-amber-800 mb-2">
          ร้านหนังสือของเรา
        </h3>
        <p class="text-sm">555 ถนนสุดหล่อ ขอนแก่น 40000</p>
        <p class="text-sm">อีเมล: Ryuuichi@gmail.com | โทร: 000-000-0000</p>
      </div>

      <!-- โซเชียลมีเดีย -->
      <div class="text-center pr-20">
        <h4 class="text-lg font-medium text-amber-800 mb-2">ติดตามเรา</h4>
        <div class="flex justify-center space-x-6">
          <a href="https://facebook.com" class="hover:text-amber-600 transition-colors text-lg flex items-center">
            <i class="fab fa-facebook-f mr-2"></i> Facebook
          </a>
          <a href="https://twitter.com" class="hover:text-amber-600 transition-colors text-lg flex items-center">
            <i class="fab fa-twitter mr-2"></i> Twitter
          </a>
          <a href="https://instagram.com" class="hover:text-amber-600 transition-colors text-lg flex items-center">
            <i class="fab fa-instagram mr-2"></i> Instagram
          </a>
        </div>
      </div>
    </div>

    <!-- ลิขสิทธิ์ -->
    <div class="mt-6 text-center text-sm border-t border-amber-200 pt-4">
      <p>&copy; 2025 ร้านหนังสือของเรา. สงวนลิขสิทธิ์ทั้งหมด.</p>
    </div>
  </footer>
</template>

<style scoped>
footer a {
  text-decoration: none;
}
</style>
