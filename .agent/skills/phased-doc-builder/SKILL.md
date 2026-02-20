---
name: phased-doc-builder
description: Generates structured project documentation for each lifecycle phase based on an existing codebase and artifacts. Produces exactly one document per phase.
tools: []
model: gpt-5
---

# Phased Documentation Builder Skill

## Purpose
Create a structured documentation set for an existing application by reconstructing its lifecycle across eight phases.

The skill must:
- Infer intent from code, configs, commits, and structure
- Avoid inventing requirements that cannot be supported
- Produce **one markdown document per phase**
- Focus on clarity, traceability, and execution readiness

---

## Inputs

Expected inputs include:

- Project repository or `/src`
- README or notes (if available)
- Existing diagrams, tickets, or specs (optional)
- Environment configs or build scripts (optional)

If evidence is incomplete, the skill must explicitly label assumptions.

---

## Execution Strategy

The agent reconstructs the project lifecycle in order:

1. Inspect architecture, modules, configs, and workflows
2. Identify inferred goals, features, and constraints
3. Map existing implementation to lifecycle phases
4. Produce documentation grounded in observable reality

Do not assume the project followed textbook phases.
Document what **actually exists**, not what “should” exist.

---

## Output Rules

Generate **exactly eight files**, one per phase.

File names must be:

- `PHASE_1_DEMAND.md`
- `PHASE_2_DISCOVERY.md`
- `PHASE_3_UX_DESIGN.md`
- `PHASE_4_ARCHITECTURE.md`
- `PHASE_5_DEVELOPMENT.md`
- `PHASE_6_TESTING.md`
- `PHASE_7_RELEASE.md`
- `PHASE_8_POSTLAUNCH.md`

Do not output anything outside these documents.

---

## Phase Document Templates

### Phase 1 — Demand Definition

# Phase 1 — Demand Definition

## Problem Statement
What real-world issue the app appears to solve.

## Target Users
Who the system serves, inferred from features.

## Success Signals
What outcomes indicate value.

## Constraints
Technical, business, or platform limitations observed.
# Phase 2 — Discovery & MVP Scope

## Core Capabilities
Features necessary for the first usable version.

## User Journeys
Primary flows supported by the system.

## MVP Boundaries
What the product intentionally excludes.

## Acceptance Criteria
Conditions indicating features work as intended.
# Phase 3 — UX & Functional Design

## Navigation Structure
Pages, routes, and hierarchy.

## Key Interaction Patterns
Forms, workflows, and feedback mechanisms.

## State & Error Handling Patterns
How the UI communicates system state.

## Usability Observations
Clarity, friction points, or inconsistencies.
# Phase 4 — Technical Architecture

## System Overview
Major layers and services.

## Data Model
Entities and relationships inferred from code.

## Non-Functional Requirements
Performance, reliability, security expectations.

## Security Notes
Auth flows, storage practices, and risk areas.

## Release Strategy
How builds, environments, and deployments appear managed.
# Phase 5 — Development

## Implementation Approach
Observed patterns in module structure.

## Coding Conventions
Naming, file organization, and architecture style.

## Technology Decisions
Frameworks and libraries used with inferred rationale.

## Change Tracking
Evidence of versioning, logs, or migration patterns.
# Phase 6 — Testing & QA

## Test Strategy Evidence
Unit tests, mocks, or absence thereof.

## Critical Test Scenarios
High-risk flows requiring validation.

## Bug Handling Practices
Error logging, retries, or monitoring signals.

## UAT Readiness Indicators
Whether workflows appear stable enough for users.
# Phase 7 — Release Preparation

## Build & Packaging Process
How artifacts are generated.

## Deployment Workflow
Hosting, CI/CD, or manual steps.

## Rollback Signals
Whether recovery mechanisms exist.

## Monitoring Indicators
Logs, analytics, or alerts visible in the system.
# Phase 8 — Go-Live & Iterate

## Current Product Maturity
Prototype, beta, or production-level system.

## Observed Feedback Loops
Telemetry, logs, or user correction flows.

## Improvement Opportunities
Most impactful areas for next iteration.

## Updated Backlog Candidates
Features or fixes logically implied by current gaps.

## Richness Constraints
- **Granular Inventory**: Before writing, the agent MUST list every file found in `/src`. 
- **Traceability Requirement**: Every "Success Signal" or "Implementation Pattern" must cite at least one specific file path and line number as evidence.
- **Minimum Section Depth**: Each phase document must contain at least 4 sub-sections with a minimum of 3 paragraphs each.
- **Inner Monologue**: Initialize a `### Discovery Log` before generating each phase to record every inferred detail before it is "compressed" into the final markdown.
