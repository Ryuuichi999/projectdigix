<script setup>
definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="bg-amber-50 min-h-screen">
    <!-- Story Section -->
    <section class="py-12 max-w-5xl mx-auto px-4">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6 text-center">เรื่องราวของเรา</h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="flex flex-col justify-center">
          <p class="text-gray-600 leading-relaxed">
            ร้านหนังสือของเราเริ่มต้นจากความฝันเล็ก ๆ ที่อยากให้ทุกคนมีโอกาสเข้าถึงหนังสือดี ๆ แม้เราจะมีหนังสือไม่มาก แต่ทุกเล่มถูกคัดสรรด้วยใจ
          </p>
          <p class="mt-4 text-gray-600 leading-relaxed">
            ด้วยสโลแกน <span class="text-amber-600 font-semibold">"ร้านที่รวบรวมหนังสือน้อยที่สุดในประเทศไทย"</span> เรามุ่งมั่นสร้างประสบการณ์การเลือกซื้อที่อบอุ่นและเป็นกันเอง
          </p>
        </div>
        <img src="/images/สืบสวน.jpg" alt="Bookstore Story" class="w-full h-64 object-cover rounded-lg shadow-md animate-slide-up" />
      </div>
    </section>

    <!-- Team Section -->
    <section class="py-16 bg-amber-100">
      <div class="max-w-5xl mx-auto px-4">
        <h2 class="text-3xl font-semibold text-gray-800 mb-8 text-center">ทีมงานของเรา</h2>
        <div class="flex justify-center">
          <div class="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up max-w-md w-full text-center">
            <img
              :src="team[0].image"
              :alt="team[0].name"
              class="w-40 h-40 mx-auto rounded-full object-cover mb-6 border-4 border-amber-300"
            />
            <h3 class="text-2xl font-bold text-gray-800">{{ team[0].name }}</h3>
            <p class="text-lg text-gray-500 mt-2">{{ team[0].role }}</p>
            <p class="text-sm text-amber-600 font-semibold mt-4">
              สร้างเว็บนี้ด้วยใจคนเดียว เพื่อส่งต่อความรักในหนังสือสู่ทุกคน
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      team: [
        { name: "Ryuuichi", role: "ผู้ก่อตั้ง", image: "/images/Ryu.jpg" },
      ],
    };
  },
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}
.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}
</style>