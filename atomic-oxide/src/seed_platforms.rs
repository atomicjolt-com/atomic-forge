use crate::db::Pool;
use crate::stores::db_platform_store::DBPlatformStore;
use atomic_lti::stores::platform_store::{PlatformData, PlatformStore};

// Static platform data from atomic-lti/src/platforms.rs
const PLATFORM_DATA: &[(&str, &str, &str, &str)] = &[
  (
    "https://canvas.instructure.com",
    "https://sso.canvaslms.com/api/lti/security/jwks",
    "https://sso.canvaslms.com/login/oauth2/token",
    "https://sso.canvaslms.com/api/lti/authorize_redirect",
  ),
  (
    "https://canvas.beta.instructure.com",
    "https://sso.beta.canvaslms.com/api/lti/security/jwks",
    "https://sso.beta.canvaslms.com/login/oauth2/token",
    "https://sso.beta.canvaslms.com/api/lti/authorize_redirect",
  ),
  (
    "https://schoology.schoology.com",
    "https://lti-service.svc.schoology.com/lti-service/.well-known/jwks",
    "https://lti-service.svc.schoology.com/lti-service/access-token",
    "https://lti-service.svc.schoology.com/lti-service/authorize-redirect",
  ),
  (
    "https://ltiadvantagevalidator.imsglobal.org",
    "https://oauth2server.imsglobal.org/jwks",
    "https://ltiadvantagevalidator.imsglobal.org/ltitool/authcodejwt.html",
    "https://ltiadvantagevalidator.imsglobal.org/ltitool/oidcauthurl.html",
  ),
  (
    "https://build.1edtech.org",
    "https://build.1edtech.org/jwks",
    "https://build.1edtech.org/auth",
    "https://build.1edtech.org/oidc",
  ),
  (
    "https://lms.example.com",
    "https://lms.example.com/jwks",
    "https://lms.example.com/auth",
    "https://lms.example.com/oidc",
  ),
];

pub async fn seed_platforms(pool: &Pool) -> Result<(), Box<dyn std::error::Error>> {
  let store = DBPlatformStore::new(pool.clone());

  for &(issuer, jwks_url, token_url, oidc_url) in PLATFORM_DATA {
    // Check if platform already exists
    if let Ok(Some(_)) = store.find_by_iss(issuer).await {
      println!("Platform {} already exists, skipping", issuer);
      continue;
    }

    let platform = PlatformData {
      issuer: issuer.to_string(),
      name: Some(format!("{} Platform", get_platform_name(issuer))),
      jwks_url: jwks_url.to_string(),
      token_url: token_url.to_string(),
      oidc_url: oidc_url.to_string(),
    };

    match store.create(platform).await {
      Ok(_) => println!("Created platform: {}", issuer),
      Err(e) => eprintln!("Failed to create platform {}: {}", issuer, e),
    }
  }

  Ok(())
}

fn get_platform_name(issuer: &str) -> &str {
  match issuer {
    "https://canvas.instructure.com" => "Canvas",
    "https://canvas.beta.instructure.com" => "Canvas Beta",
    "https://schoology.schoology.com" => "Schoology",
    "https://ltiadvantagevalidator.imsglobal.org" => "IMS Global Validator",
    "https://build.1edtech.org" => "1EdTech",
    "https://lms.example.com" => "Example LMS",
    _ => "Unknown",
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::db_test_helpers::setup_test_db;

  #[actix_rt::test]
  async fn test_seed_platforms() {
    let pool = setup_test_db();

    // Seed platforms
    seed_platforms(&pool).await.unwrap();

    // Verify all platforms were created
    let store = DBPlatformStore::new(pool.clone());
    let platforms = store.list().await.unwrap();

    assert_eq!(platforms.len(), PLATFORM_DATA.len());

    // Verify specific platform data
    let canvas = store
      .find_by_iss("https://canvas.instructure.com")
      .await
      .unwrap()
      .unwrap();
    assert_eq!(canvas.name, Some("Canvas Platform".to_string()));
    assert_eq!(
      canvas.jwks_url,
      "https://sso.canvaslms.com/api/lti/security/jwks"
    );

    // Test idempotency - running seed again should not error
    seed_platforms(&pool).await.unwrap();

    // Verify count hasn't changed
    let platforms_after = store.list().await.unwrap();
    assert_eq!(platforms_after.len(), PLATFORM_DATA.len());
  }
}