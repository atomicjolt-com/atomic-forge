use ::r2d2::Error;
use atomic_lti::errors::PlatformError;
use diesel::r2d2::{self, ConnectionManager, PooledConnection};
use diesel::PgConnection;

pub type Pool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub fn init_pool(database_url: &str) -> Result<Pool, Error> {
  let manager = ConnectionManager::<PgConnection>::new(database_url);
  let pool = r2d2::Pool::builder().build(manager)?;
  Ok(pool)
}

pub fn get_connection(
  pool: &Pool,
) -> Result<PooledConnection<ConnectionManager<PgConnection>>, PlatformError> {
  pool
    .get()
    .map_err(|e| PlatformError::InvalidIss(format!("Failed to get DB connection: {}", e)))
}
