<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const bookId = route.params.id;

const book = ref({
  id: null,
  title: '',
  price: 0,
  category: '',
  description: '',
  categoryId: null,
  author: '',
  isbn: '',
  published: '',
  publisher: '',
  image: '',
  stock: 0, // เปลี่ยนจาก initialQuantity เป็น stock
});

const categories = ref([]);

onMounted(async () => {
  try {
    const categoryResponse = await $fetch('http://localhost:3000/categories');
    categories.value = categoryResponse.map(cat => ({
      id: cat.id,
      name: cat.category_name,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    categories.value = [];
  }

  if (bookId !== 'new') {
    try {
      const bookResponse = await $fetch(`http://localhost:3000/books/${bookId}`);
      if (!bookResponse) {
        router.push('/admin');
        return;
      }
      book.value = {
        id: bookResponse.id,
        title: bookResponse.title,
        price: bookResponse.price,
        category: bookResponse.categories?.[0]?.category?.category_name || '',
        categoryId: bookResponse.categories?.[0]?.category?.id || null,
        description: bookResponse.description || '',
        author: bookResponse.author || '',
        isbn: bookResponse.isbn || '',
        published: bookResponse.published || '',
        publisher: bookResponse.publisher || '',
        image: bookResponse.image || '',
        stock: bookResponse.stock?.quantity ?? 0, // ดึง stock.quantity
      };
    } catch (error) {
      console.error('Error fetching book:', error);
      router.push('/admin');
    }
  }
});

const saveBook = async () => {
  try {
    const payload = {
      title: book.value.title,
      price: book.value.price,
      description: book.value.description,
      categoryIds: book.value.categoryId ? [book.value.categoryId] : [],
      initialQuantity: book.value.stock, // ส่ง stock ไปในชื่อ initialQuantity
      author: book.value.author,
      isbn: book.value.isbn,
      published: book.value.published,
      publisher: book.value.publisher,
      image: book.value.image,
    };

    console.log('Payload being sent:', payload);

    if (bookId === 'new') {
      const response = await $fetch('http://localhost:3000/books', {
        method: 'POST',
        body: payload,
      });
      console.log('POST Response:', response);
      alert('เพิ่มหนังสือสำเร็จ');
    } else {
      const response = await $fetch(`http://localhost:3000/books/${bookId}`, {
        method: 'PUT',
        body: payload,
      });
      console.log('PUT Response:', response);
      alert('แก้ไขหนังสือสำเร็จ');
    }
    router.push('/admin');
  } catch (error) {
    console.error('Error saving book:', error);
    console.log('Error Response:', error.data || error.response?._data);
    alert('เกิดข้อผิดพลาดในการบันทึกหนังสือ: ' + (error.message || 'Unknown error'));
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6 text-amber-600">
        {{ bookId === 'new' ? 'เพิ่มหนังสือใหม่' : 'แก้ไขหนังสือ' }}
      </h2>
      <form @submit.prevent="saveBook">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="title">ชื่อหนังสือ</label>
          <input
            id="title"
            v-model="book.title"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="price">ราคา</label>
          <input
            id="price"
            v-model.number="book.price"
            type="number"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="category">หมวดหมู่</label>
          <select
            id="category"
            v-model="book.categoryId"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            @change="book.category = categories.find(cat => cat.id === book.categoryId)?.name || ''"
          >
            <option value="" disabled>เลือกหมวดหมู่</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="description">คำอธิบาย</label>
          <textarea
            id="description"
            v-model="book.description"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            rows="3"
            style="max-height: 100px; overflow-y: auto;"
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="author">ผู้แต่ง</label>
          <input
            id="author"
            v-model="book.author"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="isbn">ISBN</label>
          <input
            id="isbn"
            v-model="book.isbn"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="published">วันที่ตีพิมพ์</label>
          <input
            id="published"
            v-model="book.published"
            type="date"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="publisher">สำนักพิมพ์</label>
          <input
            id="publisher"
            v-model="book.publisher"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="image">URL รูปภาพ</label>
          <input
            id="image"
            v-model="book.image"
            type="text"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="stock">จำนวนสต็อก</label>
          <input
            id="stock"
            v-model.number="book.stock"
            type="number"
            min="0"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>
        <div class="flex space-x-4">
          <button
            type="submit"
            class="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
          >
            บันทึก
          </button>
          <nuxt-link
            to="/admin"
            class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            ยกเลิก
          </nuxt-link>
        </div>
      </form>
    </div>
  </div>
</template>