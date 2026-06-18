// app/api/notes/route.ts — ⚠️ CODE VOLONTAIREMENT VULNÉRABLE (labo)
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

// GET /api/notes → "mes" notes (celles du user connecté)
export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const db = getDb();

  // ⚠️ FAILLE : sessionId COLLÉ dans la requête → injection SQL possible via le cookie
  const sql = `SELECT * FROM notes WHERE userId = ${sessionId}`;
  console.log("🔎 SQL exécuté :", sql);

  const rows = db(sql);
  return NextResponse.json({ notes: rows });
}

// POST /api/notes → créer une note
export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  // ⚠️ FAILLE : AUCUNE validation d'entrée (pas de Zod). On accepte n'importe quoi.
  // ⚠️ FAILLE : pas de jeton anti-CSRF sur cette écriture.
  const { titre, contenu } = await req.json();
  const db = getDb();

  const nextId =
    (db("SELECT MAX(id) AS m FROM notes")[0] as { m: number }).m + 1;

  // ⚠️ FAILLE : titre/contenu COLLÉS dans la requête → injection SQL
  const sql = `INSERT INTO notes VALUES (${nextId}, ${sessionId}, '${titre}', '${contenu}')`;
  console.log("🔎 SQL exécuté :", sql);
  db(sql);

  return NextResponse.json({ message: "Note créée", id: nextId });
}