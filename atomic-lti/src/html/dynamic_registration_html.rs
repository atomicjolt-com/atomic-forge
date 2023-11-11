use crate::dynamic_registration::platform_configuration::PlatformConfiguration;

pub fn dynamic_registration_init_html(
  platform_config: &PlatformConfiguration,
  registration_finish_path: &str,
  registration_token: &str,
) -> String {
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
      </head>
      <body>
        <h1>Register</h1>
        <form action="{registration_finish_path}" method="post">
          <input type="hidden" name="registration_endpoint" value="{registration_endpoint}" />
          <input type="hidden" name="registration_token" value="{registration_token}" />
          <input type="submit" value="Finish Registration" />
        </form>
      </body>
    </html>
    "#,
    registration_finish_path = registration_finish_path,
    registration_endpoint = platform_config.registration_endpoint,
    registration_token = registration_token,
  )
}

pub fn dynamic_registration_complete_html() -> String {
  r#"
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <style>
          .hidden {{ display: none !important; }}
        </style>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/assets/styles.css" />
      </head>
      <body>
        <h1>Registration complete</h1>
        <script type="text/javascript">
          (window.opener || window.parent).postMessage({subject:"org.imsglobal.lti.close"}, "*");
        </script>
      </body>
    </html>
  "#.to_string()
}
