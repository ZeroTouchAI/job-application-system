import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const { password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: { email, passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Registration failed:", err);
    return NextResponse.json(
      {
        error:
          "Registration failed on the server. This usually means the database connection isn't configured correctly. Check DATABASE_URL.",
      },
      { status: 500 }
    );
  }
}
