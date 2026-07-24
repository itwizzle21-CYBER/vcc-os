import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SectionConfig, SectionKey, SpreadsheetRow } from "../../lib/types/app";
import { formatCurrency } from "../../lib/calculations/currency";
import BufferedTextArea from "./BufferedTextArea";
import BufferedTextInput from "./BufferedTextInput";

interface SpreadsheetProps {
  config: SectionConfig;
  rows: SpreadsheetRow[];
  sortBy?: string;
  onSortChange: (section: SectionKey, sortBy: string) => void;
  onRowsChange: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  onResetSection: (section: SectionKey) => void;
  getComputedCell?: (row: SpreadsheetRow, columnKey: string) => string | undefined;
  inputLists?: Partial<Record<string, string>>;
  selectOptions?: Partial<Record<string, Array<{ value: string; label: string }>>>;
  preventDuplicateKey?: string;
  addLabel?: string;
}

interface CellAddress {
  rowId: string;
  columnKey: string;
}

export default function Spreadsheet({
  config,
  rows,
  sortBy,
  onSortChange,
  onRowsChange,
  onResetSection,
  getComputedCell,
  inputLists,
  selectOptions,
  preventDuplicateKey,
  addLabel = "Add Row",
}: SpreadsheetProps) {
  const [search, setSearch] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [newRowId, setNewRowId] = useState("");
  const [selectedCell, setSelectedCell] = useState<CellAddress | null>(null);
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [cellStatus, setCellStatus] = useState("");
  const keyboardHelpId = `${config.key}-spreadsheet-keyboard-help`;
  const activeSort = parseSort(sortBy);
  const tableRef = useRef<HTMLDivElement>(null);
  const activeCellRef = useRef<{ rowId: string; columnKey: string; value: string } | null>(null);
  const pendingNewRowFocusRef = useRef("");
  const editableColumnKeys = useMemo(
    () => config.columns.filter((column) => !column.readOnly).map((column) => column.key),
    [config.columns]
  );
  const blankRowIds = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => editableColumnKeys.every((key) => !String(row.cells[key] || "").trim()))
          .map((row) => row.id)
      ),
    [editableColumnKeys, rows]
  );
  const visibleRows = useMemo(() => {
    const normalized = rows.map((row) => ({
      ...row,
      cells: Object.fromEntries(
        config.columns.map((column) => [column.key, getComputedCell?.(row, column.key) ?? row.cells[column.key] ?? ""])
      ),
    }));
    const filled = normalized.filter((row) => !blankRowIds.has(row.id));
    const blanks = normalized.filter((row) => blankRowIds.has(row.id));
    const searched = search.trim()
      ? filled.filter((row) =>
          Object.values(row.cells).some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
        )
      : filled;
    const { columnKey: sortColumnKey, direction: sortDirection } = parseSort(sortBy);
    const sorted = sortColumnKey
      ? [...searched].sort((a, b) => {
          const result = compareCellValues(a.cells[sortColumnKey], b.cells[sortColumnKey]);
          return sortDirection === "descending" ? -result : result;
        })
      : searched;
    const visibleBlanks = search.trim() ? blanks.filter((row) => row.id === newRowId) : blanks;
    return [...sorted, ...visibleBlanks];
  }, [blankRowIds, config.columns, getComputedCell, newRowId, rows, search, sortBy]);

  useEffect(() => {
    const rowId = pendingNewRowFocusRef.current;
    if (!rowId) return;
    const columnKey = editableColumnKeys[0];
    if (!columnKey) return;
    const input = tableRef.current?.querySelector<HTMLElement>(
      `[data-row-id="${rowId}"][data-column-key="${columnKey}"]`
    );
    if (!input) return;
    pendingNewRowFocusRef.current = "";
    input.focus();
    setSelectedCell({ rowId, columnKey });
    setEditingCell({ rowId, columnKey });
    const columnName = config.columns.find((column) => column.key === columnKey)?.label || "cell";
    setCellStatus(`New ${config.title.toLowerCase()} row ready. Start typing ${columnName.toLowerCase()}.`);
  }, [config.columns, config.title, editableColumnKeys, rows]);

  function updateCell(rowId: string, columnKey: string, value: string) {
    if (preventDuplicateKey === columnKey && value.trim()) {
      const duplicate = rows.some(
        (row) => row.id !== rowId && (row.cells[columnKey] || "").trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase()
      );
      if (duplicate) {
        setValidationMessage(`${value.trim()} is already in ${config.title}.`);
        return;
      }
    }
    setValidationMessage("");
    if (activeCellRef.current?.rowId === rowId && activeCellRef.current.columnKey === columnKey) {
      activeCellRef.current = { ...activeCellRef.current, value };
    }
    onRowsChange(
      config.key,
      rows.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          cells: {
            ...row.cells,
            [columnKey]: value,
          },
        };
      })
    );
  }

  function commitCell(rowId: string, columnKey: string, currentValue?: string) {
    const column = config.columns.find((item) => item.key === columnKey);
    if (column?.type !== "currency") return;
    const row = rows.find((item) => item.id === rowId);
    const value = currentValue ?? row?.cells[columnKey] ?? "";
    const formatted = formatLooseCurrency(value);
    if (formatted !== value) updateCell(rowId, columnKey, formatted);
  }

  function commitActiveCell() {
    const activeCell = activeCellRef.current;
    if (!activeCell) return;
    activeCellRef.current = null;
    commitCell(activeCell.rowId, activeCell.columnKey, activeCell.value);
  }

  function commitFocusedCell() {
    if (typeof document === "undefined") return;
    const focused = document.activeElement;
    if (!(focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement)) return;
    const rowId = focused.dataset.rowId;
    const columnKey = focused.dataset.columnKey;
    if (!rowId || !columnKey) return;
    commitCell(rowId, columnKey, focused.value);
  }

  function handleCellFocus(rowId: string, columnKey: string, value: string, rowIndex: number, columnIndex: number) {
    const activeCell = activeCellRef.current;
    if (activeCell && (activeCell.rowId !== rowId || activeCell.columnKey !== columnKey)) commitActiveCell();
    activeCellRef.current = { rowId, columnKey, value };
    setSelectedCell({ rowId, columnKey });
    setEditingCell((current) => cellMatches(current, rowId, columnKey) ? current : null);
    announceCellSelection(rowIndex, columnIndex);
  }

  function beginPointerEdit(rowId: string, columnKey: string) {
    setSelectedCell({ rowId, columnKey });
    setEditingCell({ rowId, columnKey });
    setCellStatus(`${columnLabel(columnKey)} ready to edit.`);
  }

  function announceCellSelection(rowIndex: number, columnIndex: number) {
    setCellStatus(`${config.title} row ${rowIndex + 1}, ${config.columns[columnIndex]?.label || "cell"} selected. Press Enter to edit or Delete to clear.`);
  }

  function columnLabel(columnKey: string) {
    return config.columns.find((column) => column.key === columnKey)?.label || "Cell";
  }

  function isCellEditable(rowId: string, columnKey: string) {
    const column = config.columns.find((item) => item.key === columnKey);
    const row = rows.find((item) => item.id === rowId);
    return Boolean(row && column && !column.readOnly && typeof getComputedCell?.(row, columnKey) !== "string");
  }

  function cellClassName(rowId: string, columnKey: string, base = "") {
    return [
      base,
      cellMatches(selectedCell, rowId, columnKey) ? "cell-selected" : "",
      cellMatches(editingCell, rowId, columnKey) ? "cell-editing" : "",
    ].filter(Boolean).join(" ");
  }

  function addRow() {
    const id = `${config.key}-${Date.now()}`;
    pendingNewRowFocusRef.current = id;
    setNewRowId(id);
    const cells = Object.fromEntries(config.columns.map((column) => [column.key, ""]));
    if (config.key === "bills") cells.status = "unpaid";
    onRowsChange(config.key, [
      ...rows,
      {
        id,
        cells,
      },
    ]);
  }

  function deleteRow(rowId: string) {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()} row? This cannot be undone.`)) return;
    onRowsChange(config.key, rows.filter((row) => row.id !== rowId));
  }

  function resetRows() {
    if (!window.confirm(`Reset ${config.title} to its default rows? Your changes in this section will be replaced.`)) return;
    onResetSection(config.key);
  }

  function changeSort(columnKey: string) {
    const nextSort = nextSortValue(sortBy, columnKey);
    onSortChange(config.key, nextSort);
    const next = parseSort(nextSort);
    setCellStatus(
      next.columnKey
        ? `${columnLabel(columnKey)} sorted ${next.direction}.`
        : `${columnLabel(columnKey)} sorting cleared.`
    );
  }

  function moveFocus(rowIndex: number, columnIndex: number) {
    const next = tableRef.current?.querySelector<HTMLElement>(
      `[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`
    );
    if (!next) return;
    setEditingCell(null);
    next.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, rowIndex: number, columnIndex: number, rowId?: string, columnKey?: string) {
    const lastColumn = config.columns.length - 1;
    const lastRow = visibleRows.length - 1;
    const editing = Boolean(rowId && columnKey && cellMatches(editingCell, rowId, columnKey));
    const currentValue = (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;

    if (editing) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (rowId && columnKey) commitCell(rowId, columnKey, currentValue);
        setEditingCell(null);
        setCellStatus(`${columnLabel(columnKey || "")} selected. Editing stopped.`);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (rowId && columnKey) commitCell(rowId, columnKey, currentValue);
        setEditingCell(null);
        moveFocus(Math.min(lastRow, rowIndex + 1), columnIndex);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (rowId && columnKey) commitCell(rowId, columnKey, currentValue);
        moveFocus(rowIndex, Math.min(lastColumn, columnIndex + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (rowId && columnKey) commitCell(rowId, columnKey, currentValue);
        moveFocus(rowIndex, Math.max(0, columnIndex - 1));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (rowId && columnKey) commitCell(rowId, columnKey, currentValue);
        moveFocus(Math.min(lastRow, rowIndex + 1), columnIndex);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (rowId && columnKey) commitCell(rowId, columnKey, currentValue);
        moveFocus(Math.max(0, rowIndex - 1), columnIndex);
      } else if (event.key === "Tab" && rowId && columnKey) {
        commitCell(rowId, columnKey, currentValue);
        setEditingCell(null);
      }
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && rowId && columnKey) {
      event.preventDefault();
      if (!isCellEditable(rowId, columnKey)) {
        setCellStatus(`${columnLabel(columnKey)} is read only.`);
        return;
      }
      updateCell(rowId, columnKey, "");
      setCellStatus(`${columnLabel(columnKey)} cleared.`);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(rowIndex, Math.min(lastColumn, columnIndex + 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(rowIndex, Math.max(0, columnIndex - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(Math.min(lastRow, rowIndex + 1), columnIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(Math.max(0, rowIndex - 1), columnIndex);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(rowIndex, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(rowIndex, lastColumn);
    } else if ((event.key === "Enter" || event.key === "F2") && rowId && columnKey) {
      event.preventDefault();
      if (isCellEditable(rowId, columnKey)) {
        setEditingCell({ rowId, columnKey });
        setCellStatus(`${columnLabel(columnKey)} ready to edit. Press Escape to return to cell selection.`);
        if (event.currentTarget instanceof HTMLInputElement || event.currentTarget instanceof HTMLTextAreaElement) {
          const input = event.currentTarget;
          window.requestAnimationFrame(() => input.select());
        }
      }
    } else if (event.key === "Escape") {
      (event.currentTarget as HTMLElement).blur();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (
        rowId
        && columnKey
        && isCellEditable(rowId, columnKey)
        && (event.currentTarget instanceof HTMLTextAreaElement
          || (event.currentTarget instanceof HTMLInputElement && event.currentTarget.type !== "date"))
      ) {
        setEditingCell({ rowId, columnKey });
        setCellStatus(`${columnLabel(columnKey)} editing.`);
        try {
          event.currentTarget.select();
        } catch {
          // Some specialized input types do not support text selection; typing can still continue.
        }
      } else {
        event.preventDefault();
      }
    }
  }

  return (
    <section className="spreadsheet-panel">
      <div className="spreadsheet-toolbar">
        <div>
          <p className="eyebrow">Spreadsheet</p>
          <h2>{config.title}</h2>
        </div>
        <div className="toolbar-controls">
          <label>
            <BufferedTextInput aria-label={`Search ${config.title} rows`} value={search} onValueChange={setSearch} placeholder={`Search ${config.title} rows`} />
          </label>
          <button type="button" onClick={addRow}>
            {addLabel}
          </button>
          <button type="button" className="ghost-button" onClick={resetRows}>
            Reset Section
          </button>
        </div>
        {validationMessage && <p className="table-validation" role="alert">{validationMessage}</p>}
      </div>

      <p id={keyboardHelpId} className="sr-only">Use arrow keys to move between cells, including while editing. Start typing to replace a selected text cell. Press Delete or Backspace to clear it, or Enter or F2 to edit the existing value.</p>
      <p className="sr-only" role="status" aria-live="polite">{cellStatus}</p>

      <div className="table-wrap" ref={tableRef} onPointerDownCapture={commitFocusedCell}>
        <table aria-describedby={keyboardHelpId}>
          <thead>
            <tr>
              <th className="row-action-heading">Actions</th>
              {config.columns.map((column) => {
                const isActive = activeSort.columnKey === column.key;
                const ariaSort = isActive ? activeSort.direction : "none";
                const nextAction = !isActive
                  ? "sort ascending"
                  : activeSort.direction === "ascending"
                    ? "sort descending"
                    : "clear sorting";
                return (
                  <th key={column.key} aria-sort={ariaSort}>
                    <button
                      type="button"
                      className={`column-sort-button ${isActive ? "active" : ""}`}
                      aria-label={`${column.label}: ${nextAction}`}
                      title={`${column.label}: ${nextAction}`}
                      onClick={() => changeSort(column.key)}
                    >
                      <span>{column.label}</span>
                      {isActive
                        ? activeSort.direction === "ascending"
                          ? <ArrowUp aria-hidden="true" size={14} />
                          : <ArrowDown aria-hidden="true" size={14} />
                        : <ArrowUpDown aria-hidden="true" size={14} />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={row.id} className={`${blankRowIds.has(row.id) ? "blank-row" : ""} ${row.id === newRowId ? "new-row" : ""}`}>
                <td className="row-actions" data-label="Actions">
                  <button type="button" aria-label={`Delete ${config.title} row ${rowIndex + 1}`} onClick={() => deleteRow(row.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
                {config.columns.map((column, columnIndex) => {
                  const computed = getComputedCell?.(row, column.key);
                  const readOnly = column.readOnly || typeof computed === "string";
                  const value = computed ?? row.cells[column.key] ?? "";
                  const inputType = column.type === "date" ? "date" : column.type === "number" ? "number" : "text";
                  const columnSelectOptions = selectOptions?.[column.key];
                  if (config.key === "inventory" && column.key === "alert") {
                    const tone = value.toLowerCase();
                    return (
                      <td key={column.key} data-label={column.label} className={cellClassName(row.id, column.key)}>
                        <button
                          type="button"
                          className={`inventory-alert-button ${tone}`}
                          data-row-index={rowIndex}
                          data-column-index={columnIndex}
                          aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}: ${value}`}
                          onFocus={() => handleCellFocus(row.id, column.key, value, rowIndex, columnIndex)}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
                          onClick={() => document.getElementById("buy-next")?.scrollIntoView({ behavior: "smooth" })}
                        >
                          {value}
                        </button>
                      </td>
                    );
                  }
                  if (config.key === "transactions" && column.key === "type") {
                    return (
                      <td key={column.key} data-label={column.label} className={cellClassName(row.id, column.key)}>
                        <select
                          data-row-index={rowIndex}
                          data-column-index={columnIndex}
                          data-row-id={row.id}
                          data-column-key={column.key}
                          value={value}
                          aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}`}
                          onPointerDown={() => beginPointerEdit(row.id, column.key)}
                          onFocus={(event) => handleCellFocus(row.id, column.key, event.currentTarget.value, rowIndex, columnIndex)}
                          onChange={(event) => updateCell(row.id, column.key, event.target.value)}
                          onBlur={(event) => {
                            commitCell(row.id, column.key, event.currentTarget.value);
                            activeCellRef.current = null;
                            setEditingCell(null);
                          }}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex, row.id, column.key)}
                        >
                          <option value="">Auto</option>
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                          <option value="transfer">Transfer</option>
                        </select>
                      </td>
                    );
                  }
                  if (!readOnly && columnSelectOptions) {
                    const hasLegacyValue = Boolean(value) && !columnSelectOptions.some((option) => option.value === value);
                    return (
                      <td key={column.key} data-label={column.label} className={cellClassName(row.id, column.key)}>
                        <select
                          data-row-index={rowIndex}
                          data-column-index={columnIndex}
                          data-row-id={row.id}
                          data-column-key={column.key}
                          value={value}
                          aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}`}
                          onPointerDown={() => beginPointerEdit(row.id, column.key)}
                          onFocus={(event) => handleCellFocus(row.id, column.key, event.currentTarget.value, rowIndex, columnIndex)}
                          onChange={(event) => updateCell(row.id, column.key, event.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex, row.id, column.key)}
                        >
                          <option value="">Select {column.label.toLowerCase()}</option>
                          {hasLegacyValue && <option value={value}>{value}</option>}
                          {columnSelectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </td>
                    );
                  }
                  if (config.key === "bills" && column.key === "status") {
                    const status = billStatusValue(value);
                    return (
                      <td key={column.key} data-label={column.label} className={cellClassName(row.id, column.key, "bill-status-cell")}>
                        <div className={`bill-status-control ${status}`}>
                          <span className="bill-status-indicator" aria-hidden="true" />
                          <select
                            data-row-index={rowIndex}
                            data-column-index={columnIndex}
                            data-row-id={row.id}
                            data-column-key={column.key}
                            value={status}
                            aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}: ${status}`}
                            onPointerDown={() => beginPointerEdit(row.id, column.key)}
                            onFocus={(event) => handleCellFocus(row.id, column.key, event.currentTarget.value, rowIndex, columnIndex)}
                            onChange={(event) => updateCell(row.id, column.key, event.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex, row.id, column.key)}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </td>
                    );
                  }
                  if (!column.type) {
                    return (
                      <td key={column.key} data-label={column.label} className={cellClassName(row.id, column.key, "wrapping-text-cell")}>
                        <BufferedTextArea
                          rows={1}
                          data-row-index={rowIndex}
                          data-column-index={columnIndex}
                          data-row-id={row.id}
                          data-column-key={column.key}
                          value={value}
                          readOnly={readOnly}
                          aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}`}
                          aria-readonly={readOnly}
                          delay={320}
                          onPointerDown={() => beginPointerEdit(row.id, column.key)}
                          onValueFocus={(currentValue) => handleCellFocus(row.id, column.key, currentValue, rowIndex, columnIndex)}
                          onValueChange={(nextValue) => updateCell(row.id, column.key, nextValue)}
                          onValueBlur={() => {
                            activeCellRef.current = null;
                            setEditingCell(null);
                          }}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex, row.id, column.key)}
                        />
                      </td>
                    );
                  }
                  return (
                    <td key={column.key} data-label={column.label} className={cellClassName(row.id, column.key)}>
                      <BufferedTextInput
                        type={inputType}
                        className={column.type === "date" ? "calendar-input" : undefined}
                        data-row-index={rowIndex}
                        data-column-index={columnIndex}
                        data-row-id={row.id}
                        data-column-key={column.key}
                        value={value}
                        list={!readOnly ? inputLists?.[column.key] : undefined}
                        readOnly={readOnly}
                        aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}`}
                        aria-readonly={readOnly}
                        delay={320}
                        onPointerDown={() => beginPointerEdit(row.id, column.key)}
                        onValueFocus={(currentValue) => handleCellFocus(row.id, column.key, currentValue, rowIndex, columnIndex)}
                        onValueChange={(nextValue) => updateCell(row.id, column.key, nextValue)}
                        onClick={(event) => {
                          if (column.type === "date" && !readOnly) openDatePicker(event.currentTarget);
                        }}
                        onValueBlur={(currentValue) => {
                          commitCell(row.id, column.key, currentValue);
                          activeCellRef.current = null;
                          setEditingCell(null);
                        }}
                        onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex, row.id, column.key)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function cellMatches(cell: CellAddress | null, rowId: string, columnKey: string): boolean {
  return cell?.rowId === rowId && cell.columnKey === columnKey;
}

type SortDirection = "ascending" | "descending";

export function parseSort(sortBy?: string): { columnKey: string; direction: SortDirection } {
  if (!sortBy) return { columnKey: "", direction: "ascending" };
  return sortBy.startsWith("-")
    ? { columnKey: sortBy.slice(1), direction: "descending" }
    : { columnKey: sortBy, direction: "ascending" };
}

export function nextSortValue(currentSort: string | undefined, columnKey: string): string {
  const current = parseSort(currentSort);
  if (current.columnKey !== columnKey) return columnKey;
  if (current.direction === "ascending") return `-${columnKey}`;
  return "";
}

export function compareCellValues(left: string | undefined, right: string | undefined): number {
  const leftValue = String(left || "").trim();
  const rightValue = String(right || "").trim();
  if (isNumericCellValue(leftValue) && isNumericCellValue(rightValue)) {
    return numericCellValue(leftValue) - numericCellValue(rightValue);
  }
  return leftValue.localeCompare(rightValue, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function isNumericCellValue(value: string): boolean {
  return /^[-+]?\s*[$€£]?\s*\d[\d,]*(?:\.\d+)?%?$/.test(value);
}

function numericCellValue(value: string): number {
  return Number(value.replace(/[$€£,%\s]/g, ""));
}

function billStatusValue(value: string): "paid" | "unpaid" | "overdue" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "overdue" || normalized === "late") return "overdue";
  return "unpaid";
}

function formatLooseCurrency(value: string): string {
  if (!value.trim()) return "";
  const number = Number(value.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(number)) return value;
  return formatCurrency(number);
}

function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Browser blocks showPicker in some non-user-gesture paths; native focus still works.
    }
  }
}
