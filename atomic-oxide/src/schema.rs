// @generated automatically by Diesel CLI.

diesel::table! {
    _sqlx_migrations (version) {
        version -> Int8,
        description -> Text,
        installed_on -> Timestamptz,
        success -> Bool,
        checksum -> Bytea,
        execution_time -> Int8,
    }
}

diesel::table! {
    api_keys (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        name -> Varchar,
        #[max_length = 255]
        key_hash -> Varchar,
        #[max_length = 10]
        key_prefix -> Varchar,
        scopes -> Array<Nullable<Text>>,
        expires_at -> Nullable<Timestamptz>,
        last_used_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    auth_audit_log (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        #[max_length = 50]
        event_type -> Varchar,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        created_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    dynamic_registration_sessions (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        #[max_length = 255]
        registration_uuid -> Varchar,
        #[max_length = 255]
        registration_token -> Nullable<Varchar>,
        #[max_length = 500]
        tool_url -> Varchar,
        platform_configuration -> Jsonb,
        tool_configuration -> Nullable<Jsonb>,
        #[max_length = 50]
        status -> Varchar,
        initiated_by -> Nullable<Uuid>,
        completed_at -> Nullable<Timestamptz>,
        error_message -> Nullable<Text>,
        created_at -> Nullable<Timestamptz>,
        expires_at -> Timestamptz,
    }
}

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
    lti_launch_sessions (id) {
        id -> Uuid,
        deployment_id -> Uuid,
        user_id -> Nullable<Uuid>,
        #[max_length = 255]
        resource_link_id -> Varchar,
        #[max_length = 255]
        context_id -> Nullable<Varchar>,
        roles -> Array<Nullable<Text>>,
        custom_parameters -> Nullable<Jsonb>,
        launch_data -> Jsonb,
        created_at -> Timestamptz,
        expires_at -> Timestamptz,
    }
}

diesel::table! {
    lti_launch_states (id) {
        id -> Uuid,
        state -> Text,
        nonce -> Text,
        client_id -> Text,
        redirect_uri -> Text,
        login_hint -> Text,
        lti_message_hint -> Nullable<Text>,
        created_at -> Timestamptz,
        expires_at -> Timestamptz,
    }
}

diesel::table! {
    lti_nonces (nonce) {
        #[max_length = 255]
        nonce -> Varchar,
        expires_at -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    lti_platform_config (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        platform_id -> Text,
        platform_name -> Text,
        platform_guid -> Nullable<Uuid>,
        platform_version -> Nullable<Text>,
        product_family_code -> Nullable<Text>,
        current_key_id -> Nullable<Text>,
        key_rotation_schedule_days -> Nullable<Int4>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    lti_platform_keys (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        kid -> Text,
        private_key_encrypted -> Text,
        public_key -> Text,
        algorithm -> Nullable<Text>,
        key_size -> Nullable<Int4>,
        active -> Nullable<Bool>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        expires_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    lti_platforms (id) {
        id -> Int8,
        uuid -> Varchar,
        issuer -> Text,
        name -> Nullable<Text>,
        jwks_url -> Text,
        token_url -> Text,
        oidc_url -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    lti_resource_links (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        deployment_id -> Uuid,
        resource_link_id -> Text,
        title -> Nullable<Text>,
        description -> Nullable<Text>,
        context_id -> Nullable<Uuid>,
        context_type -> Nullable<Text>,
        custom_parameters -> Nullable<Jsonb>,
        resource_link_id_history -> Nullable<Array<Nullable<Text>>>,
        context_id_history -> Nullable<Array<Nullable<Text>>>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    lti_tool_deployments (id) {
        id -> Uuid,
        tool_registration_id -> Uuid,
        deployment_id -> Text,
        context_type -> Text,
        context_id -> Nullable<Uuid>,
        allowed_domains -> Nullable<Array<Nullable<Text>>>,
        active -> Nullable<Bool>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    lti_tool_registrations (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        client_id -> Text,
        client_secret_encrypted -> Nullable<Text>,
        tool_name -> Text,
        tool_description -> Nullable<Text>,
        tool_domain -> Text,
        logo_uri -> Nullable<Text>,
        initiate_login_uri -> Text,
        redirect_uris -> Array<Nullable<Text>>,
        jwks_uri -> Text,
        token_endpoint_auth_method -> Nullable<Text>,
        target_link_uri -> Text,
        custom_parameters -> Nullable<Jsonb>,
        claims -> Nullable<Array<Nullable<Text>>>,
        messages -> Nullable<Jsonb>,
        registered_at -> Timestamptz,
        registered_by -> Nullable<Uuid>,
        registration_method -> Nullable<Text>,
        active -> Nullable<Bool>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
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

diesel::table! {
    password_history (id) {
        id -> Uuid,
        user_id -> Uuid,
        password_hash -> Text,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    permissions (id) {
        id -> Uuid,
        #[max_length = 100]
        name -> Varchar,
        #[max_length = 50]
        resource -> Varchar,
        #[max_length = 50]
        action -> Varchar,
        description -> Nullable<Text>,
        created_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    role_permissions (role_id, permission_id) {
        role_id -> Uuid,
        permission_id -> Uuid,
    }
}

diesel::table! {
    roles (id) {
        id -> Uuid,
        #[max_length = 50]
        name -> Varchar,
        description -> Nullable<Text>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    sessions (id) {
        id -> Text,
        session_data -> Bytea,
        expiry_date -> Timestamptz,
        tenant_id -> Nullable<Uuid>,
        session -> Nullable<Jsonb>,
        expires_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    tenant_domains (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        #[max_length = 255]
        domain -> Varchar,
        is_primary -> Nullable<Bool>,
        is_verified -> Nullable<Bool>,
        #[max_length = 255]
        verification_token -> Nullable<Varchar>,
        verified_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    tenant_invitations (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        #[max_length = 255]
        email -> Varchar,
        #[max_length = 50]
        role -> Nullable<Varchar>,
        #[max_length = 255]
        token -> Varchar,
        expires_at -> Timestamptz,
        accepted_at -> Nullable<Timestamptz>,
        created_by -> Nullable<Uuid>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    tenant_settings (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        allow_self_registration -> Nullable<Bool>,
        require_email_verification -> Nullable<Bool>,
        allowed_email_domains -> Nullable<Array<Nullable<Text>>>,
        password_min_length -> Nullable<Int4>,
        password_require_uppercase -> Nullable<Bool>,
        password_require_lowercase -> Nullable<Bool>,
        password_require_digit -> Nullable<Bool>,
        password_require_special -> Nullable<Bool>,
        check_password_breach -> Nullable<Bool>,
        mfa_required -> Nullable<Bool>,
        session_timeout_minutes -> Nullable<Int4>,
        max_login_attempts -> Nullable<Int4>,
        lockout_duration_minutes -> Nullable<Int4>,
        enable_sso -> Nullable<Bool>,
        enable_api_access -> Nullable<Bool>,
        enable_webhooks -> Nullable<Bool>,
        lti_enabled -> Nullable<Bool>,
        lti_platform_id -> Nullable<Text>,
        lti_client_id -> Nullable<Text>,
        lti_deployment_id -> Nullable<Text>,
        custom_config -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    tenant_theme_history (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        theme_id -> Nullable<Uuid>,
        theme_snapshot -> Jsonb,
        changed_by -> Uuid,
        change_description -> Nullable<Text>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    tenant_themes (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        is_active -> Bool,
        colors -> Jsonb,
        typography -> Jsonb,
        spacing -> Jsonb,
        borders -> Jsonb,
        shadows -> Jsonb,
        components -> Jsonb,
        custom_css -> Nullable<Text>,
        logo_url -> Nullable<Text>,
        logo_dark_url -> Nullable<Text>,
        favicon_url -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        created_by -> Nullable<Uuid>,
        updated_by -> Nullable<Uuid>,
    }
}

diesel::table! {
    tenants (id) {
        id -> Uuid,
        #[max_length = 50]
        slug -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        display_name -> Nullable<Varchar>,
        #[max_length = 255]
        domain -> Nullable<Varchar>,
        is_active -> Bool,
        is_deleted -> Bool,
        #[max_length = 50]
        plan_type -> Nullable<Varchar>,
        max_users -> Nullable<Int4>,
        max_storage_gb -> Nullable<Int4>,
        logo_url -> Nullable<Text>,
        #[max_length = 7]
        primary_color -> Nullable<Varchar>,
        #[max_length = 7]
        secondary_color -> Nullable<Varchar>,
        #[max_length = 255]
        admin_email -> Nullable<Varchar>,
        #[max_length = 255]
        billing_email -> Nullable<Varchar>,
        #[max_length = 255]
        support_email -> Nullable<Varchar>,
        settings -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    theme_presets (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        thumbnail_url -> Nullable<Text>,
        is_public -> Nullable<Bool>,
        theme_config -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_permissions (user_id, permission_id) {
        user_id -> Uuid,
        permission_id -> Uuid,
        granted_at -> Nullable<Timestamptz>,
        granted_by -> Nullable<Uuid>,
    }
}

diesel::table! {
    user_roles (user_id, role_id) {
        user_id -> Uuid,
        role_id -> Uuid,
        granted_at -> Nullable<Timestamptz>,
        granted_by -> Nullable<Uuid>,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        tenant_id -> Uuid,
        #[max_length = 255]
        email -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        password_hash -> Varchar,
        #[max_length = 50]
        role -> Nullable<Varchar>,
        is_active -> Nullable<Bool>,
        #[max_length = 255]
        external_id -> Nullable<Varchar>,
        #[max_length = 255]
        external_provider -> Nullable<Varchar>,
        email_verified -> Nullable<Bool>,
        #[max_length = 255]
        email_verification_token -> Nullable<Varchar>,
        email_verification_expires_at -> Nullable<Timestamptz>,
        #[max_length = 255]
        password_reset_token -> Nullable<Varchar>,
        password_reset_expires_at -> Nullable<Timestamptz>,
        mfa_enabled -> Nullable<Bool>,
        #[max_length = 255]
        mfa_secret -> Nullable<Varchar>,
        mfa_backup_codes -> Nullable<Jsonb>,
        failed_login_attempts -> Nullable<Int4>,
        locked_until -> Nullable<Timestamptz>,
        last_login_at -> Nullable<Timestamptz>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::joinable!(api_keys -> users (user_id));
diesel::joinable!(auth_audit_log -> users (user_id));
diesel::joinable!(dynamic_registration_sessions -> tenants (tenant_id));
diesel::joinable!(dynamic_registration_sessions -> users (initiated_by));
diesel::joinable!(lti_launch_sessions -> lti_tool_deployments (deployment_id));
diesel::joinable!(lti_launch_sessions -> users (user_id));
diesel::joinable!(lti_platform_config -> tenants (tenant_id));
diesel::joinable!(lti_platform_keys -> tenants (tenant_id));
diesel::joinable!(lti_resource_links -> lti_tool_deployments (deployment_id));
diesel::joinable!(lti_resource_links -> tenants (tenant_id));
diesel::joinable!(lti_tool_deployments -> lti_tool_registrations (tool_registration_id));
diesel::joinable!(lti_tool_registrations -> tenants (tenant_id));
diesel::joinable!(lti_tool_registrations -> users (registered_by));
diesel::joinable!(password_history -> users (user_id));
diesel::joinable!(role_permissions -> permissions (permission_id));
diesel::joinable!(role_permissions -> roles (role_id));
diesel::joinable!(sessions -> tenants (tenant_id));
diesel::joinable!(tenant_domains -> tenants (tenant_id));
diesel::joinable!(tenant_invitations -> tenants (tenant_id));
diesel::joinable!(tenant_invitations -> users (created_by));
diesel::joinable!(tenant_settings -> tenants (tenant_id));
diesel::joinable!(tenant_theme_history -> tenant_themes (theme_id));
diesel::joinable!(tenant_theme_history -> tenants (tenant_id));
diesel::joinable!(tenant_theme_history -> users (changed_by));
diesel::joinable!(tenant_themes -> tenants (tenant_id));
diesel::joinable!(user_permissions -> permissions (permission_id));
diesel::joinable!(user_roles -> roles (role_id));
diesel::joinable!(users -> tenants (tenant_id));

diesel::allow_tables_to_appear_in_same_query!(
    _sqlx_migrations,
    api_keys,
    auth_audit_log,
    dynamic_registration_sessions,
    keys,
    lti_launch_sessions,
    lti_launch_states,
    lti_nonces,
    lti_platform_config,
    lti_platform_keys,
    lti_platforms,
    lti_resource_links,
    lti_tool_deployments,
    lti_tool_registrations,
    oidc_states,
    password_history,
    permissions,
    role_permissions,
    roles,
    sessions,
    tenant_domains,
    tenant_invitations,
    tenant_settings,
    tenant_theme_history,
    tenant_themes,
    tenants,
    theme_presets,
    user_permissions,
    user_roles,
    users,
);
