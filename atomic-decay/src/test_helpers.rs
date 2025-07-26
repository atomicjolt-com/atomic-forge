use sqlx::postgres::PgPool;

pub struct TestDb {
  pool: PgPool,
}

impl TestDb {
  pub async fn new() -> Self {
    let database_url = std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
      "postgres://postgres:password@localhost:5433/atomic_decay_test".to_string()
    });

    let pool = PgPool::connect(&database_url)
      .await
      .expect("Failed to connect to test database");

    sqlx::migrate!("./migrations")
      .run(&pool)
      .await
      .expect("Failed to run migrations");

    Self { pool }
  }

  pub fn pool(&self) -> &PgPool {
    &self.pool
  }

  pub async fn cleanup(&self) {
    // Delete in order respecting foreign key constraints
    let tables = vec![
      "lti_registrations", // Has FK to lti_platforms
      "lti_platforms",
      "keys",
      "oidc_states",
    ];

    for table in tables {
      sqlx::query(&format!("DELETE FROM {table}"))
        .execute(&self.pool)
        .await
        .ok();
    }
  }
}

pub async fn setup_test_db() -> PgPool {
  let db = TestDb::new().await;
  db.cleanup().await;
  db.pool().clone()
}

#[cfg(test)]
pub mod test_data {
  // Pre-generated unencrypted RSA keys for testing (to avoid passphrase prompts)
  pub const TEST_KEY_PEM: &str = "-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyF+MtkSCQDpkHlFTFfx1tBH3bdZtuaflBCpVfAKGLG2A8XPf
Ou7b7l72KmZAEzTyPMp3wL8uBFQGqup7qQrYF0tjgeRLHaYUYQvJPMUMCbQJEgCs
8dHz7ipqL1LqYXiKbG7p5MtEK+vLnLx7bbvnZVkxRdW0gvkWcqx/jU1+fMJhhJSd
E4A3qR+rMjQ7mLvPm/OggNXW2FyVhFjb8xvLLLKb5lW8IcPL3FPIJPVYKXLJYVNa
ohDUd3aBGwvXxTEJIoZ5IQGF2vh1mDnKNq3Mfv9Ko5b5RoFqLEFwsp+2DjdCcG8z
Ys0j5gTBhCNYc4b5cMjUYSPWZCzVOgLUo7+7MwIDAQABAoIBAAaGWdbBOJLDXrk1
m7P7DSN5KPXvQ2SPQF8+VSktp9ZaxLFcjl4qt3qHMtjNLdVAN6tH3J2I1KIbhQ3Y
vJLC8xrsLQrk5IuMtFICx3yRBUD5W4HZBHeDFCtjP1FdfGULnT7NJDKR0tVxwCKy
0cMfpvvx1JQRxb3EoNh7iLTJ8Rx2xFvghiQNL5uetRNPjXLu17j2sfRYMDXMJHlR
ViWkpBB5fMl3FbLWYNm7RFhL5PiNroTb5vnhEUKnD2rCwLPG9BBcsENU3dTqutvD
6upPwi7Sf0/Wo6gLha9SPmnu7cpFSVJrPJzULPQKFXVJp0slqBnYL3oiGGzVCoKE
CpKiYAECgYEA5KkO4sjPZbad37KLxvDJotdjBWJGLNDSLQqMUNb4nQTBReDRjY5Y
n3hSNhoF4d7h/1ivJzZxAtPJFrrcR/YQ2LnoI5qMcx6ITXH2qK9kDBKmctY1h1oj
p9cXbaEswm4EdPYPfN0NrHcXwq9Jm7vTr9hQC6NMKaKy3DaVK3MczMECgYEA4L6i
4v1sHJkccHBPL0N3XDB5L2aLnxDDlZ3p5XjCaZoDEQMdffDCJpHLbY3AW+Fm8o5N
YF3telew4kyQvwmL+FW7z2pDOQPc7pDLgP5nDO2jwC+l9PyQQFmgH3Vxwzz3lm2X
D5Syx0x4cZLm3vTFJ7J9Qx/cLKEy4lPZLDkIubMCgYEAwQMRp7tAGokE4+xDZGn8
hCShDg8gYPUaVByyPs1d0TxVVQ+jeeBs+T0dVPTIvgLRYYWSAHYYV0GVEFP2hqWa
UXKPAdQQwGZV/w8C4NpGV1vYF8KH3Y4p3aT2xAiYuGLixNWh0PT0xJDMJDfVpCPZ
5B9pA5nz9ahKNITwczCKwAECgYBzeqbdoWVC/BfXxVgJBhpZiBS2s7rXdYvCCJcH
HGCpYR+jQNudcE5jBCPTDuI1V0K+hX5oUWnxfp5W+TvYu7VvRid+unvPcpKfK6v1
7HesOIQuPvuA2x8Mlb8Oqj8wPHCmrTcBkeGMSwWbQKJJXcME2nBk7Fb5JpBPJCQI
jF7DOwKBgGUXOi1dqYJvkz1ikD6eTG+AfBQU9bTT2j6xEAGGEhiC8BvzjIcsfR2K
K7TTVRUgQqbG/gYdRO7hG1KMx2fYZEgB1pyj9g5TqfOJ2bOwtnCMCJcd7tHlpGKP
QzQejEAVQb4fPaCkNtwvBs2VWNqGZ4WKMHPrCVKYq2XbVPFnnqRo
-----END RSA PRIVATE KEY-----";

  pub const TEST_KEY_PEM_2: &str = "-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAvOJ2TLQC7sKe2VZL7anIr7H3hcPfUlYQg2rHvdkF1OGn0Zxy
GNH+oZxMvBHMxGTEQVjLFrCKaVnS1JhYVXfpmSJPh3vgE1H3hGTPglGaZQ3lW5C8
HLvHZBLVQZn3nX0iXbPR1oSEJQBGYGGdYWQHU7KfKVCcpCYJSRQJNkBVvK3gAweF
dHkHMjMUa+V0CbPYNJCGR7qOmgm3LnLVgZq6pA7bl3rLVTp6xYHTPD4jnjXBmLLC
oNp+PgN3JFmm0C0OH2qH5V3qQW8Dq2i3HqDaQlMCbKBYEv6QLVCZFT7bTpBBHGbR
3WBJxQzTEi9dBaAxE7YF1LqoufXJ1YxGm8v+1wIDAQABAoIBABnwGCpmcJWW1Ceb
F7F3ocr8TQNHKJQGyXmXuULZZz5T7huFojSYSNfPxHcVuJQbN+YviGdLxPuIoW1Z
COFoFHMQshVNAB2FhbsBNLY3ynLmB3cg1fcvxjx7c5gFFWL+yVMNBSYco+Y1Bkow
s8uDiHEiY3ulQi9qI3LkNxGFZlvJX7mr6RjLG4Y0OYBqHi7bVxqcb5KD7yCfQOrd
s8T8Hg0MnEJNqf+RzF3j+w0aeGkJ7z5I3dRvM5EFDPRF/8F4KFQDwMXrPxt3WmJ5
1BFMANjJnkVEiHWQNEGZ7sSGqP1lR7P7dZRRM5IiQQhP0vzOqQ6LvYkGGnV8KXKD
PwCQOaECgYEA4nzaohPcXZQlRzP7kVZVPR1j+pC6TZNJLNv8lGZE2gBGn5n0ZBMJ
vOAObm38aBKDvQnBR9qVVcO6LqRz1rmVqpFMpV5TP8H/vCqnUlv3qeVXJfPH1/hR
HuD8KPKCpF8kByAlvOJBRQM3C+sGnVoVnRqRsmVr/P7X2YaLb1U6q1cCgYEA1YNz
SCj2oOObFjR6qPQGJPD7vF7OcVYdNnKNB9YGJ+F3pRvE8nmLhpZaYP3Y0Jt7vSp7
D8GhkNPH2v2yNnMM5fNnx9bEb9rqIU3KqbQZ8dKPBHY7TmhfV8HF2joHDBfqYYXy
3dVILvh9VGLgH7NzsEK7bYsIFSZ6rGLdNJDNnDECgYEAoBOK6biFdmQGF0RFQRXO
7YnrCYZGJPH5lmh7f9lLGTzF3WqrQC2xpBVPedipw0h6zGTCVQRPUOLRMVhQEI1K
T/b4kGGKC3SQ6LKm7Hq5gYgCQzuuK6IhK9q8XgWJ4FQgO5bQF3Y2HHlR9yGxWcT9
pDg5XkQRWVQR/6q7nFCh3P0CgYB5pONqZXTTrGJKqZ1P0rRdz9g6oNpOOdHhOFVr
d8Xz5L1v4wwJxAXr62aMZwMnzr7vkreILMO/eZnrcdPCK4MqCYNT0Y7DQCO2MNPJ
h8Xou2F1K8VJdnS+4qz1cOxQVYBNztGYOr1xF6L2cNlLaEL5vF0xEiGPQKkQ9H2y
MQ8x0QKBgQCRCdD0yuEBNaH5LG8jCKr3dc0dYCMOM4UZXFbmFVXZ7KdXjQQEH/Dv
ZFX6LYxQKJ2Yx7ePGGqX7xfkB8nG9Mkt4pBQ7C5N8TjqcVNSJfBKOGTKqH3aFBp2
fX+aXjcpKm8J4cM0d1FMYAFoFH6VWMX/Lq7nT7nCm7JhK5KFxZoSEA==
-----END RSA PRIVATE KEY-----";

  // Pre-encrypted test keys with known passphrase for testing encryption/decryption
  pub const TEST_KEY_PEM_ENCRYPTED: &str = "-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-256-CBC,5A434A0A85B77952FBD5752EF0BFFA6F

XIR6T/6r9kPaG1/xhW0B3vZ1TAR8yOlqH0nN3IDCwKbgQvL+VqBB5RzvJRvjV5I8
yYMxRaPI5fR4EIwpJIkr7TQjsMpCwjGXxQMAaj5EJQCb8qm+sLx3Lmny9EbH0K7t
YbNW+ByqLDIHqCM5pGg0MNkgZpBOSHN7P7V+43oyF8xGqRJPmJq7n8TKT9qLScsl
VH0j1lzj3T3oJ/yw7wLhssEHvG7Y2+RRhYfCOOG9BPdtfKnDEwY3F3xNw5rNSKfJ
mB2s0EW5F7B7vJ6EgVtHfKz0BV5OL8hF9RvIGtT1PoY5pNRKPTXEPQD0jnnJRflR
uw1jVKv8K3+mOXph+DMvZPtDwo7u7Hn7TFK2BXrAhjRMmj3rr8zfH/wuFq2bJNpU
9u7W7cDLFlEOcVhBRfM8e7LqGVsMYQTzTJVBI6VEjQq0NvW7qBCQQGY5eioBPr5o
dG+JKyJ9xpMWT/VwYafVhKEBGyDdLrJn3jLGvxMHhsgM2p0TGp0xRmGZnHV8HqJI
D3nqAWmXe0J2Ou1O9YGgMqF/LcLn7R7tQOEClqgQVs0M+5PNjqeB3yOLYYjCQhCu
8ApyYNEM0LkZ/1YJZdMR3i5vQZWxJhi7Dn6oNh7vUjghL4A7T1xZ/F+0cUFmVJbh
-----END RSA PRIVATE KEY-----";
}
