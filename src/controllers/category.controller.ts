import { NextResponse } from "next/server";
import { internalError } from "./internalError";
import dbConnect from "@/lib/dbConnect";
import Category from "@/models/category.model";

export const createCategory = async (req: Request) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    await dbConnect();

    const { name } = await req.json();

    const newCategory = new Category({
      name,
    });

    await newCategory.save();

    return NextResponse.json(
      { message: "Category created successfully", data: newCategory },
      { status: 201 }
    );
  } catch (error) {
    return internalError("Error in createCategory controller", error);
  }
};

export const getCategories = async (req: Request) => {
  if (req.method !== "GET") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    await dbConnect();

    const categories = await Category.find();

    return NextResponse.json(
      { message: "Categories fetched successfully", data: categories },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in getCategory controller", error);
  }
};

export const deleteCategory = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (req.method !== "DELETE") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    await dbConnect();

    const { id } = await params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Category deleted successfully", data: deletedCategory },
      { status: 202 }
    );
  } catch (error) {
    return internalError("Error in deleteCategory controller", error);
  }
};

export const updateCategory = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  if (req.method !== "PUT") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 404 }
    );
  }

  try {
    await dbConnect();

    const { name } = await req.json();
    const { id } = await params;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    return NextResponse.json(
      { message: "Category updated successfully", data: updatedCategory },
      { status: 200 }
    );
  } catch (error) {
    return internalError("Error in updateCategory controller", error);
  }
};
