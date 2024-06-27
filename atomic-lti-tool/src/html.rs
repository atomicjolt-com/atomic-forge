use atomic_lti::dynamic_registration::platform_configuration::PlatformConfiguration;

pub fn build_html(head: &str, body: &str) -> String {
  format!(
    r#"
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <style>
          .hidden {{ display: none !important; }}
        </style>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/assets/styles.css" />
        {head}
      </head>
      <body>
        <noscript>
          <div class="u-flex">
            <i class="material-icons-outlined aj-icon" aria-hidden="true">warning</i>
            <p class="aj-text">
              You must have javascript enabled to use this application.
            </p>
          </div>
        </noscript>
        {body}
      </body>
    </html>
    "#,
    head = head,
    body = body,
  )
}

pub fn dynamic_registration_init_html(
  platform_config: &PlatformConfiguration,
  registration_finish_path: &str,
  registration_token: &str,
) -> String {
  let head = "";
  let body = format!(
    r#"
      <h1>Register</h1>
      <form action="{registration_finish_path}" method="post">
        <input type="hidden" name="registration_endpoint" value="{registration_endpoint}" />
        <input type="hidden" name="registration_token" value="{registration_token}" />
        <input type="hidden" name="product_family_code" value="{product_family_code}" />
        <input type="submit" value="Finish Registration" />
      </form>
    "#,
    registration_finish_path = registration_finish_path,
    registration_endpoint = platform_config.registration_endpoint,
    registration_token = registration_token,
    product_family_code = platform_config
      .lti_platform_configuration
      .product_family_code,
  );
  build_html(head, &body)
}

pub fn dynamic_registration_complete_html() -> String {
  let head = "";
  let body = r#"
      <h1>Registration complete</h1>
      <script type="text/javascript">
        (window.opener || window.parent).postMessage({subject:"org.imsglobal.lti.close"}, "*");
      </script>
  "#
  .to_string();
  build_html(head, &body)
}
