import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import { logger } from "@kaa/utils";
import { Elysia, t } from "elysia";
import mjmlService from "../mjml.service";

type PreviewData = {
  templateName: string;
  data?: Record<string, any>;
  theme?: string;
};

const app = new Elysia()
  .use(cors())
  .use(html())
  .get("/", () => {
    const templates = mjmlService.getTemplates();
    const themes = mjmlService.getThemes();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MJML Email Preview</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .content { 
            padding: 20px; 
        }
        .form-group { 
            margin-bottom: 20px; 
        }
        label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: 500; 
        }
        select, textarea, input { 
            width: 100%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            box-sizing: border-box; 
        }
        textarea { 
            height: 200px; 
            resize: vertical; 
            font-family: Monaco, Consolas, monospace; 
            font-size: 12px; 
        }
        button { 
            background: #667eea; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px; 
        }
        button:hover { 
            background: #5a6fd8; 
        }
        .templates-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
            gap: 15px; 
            margin-top: 20px; 
        }
        .template-card { 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            padding: 15px; 
            text-align: center; 
            cursor: pointer; 
            transition: all 0.2s; 
        }
        .template-card:hover { 
            border-color: #667eea; 
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2); 
        }
        .template-card.selected { 
            border-color: #667eea; 
            background: #f0f2ff; 
        }
        .sample-data { 
            background: #f8f9fa; 
            border: 1px solid #e9ecef; 
            border-radius: 4px; 
            padding: 10px; 
            margin-top: 10px; 
            font-family: Monaco, Consolas, monospace; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 MJML Email Preview</h1>
            <p>Preview and test your email templates with different themes and data</p>
        </div>
        <div class="content">
            <form id="previewForm">
                <div class="form-group">
                    <label>Select Template:</label>
                    <div class="templates-grid" id="templatesGrid">
                        ${templates
                          .map(
                            (template) => `
                            <div class="template-card" onclick="selectTemplate('${template}')">
                                <h3>${template}</h3>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>

                <div class="form-group">
                    <label for="theme">Select Theme:</label>
                    <select id="theme" name="theme">
                        ${themes
                          .map(
                            (theme) => `
                            <option value="${theme.name}">${theme.name}</option>
                        `
                          )
                          .join("")}
                    </select>
                </div>

                <div class="form-group">
                    <label for="templateData">Template Data (JSON):</label>
                    <textarea id="templateData" name="data" placeholder="Enter JSON data for template variables...">{}</textarea>
                    <div class="sample-data">
                        <strong>Sample data for common variables:</strong><br>
                        firstName: "John", lastName: "Doe", email: "john@example.com"<br>
                        logoUrl: "https://via.placeholder.com/200x80/667eea/ffffff?text=LOGO"<br>
                        supportEmail: "support@kaapro.dev", year: "2025"
                    </div>
                </div>

                <button type="submit">🔍 Preview Email</button>
            </form>
        </div>
    </div>

    <script>
        let selectedTemplate = '';

        function selectTemplate(templateName) {
            selectedTemplate = templateName;
            document.querySelectorAll('.template-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.target.closest('.template-card').classList.add('selected');
            
            // Update textarea with sample data based on template
            updateSampleData(templateName);
        }

        function updateSampleData(templateName) {
            const commonData = {
                firstName: "John",
                lastName: "Doe", 
                email: "john.doe@example.com",
                logoUrl: "https://via.placeholder.com/200x80/667eea/ffffff?text=KAA",
                supportEmail: "support@kaapro.dev",
                year: new Date().getFullYear(),
                loginUrl: "https://app.kaapro.dev/login",
                appUrl: "https://app.kaapro.dev"
            };

            let templateSpecificData = {};

            switch(templateName) {
                case 'welcome':
                    templateSpecificData = {
                        ...commonData,
                        userName: "John Doe"
                    };
                    break;
                case 'verification':
                    templateSpecificData = {
                        ...commonData,
                        verificationUrl: "https://app.kaapro.dev/verify?token=sample-token",
                        expiresIn: "24 hours"
                    };
                    break;
                case 'password-reset':
                    templateSpecificData = {
                        ...commonData,
                        resetUrl: "https://app.kaapro.dev/reset?token=sample-token",
                        expiresIn: "1 hour"
                    };
                    break;
                case 'booking-notification':
                    templateSpecificData = {
                        ...commonData,
                        propertyName: "Modern 2BR Apartment",
                        checkIn: "2025-02-01",
                        checkOut: "2025-02-07",
                        totalAmount: 15000,
                        bookingId: "BK-2025-001"
                    };
                    break;
                case 'payment-receipt':
                    templateSpecificData = {
                        ...commonData,
                        amount: 12500,
                        currency: "KES",
                        paymentMethod: "M-Pesa",
                        transactionId: "TX-2025-001",
                        date: new Date().toISOString()
                    };
                    break;
                default:
                    templateSpecificData = commonData;
            }

            document.getElementById('templateData').value = JSON.stringify(templateSpecificData, null, 2);
        }

        document.getElementById('previewForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!selectedTemplate) {
                alert('Please select a template first');
                return;
            }

            const theme = document.getElementById('theme').value;
            const dataStr = document.getElementById('templateData').value;
            
            let data = {};
            try {
                data = JSON.parse(dataStr);
            } catch (err) {
                alert('Invalid JSON data: ' + err.message);
                return;
            }

            const url = '/preview/' + selectedTemplate + '?theme=' + theme;
            
            // Open preview in new window
            const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
            previewWindow.document.write('<h2>Loading preview...</h2>');
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.text())
            .then(html => {
                previewWindow.document.open();
                previewWindow.document.write(html);
                previewWindow.document.close();
            })
            .catch(err => {
                previewWindow.document.write('<h2>Error: ' + err.message + '</h2>');
            });
        });

        // Select first template by default
        if (document.querySelector('.template-card')) {
            document.querySelector('.template-card').click();
        }
    </script>
</body>
</html>`;
  })
  .post(
    "/preview/:templateName",
    ({ params, query, body }) => {
      try {
        const { templateName } = params;
        const { theme } = query;
        const data = body as Record<string, any>;

        const previewHtml = mjmlService.previewTemplate(
          templateName,
          data,
          theme ? { theme } : {}
        );

        return previewHtml;
      } catch (error) {
        logger.error("Preview error:", error);
        return `<h1>Error</h1><p>${(error as Error).message}</p>`;
      }
    },
    {
      params: t.Object({
        templateName: t.String(),
      }),
      query: t.Object({
        theme: t.String(),
      }),
      body: t.Object({
        data: t.Object({
          firstName: t.String(),
          lastName: t.String(),
          email: t.String(),
          logoUrl: t.String(),
          supportEmail: t.String(),
          year: t.String(),
          loginUrl: t.String(),
          appUrl: t.String(),
        }),
      }),
    }
  )
  .get("/api/templates", () => ({
    templates: mjmlService.getTemplates(),
    themes: mjmlService.getThemes(),
  }))
  .get(
    "/api/templates/:name/validate",
    ({ params }) => {
      const { name } = params;
      return mjmlService.validateTemplate(name);
    },
    {
      params: t.Object({
        name: t.String(),
      }),
    }
  )
  .listen(5001);

console.log("\n🚀 MJML Email Preview Server started!");
console.log("📧 Open http://localhost:5001 to preview your email templates");
console.log("🔧 Available endpoints:");
console.log("   • GET  /                     - Preview interface");
console.log("   • POST /preview/:template    - Preview specific template");
console.log("   • GET  /api/templates        - List all templates and themes");
console.log("   • GET  /api/templates/:name/validate - Validate template");
console.log("\n💡 Use 'bun run templates:preview' to start this server");
