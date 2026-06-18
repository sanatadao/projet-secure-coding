// app/api/profil/route.ts — ⚠️ action sensible SANS jeton anti-CSRF — labo
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // on identifie l'utilisateur UNIQUEMENT via le cookie de session
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  // on accepte un formulaire classique (form-urlencoded) → exploitable par un <form> pirate
  const form = await req.formData();
  const nouvelEmail = String(form.get("email") ?? "");

  const db = getDb();
  // ⚠️ FAILLE (CSRF) : aucune vérification d'un jeton anti-CSRF. Le cookie suffit à agir.
  db("UPDATE users SET email = ? WHERE id = ?", [nouvelEmail, Number(sessionId)]);

  return NextResponse.json({ message: `Email du compte ${sessionId} changé en ${nouvelEmail}` });
}