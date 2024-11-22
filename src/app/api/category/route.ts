import {
  createCategory,
  getCategories,
} from "@/controllers/category.controller";

const POST = createCategory;
const GET = getCategories;

export { POST, GET };
