import { type ChangeEvent, type KeyboardEvent } from "react";
import {
  formatCurrencyCellValue,
  getDisplayRow,
  getSelectOptions,
  isCurrencyColumn,
  isDateColumn,
  isReadOnlyCell,
} from "../../lib/calculations/helpers";
import type { Metrics, Row, Section, SectionKey } from "../../lib/types/vcc";

export function SpreadsheetGrid({
  section,
  metrics,
  updateCell,
  deleteRow,
}: {
  section: Section;
  metrics: Metrics;
  updateCell: (sectionKey: SectionKey, rowIndex: number, column: string, value: string) => void;
  deleteRow: (sectionKey: SectionKey, rowIndex: number) => void;
}) {
  const displayRows = section.rows.map((row) => getDisplayRow(section.key, row, metrics));

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    columnIndex: number
  ) {
    let nextRow = rowIndex;
    let nextColumn = columnIndex;

    if (event.key === "Enter") {
      nextRow = event.shiftKey ? rowIndex - 1 : rowIndex + 1;
    } else if (event.key === "ArrowRight") {
      nextColumn = columnIndex + 1;
    } else if (event.key === "ArrowLeft") {
      nextColumn = columnIndex - 1;
    } else if (event.key === "ArrowDown") {
      nextRow = rowIndex + 1;
    } else if (event.key === "ArrowUp") {
      nextRow = rowIndex - 1;
    } else {
      return;
    }

    event.preventDefault();
    focusSpreadsheetCell(section.key, nextRow, nextColumn);
  }

  return (
    <div className="tableWrap spreadsheetWrap">
      <table className="spreadsheetGrid" aria-label={`${section.label} spreadsheet`}>
        <thead>
          <tr>
            {section.columns.map((column) => <th key={column}>{column}</th>)}
            <th className="actionHead">Action</th>
          </tr>
        </thead>

        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr key={`${section.key}-${rowIndex}`}>
              {section.columns.map((column, columnIndex) => (
                <td
                  key={column}
                  className="spreadsheetCell"
                  onMouseDown={(event) => {
                    const field = event.currentTarget.querySelector("input, select");
                    if (field instanceof HTMLElement && event.target !== field) {
                      event.preventDefault();
                      field.focus();
                      if (field instanceof HTMLInputElement) field.select();
                    }
                  }}
                >
                  <SpreadsheetField
                    section={section}
                    row={row}
                    rowIndex={rowIndex}
                    column={column}
                    columnIndex={columnIndex}
                    updateCell={updateCell}
                    onKeyDown={handleCellKeyDown}
                  />
                </td>
              ))}
              <td className="rowActionCell">
                <button
                  type="button"
                  className="delete"
                  aria-label={`Delete ${section.label} row ${rowIndex + 1}`}
                  onClick={() => deleteRow(section.key, rowIndex)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpreadsheetField({
  section,
  row,
  rowIndex,
  column,
  columnIndex,
  updateCell,
  onKeyDown,
}: {
  section: Section;
  row: Row;
  rowIndex: number;
  column: string;
  columnIndex: number;
  updateCell: (sectionKey: SectionKey, rowIndex: number, column: string, value: string) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    columnIndex: number
  ) => void;
}) {
  const value = row[column] ?? "";
  const readOnly = isReadOnlyCell(section.key, row, column);
  const options = getSelectOptions(section.key, column);
  const commonProps = {
    className: `spreadsheetInput ${readOnly ? "readOnly" : ""}`,
    value,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!readOnly && event.key === "Enter" && isCurrencyColumn(column)) {
        updateCell(section.key, rowIndex, column, formatCurrencyCellValue(event.currentTarget.value));
      }

      onKeyDown(event, rowIndex, columnIndex);
    },
    "data-section": section.key,
    "data-row": rowIndex,
    "data-column": column,
    "data-column-index": columnIndex,
    "data-cell-kind": isCurrencyColumn(column) ? "currency" : isDateColumn(column) ? "date" : options ? "select" : "text",
    "aria-label": `${section.label} row ${rowIndex + 1} ${column}`,
  };

  if (options) {
    return (
      <select
        {...commonProps}
        disabled={readOnly}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => updateCell(section.key, rowIndex, column, event.target.value)}
      >
        <option value=""></option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...commonProps}
      type={isDateColumn(column) ? "date" : "text"}
      inputMode={isCurrencyColumn(column) ? "decimal" : undefined}
      readOnly={readOnly}
      onChange={(event) => updateCell(section.key, rowIndex, column, event.target.value)}
      onBlur={(event) => {
        if (isCurrencyColumn(column)) {
          updateCell(section.key, rowIndex, column, formatCurrencyCellValue(event.target.value));
        }
      }}
    />
  );
}

function focusSpreadsheetCell(sectionKey: SectionKey, rowIndex: number, columnIndex: number) {
  if (rowIndex < 0 || columnIndex < 0) return;

  const cells = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`input[data-section="${sectionKey}"], select[data-section="${sectionKey}"]`)
  );
  const nextCell = cells.find(
    (cell) => cell.dataset.row === String(rowIndex) && cell.dataset.columnIndex === String(columnIndex)
  );

  if (!nextCell) return;

  nextCell.focus();
  if (nextCell instanceof HTMLInputElement) nextCell.select();
}
