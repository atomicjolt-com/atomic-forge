#[cfg(test)]
mod tests {
  use crate::tests::helpers::tests::assert_get;

  #[actix_web::test]
  async fn test_health() {
    assert_get("/up").await;
  }
}
