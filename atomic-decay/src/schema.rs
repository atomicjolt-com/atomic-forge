// @generated automatically by Diesel CLI.

diesel::table! {
    keys (id) {
        id -> Int8,
        uuid -> Varchar,
        key -> Text,
        updated_at -> Timestamp,
        created_at -> Timestamp,
    }
}

diesel::table! {
    oidc_states (id) {
        id -> Int8,
        state -> Varchar,
        nonce -> Varchar,
        created_at -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    keys,
    oidc_states,
);
