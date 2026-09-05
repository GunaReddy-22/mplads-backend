import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { logAuditEvent } from '../services/auditService';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const riskLevel = req.query.riskLevel as string;
    const status = req.query.status as string;
    const alertType = req.query.alertType as string;

    const where: any = {};
    if (riskLevel) where.riskLevel = riskLevel.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (alertType) where.alertType = alertType;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        work: {
          include: {
            district: true,
            state: true,
            riskAssessment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = alerts.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      riskLevel: a.riskLevel,
      alertType: a.alertType,
      status: a.status,
      createdAt: a.createdAt,
      resolvedAt: a.resolvedAt,
      resolvedBy: a.resolvedBy,
      work: {
        id: a.work.id,
        workId: a.work.workId,
        workName: a.work.workName,
        category: a.work.category,
        district: a.work.district.name,
        state: a.work.state.name,
        sanctionAmount: a.work.sanctionAmount,
        riskScore: a.work.riskAssessment?.overallScore || 0,
        isHeroCase: a.work.isHeroCase,
      },
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch alerts' });
  }
};

export const updateAlertStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['NEW', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid alert status' });
    }

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: { work: true },
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        status,
        resolvedBy: req.user?.name || 'Authorized Officer',
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
      },
    });

    await logAuditEvent({
      entityType: 'ALERT',
      entityId: alert.id,
      action: `ALERT_STATUS_${status}`,
      performedBy: req.user?.name || 'Authorized Officer',
      details: {
        alertId: alert.id,
        workId: alert.work.workId,
        oldStatus: alert.status,
        newStatus: status,
        remarks: remarks || 'Status updated via Decision Support Portal',
      },
    });

    return res.json({
      success: true,
      message: `Alert updated to ${status}`,
      data: updatedAlert,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update alert' });
  }
};
