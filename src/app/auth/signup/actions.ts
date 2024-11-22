// "use server";

// import {
//   signupSchema,
//   type SignupFormData,
// } from "@/lib/validations/signup-schema";
// import { NextResponse } from "next/server";
// import bcryptjs from "bcryptjs"
// import dbConnect from "@/lib/dbConnect";
// import User from "@/models/user.model";

// export async function signup(data: SignupFormData) {
//   const result = signupSchema.safeParse(data);

//   if (!result.success) {
//     throw new Error(result.error.message);
//   }

//   try {
//     await dbConnect();

//     const { name, email, password } =  result.data;

//     if (!name || !email || !password) {
//       return NextResponse.json(
//         { message: "All fields are required." },
//         { status: 400 }
//       );
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return NextResponse.json(
//         { message: "Email already exists." },
//         { status: 400 }
//       );
//     }

//     const salt = await bcryptjs.genSalt(10);
//     const hashedPassword = await bcryptjs.hash(password, salt);

//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     await newUser.save();

//     return NextResponse.json(
//       { message: "User created successfully", data: newUser },
//       { status: 201 }
//     );
//   } catch (error) {
//     return internalErro("Error in signup controller", error);
//   }

//   return { success: true };
// }
