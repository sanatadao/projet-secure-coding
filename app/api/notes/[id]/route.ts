// app/api/notes/[id]/route.ts — ⚠️ IDOR : aucune vérification de propriété — labo
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ⚙️ Next 15+ : params est asynchrone
  const db = getDb();

  // La requête est paramétrée (pas d'injection ICI)…
  const rows = db("SELECT * FROM notes WHERE id = ?", [Number(id)]);
  if (!rows.length) {
    return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  }

  // ⚠️ FAILLE (IDOR) : on renvoie la note SANS vérifier qu'elle appartient au user connecté.
  return NextResponse.json({ note: rows[0] });
}