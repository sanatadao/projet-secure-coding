// app/api/profil/route.ts — ✅ CORRIGÉ : vérification du jeton CSRF (double-submit)
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  // ✅ CORRIGÉ : on compare le jeton du cookie avec celui envoyé dans le header
  const jetonCookie = req.cookies.get("csrf_token")?.value;
  const jetonHeader = req.headers.get("x-csrf-token");

  if (!jetonCookie || !jetonHeader || jetonCookie !== jetonHeader) {
    return NextResponse.json({ error: "Jeton CSRF invalide" }, { status: 403 });
  }

  const form = await req.formData();
  const nouvelEmail = String(form.get("email") ?? "");

  const db = getDb();
  db("UPDATE users SET email = ? WHERE id = ?", [nouvelEmail, Number(sessionId)]);

  return NextResponse.json({ message: `Email du compte ${sessionId} changé en ${nouvelEmail}` });
}
