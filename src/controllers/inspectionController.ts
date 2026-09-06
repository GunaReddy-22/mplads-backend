import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { logAuditEvent } from '../services/auditService';
import { AuthRequest } from '../middleware/authMiddleware';

export const createInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { workId, status, remarks, evidenceFileName, latitude, longitude } = req.body;

    if (!workId || !status || !remarks) {
      return res.status(400).json({ success: false, message: 'workId, status, and remarks are required' });
    }

    const work = await prisma.work.findFirst({
      where: { OR: [{ id: workId }, { workId }] },
    });

    if (!work) {
      return res.status(404).json({ success: false, message: 'Work record not found' });
    }

    // Generate deterministic evidence SHA-256 hash to simulate immutable geotagged evidence
    const rawData = `${work.workId}-${evidenceFileName || 'inspection-photo.jpg'}-${Date.now()}-${remarks}`;
    const evidenceHash = crypto.createHash('sha256').update(rawData).digest('hex');

    const officerName = req.user?.name || 'Guna';
    const officerRole = req.user?.role || 'District Collector / Designated Officer';

    const inspection = await prisma.inspection.create({
      data: {
        workId: work.id,
        officerName,
        officerRole,
        status,
        remarks,
        evidenceUrl: evidenceFileName ? `/uploads/evidence/${evidenceFileName}` : '/evidence/geo-verified-site-photo.jpg',
        evidenceHash: `SHA256:${evidenceHash}`,
        latitude: latitude || work.latitude,
        longitude: longitude || work.longitude,
        verifiedAt: new Date(),
      },
    });

    // Update related alerts if verified
    if (status === 'VERIFIED_NO_ISSUE' || status === 'FIELD_INSPECTION_REQUIRED') {
      await prisma.alert.updateMany({
        where: { workId: work.id, status: 'NEW' },
        data: {
          status: 'UNDER_REVIEW',
          resolvedBy: officerName,
        },
      });
    }

    // Write audit log
    await logAuditEvent({
      entityType: 'INSPECTION',
      entityId: work.id,
      action: 'HUMAN_VERIFICATION_SUBMITTED',
      performedBy: officerName,
      details: {
        inspectionId: inspection.id,
        workId: work.workId,
        verificationStatus: status,
        remarks,
        evidenceHash: inspection.evidenceHash,
        coordinates: { lat: inspection.latitude, lng: inspection.longitude },
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Human verification and inspection record recorded successfully',
      data: inspection,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit inspection' });
  }
};

export const getInspections = async (req: Request, res: Response) => {
  try {
    const inspections = await prisma.inspection.findMany({
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

    const formatted = inspections.map((ins) => ({
      id: ins.id,
      workId: ins.work.workId,
      workName: ins.work.workName,
      category: ins.work.category,
      district: ins.work.district.name,
      state: ins.work.state.name,
      riskScore: ins.work.riskAssessment?.overallScore || 0,
      riskLevel: ins.work.riskAssessment?.riskLevel || 'LOW',
      officerName: ins.officerName,
      officerRole: ins.officerRole,
      status: ins.status,
      remarks: ins.remarks,
      evidenceUrl: ins.evidenceUrl,
      evidenceHash: ins.evidenceHash,
      latitude: ins.latitude,
      longitude: ins.longitude,
      verifiedAt: ins.verifiedAt,
      createdAt: ins.createdAt,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch inspections' });
  }
};
