const { z } = require("zod");
const prisma = require("../utils/prisma");

// Schema สำหรับ validate ID ใน params
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

// Schema สำหรับสร้างหมวดหมู่
const createCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
});

// Schema สำหรับอัปเดตหมวดหมู่
const updateCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required").optional(),
});

// ฟังก์ชันช่วย validate ด้วย Zod
const validateZod = (schema) => async (value, options) => {
  try {
    await schema.parseAsync(value);
  } catch (err) {
    throw new Error(
      `Validation error: ${err.errors.map((e) => e.message).join(", ")}`
    );
  }
};

// ดึงรายการหมวดหมู่ทั้งหมด
const getAllCategories = {
  description: "Get all categories",
  tags: ["api", "category"],
  auth: false,
  handler: async (request, h) => {
    try {
      const categories = await prisma.category.findMany({
      });
      const formattedCategories = categories.map((category) => ({
        id: category.id,
        category_name: category.category_name,
      }));
      return h.response(formattedCategories).code(200);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return h.response({ message: "Failed to fetch categories" }).code(500);
    }
  },
};

// ดึงหมวดหมู่ตาม ID
const getCategoryById = {
  description: "Get category by ID",
  tags: ["api", "category"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const category = await prisma.category.findUnique({
        where: { id: Number(id) },
        include: {
          bookCategories: {
            include: {
              book: true,
            },
          },
        },
      });
      if (!category)
        return h.response({ message: "Category not found" }).code(404);
      const formattedCategory = {
        id: category.id,
        category_name: category.category_name,
        books: category.bookCategories.map((bc) => bc.book),
      };
      return h.response(formattedCategory).code(200);
    } catch (error) {
      console.error("Error fetching category:", error);
      return h.response({ message: "Failed to fetch category" }).code(500);
    }
  },
};

// สร้างหมวดหมู่ใหม่
const createCategory = {
  description: "Create a new category",
  tags: ["api", "category"],
  auth: false,
  validate: { payload: validateZod(createCategorySchema) },
  handler: async (request, h) => {
    const { category_name } = request.payload;
    try {
      const newCategory = await prisma.category.create({
        data: {
          category_name,
        },
      });
      return h
        .response({ message: "Category created", category: newCategory })
        .code(201);
    } catch (error) {
      console.error("Error creating category:", error);
      return h.response({ message: "Failed to create category" }).code(500);
    }
  },
};

// อัปเดตหมวดหมู่
const updateCategory = {
  description: "Update category by ID",
  tags: ["api", "category"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
    payload: validateZod(updateCategorySchema),
  },
  handler: async (request, h) => {
    const { id } = request.params;
    const { category_name } = request.payload;
    try {
      const category = await prisma.category.findUnique({
        where: { id: Number(id) },
      });
      if (!category)
        return h.response({ message: "Category not found" }).code(404);
      const updatedCategory = await prisma.category.update({
        where: { id: Number(id) },
        data: {
          category_name,
        },
      });
      return h
        .response({ message: "Category updated", category: updatedCategory })
        .code(200);
    } catch (error) {
      console.error("Error updating category:", error);
      return h.response({ message: "Failed to update category" }).code(500);
    }
  },
};

// ลบหมวดหมู่
const deleteCategory = {
  description: "Delete category by ID",
  tags: ["api", "category"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const category = await prisma.category.findUnique({
        where: { id: Number(id) },
      });
      if (!category)
        return h.response({ message: "Category not found" }).code(404);

      // ลบความสัมพันธ์ใน BookCategory ก่อน
      await prisma.bookCategory.deleteMany({
        where: { category_id: Number(id) },
      });

      // ลบหมวดหมู่
      await prisma.category.delete({
        where: { id: Number(id) },
      });

      return h.response({ message: "Category deleted" }).code(200);
    } catch (error) {
      console.error("Error deleting category:", error);
      return h.response({ message: "Failed to delete category" }).code(500);
    }
  },
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
