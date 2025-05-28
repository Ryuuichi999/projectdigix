<template>
  <section
    class="relative w-full overflow-hidden text-center text-white h-[300px] bg-slide"
  ></section>
</template>

<style scoped>
.bg-slide {
  background-image: url("/images/สืบสวน.jpg"); 
  background-repeat: repeat-x;
  background-size: auto;
  animation: slideBackground 30s linear infinite;
}

@keyframes slideBackground {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
