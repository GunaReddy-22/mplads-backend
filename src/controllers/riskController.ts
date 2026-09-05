import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { riskService } from '../services/riskAnalysisService';

export const getHighRiskWorks = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const highRiskWorks = await prisma.work.findMany({
      where: {
        riskAssessment: {
          riskLevel: 'HIGH',
        },
      },
      include: {
        state: true,
        district: true,
        agency: true,
        riskAssessment: true,
      },
      orderBy: {
        riskAssessment: {
          overallScore: 'desc',
        },
      },
      take: limit,
    });

    const formatted = highRiskWorks.map((w) => {
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
        category: w.category,
        district: w.district.name,
        state: w.state.name,
        sanctionAmount: w.sanctionAmount,
        expenditureAmount: w.expenditureAmount,
        physicalProgress: w.physicalProgress,
        financialProgress: w.financialProgress,
        status: w.status,
        overallScore: w.riskAssessment?.overallScore || 0,
        riskLevel: w.riskAssessment?.riskLevel || 'HIGH',
        reasons,
        contributions,
        recommendedAction: w.riskAssessment?.recommendedAction || 'PRIORITY_VERIFICATION',
        isHeroCase: w.isHeroCase,
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch high risk works' });
  }
};

export const getRiskByWorkId = async (req: Request, res: Response) => {
  try {
    const { workId } = req.params;
    const work = await prisma.work.findFirst({
      where: { OR: [{ id: workId }, { workId }] },
      include: { riskAssessment: true },
    });

    if (!work || !work.riskAssessment) {
      return res.status(404).json({ success: false, message: 'Risk assessment not found for this work' });
    }

    let reasons: string[] = [];
    let contributions: any[] = [];
    try {
      reasons = JSON.parse(work.riskAssessment.reasons);
      contributions = JSON.parse(work.riskAssessment.contributions);
    } catch (e) {}

    return res.json({
      success: true,
      data: {
        workId: work.workId,
        overallScore: work.riskAssessment.overallScore,
        riskLevel: work.riskAssessment.riskLevel,
        signals: {
          anomaly: work.riskAssessment.anomalyScore,
          cost: work.riskAssessment.costScore,
          delay: work.riskAssessment.delayScore,
          similarity: work.riskAssessment.duplicateScore,
          payment: work.riskAssessment.paymentScore,
          geo: work.riskAssessment.geoScore,
        },
        reasons,
        contributions,
        recommendedAction: work.riskAssessment.recommendedAction,
        modelVersion: work.riskAssessment.modelVersion,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch risk assessment' });
  }
};
