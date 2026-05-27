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

    const user = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, name: true },
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      if (currentUser.username) {
        throw new Error("Username already set");
      }

      const [existingUser, existingAlias] = await Promise.all([
        tx.user.findUnique({ where: { username: normalizedUsername }, select: { id: true } }),
        tx.userAlias.findUnique({ where: { username: normalizedUsername }, select: { id: true } }),
      ]);

      if (existingUser || existingAlias) {
        throw new Error("Username already taken");
      }

      return tx.user.update({
        where: { id: userId },
        data: { username: normalizedUsername },
        select: {
          id: true,
          username: true,
          name: true,
        },
      });
    });

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string };
    if (err.message === "Username already set") {
      return NextResponse.json({ error: "Username already set" }, { status: 409 });
    }
    if (err.message === "Username already taken") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Username create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
