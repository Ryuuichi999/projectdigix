<script setup>
definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="bg-amber-50 min-h-screen">
    <Banner />
    <div id="book-list" class="p-6">
      <BookList />
    </div>
  </div>
</template>