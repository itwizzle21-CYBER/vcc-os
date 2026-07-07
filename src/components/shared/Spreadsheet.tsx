import { Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { SectionConfig, SectionKey, SpreadsheetRow } from "../../lib/types/app";
import { formatCurrency, isBlankRow } from "../../lib/calculations/currency";

interface SpreadsheetProps {
  config: SectionConfig;
  rows: SpreadsheetRow[];
  sortBy?: string;
  onSortChange: (section: SectionKey, sortBy: string) => void;
  onRowsChange: (section: SectionKey, rows: SpreadsheetRow[]) => void;
  onResetSection: (section: SectionKey) => void;
  getComputedCell?: (row: SpreadsheetRow, columnKey: string) => string | undefined;
}

export default function Spreadsheet({
  config,
  rows,
  sortBy,
  onSortChange,
  onRowsChange,
  onResetSection,
  getComputedCell,
}: SpreadsheetProps) {
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const visibleRows = useMemo(() => {
    const normalized = rows.map((row) => ({
      ...row,
      cells: Object.fromEntries(
        config.columns.map((column) => [column.key, getComputedCell?.(row, column.key) ?? row.cells[column.key] ?? ""])
      ),
    }));
    const filled = normalized.filter((row) => !isBlankRow(row.cells));
    const blanks = normalized.filter((row) => isBlankRow(row.cells));
    const searched = search.trim()
      ? filled.filter((row) =>
          Object.values(row.cells).some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
        )
      : filled;
    const sorted = sortBy
      ? [...searched].sort((a, b) => String(a.cells[sortBy] || "").localeCompare(String(b.cells[sortBy] || ""), undefined, { numeric: true }))
      : searched;
    return [...sorted, ...(!search.trim() ? blanks : [])];
  }, [config.columns, getComputedCell, rows, search, sortBy]);

  function updateCell(rowId: string, columnKey: string, value: string) {
    const column = config.columns.find((item) => item.key === columnKey);
    if (column?.type === "currency" && value && !value.startsWith("$")) value = formatLooseCurrency(value);
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

  function addRow() {
    onRowsChange(config.key, [
      ...rows,
      {
        id: `${config.key}-${Date.now()}`,
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

  function handleKeyDown(event: React.KeyboardEvent, rowIndex: number, columnIndex: number) {
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
      moveFocus(Math.min(lastRow, rowIndex + 1), columnIndex);
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
            <select value={sortBy || ""} onChange={(event) => onSortChange(config.key, event.target.value)}>
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rows" />
          </label>
          <button type="button" onClick={addRow}>
            Add Row
          </button>
          <button type="button" className="ghost-button" onClick={() => onResetSection(config.key)}>
            Reset Section
          </button>
        </div>
      </div>

      <div className="table-wrap" ref={tableRef}>
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
              <tr key={row.id}>
                <td className="row-actions">
                  <button type="button" aria-label={`Delete ${config.title} row ${rowIndex + 1}`} onClick={() => deleteRow(row.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
                {config.columns.map((column, columnIndex) => {
                  const computed = getComputedCell?.(row, column.key);
                  const readOnly = column.readOnly || typeof computed === "string";
                  const value = computed ?? row.cells[column.key] ?? "";
                  return (
                    <td key={column.key}>
                      <input
                        data-row-index={rowIndex}
                        data-column-index={columnIndex}
                        value={value}
                        readOnly={readOnly}
                        aria-readonly={readOnly}
                        onChange={(event) => updateCell(row.id, column.key, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
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
