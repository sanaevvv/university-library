import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QStashClient, resend } from '@upstash/qstash';
import config from "@/lib/config";

const workFlowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
})

export default workFlowClient;

const qstashClient = new QStashClient({
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async ({
  email, // 送信先メールアドレス
  subject, // メールの件名
  message, // メールの本文
}: {
  email: string;
  subject: string;
  message: string;
  }) => {
    // QStashを使用してメール送信をキューに入れる
  await qstashClient.publishJSON({
    // Resendメールプロバイダーの設定
    api: {
      name: 'email',
      provider: resend({ token: config.env.resendToken }),
    },
    // メールの内容
    body: {
      from: 'JS Mastery <sanaevvv@gmail.com>', // 送信元
      to: [email], // 送信先
      subject, // メールの件名
      html: message, // メールの本文
    },
  });
  };
