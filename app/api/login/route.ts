// app/api/login/route.ts — ✅ CORRIGÉ : paramétrage SQL + bcrypt + message neutre + réponse minimale + cookie sûr + rate limiting
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/sqldb";
import { autoriser } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // ✅ CORRIGÉ : rate limiting — on bloque après 5 tentatives en 60s pour cet email
  if (!autoriser(email)) {
    return NextResponse.json(
      { error: "Trop de tentatives, réessaie plus tard" },
      { status: 429 }
    );
  }

  const db = getDb();

  const sql = `SELECT * FROM users WHERE email = ?`;
  const rows = db(sql, [email]) as Array<{
    id: number;
    email: string;
    password: string;
    role: string;
  }>;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide" },
      { status: 401 }
    );
  }

  const user = rows[0];

  const motDePasseValide = await bcrypt.compare(password, user.password);
  if (!motDePasseValide) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    message: "Connecté",
    user: { id: user.id, email: user.email, role: user.role },
  });

  res.cookies.set("mininotes_session", String(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
