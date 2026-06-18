// app/api/login/route.ts — ⚠️ CODE VOLONTAIREMENT VULNÉRABLE (labo)
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();

  // ⚠️ FAILLE : entrées COLLÉES dans la requête → injection SQL
  const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  console.log("🔎 SQL exécuté :", sql); // pour VOIR l'injection dans le terminal

  const rows = db(sql) as Array<{ id: number; email: string; role: string }>;

  if (rows.length === 0) {
    // ⚠️ FAILLE : message TROP précis → énumération d'emails. Aucune limite de tentatives → brute force.
    return NextResponse.json(
      { error: `Aucun compte ${email} avec ce mot de passe` },
      { status: 401 }
    );
  }

  const user = rows[0];
  // ⚠️ FAILLE : on renvoie TOUT l'objet user (mot de passe + rôle compris)
  const res = NextResponse.json({ message: "Connecté", user });

  // ⚠️ FAILLE : cookie de session LISIBLE en JS (httpOnly:false) → volable par XSS
  res.cookies.set("mininotes_session", String(user.id), { httpOnly: false, path: "/" });
  return res;
}