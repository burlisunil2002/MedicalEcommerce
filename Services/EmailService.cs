using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Net.Mail;
using VivekMedicalProducts.Models;

public class EmailService
{
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration config)
    {
        _apiKey = config["SendGrid:ApiKey"];
        _fromEmail = config["SendGrid:FromEmail"];
        _fromName = config["SendGrid:FromName"];
    }

    // =========================
    // COMMON EMAIL (OTP etc.)
    // =========================
    public async Task SendEmailAsync(string toEmail, string subject, string otp)
    {
        var client = new SendGridClient(_apiKey);

        // ✅ Use DOMAIN email (NOT Gmail)
        var from = new EmailAddress(
     "burlisunil16@gmail.com",
     "Sunil Medical Products"
 );

        var to = new EmailAddress(toEmail);

        // ✅ Professional OTP Email Template
        var htmlContent = $@"
    <div style='font-family: Arial, sans-serif; padding:20px; background:#f4f6f8;'>
        <div style='max-width:500px; margin:auto; background:white; padding:20px; border-radius:8px;'>
            
            <h2 style='color:#2E86C1; text-align:center;'>
                Sunil Medical Products
            </h2>

            <p>Hello,</p>

            <p>Your verification code is:</p>

            <h1 style='text-align:center; color:#2E86C1; letter-spacing:5px;'>
                {otp}
            </h1>

            <hr />

            <p style='font-size:12px; color:gray; text-align:center;'>
                If you did not request this, please ignore this email.
            </p>

        </div>
    </div>";

        var plainTextContent = $"Your OTP is: {otp}. It expires in 5 minutes.";

        var msg = MailHelper.CreateSingleEmail(
            from,
            to,
            subject,
            plainTextContent,
            htmlContent
        );

        var response = await client.SendEmailAsync(msg);

        // ✅ Debug logging
        Console.WriteLine($"SendGrid Status: {response.StatusCode}");

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Body.ReadAsStringAsync();

            Console.WriteLine("SENDGRID ERROR:");
            Console.WriteLine(error);

            throw new Exception(error);
        }
    }

    // =========================
    // ENQUIRY MAIL
    // =========================
    public async Task SendEnquiryMail(EnquiryModel model)
    {
        string body = $@"
    <div style='font-family:Arial; padding:20px; background:#f4f6f8;'>
        <div style='background:white; padding:20px; border-radius:8px;'>

            <h2 style='color:#2E86C1;'>New Product Enquiry</h2>

            <p><b>Name:</b> {model.Name}</p>
            <p><b>Email:</b> {model.Email}</p>
            <p><b>Contact:</b> {model.Contact}</p>
            <p><b>Product:</b> {model.ProductName}</p>
            <p><b>Remarks:</b> {model.Remarks}</p>

            <hr/>
            <p style='font-size:12px;color:gray;'>
                This enquiry was submitted from your website.
            </p>

        </div>
    </div>";

        await SendEmailAsync(
            "burlisunil16@gmail.com",   // ✅ ADMIN EMAIL
            "New Enquiry - Sunil Medical",
            body
        );
    }

    // =========================
    // INVOICE EMAIL
    // =========================
    public async Task SendInvoiceEmailAsync(string toEmail, string invoiceHtml)
    {
        string wrappedHtml = $@"
    <div style='font-family:Arial; padding:20px; background:#f4f6f8;'>
        <div style='background:white; padding:20px; border-radius:8px;'>

            <h2 style='color:#2E86C1;'>Your Invoice</h2>

            {invoiceHtml}

            <hr/>

            <p style='font-size:12px;color:gray;text-align:center;'>
                Thank you for choosing Sunil Medical Products.
                For support, reply to this email.
            </p>

        </div>
    </div>";

        await SendEmailAsync(
            toEmail,
            "Your Invoice - Sunil Medical",
            wrappedHtml
        );
    }

    // =========================
    // EMAIL WITH ATTACHMENT
    // =========================
    public async Task SendEmailWithAttachmentAsync(
     string toEmail,
     string subject,
     string body,
     byte[] attachmentBytes,
     string fileName)
    {
        var client = new SendGridClient(_apiKey);

        var from = new EmailAddress(
    "burlisunil16@gmail.com",
    "Sunil Medical Products"
);

        var to = new EmailAddress(toEmail); 

        var msg = MailHelper.CreateSingleEmail(
            from,
            to,
            subject,
            plainTextContent: "Invoice attached",
            htmlContent: body
        );

        // ✅ Reply-To
        msg.ReplyTo = new EmailAddress(
            "burlisunil16@gmail.com",
            "Support Team"
        );

        // ✅ Attach file
        msg.AddAttachment(fileName, Convert.ToBase64String(attachmentBytes));

        var response = await client.SendEmailAsync(msg);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Body.ReadAsStringAsync();
            Console.WriteLine("SendGrid Attachment ERROR: " + error);
            throw new Exception("Attachment email failed");
        }
    }

    public async Task SendPasswordResetEmail(
    string toEmail,
    string sellerName,
    string resetLink)
    {
        var client = new SendGridClient(_apiKey);

        var from = new EmailAddress(
    "burlisunil16@gmail.com",
    "Sunil Medical Products"
);

        var to = new EmailAddress(toEmail);

        var html = $@"
    <div style='font-family:Arial;padding:40px;background:#f5f7fb'>

        <div style='background:white;
                    max-width:600px;
                    margin:auto;
                    padding:30px;
                    border-radius:12px;'>

            <h2>Hello {sellerName}</h2>

            <p>
                We received a request to reset your seller password.
            </p>

            <p style='text-align:center'>

                <a href='{resetLink}'
                   style='background:#2563eb;
                          color:white;
                          padding:14px 30px;
                          border-radius:8px;
                          text-decoration:none;'>

                    Reset Password

                </a>

            </p>

            <p>
                If you didn't request this, simply ignore this email.
            </p>

        </div>

    </div>";

        var msg = MailHelper.CreateSingleEmail(
            from,
            to,
            "Seller Password Reset",
            "Reset Password",
            html);

        var response = await client.SendEmailAsync(msg);

        Console.WriteLine($"SendGrid Status : {response.StatusCode}");

        var body = await response.Body.ReadAsStringAsync();

        Console.WriteLine(body);

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception(body);
        }
    }
}