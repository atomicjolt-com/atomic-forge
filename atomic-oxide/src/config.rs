pub use config::ConfigError;
use serde::Deserialize;

#[derive(Deserialize, Clone)]
pub struct Config {
  pub host: String,
  pub port: i32,
  pub database_url: String,
  pub jwk_passphrase: String,
}

impl Config {
  pub fn from_env() -> Result<Self, config::ConfigError> {
    let cfg = config::Config::builder()
      .add_source(config::Environment::default().try_parsing(true))
      .build()?;

    let app_config: Config = cfg.try_deserialize().unwrap();
    Ok(app_config)
  }
}

// Throw the Config struct into a CONFIG lazy_static to avoid multiple processing
lazy_static! {
  pub static ref CONFIG: Config = Config::from_env().unwrap();
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn it_gets_a_config() {
    let config = Config::from_env();
    match config {
      Ok(cfg) => {
        assert_ne!(cfg.host, "".to_string());
      }
      Err(err) => println!("{}", err),
    }
  }

  #[test]
  fn it_gets_a_config_from_the_lazy_static() {
    let config = &CONFIG;
    assert_ne!(config.host, "".to_string());
  }
}
