/** Scroll-spy: marks the chapter-nav link matching the section in view. */
export function initChapterSpy(sectionIds: string[]): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    '[data-chapter-nav] a, .menu-overlay a'
  );

  let currentId: string | null = null;
  const setActive = (id: string | null) => {
    links.forEach((link) => {
      const isMatch = id !== null && link.hash === `#${id}`;
      if (isMatch) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    // Single source of truth for the whole reactive system: the atmosphere
    // palette and the EvidenceSpine both listen for chapter:change.
    if (id && id !== currentId) {
      currentId = id;
      document.dispatchEvent(new CustomEvent('chapter:change', { detail: { id } }));
    }
  };

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  sections.forEach((s) => observer.observe(s));
}
