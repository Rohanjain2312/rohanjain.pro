// Labels for the profile links (design spec 7.11, 7.12). "Writing" is the Medium profile (F-14).
export type Profiles = { linkedin: string; github: string; huggingface: string; medium: string };

export function profileLinks(profiles: Profiles): { label: string; url: string }[] {
  return [
    { label: 'LinkedIn', url: profiles.linkedin },
    { label: 'GitHub', url: profiles.github },
    { label: 'Hugging Face', url: profiles.huggingface },
    { label: 'Writing', url: profiles.medium },
  ];
}
