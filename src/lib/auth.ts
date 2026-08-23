import { and, gte, eq, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

import { getDb } from "@/db";
import { loginAttempts } from "@/db/schema";
import { secret } from "./env";

const COOKIE = "vitrine_sessao";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

/** Janela e teto do limitador de tentativas por IP. */
const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 10;

const key = async () => new TextEncoder().encode(await secret("ADMIN_SESSION_SECRET"));

/**
 * Compara em tempo constante: um `===` normal sai no primeiro caractere
 * diferente e vaza, pelo tempo de resposta, quanto do prefixo estava certo.
 */
function constantTimeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export async function hasSession(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, await key());
    return true;
  } catch {
    return false;
  }
}

/** Barreira das server actions: nenhuma escrita acontece sem passar por aqui. */
export async function requireSession() {
  if (!(await hasSession())) {
    throw new Error("Sessão expirada. Entre de novo para continuar.");
  }
}

async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(password: string): Promise<LoginResult> {
  const expected = await secret("ADMIN_PASSWORD");
  if (!expected) {
    return { ok: false, error: "ADMIN_PASSWORD não está configurada no servidor." };
  }

  const db = await getDb();
  const ip = await clientIp();
  const since = Math.floor(Date.now() / 1000) - WINDOW_SECONDS;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), gte(loginAttempts.at, since)));

  if (count >= MAX_ATTEMPTS) {
    return {
      ok: false,
      error: "Muitas tentativas. Espere 15 minutos antes de tentar de novo.",
    };
  }

  if (!constantTimeEqual(password, expected)) {
    await db.insert(loginAttempts).values({ ip });
    return { ok: false, error: "Senha incorreta." };
  }

  // Login certo zera o historico do IP e limpa o que ja saiu da janela.
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));

  const token = await new SignJWT({ role: "vendedor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(await key());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
