import type { ExecutionLog } from '../../domain/entities/execution-log.entity.js'

export function presentExecutionLog(executionLog: ExecutionLog) {
  return {
    id: executionLog.id,
    cronJobId: executionLog.cronJobId,
    cronJobName: executionLog.cronJobName,
    cronJobIcon: executionLog.cronJobIcon,
    userId: executionLog.userId,
    triggerType: executionLog.triggerType,
    status: executionLog.status,
    requestUrl: executionLog.requestUrl,
    requestMethod: executionLog.requestMethod,
    requestHeaders: executionLog.requestHeaders,
    requestBody: executionLog.requestBody,
    httpStatusCode: executionLog.httpStatusCode,
    durationMs: executionLog.durationMs,
    responseHeaders: executionLog.responseHeaders,
    responseBody: executionLog.responseBody,
    errorMessage: executionLog.errorMessage,
    attemptCount: executionLog.attemptCount,
    startedAt: executionLog.startedAt,
    finishedAt: executionLog.finishedAt,
  }
}
