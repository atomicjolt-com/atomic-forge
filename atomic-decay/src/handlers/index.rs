use axum::{response::{Html, IntoResponse}, Json};
use crate::extractors::host_info::HostInfo;
use std::collections::HashMap;

pub async fn index(host_info: HostInfo) -> impl IntoResponse {
  let base_url = host_info.base_url();
  let registration_url = format!("{}/lti/register", base_url);

  let html = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atomic Decay - LTI Tool</title>
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #000;
    }}

    header {{
      padding: 1.5rem 2rem;
      background: #000;
      color: white;
      text-align: center;
    }}

    .hero {{
      background: rgb(255, 221, 0);
      color: #000;
      padding: 4rem 2rem;
      text-align: center;
    }}

    .hero h1 {{
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }}

    .hero p {{
      font-size: 1.25rem;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }}

    .hero-button {{
      display: inline-block;
      background: #000;
      color: white;
      padding: 0.75rem 2rem;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }}

    .hero-button:hover {{
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }}

    .features {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 4rem auto;
      padding: 2rem;
    }}

    .feature-card {{
      background: #1a1a1a;
      color: white;
      padding: 2rem;
      border-radius: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }}

    .feature-card:hover {{
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(255, 221, 0, 0.2);
    }}

    .feature-card h3 {{
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: rgb(255, 221, 0);
    }}

    .feature-card p {{
      color: #ccc;
    }}

    .registration {{
      max-width: 800px;
      margin: 4rem auto;
      padding: 2rem;
      background: #1a1a1a;
      border-radius: 8px;
      color: white;
    }}

    .registration h2 {{
      color: rgb(255, 221, 0);
      margin-bottom: 1rem;
      font-size: 2rem;
    }}

    .registration p {{
      color: #ccc;
      margin-bottom: 1.5rem;
    }}

    .url-box {{
      background: #000;
      padding: 1rem;
      border-radius: 5px;
      border: 2px solid rgb(255, 221, 0);
      font-family: monospace;
      word-break: break-all;
      color: rgb(255, 221, 0);
      margin-bottom: 1rem;
    }}

    .copy-button {{
      background: rgb(255, 221, 0);
      color: #000;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 5px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 1rem;
    }}

    .copy-button:hover {{
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 221, 0, 0.3);
    }}

    .copy-button:active {{
      transform: translateY(0);
    }}

    .copy-button.copied {{
      background: #4CAF50;
      color: white;
    }}

    footer {{
      background: #000;
      color: white;
      text-align: center;
      padding: 2rem;
      margin-top: 4rem;
    }}

    footer p {{
      color: #888;
    }}

    @media (max-width: 768px) {{
      .hero h1 {{
        font-size: 2rem;
      }}

      .hero p {{
        font-size: 1rem;
      }}

      .features {{
        grid-template-columns: 1fr;
        padding: 1rem;
      }}
    }}
  </style>
</head>
<body>
  <header>
    <h2>Atomic Jolt</h2>
  </header>

  <section class="hero">
    <h1>Atomic Decay LTI Tool</h1>
    <p>A high-performance LTI 1.3 Tool built with Rust and Axum. Fast, reliable, and ready for production.</p>
    <a href="https://github.com/atomicjolt/atomic-forge" class="hero-button">View on GitHub</a>
  </section>

  <section class="features">
    <div class="feature-card">
      <h3>Open Source</h3>
      <p>Built in the open with contributions from the community. Free to use, modify, and distribute.</p>
    </div>

    <div class="feature-card">
      <h3>Modern Stack</h3>
      <p>Written in Rust using Axum for maximum performance and reliability. Memory-safe and lightning fast.</p>
    </div>

    <div class="feature-card">
      <h3>LTI 1.3</h3>
      <p>Full support for LTI 1.3 specification including OIDC launch, dynamic registration, and deep linking.</p>
    </div>
  </section>

  <section class="registration">
    <h2>Dynamic Registration</h2>
    <p>Use this URL to dynamically register this LTI tool with your LMS platform:</p>
    <div class="url-box" id="registration-url">{}</div>
    <button class="copy-button" onclick="copyToClipboard()">Copy URL</button>
  </section>

  <footer>
    <p>Created by Atomic Jolt</p>
  </footer>

  <script>
    function copyToClipboard() {{
      const urlText = document.getElementById('registration-url').textContent;
      const button = event.target;

      navigator.clipboard.writeText(urlText).then(function() {{
        button.textContent = 'Copied!';
        button.classList.add('copied');

        setTimeout(function() {{
          button.textContent = 'Copy URL';
          button.classList.remove('copied');
        }}, 2000);
      }}).catch(function(err) {{
        console.error('Failed to copy: ', err);
        button.textContent = 'Failed to copy';
        setTimeout(function() {{
          button.textContent = 'Copy URL';
        }}, 2000);
      }});
    }}
  </script>
</body>
</html>"#, registration_url);

  Html(html)
}

pub async fn up() -> impl IntoResponse {
  let mut result = HashMap::new();
  result.insert(String::from("up"), true);
  Json(result)
}
