import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const POST = auth(async function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (JSON.parse(req.auth?.user?.image || "{}").role !== "admin") {
    return NextResponse.json(
      { message: "You are not role admin" },
      { status: 403 },
    );
  }

  const url = new URL(`${process.env.HOOK_URL}/convert-svg`);
  url.searchParams.set("actions", req.nextUrl.searchParams.get("actions")!);

  if (!process.env.HOOK_SIGNATURE) {
    return NextResponse.json(
      { message: "Hook signature is not set" },
      { status: 500 },
    );
  }

  return await fetch(url, {
    method: "POST",
    body: await req.text(),
    headers: {
      "X-Hook-Signature": process.env.HOOK_SIGNATURE,
    },
  });
}) as any;
