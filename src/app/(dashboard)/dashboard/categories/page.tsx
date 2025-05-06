import React from "react";
import CategoryList from "./category-list";

const CategoryPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Categories</h1>
      <CategoryList />
    </div>
  );
};

export default CategoryPage;
