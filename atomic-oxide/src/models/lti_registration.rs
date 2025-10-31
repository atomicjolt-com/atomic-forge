use crate::schema::lti_registrations;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = lti_registrations)]
pub struct LtiRegistration {
  pub id: i64,
  pub uuid: String,
  pub platform_id: i64,
  pub client_id: String,
  pub deployment_id: Option<String>,
  pub registration_config: JsonValue,
  pub registration_token: Option<String>,
  pub status: String,
  pub supported_placements: Option<JsonValue>,
  pub supported_message_types: Option<JsonValue>,
  pub capabilities: Option<JsonValue>,
  pub created_at: NaiveDateTime,
  pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = lti_registrations)]
pub struct NewLtiRegistration<'a> {
  pub platform_id: i64,
  pub client_id: &'a str,
  pub deployment_id: Option<&'a str>,
  pub registration_config: &'a JsonValue,
  pub registration_token: Option<&'a str>,
  pub status: &'a str,
  pub supported_placements: Option<&'a JsonValue>,
  pub supported_message_types: Option<&'a JsonValue>,
  pub capabilities: Option<&'a JsonValue>,
}

#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = lti_registrations)]
pub struct UpdateLtiRegistration<'a> {
  pub status: Option<&'a str>,
  pub capabilities: Option<&'a JsonValue>,
}

impl LtiRegistration {
  /// Find registration by client_id
  pub fn find_by_client_id(
    conn: &mut PgConnection,
    client: &str,
  ) -> Result<Option<Self>, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    lti_registrations
      .filter(client_id.eq(client))
      .first::<Self>(conn)
      .optional()
  }

  /// Find registration by platform_id and client_id
  pub fn find_by_platform_and_client(
    conn: &mut PgConnection,
    plat_id: i64,
    client: &str,
  ) -> Result<Option<Self>, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    lti_registrations
      .filter(platform_id.eq(plat_id))
      .filter(client_id.eq(client))
      .first::<Self>(conn)
      .optional()
  }

  /// Create a new registration
  pub fn create(
    conn: &mut PgConnection,
    new_registration: NewLtiRegistration,
  ) -> Result<Self, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    diesel::insert_into(lti_registrations)
      .values(&new_registration)
      .get_result::<Self>(conn)
  }

  /// Update registration status
  pub fn update_status(
    &self,
    conn: &mut PgConnection,
    new_status: &str,
  ) -> Result<Self, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    diesel::update(lti_registrations.find(self.id))
      .set(status.eq(new_status))
      .get_result::<Self>(conn)
  }

  /// Update registration capabilities
  pub fn update_capabilities(
    &self,
    conn: &mut PgConnection,
    new_capabilities: &JsonValue,
  ) -> Result<Self, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    diesel::update(lti_registrations.find(self.id))
      .set(capabilities.eq(new_capabilities))
      .get_result::<Self>(conn)
  }

  /// Delete registration
  pub fn delete(&self, conn: &mut PgConnection) -> Result<usize, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    diesel::delete(lti_registrations.find(self.id)).execute(conn)
  }

  /// List all registrations
  pub fn list(conn: &mut PgConnection) -> Result<Vec<Self>, diesel::result::Error> {
    use crate::schema::lti_registrations::dsl::*;

    lti_registrations.order(created_at.desc()).load::<Self>(conn)
  }

  /// Check if this registration supports a specific placement
  pub fn supports_placement(&self, placement: &str) -> bool {
    if let Some(ref placements) = self.supported_placements {
      if let Some(array) = placements.as_array() {
        return array.iter().any(|p| p.as_str() == Some(placement));
      }
    }
    false
  }

  /// Check if this registration supports a specific message type
  pub fn supports_message_type(&self, msg_type: &str) -> bool {
    if let Some(ref message_types) = self.supported_message_types {
      if let Some(array) = message_types.as_array() {
        return array.iter().any(|m| m.as_str() == Some(msg_type));
      }
    }
    false
  }

  /// Get a specific capability value
  pub fn get_capability(&self, key: &str) -> Option<JsonValue> {
    self.capabilities.as_ref()?.get(key).cloned()
  }
}
