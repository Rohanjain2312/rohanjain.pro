// Conventional Commits with an issue number (R-105) and the Agent-Role trailer (R-106).
// Accepts the history format: "[role] type(scope): summary (#issue)" plus trailers.
import conventional from '@commitlint/config-conventional';

export const ROLES = [
  'supervisor',
  'design-lead',
  'frontend-engineer',
  'app-data-engineer',
  'platform-engineer',
  'security-engineer',
  'qa-engineer',
  'reader-advocate',
];

const plugin = {
  rules: {
    'issue-number': ({ header }) => [
      /\(#\d+\)(?: \(#\d+\))?$/.test(header ?? ''),
      'R-105: the header must end with the issue number, for example "feat(hooks): add x (#12)".',
    ],
    'agent-role-trailer': ({ raw }) => {
      const m = /^Agent-Role: (\S+)\s*$/m.exec(raw ?? '');
      if (!m) return [false, 'R-106: add the trailer "Agent-Role: <role>" to the commit message.'];
      if (!ROLES.includes(m[1]))
        return [false, `R-106: unknown Agent-Role "${m[1]}". Use one of: ${ROLES.join(', ')}.`];
      return [true];
    },
  },
};

export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?:\[[a-z-]+\] )?(\w+)(?:\(([^)]*)\))?!?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  plugins: [plugin],
  rules: {
    ...conventional.rules,
    'header-max-length': [2, 'always', 120],
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    'issue-number': [2, 'always'],
    'agent-role-trailer': [2, 'always'],
  },
};
