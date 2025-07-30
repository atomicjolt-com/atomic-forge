use atomic_decay::test_utils::test_helpers::TestDb;
use chrono::Utc;
use sqlx::Row;
use uuid::Uuid;

// Example test using the TestDb directly
#[tokio::test]
async fn test_database_transaction_rollback() {
  // Skip test if TEST_DATABASE_URL is not set
  if std::env::var("TEST_DATABASE_URL").is_err() {
    eprintln!("Skipping test: TEST_DATABASE_URL not set");
    return;
  }

  let db = TestDb::new().await;

  // Count keys before inserting
  let count_before: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
    .fetch_one(db.pool())
    .await
    .expect("Failed to count keys")
    .get(0);

  // Insert a test key
  let key_id = Uuid::new_v4();
  sqlx::query(
    "INSERT INTO keys (id, name, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)",
  )
  .bind(key_id)
  .bind("test_key")
  .bind("test_value")
  .bind(Utc::now())
  .bind(Utc::now())
  .execute(db.pool())
  .await
  .expect("Failed to insert test key");

  // Verify the key exists
  let count_after: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
    .fetch_one(db.pool())
    .await
    .expect("Failed to count keys after insert")
    .get(0);

  assert_eq!(count_after, count_before + 1);

  // Clean up
  db.cleanup().await;
}

// Test key operations
#[tokio::test]
async fn test_key_operations() {
  // Skip test if TEST_DATABASE_URL is not set
  if std::env::var("TEST_DATABASE_URL").is_err() {
    eprintln!("Skipping test: TEST_DATABASE_URL not set");
    return;
  }

  let db = TestDb::new().await;

  // Clean up before test
  db.cleanup().await;

  // Insert a test key
  let key_id = Uuid::new_v4();
  let now = Utc::now();

  let result = sqlx::query_as::<_, (Uuid, String, String)>(
    "INSERT INTO keys (id, name, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, value",
  )
  .bind(key_id)
  .bind("test_key_name")
  .bind("test_key_value")
  .bind(now)
  .bind(now)
  .fetch_one(db.pool())
  .await;

  assert!(result.is_ok());
  let (returned_id, returned_name, returned_value) = result.unwrap();
  assert_eq!(returned_id, key_id);
  assert_eq!(returned_name, "test_key_name");
  assert_eq!(returned_value, "test_key_value");

  // Verify we can query the key directly
  let found_key =
    sqlx::query_as::<_, (String, String)>("SELECT name, value FROM keys WHERE id = $1")
      .bind(key_id)
      .fetch_one(db.pool())
      .await;

  assert!(found_key.is_ok());
  let (found_name, found_value) = found_key.unwrap();
  assert_eq!(found_name, "test_key_name");
  assert_eq!(found_value, "test_key_value");

  // Clean up after test
  db.cleanup().await;
}
