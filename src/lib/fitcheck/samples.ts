// Shape samples of a Report, one per verdict, for UI work (issue #194).
// These show the data shape only. They are not expected verdicts and no engine test compares against them.
import type { Report } from './types.ts';

export const sampleStrong: Report = {
  verdict: 'Strong fit',
  verdictKey: 'strong',
  enough: true,
  provenCount: 9,
  gapCount: 1,
  ratio: 0.9,
  proven: [
    'Python',
    'LangGraph',
    'RAG',
    'Vector databases',
    'Docker',
    'Kubernetes',
    'AWS',
    'Tool calling',
    'Guardrails',
  ],
  gaps: ['vLLM'],
  evidenceRows: [
    {
      id: 'loan',
      name: 'Loan Servicing Agent v2',
      proof: 'Sample proof line.',
      href: 'https://github.com/Rohanjain2312/loan-servicing-agent',
      linkLabel: 'code',
      matchCount: 6,
      tags: ['Python', 'LangGraph', 'Docker', 'Kubernetes', 'Tool calling', 'Guardrails'],
    },
    {
      id: 'goldman',
      name: 'Goldman Sachs, production',
      proof: 'Sample proof line.',
      matchCount: 2,
      tags: ['Python', 'AWS'],
    },
  ],
  roleFamily: 'ai',
};

export const sampleGood: Report = {
  verdict: 'Good fit, with gaps',
  verdictKey: 'good',
  enough: true,
  provenCount: 6,
  gapCount: 4,
  ratio: 0.6,
  proven: ['Python', 'SQL', 'XGBoost', 'Feature engineering', 'Classification', 'Docker'],
  gaps: ['Apache Spark', 'Airflow', 'Snowflake', 'Java'],
  evidenceRows: [
    {
      id: 'settle',
      name: 'Settlement Fail Predictor',
      proof: 'Sample proof line.',
      href: 'https://huggingface.co/spaces/rohanjain2312/trade-settlement-fail-predictor-demo',
      linkLabel: 'live demo',
      matchCount: 4,
      tags: ['Python', 'XGBoost', 'Feature engineering', 'Classification'],
    },
  ],
  roleFamily: 'ml',
};

export const sampleWeak: Report = {
  verdict: 'Not a strong fit',
  verdictKey: 'weak',
  enough: true,
  provenCount: 0,
  gapCount: 5,
  ratio: 0,
  proven: [],
  gaps: ['Swift', 'iOS', 'Xcode', 'UIKit', 'Kotlin'],
  evidenceRows: [],
  roleFamily: 'ml',
};

export const sampleNotEnough: Report = {
  verdict: 'Not enough to go on',
  verdictKey: 'none',
  enough: false,
  provenCount: 1,
  gapCount: 1,
  ratio: 0.5,
  proven: ['Python'],
  gaps: ['Java'],
  evidenceRows: [
    {
      id: 'loan',
      name: 'Loan Servicing Agent v2',
      proof: 'Sample proof line.',
      matchCount: 1,
      tags: ['Python'],
    },
  ],
  roleFamily: 'ml',
};

export const sampleReports: readonly Report[] = [
  sampleStrong,
  sampleGood,
  sampleWeak,
  sampleNotEnough,
];
