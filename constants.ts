import { Patient, Exercise, InjuryProfile } from './types';

// --- VERIFIED PHYSIOS REGISTRY ---
export const VERIFIED_PHYSIOS: Record<string, { name: string; id: string }> = {
  'PT-88321': { name: 'Dr. Shrikant Tiwari', id: 'PHY-1001' },
  'PT-99402': { name: 'Dr. Sarah Connor', id: 'PHY-2022' }
};

// --- INJURY LIBRARY ---
export const INJURY_LIBRARY: Record<string, InjuryProfile> = {
  'wrist_post_cast': {
    id: 'wrist_post_cast',
    name: 'Distal Radius Fracture (Post-Cast)',
    description: 'Rehabilitation following 6 weeks of immobilization for wrist fracture.',
    typicalRecoveryWeeks: 8,
    expectedMilestones: [
      'Week 1: Gentle active ROM, 30° flexion/extension',
      'Week 3: 50% normal ROM, begin light gripping',
      'Week 6: Near full ROM, strengthening exercises',
      'Week 8: Return to normal load bearing'
    ]
  },
  'acl_rehab': {
    id: 'acl_rehab',
    name: 'ACL Reconstruction (Post-Op)',
    description: 'Standard protocol for anterior cruciate ligament reconstruction.',
    typicalRecoveryWeeks: 24,
    expectedMilestones: [
      'Week 2: 90° flexion, full extension',
      'Week 6: Full ROM, normal gait',
      'Week 12: Jogging initiation'
    ]
  },
  'frozen_shoulder': {
      id: 'frozen_shoulder',
      name: 'Adhesive Capsulitis (Frozen Shoulder)',
      description: 'Focus on gradual stretching to restore range of motion.',
      typicalRecoveryWeeks: 12,
      expectedMilestones: [
          'Week 2: Pain reduction',
          'Week 6: Improved external rotation',
          'Week 12: Functional overhead reach'
      ]
  }
};

// --- EXERCISES ---
export const WRIST_EXERCISES: Exercise[] = [
  {
    id: 'w1',
    name: 'Wrist Flexion/Extension',
    targetReps: 15,
    targetRom: 45, // Starting target
    instructions: 'Place forearm on table, hand hanging off edge. Gently move hand up and down.'
  },
  {
    id: 'w2',
    name: 'Towel Wring',
    targetReps: 10,
    targetRom: 0, 
    instructions: 'Hold a rolled towel. Twist hands in opposite directions simulating wringing water.'
  }
];

export const KNEE_EXERCISES: Exercise[] = [
  {
    id: 'k1',
    name: 'Heel Slides',
    targetReps: 10,
    targetRom: 110,
    instructions: 'Lie on back. Slide heel towards buttocks.'
  }
];

export const SHOULDER_EXERCISES: Exercise[] = [
    {
        id: 's1',
        name: 'Wall Crawl',
        targetReps: 8,
        targetRom: 120,
        instructions: 'Walk fingers up the wall as high as possible without pain.'
    },
    {
        id: 's2',
        name: 'Pendulum Swing',
        targetReps: 20,
        targetRom: 0,
        instructions: 'Lean forward and let arm hang loose. Swing gently in circles.'
    }
];

// --- PROTOCOL AUTOMATION MAP ---
// This links the Injury ID to the specific treatment plan (Exercises + Benchmarks)
export const PROTOCOL_MAPPING: Record<string, { exercises: Exercise[], benchmarks: number[] }> = {
    'wrist_post_cast': {
        exercises: WRIST_EXERCISES,
        benchmarks: [30, 40, 50, 60, 70, 75, 80]
    },
    'acl_rehab': {
        exercises: KNEE_EXERCISES,
        benchmarks: [60, 75, 90, 100, 110, 120]
    },
    'frozen_shoulder': {
        exercises: SHOULDER_EXERCISES,
        benchmarks: [45, 60, 80, 100, 130, 150]
    }
};

// --- PATIENTS ---
export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Ishaan',
    age: 24,
    email: 'ishaan.demo@example.com',
    physioName: 'Dr. Shrikant Tiwari',
    injury: 'Right Wrist Fracture (Cast Removal)',
    injuryType: 'wrist_post_cast',
    startDate: '2023-11-01',
    status: 'On Track',
    prescribedExercises: WRIST_EXERCISES,
    benchmarkRom: [30, 40, 50, 60, 70, 75, 80],
    logs: [
      { id: 'l1', date: '2023-11-02', painScore: 7, maxRom: 15, repsCompleted: 5, notes: 'Very stiff after cast removal', videoUrl: 'mock_video_1.mp4' },
      { id: 'l2', date: '2023-11-05', painScore: 6, maxRom: 20, repsCompleted: 8, notes: 'Less swelling', videoUrl: 'mock_video_2.mp4' },
      { id: 'l3', date: '2023-11-09', painScore: 5, maxRom: 28, repsCompleted: 10, notes: 'Feeling better movement', videoUrl: 'mock_video_3.mp4' },
      { id: 'l4', date: '2023-11-12', painScore: 4, maxRom: 35, repsCompleted: 12, notes: 'Good session', videoUrl: 'mock_video_4.mp4' },
      { id: 'l5', date: '2023-11-15', painScore: 3, maxRom: 42, repsCompleted: 15, notes: 'Almost hit target', videoUrl: 'mock_video_5.mp4' },
    ],
    weeklyReports: [
        {
            id: 'r1',
            date: '2023-11-08',
            title: 'Week 1 Review',
            content: 'Ishaan, excellent start. I noticed in your video logs that you are guarding your wrist slightly. Try to relax the shoulder.',
            physioName: 'Dr. Shrikant Tiwari'
        }
    ]
  },
  {
    id: 'p2',
    name: 'Rahul Verma',
    age: 32,
    email: 'rahul.v@example.com',
    physioName: 'Dr. Shrikant Tiwari',
    injury: 'ACL Reconstruction',
    injuryType: 'acl_rehab',
    startDate: '2023-10-15',
    status: 'Behind',
    prescribedExercises: KNEE_EXERCISES,
    benchmarkRom: [60, 75, 90, 100],
    logs: [
      { id: 'l6', date: '2023-10-16', painScore: 8, maxRom: 45, repsCompleted: 8, notes: 'High pain', videoUrl: 'mock_video_6.mp4' },
      { id: 'l7', date: '2023-10-25', painScore: 6, maxRom: 60, repsCompleted: 10, notes: 'Struggling with extension', videoUrl: 'mock_video_7.mp4' }
    ],
    weeklyReports: []
  }
];