import { auth } from '@/auth';
import Header from '@/components/Header';
import db from '@/database/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { after } from 'next/server';

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  // データベースの更新処理は、レスポンス送信後に非同期で実行
   after(async () => {
     if (!session?.user?.id) return;

     const user = await db
       .select()
       .from(users)
       .where(eq(users.id, session?.user?.id))
       .limit(1);

     // 同じ日の重複更新を防ぐ
     if (user[0].lastActivityDate === new Date().toISOString().slice(0, 10))
       return;

     await db
       .update(users)
       .set({ lastActivityDate: new Date().toISOString().slice(0, 10) })
       .where(eq(users.id, session?.user?.id));
   });

  return (
    <main className="root-container">
      <div className="mx-auto max-w-7xl">
        <Header />
        <div className="mt-20 pb-20">{children}</div>
      </div>
    </main>
  );
};

export default Layout;
