# atomic-lti

`atomic-lti` is a Rust library that provides support for integrating with the LTI 1.3 and LTI Advantage standards provided by 1EdTech.

## Supported LTI Advantage specifications

The following LTI Advantage specifications are supported:

- Names and Roles
- Assignment Grade Services
- Deep Linking

## Usage

To use `atomic-lti` in your Rust project, add the following to your `Cargo.toml` file:

```toml
[dependencies]
atomic-lti = "0.1.0"
```

See atomic-oxide for a full example of how to use the atomic-lti library to build and LTI tool.



## Run tests

To run the tests for `atomic-lti`, use the following command:

```sh
cargo test -- --nocapture
```
