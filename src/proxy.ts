import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Pemeriksaan OPTIMISTIK saja (cookie ada atau tidak) untuk mengarahkan ke /login lebih cepat.
 * Otorisasi sebenarnya (validasi sesi di DB + peran) dilakukan di server pada setiap halaman,
 * server action, dan route handler lewat `requireUser` / `apiUser`.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/juri/:path*"],
};

