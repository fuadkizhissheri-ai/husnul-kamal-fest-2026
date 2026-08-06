import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'husnul-kamal-meelad-fest-2026-secret-key-super-secure'
);

const COOKIE_NAME = 'hk_admin_session';

export interface AdminPayload {
  id: string;
  username: string;
  role: string;
}

export async function createAdminSession(payload: AdminPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return token;
}

export async function verifyAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value;

    const headersList = await headers();

    // Fallback 1: Bearer Token in Authorization header
    if (!token) {
      const authHeader = headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      return payload as unknown as AdminPayload;
    }

    // Fallback 2: API Keys for external apps or missing session
    const publicKey = headersList.get('x-public-key');
    const merchantId = headersList.get('x-merchant-id');
    
    // Handle missing env variables gracefully
    const envPublicKey = process.env.PUBLIC_KEY || process.env.NEXT_PUBLIC_PUBLIC_KEY;
    const envMerchantId = process.env.MERCHANT_ID || process.env.NEXT_PUBLIC_MERCHANT_ID;

    if (envPublicKey && envMerchantId && publicKey === envPublicKey && merchantId === envMerchantId) {
      return { id: 'api-fallback', username: 'api-user', role: 'ADMIN' };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
