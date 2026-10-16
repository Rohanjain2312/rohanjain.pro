import { defineCollection } from 'astro:content';
import { applicationsDir, loadRawContent } from './lib/content/load.ts';
import {
  applicationSchema,
  claimSchema,
  figureSchema,
  projectSchema,
  resumeSchema,
  roleSchema,
  siteSchema,
  skillSchema,
} from './lib/content/schemas.ts';

const contentDir = new URL('./content', import.meta.url).pathname;

type ListKey = 'claims' | 'projects' | 'skills' | 'roles' | 'figures';

function list(
  key: ListKey,
  schema:
    | typeof claimSchema
    | typeof projectSchema
    | typeof skillSchema
    | typeof roleSchema
    | typeof figureSchema,
  idKey: string,
) {
  return defineCollection({
    schema,
    loader: {
      name: `${key}-json`,
      load: async ({ store, parseData }) => {
        store.clear();
        const items = (loadRawContent(contentDir)[key] ?? []) as Record<string, unknown>[];
        for (const data of items) {
          const id = String(data[idKey]);
          store.set({ id, data: await parseData({ id, data }) });
        }
      },
    },
  });
}

function single(key: 'resume' | 'site', schema: typeof resumeSchema | typeof siteSchema) {
  return defineCollection({
    schema,
    loader: {
      name: `${key}-json`,
      load: async ({ store, parseData }) => {
        store.clear();
        const data = loadRawContent(contentDir)[key] as Record<string, unknown> | undefined;
        if (data) store.set({ id: key, data: await parseData({ id: key, data }) });
      },
    },
  });
}

// Empty unless APPLICATIONS_DIR (or src/content/applications) exists and holds files (ADR-0016).
const applications = defineCollection({
  schema: applicationSchema,
  loader: {
    name: 'applications-json',
    load: async ({ store, parseData }) => {
      store.clear();
      if (!applicationsDir(contentDir)) return;
      for (const [name, value] of Object.entries(loadRawContent(contentDir).applications ?? {})) {
        const id = name.replace(/\.json$/, '');
        store.set({ id, data: await parseData({ id, data: value as Record<string, unknown> }) });
      }
    },
  },
});

export const collections = {
  claims: list('claims', claimSchema, 'id'),
  projects: list('projects', projectSchema, 'id'),
  skills: list('skills', skillSchema, 'name'),
  roles: list('roles', roleSchema, 'id'),
  figures: list('figures', figureSchema, 'id'),
  resume: single('resume', resumeSchema),
  site: single('site', siteSchema),
  applications,
};
