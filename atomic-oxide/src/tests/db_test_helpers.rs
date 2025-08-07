use crate::db::{init_pool, Pool};
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use diesel::RunQueryDsl;
use std::env;

/// Setup test database and return a connection pool
pub fn setup_test_db() -> Pool {
  let database_url =
    env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL must be set for tests");
  init_pool(&database_url).expect("Failed to create test database pool")
}

/// Test database helper for ensuring clean database state
pub struct TestDb {
  pool: Pool,
}

impl TestDb {
  /// Create a new test database connection pool
  pub fn new() -> Self {
    let pool = setup_test_db();
    TestDb { pool }
  }

  /// Get a connection from the pool
  pub fn conn(&self) -> r2d2::PooledConnection<ConnectionManager<PgConnection>> {
    self.pool.get().expect("Failed to get database connection")
  }

  /// Begin a transaction that will be rolled back at the end of the test
  pub fn begin_test_transaction(&self) -> TestTransaction {
    let mut conn = self.conn();
    // Start a transaction
    diesel::sql_query("BEGIN")
      .execute(&mut conn)
      .expect("Failed to begin transaction");
    TestTransaction { conn }
  }

  /// Clean all data from tables (useful for tests that can't use transactions)
  pub fn clean_database(&self) {
    let mut conn = self.conn();

    // Disable foreign key checks temporarily
    diesel::sql_query("SET session_replication_role = 'replica'")
      .execute(&mut conn)
      .expect("Failed to disable triggers");

    // Get all table names
    let tables: Vec<String> =
      diesel::sql_query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        .load::<TableName>(&mut conn)
        .expect("Failed to get table names")
        .into_iter()
        .map(|t| t.tablename)
        .filter(|name| !name.starts_with("__diesel"))
        .collect();

    // Truncate all tables
    for table in tables {
      let query = format!("TRUNCATE TABLE {} CASCADE", table);
      diesel::sql_query(&query)
        .execute(&mut conn)
        .expect("Failed to truncate table");
    }

    // Re-enable foreign key checks
    diesel::sql_query("SET session_replication_role = 'origin'")
      .execute(&mut conn)
      .expect("Failed to re-enable triggers");
  }
}

/// A test transaction that will be automatically rolled back
pub struct TestTransaction {
  conn: r2d2::PooledConnection<ConnectionManager<PgConnection>>,
}

impl TestTransaction {
  /// Get the connection for use in tests
  pub fn conn(&mut self) -> &mut PgConnection {
    &mut self.conn
  }
}

impl Drop for TestTransaction {
  fn drop(&mut self) {
    // Rollback the transaction when the TestTransaction is dropped
    diesel::sql_query("ROLLBACK")
      .execute(&mut self.conn)
      .expect("Failed to rollback test transaction");
  }
}

#[derive(QueryableByName)]
struct TableName {
  #[diesel(sql_type = diesel::sql_types::Text)]
  tablename: String,
}

#[derive(QueryableByName)]
struct CountResult {
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  count: i64,
}

#[derive(QueryableByName)]
struct SelectOne {
  #[diesel(sql_type = diesel::sql_types::Integer)]
  #[diesel(column_name = "?column?")]
  value: i32,
}

/// Macro to setup a test with a clean database
#[macro_export]
macro_rules! test_with_db {
  ($test_name:ident, $test_body:expr) => {
    #[test]
    fn $test_name() {
      let db = TestDb::new();
      let mut txn = db.begin_test_transaction();

      // Run the test body with the transaction connection
      $test_body(&mut txn);

      // Transaction is automatically rolled back when txn is dropped
    }
  };
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_database_connection() {
    let db = TestDb::new();
    let mut conn = db.conn();

    // Simple query to verify connection works
    let result: SelectOne = diesel::sql_query("SELECT 1")
      .get_result(&mut conn)
      .expect("Failed to execute test query");

    assert_eq!(result.value, 1);
  }

  #[test]
  fn test_transaction_rollback() {
    let db = TestDb::new();

    // Create a test table for this example
    {
      let mut conn = db.conn();
      diesel::sql_query(
        "CREATE TABLE IF NOT EXISTS test_rollback (id SERIAL PRIMARY KEY, value TEXT)",
      )
      .execute(&mut conn)
      .expect("Failed to create test table");
    }

    // Insert data in a transaction
    {
      let mut txn = db.begin_test_transaction();
      diesel::sql_query("INSERT INTO test_rollback (value) VALUES ('test')")
        .execute(txn.conn())
        .expect("Failed to insert test data");

      // Verify data exists in transaction
      let count: CountResult = diesel::sql_query("SELECT COUNT(*) FROM test_rollback")
        .get_result(txn.conn())
        .expect("Failed to count rows");
      assert_eq!(count.count, 1);

      // Transaction will be rolled back when txn is dropped
    }

    // Verify data was rolled back
    let mut conn = db.conn();
    let count: CountResult = diesel::sql_query("SELECT COUNT(*) FROM test_rollback")
      .get_result(&mut conn)
      .expect("Failed to count rows after rollback");
    assert_eq!(count.count, 0);

    // Clean up
    diesel::sql_query("DROP TABLE IF EXISTS test_rollback")
      .execute(&mut conn)
      .expect("Failed to drop test table");
  }
}
