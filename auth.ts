import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import db from './database/drizzle';
import { eq } from 'drizzle-orm';
import { users } from './database/schema';
import { compare } from 'bcryptjs';
// 初期化関数にすべてのオプションを渡し、ハンドラ、サインインとサインアウトのメソッドなどをエクスポート
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
  },
  providers: [
    Credentials({
      // Nextjsはセキュリティーのため入力値をunknown型で扱うため型変換が必要
      async authorize({ email, password }) {
        if (!email || !password) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toString()))
          .limit(1);

        if (user.length === 0) return null;

        const isPasswordValid = await compare(
          password.toString(),
          user[0].password
        );

        if (!isPasswordValid) return null;

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].fullName,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // 認証済み
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      } // 未認証
      return session;
    },
  },
});

// 1. 初回サインイン
// ユーザーがログインフォームを送信
// ↓
// authorize()が実行される
// ↓
// jwt()が実行される
// ↓
// JWTがクッキーに保存される

// 2. 2回目以降のアクセス
// 例：ページをリロード、別ページに移動など
// ブラウザに保存されたJWTクッキーを使用
// ↓
// authorize()は実行されない（パスワード認証不要）
// ↓
// クッキーからJWTを読み取り、jwt()が実行される
// この時、userはundefined
// ↓
// sessionオブジェクトが生成され、session()が実行される
