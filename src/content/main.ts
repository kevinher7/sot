const ROOT_ID = "kot-extension-root";
const TARGET_HOST = "s2.ta.kingoftime.jp";
const TARGET_PAGE_ID = "/working/monthly_individual_working_list";

function isMonthlyIndividualWorkingListPage(url: URL): boolean {
  return (
    url.hostname === TARGET_HOST &&
    url.pathname.startsWith("/admin/") &&
    url.searchParams.get("page_id") === TARGET_PAGE_ID
  );
}

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
