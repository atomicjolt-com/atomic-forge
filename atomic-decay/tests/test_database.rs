use atomic_decay::test_helpers::*;
use atomic_decay::models::key::Key;
use chrono::Utc;
use sqlx::Row;
use uuid::Uuid;

// Example test using manual transaction management
#[tokio::test]
async fn test_database_transaction_rollback() {
    let db = TestDb::new().await
        .expect("Failed to create test database");

    // Count keys before transaction
    let count_before: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
        .fetch_one(db.pool())
        .await
        .expect("Failed to count keys")
        .get(0);

    // Start a transaction that will be rolled back
    {
        let mut txn = db.begin_test_transaction().await;
        
        // Insert a test key
        let key_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO keys (id, name, value, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(key_id)
        .bind("test_key")
        .bind("test_value")
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(txn.conn())
        .await
        .expect("Failed to insert test key");

        // Verify the key exists in the transaction
        let count_in_txn: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
            .fetch_one(txn.conn())
            .await
            .expect("Failed to count keys in transaction")
            .get(0);
        
        assert_eq!(count_in_txn, count_before + 1);
        
        // Transaction will be rolled back when txn is dropped
    }

    // Verify the key was rolled back
    let count_after: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
        .fetch_one(db.pool())
        .await
        .expect("Failed to count keys after rollback")
        .get(0);
    
    assert_eq!(count_after, count_before);
}

// Example test using the test_with_db macro
test_with_db!(test_key_operations, |txn| {
    // Insert a test key
    let key_id = Uuid::new_v4();
    let now = Utc::now();
    
    sqlx::query(
        "INSERT INTO keys (id, name, value, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(key_id)
    .bind("test_key")
    .bind("test_value")
    .bind(now)
    .bind(now)
    .execute(txn.conn())
    .await
    .expect("Failed to insert test key");

    // Query the key back
    let key = sqlx::query_as::<_, Key>("SELECT * FROM keys WHERE id = $1")
        .bind(key_id)
        .fetch_one(txn.conn())
        .await
        .expect("Failed to fetch key");

    assert_eq!(key.name, "test_key");
    assert_eq!(key.value, "test_value");
    
    // All changes will be rolled back when the test ends
});

// Example test demonstrating clean database helper
#[tokio::test]
async fn test_clean_database() {
    let db = TestDb::new().await
        .expect("Failed to create test database");

    // Insert some test data
    let key_id = Uuid::new_v4();
    let now = Utc::now();
    
    sqlx::query(
        "INSERT INTO keys (id, name, value, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(key_id)
    .bind("test_key_to_clean")
    .bind("test_value")
    .bind(now)
    .bind(now)
    .execute(db.pool())
    .await
    .expect("Failed to insert test key");

    // Verify data exists
    let count_before: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
        .fetch_one(db.pool())
        .await
        .expect("Failed to count keys")
        .get(0);
    
    assert!(count_before > 0);

    // Clean the database
    db.clean_database().await
        .expect("Failed to clean database");

    // Verify data was cleaned
    let count_after: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
        .fetch_one(db.pool())
        .await
        .expect("Failed to count keys after cleaning")
        .get(0);
    
    assert_eq!(count_after, 0);
}