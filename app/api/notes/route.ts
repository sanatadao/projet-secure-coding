// app/api/notes/route.ts — ✅ CORRIGÉ : paramétrage SQL + validation Zod
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";
import { noteSchema } from "@/lib/validation";

export const runtime = "nodejs";

// GET /api/notes → "mes" notes (celles du user connecté)
export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const db = getDb();

  // ✅ CORRIGÉ : requête paramétrée — le cookie n'est plus collé dans le SQL
  const sql = `SELECT * FROM notes WHERE userId = ?`;
  const rows = db(sql, [Number(sessionId)]);
  return NextResponse.json({ notes: rows });
}

// POST /api/notes → créer une note
export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await req.json();

  // ✅ CORRIGÉ : validation Zod avant tout usage des données
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { titre, contenu } = parsed.data;

  const db = getDb();
  const nextId =
    (db("SELECT MAX(id) AS m FROM notes")[0] as { m: number }).m + 1;

  // ✅ CORRIGÉ : requête paramétrée — titre/contenu ne sont plus collés dans le SQL
  const sql = `INSERT INTO notes VALUES (?, ?, ?, ?)`;
  db(sql, [nextId, Number(sessionId), titre, contenu]);

  return NextResponse.json({ message: "Note créée", id: nextId });
}