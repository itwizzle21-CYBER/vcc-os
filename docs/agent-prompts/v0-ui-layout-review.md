# v0 — UI and Layout Review

Treat the current VCC-OS design and working application as the baseline. This is a focused design review, not a blank redesign.

## Preserve without exception

- Existing features and routes
- Navigation and settings
- Forms and validation behavior
- Spreadsheet behavior
- Financial calculations and business rules
- Supabase architecture and data contracts
- Persistence, offline behavior, and mobile functionality
- Existing accessibility behavior that meets or exceeds the proposed concept

## Review goals

Improve only the selected page or component:

- visual hierarchy and information density
- spacing, alignment, typography, and scanability
- responsive behavior and mobile navigation
- page layout and section ordering
- dashboard cards and summaries
- forms, tables, empty states, errors, and loading states
- keyboard use, focus visibility, semantics, contrast, touch targets, and reduced motion

Use the current React, TypeScript, Tailwind, and component conventions. Produce concepts or isolated React/Tailwind prototypes that Codex can review and integrate selectively.

## Boundaries

- Do not replace or regenerate the full application.
- Do not change business logic, financial logic, routes, persistence, authentication, or Supabase architecture.
- Do not connect to the production repository or deploy.
- Do not auto-commit or push changes.
- Do not introduce new dependencies unless the concept cannot be expressed with the current stack; explain any proposed dependency.
- Use realistic placeholders when production data or secrets would otherwise be required.

## Required response

1. Baseline observations tied to the selected page or component
2. The proposed hierarchy and responsive behavior
3. An isolated React/Tailwind prototype or clearly bounded concept
4. Accessibility notes
5. Existing behaviors intentionally preserved
6. Files or integration points Codex would need to handle manually
7. Risks, assumptions, and regression tests
8. A final recommendation: **Proceed**, **Revise**, or **Reject**

Do not begin until a specific VCC page or component has been selected.
