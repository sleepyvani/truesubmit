import { Injectable, Inject } from '@nestjs/common';
import { router } from './trpc.instance';
import { POSTGRES_DB } from '@/database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '@/database/schemas';

import { createAuthRouter } from './routers/auth.router';
import { createUserRouter } from './routers/user.router';
import { createProblemRouter } from './routers/problem.router';
import { createContestRouter } from './routers/contest.router';
import { createCmsRouter } from './routers/cms.router';
import { createSubmissionRouter } from './routers/submission.router';
import { createConfigurationRouter } from './routers/configuration.router';

@Injectable()
export class TrpcRouter {
  public appRouter;

  constructor(
    @Inject(POSTGRES_DB) private readonly db: NodePgDatabase<typeof schemas>,
  ) {
    this.appRouter = router({
      auth: createAuthRouter(this.db),
      user: createUserRouter(this.db),
      problem: createProblemRouter(this.db),
      contest: createContestRouter(this.db),
      cms: createCmsRouter(this.db),
      submission: createSubmissionRouter(this.db),
      configuration: createConfigurationRouter(this.db),
    });
  }
}

export type AppRouter = TrpcRouter['appRouter'];
