'use server';

import db from '@/database/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import ratelimit from '@/lib/ratelimit';
import workFlowClient from '../workflow';
import config from "@/lib/config";

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, 'email' | 'password'>
) => {
  const { email, password } = params;

  // リクエストの送信元IPアドレスを取得;
  // 127.0.0.1 は ローカルホストを示すIPアドレス;
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return redirect("/too-fast")
  }

  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Signin error' };
  }
};

export const signUp = async (
  params: AuthCredentials
): Promise<{ success: boolean; error?: string }> => {
  const { fullName, email, password, universityId, universityCard } = params;

  // リクエストの送信元IPアドレスを取得;
  // 127.0.0.1 は ローカルホストを示すIPアドレス;
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return redirect('/too-fast');
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: 'User already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

// 登録完了 → トリガー実行 → オンボーディングワークフロー開始

// [ワークフローの例]
// 1. ウェルカムメール送信
// 2. 3日間待機
// 3. アクティビティチェック
// 4. 状態に応じたフォローアップ

  try {
    await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      universityId,
      universityCard,
    });

    await workFlowClient.trigger({
      // ワークフローのURL
      url: `${config.env.prodApiEndpoint}/api/workflow/onboarding`,
      // ワークフローのパラメータ
      body: {
        email,
        fullName,
      },
    });

    await signInWithCredentials({ email, password });

    return { success: true };
  } catch (error) {
    console.log(error, 'Signup error');

    return { success: false, error: 'Signup error' };
  }
};
