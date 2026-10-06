# Business Domain Glossary

Canonical ubiquitous vocabulary for business and domain concepts across the system.

| Term | Definition | Use When | Avoid |
| :--- | :--------- | :------- | :---- |
| **Tenant** | An isolated organizational customer account sharing the platform infrastructure while maintaining strict logical data separation. | Referring to an organization or account boundary in multi-tenant contexts. | Client, Account, Organization (unless formally distinguished), Customer |
| **Workspace** | A collaborative operational container within a tenant that groups related projects, resources, and configurations. | Describing user work environments and permission groupings within a tenant. | Folder, Project Group, Space |
| **User** | An authenticated individual who interacts with the system via web, API, or automated integration. | Discussing identities, operators, or account holders. | Person, Human, Account (when referring to an identity) |
| **Role** | A named set of permissions assigned to a user determining allowed actions within a tenant or workspace. | Specifying authorization policies, access controls, or governance rules. | Group, Level, Rank |
| **Policy** | A formal business rule or constraint governing resource access, data retention, or automated lifecycle execution. | Defining compliance, security limits, or system rules. | Restriction, Guideline, Preference |
| **Audit Log** | An append-only chronological record of security-relevant events, state transitions, and administrative actions. | Documenting historical accountability, compliance, or event tracking. | History, Activity Stream, Event Log |
