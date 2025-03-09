import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/database/redis';

const ratelimit = new Ratelimit({
  redis,
  // 1分間に10リクエストまで
  limiter: Ratelimit.fixedWindow(10, '1m'),
  // 使用状況の分析を有効化
  analytics: true,
  // Redisに保存されるキーのプレフィックス
  // 異なるアプリケーションやサービスのレート制限を区別するために使用
  prefix: '@upstash/ratelimit',
});

export default ratelimit;
