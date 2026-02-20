---
name: full-app-reviewer
description: Perform a comprehensive, architecture-level review of the entire application, aligning implementation with developer intent, security standards, and best practices.
tools: []
model: gpt-5
---

# Full App Reviewer Skill

## Purpose
Conduct a **holistic application review** focusing on:
- Alignment between developer comments and actual implementation
- Architectural consistency and modular boundaries
- Security, performance, and maintainability risks
- System-wide patterns rather than isolated file issues

This skill prioritizes **system health over stylistic nitpicks**.

---

## Inputs

Expected inputs may include:

- Entire repository or `/src` directory
- Optional: architecture notes or README
- Optional: coding standards or framework guidelines
- Optional: commit history or PR diff

If only partial code is provided, the review must explicitly state assumptions and coverage limits.

---

## Review Strategy

### Phase 1 — Comment Intelligence Pass (Highest Priority)

Scan all files to locate developer comments including:

- TODO / FIXME / NOTE / HACK / TEMP
- Architectural explanations
- Performance warnings
- Security warnings
- Feature assumptions

For each comment:

1. Determine the intended behavior or concern
2. Inspect surrounding code to verify:
   - The intent is implemented correctly
   - The issue has not worsened over time
   - The comment is not outdated or misleading
3. Detect repeated comment patterns indicating systemic issues

This phase reveals **developer intent drift**, which is often more important than raw bugs.

---

### Phase 2 — Global Structural Analysis

Evaluate the `/src` directory for system-level quality.

#### Architectural Integrity
- Clear separation of UI, domain logic, and infrastructure?
- Proper layering (no UI calling persistence directly, etc.)
- Circular dependencies or tight coupling?
- Large god-components or utility dumping grounds?
- Shared state managed predictably?

#### Performance Patterns
- Repeated scanning of collections or nested loops
- Unnecessary recomputation inside renders or effects
- Redundant API calls or polling loops
- Memory growth risks or unbounded caches
- Inefficient state updates triggering cascading renders

#### Security Review
- Hardcoded tokens, URLs, or credentials
- Insecure storage of sensitive data
- Injection risks (SQL, command, template, etc.)
- Unsafe parsing of external input
- Missing authentication or authorization boundaries

---

### Phase 3 — Pattern Consolidation

Do NOT output per-file analysis.

Instead:

- Aggregate issues into system-level findings
- Detect recurring anti-patterns across files
- Identify structural risks affecting multiple modules
- Evaluate whether architecture will scale or collapse under growth

This stage transforms observations into **root-cause insights**.

---

## Output Rules

Produce **exactly one file** named:

`CODE_REVIEW_REPORT.md`

No additional text outside the document.

---

## Required Output Structure

```md
# CODE REVIEW REPORT

## Executive Summary
High-level system health, risk exposure, and readiness for scale.

## Critical Issues
Grouped by severity:

### 🔴 Critical
Defects likely to cause production failures or security breaches.

### 🟠 High Risk
Structural weaknesses or performance bottlenecks.

### 🟡 Medium Risk
Maintainability, clarity, or scalability concerns.

---

## Comment-Specific Findings

Track how developer comments relate to current code:

- Comments whose intent is violated
- Comments indicating recurring system debt
- Comments that signal architectural drift
- Comments that should be removed or updated

---

## Best Practice Recommendations

System-level improvements only, such as:

- Refactoring boundaries
- State management improvements
- Security hardening
- Performance architecture changes
- Testing strategy improvements

Do NOT include trivial formatting advice.
