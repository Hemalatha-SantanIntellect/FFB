# Fusion Center Knowledge Transfer

## Purpose of This Document

This document explains:

- what the `Operational orchestration hub` on `/` is,
- why it was added,
- how `/client-portal` and `/command-center` are structured,
- and why each section/metric exists.

The goal is to make future handover, maintenance, and stakeholder walkthroughs easier.

---

## Cross-Page Design Strategy

The three routes are now intentionally aligned as a single operating narrative:

- `/` = internal operations execution view
- `/client-portal` = customer-facing service and assurance view
- `/command-center` = autonomous governance and command view

All three are connected by a shared orchestration concept:

- `/`: **Operational orchestration hub**
- `/client-portal`: **Client service orchestration**
- `/command-center`: **Autonomous command orchestration**

This alignment avoids disconnected dashboards and gives users a consistent story:

1. detect and prioritize issues (`/`)
2. communicate and manage outcomes (`/client-portal`)
3. automate and govern command decisions (`/command-center`)

---

## Data Consistency and Sync Model

A shared metrics utility was introduced:

- `src/lib/routeMetrics.ts`

### Why it was added

Before this, each page computed parts of its own values independently. That could drift over time and create mismatched numbers between routes.

### What it does

`buildRouteSnapshot(selectedRoute)` centralizes route-scoped metrics using:

- `src/data/fin_funding.json`
- `src/data/fin_sensor.json`
- `src/data/mockData.ts`
- `src/lib/assetFilters.ts`

It returns a normalized snapshot (counts, health/security, in-service, events, status breakdown, percentages) that all pages can consume.

### Result

Numbers shown across `/`, `/client-portal`, and `/command-center` are now derived from one consistent data pipeline and route selection semantics.

---

## `/` (Operations): Operational Orchestration Hub

### What it is

`Operational orchestration hub` is an action layer on the operations route that converts dashboard visibility into operational actions.

### Why it was added

The operations page already had strong monitoring sections (map, health, sensors, security), but it needed an explicit "what do we do now" workflow block. This section bridges monitoring and execution.

### Section behavior

This section is interactive:

- each tile has `Run` and `Details` actions,
- each action tracks run count in-session,
- details open in a modal,
- execution shows a feedback toast.

This behavior now matches the interaction model used on `/client-portal` and `/command-center`.

### Tiles and rationale

1. **Incident triage queue**
   - Why: immediate prioritization of high severity events.
   - Data tie: uses critical/high snapshot counts.

2. **Maintenance window planner**
   - Why: warning assets need scheduled remediation windows.
   - Data tie: warning status counts from snapshot.

3. **Asset risk remediation**
   - Why: critical assets need explicit remediation/replacement orchestration.
   - Data tie: critical status counts from snapshot.

4. **Field dispatch console**
   - Why: operationally links route scope to crew deployment.
   - Data tie: route asset totals from snapshot.

5. **Post-action verification**
   - Why: enforces validation after corrective actions.
   - Data tie: average health score from snapshot.

---

## `/client-portal`: Client Service Orchestration

### Purpose

`/client-portal` translates technical backend state into customer-facing service context (impact, support, compliance, billing, SLA).

### Why this page exists

Stakeholders in client-facing contexts need confidence signals and actionable visibility, not low-level infrastructure internals. This route provides that abstraction while still using the same route-scoped data backbone.

### Main KPI cards and rationale

1. **Subscribed network health**
   - Why: direct top-level service readiness signal.
   - Derived from in-service + health values in shared snapshot.

2. **Active service impact**
   - Why: quantifies user/business impact, not just technical severity.
   - Derived from severity-weighted counts.

3. **Open support cases (Avg ETA)**
   - Why: customer care and expectation management.
   - Derived from status and event pressure.

4. **E-billing & invoice summaries**
   - Why: ties service conditions to financial outcomes.
   - Derived from route scope and service-impact factors.

5. **Data privacy & compliance health**
   - Why: customer trust and audit posture.
   - Derived from compliance/security dimensions in snapshot.

### Trend panels and rationale

1. **Bandwidth utilization trends**
   - Why: proactive understanding of service stress and degradation risk.

2. **Historical outage impact**
   - Why: demonstrates reliability progression and breach pressure.

3. **Environmental threat exposure**
   - Why: highlights external contributors to service degradation.

### Orchestration tiles and rationale

The section title is now **Client service orchestration**. Each tile maps to customer-facing operational outcomes:

1. **Case resolution timeline**
   - Why: progress visibility for active service issues.

2. **Billing impact review**
   - Why: makes financial adjustments transparent and traceable.

3. **Planned service advisories**
   - Why: proactive communication before service windows/events.

4. **Compliance & audit requests**
   - Why: easy evidence generation for client governance needs.

5. **SLA recovery actions**
   - Why: demonstrates active steps to restore/maintain commitments.

All tiles are interactive with modal + run/feedback behavior.

---

## `/command-center`: Autonomous Command Orchestration

### Purpose

`/command-center` is the mission-control layer for automation and policy enforcement. It is oriented to high-level control, reliability strategy, and command decisions.

### Why this page exists

Operations teams need a place to steer autonomous workflows and enforcement policies beyond local route monitoring. This page provides command governance and automation framing while using the same synchronized data core.

### Main KPI cards and rationale

1. **Network availability & uptime**
   - Why: executive reliability anchor metric.

2. **Active alarms by severity**
   - Why: command-level burden and threat pressure overview.

3. **Field service performance (FTFR + capacity)**
   - Why: connects execution efficiency with saturation risk.

4. **Security posture score**
   - Why: summarizes control maturity at command level.

5. **IoT endpoint trust score**
   - Why: confidence indicator for device-layer governance.

6. **BEAD buildout progress**
   - Why: strategic deployment and subscriber growth visibility.

### Trend panels and rationale

1. **Predictive outage trends**
   - Why: forecast-driven reliability management.

2. **SLA breach risks**
   - Why: proactive breach prevention and governance.

3. **Vulnerability patch velocity**
   - Why: security-response speed and MTTR trajectory.

### Orchestration tiles and rationale

The section title is now **Autonomous command orchestration**:

1. **Policy-driven auto remediation**
   - Why: enforce consistent remediation at scale.

2. **Zero-trust enforcement queue**
   - Why: identity/access hardening for high-risk assets.

3. **Threat-to-ticket automation**
   - Why: remove manual lag between detection and execution.

4. **Capacity optimization engine**
   - Why: prevent saturation using predictive scale actions.

5. **False-positive suppression controls**
   - Why: reduce alert fatigue while preserving sensitivity.

All tiles are interactive with modal + run/feedback behavior.

---

## Search Modal UI Update

### What changed

The search asset modal in `TopBar` was simplified to a minimal, console-like layout:

- compact header,
- structured info cards,
- no raw JSON dump,
- cleaner close actions.

### Why it was changed

The previous modal was too heavy for quick lookup workflows. The minimal layout improves scan speed and reduces noise during high-frequency searches.

---

## Key Files to Know

- Shared metrics:
  - `src/lib/routeMetrics.ts`

- Route pages:
  - `src/pages/OperationsDashboardPage.tsx`
  - `src/pages/ClientPortalPage.tsx`
  - `src/pages/CommandCenterPage.tsx`

- KPI and header:
  - `src/components/KPIStrip.tsx`
  - `src/components/TopBar.tsx`

---

## Maintenance Guidance

1. Add/modify core metrics in `routeMetrics.ts` first.
2. Consume that snapshot in pages instead of recomputing locally.
3. Keep orchestration tiles action-oriented and interactive.
4. Maintain naming symmetry across routes (`Operational` / `Client service` / `Autonomous command` orchestration).

