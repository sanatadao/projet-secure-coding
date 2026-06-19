// lib/validation.ts — schémas de validation des entrées (défense en profondeur)
import { z } from "zod";

export const noteSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(120, "Titre trop long"),
  contenu: z.string().max(5000, "Contenu trop long"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
