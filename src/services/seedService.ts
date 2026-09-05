import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

// Deterministic Pseudo-Random Generator
let seedState = 42;
function random() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}

function randomInRange(min: number, max: number) {
  return min + random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomInRange(min, max + 1));
}

function pickRandom<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

const STATES_DATA = [
  {
    name: 'Maharashtra',
    code: 'MH',
    districts: [
      { name: 'Pune', code: 'MH-PUN', lat: 18.5204, lng: 73.8567 },
      { name: 'Mumbai Suburban', code: 'MH-MUM', lat: 19.0760, lng: 72.8777 },
      { name: 'Nagpur', code: 'MH-NAG', lat: 21.1458, lng: 79.0882 },
      { name: 'Nashik', code: 'MH-NSK', lat: 19.9975, lng: 73.7898 },
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    districts: [
      { name: 'Lucknow', code: 'UP-LKO', lat: 26.8467, lng: 80.9462 },
      { name: 'Varanasi', code: 'UP-VNS', lat: 25.3176, lng: 82.9739 },
      { name: 'Kanpur Nagar', code: 'UP-KNP', lat: 26.4499, lng: 80.3319 },
      { name: 'Prayagraj', code: 'UP-PRG', lat: 25.4358, lng: 81.8463 },
    ],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    districts: [
      { name: 'Chennai', code: 'TN-CHE', lat: 13.0827, lng: 80.2707 },
      { name: 'Coimbatore', code: 'TN-CBE', lat: 11.0168, lng: 76.9558 },
      { name: 'Madurai', code: 'TN-MDU', lat: 9.9252, lng: 78.1198 },
      { name: 'Tiruchirappalli', code: 'TN-TPJ', lat: 10.7905, lng: 78.7047 },
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    districts: [
      { name: 'Bengaluru Urban', code: 'KA-BLR', lat: 12.9716, lng: 77.5946 },
      { name: 'Mysuru', code: 'KA-MYS', lat: 12.2958, lng: 76.6394 },
      { name: 'Belagavi', code: 'KA-BEL', lat: 15.8497, lng: 74.4977 },
      { name: 'Dharwad', code: 'KA-DHD', lat: 15.4589, lng: 75.0078 },
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    districts: [
      { name: 'Ahmedabad', code: 'GJ-AHM', lat: 23.0225, lng: 72.5714 },
      { name: 'Surat', code: 'GJ-SUR', lat: 21.1702, lng: 72.8311 },
      { name: 'Vadodara', code: 'GJ-BDQ', lat: 22.3072, lng: 73.1812 },
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    districts: [
      { name: 'Jaipur', code: 'RJ-JAI', lat: 26.9124, lng: 75.7873 },
      { name: 'Jodhpur', code: 'RJ-JDH', lat: 26.2389, lng: 73.0243 },
      { name: 'Udaipur', code: 'RJ-UDP', lat: 24.5854, lng: 73.7125 },
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    districts: [
      { name: 'Visakhapatnam', code: 'AP-VSK', lat: 17.6868, lng: 83.2185 },
      { name: 'Guntur', code: 'AP-GNT', lat: 16.3067, lng: 80.4365 },
      { name: 'Vijayawada (NTR)', code: 'AP-BZA', lat: 16.5062, lng: 80.6480 },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    districts: [
      { name: 'Bhopal', code: 'MP-BPL', lat: 23.2599, lng: 77.4126 },
      { name: 'Indore', code: 'MP-IND', lat: 22.7196, lng: 75.8577 },
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    districts: [
      { name: 'Khordha (Bhubaneswar)', code: 'OD-BBI', lat: 20.2961, lng: 85.8245 },
      { name: 'Cuttack', code: 'OD-CTC', lat: 20.4625, lng: 85.8828 },
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    districts: [
      { name: 'Thiruvananthapuram', code: 'KL-TVM', lat: 8.5241, lng: 76.9366 },
      { name: 'Ernakulam (Kochi)', code: 'KL-EKM', lat: 9.9816, lng: 76.2999 },
    ],
  },
];

const CATEGORIES = [
  'Roads & Bridges',
  'Water Facilities & RO Plants',
  'Community Infrastructure',
  'Schools & Educational Facilities',
  'Public Health Centres',
  'Drainage & Sanitation',
  'Solar & Street Lighting',
  'Public Parks & Sports Facilities',
];

const AGENCIES = [
  { name: 'District Rural Development Agency (DRDA)', code: 'DRDA' },
  { name: 'Public Works Department (PWD - Division 1)', code: 'PWD-01' },
  { name: 'Rural Water Supply & Sanitation (RWSS)', code: 'RWSS' },
  { name: 'Municipal Infrastructure Development Corp', code: 'MIDC' },
  { name: 'Zilla Parishad Engineering Division', code: 'ZPED' },
];

const WORK_TEMPLATES: Record<string, string[]> = {
  'Roads & Bridges': [
    'Construction of CC Road connecting Main Junction to GP High School',
    'Asphalt laying and shoulder improvement from Village Border to Market',
    'Construction of Box Culvert and approach link on Canal Road',
    'Widening and resurfacing of rural link road with paver side-blocks',
  ],
  'Water Facilities & RO Plants': [
    'Installation of 1000 LPH Solar-Powered Community RO Drinking Water Plant',
    'Construction of Overhead Water Storage Tank with Distribution Pipeline',
    'Deep Borewell drilling and pipeline connectivity for Ward No. 4 & 5',
    'Rejuvenation of Traditional Village Water Reservoir & Recharge Pit',
  ],
  'Community Infrastructure': [
    'Construction of Multi-Purpose Community Hall with Solar Rooftop',
    'Construction of Gram Panchayat Skill Training & Digital Resource Centre',
    'Development of Mahila Samarthya Kendra & Artisan Shed',
    'Construction of Cyclone / Disaster Resilient Community Shelter',
  ],
  'Schools & Educational Facilities': [
    'Construction of 2 Additional Classrooms & STEM Lab at Govt High School',
    'Development of Smart Digital Classrooms and Library Facility',
    'Modern Toilet & Sanitation Block for Girls at Zilla Parishad School',
    'Construction of Dining Hall & Kitchen Shed for Mid-Day Meal Scheme',
  ],
  'Public Health Centres': [
    'Upgradation of Primary Health Centre with Modern Diagnostic Lab',
    'Construction of Maternity & Child Health Wing at Sub-Centre',
    'Installation of Oxygen Pipeline & Emergency Care Facility at Rural PHC',
    'Renovation and equipment provision for Ayushman Arogya Mandir',
  ],
  'Drainage & Sanitation': [
    'Construction of Underground Covered RCC Drainage System (Sector 2)',
    'Stormwater Drainage Channel & Silt Trap Construction at Village Center',
    'Construction of Community Sanitary Complex with Septic Bio-Digester',
    'Solid Waste Segregation Shed & Material Recovery Facility',
  ],
  'Solar & Street Lighting': [
    'Installation of 150 Integrated LED Solar Street Lights with Smart Timer',
    'High-Mast Solar Lighting Tower at Rural Weekly Market Yard & Bus Stand',
    'Decentralized Rooftop Solar PV Installation at Community Buildings',
    'Solar-Powered LED Illumination across Critical Rural Intersections',
  ],
  'Public Parks & Sports Facilities': [
    'Development of Open Air Gymnasium and Youth Sports Complex',
    'Construction of Multi-Purpose Rural Sports Ground and Running Track',
    'Public Park Beautification with Walking Track & Children Play Equipment',
    'Construction of Badminton & Volley Ball Court with High Floodlights',
  ],
};

export async function initializeAndSeedDatabase() {
  try {
    const existingWorksCount = await prisma.work.count();
    if (existingWorksCount >= 100) {
      console.log(`✅ Database already seeded (${existingWorksCount} works found). Skipping initialization.`);
      return;
    }

    console.log('🚀 Initializing and seeding MPLADS AI Database...');

    // Clean existing
    await prisma.inspection.deleteMany().catch(() => {});
    await prisma.alert.deleteMany().catch(() => {});
    await prisma.similarWork.deleteMany().catch(() => {});
    await prisma.riskAssessment.deleteMany().catch(() => {});
    await prisma.work.deleteMany().catch(() => {});
    await prisma.implementingAgency.deleteMany().catch(() => {});
    await prisma.district.deleteMany().catch(() => {});
    await prisma.state.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.auditLog.deleteMany().catch(() => {});
    await prisma.dataImport.deleteMany().catch(() => {});

    // Create Admin
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@mplads.ai',
        password: passwordHash,
        name: 'Dr. Ramesh Sharma (IAS)',
        role: 'CENTRAL_ADMIN',
        department: 'Ministry of Statistics and Programme Implementation (MoSPI)',
      },
    });

    const createdDistricts: any[] = [];
    const createdAgencies: any[] = [];

    for (const s of STATES_DATA) {
      const state = await prisma.state.create({
        data: { name: s.name, code: s.code },
      });

      for (const d of s.districts) {
        const district = await prisma.district.create({
          data: {
            name: d.name,
            code: d.code,
            stateId: state.id,
            latitude: d.lat,
            longitude: d.lng,
          },
        });
        createdDistricts.push({ ...district, stateCode: s.code, stateName: s.name });

        for (const a of AGENCIES) {
          const agency = await prisma.implementingAgency.create({
            data: {
              name: `${a.name} - ${d.name}`,
              code: `${a.code}-${d.code}`,
              districtId: district.id,
            },
          });
          createdAgencies.push(agency);
        }
      }
    }

    const puneDistrict = createdDistricts.find((d) => d.name === 'Pune') || createdDistricts[0];
    const drdaPune = createdAgencies.find((a) => a.districtId === puneDistrict.id) || createdAgencies[0];

    // CASE 4 Partner
    const case4Candidate = await prisma.work.create({
      data: {
        workId: 'MPLADS-00418',
        workName: 'Construction of Community Skill Centre & Digital Hub, Block A, Gram Panchayat Complex',
        description: 'Construction of 2-storey community training facility with digital computer laboratory, electrical wiring, sanitary fixtures, and furniture.',
        category: 'Community Infrastructure',
        stateId: puneDistrict.stateId,
        districtId: puneDistrict.id,
        agencyId: drdaPune.id,
        sanctionDate: new Date('2024-04-10'),
        startDate: new Date('2024-05-01'),
        expectedCompletionDate: new Date('2025-01-31'),
        status: 'ONGOING',
        sanctionAmount: 4150000,
        estimatedCost: 4150000,
        expenditureAmount: 3300000,
        physicalProgress: 72.0,
        financialProgress: 79.5,
        latitude: 18.5204 + 0.008,
        longitude: 73.8567 + 0.005,
        address: 'Near Old Gram Panchayat Bhavan, Haveli Tehsil',
        village: 'Wagholi Rural',
        isHeroCase: false,
        isSimilarPair: true,
        peerBenchmarkCost: 3100000,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        workId: case4Candidate.id,
        anomalyScore: 48,
        costScore: 54,
        delayScore: 35,
        duplicateScore: 88,
        paymentScore: 42,
        geoScore: 65,
        overallScore: 52,
        riskLevel: 'MEDIUM',
        reasons: JSON.stringify([
          'High semantic and spatial proximity match with nearby recommended project MPLADS-00421 (1.4 km).',
          'Cost is slightly above historical peer cluster average (+33.8%).',
        ]),
        contributions: JSON.stringify([
          { factor: 'Duplicate Signal', points: 18, desc: 'Semantic overlap with MPLADS-00421' },
          { factor: 'Cost Deviation', points: 14, desc: 'Cost above standard benchmark' },
          { factor: 'Timeline/Delay', points: 9, desc: 'Minor schedule variance' },
          { factor: 'Payment Velocity', points: 7, desc: 'Normal milestone payout' },
          { factor: 'Geographic Factor', points: 4, desc: 'Dense cluster region' },
        ]),
        recommendedAction: 'DESK_REVIEW',
        modelVersion: 'v1.2.4-hybrid-ensemble',
      },
    });

    // HERO CASE: MPLADS-00421 (84/100 HIGH RISK)
    const heroWork = await prisma.work.create({
      data: {
        workId: 'MPLADS-00421',
        workName: 'Community Infrastructure Development & Skill Hub',
        description: 'Multi-purpose skill development center, digital resource wing, community training hall with RCC foundation, electrical fittings, and water sanitation utilities.',
        category: 'Community Infrastructure',
        stateId: puneDistrict.stateId,
        districtId: puneDistrict.id,
        agencyId: drdaPune.id,
        sanctionDate: new Date('2024-03-15'),
        startDate: new Date('2024-04-01'),
        expectedCompletionDate: new Date('2024-12-31'),
        status: 'ONGOING',
        sanctionAmount: 4200000,
        estimatedCost: 4200000,
        expenditureAmount: 3450000,
        physicalProgress: 38.0,
        financialProgress: 82.1,
        latitude: 18.5312,
        longitude: 73.8645,
        address: 'Plot No. 14, Main Road, Gram Panchayat Area, Haveli Tehsil',
        village: 'Wagholi Center',
        isHeroCase: true,
        isSimilarPair: true,
        peerBenchmarkCost: 3040000,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        workId: heroWork.id,
        anomalyScore: 82,
        costScore: 91,
        delayScore: 76,
        duplicateScore: 91,
        paymentScore: 84,
        geoScore: 58,
        overallScore: 84,
        riskLevel: 'HIGH',
        reasons: JSON.stringify([
          'Cost is significantly above comparable peer works (+38.2% vs peer median ₹30.40L).',
          'Physical progress (38%) is critically low relative to elapsed duration (78% timeline elapsed).',
          'Expenditure velocity anomaly: 82.1% funds disbursed with only 38% physical milestone completion.',
          'Potentially similar work detected within 1.4 km (MPLADS-00418 - 91% semantic & cost similarity).',
          'Compliance milestone alert: Third-party stage inspection report overdue by 45 days.',
        ]),
        contributions: JSON.stringify([
          { factor: 'Cost Deviation', points: 24, desc: 'Exceeds peer cost benchmark by 38.2%' },
          { factor: 'Delay / Progress', points: 19, desc: 'High elapsed duration vs low physical progress' },
          { factor: 'Expenditure Pattern', points: 17, desc: '82.1% funds drawn with 38% physical progress' },
          { factor: 'Similarity Signal', points: 12, desc: '91% NLP match with MPLADS-00418 (1.4 km)' },
          { factor: 'Progress Inconsistency', points: 8, desc: 'Unusual expenditure acceleration in Q3' },
          { factor: 'Geographic Factor', points: 4, desc: 'Proximity cluster in sub-district zone' },
        ]),
        recommendedAction: 'PRIORITY_VERIFICATION',
        modelVersion: 'v1.2.4-hybrid-ensemble',
      },
    });

    await prisma.similarWork.create({
      data: {
        primaryWorkId: heroWork.id,
        candidateWorkId: case4Candidate.id,
        similarityScore: 91.4,
        distanceKm: 1.4,
        categoryMatch: true,
        costSimilarity: 98.8,
        reasons: 'High NLP semantic embedding match (0.914) between project scope descriptions, identical category (Community Infrastructure), and spatial distance of only 1.4 km in same sub-district.',
      },
    });

    await prisma.alert.create({
      data: {
        workId: heroWork.id,
        title: 'Multi-Signal Critical Anomaly Flagged on MPLADS-00421',
        description: 'Composite risk score 84/100 triggered by Cost Deviation (+24), Timeline Delay (+19), and Potential Similar Work (+12) within 1.4 km radius.',
        riskLevel: 'HIGH',
        alertType: 'COST_DEVIATION',
        status: 'NEW',
      },
    });

    // CASE 1: High Cost
    const case1Work = await prisma.work.create({
      data: {
        workId: 'MPLADS-00104',
        workName: 'Construction of Multi-Purpose Cyclone Shelter & Community Center',
        description: 'Standard single-tier cyclone resilience shelter building with emergency power backup and water collection facility.',
        category: 'Community Infrastructure',
        stateId: puneDistrict.stateId,
        districtId: puneDistrict.id,
        agencyId: drdaPune.id,
        sanctionDate: new Date('2024-01-10'),
        startDate: new Date('2024-02-01'),
        expectedCompletionDate: new Date('2024-11-30'),
        status: 'ONGOING',
        sanctionAmount: 12000000,
        estimatedCost: 12000000,
        expenditureAmount: 9600000,
        physicalProgress: 60.0,
        financialProgress: 80.0,
        latitude: 18.5401,
        longitude: 73.8412,
        address: 'Coastal Vulnerable Zone, Sector 4',
        village: 'Manchar Sub-division',
        isHeroCase: false,
        isSimilarPair: false,
        peerBenchmarkCost: 4500000,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        workId: case1Work.id,
        anomalyScore: 88,
        costScore: 94,
        delayScore: 45,
        duplicateScore: 30,
        paymentScore: 68,
        geoScore: 50,
        overallScore: 78,
        riskLevel: 'HIGH',
        reasons: JSON.stringify([
          'Estimated project cost (₹1.20 Cr) is 166.7% higher than the district peer benchmark (₹45.00 Lakhs).',
        ]),
        contributions: JSON.stringify([
          { factor: 'Cost Deviation', points: 36, desc: '166% above peer benchmark' },
          { factor: 'General Anomaly', points: 20, desc: 'High outlier in multivariate Isolation Forest' },
          { factor: 'Payment Pattern', points: 12, desc: 'Rapid stage disbursements' },
        ]),
        recommendedAction: 'PRIORITY_VERIFICATION',
        modelVersion: 'v1.2.4-hybrid-ensemble',
      },
    });

    // CASE 2: Delayed
    const case2Work = await prisma.work.create({
      data: {
        workId: 'MPLADS-00219',
        workName: 'Underground Drainage Network & Sewage Treatment Facility',
        description: 'Installation of 4.5 km underground sewage drainage line and mini decentralized effluent treatment facility.',
        category: 'Drainage & Sanitation',
        stateId: puneDistrict.stateId,
        districtId: puneDistrict.id,
        agencyId: drdaPune.id,
        sanctionDate: new Date('2022-06-15'),
        startDate: new Date('2022-07-20'),
        expectedCompletionDate: new Date('2023-06-30'),
        status: 'DELAYED',
        sanctionAmount: 6500000,
        estimatedCost: 6500000,
        expenditureAmount: 2600000,
        physicalProgress: 18.0,
        financialProgress: 40.0,
        latitude: 18.5110,
        longitude: 73.8690,
        address: 'Old Ward 7, Drainage Corridor',
        village: 'Chakan Industrial Fringe',
        isHeroCase: false,
        isSimilarPair: false,
        peerBenchmarkCost: 6200000,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        workId: case2Work.id,
        anomalyScore: 72,
        costScore: 35,
        delayScore: 96,
        duplicateScore: 20,
        paymentScore: 55,
        geoScore: 40,
        overallScore: 74,
        riskLevel: 'HIGH',
        reasons: JSON.stringify(['Critical project delay: 615+ days elapsed past expected completion date.']),
        contributions: JSON.stringify([
          { factor: 'Delay / Timeline', points: 38, desc: '600+ days past deadline' },
          { factor: 'General Anomaly', points: 18, desc: 'Stalled physical progress anomaly' },
        ]),
        recommendedAction: 'FIELD_INSPECTION_REQUIRED',
        modelVersion: 'v1.2.4-hybrid-ensemble',
      },
    });

    // CASE 3: Financial Mismatch
    const case3Work = await prisma.work.create({
      data: {
        workId: 'MPLADS-00350',
        workName: 'Upgradation of Rural Public Health Centre & Diagnostic Wing',
        description: 'Civil expansion of diagnostic room, medical equipment installation, and solar cold chain storage facility.',
        category: 'Public Health Centres',
        stateId: puneDistrict.stateId,
        districtId: puneDistrict.id,
        agencyId: drdaPune.id,
        sanctionDate: new Date('2023-09-01'),
        startDate: new Date('2023-10-01'),
        expectedCompletionDate: new Date('2024-08-31'),
        status: 'ONGOING',
        sanctionAmount: 5500000,
        estimatedCost: 5500000,
        expenditureAmount: 4510000,
        physicalProgress: 34.0,
        financialProgress: 82.0,
        latitude: 18.5550,
        longitude: 73.8320,
        address: 'Near Taluka Hospital, PHC Campus',
        village: 'Shirur Sub-District',
        isHeroCase: false,
        isSimilarPair: false,
        peerBenchmarkCost: 5200000,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        workId: case3Work.id,
        anomalyScore: 81,
        costScore: 48,
        delayScore: 65,
        duplicateScore: 25,
        paymentScore: 92,
        geoScore: 45,
        overallScore: 76,
        riskLevel: 'HIGH',
        reasons: JSON.stringify([
          'Severe progress/expenditure inconsistency: 82.0% funds drawn vs 34.0% physical execution.',
        ]),
        contributions: JSON.stringify([
          { factor: 'Payment / Mismatch', points: 32, desc: '82% funds vs 34% physical progress' },
          { factor: 'General Anomaly', points: 22, desc: 'Fund velocity outlier' },
        ]),
        recommendedAction: 'DOCUMENT_REVIEW_REQUIRED',
        modelVersion: 'v1.2.4-hybrid-ensemble',
      },
    });

    // Generate ~995 remaining realistic works
    const totalTarget = 1000;
    const remaining = totalTarget - 5;
    let highNeeded = 48;
    let medNeeded = 240;
    let lowNeeded = 707;

    const usedWorkIds = new Set(['MPLADS-00418', 'MPLADS-00421', 'MPLADS-00104', 'MPLADS-00219', 'MPLADS-00350']);
    let idCounter = 1;

    const worksBatch: any[] = [];

    for (let i = 1; i <= remaining; i++) {
      while (usedWorkIds.has(`MPLADS-${idCounter.toString().padStart(5, '0')}`)) {
        idCounter++;
      }
      const workId = `MPLADS-${idCounter.toString().padStart(5, '0')}`;
      usedWorkIds.add(workId);
      idCounter++;

      const district = pickRandom(createdDistricts);
      const agency = createdAgencies.find((a) => a.districtId === district.id) || pickRandom(createdAgencies);
      const category = pickRandom(CATEGORIES);
      const titleTemplate = pickRandom(WORK_TEMPLATES[category]);
      const workName = `${titleTemplate} (${district.name})`;

      let targetRiskTier: 'HIGH' | 'MEDIUM' | 'LOW';
      if (highNeeded > 0 && (random() < 0.06 || (medNeeded === 0 && lowNeeded === 0))) {
        targetRiskTier = 'HIGH';
        highNeeded--;
      } else if (medNeeded > 0 && (random() < 0.30 || lowNeeded === 0)) {
        targetRiskTier = 'MEDIUM';
        medNeeded--;
      } else {
        targetRiskTier = 'LOW';
        lowNeeded--;
      }

      const baseCost = category.includes('Roads') ? randomInRange(3500000, 9500000)
        : category.includes('Drainage') ? randomInRange(4000000, 8500000)
        : randomInRange(2000000, 6000000);

      const peerCost = Math.round(baseCost / 10000) * 10000;
      let sanctionAmount = peerCost;
      let physicalProgress = 0;
      let financialProgress = 0;
      let status = 'ONGOING';
      let overallScore = 0;

      if (targetRiskTier === 'HIGH') {
        sanctionAmount = peerCost * randomInRange(1.35, 1.85);
        physicalProgress = Math.round(randomInRange(15, 48) * 10) / 10;
        financialProgress = Math.round(randomInRange(65, 88) * 10) / 10;
        overallScore = Math.round(randomInRange(71, 88));
      } else if (targetRiskTier === 'MEDIUM') {
        sanctionAmount = peerCost * randomInRange(1.08, 1.28);
        physicalProgress = Math.round(randomInRange(35, 75) * 10) / 10;
        financialProgress = Math.round((physicalProgress + randomInRange(5, 20)) * 10) / 10;
        overallScore = Math.round(randomInRange(41, 68));
      } else {
        sanctionAmount = peerCost * randomInRange(0.92, 1.05);
        const isComp = random() > 0.45;
        status = isComp ? 'COMPLETED' : 'ONGOING';
        physicalProgress = isComp ? 100 : Math.round(randomInRange(45, 90) * 10) / 10;
        financialProgress = isComp ? 100 : Math.round(physicalProgress * 10) / 10;
        overallScore = Math.round(randomInRange(12, 34));
      }

      const estimatedCost = Math.round(sanctionAmount);
      const expenditureAmount = Math.round(estimatedCost * (financialProgress / 100));

      worksBatch.push({
        workId,
        workName,
        description: `${category} development project approved under MPLADS scheme.`,
        category,
        stateId: district.stateId,
        districtId: district.id,
        agencyId: agency.id,
        sanctionDate: new Date(Date.now() - randomInt(180, 700) * 86400000),
        startDate: new Date(Date.now() - randomInt(100, 600) * 86400000),
        expectedCompletionDate: new Date(Date.now() + randomInt(60, 365) * 86400000),
        actualCompletionDate: status === 'COMPLETED' ? new Date() : null,
        status,
        sanctionAmount: estimatedCost,
        estimatedCost,
        expenditureAmount,
        physicalProgress,
        financialProgress,
        latitude: district.latitude + randomInRange(-0.08, 0.08),
        longitude: district.longitude + randomInRange(-0.08, 0.08),
        address: `Ward ${randomInt(1, 24)}, ${district.name} Rural`,
        village: `Gram Panchayat ${randomInt(1, 15)}`,
        peerBenchmarkCost: peerCost,
        riskTier: targetRiskTier,
        riskScore: overallScore,
      });
    }

    for (let b = 0; b < worksBatch.length; b += 50) {
      const chunk = worksBatch.slice(b, b + 50);
      for (const item of chunk) {
        const { riskTier, riskScore, ...wData } = item;
        const w = await prisma.work.create({ data: wData });
        await prisma.riskAssessment.create({
          data: {
            workId: w.id,
            anomalyScore: riskScore,
            costScore: riskScore,
            delayScore: Math.max(10, riskScore - 10),
            duplicateScore: 20,
            paymentScore: riskScore,
            geoScore: 30,
            overallScore: riskScore,
            riskLevel: riskTier,
            reasons: JSON.stringify([`${riskTier} risk indicator flagged by multi-model pipeline.`]),
            contributions: JSON.stringify([
              { factor: 'Anomaly Score', points: Math.round(riskScore * 0.4), desc: 'Multivariate signal' },
              { factor: 'Cost Score', points: Math.round(riskScore * 0.35), desc: 'Peer deviation' },
              { factor: 'Delay Score', points: Math.round(riskScore * 0.25), desc: 'Timeline factor' },
            ]),
            recommendedAction: riskTier === 'HIGH' ? 'PRIORITY_VERIFICATION' : 'ROUTINE_INSPECTION',
            modelVersion: 'v1.2.4-hybrid-ensemble',
          },
        });
      }
    }

    console.log('✅ Database initialization and seeding complete (1,000 works)!');
  } catch (err: any) {
    console.error('⚠️ Database initialization note:', err.message);
  }
}
