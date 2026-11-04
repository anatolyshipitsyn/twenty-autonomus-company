import { Module } from '@nestjs/common';
import { CommandPoller } from './command-poller';
import { TwentyApiClient } from './twenty-api-client';
import { CodexAppServerClient } from './codex-app-server-client';
import { ExecutionCoordinator } from './execution-coordinator';
import { ResultPublisher } from './result-publisher';

@Module({
  providers: [TwentyApiClient, CodexAppServerClient, ResultPublisher, ExecutionCoordinator, CommandPoller],
})
export class WorkerModule {}
