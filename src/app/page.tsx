import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  if (u.role === "ADMIN" && u.mustChangePassword) redirect("/ganti-password");
  redirect(u.role === "ADMIN" ? "/admin" : "/juri");
}
