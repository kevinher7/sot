import "./styles.css";

import { getOptionsViewModel } from "./model";
import { renderOptionsPage } from "./view";

async function bootstrapOptionsPage(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    throw new Error("Options root element was not found.");
  }

  const model = await getOptionsViewModel();
  renderOptionsPage(app, model);
}

void bootstrapOptionsPage();
