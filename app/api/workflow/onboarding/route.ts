import db from '@/database/drizzle';
import { users } from '@/database/schema';
import { sendEmail } from '@/lib/workflow';
import { serve } from '@upstash/workflow/nextjs';
import { eq } from 'drizzle-orm';

type UserState = 'non-active' | 'active';

type InitialData = {
  email: string;
  fullName: string;
  // state: UserState;
};

const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000; // 1日
const THREE_DAY_IN_MS = 3 * ONE_DAY_IN_MS; // 3日
const THIRTY_DAY_IN_MS = 30 * ONE_DAY_IN_MS; // 30日

const getUserState = async (email: string): Promise<UserState> => {
  const user = await db.select().from(users).where(eq(users.email, email));

  if (user.length === 0) {
    return 'non-active';
  }

  // 最終アクティビティ日時との差分を計算;
  const lastActivityDate = new Date(user[0].lastActivityDate!);
  const now = new Date();
  const timeDifference = now.getTime() - lastActivityDate.getTime();

  // アクティビティ状態の判定
  // 3日以上かつ30日未満の期間アクティビティがない場合
  if (timeDifference > THREE_DAY_IN_MS && timeDifference < THIRTY_DAY_IN_MS) {
    return 'non-active';
  }

  return 'active';
};

export const { POST } = serve<InitialData>(async (context) => {
  const { email, fullName } = context.requestPayload;

  // 新規登録ユーザーにウェルカムメールを送ります：
  await context.run('new-signup', async () => {
    await sendEmail({
      email,
      subject: 'Welcome to the platform',
      message: `Welcome ${fullName}`,
    });
  });

  // 60秒 × 60分 × 24時間 × 3日 = 3日間の秒数
  await context.sleep('wait-for-3-days', 60 * 60 * 24 * 3);

  // 定期的（毎月）にユーザーのエンゲージメント・レベルをチェックし、適切なEメールを送信します：
  while (true) {
    // ユーザーのエンゲージメント・レベルをチェックします：
    const state = await context.run('check-user-state', async () => {
      return await getUserState(email);
    });

    //  状態に応じてメール送信;
    if (state === 'non-active') {
      await context.run('send-email-non-active', async () => {
        await sendEmail({
          email,
          subject: 'Are your still there?',
          message: `Hey, ${fullName}, we miss you.`,
        });
      });
    } else if (state === 'active') {
      await context.run('send-email-active', async () => {
        await sendEmail({
          email,
          subject: 'Welcome back!',
          message: `Welcome back ${fullName}`,
        });
      });
    }

    // 1ヶ月待機
    await context.sleep('wait-for-1-month', 60 * 60 * 24 * 30);
  }
});
