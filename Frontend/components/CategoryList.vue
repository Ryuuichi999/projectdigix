<template>
  <section class="py-8 max-w-5xl mx-auto">
    <h2 class="text-xl font-semibold mb-4">หมวดหมู่ทั้งหมด</h2>
    <div class="flex flex-row gap-4">
      <nuxt-link
        v-for="(category, index) in categories"
        :key="index"
        :to="`/category/${category.value}`"
        class="flex items-center justify-between bg-white rounded shadow p-4 cursor-pointer hover:bg-gray-50 transition w-1/4"
      >
        <span
          :class="{
            'text-red-500': $route.path === `/category/${category.value}`,
            'text-gray-800': $route.path !== `/category/${category.value}`
          }"
        >
          {{ category.name }}
        </span>
        <Icon name="mdi:chevron-right" class="text-gray-500" />
      </nuxt-link>
    </div>
  </section>
</template>

<script>
export default {
  name: 'CategoryList',
  data() {
    return {
      categories: [
        { name: 'นิยาย', value: 'novel' },
        { name: 'การ์ตูน', value: 'comic' },
        { name: 'วิชาการ', value: 'academic' },
        { name: 'อื่นๆ', value: 'others' },
      ],
    };
  },
};
</script>