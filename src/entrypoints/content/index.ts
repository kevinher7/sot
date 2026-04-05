import { isMonthlyIndividualWorkingListPage } from "@/domain/kot/page";
import { bootstrapContentScript } from "./bootstrap";
import "./content.css";

const currentUrl = new URL(window.location.href);

if (isMonthlyIndividualWorkingListPage(currentUrl)) {
  bootstrapContentScript();
}
