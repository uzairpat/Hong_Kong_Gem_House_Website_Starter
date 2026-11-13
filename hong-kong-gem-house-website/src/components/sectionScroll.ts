/**
 * Align a single-page section directly below the currently rendered sticky header.
 * Measuring the header avoids breakpoint-specific hard-coded offsets and prevents
 * a strip of the previous section from remaining visible above the target section.
 */
export function scrollToPageSection(
  sectionId: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  if (typeof window === "undefined") return false;

  const section = document.getElementById(sectionId);
  if (!section) return false;

  const header = document.querySelector<HTMLElement>(".site-header");
  const visibleHeaderBottom = header?.getBoundingClientRect().bottom ?? 0;
  const sectionTop = window.scrollY + section.getBoundingClientRect().top;
  const targetScrollTop = Math.max(0, sectionTop - visibleHeaderBottom);

  window.scrollTo({
    top: targetScrollTop,
    left: 0,
    behavior,
  });

  return true;
}
