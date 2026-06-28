import {
  deriveKotPunchEdits,
  type KotDraftPunchRow,
} from "@/domain/kot/correction/draft";
import {
  type KotRequestedPunchView,
  requestedPunchKey,
} from "@/domain/kot/correction/requested-punches";
import {
  KOT_PUNCH_TYPE_CODES,
  KOT_PUNCH_TYPE_LABELS,
  type KotEditForm,
  type KotPunchTypeCode,
} from "@/domain/kot/correction/types";
import { validateKotCorrectionDraft } from "@/domain/kot/correction/validation";
import type { KotPunchField } from "@/domain/kot/calculation/requests/correction-need";
import { parseClockTextMinutes } from "@/domain/kot/time-text";
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
  requestedPunches: KotRequestedPunchView;
  row: HTMLTableRowElement;
  onSubmit: (
    edits: ReturnType<typeof deriveKotPunchEdits>,
  ) => Promise<KotCorrectionSubmitResult>;
  onSuccess: () => void;
};

// A row in the panel table: an editable draft, a previously-requested punch
// shown read-only (locked), or a recorded punch a pending 申請 asks to delete.
type PanelRowSpec =
  | { mode: "editable"; draft: KotDraftPunchRow }
  | { mode: "locked"; typeCode: KotPunchTypeCode; time: string }
  | { mode: "pendingDelete"; typeCode: string; time: string };

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

// Logical reading order for a day: 出勤 first, break pairs in the middle (so
// 休憩終了 lands next to its 休憩開始), 退勤 last. Unknown/empty types sink last.
const PHASE_RANK: Record<string, number> = { "1": 0, "2": 2, "3": 1, "4": 1 };
const BREAK_ORDER: Record<string, number> = { "3": 0, "4": 1 };

function specTypeAndTime(spec: PanelRowSpec): {
  typeCode: string;
  time: string;
} {
  if (spec.mode === "editable") {
    return { time: spec.draft.time, typeCode: spec.draft.typeCode };
  }

  return { time: spec.time, typeCode: spec.typeCode };
}

function compareRowSpecs(left: PanelRowSpec, right: PanelRowSpec): number {
  const a = specTypeAndTime(left);
  const b = specTypeAndTime(right);

  const phaseDiff =
    (PHASE_RANK[a.typeCode] ?? 3) - (PHASE_RANK[b.typeCode] ?? 3);

  if (phaseDiff !== 0) {
    return phaseDiff;
  }

  const aMinutes = parseClockTextMinutes(a.time) ?? Number.POSITIVE_INFINITY;
  const bMinutes = parseClockTextMinutes(b.time) ?? Number.POSITIVE_INFINITY;

  if (aMinutes !== bMinutes) {
    return aMinutes - bMinutes;
  }

  return (BREAK_ORDER[a.typeCode] ?? 0) - (BREAK_ORDER[b.typeCode] ?? 0);
}

function buildPanelRowSpecs(
  options: KotCorrectionFormOptions,
): readonly PanelRowSpec[] {
  const { lockedRows, pendingDeleteKeys } = options.requestedPunches;
  const specs: PanelRowSpec[] = [];

  for (const punch of options.editForm.existingPunches) {
    if (pendingDeleteKeys.has(requestedPunchKey(punch.typeCode, punch.time))) {
      specs.push({
        mode: "pendingDelete",
        time: punch.time,
        typeCode: punch.typeCode,
      });

      continue;
    }

    specs.push({
      draft: {
        deleted: false,
        message: "",
        original: { time: punch.time, typeCode: punch.typeCode },
        recordId: punch.recordId,
        time: punch.time,
        typeCode: punch.typeCode,
      },
      mode: "editable",
    });
  }

  const existingTypeCodes = new Set(
    options.editForm.existingPunches
      .map((punch) => punch.typeCode)
      .filter((code) => code !== ""),
  );
  const lockedTypeCodes = new Set(lockedRows.map((row) => row.typeCode));

  // Auto-add an empty, type-preset row for each affected field the day lacks —
  // unless a still-pending 申請 already covers that type (shown as a locked row).
  for (const field of options.affectedFields) {
    const typeCode = FIELD_TYPE_CODE[field];

    if (existingTypeCodes.has(typeCode) || lockedTypeCodes.has(typeCode)) {
      continue;
    }

    specs.push({
      draft: {
        deleted: false,
        message: "",
        original: undefined,
        recordId: undefined,
        time: "",
        typeCode,
      },
      mode: "editable",
    });
  }

  for (const row of lockedRows) {
    specs.push({ mode: "locked", time: row.time, typeCode: row.typeCode });
  }

  return [...specs].sort(compareRowSpecs);
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

// A read-only type/time pair styled to match the editable controls, used by the
// locked and pending-delete rows so columns line up with the editable rows.
function appendReadonlyTypeTime(
  doc: Document,
  tr: HTMLTableRowElement,
  typeCode: string,
  time: string,
): void {
  const typeSelect = createTypeSelect(doc, typeCode);

  typeSelect.disabled = true;
  typeSelect.tabIndex = -1;

  const timeInput = createTimeInput(doc, time);

  timeInput.disabled = true;
  timeInput.tabIndex = -1;

  const typeCell = el(doc, "td", undefined, undefined);

  typeCell.append(typeSelect);

  const timeCell = el(doc, "td", undefined, undefined);

  timeCell.append(timeInput);

  tr.append(typeCell, timeCell);
}

// A previously-requested punch from a still-pending 申請: read-only, so the user
// can see what the open request already covers without re-submitting it.
function createLockedRowElement(
  doc: Document,
  spec: Extract<PanelRowSpec, { mode: "locked" }>,
): HTMLTableRowElement {
  const tr = el(
    doc,
    "tr",
    "sot-correction-row sot-correction-row--locked",
    undefined,
  );

  appendReadonlyTypeTime(doc, tr, spec.typeCode, spec.time);

  const deleteCell = el(doc, "td", "sot-correction-delete-cell", undefined);
  const messageCell = el(doc, "td", undefined, undefined);

  messageCell.append(el(doc, "span", "sot-correction-badge", "申請中"));
  tr.append(deleteCell, messageCell);

  return tr;
}

// A recorded punch a still-pending 申請 asks to delete: kept visible but locked
// and struck through so the user knows a removal is already in flight.
function createPendingDeleteRowElement(
  doc: Document,
  spec: Extract<PanelRowSpec, { mode: "pendingDelete" }>,
): HTMLTableRowElement {
  const tr = el(
    doc,
    "tr",
    "sot-correction-row sot-correction-row--pending-delete",
    undefined,
  );

  appendReadonlyTypeTime(doc, tr, spec.typeCode, spec.time);

  const deleteCell = el(doc, "td", "sot-correction-delete-cell", undefined);
  const checkbox = el(doc, "input", undefined, undefined);

  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.disabled = true;
  checkbox.tabIndex = -1;
  deleteCell.append(checkbox);

  const messageCell = el(doc, "td", undefined, undefined);

  messageCell.append(el(doc, "span", "sot-correction-badge", "削除申請中"));
  tr.append(deleteCell, messageCell);

  return tr;
}

function createRowFromSpec(
  doc: Document,
  spec: PanelRowSpec,
  controls: RowControls[],
): HTMLTableRowElement {
  if (spec.mode === "locked") {
    return createLockedRowElement(doc, spec);
  }

  if (spec.mode === "pendingDelete") {
    return createPendingDeleteRowElement(doc, spec);
  }

  return createRowElement(doc, spec.draft, controls);
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
  const initialRows = buildPanelRowSpecs(options);

  for (const spec of initialRows) {
    tbody.append(createRowFromSpec(doc, spec, controls));
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
