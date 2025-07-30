use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

pub type Pool = PgPool;

pub async fn init_pool(database_url: &str) -> Result<Pool, sqlx::Error> {
  let pool = PgPoolOptions::new()
    .max_connections(5)
    .acquire_timeout(Duration::from_secs(3))
    .connect(database_url)
    .await?;

  Ok(pool)
}
