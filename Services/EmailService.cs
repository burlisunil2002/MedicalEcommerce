using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using VivekMedicalProducts.Models;

public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public void SendEnquiryMail(EnquiryModel model)
    {
        try
        {
            var mail = new MailMessage
            {
                From = new MailAddress(_settings.Email),
                Subject = "New Product Enquiry from Website",
                Body =
                    "New Enquiry Details:\n\n" +
                    "Name: " + model.Name + "\n" +
                    "Email: " + model.Email + "\n" +
                    "Contact: " + model.Contact + "\n" +
                    "Product Name: " + model.ProductName + "\n" +
                    "Remarks: " + model.Remarks
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

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var mail = new MailMessage();
        mail.To.Add(toEmail);
        mail.Subject = subject;
        mail.Body = body;
        mail.IsBodyHtml = true;

        mail.From = new MailAddress(_settings.Email);

        var smtp = new SmtpClient(_settings.Host, _settings.Port)
        {
            Credentials = new NetworkCredential(
                _settings.Email,
                _settings.AppPassword
            ),
            EnableSsl = true
        };

        await smtp.SendMailAsync(mail);
    }


}