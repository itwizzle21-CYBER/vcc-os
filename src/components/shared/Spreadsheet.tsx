import { Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { SectionConfig, SectionKey, SpreadsheetRow } from "../../lib/types/app";
import { formatCurrency } from "../../lib/calculations/currency";

interface SpreadsheetProps {
  config: SectionConfig;
  rows: SpreadsheetRow[];
  sortBy?: string;
  onSortChange: (section: SectionKey, sortBy: string) => void;
  onRowsChange: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  onResetSection: (section: SectionKey) => void;
  getComputedCell?: (row: SpreadsheetRow, columnKey: string) => string | undefined;
  inputLists?: Partial<Record<string, string>>;
  preventDuplicateKey?: string;
  addLabel?: string;
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
  preventDuplicateKey,
  addLabel = "Add Row",
}: SpreadsheetProps) {
  const [search, setSearch] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [newRowId, setNewRowId] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const activeCellRef = useRef<{ rowId: string; columnKey: string; value: string } | null>(null);
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
    const sorted = sortBy
      ? [...searched].sort((a, b) => String(a.cells[sortBy] || "").localeCompare(String(b.cells[sortBy] || ""), undefined, { numeric: true }))
      : searched;
    return [...sorted, ...(!search.trim() ? blanks : [])];
  }, [blankRowIds, config.columns, getComputedCell, rows, search, sortBy]);

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
    if (!(focused instanceof HTMLInputElement)) return;
    const rowId = focused.dataset.rowId;
    const columnKey = focused.dataset.columnKey;
    if (!rowId || !columnKey) return;
    commitCell(rowId, columnKey, focused.value);
  }

  function handleCellFocus(rowId: string, columnKey: string, value: string) {
    const activeCell = activeCellRef.current;
    if (activeCell && (activeCell.rowId !== rowId || activeCell.columnKey !== columnKey)) commitActiveCell();
    activeCellRef.current = { rowId, columnKey, value };
  }

  function addRow() {
    const id = `${config.key}-${Date.now()}`;
    setNewRowId(id);
    onRowsChange(config.key, [
      ...rows,
      {
        id,
        cells: Object.fromEntries(config.columns.map((column) => [column.key, ""])),
      },
    ]);
  }

  function deleteRow(rowId: string) {
    onRowsChange(config.key, rows.filter((row) => row.id !== rowId));
  }

  function moveFocus(rowIndex: number, columnIndex: number) {
    const next = tableRef.current?.querySelector<HTMLElement>(
      `[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`
    );
    next?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, rowIndex: number, columnIndex: number, rowId?: string, columnKey?: string) {
    const lastColumn = config.columns.length - 1;
    const lastRow = visibleRows.length - 1;
    if (event.key === "ArrowRight") {
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
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (rowId && columnKey) {
        commitCell(rowId, columnKey, (event.currentTarget as HTMLInputElement).value);
        activeCellRef.current = null;
      }
      moveFocus(Math.min(lastRow, rowIndex + 1), columnIndex);
    } else if (event.key === "Tab" && rowId && columnKey) {
      commitCell(rowId, columnKey, (event.currentTarget as HTMLInputElement).value);
    } else if (event.key === "Escape") {
      (event.currentTarget as HTMLElement).blur();
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
            <span>Sort By</span>
            <select aria-label={`Sort ${config.title}`} value={sortBy || ""} onChange={(event) => onSortChange(config.key, event.target.value)}>
              <option value="">None</option>
              {config.columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input aria-label={`Search ${config.title} rows`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rows" />
          </label>
          <button type="button" onClick={addRow}>
            {addLabel}
          </button>
          <button type="button" className="ghost-button" onClick={() => onResetSection(config.key)}>
            Reset Section
          </button>
        </div>
        {validationMessage && <p className="table-validation" role="alert">{validationMessage}</p>}
      </div>

      <div className="table-wrap" ref={tableRef} onPointerDownCapture={commitFocusedCell}>
        <table>
          <thead>
            <tr>
              <th className="row-action-heading">Actions</th>
              {config.columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
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
                  if (config.key === "inventory" && column.key === "alert") {
                    const tone = value.toLowerCase();
                    return (
                      <td key={column.key} data-label={column.label}>
                        <button
                          type="button"
                          className={`inventory-alert-button ${tone}`}
                          data-row-index={rowIndex}
                          data-column-index={columnIndex}
                          aria-label={`${column.label}, ${config.title} row ${rowIndex + 1}: ${value}`}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
                          onClick={() => document.getElementById("buy-next")?.scrollIntoView({ behavior: "smooth" })}
                        >
                          {value}
                        </button>
                      </td>
                    );
                  }
                  return (
                    <td key={column.key} data-label={column.label}>
                      <input
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
                        onFocus={(event) => handleCellFocus(row.id, column.key, event.currentTarget.value)}
                        onChange={(event) => updateCell(row.id, column.key, event.target.value)}
                        onClick={(event) => {
                          if (column.type === "date" && !readOnly) openDatePicker(event.currentTarget);
                        }}
                        onBlur={(event) => {
                          commitCell(row.id, column.key, event.currentTarget.value);
                          activeCellRef.current = null;
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

function formatLooseCurrency(value: string): string {
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
