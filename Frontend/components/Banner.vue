<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const slides = ref([
  {
    image: "/images/สืบสวน.jpg",
    title: "โปรโมชันพิเศษ!",
    description: "ซื้อครบ 500 บาท แถมเจ้าของเว็บ",
  },
  {
    image: "/images/wallpapers4.jpg",
    title: "หนังสือใหม่มาแรง",
    description: "ค้นพบนิยายล่าสุดของเรา",
  },
  {
    image: "/images/wallpapers3.jpg",
    title: "หนังสือการ์ตูนมากมาย",
    description: "หนังสือการ์ตูนที่เราคิดถึง",
  },
]);

const currentSlide = ref(0);

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length;
};

const prevSlide = () => {
  currentSlide.value =
    (currentSlide.value - 1 + slides.value.length) % slides.value.length;
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

let intervalId = null;
onMounted(() => {
  intervalId = setInterval(nextSlide, 5000);
});
onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
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
.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}
</style>

<template>
  <section class="relative w-full h-[370px] overflow-hidden">
    <div
      v-for="(slide, index) in slides"
      :key="index"
      class="absolute inset-0 transition-opacity duration-1000"
      :class="{
        'opacity-100': currentSlide === index,
        'opacity-0': currentSlide !== index,
      }"
    >
      <img
        :src="slide.image"
        :alt="slide.title"
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-black/50 flex items-center justify-center text-white"
      >
        <div class="text-center animate-slide-up">
          <h2 class="text-3xl md:text-4xl font-bold drop-shadow-lg">
            {{ slide.title }}
          </h2>
          <p class="mt-2 text-lg md:text-xl">{{ slide.description }}</p>
        </div>
      </div>
    </div>
    <!-- Navigation Dots -->
    <div
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
    >
      <button
        v-for="(slide, index) in slides"
        :key="index"
        @click="goToSlide(index)"
        class="w-3 h-3 rounded-full"
        :class="{
          'bg-amber-400': currentSlide === index,
          'bg-white/50': currentSlide !== index,
        }"
      ></button>
    </div>
    <!-- Navigation Arrows -->
    <button
      @click="prevSlide"
      class="absolute cursor-pointer left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-amber-400"
    >
      ❮
    </button>
    <button
      @click="nextSlide"
      class="absolute cursor-pointer right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-amber-400"
    >
      ❯
    </button>
  </section>
</template>
