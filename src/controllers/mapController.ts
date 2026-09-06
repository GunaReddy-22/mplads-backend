import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getMapWorks = async (req: Request, res: Response) => {
  try {
    const riskLevel = req.query.riskLevel as string;
    const category = req.query.category as string;
    const stateId = req.query.stateId as string;
    const districtId = req.query.districtId as string;
    const limit = parseInt(req.query.limit as string, 10) || 500;

    const where: any = {};
    if (category) where.category = category;
    if (stateId) where.stateId = stateId;
    if (districtId) where.districtId = districtId;
    if (riskLevel) {
      where.riskAssessment = { riskLevel: riskLevel.toUpperCase() };
    }

    const works = await prisma.work.findMany({
      where,
      orderBy: [
        { isHeroCase: 'desc' },
        { riskAssessment: { overallScore: 'desc' } },
      ],
      select: {
        id: true,
        workId: true,
        workName: true,
        category: true,
        latitude: true,
        longitude: true,
        sanctionAmount: true,
        expenditureAmount: true,
        physicalProgress: true,
        financialProgress: true,
        status: true,
        address: true,
        village: true,
        isHeroCase: true,
        isSimilarPair: true,
        district: { select: { id: true, name: true } },
        state: { select: { id: true, name: true, code: true } },
        riskAssessment: {
          select: {
            overallScore: true,
            riskLevel: true,
            costScore: true,
            delayScore: true,
            duplicateScore: true,
            recommendedAction: true,
          },
        },
      },
      take: limit,
    });

    // Also fetch similar work connection pairs for visual linking on the map
    const similarPairs = await prisma.similarWork.findMany({
      include: {
        primaryWork: {
          select: { id: true, workId: true, latitude: true, longitude: true, workName: true },
        },
        candidateWork: {
          select: { id: true, workId: true, latitude: true, longitude: true, workName: true },
        },
      },
    });

    return res.json({
      success: true,
      count: works.length,
      data: {
        markers: works.map((w) => ({
          id: w.id,
          workId: w.workId,
          workName: w.workName,
          category: w.category,
          lat: w.latitude,
          lng: w.longitude,
          district: w.district.name,
          state: w.state.name,
          sanctionAmount: w.sanctionAmount,
          expenditureAmount: w.expenditureAmount,
          physicalProgress: w.physicalProgress,
          financialProgress: w.financialProgress,
          status: w.status,
          address: w.address,
          village: w.village,
          isHeroCase: w.isHeroCase,
          isSimilarPair: w.isSimilarPair,
          riskScore: w.riskAssessment?.overallScore || 0,
          riskLevel: w.riskAssessment?.riskLevel || 'LOW',
          recommendedAction: w.riskAssessment?.recommendedAction || 'MONITOR',
        })),
        similarityLinks: similarPairs.map((pair) => ({
          id: pair.id,
          similarityScore: pair.similarityScore,
          distanceKm: pair.distanceKm,
          reasons: pair.reasons,
          source: {
            id: pair.primaryWork.id,
            workId: pair.primaryWork.workId,
            workName: pair.primaryWork.workName,
            lat: pair.primaryWork.latitude,
            lng: pair.primaryWork.longitude,
          },
          target: {
            id: pair.candidateWork.id,
            workId: pair.candidateWork.workId,
            workName: pair.candidateWork.workName,
            lat: pair.candidateWork.latitude,
            lng: pair.candidateWork.longitude,
          },
        })),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch map data' });
  }
};
