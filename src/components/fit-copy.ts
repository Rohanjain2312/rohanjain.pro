// Shape of the `fit` block in copy/home.json. Types only.
import type { FitNotes } from './fit-view.ts';

export type FitCopy = {
  /** Section number. Shown through CSS from data-ordinal, so the digits are not page text (R-301). */
  ordinal: string;
  label: string;
  heading: string;
  intro: string;
  noScript: string;
  tryLabel: string;
  samplesLabel: string;
  samples: { id: string; label: string; company: string; title: string; jd: string }[];
  textareaLabel: string;
  placeholder: string;
  optionalSummary: string;
  companyLabel: string;
  roleLabel: string;
  check: string;
  limits: { counterFrom: number; field: number; briefGaps: number; briefTags: number };
  counts: string;
  labels: { tags: string; linkFor: string };
  notes: FitNotes;
  rampUp: string;
  openBrief: string;
  forward: { label: string; subject: string };
  brief: {
    save: string;
    close: string;
    eyebrow: string;
    title: string;
    defaultRole: string;
    atCompany: string;
    evidenceHeading: string;
    gapsHeading: string;
    gapsMore: string;
    backgroundHeading: string;
    background: string;
    provenance: string;
  };
};
