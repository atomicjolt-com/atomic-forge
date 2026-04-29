---
name: atomic-lti Link & Content Service 1.0 Core protocol module
status: draft
date: 2026-04-27
owner: justin.ball@atomicjolt.com
---

# Atomic LTI — Link & Content Service 1.0 Core Protocol

## Background

The Atomic LTI ecosystem (`atomic-lti`, `atomic-lti-tool`,
`atomic-lti-tool-axum`, `atomic-decay`, `atomic-oxide`) implements LTI 1.3
Core, Assignment & Grade Services, Names and Roles, Deep Linking, and
Dynamic Registration. Asset Processor 1.0 was specified separately
(`docs/superpowers/specs/2026-04-26-atomic-lti-asset-processor-protocol-design.md`).
The stack does **not** yet implement the LTI 1.3 **Link & Content Service
1.0** spec, certified by 1EdTech in 2024. LCS allows a tool to manage its
own assets — primarily LTI Resource Links — already engaged in a course:
list them, fetch a single one, create new ones, update titles / URLs /
custom parameters / availability dates, and delete orphans. Drives use
cases like the "already in course" indicator inside a Deep Linking picker,
pushing tool-side activity renames back to the platform, date
synchronization, and orphaned-link cleanup.

LCS sits between Deep Linking (which defines the content-item shape used
when items are *created*) and AGS (which owns line-item URLs that LCS
references via `lineItemIds`). Unlike Asset Processor — which is a
distinct *launch message type* — LCS is a **sibling capability claim**
that may attach to *any* LTI launch, the same shape as AGS or NRPS.

This spec is the first sub-project: **LCS-1**, the protocol layer in
`atomic-lti`. The spec deliberately stops at the protocol library. Two
follow-up sub-projects pick up where LCS-1 leaves off:

- **LCS-2** — framework handlers in `atomic-lti-tool` and
  `atomic-lti-tool-axum` (dynamic-registration scope advertisement, dependency
  wiring for service-token minting, integration smoke tests).
  Brainstormed separately, depending on LCS-1's APIs.
- **LCS-3** — `atomic-decay` server proxies and tester UI (a sixth tab on
  the launch page). Brainstormed separately, depending on LCS-2.

## Goals

1. Implement the **Link & Content Service 1.0 Core** protocol in
   `atomic-lti` with IMS conformance certification readiness as the
   quality target.
2. Mirror the architectural shape of existing modules
   (`assignment_grade_services`, `names_and_roles`, `deep_linking`) so
   consumers find a familiar API surface.
3. Provide every primitive LCS-2 will need: a typed claim shape on
   `IdToken` with scope-check helpers, content-item types for both DL-format
   POST input and LCS-format GET/PUT, the five service operations
   (`list` / `show` / `create` / `update` / `delete`), a paging primitive
   that surfaces the `Link: rel="next"` cursor, scope and version
   constants, an error type, and exhaustive unit tests.
4. Avoid coupling to any framework. The library is plain `async fn` calls
   over `reqwest`, like the rest of `atomic-lti`.
5. Introduce the right paging primitive (`PagedResult<T>`) so LCS doesn't
   inherit AGS's latent next-cursor drop bug. (AGS retrofit is a separate
   follow-up.)

## Non-goals

- **No** handlers in `atomic-lti-tool*`. Separate sub-project (LCS-2).
- **No** atomic-decay endpoints or tester UI. Separate sub-project (LCS-3).
- **No** retrofit of AGS's missing `next_url` cursor on
  `assignment_grade_services::line_items::list`. Separate follow-up.
- **No** fix for `deep_linking::lti_resource_link::CustomParameter`'s
  array-of-pairs wire shape (LCS spec uses object form). Separate
  follow-up — LCS-1 chooses the spec shape locally and accepts the
  asymmetry across modules.
- **No** async-delete polling. LCS-1 treats 202 identically to 200; a
  separate `delete_status(url)` poller is additive when needed.
- **No** `activityId` annex extension. Additive when needed.
- **No** conversion helpers between Deep Linking's `ContentItem` and LCS's
  `ContentItem` types. Callers convert their own data; the two have
  different invariants and aren't 1-to-1.
- **No** standalone `validate()` function. Matches AGS/NRPS precedent —
  LCS is a sibling capability claim, not its own launch type. Validation
  is in-line within service entrypoints (URL parse, response status,
  response deserialization).
- **No** runtime check that `NewContentItem.r#type` is in the platform's
  advertised `types` list. Caller's responsibility — duplicate validation
  vs. platform authority.
- **No** changes to `atomic-lti-tool`, `atomic-lti-tool-axum`,
  `atomic-decay`, or `atomic-oxide` beyond what's needed for the new
  `IdToken` claim field to round-trip through them.

## Architecture

```
atomic-lti/src/
├── link_content_service.rs              # public re-exports + module root
├── link_content_service/
│   ├── mod.rs                            # internal, re-exports submodules
│   ├── claim.rs                          # LinkContentServiceClaim, LCSScopes
│   ├── content_item.rs                   # ContentItem, NewContentItem
│   ├── service.rs                        # list, list_all, show, create, update, delete
│   └── paging.rs                         # PagedResult<T>, parse_next_link
├── id_token.rs                           # +1 field: link_content_service
├── lti_definitions.rs                    # +6 constants; ALL_SCOPES → 9
└── errors.rs                             # +LinkContentServiceError enum
```

Public re-exports from `link_content_service.rs`:

```rust
pub use self::link_content_service::{claim, content_item, paging, service};
pub use self::link_content_service::claim::{LinkContentServiceClaim, LCSScopes};
pub use self::link_content_service::content_item::{ContentItem, NewContentItem};
pub use self::link_content_service::paging::PagedResult;
pub use self::link_content_service::service::{ListParams, list, list_all, show, create, update, delete};
```

Mirrors the public-API shape of `atomic-lti/src/assignment_grade_services.rs`
and `atomic-lti/src/names_and_roles.rs`.

## Type shapes

### Claim (`claim.rs`)

```rust
#[derive(Debug, PartialEq, EnumString, Deserialize, Serialize, Clone)]
pub enum LCSScopes {
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/scope/contentitem.read")]
  Read,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/scope/contentitem.update")]
  Update,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/scope/contentitem.create")]
  Create,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/scope/contentitem.delete")]
  Delete,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LinkContentServiceClaim {
  pub version:      Vec<String>,        // platform-supported versions; v1 = ["1.0.0"]
  pub scopes:       Vec<LCSScopes>,     // typed; what the tool can request tokens for
  pub types:        Vec<String>,        // "ltiResourceLink" + platform-extension types
  pub contentitems: String,             // collection URL — always present
  pub contentitem:  Option<String>,     // single-item URL — only on resource-link launches
}

impl LinkContentServiceClaim {
  pub fn can_read(&self)   -> bool { self.scopes.contains(&LCSScopes::Read)   }
  pub fn can_update(&self) -> bool { self.scopes.contains(&LCSScopes::Update) }
  pub fn can_create(&self) -> bool { self.scopes.contains(&LCSScopes::Create) }
  pub fn can_delete(&self) -> bool { self.scopes.contains(&LCSScopes::Delete) }
  pub fn supports_type(&self, t: &str) -> bool { self.types.iter().any(|x| x == t) }
}
```

`scopes` is a typed enum (matches AGS's `AGSScopes` precedent — a closed set
of 4 values gets compile-time exhaustiveness). `types` is `Vec<String>`
because the spec explicitly lets platforms advertise extension types beyond
`ltiResourceLink`; we want them to round-trip without adding an `Other(String)`
variant.

### `IdToken` extension (`id_token.rs`)

One new optional claim field:

```rust
#[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/linkcontentservice")]
pub link_content_service: Option<LinkContentServiceClaim>,
```

Plus two helpers on `IdToken`:

```rust
impl IdToken {
  pub fn lcs_claim(&self)        -> Option<&LinkContentServiceClaim> { self.link_content_service.as_ref() }
  pub fn is_lcs_supported(&self) -> bool                              { self.link_content_service.is_some() }
}
```

Tools read the claim directly; no `validate()` wrapper. Scope checks go
through `claim.can_read() / can_update() / can_create() / can_delete()`,
which match exhaustively on `LCSScopes` for compile-time safety.

### Content item (`content_item.rs`)

LCS's spec has a deliberate asymmetry: **POST input** uses Deep Linking's
content-item format (singular embedded `lineItem`), while **GET / POST
response / PUT in/out** uses LCS format (`id` URL, `resourceLinkId`,
`lineItemIds` plural array, `published`, `readonly`). On top of that, LCS's
`custom` field is a JSON object map (`{"k": "v"}`) but the existing
`deep_linking::lti_resource_link::CustomParameter` is a `Vec<{key, value}>` —
a different wire shape.

Rather than reuse DL's `ContentItem` enum (which would propagate the
custom-shape divergence), LCS-1 defines two distinct types — exactly the
AGS pattern (`LineItem`, `NewLineItem`, `UpdateLineItem`):

```rust
#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ContentItem {
  pub id:               String,                            // full URL — required
  #[serde(rename = "type")]
  pub r#type:           String,                            // "ltiResourceLink" or platform-extension
  pub resource_link_id: Option<String>,                    // required when type == "ltiResourceLink"
  pub title:            Option<String>,
  pub text:             Option<String>,
  pub url:              Option<String>,                    // empty string allowed per spec
  pub icon:             Option<Icon>,
  pub thumbnail:        Option<Thumbnail>,
  pub window:           Option<Window>,
  pub iframe:           Option<Iframe>,
  pub custom:           Option<HashMap<String, String>>,   // OBJECT form (LCS spec)
  pub line_item_ids:    Option<Vec<String>>,               // AGS line-item URLs
  pub published:        Option<bool>,
  pub available:        Option<DateTimeRange>,
  pub submission:       Option<DateTimeRange>,
  pub readonly:         Option<Vec<String>>,               // platform-supplied non-modifiable field names
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewContentItem {                                // POST input — DL format
  #[serde(rename = "type")]
  pub r#type:    String,                                   // "ltiResourceLink"
  pub title:     Option<String>,
  pub text:      Option<String>,
  pub url:       Option<String>,
  pub icon:      Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub window:    Option<Window>,
  pub iframe:    Option<Iframe>,
  pub custom:    Option<HashMap<String, String>>,          // also object — spec shape over DL crate's array
  pub line_item: Option<deep_linking::lti_resource_link::LineItem>,  // singular, embedded — DL format
  pub available:  Option<DateTimeRange>,
  pub submission: Option<DateTimeRange>,
}

impl NewContentItem {
  pub fn lti_resource_link(title: impl Into<String>, url: impl Into<String>) -> Self;
  pub fn with_text(self, text: impl Into<String>) -> Self;
  pub fn with_icon(self, icon: Icon) -> Self;
  pub fn with_thumbnail(self, thumbnail: Thumbnail) -> Self;
  pub fn with_window(self, window: Window) -> Self;
  pub fn with_iframe(self, iframe: Iframe) -> Self;
  pub fn with_custom(self, custom: HashMap<String, String>) -> Self;
  pub fn with_line_item(self, li: deep_linking::lti_resource_link::LineItem) -> Self;
  pub fn with_available(self, range: DateTimeRange) -> Self;
  pub fn with_submission(self, range: DateTimeRange) -> Self;
}
```

`Icon`, `Thumbnail`, `Window`, `Iframe`, `DateTimeRange` are **re-used**
from `deep_linking::shared` and `deep_linking::lti_resource_link` (already
exist). `LineItem` for `NewContentItem.line_item` is also re-used from
`deep_linking::lti_resource_link::LineItem`. The `r#type: String`
discriminator is intentional — typed support ships only for
`ltiResourceLink` in v1, but unknown platform-extension types round-trip
via the string field without us blocking them.

### Paging (`paging.rs`)

```rust
#[derive(Debug, Clone)]
pub struct PagedResult<T> {
  pub items:    Vec<T>,
  pub next_url: Option<String>,
}

// Parses RFC 8288 Link header; returns the URL whose rel == "next", or None.
pub(crate) fn parse_next_link(headers: &reqwest::header::HeaderMap) -> Option<String>;
```

Generic so the same struct can carry future paged-service results (AGS
retrofit, future LCS extensions). `parse_next_link` handles both single
and multi-`Link`-header forms per RFC 8288, and quoted/unquoted URLs.

### Errors (`crate::errors`)

Centralized in `crate::errors` next to the other six service error enums —
matches the dominant convention (6 of 7 services). AP-1's per-module
`asset_processor/errors.rs` stays the lone outlier.

```rust
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum LinkContentServiceError {
  #[error("There was a problem with the link and content service request. {0}")]
  RequestFailed(String),
  #[error("Content item not found")]
  NotFound,
  #[error("Invalid content item: {0}")]
  InvalidItem(String),
  #[error("Invalid URL: {0}")]
  InvalidUrl(String),
}

impl From<AtomicError> for LinkContentServiceError {
  fn from(error: AtomicError) -> Self {
    LinkContentServiceError::RequestFailed(error.to_string())
  }
}
```

Mirrors `AssignmentGradeServicesError`'s shape; `NotFound` is broken out so
callers can distinguish 404 (used by `show` / `update` / `delete`) from
other failures without string-matching.

### Constants (`lti_definitions.rs`)

```rust
pub const LCS_CLAIM:                       &str = "https://purl.imsglobal.org/spec/lti/claim/linkcontentservice";
pub const LCS_VERSION:                     &str = "1.0.0";
pub const LCS_SCOPE_CONTENT_ITEM_READ:     &str = "https://purl.imsglobal.org/spec/lti/scope/contentitem.read";
pub const LCS_SCOPE_CONTENT_ITEM_UPDATE:   &str = "https://purl.imsglobal.org/spec/lti/scope/contentitem.update";
pub const LCS_SCOPE_CONTENT_ITEM_CREATE:   &str = "https://purl.imsglobal.org/spec/lti/scope/contentitem.create";
pub const LCS_SCOPE_CONTENT_ITEM_DELETE:   &str = "https://purl.imsglobal.org/spec/lti/scope/contentitem.delete";
pub const LCS_ALL_SCOPES: [&str; 4] = [
  LCS_SCOPE_CONTENT_ITEM_READ,
  LCS_SCOPE_CONTENT_ITEM_UPDATE,
  LCS_SCOPE_CONTENT_ITEM_CREATE,
  LCS_SCOPE_CONTENT_ITEM_DELETE,
];

// ALL_SCOPES grows from 5 → 9 entries
pub const ALL_SCOPES: [&str; 9] = [
  AGS_SCOPE_LINE_ITEM,
  AGS_SCOPE_LINE_ITEM_READONLY,
  AGS_SCOPE_RESULT,
  AGS_SCOPE_SCORE,
  NAMES_AND_ROLES_SCOPE,
  LCS_SCOPE_CONTENT_ITEM_READ,
  LCS_SCOPE_CONTENT_ITEM_UPDATE,
  LCS_SCOPE_CONTENT_ITEM_CREATE,
  LCS_SCOPE_CONTENT_ITEM_DELETE,
];
```

Growing `ALL_SCOPES` is purely additive — `dynamic_registration` will
register all 9 automatically without needing changes.

## Service APIs (`service.rs`)

Five operations plus one auto-paging convenience. Each takes `api_token` +
URL + arguments. Service-token minting is the caller's responsibility (the
existing `client_credentials::request_service_token_cached` covers this).
All operations use `application/json` (LCS has no custom media type, unlike
AGS). All requests route through `crate::request::send_request` for
consistent error mapping with the rest of the crate.

```rust
#[derive(Debug, Default, Serialize)]
#[skip_serializing_none]
pub struct ListParams {
  #[serde(rename = "type")]
  pub type_:            Option<String>,    // platform MUST support filter by type
  pub resource_link_id: Option<String>,    // platform SHOULD support
  pub limit:            Option<usize>,
}

pub async fn list(
  api_token:        &str,
  contentitems_url: &str,
  params:           &ListParams,
) -> Result<PagedResult<ContentItem>, LinkContentServiceError>;

pub async fn list_all(
  api_token:        &str,
  contentitems_url: &str,
  params:           &ListParams,
) -> Result<Vec<ContentItem>, LinkContentServiceError>;
// Internally: loops on next_url, never re-applying filter params on subsequent pages
// (per spec: "tool MUST use the next URL as is and not re-apply filters").

pub async fn show(
  api_token:       &str,
  contentitem_url: &str,
) -> Result<ContentItem, LinkContentServiceError>;
// 404 → Err(NotFound); other non-2xx → RequestFailed.

pub async fn create(
  api_token:        &str,
  contentitems_url: &str,
  new_item:         &NewContentItem,
) -> Result<ContentItem, LinkContentServiceError>;

pub async fn update(
  api_token:       &str,
  contentitem_url: &str,
  item:            &ContentItem,
) -> Result<ContentItem, LinkContentServiceError>;
// Full-document PUT. Tool is responsible for sending the entire item; the
// platform MUST treat any field omitted from the body as removed.

pub async fn delete(
  api_token:       &str,
  contentitem_url: &str,
) -> Result<Option<ContentItem>, LinkContentServiceError>;
// 204 → Ok(None); 200/202 with body → Ok(Some(item)); 404 → Err(NotFound).
// 202 is treated identically to 200 — async-delete polling is out of scope
// and would be additive (see Follow-ups).
```

## Validation rules

LCS-1 has no separate `validate()` function. Each service entrypoint
performs lightweight defensive checks:

| Check | Failure |
|---|---|
| URL parses as `https://...` | `InvalidUrl(url)` |
| `send_request` returns 2xx (or 404 surfaced explicitly) | `RequestFailed` / `NotFound` |
| Response body deserializes as `ContentItem` (or `Vec<ContentItem>` for `list`) | `RequestFailed(serde error)` |

For `create`: caller is responsible for ensuring `NewContentItem.r#type`
appears in the platform's advertised `LinkContentServiceClaim.types` list.
We do *not* runtime-check this — a runtime check duplicates platform
authority and adds friction without value.

For `update`: caller is responsible for the full-document semantics. The
spec is explicit: any field omitted from the PUT body MUST be removed by
the platform. We don't enforce minimum fields beyond what the type system
already requires (`ContentItem.id` and `ContentItem.r#type` are
non-optional).

## Testing strategy

Unit tests inline (`#[cfg(test)] mod tests`), following AGS / DL precedent
in the crate:

| Module | Test coverage |
|---|---|
| `claim.rs` | full-claim round-trip serde; missing-`contentitem` (non-RL launch); each `LCSScopes` variant serializes to its URI; `can_read` / `can_update` / `can_create` / `can_delete` correctness on present/absent scope; `supports_type` matches and rejects |
| `content_item.rs` | round-trip both types; camelCase rename verified for `resourceLinkId`, `lineItemIds`, `startDateTime`, `endDateTime`; `custom` deserializes from JSON object form (`{"k": "v"}`); `readonly` round-trips; missing-optional fields decode to `None`; builders compose correctly; `r#type: String` round-trips for unknown platform-extension type values |
| `paging.rs` | `parse_next_link` finds `rel="next"` URL; ignores other `rel` values (`prev`, `first`, `last`); returns `None` when header absent; handles multiple `Link` headers per RFC 8288; handles quoted and unquoted URL forms |
| `service.rs` | mockito-backed: **list** returns paged items + parses `Link` header into `next_url`; **list_all** auto-pages across 3 pages; `ListParams` query-string includes `type=...&resource_link_id=...&limit=...` when set; **show** 200 → `Ok(item)` and 404 → `Err(NotFound)`; **create** POSTs `NewContentItem` body, returns server-decorated `ContentItem` (with `id`, `resourceLinkId`, `lineItemIds`); **update** PUTs full body, returns updated item; **delete** 204 → `Ok(None)`, 200 with body → `Ok(Some)`, 202 with body → `Ok(Some)`, 404 → `Err(NotFound)`; bad URL (non-https) → `InvalidUrl`; non-2xx body → `RequestFailed` |
| `id_token.rs` | claim deserializes from full launch JSON via the URI rename; `lcs_claim()` returns `Some` when claim present, `None` otherwise; `is_lcs_supported()` matches |
| `errors.rs` | every `LinkContentServiceError` variant `Display`s with expected message; `From<AtomicError>` conversion |

IMS Conformance certification is verified at LCS-2 once handlers exist.
LCS-1's tests prove the building blocks are correct.

## Work breakdown (high-level — detailed plan to follow)

The plan derived from this spec is one PR, sized roughly:

1. Add `LCS_*` constants to `lti_definitions.rs`; extend `ALL_SCOPES` to 9.
2. Add `LinkContentServiceError` to `crate::errors` with `From<AtomicError>`.
3. Create `link_content_service/` module skeleton + `mod.rs` re-exports;
   wire `pub mod link_content_service;` in `lib.rs`.
4. Implement `paging.rs`: `PagedResult<T>` + `parse_next_link` + tests.
5. Implement `claim.rs`: `LCSScopes` enum, `LinkContentServiceClaim`,
   helpers + tests.
6. Implement `content_item.rs`: `ContentItem`, `NewContentItem`, builders +
   tests.
7. Implement `service.rs`: `ListParams`, `list`, `list_all`, `show`,
   `create`, `update`, `delete` + mockito tests.
8. Add `link_content_service` field to `IdToken` (`id_token.rs`) +
   `lcs_claim()` / `is_lcs_supported()` helpers + round-trip tests in
   `id_token.rs`.
9. Run `cargo test --package atomic-lti link_content_service` end-to-end;
   confirm clean `cargo check` and `cargo clippy -- -D warnings`.
10. Update `atomic-lti/README.md` to list "Link & Content Service 1.0
    Core" under "Implemented services."

Estimated size: 1 PR, ~1.4k lines of new code (the module + tests),
slightly larger than AP-1 because of the paging primitive plus 5 service
operations vs. AP-1's 4.

## Rollout

| Sub-project | Plan file | Depends on |
|---|---|---|
| **LCS-1** (this spec) | `docs/superpowers/plans/2026-04-27-atomic-lti-lcs-protocol.md` | nothing |
| **LCS-2** (handlers in `atomic-lti-tool*`) | future | LCS-1 |
| **LCS-3** (atomic-decay endpoints + 6th tester tab) | future | LCS-2 |

LCS-1 ships independently. LCS-2 is a separate brainstorm once LCS-1 lands
and clears review.

## Follow-ups (not LCS-1's work)

- Retrofit `assignment_grade_services::line_items::list` to expose
  `next_url` via `PagedResult<LineItem>`. Pre-existing latent bug: AGS
  silently drops the `Link: rel="next"` cursor today, so courses with
  many line items can't be fully enumerated.
- Reconcile `deep_linking::lti_resource_link::CustomParameter`
  (`Vec<{key, value}>`) with the spec's object-form `custom` JSON in the
  Deep Linking module. LCS-1 picks the spec shape locally; eventually
  both modules should agree.
- Add `activityId` annex extension support on `ContentItem` and
  `NewContentItem` (additive — read-only on existing items, settable on
  new items).
- Async-delete polling for 202 responses (additive — separate
  `delete_status(url)` poller and a `DeleteOutcome` enum once a
  platform actually surfaces async-delete in practice).
