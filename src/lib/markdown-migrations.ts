/**
 * Apply deterministic, non-destructive migrations to persisted Markdown.
 *
 * Migrations must never infer that user content is disposable from names,
 * companies, languages, or other resume text. Only structural rewrites that
 * preserve the user's content belong here.
 */
export function migrateStoredMarkdown(markdown: string): string {
  let md = markdown;

  // Normalize redundant "GitHub:" labels before GitHub URLs.
  md = md.replace(/GitHub[：:]\s*(https?:\/\/|github\.com\/)/gi, (_match, prefix: string) => {
    return prefix.startsWith('http') ? prefix : `https://${prefix}`;
  });

  // Rename the legacy education heading to the current convention.
  md = md.replace(/## 教育经历/g, '## 教育背景');

  // Normalize legacy project items that stored the project role as the first
  // description bullet instead of in the structured item heading.
  const migrateProjectSection = (section: string): string => {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || '';
    const normalizedTitle = title.toLowerCase();
    const isProjectSection =
      title.includes('项目') ||
      title.includes('产品') ||
      title.includes('开源') ||
      normalizedTitle.includes('project') ||
      normalizedTitle.includes('portfolio');

    if (!isProjectSection) return section;

    const migratedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const current = lines[i];
      const next = lines[i + 1];
      const headerMatch = current.match(/^(###\s+)(.+?)\s+(\*[^*\n]+\*)\s*$/);
      const roleMatch = next?.match(
        /^[-*+]\s+\*\*(?:项目角色|Project Role)\s*[:：]?\*\*\s*[:：]?\s*(.+)$/i,
      );

      if (headerMatch && roleMatch) {
        const [, prefix, rawTitle, time] = headerMatch;
        const role = roleMatch[1].trim();
        const titleWithoutTime = rawTitle.trim();

        if (/[｜|]/.test(titleWithoutTime)) {
          migratedLines.push(current);
        } else {
          migratedLines.push(`${prefix}${titleWithoutTime} ｜ ${role} ｜ ${time}`);
        }
        i += 1;
        continue;
      }

      migratedLines.push(current);
    }

    return migratedLines.join('\n');
  };

  const projectSections = md.split('\n## ');
  md = projectSections
    .map((section, index) => {
      if (index === 0) return section;
      return `## ${migrateProjectSection(section)}`;
    })
    .join('\n');

  // De-duplicate repeated education sections without touching unrelated content.
  const sections = md.split('\n## ');
  const seenEducationTitles = new Set<string>();
  const cleanSections: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (i === 0) {
      cleanSections.push(section);
      continue;
    }

    const title = section.split('\n')[0].trim();
    const normalizedTitle = title.toLowerCase();
    const isEducationSection =
      title.includes('教育') ||
      title.includes('学校') ||
      normalizedTitle.includes('education');

    if (isEducationSection) {
      if (seenEducationTitles.has(normalizedTitle)) {
        continue;
      }
      seenEducationTitles.add(normalizedTitle);
    }

    cleanSections.push(`## ${section}`);
  }

  return cleanSections.join('\n').replace(/\n{3,}/g, '\n\n');
}
