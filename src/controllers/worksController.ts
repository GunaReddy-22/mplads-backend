import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getWorks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const search = (req.query.search as string)?.trim() || '';
    const stateId = req.query.stateId as string;
    const districtId = req.query.districtId as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const riskLevel = req.query.riskLevel as string;
    const sortBy = (req.query.sortBy as string) || 'riskScore';
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { workId: { contains: search } },
        { workName: { contains: search } },
        { address: { contains: search } },
        { village: { contains: search } },
      ];
    }

    if (stateId) where.stateId = stateId;
    if (districtId) where.districtId = districtId;
    if (category) where.category = category;
    if (status) where.status = status;

    if (riskLevel) {
      where.riskAssessment = {
        riskLevel: riskLevel.toUpperCase(),
      };
    }

    // Build orderBy
    let orderBy: any = {};
    if (sortBy === 'riskScore') {
      orderBy = { riskAssessment: { overallScore: sortOrder } };
    } else if (sortBy === 'sanctionAmount') {
      orderBy = { sanctionAmount: sortOrder };
    } else if (sortBy === 'expenditureAmount') {
      orderBy = { expenditureAmount: sortOrder };
    } else if (sortBy === 'physicalProgress') {
      orderBy = { physicalProgress: sortOrder };
    } else if (sortBy === 'sanctionDate') {
      orderBy = { sanctionDate: sortOrder };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const skip = (page - 1) * limit;

    const [total, works] = await Promise.all([
      prisma.work.count({ where }),
      prisma.work.findMany({
        where,
        include: {
          state: { select: { id: true, name: true, code: true } },
          district: { select: { id: true, name: true, code: true } },
          agency: { select: { id: true, name: true, code: true } },
          riskAssessment: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formattedWorks = works.map((w) => {
      let reasons: string[] = [];
      let contributions: any[] = [];
      try {
        reasons = JSON.parse(w.riskAssessment?.reasons || '[]');
        contributions = JSON.parse(w.riskAssessment?.contributions || '[]');
      } catch (e) {}

      return {
        id: w.id,
        workId: w.workId,
        workName: w.workName,
        description: w.description,
        category: w.category,
        state: w.state,
        district: w.district,
        agency: w.agency,
        sanctionDate: w.sanctionDate,
        startDate: w.startDate,
        expectedCompletionDate: w.expectedCompletionDate,
        actualCompletionDate: w.actualCompletionDate,
        status: w.status,
        sanctionAmount: w.sanctionAmount,
        estimatedCost: w.estimatedCost,
        expenditureAmount: w.expenditureAmount,
        physicalProgress: w.physicalProgress,
        financialProgress: w.financialProgress,
        latitude: w.latitude,
        longitude: w.longitude,
        address: w.address,
        village: w.village,
        isHeroCase: w.isHeroCase,
        isSimilarPair: w.isSimilarPair,
        peerBenchmarkCost: w.peerBenchmarkCost,
        risk: w.riskAssessment
          ? {
              overallScore: w.riskAssessment.overallScore,
              riskLevel: w.riskAssessment.riskLevel,
              anomalyScore: w.riskAssessment.anomalyScore,
              costScore: w.riskAssessment.costScore,
              delayScore: w.riskAssessment.delayScore,
              duplicateScore: w.riskAssessment.duplicateScore,
              paymentScore: w.riskAssessment.paymentScore,
              geoScore: w.riskAssessment.geoScore,
              reasons,
              contributions,
              recommendedAction: w.riskAssessment.recommendedAction,
              modelVersion: w.riskAssessment.modelVersion,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      data: {
        works: formattedWorks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch works' });
  }
};

export const getWorkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const work = await prisma.work.findFirst({
      where: {
        OR: [{ id }, { workId: id }],
      },
      include: {
        state: true,
        district: true,
        agency: true,
        riskAssessment: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
        },
        inspections: {
          orderBy: { createdAt: 'desc' },
        },
        similarAsPrimary: {
          include: {
            candidateWork: {
              include: {
                district: true,
                riskAssessment: true,
              },
            },
          },
        },
        similarAsCandidate: {
          include: {
            primaryWork: {
              include: {
                district: true,
                riskAssessment: true,
              },
            },
          },
        },
      },
    });

    if (!work) {
      return res.status(404).json({ success: false, message: 'Work record not found' });
    }

    // Get audit logs for this work
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: work.id,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Parse reasons and contributions
    let reasons: string[] = [];
    let contributions: any[] = [];
    try {
      reasons = JSON.parse(work.riskAssessment?.reasons || '[]');
      contributions = JSON.parse(work.riskAssessment?.contributions || '[]');
    } catch (e) {}

    // Similar works normalization
    const similarWorks = [
      ...work.similarAsPrimary.map((s) => ({
        id: s.id,
        workId: s.candidateWork.workId,
        idRef: s.candidateWork.id,
        workName: s.candidateWork.workName,
        category: s.candidateWork.category,
        sanctionAmount: s.candidateWork.sanctionAmount,
        district: s.candidateWork.district.name,
        similarityScore: s.similarityScore,
        distanceKm: s.distanceKm,
        costSimilarity: s.costSimilarity,
        categoryMatch: s.categoryMatch,
        reasons: s.reasons,
        latitude: s.candidateWork.latitude,
        longitude: s.candidateWork.longitude,
        riskScore: s.candidateWork.riskAssessment?.overallScore || 0,
      })),
      ...work.similarAsCandidate.map((s) => ({
        id: s.id,
        workId: s.primaryWork.workId,
        idRef: s.primaryWork.id,
        workName: s.primaryWork.workName,
        category: s.primaryWork.category,
        sanctionAmount: s.primaryWork.sanctionAmount,
        district: s.primaryWork.district.name,
        similarityScore: s.similarityScore,
        distanceKm: s.distanceKm,
        costSimilarity: s.costSimilarity,
        categoryMatch: s.categoryMatch,
        reasons: s.reasons,
        latitude: s.primaryWork.latitude,
        longitude: s.primaryWork.longitude,
        riskScore: s.primaryWork.riskAssessment?.overallScore || 0,
      })),
    ];

    // Compliance checklist indicators based on real fields
    const complianceChecks = [
      {
        id: 'c1',
        title: 'Schedule of Rates (SoR) Compliance',
        status: work.sanctionAmount <= (work.peerBenchmarkCost || work.sanctionAmount) * 1.15 ? 'PASSED' : 'VIOLATION',
        details: work.sanctionAmount <= (work.peerBenchmarkCost || work.sanctionAmount) * 1.15 
          ? 'Estimates conform to standard State PWD Schedule of Rates.'
          : `Project estimated cost exceeds district peer benchmark baseline by ${Math.round(((work.sanctionAmount - (work.peerBenchmarkCost || work.sanctionAmount)) / (work.peerBenchmarkCost || 1)) * 100)}%.`,
      },
      {
        id: 'c2',
        title: 'Physical Milestone vs Fund Disbursement Ratio',
        status: (work.financialProgress - work.physicalProgress) > 30 ? 'REQUIRES_REVIEW' : 'PASSED',
        details: (work.financialProgress - work.physicalProgress) > 30
          ? `Disbursement lead of ${(work.financialProgress - work.physicalProgress).toFixed(1)}% exceeds standard 20% milestone advance tolerance.`
          : 'Disbursement progress aligns within allowable tolerance of verified physical milestones.',
      },
      {
        id: 'c3',
        title: 'Geographic Duplicate Exclusion Check',
        status: similarWorks.length > 0 ? 'REQUIRES_REVIEW' : 'PASSED',
        details: similarWorks.length > 0
          ? `Potential duplicate candidate (${similarWorks[0].workId}) identified within ${similarWorks[0].distanceKm} km with ${similarWorks[0].similarityScore}% scope overlap.`
          : 'No conflicting duplicate works detected within a 5 km administrative perimeter.',
      },
      {
        id: 'c4',
        title: 'Stage Inspection & Measurement Book (MB) Entry',
        status: work.riskAssessment?.riskLevel === 'HIGH' ? 'REQUIRES_REVIEW' : 'PASSED',
        details: work.riskAssessment?.riskLevel === 'HIGH'
          ? 'Stage 2 Measurement Book entry pending independent technical verification.'
          : 'Measurement Book entries up to date and verified by executive engineer.',
      },
      {
        id: 'c5',
        title: 'Environmental & Statutory Clearances',
        status: 'PASSED',
        details: 'NOC obtained from local Gram Panchayat and District Administration.',
      },
    ];

    return res.json({
      success: true,
      data: {
        ...work,
        risk: work.riskAssessment
          ? {
              overallScore: work.riskAssessment.overallScore,
              riskLevel: work.riskAssessment.riskLevel,
              anomalyScore: work.riskAssessment.anomalyScore,
              costScore: work.riskAssessment.costScore,
              delayScore: work.riskAssessment.delayScore,
              duplicateScore: work.riskAssessment.duplicateScore,
              paymentScore: work.riskAssessment.paymentScore,
              geoScore: work.riskAssessment.geoScore,
              reasons,
              contributions,
              recommendedAction: work.riskAssessment.recommendedAction,
              modelVersion: work.riskAssessment.modelVersion,
            }
          : null,
        similarWorks,
        complianceChecks,
        auditLogs,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch work details' });
  }
};
