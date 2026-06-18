// app/commentaires/page.tsx — ⚠️ XSS STOCKÉ : on injecte du HTML brut venu d'un utilisateur — labo
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export default function CommentairesPage() {
  const db = getDb();
  const comments = db("SELECT * FROM comments") as Array<{
    id: number;
    author: string;
    html: string;
  }>;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Commentaires</h1>
      {comments.map((c) => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <b>{c.author} :</b>{" "}
          {/* ⚠️ FAILLE : HTML brut d'un utilisateur injecté tel quel */}
          <span dangerouslySetInnerHTML={{ __html: c.html }} />
        </div>
      ))}
    </main>
  );
}