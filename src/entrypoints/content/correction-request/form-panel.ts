import {
  deriveKotPunchEdits,
  type KotDraftPunchRow,
} from "@/domain/kot/correction/draft";
import {
  KOT_PUNCH_TYPE_CODES,
  KOT_PUNCH_TYPE_LABELS,
  type KotEditForm,
  type KotPunchTypeCode,
} from "@/domain/kot/correction/types";
import { validateKotCorrectionDraft } from "@/domain/kot/correction/validation";
import type { KotPunchField } from "@/domain/kot/calculation/requests/correction-need";
import type { KotCorrectionSubmitResult } from "@/entrypoints/content/correction-request/service";

export const CORRECTION_FORM_ID = "sot-correction-form";

const FIELD_TYPE_CODE: Record<KotPunchField, KotPunchTypeCode> = {
  breakEnd: "4",
  breakStart: "3",
  clockIn: "1",
  clockOut: "2",
};

type KotCorrectionFormOptions = {
  editForm: KotEditForm;
  isoDate: string;
  affectedFields: readonly KotPunchField[];
  hasPendingRequest: boolean;
  row: HTMLTableRowElement;
  onSubmit: (
    edits: ReturnType<typeof deriveKotPunchEdits>,
  ) => Promise<KotCorrectionSubmitResult>;
  onSuccess: () => void;
};

type RowControls = {
  recordId: string | undefined;
  original: { typeCode: string; time: string } | undefined;
  typeSelect: HTMLSelectElement;
  timeInput: HTMLInputElement;
  deleteCheckbox: HTMLInputElement | undefined;
  messageInput: HTMLInputElement;
};

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className: string | undefined,
  text: string | undefined,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);

  if (className !== undefined) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

// "2026-06-17" -> "06月17日", mirroring the overlay's date label.
function formatPanelDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");

  if (month === undefined || day === undefined) {
    return isoDate;
  }

  return `${month}月${day}日`;
}

function createTypeSelect(
  doc: Document,
  selectedCode: string,
): HTMLSelectElement {
  const select = el(doc, "select", "sot-correction-type", undefined);
  const placeholder = el(doc, "option", undefined, "種別");

  placeholder.value = "";
  select.append(placeholder);

  for (const code of KOT_PUNCH_TYPE_CODES) {
    const option = el(doc, "option", undefined, KOT_PUNCH_TYPE_LABELS[code]);

    option.value = code;
    select.append(option);
  }

  select.value = selectedCode;

  return select;
}

function createTimeInput(doc: Document, value: string): HTMLInputElement {
  const input = el(doc, "input", "sot-correction-time", undefined);

  input.type = "text";
  input.placeholder = "HH:MM";
  input.maxLength = 5;
  input.value = value;

  return input;
}

function createMessageInput(doc: Document, value: string): HTMLInputElement {
  const input = el(doc, "input", "sot-correction-message", undefined);

  input.type = "text";
  input.placeholder = "申請メッセージ";
  input.maxLength = 400;
  input.value = value;

  return input;
}

function buildInitialDraftRows(
  options: KotCorrectionFormOptions,
): readonly KotDraftPunchRow[] {
  const existing: KotDraftPunchRow[] = options.editForm.existingPunches.map(
    (punch) => ({
      deleted: false,
      message: "",
      original: { time: punch.time, typeCode: punch.typeCode },
      recordId: punch.recordId,
      time: punch.time,
      typeCode: punch.typeCode,
    }),
  );

  const existingTypeCodes = new Set(
    existing.map((row) => row.typeCode).filter((code) => code !== ""),
  );

  // Auto-add an empty, type-preset row for each affected field the day lacks.
  const missing: KotDraftPunchRow[] = [];

  for (const field of options.affectedFields) {
    const typeCode = FIELD_TYPE_CODE[field];

    if (existingTypeCodes.has(typeCode)) {
      continue;
    }

    missing.push({
      deleted: false,
      message: "",
      original: undefined,
      recordId: undefined,
      time: "",
      typeCode,
    });
  }

  return [...existing, ...missing];
}

function createRowElement(
  doc: Document,
  draft: KotDraftPunchRow,
  controls: RowControls[],
): HTMLTableRowElement {
  const tr = el(doc, "tr", "sot-correction-row", undefined);
  const isAdded = draft.recordId === undefined;

  if (isAdded) {
    tr.classList.add("sot-correction-row--added");
  }

  const typeSelect = createTypeSelect(doc, draft.typeCode);
  const timeInput = createTimeInput(doc, draft.time);
  const messageInput = createMessageInput(doc, draft.message);

  let deleteCheckbox: HTMLInputElement | undefined;

  const typeCell = el(doc, "td", undefined, undefined);

  typeCell.append(typeSelect);

  const timeCell = el(doc, "td", undefined, undefined);

  timeCell.append(timeInput);

  const deleteCell = el(doc, "td", "sot-correction-delete-cell", undefined);

  if (!isAdded) {
    const checkbox = el(doc, "input", undefined, undefined);

    checkbox.type = "checkbox";
    checkbox.title = "この打刻を削除";
    deleteCheckbox = checkbox;
    deleteCell.append(checkbox);
  }

  const messageCell = el(doc, "td", undefined, undefined);

  messageCell.append(messageInput);

  tr.append(typeCell, timeCell, deleteCell, messageCell);

  controls.push({
    deleteCheckbox,
    messageInput,
    original: draft.original,
    recordId: draft.recordId,
    timeInput,
    typeSelect,
  });

  return tr;
}

function readDraftRows(controls: readonly RowControls[]): KotDraftPunchRow[] {
  return controls.map((control) => ({
    deleted: control.deleteCheckbox?.checked ?? false,
    message: control.messageInput.value,
    original: control.original,
    recordId: control.recordId,
    time: control.timeInput.value.trim(),
    typeCode: control.typeSelect.value,
  }));
}

function positionPanel(panel: HTMLElement, row: HTMLTableRowElement): void {
  const rect = row.getBoundingClientRect();
  const panelHeight = panel.offsetHeight;
  const margin = 8;
  const top = rect.top - panelHeight - margin;

  panel.style.left = `${Math.max(margin, rect.left)}px`;
  panel.style.top = `${top > margin ? top : rect.bottom + margin}px`;
}

export function openKotCorrectionForm(
  doc: Document,
  win: Window,
  options: KotCorrectionFormOptions,
): void {
  closeKotCorrectionForm(doc);

  const controls: RowControls[] = [];
  const panel = el(doc, "div", "sot-correction-panel", undefined);

  panel.id = CORRECTION_FORM_ID;
  panel.dataset.isoDate = options.isoDate;

  const header = el(doc, "div", "sot-correction-header", undefined);
  const headerLeft = el(doc, "div", "sot-correction-header-left", undefined);
  const title = el(doc, "span", "sot-correction-title", "打刻申請");
  const date = el(
    doc,
    "span",
    "sot-correction-date",
    formatPanelDate(options.isoDate),
  );

  headerLeft.append(title, date);

  const closeButton = el(doc, "button", "sot-correction-close", "×");

  closeButton.type = "button";
  closeButton.title = "閉じる";
  header.append(headerLeft, closeButton);

  const status = el(doc, "div", "sot-correction-status", undefined);

  const table = el(doc, "table", "sot-correction-table", undefined);
  const thead = el(doc, "thead", undefined, undefined);
  const headRow = el(doc, "tr", undefined, undefined);

  for (const label of ["種別", "時刻", "削除", "申請メッセージ"]) {
    headRow.append(el(doc, "th", undefined, label));
  }

  thead.append(headRow);

  const tbody = el(doc, "tbody", undefined, undefined);
  const initialRows = buildInitialDraftRows(options);

  for (const draft of initialRows) {
    tbody.append(createRowElement(doc, draft, controls));
  }

  table.append(thead, tbody);

  const addButton = el(doc, "button", "sot-correction-add", "＋ 打刻を追加");

  addButton.type = "button";
  addButton.addEventListener("click", () => {
    tbody.append(
      createRowElement(
        doc,
        {
          deleted: false,
          message: "",
          original: undefined,
          recordId: undefined,
          time: "",
          typeCode: "",
        },
        controls,
      ),
    );
    positionPanel(panel, options.row);
  });

  const footer = el(doc, "div", "sot-correction-footer", undefined);

  let pendingConfirm: HTMLInputElement | undefined;
  let pendingWarning: HTMLLabelElement | undefined;

  if (options.hasPendingRequest) {
    const warning = el(doc, "label", "sot-correction-pending", undefined);
    const checkbox = el(doc, "input", undefined, undefined);

    checkbox.type = "checkbox";
    pendingConfirm = checkbox;
    pendingWarning = warning;
    warning.append(
      checkbox,
      el(
        doc,
        "span",
        undefined,
        "未承認の申請があります。二重申請を承知のうえ送信します。",
      ),
    );
  }

  const cancelButton = el(doc, "button", "sot-correction-cancel", "キャンセル");
  const submitButton = el(doc, "button", "sot-correction-submit", "申請する");

  cancelButton.type = "button";
  submitButton.type = "button";

  const setStatus = (message: string, isError: boolean): void => {
    status.textContent = message;
    status.classList.toggle("sot-correction-status--error", isError);
  };

  const submit = async (): Promise<void> => {
    const rows = readDraftRows(controls);
    const validation = validateKotCorrectionDraft(rows);

    if (!validation.isValid) {
      setStatus(
        validation.errors[0]?.message ?? "入力を確認してください。",
        true,
      );

      return;
    }

    const edits = deriveKotPunchEdits(rows);

    if (edits.length === 0) {
      setStatus("変更された打刻がありません。", true);

      return;
    }

    if (pendingConfirm !== undefined && !pendingConfirm.checked) {
      setStatus("未承認の申請の確認にチェックしてください。", true);

      return;
    }

    submitButton.disabled = true;
    setStatus("送信中…", false);

    const result = await options.onSubmit(edits);

    if (result.ok) {
      options.onSuccess();

      return;
    }

    submitButton.disabled = false;
    setStatus(result.reason, true);
  };

  submitButton.addEventListener("click", () => {
    void submit();
  });
  cancelButton.addEventListener("click", () => {
    closeKotCorrectionForm(doc);
  });
  closeButton.addEventListener("click", () => {
    closeKotCorrectionForm(doc);
  });

  footer.append(addButton, cancelButton, submitButton);
  panel.append(header, status, table);

  if (pendingWarning !== undefined) {
    panel.append(pendingWarning);
  }

  panel.append(footer);
  doc.body.append(panel);

  const reposition = (): void => {
    positionPanel(panel, options.row);
  };

  reposition();

  win.addEventListener("scroll", reposition, { passive: true });
  win.addEventListener("resize", reposition, { passive: true });

  activeCleanup = (): void => {
    win.removeEventListener("scroll", reposition);
    win.removeEventListener("resize", reposition);
  };
}

let activeCleanup: (() => void) | undefined;

// The ISO date of the day whose panel is currently open, or undefined when no
// panel is mounted. Read from the live element so it stays in sync with the DOM.
export function getOpenKotCorrectionFormIsoDate(
  doc: Document,
): string | undefined {
  return doc.getElementById(CORRECTION_FORM_ID)?.dataset.isoDate;
}

export function closeKotCorrectionForm(doc: Document): void {
  activeCleanup?.();
  activeCleanup = undefined;
  doc.getElementById(CORRECTION_FORM_ID)?.remove();
}
