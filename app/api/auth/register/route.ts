import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 }
            );
        }
        const normalizedEmail = email.toLowerCase().trim();

        const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { error: "Password does not meet requirements" },
                { status: 400 }
            );
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            await prisma.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    password: hashedPassword,
            },
        });
    } catch (err: any) {
        if (err.code === "P2002") {

      return NextResponse.json (
        {error: "User already exists"},
        {status: 409} 
    );
    }
    throw err;
    }
        return NextResponse.json ({ success: true, message: "User created successfully"},
        {status: 201}
    );

    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
