function applyFixedPosition(
  root: HTMLDivElement,
  top: string,
  right = "16px",
): void {
  root.style.position = "fixed";
  root.style.top = top;
  root.style.right = right;
}

export function positionOverlayRoot(
  root: HTMLDivElement,
  doc: Document = document,
): void {
  const pageTitle = doc.querySelector<HTMLHeadingElement>(
    "h1.htBlock-pageTitleSticky",
  );

  if (!pageTitle) {
    applyFixedPosition(root, "16px");

    return;
  }

  const rect = pageTitle.getBoundingClientRect();

  applyFixedPosition(root, `${rect.bottom + 16}px`);
}
