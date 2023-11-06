use jsonwebtoken::Algorithm;

pub const OPEN_ID_COOKIE_PREFIX: &str = "open_id_";
pub const OPEN_ID_STORAGE_COOKIE: &str = "open_id_storage";
pub const STATE_KEY_PREFIX: &str = "aj_lti";
pub const MAIN_CONTENT_ID: &str = "main-content";

pub const ALGORITHM: Algorithm = Algorithm::RS256;
