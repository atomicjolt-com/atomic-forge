---
name: atomic-lti Asset Processor 1.0 Core protocol module
status: draft
date: 2026-04-26
owner: justin.ball@atomicjolt.com
---

# Atomic LTI — Asset Processor 1.0 Core Protocol

## Background

The Atomic LTI ecosystem (`atomic-lti`, `atomic-lti-tool`,
`atomic-lti-tool-axum`, `atomic-decay`, `atomic-oxide`) implements LTI 1.3
Core, Assignment & Grade Services, Names and Roles, Deep Linking, and
Dynamic Registration. It does **not** yet implement the LTI 1.3 **Asset
Processor 1.0** spec, certified by 1EdTech in 2024. Asset Processor enables
tool-side processing of student assets (essays, files, videos, code) and
posting structured reports back to the platform — covering use cases like
plagiarism detection, automated essay scoring, content moderation, and code
linting.

The atomic-decay multi-spec tester (shipped 2026-04-25) explicitly deferred
Asset Processor as a separate protocol-implementation project. This spec is
that project's first sub-project: **AP-1**, the protocol layer in
`atomic-lti`.

The spec deliberately stops at the protocol library. Two follow-up
sub-projects pick up where AP-1 leaves off:

- **AP-2** — framework handlers in `atomic-lti-tool` and
  `atomic-lti-tool-axum` (launch routing, dependency wiring, validation
  middleware). Brainstormed separately, depending on AP-1's APIs.
- **AP-3** — `atomic-decay` server proxies and tester UI (a fifth tab on the
  launch page). Brainstormed separately, depending on AP-2.

The companion Asset Processor with EULA 1.0 sub-spec is also out of scope;
it gets its own brainstorm series (**AP-EULA**) once AP-1 lands.

## Goals

1. Implement the **Asset Processor 1.0 Core** protocol in `atomic-lti` with
   IMS conformance certification as the quality target.
2. Mirror the architectural shape of existing modules (`deep_linking`,
   `assignment_grade_services`) so consumers find a familiar API surface.
3. Provide every primitive AP-2 will need: claim shapes on `IdToken`, a
   typed launch validator, asset-service GET, report-service POST/GET/PUT,
   scope constants, error type, and exhaustive unit tests.
4. Avoid coupling to any framework. The library is plain `async fn` calls
   over `reqwest`, like the rest of `atomic-lti`.

## Non-goals

- **No** EULA sub-spec. Separate sub-project.
- **No** AP-2 handlers. Separate sub-project.
- **No** atomic-decay endpoints or tester UI. Separate sub-project.
- **No** streamed asset bodies. `asset_service::get` returns
  `bytes::Bytes` (buffered). Streamed variant deferred — additive, non-
  breaking when added.
- **No** report DELETE method. Spec marks it platform-optional with no
  conformance requirement. Additive when needed.
- **No** asset checksum verification. `AssetClaim.sha256_checksum` is
  exposed via the launch struct; callers verify if they choose.
- **No** changes to `atomic-lti-tool`, `atomic-lti-tool-axum`,
  `atomic-decay`, or `atomic-oxide` beyond what's needed for the new
  `IdToken` claim fields to round-trip through them.
- **No** runtime validation that "the right fields are set for this report
  type." Tools are responsible for filling the right fields per their
  declared `type` discriminator.

## Architecture

```
atomic-lti/src/
├── asset_processor.rs              # public re-exports + module root
├── asset_processor/
│   ├── mod.rs                       # internal, re-exports submodules
│   ├── claim.rs                     # AssetClaim, AssetReportClaim, ActivityClaim
│   ├── launch_message.rs            # AssetProcessorLaunch + validate()
│   ├── asset_service.rs             # GET asset bytes by URL
│   ├── report_service.rs            # POST / GET (list) / PUT
│   ├── report.rs                    # Report struct + Indicator + builders
│   ├── scopes.rs                    # AP_ASSET_READONLY_SCOPE, AP_REPORT_SCOPE
│   ├── errors.rs                    # AssetProcessorError
│   └── shared.rs                    # tests-only helpers (e.g. iso8601_now())
└── id_token.rs                      # +3 fields: asset, asset_report, ap_activity
```

Public re-exports from `asset_processor.rs`:

```rust
pub use self::asset_processor::{
  asset_service, claim, errors, launch_message, report, report_service, scopes,
};
pub use self::asset_processor::claim::{ActivityClaim, AssetClaim, AssetReportClaim};
pub use self::asset_processor::launch_message::{validate, AssetProcessorLaunch};
pub use self::asset_processor::report::{Indicator, Report};
pub use self::asset_processor::errors::AssetProcessorError;
```

Mirrors the public-API shape of `atomic-lti/src/deep_linking.rs`.

## Type shapes

### Claim shapes (`claim.rs`)

```rust
#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AssetClaim {
  pub id: String,
  pub url: String,
  pub title: Option<String>,
  pub filename: Option<String>,
  pub size: Option<u64>,
  pub content_type: Option<String>,
  pub sha256_checksum: Option<String>,
  pub timestamp: Option<String>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AssetReportClaim {
  pub report_url: String,
  pub scope: Vec<String>,
  pub report_types: Option<Vec<String>>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ActivityClaim {
  pub id: String,
  pub title: Option<String>,
}
```

### `IdToken` extension (`id_token.rs`)

Three new optional claim fields, joined by their canonical URIs:

```rust
#[serde(rename = "https://purl.imsglobal.org/spec/lti-ap/claim/asset")]
pub asset: Option<AssetClaim>,
#[serde(rename = "https://purl.imsglobal.org/spec/lti-ap/claim/assetreport")]
pub asset_report: Option<AssetReportClaim>,
#[serde(rename = "https://purl.imsglobal.org/spec/lti-ap/claim/activity")]
pub ap_activity: Option<ActivityClaim>,
```

Plus a helper:

```rust
impl IdToken {
  pub fn is_asset_processor_launch(&self) -> bool {
    self.asset.is_some()
  }
}
```

### Validated launch struct (`launch_message.rs`)

```rust
pub struct AssetProcessorLaunch {
  pub asset: AssetClaim,
  pub report: AssetReportClaim,
  pub activity: Option<ActivityClaim>,
  pub deployment_id: String,
  pub client_id: String,
  pub iss: String,
  pub sub: String,
}

pub fn validate(id_token: &IdToken) -> Result<AssetProcessorLaunch, AssetProcessorError>;
```

### Report (`report.rs`)

```rust
#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Report {
  #[serde(rename = "type")]
  pub r#type: String,
  pub asset_id: String,
  pub timestamp: String,
  pub title: Option<String>,
  pub comment: Option<String>,
  pub score_given: Option<f32>,
  pub score_maximum: Option<f32>,
  pub indicator: Option<Indicator>,
  pub priority: Option<u32>,
  pub error_code: Option<String>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Indicator {
  pub color: String,
  pub severity: Option<String>,
  pub label: Option<String>,
}

impl Report {
  pub fn new(asset_id: &str, type_id: &str) -> Self;
  pub fn with_score(self, given: f32, maximum: f32) -> Self;
  pub fn with_comment(self, comment: &str) -> Self;
  pub fn with_indicator(self, indicator: Indicator) -> Self;
  pub fn with_priority(self, priority: u32) -> Self;
  pub fn with_title(self, title: &str) -> Self;
}
```

### Scopes (`scopes.rs`)

```rust
pub const AP_ASSET_READONLY_SCOPE: &str =
  "https://purl.imsglobal.org/spec/lti-ap/scope/asset.readonly";
pub const AP_REPORT_SCOPE: &str =
  "https://purl.imsglobal.org/spec/lti-ap/scope/report";
```

### Error type (`errors.rs`)

```rust
pub enum AssetProcessorError {
  MissingClaim(&'static str),
  InvalidUrl(String),
  ScopeMismatch { expected: &'static str, got: Vec<String> },
  AssetFetchFailed(String),
  ReportRejected(String),
  RequestFailed(String),
}
```

`Display`, `Error`, `From<reqwest::Error>`, `From<serde_json::Error>`
implementations included.

## Service APIs

### Asset Service (`asset_service.rs`)

```rust
pub struct AssetBody {
  pub bytes: bytes::Bytes,
  pub content_type: Option<String>,
  pub content_length: Option<u64>,
}

pub async fn get(
  api_token: &str,
  asset_url: &str,
) -> Result<AssetBody, AssetProcessorError>;
```

`api_token` is minted with `AP_ASSET_READONLY_SCOPE` via the existing
`client_credentials::request_service_token_cached`. Buffered, single-shot,
returns the full body plus `Content-Type` and `Content-Length` headers when
present.

### Report Service (`report_service.rs`)

```rust
const REPORT_CONTENT_TYPE: &str = "application/vnd.ims.lis.v1.assetreport+json";

#[derive(Debug, Serialize)]
#[skip_serializing_none]
pub struct ListParams {
  pub asset_id: Option<String>,
  pub limit: Option<usize>,
}

pub async fn post(
  api_token: &str,
  report_url: &str,
  report: &Report,
) -> Result<Report, AssetProcessorError>;

pub async fn list(
  api_token: &str,
  report_url: &str,
  params: &ListParams,
) -> Result<Vec<Report>, AssetProcessorError>;

pub async fn update(
  api_token: &str,
  report_url: &str,
  report_id: &str,
  report: &Report,
) -> Result<Report, AssetProcessorError>;
```

`api_token` is minted with `AP_REPORT_SCOPE`. POST and PUT use
`Content-Type: application/vnd.ims.lis.v1.assetreport+json`; GET and the
response side use the same media type as `Accept`.

All three operations route through the existing
`atomic_lti::request::send_request` helper for consistent error mapping
with the rest of the crate.

## Validation rules (`launch_message::validate`)

`validate` runs **after** `atomic_lti::validate::validate_launch` has
verified standard JWT claims (`iss`, `aud`, `azp`, `exp`, `iat`, `sub`,
`nonce`, signature). It enforces the AP-specific rules:

| Rule | Failure |
|---|---|
| `message_type == "LtiAssetProcessorRequest"` | `MissingClaim("message_type")` |
| `version == "1.3.0"` | `MissingClaim("version")` |
| `deployment_id` present and non-empty | `MissingClaim("deployment_id")` |
| `asset` claim present | `MissingClaim("asset")` |
| `asset.url` parses as `https://...` | `InvalidUrl(asset.url)` |
| `asset_report` claim present | `MissingClaim("asset_report")` |
| `asset_report.report_url` parses as `https://...` | `InvalidUrl(report_url)` |
| `asset_report.scope` non-empty | `ScopeMismatch{expected, got}` |
| `asset_report.scope` contains `AP_REPORT_SCOPE` | `ScopeMismatch{expected, got}` |

Returns `AssetProcessorLaunch` on success. Caller continues with that.

## Testing strategy

Unit tests in each module, following the patterns established in
`assignment_grade_services::*::tests` and `deep_linking::tests`:

| Module | Test coverage |
|---|---|
| `claim.rs` | round-trip serde for each claim shape; missing-optional fields decode to `None`; URI-renamed fields serialize with the exact URI |
| `launch_message.rs` | one test per validation rule (pass on a complete launch; one fail per missing-claim / bad-URL / scope-mismatch path); cross-version rejection |
| `asset_service.rs` | mockito-backed: 200 with body returns `AssetBody` with bytes/content-type; 401 returns `AssetFetchFailed`; non-2xx → error |
| `report_service.rs` | mockito-backed: POST returns server-decorated report; list returns `Vec<Report>` with correct query params; PUT round-trip; correct `Accept`/`Content-Type` headers |
| `report.rs` | builder methods compose; serde round-trip preserves all optional fields; `Indicator` nested round-trip; `#[serde(rename = "type")]` works |
| `errors.rs` | every variant `Display`s; `From<reqwest::Error>` and `From<serde_json::Error>` impls |

Conformance with the IMS Asset Processor 1.0 Core test suite is **not**
verified at AP-1; it is verified at AP-2 once handlers exist. AP-1's tests
prove the building blocks are correct.

## Work breakdown (high-level, detailed plan to follow)

The plan derived from this spec will be one PR, sized roughly:

1. Add `IdToken` claim fields (`asset`, `asset_report`, `ap_activity`) plus
   `is_asset_processor_launch()` helper, with round-trip tests.
2. Create `asset_processor/` module skeleton with empty `mod.rs` and
   `lib.rs` re-exports.
3. Implement `claim.rs` + tests.
4. Implement `errors.rs` + tests.
5. Implement `scopes.rs` (no tests; constants).
6. Implement `report.rs` + builder + tests.
7. Implement `launch_message.rs` + validation + tests (one test per rule).
8. Implement `asset_service.rs` + mockito tests.
9. Implement `report_service.rs` + mockito tests.
10. Run `cargo test --package atomic-lti asset_processor` end-to-end;
    confirm clean `cargo check` and `cargo clippy -- -D warnings`.
11. Update `atomic-lti/README.md` to list Asset Processor 1.0 Core under
    "Implemented services."

Estimated size: 1 PR, ~1.2k lines of new code (the module + tests),
similar to the AGS module's footprint at introduction.

## Rollout

| Sub-project | Plan file | Depends on |
|---|---|---|
| **AP-1** (this spec) | `docs/superpowers/plans/2026-04-26-atomic-lti-asset-processor-protocol.md` | nothing |
| **AP-2** | future | AP-1 |
| **AP-3** | future | AP-2 |
| **AP-EULA** | future | AP-1 |

AP-1 ships independently. AP-2 is a separate brainstorm once AP-1 lands and
clears review.
