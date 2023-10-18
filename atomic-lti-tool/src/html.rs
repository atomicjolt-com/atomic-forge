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
