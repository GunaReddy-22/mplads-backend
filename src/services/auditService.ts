import { prisma } from '../prisma';

export const logAuditEvent = async (params: {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  details: any;
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedBy: params.performedBy,
        details: typeof params.details === 'string' ? params.details : JSON.stringify(params.details),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
