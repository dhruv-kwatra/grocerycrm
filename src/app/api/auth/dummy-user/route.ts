import { NextResponse } from "next/server";
import { registerCustomDummyUser, getAllDummyUsers, type DummyUser } from "@/lib/auth/dummy-users";

export async function GET() {
  return NextResponse.json({ users: getAllDummyUsers() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, password, id, tenantId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const roleMap: Record<string, string> = {
      superadmin: "Platform Staff",
      brand: "Brand",
      distributor: "Distributor",
      partner: "Partner",
      store_manager: "Store Manager",
      store_associate: "Store Associate",
    };

    const isSuper = role === "superadmin";
    const selectedRole = (role || "brand") as DummyUser["role"];

    const newUser = registerCustomDummyUser({
      id: id ? Number(id) : undefined,
      tenantId: tenantId ? Number(tenantId) : 1,
      name,
      email: email.trim().toLowerCase(),
      role: selectedRole,
      roleLabel: roleMap[selectedRole] || "Retail User",
      isSuperAdmin: isSuper,
      password: password || "password123",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create dummy user" },
      { status: 500 }
    );
  }
}
