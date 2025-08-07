use crate::schema::lti_platforms;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = lti_platforms)]
pub struct LtiPlatform {
  pub id: i64,
  pub uuid: String,
  pub issuer: String,
  pub name: Option<String>,
  pub jwks_url: String,
  pub token_url: String,
  pub oidc_url: String,
  pub created_at: NaiveDateTime,
  pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = lti_platforms)]
pub struct NewLtiPlatform<'a> {
  pub issuer: &'a str,
  pub name: Option<&'a str>,
  pub jwks_url: &'a str,
  pub token_url: &'a str,
  pub oidc_url: &'a str,
}

#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = lti_platforms)]
pub struct UpdateLtiPlatform<'a> {
  pub name: Option<&'a str>,
  pub jwks_url: &'a str,
  pub token_url: &'a str,
  pub oidc_url: &'a str,
}

impl LtiPlatform {
  pub fn find_by_issuer(
    conn: &mut PgConnection,
    platform_issuer: &str,
  ) -> Result<Option<Self>, diesel::result::Error> {
    use crate::schema::lti_platforms::dsl::*;

    lti_platforms
      .filter(issuer.eq(platform_issuer))
      .first::<Self>(conn)
      .optional()
  }

  pub fn create(
    conn: &mut PgConnection,
    new_platform: NewLtiPlatform,
  ) -> Result<Self, diesel::result::Error> {
    use crate::schema::lti_platforms::dsl::*;

    diesel::insert_into(lti_platforms)
      .values(&new_platform)
      .get_result::<Self>(conn)
  }

  pub fn update(
    &self,
    conn: &mut PgConnection,
    update_data: UpdateLtiPlatform,
  ) -> Result<Self, diesel::result::Error> {
    use crate::schema::lti_platforms::dsl::*;

    diesel::update(lti_platforms.find(self.id))
      .set(&update_data)
      .get_result::<Self>(conn)
  }

  pub fn delete(&self, conn: &mut PgConnection) -> Result<usize, diesel::result::Error> {
    use crate::schema::lti_platforms::dsl::*;

    diesel::delete(lti_platforms.find(self.id)).execute(conn)
  }

  pub fn list(conn: &mut PgConnection) -> Result<Vec<Self>, diesel::result::Error> {
    use crate::schema::lti_platforms::dsl::*;

    lti_platforms.order(issuer.asc()).load::<Self>(conn)
  }
}