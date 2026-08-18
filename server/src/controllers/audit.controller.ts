import { Response } from 'express';
import { AuthenticatedRequest, successResponse, parsePagination } from '../types/index.js';
import { getAuditLogs } from '../services/audit.service.js';

// GET /api/admin/audit-logs
export async function listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { userId, action, resource, resourceId, startDate, endDate } = req.query as Record<
    string,
    string
  >;

  const filters = {
    userId,
    action,
    resource,
    resourceId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  };

  const { logs, meta } = await getAuditLogs(filters, pagination);
  res.status(200).json(successResponse(logs, undefined, meta));
}
