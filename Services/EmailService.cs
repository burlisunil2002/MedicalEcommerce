using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;

public class EmailService
{
    private readonly EmailSettings _settings;
    private readonly InvoiceService _invoiceService;
    private readonly ApplicationDbContext _context;


    public EmailService(IOptions<EmailSettings> settings, InvoiceService invoiceService)
    {
        _settings = settings.Value;
        _invoiceService = invoiceService;
    }

    // =========================
    // ENQUIRY MAIL
    // =========================
    public void SendEnquiryMail(EnquiryModel model)
    {
        try
        {
            var mail = new MailMessage
            {
                From = new MailAddress(_settings.Email),
                Subject = "New Product Enquiry from Website",
                Body =
                    $"New Enquiry Details:\n\n" +
                    $"Name: {model.Name}\n" +
                    $"Email: {model.Email}\n" +
                    $"Contact: {model.Contact}\n" +
                    $"Product Name: {model.ProductName}\n" +
                    $"Remarks: {model.Remarks}"
            };

            mail.To.Add(_settings.Email);

            using var smtp = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.Email, _settings.AppPassword),
                EnableSsl = true
            };

            smtp.Send(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Email Error: " + ex.Message);
            throw;
        }
    }

    // =========================
    // COMMON EMAIL (ASYNC)
    // =========================
    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        using var mail = new MailMessage
        {
            From = new MailAddress(_settings.Email),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        mail.To.Add(toEmail);

        using var smtp = new SmtpClient(_settings.Host, _settings.Port)
        {
            Credentials = new NetworkCredential(_settings.Email, _settings.AppPassword),
            EnableSsl = true,
            Timeout = 10000 // ⏱️ 10 seconds max
        };

        try
        {
            await smtp.SendMailAsync(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine("SMTP ERROR: " + ex.Message);
            throw; // important for debugging
        }
    }
    // =========================
    // 🔥 INVOICE EMAIL (NEW)
    // =========================
    public async Task SendInvoiceEmailAsync(string toEmail, string html)
    {
        await SendEmailAsync(toEmail, "Your Invoice", html);
    }

    public async Task SendEmailWithAttachmentAsync(
    string toEmail,
    string subject,
    string body,
    byte[] attachmentBytes,
    string fileName)
    {
        var mail = new MailMessage
        {
            From = new MailAddress(_settings.Email),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        mail.To.Add(toEmail);

        mail.Attachments.Add(new Attachment(
            new MemoryStream(attachmentBytes),
            fileName,
            "application/pdf"));

        var smtp = new SmtpClient(_settings.Host, _settings.Port)
        {
            Credentials = new NetworkCredential(_settings.Email, _settings.AppPassword),
            EnableSsl = true
        };

        await smtp.SendMailAsync(mail);
    }
}