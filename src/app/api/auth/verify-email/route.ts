import {
  sendVerificationAgain,
  verifyEmail,
} from "@/controllers/auth.controller";

export const GET = verifyEmail;
export const POST = sendVerificationAgain;
