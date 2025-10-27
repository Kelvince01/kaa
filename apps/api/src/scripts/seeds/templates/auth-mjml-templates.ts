export const userVerificationMJMLTemplate = `
&lt;mjml&gt;
  &lt;mj-head&gt;
    &lt;mj-title&gt;Verify Your Email Address&lt;/mj-title&gt;
    &lt;mj-attributes&gt;
      &lt;mj-all font-family=&quot;Dm Sans&quot; /&gt;
      &lt;mj-text font-size=&quot;16px&quot; color=&quot;#333333&quot; line-height=&quot;24px&quot; /&gt;
      &lt;mj-section padding=&quot;20px&quot; /&gt;
    &lt;/mj-attributes&gt;
    &lt;mj-style&gt;
      a {
        color: #0066cc;
        text-decoration: none;
      }
    &lt;/mj-style&gt;
  &lt;/mj-head&gt;
  &lt;mj-body background-color=&quot;#f5f5f5&quot;&gt;
    &lt;mj-section padding-top=&quot;30px&quot; padding-bottom=&quot;30px&quot;&gt;
      &lt;mj-column&gt;
        &lt;mj-image width=&quot;200px&quot; src=&quot;{{logoUrl}}&quot; alt=&quot;Kaa Logo&quot; /&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;

    &lt;mj-section background-color=&quot;#ffffff&quot; border-radius=&quot;5px&quot;&gt;
      &lt;mj-column&gt;
        &lt;mj-text font-size=&quot;24px&quot; font-weight=&quot;bold&quot; align=&quot;center&quot; color=&quot;#333333&quot;&gt;
          Verify Your Email Address
        &lt;/mj-text&gt;

        &lt;mj-text padding-top=&quot;20px&quot;&gt;
          Hello {{firstName}},
        &lt;/mj-text&gt;

        &lt;mj-text&gt;
          Thank you for creating an account with Kaa. Please verify your email address by clicking the button below:
        &lt;/mj-text&gt;

        &lt;mj-button background-color=&quot;#4CAF50&quot; color=&quot;white&quot; border-radius=&quot;4px&quot; font-size=&quot;16px&quot; font-weight=&quot;bold&quot; href=&quot;{{verificationUrl}}&quot; width=&quot;300px&quot;&gt;
          Verify Email Address
        &lt;/mj-button&gt;

        &lt;mj-text&gt;
          If the button doesn't work, please copy and paste the following link into your browser:
        &lt;/mj-text&gt;

        &lt;mj-text font-size=&quot;14px&quot; color=&quot;#0066cc&quot;&gt;
          {{verificationUrl}}
        &lt;/mj-text&gt;

        &lt;mj-text&gt;
          This link will expire in 24 hours.
        &lt;/mj-text&gt;

        &lt;mj-text&gt;
          If you did not create an account, please ignore this email.
        &lt;/mj-text&gt;

        &lt;mj-text padding-top=&quot;20px&quot;&gt;
          Best regards,&lt;br /&gt;
          The Kaa Team
        &lt;/mj-text&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;

    &lt;mj-section&gt;
      &lt;mj-column&gt;
        &lt;mj-text font-size=&quot;12px&quot; color=&quot;#999999&quot; align=&quot;center&quot;&gt;
          If you have any questions, please contact us at &lt;a href=&quot;mailto:{{supportEmail}}&quot;&gt;{{supportEmail}}&lt;/a&gt;
        &lt;/mj-text&gt;

        &lt;mj-text font-size=&quot;12px&quot; color=&quot;#999999&quot; align=&quot;center&quot;&gt;
          &amp;copy; {{year}} Kaa. All rights reserved.
        &lt;/mj-text&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;
  &lt;/mj-body&gt;
&lt;/mjml&gt;
`;

export const welcomeEmailMJMLTemplate = `
&lt;mjml&gt;
  &lt;mj-head&gt;
    &lt;mj-title&gt;Welcome to Kaa!&lt;/mj-title&gt;
    &lt;mj-attributes&gt;
      &lt;mj-all font-family=&quot;Dm Sans&quot; /&gt;
      &lt;mj-text font-size=&quot;16px&quot; color=&quot;#333333&quot; line-height=&quot;24px&quot; /&gt;
      &lt;mj-section padding=&quot;20px&quot; /&gt;
    &lt;/mj-attributes&gt;
    &lt;mj-style&gt;
      a {
        color: #0066cc;
        text-decoration: none;
      }
    &lt;/mj-style&gt;
  &lt;/mj-head&gt;
  &lt;mj-body background-color=&quot;#f5f5f5&quot;&gt;
    &lt;mj-section padding-top=&quot;30px&quot; padding-bottom=&quot;30px&quot;&gt;
      &lt;mj-column&gt;
        &lt;mj-image width=&quot;200px&quot; src=&quot;{{logoUrl}}&quot; alt=&quot;Kaa Logo&quot; /&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;

    &lt;mj-section background-color=&quot;#ffffff&quot; border-radius=&quot;5px&quot;&gt;
      &lt;mj-column&gt;
        &lt;mj-text font-size=&quot;24px&quot; font-weight=&quot;bold&quot; align=&quot;center&quot; color=&quot;#333333&quot;&gt;
          Welcome to Kaa!
        &lt;/mj-text&gt;

        &lt;mj-text padding-top=&quot;20px&quot;&gt;
          Hello {{firstName}},
        &lt;/mj-text&gt;

        &lt;mj-text&gt;
          Thank you for verifying your email address. Your account is now fully activated, and you're all set to get started with Kaa - your go-to rental property platform.
        &lt;/mj-text&gt;

        &lt;mj-text&gt;
          Here are a few things you can do:
        &lt;/mj-text&gt;

        &lt;mj-text&gt;
          &lt;ul&gt;
            &lt;li&gt;Complete your profile with additional information&lt;/li&gt;
            &lt;li&gt;Browse available properties&lt;/li&gt;
            &lt;li&gt;Save your favorite listings&lt;/li&gt;
            &lt;li&gt;Contact property owners directly through our platform&lt;/li&gt;
          &lt;/ul&gt;
        &lt;/mj-text&gt;

        &lt;mj-button background-color=&quot;#4CAF50&quot; color=&quot;white&quot; border-radius=&quot;4px&quot; font-size=&quot;16px&quot; font-weight=&quot;bold&quot; href=&quot;{{loginUrl}}&quot; width=&quot;300px&quot;&gt;
          Get Started
        &lt;/mj-button&gt;

        &lt;mj-text padding-top=&quot;20px&quot;&gt;
          If you have any questions or need assistance, don't hesitate to reach out to our support team.
        &lt;/mj-text&gt;

        &lt;mj-text padding-top=&quot;20px&quot;&gt;
          Best regards,&lt;br /&gt;
          The Kaa Team
        &lt;/mj-text&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;

    &lt;mj-section&gt;
      &lt;mj-column&gt;
        &lt;mj-text font-size=&quot;12px&quot; color=&quot;#999999&quot; align=&quot;center&quot;&gt;
          If you have any questions, please contact us at &lt;a href=&quot;mailto:{{supportEmail}}&quot;&gt;{{supportEmail}}&lt;/a&gt;
        &lt;/mj-text&gt;

        &lt;mj-text font-size=&quot;12px&quot; color=&quot;#999999&quot; align=&quot;center&quot;&gt;
          &amp;copy; {{year}} Kaa. All rights reserved.
        &lt;/mj-text&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;
  &lt;/mj-body&gt;
&lt;/mjml&gt;
`;

export const loginAlertEmailMJMLTemplate = `
&lt;mjml&gt;
  &lt;mj-head&gt;
    &lt;mj-title&gt;New Login Alert&lt;/mj-title&gt;
    &lt;mj-attributes&gt;
      &lt;mj-all font-family=&quot;Dm Sans&quot; /&gt;
      &lt;mj-text font-size=&quot;16px&quot; color=&quot;#333333&quot; line-height=&quot;24px&quot; /&gt;
      &lt;mj-section padding=&quot;20px&quot; /&gt;
    &lt;/mj-attributes&gt;
    &lt;mj-style&gt;
      a {
        color: #0066cc;
        text-decoration: none;
      }
    &lt;/mj-style&gt;
  &lt;/mj-head&gt;
  &lt;mj-body background-color=&quot;#f5f5f5&quot;&gt;
    &lt;mj-section padding-top=&quot;30px&quot; padding-bottom=&quot;30px&quot;&gt;
      &lt;mj-column&gt;
        &lt;mj-image width=&quot;200px&quot; src=&quot;{{logoUrl}}&quot; alt=&quot;Kaa Logo&quot; /&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;

    &lt;mj-section&gt;
      &lt;mj-column&gt;
        &lt;mj-text&gt;
          &lt;h2&gt;New Login Alert&lt;/h2&gt;
          &lt;p&gt;A new login was detected on your Kaa account.&lt;/p&gt;
          &lt;p&gt;&lt;strong&gt;IP Address:&lt;/strong&gt; {{ip}}&lt;/p&gt;
          &lt;p&gt;&lt;strong&gt;Device:&lt;/strong&gt; {{userAgent}}&lt;/p&gt;
          &lt;p&gt;&lt;strong&gt;Time:&lt;/strong&gt; {{date}}&lt;/p&gt;
          &lt;p&gt;If this wasn't you, please change your password immediately.&lt;/p&gt;
        &lt;/mj-text&gt;
      &lt;/mj-column&gt;
    &lt;/mj-section&gt;
  &lt;/mj-body&gt;
&lt;/mjml&gt;
`;
