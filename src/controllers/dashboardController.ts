import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalWorks = await prisma.work.count();
    
    // Aggregates
    const financials = await prisma.work.aggregate({
      _sum: {
        sanctionAmount: true,
        expenditureAmount: true,
      },
      _avg: {
        physicalProgress: true,
        financialProgress: true,
      },
    });

    // Risk levels count
    const highRiskCount = await prisma.riskAssessment.count({ where: { riskLevel: 'HIGH' } });
    const mediumRiskCount = await prisma.riskAssessment.count({ where: { riskLevel: 'MEDIUM' } });
    const lowRiskCount = await prisma.riskAssessment.count({ where: { riskLevel: 'LOW' } });

    // Status counts
    const ongoingCount = await prisma.work.count({ where: { status: 'ONGOING' } });
    const delayedCount = await prisma.work.count({ where: { status: 'DELAYED' } });
    const completedCount = await prisma.work.count({ where: { status: 'COMPLETED' } });

    // Alerts count
    const activeAlertsCount = await prisma.alert.count({ where: { status: { in: ['NEW', 'UNDER_REVIEW'] } } });

    // Category breakdown
    const categories = await prisma.work.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { sanctionAmount: true, expenditureAmount: true },
    });

    // Get high risk works per category
    const categoryRiskDistribution = await Promise.all(
      categories.map(async (cat) => {
        const catWorks = await prisma.work.findMany({
          where: { category: cat.category },
          select: { id: true },
        });
        const workIds = catWorks.map((w) => w.id);
        const highCount = await prisma.riskAssessment.count({
          where: { workId: { in: workIds }, riskLevel: 'HIGH' },
        });
        const medCount = await prisma.riskAssessment.count({
          where: { workId: { in: workIds }, riskLevel: 'MEDIUM' },
        });
        const lowCount = await prisma.riskAssessment.count({
          where: { workId: { in: workIds }, riskLevel: 'LOW' },
        });
        return {
          category: cat.category,
          totalWorks: cat._count.id,
          totalSanctioned: cat._sum.sanctionAmount || 0,
          totalExpenditure: cat._sum.expenditureAmount || 0,
          highRisk: highCount,
          mediumRisk: medCount,
          lowRisk: lowCount,
        };
      })
    );

    // State wise statistics
    const states = await prisma.state.findMany({
      include: {
        works: {
          select: {
            id: true,
            sanctionAmount: true,
            expenditureAmount: true,
            riskAssessment: {
              select: { riskLevel: true, overallScore: true },
            },
          },
        },
      },
    });

    const stateAnalytics = states.map((s) => {
      const works = s.works;
      const totalStateWorks = works.length;
      const high = works.filter((w) => w.riskAssessment?.riskLevel === 'HIGH').length;
      const medium = works.filter((w) => w.riskAssessment?.riskLevel === 'MEDIUM').length;
      const low = works.filter((w) => w.riskAssessment?.riskLevel === 'LOW').length;
      const sanctioned = works.reduce((acc, w) => acc + w.sanctionAmount, 0);
      const spent = works.reduce((acc, w) => acc + w.expenditureAmount, 0);
      const avgScore = totalStateWorks > 0 ? works.reduce((acc, w) => acc + (w.riskAssessment?.overallScore || 0), 0) / totalStateWorks : 0;

      return {
        id: s.id,
        stateName: s.name,
        stateCode: s.code,
        totalWorks: totalStateWorks,
        highRisk: high,
        mediumRisk: medium,
        lowRisk: low,
        sanctioned,
        expenditure: spent,
        utilizationRate: sanctioned > 0 ? (spent / sanctioned) * 100 : 0,
        averageRiskScore: Math.round(avgScore * 10) / 10,
      };
    });

    // Top Priority Inspection Queue (Top 5 High Risk Works)
    const priorityQueue = await prisma.work.findMany({
      where: {
        riskAssessment: {
          riskLevel: 'HIGH',
        },
      },
      include: {
        district: { select: { name: true } },
        state: { select: { name: true, code: true } },
        agency: { select: { name: true, code: true } },
        riskAssessment: true,
      },
      orderBy: {
        riskAssessment: {
          overallScore: 'desc',
        },
      },
      take: 6,
    });

    const formattedPriorityQueue = priorityQueue.map((w) => {
      let reasons: string[] = [];
      try {
        reasons = JSON.parse(w.riskAssessment?.reasons || '[]');
      } catch (e) {
        reasons = ['Multivariate risk indicators flagged'];
      }

      return {
        id: w.id,
        workId: w.workId,
        workName: w.workName,
        category: w.category,
        district: w.district.name,
        state: w.state.name,
        agency: w.agency.name,
        sanctionAmount: w.sanctionAmount,
        expenditureAmount: w.expenditureAmount,
        physicalProgress: w.physicalProgress,
        financialProgress: w.financialProgress,
        status: w.status,
        riskScore: w.riskAssessment?.overallScore || 0,
        riskLevel: w.riskAssessment?.riskLevel || 'HIGH',
        primaryReason: reasons[0] || 'Cost & Delay Anomaly',
        recommendedAction: w.riskAssessment?.recommendedAction || 'PRIORITY_VERIFICATION',
        isHeroCase: w.isHeroCase,
      };
    });

    // Risk trends mock distribution over months
    const trendData = [
      { month: 'Oct 2025', highRisk: 42, mediumRisk: 210, lowRisk: 680, avgScore: 28.4 },
      { month: 'Nov 2025', highRisk: 45, mediumRisk: 218, lowRisk: 692, avgScore: 29.1 },
      { month: 'Dec 2025', highRisk: 48, mediumRisk: 226, lowRisk: 700, avgScore: 30.2 },
      { month: 'Jan 2026', highRisk: 50, mediumRisk: 235, lowRisk: 704, avgScore: 31.0 },
      { month: 'Feb 2026', highRisk: 51, mediumRisk: 238, lowRisk: 706, avgScore: 31.4 },
      { month: 'Mar 2026 (Live)', highRisk: highRiskCount, mediumRisk: mediumRiskCount, lowRisk: lowRiskCount, avgScore: 32.1 },
    ];

    return res.json({
      success: true,
      data: {
        kpis: {
          totalWorks,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
          totalSanctioned: financials._sum.sanctionAmount || 0,
          totalExpenditure: financials._sum.expenditureAmount || 0,
          utilizationRate: (financials._sum.sanctionAmount || 0) > 0 ? ((financials._sum.expenditureAmount || 0) / (financials._sum.sanctionAmount || 1)) * 100 : 0,
          avgPhysicalProgress: financials._avg.physicalProgress || 0,
          avgFinancialProgress: financials._avg.financialProgress || 0,
          ongoingCount,
          delayedCount,
          completedCount,
          activeAlertsCount,
        },
        riskDistribution: [
          { name: 'Low Risk (0–39)', count: lowRiskCount, percentage: Math.round((lowRiskCount / totalWorks) * 100), color: '#10B981' },
          { name: 'Medium Risk (40–69)', count: mediumRiskCount, percentage: Math.round((mediumRiskCount / totalWorks) * 100), color: '#F59E0B' },
          { name: 'High Risk (70–100)', count: highRiskCount, percentage: Math.round((highRiskCount / totalWorks) * 100), color: '#EF4444' },
        ],
        categoryRiskDistribution,
        stateAnalytics,
        priorityQueue: formattedPriorityQueue,
        trendData,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching dashboard stats' });
  }
};
