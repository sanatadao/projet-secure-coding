// app/api/login/route.ts — ✅ CORRIGÉ : paramétrage SQL + bcrypt + message neutre + réponse minimale + cookie sûr
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();

  // ✅ CORRIGÉ : requête paramétrée — email/password ne sont plus collés dans le SQL
  const sql = `SELECT * FROM users WHERE email = ?`;
  const rows = db(sql, [email]) as Array<{
    id: number;
    email: string;
    password: string;
    role: string;
  }>;

  // ✅ CORRIGÉ : message neutre, identique que l'email existe ou non (anti-énumération)
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide" },
      { status: 401 }
    );
  }

  const user = rows[0];

  // ✅ CORRIGÉ : comparaison via bcrypt, jamais de comparaison de clair
  const motDePasseValide = await bcrypt.compare(password, user.password);
  if (!motDePasseValide) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide" },
      { status: 401 }
    );
  }

  // ✅ CORRIGÉ : on ne renvoie que le strict nécessaire, jamais le hash du mot de passe
  const res = NextResponse.json({
    message: "Connecté",
    user: { id: user.id, email: user.email, role: user.role },
  });

  // ✅ CORRIGÉ : cookie httpOnly (illisible en JS, donc involable par XSS) + secure + sameSite
  res.cookies.set("mininotes_session", String(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}