import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { StartCommand, TwentyApiClient } from './twenty-api-client';
import { ExecutionCoordinator } from './execution-coordinator';

const POLL_INTERVAL_MS = 10_000;

@Injectable()
export class CommandPoller implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommandPoller.name);
  private timer?: NodeJS.Timeout;
  private polling = false;
  private readonly seenCommandIds = new Set<string>();

  constructor(
    private readonly twenty: TwentyApiClient,
    private readonly execution: ExecutionCoordinator,
  ) {}

  onModuleInit(): void {
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      const commands = await this.twenty.getPendingStartCommands();
      if (this.execution.isBusy()) return;
      for (const command of commands) {
        if (this.execution.isEnabled()) {
          await this.execution.execute(command);
          return;
        }
        this.observe(command);
      }
      if (!this.execution.isEnabled()) return;
      if (commands.length > 0) return;

      const task = await this.twenty.getNextReadyTask();
      if (!task) return;
      await this.twenty.requestDispatch(task);
      this.logger.log(`DISPATCH_REQUEST persisted for READY task ${task.id}, version ${task.requestVersion}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown API error';
      this.logger.error(`Command poll failed: ${message}`);
    } finally {
      this.polling = false;
    }
  }

  private observe(command: StartCommand): void {
    if (this.seenCommandIds.has(command.id)) return;
    this.seenCommandIds.add(command.id);
    this.logger.log(`Observed saved START command for run ${command.runKey}. Execution is not enabled.`);
  }
}
