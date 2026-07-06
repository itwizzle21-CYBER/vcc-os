# Dashboard QA Checklist

## Regression Risks

- Dashboard accidentally becomes editable.
- Metrics diverge from dedicated module summaries.
- Hash routes fail to load direct pages.
- Settings/import/export changes affect dashboard state.
- Mobile bottom nav loses access to sections.
- Alert counts differ between MetricsGrid, ObjectiveStack, and Alerts page.
- Synthetic chart visuals are mistaken for real historical data.

## Required Test Coverage For Future Implementation

### Core Rendering

- Dashboard loads from `/` and `#/`.
- Direct route `#/settings` works.
- Direct routes for every module work.
- Invalid hash falls back to Dashboard.
- Dashboard does not render spreadsheet inputs.

### Financial Consistency

- Spendable Cash in MetricsGrid equals Money module summary.
- Bills Pressure in dashboard equals Bills module summary.
- Debt pressure/balance in dashboard equals Debt module summary.
- Protected Savings in dashboard equals Savings module summary.
- Buy Next count/text is consistent between Dashboard, Inventory, and Buy Next.
- Goal progress is consistent between Module Dock and Goals summary.

### Decision Engine

- Blank starter rows do not create false alerts.
- Overdue bills create critical alerts.
- Due-soon bills create high alerts.
- Critical inventory creates Buy Next alert.
- Negative spendable cash creates danger recommendation.
- Protected savings is not counted as spendable cash.

### Storage

- Startup loads normalized saved data.
- Malformed imported rows are ignored/coerced safely.
- Reset all data restores defaults.
- Clear cache does not erase primary data.

### Navigation

- Every dashboard card opens its expected source section.
- Objective Stack items open their source section.
- Recommended Move opens its source section.
- Module Dock cards open their modules.
- Back buttons return to Dashboard.

### Accessibility

- Dashboard interactive cards are keyboard focusable.
- Buttons have meaningful visible labels.
- Focus state is visible.
- Read-only search placeholder is not mistaken for a working search in QA notes.
- Color is not the only indicator for critical/warning state.

### Responsiveness

- Desktop sidebar shows all tabs.
- Mobile bottom nav remains horizontal and usable.
- Dashboard cards do not overlap on narrow viewports.
- Recommendation text wraps without clipping.
- Spreadsheet pages remain horizontally usable.

## Manual QA Script

1. Load Dashboard.
2. Confirm Dashboard heading and VCC Command Center text.
3. Verify Spendable, Protected, and Alerts cards are visible.
4. Click each major dashboard card and confirm expected module opens.
5. Navigate to Settings via sidebar and direct `#/settings`.
6. Return to Dashboard.
7. Use mobile viewport and verify bottom navigation.
8. Confirm no console errors during the flow.

## Missing Edge Cases

- Very large inventory lists.
- Very large transaction history.
- Invalid dates in Bills/Debt/Missions.
- Negative numbers in income/transactions.
- Imported data with unknown section keys.
- LocalStorage unavailable/private-mode failures beyond basic Settings status.

