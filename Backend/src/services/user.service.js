const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async () => {
  return await prisma.user.findMany();
};

const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id: Number(id) } });
};

const createUser = async (data) => {
  return await prisma.user.create({ data });
};

const updateUser = async (id, data) => {
  return await prisma.user.update({ where: { id: Number(id) }, data });
};

const deleteUser = async (id) => {
  return await prisma.user.delete({ where: { id: Number(id) } });
};

module.exports = {
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};