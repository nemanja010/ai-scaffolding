---
title: "Product Capabilities & Workflow Index"
description: "Comprehensive index of end-to-end product capabilities and user workflows organized by workflow domains."
type: overview
tags:
  - features
  - capabilities
  - domains
  - index
---

# Product Capabilities & Workflow Index

Welcome to the living product capability index. Capabilities in this section are synchronized directly from living specifications (`openspec/specs/`) and archived changes.

## Living Capability Layout Standard
All capability specifications in this vault follow the human-first layout illustrated in the **[[Features/Feature-Template|Feature Specification Template]]**.

## Domain Capability Catalog

| Feature / Capability Document | Domain | Key Workflows & Operational Invariants |
| :--- | :--- | :--- |
| **[[Features/Feature-Template|Feature Specification Template]]** | `template` | Standard layout illustrating human-readable workflow documentation without raw Gherkin. |
| `core-platform/configuration-management` | `core-platform` | Application configuration, environment profiles, and dynamic property resolution |
| `core-platform/data-persistence` | `core-platform` | Data access layer, unit of work, repository patterns, and schema migrations |
| `core-platform/identity-access` | `core-platform` | Authentication, authorization, role-based access control, and session lifecycle |
| `api-services/service-endpoints` | `api-services` | REST/HTTP controllers, request validation, serialization, and status negotiation |
| `api-services/event-messaging` | `api-services` | Event publishing, pub/sub topics, message queues, and async worker dispatch |
| `web-client/app-shell` | `web-client` | Root navigation, routing, layout containers, and application initialization |
| `web-client/ui-components` | `web-client` | Reusable design system components, forms, feedback dialogs, and tabular views |

---
[[Home|← Back to Home]] | [[Overview/Overview|Architecture Overview →]]
