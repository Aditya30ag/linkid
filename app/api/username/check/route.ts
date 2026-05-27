import prisma from "@/lib/prisma";
import { normalizeUsername, validateUsername } from "@/lib/validations/username";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

async function isAvailable(username: string): Promise<boolean> {
    const [user, alias] = await Promise.all([
        prisma.user.findUnique({ where: { username } }),
        prisma.userAlias.findUnique({ where: { username } }),
    ]);

    return !user && !alias;
}

function getClientKey(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    return forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "anonymous";
}

function isRateLimited(request: Request): boolean {
    const key = getClientKey(request);
    const now = Date.now();
    const current = rateLimitState.get(key);

    if (!current || current.resetAt <= now) {
        rateLimitState.set(key, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }

    current.count += 1;
    if (current.count > RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    return false;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        },
    });
}

export async function GET(req: Request) {
    if (isRateLimited(req)) {
        return jsonResponse({ error: "Too many requests" }, 429);
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const normalizedUsername = username ? normalizeUsername(username) : null;

    if (!normalizedUsername) {
        return jsonResponse({ available: false, suggestions: [] });
    }

    const available = await isAvailable(normalizedUsername);

    if (available) {
        return jsonResponse({ available: true, suggestions: [] });
    }

    const year = new Date().getFullYear().toString().slice(-2);
    const short = normalizedUsername.slice(0, 5);
    const abbr = normalizedUsername.replace(/[aeiou]/gi, "").slice(0, 6) || short;
    const rand = Math.floor(10 + Math.random() * 90);

    const candidates = [...new Set([
        abbr !== normalizedUsername ? abbr : null,
        `${normalizedUsername}.dev`,
        `the${normalizedUsername}`,
        `${normalizedUsername}hq`,
        `i${normalizedUsername}`,
        `${short}${year}`,
        `${normalizedUsername}.${year}`,
        `${normalizedUsername}${rand}`,
    ].filter(Boolean) as string[])];

    const suggestions: string[] = [];
    for (const candidate of candidates) {
        if (!validateUsername(candidate).valid) {
            continue;
        }

        if (await isAvailable(candidate)) {
            suggestions.push(candidate);
        }

        if (suggestions.length === 5) break;
    }

    return jsonResponse({ available: false, suggestions });
}
