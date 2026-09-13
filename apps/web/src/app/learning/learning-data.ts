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
      {
        id: 'well-architected',
        name: 'Apply the Well-Architected pillars',
        description:
          'Review a sample workload against operational excellence, reliability, and cost principles.',
        status: 'In progress',
        targetMinutes: 210,
        actualMinutes: 60,
        weight: 3,
        sessions: 1,
      },
      {
        id: 'ec2',
        name: 'Compare EC2 compute options',
        description:
          'Choose instance families and purchasing options for common application workloads.',
        status: 'Todo',
        targetMinutes: 180,
        actualMinutes: 0,
        weight: 2,
        sessions: 0,
      },
      {
        id: 'rds',
        name: 'Design a managed database setup',
        description:
          'Evaluate backups, replication, scaling, and maintenance for a production database.',
        status: 'Blocked',
        targetMinutes: 240,
        actualMinutes: 30,
        weight: 3,
        sessions: 1,
      },
      {
        id: 'observability',
        name: 'Add observability to the architecture',
        description:
          'Plan useful metrics, logs, alarms, and dashboards for a resilient AWS workload.',
        status: 'Todo',
        targetMinutes: 180,
        actualMinutes: 0,
        weight: 2,
        sessions: 0,
      },
      {
        id: 'architecture-review',
        name: 'Complete an architecture review',
        description:
          'Present the reference architecture and document decisions, risks, and next steps.',
        status: 'Todo',
        targetMinutes: 150,
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
      {
        id: 'utility-types',
        name: 'Master utility types',
        description:
          'Use mapped, lookup, and built-in utility types to model transformations clearly.',
        status: 'In progress',
        targetMinutes: 240,
        actualMinutes: 95,
        weight: 3,
        sessions: 2,
      },
      {
        id: 'type-narrowing',
        name: 'Practice type narrowing',
        description:
          'Apply guards, predicates, and exhaustive checks to make runtime validation safe.',
        status: 'Todo',
        targetMinutes: 180,
        actualMinutes: 0,
        weight: 2,
        sessions: 0,
      },
      {
        id: 'modules',
        name: 'Understand module design',
        description:
          'Organize public types, internal helpers, and package boundaries in a small library.',
        status: 'Todo',
        targetMinutes: 210,
        actualMinutes: 0,
        weight: 2,
        sessions: 0,
      },
      {
        id: 'declaration-files',
        name: 'Read declaration files',
        description:
          'Trace complex library declarations and identify the types that shape an API.',
        status: 'Blocked',
        targetMinutes: 150,
        actualMinutes: 35,
        weight: 1,
        sessions: 1,
      },
      {
        id: 'testing-types',
        name: 'Test type-level behavior',
        description:
          'Add compile-time tests for public contracts and regression-prone generic helpers.',
        status: 'Todo',
        targetMinutes: 180,
        actualMinutes: 0,
        weight: 2,
        sessions: 0,
      },
      {
        id: 'zod-integration',
        name: 'Connect schemas and types',
        description:
          'Derive application types from runtime schemas without duplicating contracts.',
        status: 'Cancelled',
        targetMinutes: 180,
        actualMinutes: 20,
        weight: 1,
        sessions: 1,
        completionNote:
          'Replaced this path with the typed API client exercise.',
      },
      {
        id: 'async-results',
        name: 'Model async results',
        description:
          'Design result and error unions that keep loading, success, and failure states explicit.',
        status: 'Done',
        targetMinutes: 210,
        actualMinutes: 225,
        weight: 3,
        sessions: 4,
        completionNote:
          'The discriminated result type is now used in the practice project.',
      },
      {
        id: 'refactor-exercise',
        name: 'Refactor a typed feature',
        description:
          'Rewrite a small feature with stronger types and document the trade-offs you made.',
        status: 'Todo',
        targetMinutes: 300,
        actualMinutes: 0,
        weight: 4,
        sessions: 0,
      },
    ],
  },
  {
    id: 'react-patterns',
    createdAt: '2026-08-28',
    name: 'React patterns',
    description:
      'Build a practical set of reusable patterns for React interfaces.',
    targetDate: '2026-10-18',
    targetMinutes: 900,
    tasks: [],
  },
  {
    id: 'sql-foundations',
    createdAt: '2026-08-21',
    name: 'SQL foundations',
    description: 'Learn to query, shape, and reason about relational data.',
    targetDate: '2026-11-05',
    targetMinutes: 720,
    comment: 'Keep examples grounded in the Personally data model.',
    tasks: [],
  },
  {
    id: 'product-writing',
    createdAt: '2026-08-09',
    name: 'Product writing',
    description:
      'Write clearer interface copy, product notes, and decision records.',
    targetDate: '2026-09-30',
    targetMinutes: 480,
    tasks: [],
  },
  {
    id: 'financial-literacy',
    createdAt: '2026-07-27',
    name: 'Financial literacy',
    description:
      'Create a steady foundation for understanding saving and investing.',
    targetDate: '2026-12-15',
    targetMinutes: 1200,
    tasks: [],
  },
  {
    id: 'design-systems',
    createdAt: '2026-07-14',
    name: 'Design systems',
    description:
      'Study the principles behind durable, accessible design systems.',
    targetDate: '2026-10-25',
    targetMinutes: 840,
    tasks: [],
  },
  {
    id: 'cloudflare-workers',
    createdAt: '2026-06-30',
    name: 'Cloudflare Workers',
    description:
      'Learn the runtime and deployment patterns for edge applications.',
    targetDate: '2026-09-28',
    targetMinutes: 660,
    tasks: [],
  },
  {
    id: 'technical-reading',
    createdAt: '2026-06-12',
    name: 'Technical reading habit',
    description:
      'Develop a sustainable system for reading and retaining technical ideas.',
    targetDate: '2026-12-31',
    targetMinutes: 360,
    tasks: [],
  },
  {
    id: 'public-speaking',
    createdAt: '2026-05-24',
    name: 'Public speaking',
    description:
      'Practice concise explanations, confident delivery, and useful storytelling.',
    targetDate: '2026-10-10',
    targetMinutes: 600,
    tasks: [],
  },
  {
    id: 'personal-knowledge-base',
    createdAt: '2026-05-05',
    name: 'Personal knowledge base',
    description:
      'Create a lightweight system for capturing and revisiting important ideas.',
    targetDate: '2026-11-30',
    targetMinutes: 540,
    tasks: [],
  },
  {
    id: 'web-accessibility',
    createdAt: '2026-04-18',
    name: 'Web accessibility',
    description:
      'Learn practical accessibility patterns for inclusive web experiences.',
    targetDate: '2026-09-24',
    targetMinutes: 780,
    tasks: [],
  },
  {
    id: 'communication',
    createdAt: '2026-03-11',
    name: 'Clear communication',
    description:
      'Improve written and async communication for focused collaboration.',
    targetDate: '2026-12-20',
    targetMinutes: 420,
    tasks: [],
  },
  {
    id: 'systems-thinking',
    createdAt: '2026-02-26',
    name: 'Systems thinking',
    description:
      'Build better mental models for complex systems and everyday decisions.',
    targetDate: '2027-01-15',
    targetMinutes: 900,
    tasks: [],
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
