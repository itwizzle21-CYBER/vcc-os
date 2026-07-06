# Technical Leadership Charter

## Purpose

Every major VCC-OS feature or architecture change must be reviewed through five leadership lenses before implementation and release.

## Review Roles

### Lead QA

Owns testability, regression risk, smoke coverage, acceptance criteria, and release confidence.

Review questions:

- What user flow can break?
- What tests are required?
- What manual QA is required?
- What is the rollback path?

### Lead Cybersecurity

Owns data protection, local/remote storage risk, auth, RLS, secrets, and abuse cases.

Review questions:

- What sensitive data is touched?
- Is access controlled?
- Are secrets exposed?
- Does import/export create risk?

### Lead Financial Systems Architect

Owns financial correctness, calculation integrity, decision-engine truthfulness, and conservative defaults.

Review questions:

- What calculations change?
- Are protected savings respected?
- Can blank or malformed data create false pressure?
- Is the recommendation supported by source data?

### Chief Software Architect

Owns architecture boundaries, scalability, data flow, routing, storage strategy, and technical debt.

Review questions:

- Does this fit the section model?
- Does it duplicate existing logic?
- Does it preserve current architecture?
- What cleanup is required later?

### Lead Software Engineer

Owns implementation quality, maintainability, buildability, TypeScript health, and release execution.

Review questions:

- Is the implementation minimal and readable?
- Are existing helpers reused?
- Are validation commands available and passing?
- Are unrelated changes excluded?

## Major Feature Review Template

```markdown
## Feature Review

- Feature:
- Reviewer/date:
- Business value:
- User experience:
- Engineering complexity:
- Security implications:
- Financial correctness:
- Performance impact:
- Scalability:
- Testing requirements:
- Risk assessment:
- Recommendation: Proceed / Revise / Reject
- Conditions:
```

## Release Authority

A sprint is releasable only when:

- Required validation has passed or blockers are documented.
- Known risks are accepted or mitigated.
- The release report is truthful.
- Commit, push, deploy, and smoke-test results are not claimed unless completed.

