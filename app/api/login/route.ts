// app/api/login/route.ts — ✅ CORRIGÉ : paramétrage SQL + bcrypt + message neutre + réponse minimale + cookie sûr + rate limiting + jeton CSRF
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/sqldb";
import { autoriser } from "@/lib/rateLimit";
import { genererJetonCsrf } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

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

  // ✅ CORRIGÉ : jeton CSRF posé en cookie LISIBLE (pas httpOnly) — le double-submit en a besoin
  const jetonCsrf = genererJetonCsrf();
  res.cookies.set("csrf_token", jetonCsrf, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
