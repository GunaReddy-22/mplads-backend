export interface RiskSignals {
  anomaly: number;
  cost: number;
  delay: number;
  similarity: number;
  payment: number;
  geo: number;
}

export interface ContributionFactor {
  factor: string;
  points: number;
  desc: string;
}

export interface RiskAnalysisResult {
  overallRisk: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: RiskSignals;
  reasons: string[];
  contributions: ContributionFactor[];
  recommendedAction: string;
  modelVersion: string;
}

export interface IRiskAnalysisService {
  evaluateWorkRisk(workData: any): Promise<RiskAnalysisResult>;
  calculateCompositeScore(signals: RiskSignals): { overallScore: number; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' };
}

/**
 * Standard Prototype Risk Analysis Engine
 * Uses deterministic feature benchmarking and composite weights:
 * Risk = 0.25*Anomaly + 0.25*Cost + 0.20*Delay + 0.15*Duplicate + 0.10*Payment + 0.05*Geo
 */
export class DemoRiskAnalysisService implements IRiskAnalysisService {
  calculateCompositeScore(signals: RiskSignals): { overallScore: number; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' } {
    const overallScore = Math.round(
      0.25 * signals.anomaly +
      0.25 * signals.cost +
      0.20 * signals.delay +
      0.15 * signals.similarity +
      0.10 * signals.payment +
      0.05 * signals.geo
    );

    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (overallScore >= 70) {
      riskLevel = 'HIGH';
    } else if (overallScore >= 40) {
      riskLevel = 'MEDIUM';
    }

    return { overallScore, riskLevel };
  }

  async evaluateWorkRisk(workData: any): Promise<RiskAnalysisResult> {
    const peerCost = workData.peerBenchmarkCost || workData.estimatedCost || 3000000;
    const costRatio = workData.sanctionAmount / peerCost;
    
    // 1. Cost Benchmark Signal
    let costSignal = 20;
    if (costRatio > 1.4) costSignal = 90;
    else if (costRatio > 1.2) costSignal = 65;
    else if (costRatio > 1.1) costSignal = 45;

    // 2. Delay Signal
    let delaySignal = 20;
    if (workData.status === 'DELAYED') delaySignal = 85;
    else if (workData.physicalProgress < 40 && workData.financialProgress > 70) delaySignal = 75;

    // 3. Payment Velocity Signal
    let paymentSignal = 25;
    const progDiff = workData.financialProgress - workData.physicalProgress;
    if (progDiff > 40) paymentSignal = 88;
    else if (progDiff > 20) paymentSignal = 60;

    // 4. Anomaly Signal
    let anomalySignal = Math.max(costSignal, delaySignal, paymentSignal) > 70 ? 80 : 30;

    const signals: RiskSignals = {
      anomaly: anomalySignal,
      cost: costSignal,
      delay: delaySignal,
      similarity: workData.isSimilarPair ? 85 : 20,
      payment: paymentSignal,
      geo: 35,
    };

    const { overallScore, riskLevel } = this.calculateCompositeScore(signals);

    const reasons: string[] = [];
    if (costRatio > 1.25) reasons.push(`Project sanction amount exceeds peer benchmark by ${((costRatio - 1) * 100).toFixed(1)}%.`);
    if (progDiff > 30) reasons.push(`Financial expenditure (${workData.financialProgress}%) outpaces physical milestone (${workData.physicalProgress}%).`);
    if (workData.status === 'DELAYED') reasons.push('Project execution is lagging beyond stipulated completion timeframe.');
    if (reasons.length === 0) reasons.push('Project parameters align with category benchmark tolerances.');

    const contributions: ContributionFactor[] = [
      { factor: 'Cost Deviation', points: Math.round(signals.cost * 0.25), desc: 'Cost benchmark evaluation' },
      { factor: 'Timeline / Delay', points: Math.round(signals.delay * 0.20), desc: 'Progress timeline risk' },
      { factor: 'General Anomaly', points: Math.round(signals.anomaly * 0.25), desc: 'Isolation forest multivariate signal' },
      { factor: 'Payment Pattern', points: Math.round(signals.payment * 0.10), desc: 'Expenditure velocity' },
      { factor: 'Similarity Signal', points: Math.round(signals.similarity * 0.15), desc: 'Contextual semantic similarity' },
      { factor: 'Geographic Factor', points: Math.round(signals.geo * 0.05), desc: 'District risk cluster weight' },
    ];

    return {
      overallRisk: overallScore,
      riskLevel,
      signals,
      reasons,
      contributions,
      recommendedAction: riskLevel === 'HIGH' ? 'PRIORITY_VERIFICATION' : (riskLevel === 'MEDIUM' ? 'DESK_REVIEW' : 'ROUTINE_INSPECTION'),
      modelVersion: 'v1.2.4-hybrid-ensemble',
    };
  }
}

// Future ML Risk Analysis Service adapter stub
export class MLRiskAnalysisService implements IRiskAnalysisService {
  async evaluateWorkRisk(workData: any): Promise<RiskAnalysisResult> {
    // In future: HTTP POST to Python FastAPI ML service
    // e.g. await axios.post('http://ml-service:8000/api/predict', workData)
    throw new Error('ML Service integration is scheduled for production phase.');
  }

  calculateCompositeScore(signals: RiskSignals) {
    return new DemoRiskAnalysisService().calculateCompositeScore(signals);
  }
}

export const riskService = new DemoRiskAnalysisService();
