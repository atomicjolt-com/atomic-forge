use atomic_decay::models::key::Key;
use atomic_decay::stores::db_key_store::{ensure_keys, DBKeyStore};
use atomic_decay::test_helpers::setup_test_db;
use atomic_lti::secure::generate_rsa_key_pair;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti_test::helpers::JWK_PASSPHRASE;

#[tokio::test]
async fn test_db_key_store_get_current_keys() {
  let pool = setup_test_db().await;

  // Create test keys
  let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
  let key1 = Key::create(&pool, &pem_string1).await.unwrap();

  let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
  let key2 = Key::create(&pool, &pem_string2).await.unwrap();

  // Test KeyStore
  let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
  let keys = key_store
    .get_current_keys(2)
    .await
    .expect("Failed to get current keys");
  assert_eq!(keys.len(), 2);
  assert!(keys.contains_key(&key1.uuid));
  assert!(keys.contains_key(&key2.uuid));

  // Clean up
  Key::destroy(&pool, key1.id).await.unwrap();
  Key::destroy(&pool, key2.id).await.unwrap();
}

#[tokio::test]
async fn test_db_key_store_get_current_key() {
  let pool = setup_test_db().await;

  // Create a test key
  let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
  let key = Key::create(&pool, &pem_string).await.unwrap();

  // Test KeyStore
  let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
  let (kid, rsa_key) = key_store
    .get_current_key()
    .await
    .expect("Failed to get current key");
  assert_eq!(kid, key.uuid);
  assert!(!rsa_key.n().to_vec().is_empty());

  // Clean up
  Key::destroy(&pool, key.id).await.unwrap();
}

#[tokio::test]
async fn test_db_key_store_get_key_by_id() {
  let pool = setup_test_db().await;

  // Create a test key
  let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
  let key = Key::create(&pool, &pem_string).await.unwrap();

  // Test getting key by valid ID
  let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
  let rsa_key = key_store
    .get_key(&key.uuid)
    .await
    .expect("Failed to get key by ID");
  assert!(!rsa_key.n().to_vec().is_empty());

  // Test getting key by invalid ID
  let result = key_store.get_key("invalid-uuid").await;
  assert!(result.is_err());

  // Clean up
  Key::destroy(&pool, key.id).await.unwrap();
}

#[tokio::test]
async fn test_db_key_store_empty_database() {
  let pool = setup_test_db().await;

  // Test with empty database
  let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
  let result = key_store.get_current_keys(2).await;
  assert!(result.is_err());
}

#[tokio::test]
async fn test_ensure_keys() {
  let pool = setup_test_db().await;

  // First call should create a key
  let result = ensure_keys(&pool, JWK_PASSPHRASE).await.unwrap();
  assert!(result.is_some());
  let created_key = result.unwrap();

  // Verify the key was created
  let keys = Key::list(&pool, 1).await.unwrap();
  assert_eq!(keys.len(), 1);
  assert_eq!(keys[0].id, created_key.id);

  // Second call should not create another key
  let result2 = ensure_keys(&pool, JWK_PASSPHRASE).await.unwrap();
  assert!(result2.is_none());

  // Verify still only one key
  let keys = Key::list(&pool, 10).await.unwrap();
  assert_eq!(keys.len(), 1);

  // Clean up
  Key::destroy(&pool, created_key.id).await.unwrap();
}

#[tokio::test]
async fn test_wrong_passphrase() {
  let pool = setup_test_db().await;

  // Create a key with the correct passphrase
  let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
  let key = Key::create(&pool, &pem_string).await.unwrap();

  // Try to decrypt with wrong passphrase
  let key_store = DBKeyStore::new(&pool, "wrong_passphrase");
  let result = key_store.get_current_keys(1).await;
  assert!(result.is_err());

  // Clean up
  Key::destroy(&pool, key.id).await.unwrap();
}
