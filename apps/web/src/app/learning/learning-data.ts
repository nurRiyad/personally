export type TaskStatus =
  'Todo' | 'In progress' | 'Done' | 'Blocked' | 'Cancelled';

export type LearningTask = {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  targetMinutes: number;
  actualMinutes: number;
  weight: number;
  sessions: number;
  completionNote?: string;
};

export type LearningEpic = {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  targetDate: string;
  targetMinutes: number;
  comment?: string;
  tasks: LearningTask[];
};

export const learningEpics: LearningEpic[] = [
  {
    id: 'aws-solutions-architect',
    createdAt: '2026-08-12',
    name: 'Complete the AWS Solutions Architect course',
    description:
      'Build a practical foundation in designing secure, resilient AWS systems.',
    targetDate: '2026-10-31',
    targetMinutes: 1800,
    comment:
      'Focus on one module at a time and capture architecture decisions in the notes.',
    tasks: [
      {
        id: 'iam',
        name: 'Review IAM and account security',
        description:
          'Work through identity, access policies, and account protection fundamentals.',
        status: 'Done',
        targetMinutes: 180,
        actualMinutes: 205,
        weight: 2,
        sessions: 3,
        completionNote: 'Policy evaluation logic is much clearer now.',
      },
      {
        id: 's3',
        name: 'Complete the S3 module',
        description:
          'Learn storage classes, lifecycle policies, encryption, and access patterns.',
        status: 'In progress',
        targetMinutes: 240,
        actualMinutes: 75,
        weight: 3,
        sessions: 2,
      },
      {
        id: 'networking',
        name: 'Practice VPC networking',
        description:
          'Create a small reference architecture with subnets, routes, and security groups.',
        status: 'Todo',
        targetMinutes: 300,
        actualMinutes: 0,
        weight: 4,
        sessions: 0,
      },
      {
        id: 'exam',
        name: 'Take a practice exam',
        description:
          'Complete a timed practice exam and review every missed question.',
        status: 'Todo',
        targetMinutes: 120,
        actualMinutes: 0,
        weight: 2,
        sessions: 0,
      },
    ],
  },
  {
    id: 'typescript-mastery',
    createdAt: '2026-09-03',
    name: 'TypeScript mastery',
    description:
      'Move from everyday TypeScript usage to confident type-level design.',
    targetDate: '2026-11-20',
    targetMinutes: 1200,
    tasks: [
      {
        id: 'generics',
        name: 'Learn advanced generics',
        description:
          'Practice constraints, conditional types, and reusable generic helpers.',
        status: 'Done',
        targetMinutes: 180,
        actualMinutes: 190,
        weight: 3,
        sessions: 3,
      },
      {
        id: 'patterns',
        name: 'Build a typed API client',
        description:
          'Use discriminated unions and schema-derived types in a small client.',
        status: 'Blocked',
        targetMinutes: 360,
        actualMinutes: 40,
        weight: 4,
        sessions: 1,
      },
    ],
  },
];

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining}m`;
  if (!remaining) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

export function epicProgress(epic: LearningEpic) {
  const eligible = epic.tasks.filter((task) => task.status !== 'Cancelled');
  const points = eligible.reduce((sum, task) => sum + task.weight, 0);
  const completed = eligible
    .filter((task) => task.status === 'Done')
    .reduce((sum, task) => sum + task.weight, 0);
  return points ? Math.round((completed / points) * 100) : 0;
}

export function epicStatus(epic: LearningEpic) {
  if (epic.tasks.some((task) => task.status === 'In progress'))
    return 'In progress';
  if (
    epic.tasks.length &&
    epic.tasks.some((task) => task.status === 'Done') &&
    epic.tasks.every(
      (task) => task.status === 'Done' || task.status === 'Cancelled',
    )
  )
    return 'Done';
  return 'Todo';
}

export function findEpic(id: string) {
  return learningEpics.find((epic) => epic.id === id);
}
