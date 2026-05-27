import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeUsername, validateUsername } from "@/lib/validations/username";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username } = body;
    const userId = session.user.id;
    if (typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const normalizedUsername = normalizeUsername(username);

    const validation = validateUsername(normalizedUsername);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const [existingUser, existingAlias] = await Promise.all([
      prisma.user.findUnique({ where: { username: normalizedUsername } }),
      prisma.userAlias.findUnique({ where: { username: normalizedUsername } }),
    ]);

    if (existingUser || existingAlias) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username: normalizedUsername },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Username create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
