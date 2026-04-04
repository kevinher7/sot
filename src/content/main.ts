import { isMonthlyIndividualWorkingListPage } from "../shared/kot-page";

const ROOT_ID = "kot-extension-root";

function ensureRoot(): HTMLDivElement {
  const existing = document.getElementById(ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.dataset.state = "placeholder";
  root.innerHTML = `
    <strong>KOT Extension</strong>
    <div>Scaffold active for monthly working page.</div>
    <div>Feature logic has not been implemented yet.</div>
  `;

  document.body.append(root);
  return root;
}

function bootstrap(): void {
  const currentUrl = new URL(window.location.href);
  if (!isMonthlyIndividualWorkingListPage(currentUrl)) {
    return;
  }

  if (document.body) {
    ensureRoot();
    return;
  }

  window.addEventListener(
    "DOMContentLoaded",
    () => {
      ensureRoot();
    },
    { once: true },
  );
}

bootstrap();
