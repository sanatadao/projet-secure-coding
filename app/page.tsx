// app/page.tsx
export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", lineHeight: 1.7 }}>
      <h1>MiniNotes 📝 (labo — volontairement vulnérable)</h1>
      <p>Routes disponibles :</p>
      <ul>
        <li><code>POST /api/login</code> — se connecter</li>
        <li><code>GET /api/notes</code> — mes notes</li>
        <li><code>GET /api/notes/[id]</code> — une note précise</li>
        <li><code>POST /api/notes</code> — créer une note</li>
        <li><code>POST /api/profil</code> — changer son email</li>
        <li><a href="/commentaires">/commentaires</a> — page publique</li>
      </ul>
    </main>
  );
}