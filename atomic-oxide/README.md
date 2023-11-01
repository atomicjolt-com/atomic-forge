# atomic-oxide

LTI Tool implementation written in Rust

## Usage

Install Rust

### DB Setup
diesel setup

diesel migration run

Setup DB for tests:
In .env set DATABASE_URL to the test db url then run diesel setup


### If there are problems building
Fix: https://github.com/sgrif/pq-sys/issues/34
If you get this error: `note: ld: library not found for -lpq`
1. Fix:
  `brew install libpq`
  take note on the path of the installed lib
2. Set the environment variable for PQ_LIB_DIR
  `export PQ_LIB_DIR="$(brew --prefix libpq)/lib"`
3. Try cargo build

### Run tests
```sh
cargo test -- --nocapture
```
### Running Server

```sh
cargo run
```

### Running Server with watch

Install required crates
```sh
cargo install systemfd cargo-watch
```

Run the server
```sh
systemfd --no-pid -s http::$PORT -- cargo watch -x run
```
