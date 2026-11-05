---
title: "Domain Catalog"
description: "Canonical architectural boundaries and capabilities registered in openspec/domains.yaml."
type: reference
tags:
  - reference
  - architecture
  - domains
---

# Architectural Domain Catalog

Canonical architectural boundaries registered in `openspec/domains.yaml`.

## Core Platform (`core-platform`)

Foundational infrastructure, storage abstractions, configuration, and security services

### Capabilities

- **`configuration-management`**: Application configuration, environment profiles, and dynamic property resolution
- **`data-persistence`**: Data access layer, unit of work, repository patterns, and schema migrations
- **`identity-access`**: Authentication, authorization, role-based access control, and session lifecycle

## API & Backend Services (`api-services`)

RESTful endpoints, external API gateways, and asynchronous event messaging pipelines

### Capabilities

- **`service-endpoints`**: REST/HTTP controllers, request validation, serialization, and status negotiation
- **`event-messaging`**: Event publishing, pub/sub topics, message queues, and async worker dispatch

## Web Client Applications (`web-client`)

Frontend single-page applications, UI component libraries, and client-side state

### Capabilities

- **`app-shell`**: Root navigation, routing, layout containers, and application initialization
- **`ui-components`**: Reusable design system components, forms, feedback dialogs, and tabular views

---
[[Home|← Back to Home]] | [[Reference/Overview|Reference Index]]
