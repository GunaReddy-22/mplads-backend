import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
  console.log('--- Starting MPLADS AI Database Seeding ---');

  const existingCount = await prisma.work.count().catch(() => 0);
  if (existingCount >= 100) {
    console.log(`✅ Database already contains ${existingCount} works. Skipping re-seed.`);
    return;
  }

  // 1. Clean existing records
  await prisma.inspection.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.similarWork.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.work.deleteMany();
  await prisma.implementingAgency.deleteMany();
  await prisma.district.deleteMany();
  await prisma.state.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.dataImport.deleteMany();

  // 2. Create Default Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mplads.ai',
      password: passwordHash,
      name: 'Dr. Ramesh Sharma (IAS)',
      role: 'CENTRAL_ADMIN',
      department: 'Ministry of Statistics and Programme Implementation (MoSPI)',
    },
  });
  console.log(`Created Admin User: ${adminUser.email}`);

  // 3. Create States, Districts, Agencies
  const createdDistricts: any[] = [];
  const createdAgencies: any[] = [];

  for (const s of STATES_DATA) {
    const state = await prisma.state.create({
      data: {
        name: s.name,
        code: s.code,
      },
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
  console.log(`Created ${STATES_DATA.length} States, ${createdDistricts.length} Districts, ${createdAgencies.length} Agencies.`);

  // Find Pune district for Hero Showcase Cases
  const puneDistrict = createdDistricts.find(d => d.name === 'Pune') || createdDistricts[0];
  const drdaPune = createdAgencies.find(a => a.districtId === puneDistrict.id) || createdAgencies[0];

  // -------------------------------------------------------------
  // 4. INTENTIONAL SHOWCASE CASES
  // -------------------------------------------------------------

  // CASE 4 Candidate A (Similar work partner)
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

  // CASE 5 (PRIMARY HERO SHOWCASE CASE ⭐⭐⭐ - MPLADS-00421)
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

  const heroAssessment = await prisma.riskAssessment.create({
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

  // Link Similar Work relationship
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

  // Alert for Hero Work
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

  // CASE 1: High Cost Anomaly
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
        'Estimated project cost (₹1.20 Cr) is 166.7% higher than the district peer benchmark (₹45.00 Lakhs) for community shelters.',
        'Expenditure per unit built area significantly exceeds State PWD Schedule of Rates (SoR).',
      ]),
      contributions: JSON.stringify([
        { factor: 'Cost Deviation', points: 36, desc: '166% above peer benchmark' },
        { factor: 'General Anomaly', points: 20, desc: 'High outlier in multivariate Isolation Forest' },
        { factor: 'Payment Pattern', points: 12, desc: 'Rapid stage disbursements' },
        { factor: 'Delay / Progress', points: 6, desc: 'Minor delay from schedule' },
        { factor: 'Geographic Factor', points: 4, desc: 'Standard location factor' },
      ]),
      recommendedAction: 'PRIORITY_VERIFICATION',
      modelVersion: 'v1.2.4-hybrid-ensemble',
    },
  });

  // CASE 2: Delayed Project
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
      reasons: JSON.stringify([
        'Critical project delay: 615+ days elapsed past expected completion date.',
        'Physical progress is severely stalled at 18% with zero contractor log updates in the last 120 days.',
      ]),
      contributions: JSON.stringify([
        { factor: 'Delay / Timeline', points: 38, desc: '600+ days past deadline' },
        { factor: 'General Anomaly', points: 18, desc: 'Stalled physical progress anomaly' },
        { factor: 'Payment Ratio', points: 10, desc: '40% funds used for 18% progress' },
        { factor: 'Cost Variance', points: 5, desc: 'Within peer cost range' },
        { factor: 'Geographic Factor', points: 3, desc: 'Urban fringe corridor' },
      ]),
      recommendedAction: 'FIELD_INSPECTION_REQUIRED',
      modelVersion: 'v1.2.4-hybrid-ensemble',
    },
  });

  // CASE 3: Financial / Physical Mismatch
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
        'Severe progress/expenditure inconsistency: 82.0% of funds drawn while physical execution stands at only 34.0%.',
        'Deviation between financial progress and physical verification exceeds 48 percentage points.',
      ]),
      contributions: JSON.stringify([
        { factor: 'Payment / Expenditure Mismatch', points: 32, desc: '82% funds vs 34% physical progress' },
        { factor: 'General Anomaly', points: 22, desc: 'Significant outlier in fund velocity' },
        { factor: 'Delay / Timeline', points: 12, desc: 'Elapsed milestone mismatch' },
        { factor: 'Cost Variance', points: 6, desc: 'Close to benchmark' },
        { factor: 'Geographic Factor', points: 4, desc: 'Rural center zone' },
      ]),
      recommendedAction: 'DOCUMENT_REVIEW_REQUIRED',
      modelVersion: 'v1.2.4-hybrid-ensemble',
    },
  });

  // -------------------------------------------------------------
  // 5. GENERATE ~995 REALISTIC SYNTHETIC MPLADS WORKS
  // Target distribution: ~52 High (5.2%), ~241 Medium (24.1%), ~707 Low (70.7%)
  // Total: Exactly 1,000 works
  // -------------------------------------------------------------
  console.log('Generating remaining realistic synthetic works...');
  
  const totalTarget = 1000;
  const currentCount = 5; // We created 5 showcase cases already (MPLADS-00418, 00421, 00104, 00219, 00350)
  const remaining = totalTarget - currentCount;

  // Let's budget:
  // High Risk remaining: 52 - 4 = 48
  // Medium Risk remaining: 241 - 1 = 240
  // Low Risk remaining: 707 - 0 = 707
  let highNeeded = 48;
  let medNeeded = 240;
  let lowNeeded = 707;

  const worksBatch = [];
  const riskBatch = [];
  const alertsBatch = [];

  const usedWorkIds = new Set(['MPLADS-00418', 'MPLADS-00421', 'MPLADS-00104', 'MPLADS-00219', 'MPLADS-00350']);
  let idCounter = 1;

  for (let i = 1; i <= remaining; i++) {
    while (usedWorkIds.has(`MPLADS-${idCounter.toString().padStart(5, '0')}`)) {
      idCounter++;
    }
    const workId = `MPLADS-${idCounter.toString().padStart(5, '0')}`;
    usedWorkIds.add(workId);
    idCounter++;

    const district = pickRandom(createdDistricts);
    const agency = createdAgencies.find(a => a.districtId === district.id) || pickRandom(createdAgencies);
    const category = pickRandom(CATEGORIES);
    const titleTemplate = pickRandom(WORK_TEMPLATES[category]);
    const workName = `${titleTemplate} (${district.name})`;

    // Determine target risk tier
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

    // Realistic financial amounts
    const baseCost = category.includes('Roads') ? randomInRange(3500000, 9500000)
      : category.includes('Drainage') ? randomInRange(4000000, 8500000)
      : category.includes('Health') ? randomInRange(3000000, 7500000)
      : category.includes('Solar') ? randomInRange(1500000, 4000000)
      : randomInRange(2000000, 6000000);

    const peerCost = Math.round(baseCost / 10000) * 10000;
    
    let sanctionAmount = peerCost;
    let physicalProgress = 0;
    let financialProgress = 0;
    let status = 'ONGOING';

    let anomalyScore = 0;
    let costScore = 0;
    let delayScore = 0;
    let duplicateScore = 0;
    let paymentScore = 0;
    let geoScore = 0;
    let overallScore = 0;
    let reasons: string[] = [];
    let contributions: any[] = [];
    let recommendedAction = 'MONITOR';

    if (targetRiskTier === 'HIGH') {
      // Elevated signals
      const isCostHigh = random() > 0.5;
      const isDelayHigh = random() > 0.4;
      const isProgressMismatch = random() > 0.5;

      sanctionAmount = isCostHigh ? peerCost * randomInRange(1.35, 1.85) : peerCost * randomInRange(1.05, 1.25);
      physicalProgress = Math.round(randomInRange(15, 48) * 10) / 10;
      financialProgress = isProgressMismatch ? Math.round(randomInRange(65, 88) * 10) / 10 : Math.round(randomInRange(30, 55) * 10) / 10;
      status = isDelayHigh ? 'DELAYED' : 'ONGOING';

      costScore = isCostHigh ? Math.round(randomInRange(75, 95)) : Math.round(randomInRange(45, 68));
      delayScore = isDelayHigh ? Math.round(randomInRange(70, 95)) : Math.round(randomInRange(40, 65));
      anomalyScore = Math.round(randomInRange(70, 90));
      paymentScore = isProgressMismatch ? Math.round(randomInRange(72, 92)) : Math.round(randomInRange(40, 60));
      duplicateScore = Math.round(randomInRange(20, 55));
      geoScore = Math.round(randomInRange(35, 65));

      overallScore = Math.round(0.25 * anomalyScore + 0.25 * costScore + 0.20 * delayScore + 0.15 * duplicateScore + 0.10 * paymentScore + 0.05 * geoScore);
      if (overallScore < 70) overallScore = Math.round(randomInRange(71, 88));

      reasons.push(isCostHigh ? `Sanction cost ₹${(sanctionAmount / 100000).toFixed(2)}L exceeds category peer benchmark by ${(((sanctionAmount - peerCost) / peerCost) * 100).toFixed(1)}%.` : 'Multivariate anomaly detected in expenditure pattern.');
      if (isDelayHigh) reasons.push('Elapsed project duration exceeds scheduled timeline with lagging physical progress.');
      if (isProgressMismatch) reasons.push(`Financial disbursement (${financialProgress}%) is disproportionately ahead of physical completion (${physicalProgress}%).`);
      
      contributions = [
        { factor: 'Cost Deviation', points: Math.round(costScore * 0.25), desc: isCostHigh ? 'Cost variance above peer median' : 'Moderate cost deviation' },
        { factor: 'Timeline / Delay', points: Math.round(delayScore * 0.20), desc: 'Progress timeline risk' },
        { factor: 'General Anomaly', points: Math.round(anomalyScore * 0.25), desc: 'Isolation forest outlier flag' },
        { factor: 'Payment Pattern', points: Math.round(paymentScore * 0.10), desc: 'Disbursement velocity' },
        { factor: 'Duplicate Signal', points: Math.round(duplicateScore * 0.15), desc: 'Contextual similarity check' },
        { factor: 'Geographic Factor', points: Math.round(geoScore * 0.05), desc: 'District risk cluster' },
      ];
      recommendedAction = random() > 0.5 ? 'PRIORITY_VERIFICATION' : 'FIELD_INSPECTION_REQUIRED';

    } else if (targetRiskTier === 'MEDIUM') {
      sanctionAmount = peerCost * randomInRange(1.08, 1.28);
      physicalProgress = Math.round(randomInRange(35, 75) * 10) / 10;
      financialProgress = Math.round((physicalProgress + randomInRange(5, 20)) * 10) / 10;
      if (financialProgress > 95) financialProgress = 95;
      status = random() > 0.8 ? 'DELAYED' : 'ONGOING';

      costScore = Math.round(randomInRange(40, 68));
      delayScore = Math.round(randomInRange(38, 65));
      anomalyScore = Math.round(randomInRange(42, 66));
      paymentScore = Math.round(randomInRange(35, 60));
      duplicateScore = Math.round(randomInRange(25, 55));
      geoScore = Math.round(randomInRange(30, 55));

      overallScore = Math.round(0.25 * anomalyScore + 0.25 * costScore + 0.20 * delayScore + 0.15 * duplicateScore + 0.10 * paymentScore + 0.05 * geoScore);
      if (overallScore < 40) overallScore = Math.round(randomInRange(41, 68));
      if (overallScore >= 70) overallScore = 67;

      reasons.push('Moderate variance detected in project timeline and material expenditure rates.');
      if (financialProgress - physicalProgress > 15) {
        reasons.push(`Disbursement advance (${financialProgress}%) slightly exceeds verified physical milestone (${physicalProgress}%).`);
      }

      contributions = [
        { factor: 'Cost Deviation', points: Math.round(costScore * 0.25), desc: 'Slight cost increase over norm' },
        { factor: 'General Anomaly', points: Math.round(anomalyScore * 0.25), desc: 'Moderate feature variance' },
        { factor: 'Timeline / Delay', points: Math.round(delayScore * 0.20), desc: 'Minor schedule lag' },
        { factor: 'Payment Ratio', points: Math.round(paymentScore * 0.10), desc: 'Normal stage release' },
        { factor: 'Similarity Signal', points: Math.round(duplicateScore * 0.15), desc: 'Standard category match' },
        { factor: 'Geographic Factor', points: Math.round(geoScore * 0.05), desc: 'Regional baseline' },
      ];
      recommendedAction = 'DESK_REVIEW';

    } else {
      // LOW RISK
      sanctionAmount = peerCost * randomInRange(0.92, 1.05);
      const isCompleted = random() > 0.45;
      status = isCompleted ? 'COMPLETED' : 'ONGOING';
      physicalProgress = isCompleted ? 100.0 : Math.round(randomInRange(45, 90) * 10) / 10;
      financialProgress = isCompleted ? 100.0 : Math.round((physicalProgress + randomInRange(-3, 6)) * 10) / 10;
      if (financialProgress < 0) financialProgress = 0;
      if (financialProgress > 100) financialProgress = 100;

      costScore = Math.round(randomInRange(10, 35));
      delayScore = Math.round(randomInRange(8, 30));
      anomalyScore = Math.round(randomInRange(12, 32));
      paymentScore = Math.round(randomInRange(10, 30));
      duplicateScore = Math.round(randomInRange(5, 25));
      geoScore = Math.round(randomInRange(10, 25));

      overallScore = Math.round(0.25 * anomalyScore + 0.25 * costScore + 0.20 * delayScore + 0.15 * duplicateScore + 0.10 * paymentScore + 0.05 * geoScore);
      if (overallScore >= 40) overallScore = Math.round(randomInRange(12, 34));

      reasons.push('Project execution metrics, fund utilization, and physical milestones align with historical district norms.');
      contributions = [
        { factor: 'General Baseline', points: Math.round(anomalyScore * 0.25), desc: 'Conforming behavior' },
        { factor: 'Cost Conformance', points: Math.round(costScore * 0.25), desc: 'Within standard schedule of rates' },
        { factor: 'Timeline Schedule', points: Math.round(delayScore * 0.20), desc: 'On-track execution' },
        { factor: 'Payment Alignment', points: Math.round(paymentScore * 0.10), desc: 'Milestone verified' },
        { factor: 'Similarity Signal', points: Math.round(duplicateScore * 0.15), desc: 'Unique scope' },
        { factor: 'Geographic Factor', points: Math.round(geoScore * 0.05), desc: 'Standard zone' },
      ];
      recommendedAction = 'ROUTINE_INSPECTION';
    }

    const estimatedCost = Math.round(sanctionAmount);
    const expenditureAmount = Math.round(estimatedCost * (financialProgress / 100));

    // Coordinates with jitter around district center
    const lat = district.latitude + randomInRange(-0.08, 0.08);
    const lng = district.longitude + randomInRange(-0.08, 0.08);

    const sanctionDate = new Date(Date.now() - randomInt(180, 700) * 24 * 60 * 60 * 1000);
    const startDate = new Date(sanctionDate.getTime() + randomInt(15, 45) * 24 * 60 * 60 * 1000);
    const expectedCompletionDate = new Date(startDate.getTime() + randomInt(180, 365) * 24 * 60 * 60 * 1000);
    const actualCompletionDate = status === 'COMPLETED' ? new Date(expectedCompletionDate.getTime() + randomInt(-20, 30) * 24 * 60 * 60 * 1000) : null;

    const workRecord = {
      workId,
      workName,
      description: `${category} development project approved under MPLADS scheme to serve local community needs.`,
      category,
      stateId: district.stateId,
      districtId: district.id,
      agencyId: agency.id,
      sanctionDate,
      startDate,
      expectedCompletionDate,
      actualCompletionDate,
      status,
      sanctionAmount: estimatedCost,
      estimatedCost,
      expenditureAmount,
      physicalProgress,
      financialProgress,
      latitude: lat,
      longitude: lng,
      address: `Ward ${randomInt(1, 24)}, ${district.name} Rural Sector`,
      village: `Gram Panchayat Sector ${randomInt(1, 15)}`,
      peerBenchmarkCost: peerCost,
      riskTier: targetRiskTier,
      riskData: {
        anomalyScore,
        costScore,
        delayScore,
        duplicateScore,
        paymentScore,
        geoScore,
        overallScore,
        riskLevel: targetRiskTier,
        reasons: JSON.stringify(reasons),
        contributions: JSON.stringify(contributions),
        recommendedAction,
      },
    };

    worksBatch.push(workRecord);
  }

  // Insert in chunks to SQLite/Postgres
  console.log(`Inserting ${worksBatch.length} generated works...`);
  for (let b = 0; b < worksBatch.length; b += 100) {
    const chunk = worksBatch.slice(b, b + 100);
    for (const item of chunk) {
      const { riskData, riskTier, ...wData } = item;
      const createdWork = await prisma.work.create({
        data: wData,
      });

      await prisma.riskAssessment.create({
        data: {
          workId: createdWork.id,
          ...riskData,
          modelVersion: 'v1.2.4-hybrid-ensemble',
        },
      });

      if (riskTier === 'HIGH') {
        await prisma.alert.create({
          data: {
            workId: createdWork.id,
            title: `Elevated Risk Alert: ${createdWork.workId}`,
            description: `Composite risk score ${riskData.overallScore}/100 detected in ${createdWork.category} (${districtName(createdWork.districtId, createdDistricts)}).`,
            riskLevel: 'HIGH',
            alertType: riskData.costScore > 75 ? 'COST_DEVIATION' : (riskData.delayScore > 75 ? 'DELAY_RISK' : 'PROGRESS_MISMATCH'),
            status: random() > 0.4 ? 'NEW' : 'UNDER_REVIEW',
          },
        });
      } else if (riskTier === 'MEDIUM' && random() > 0.6) {
        await prisma.alert.create({
          data: {
            workId: createdWork.id,
            title: `Medium Risk Review: ${createdWork.workId}`,
            description: `Moderate risk variance score ${riskData.overallScore}/100 in ${createdWork.category}.`,
            riskLevel: 'MEDIUM',
            alertType: 'DELAY_RISK',
            status: 'NEW',
          },
        });
      }
    }
  }

  // Helper to resolve district name
  function districtName(dId: string, list: any[]) {
    return list.find(d => d.id === dId)?.name || 'District';
  }

  // 6. Create Initial Data Import Record
  await prisma.dataImport.create({
    data: {
      fileName: 'eSAKSHI_MPLADS_National_Data_Q3_2026.csv',
      totalRecords: 1000,
      validRecords: 986,
      invalidRecords: 14,
      qualityScore: 98.6,
      status: 'COMPLETED_WITH_WARNINGS',
    },
  });

  // 7. Create Initial System Audit Log
  await prisma.auditLog.create({
    data: {
      entityType: 'SYSTEM',
      entityId: 'INIT-001',
      action: 'SYSTEM_INITIALIZED',
      performedBy: 'System Engine',
      details: JSON.stringify({
        totalWorksLoaded: 1000,
        highRiskCount: 52,
        mediumRiskCount: 241,
        lowRiskCount: 707,
        modelVersion: 'v1.2.4-hybrid-ensemble',
        status: 'READY_FOR_EVALUATION',
      }),
    },
  });

  console.log('=== Database Seeding Completed Successfully! ===');
  console.log('Total Works: 1000');
  console.log('Showcase Hero Case: MPLADS-00421 (Risk: 84/100 HIGH RISK)');
  console.log('Demo Credentials: admin@mplads.ai / admin123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
