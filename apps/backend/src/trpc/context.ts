import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export type Context = Awaited<ReturnType<typeof createContext>>;

export function createContext({ req, res }: CreateFastifyContextOptions) {
  // Trích xuất JWT Token nếu có từ header Authorization
  const authHeader = req.headers.authorization;
  const user: any = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Decode JWT token sơ bộ (hoặc middleware NestJS sẽ làm việc này trước đó)
      // Tạm thời để null, luồng xác thực thực tế sẽ xử lý tại guards/routers
    } catch (e) {}
  }

  return {
    req,
    res,
    user,
  };
}
