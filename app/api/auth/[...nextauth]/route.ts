/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { type Session as NextAuthSessionBase, type User as NextAuthUserBase } from 'next-auth';
import { type JWT as NextAuthJWTBase } from 'next-auth/jwt';
import { UserRoleType } from '@/types/roles';
import { authOptions } from '@/app/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };