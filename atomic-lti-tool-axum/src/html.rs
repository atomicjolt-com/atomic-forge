use std::collections::HashMap;

pub struct HtmlBuilder {
    content: String,
    title: String,
    styles: Vec<String>,
    scripts: Vec<String>,
    meta_tags: Vec<String>,
}

impl HtmlBuilder {
    pub fn new(title: &str) -> Self {
        Self {
            content: String::new(),
            title: title.to_string(),
            styles: Vec::new(),
            scripts: Vec::new(),
            meta_tags: Vec::new(),
        }
    }

    pub fn add_style(&mut self, style: &str) -> &mut Self {
        self.styles.push(style.to_string());
        self
    }

    pub fn add_script(&mut self, script: &str) -> &mut Self {
        self.scripts.push(script.to_string());
        self
    }

    pub fn add_meta(&mut self, name: &str, content: &str) -> &mut Self {
        self.meta_tags.push(format!(r#"<meta name="{}" content="{}">"#, 
            htmlescape::encode_attribute(name), 
            htmlescape::encode_attribute(content)
        ));
        self
    }

    pub fn add_meta_http_equiv(&mut self, http_equiv: &str, content: &str) -> &mut Self {
        self.meta_tags.push(format!(r#"<meta http-equiv="{}" content="{}">"#, 
            htmlescape::encode_attribute(http_equiv), 
            htmlescape::encode_attribute(content)
        ));
        self
    }

    pub fn add_viewport(&mut self) -> &mut Self {
        self.add_meta("viewport", "width=device-width, initial-scale=1.0")
    }

    pub fn set_content(&mut self, content: &str) -> &mut Self {
        self.content = content.to_string();
        self
    }

    pub fn append_content(&mut self, content: &str) -> &mut Self {
        self.content.push_str(content);
        self
    }

    pub fn build(self) -> String {
        let mut html = String::new();
        
        html.push_str("<!DOCTYPE html>\n");
        html.push_str("<html lang=\"en\">\n");
        html.push_str("<head>\n");
        html.push_str(&format!("    <title>{}</title>\n", htmlescape::encode_minimal(&self.title)));
        
        // Add meta tags
        for meta in &self.meta_tags {
            html.push_str(&format!("    {}\n", meta));
        }
        
        // Add styles
        if !self.styles.is_empty() {
            html.push_str("    <style>\n");
            for style in &self.styles {
                html.push_str("        ");
                html.push_str(style);
                html.push('\n');
            }
            html.push_str("    </style>\n");
        }
        
        html.push_str("</head>\n");
        html.push_str("<body>\n");
        html.push_str(&self.content);
        html.push('\n');
        
        // Add scripts
        if !self.scripts.is_empty() {
            html.push_str("    <script>\n");
            for script in &self.scripts {
                html.push_str("        ");
                html.push_str(script);
                html.push('\n');
            }
            html.push_str("    </script>\n");
        }
        
        html.push_str("</body>\n");
        html.push_str("</html>\n");
        
        html
    }
}

pub fn build_error_page(title: &str, error: &str, details: Option<&str>) -> String {
    let mut builder = HtmlBuilder::new(title);
    
    builder.add_viewport();
    builder.add_style("body { font-family: Arial, sans-serif; margin: 40px; }");
    builder.add_style(".error { background-color: #f8d7da; color: #721c24; padding: 20px; border: 1px solid #f5c6cb; border-radius: 5px; }");
    builder.add_style(".details { background-color: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; margin-top: 20px; }");
    builder.add_style("pre { white-space: pre-wrap; word-wrap: break-word; }");
    
    let mut content = format!(
        r#"<h1>{}</h1>
<div class="error">
    <h2>Error</h2>
    <p>{}</p>
</div>"#,
        htmlescape::encode_minimal(title),
        htmlescape::encode_minimal(error)
    );
    
    if let Some(details) = details {
        content.push_str(&format!(
            r#"<div class="details">
    <h3>Details</h3>
    <pre>{}</pre>
</div>"#,
            htmlescape::encode_minimal(details)
        ));
    }
    
    builder.set_content(&content);
    builder.build()
}

pub fn build_launch_page(
    title: &str,
    user_name: Option<&str>,
    course_name: Option<&str>,
    resource_title: Option<&str>,
    custom_params: &HashMap<String, String>,
    script_name: &str,
) -> String {
    let mut builder = HtmlBuilder::new(title);
    
    builder.add_viewport();
    builder.add_style("body { font-family: Arial, sans-serif; margin: 20px; }");
    builder.add_style(".header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }");
    builder.add_style(".info { background-color: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 20px; }");
    builder.add_style(".params { background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px; }");
    builder.add_style("table { width: 100%; border-collapse: collapse; }");
    builder.add_style("th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }");
    builder.add_style("th { background-color: #f2f2f2; }");
    
    let mut content = format!(
        r#"<div class="header">
    <h1>{}</h1>
</div>"#,
        htmlescape::encode_minimal(title)
    );
    
    if user_name.is_some() || course_name.is_some() || resource_title.is_some() {
        content.push_str(r#"<div class="info"><h2>Launch Information</h2>"#);
        
        if let Some(user) = user_name {
            content.push_str(&format!(
                "<p><strong>User:</strong> {}</p>",
                htmlescape::encode_minimal(user)
            ));
        }
        
        if let Some(course) = course_name {
            content.push_str(&format!(
                "<p><strong>Course:</strong> {}</p>",
                htmlescape::encode_minimal(course)
            ));
        }
        
        if let Some(resource) = resource_title {
            content.push_str(&format!(
                "<p><strong>Resource:</strong> {}</p>",
                htmlescape::encode_minimal(resource)
            ));
        }
        
        content.push_str("</div>");
    }
    
    if !custom_params.is_empty() {
        content.push_str(r#"<div class="params"><h2>Custom Parameters</h2><table>"#);
        content.push_str("<tr><th>Parameter</th><th>Value</th></tr>");
        
        for (key, value) in custom_params {
            content.push_str(&format!(
                "<tr><td>{}</td><td>{}</td></tr>",
                htmlescape::encode_minimal(key),
                htmlescape::encode_minimal(value)
            ));
        }
        
        content.push_str("</table></div>");
    }
    
    content.push_str(&format!(
        r#"<div id="app"></div>
<script src="{}"></script>"#,
        htmlescape::encode_attribute(script_name)
    ));
    
    builder.set_content(&content);
    builder.build()
}

pub fn build_form_page(
    title: &str,
    action: &str,
    method: &str,
    fields: &[(&str, &str, &str)], // (name, type, value)
    auto_submit: bool,
) -> String {
    let mut builder = HtmlBuilder::new(title);
    
    builder.add_viewport()
        .add_style("body { font-family: Arial, sans-serif; margin: 20px; }")
        .add_style("form { max-width: 600px; }")
        .add_style("input { margin: 5px 0; padding: 8px; width: 100%; }")
        .add_style("button { background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }")
        .add_style("button:hover { background-color: #0052a3; }");
    
    let mut content = format!(
        r#"<h1>{}</h1>
<form id="ltiForm" action="{}" method="{}">"#,
        htmlescape::encode_minimal(title),
        htmlescape::encode_minimal(action),
        htmlescape::encode_minimal(method)
    );
    
    for (name, input_type, value) in fields {
        content.push_str(&format!(
            r#"<input type="{}" name="{}" value="{}">"#,
            htmlescape::encode_attribute(input_type),
            htmlescape::encode_attribute(name),
            htmlescape::encode_attribute(value)
        ));
    }
    
    if !auto_submit {
        content.push_str(r#"<button type="submit">Submit</button>"#);
    }
    
    content.push_str("</form>");
    
    if auto_submit {
        builder.add_script("document.getElementById('ltiForm').submit();");
    }
    
    builder.set_content(&content);
    builder.build()
}

pub fn build_redirect_page(url: &str, delay: u32) -> String {
    let mut builder = HtmlBuilder::new("Redirecting...");
    
    builder.add_viewport()
        .add_meta_http_equiv("refresh", &format!("{}; url={}", delay, url))
        .add_style("body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }")
        .add_style(".spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }")
        .add_style("@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }");
    
    let content = format!(
        r#"<h1>Redirecting...</h1>
<div class="spinner"></div>
<p>You will be redirected to your destination in {} seconds.</p>
<p>If you are not redirected automatically, <a href="{}">click here</a>.</p>"#,
        delay,
        htmlescape::encode_attribute(url)
    );
    
    builder.set_content(&content);
    builder.build()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_html_builder_basic() {
        let mut builder = HtmlBuilder::new("Test Page");
        builder.add_style("body { margin: 0; }");
        builder.add_script("console.log('test');");
        builder.set_content("<h1>Hello World</h1>");
        let html = builder.build();
        
        assert!(html.contains("Test Page"));
        assert!(html.contains("Hello World"));
        assert!(html.contains("body { margin: 0; }"));
        assert!(html.contains("console.log('test');"));
    }

    #[test]
    fn test_build_error_page() {
        let html = build_error_page("Error", "Something went wrong", Some("Details here"));
        
        assert!(html.contains("Error"));
        assert!(html.contains("Something went wrong"));
        assert!(html.contains("Details here"));
    }

    #[test]
    fn test_build_form_page() {
        let fields = vec![
            ("username", "text", "john"),
            ("password", "password", "secret"),
        ];
        
        let html = build_form_page("Login", "/login", "POST", &fields, false);
        
        assert!(html.contains("Login"));
        assert!(html.contains("action=\"/login\""));
        assert!(html.contains("method=\"POST\""));
        assert!(html.contains("name=\"username\""));
        assert!(html.contains("value=\"john\""));
    }
}