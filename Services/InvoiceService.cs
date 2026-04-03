using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services
{
    public class InvoiceService
    {
        public string GenerateInvoiceHtml(OrderModel order)
        {
            var html = File.ReadAllText("/Order/Invoice.html");

            string itemsHtml = "";
            int i = 1;

            foreach (var item in order.OrderItems ?? new List<OrderItemModel>())
            {
                decimal gstAmount = item.LineTotal - (item.Price * item.Quantity);

                itemsHtml += $@"
            <tr>
                <td>{i++}</td>
                <td>{item.ProductName}</td>
                <td>{item.Quantity}</td>
                <td>{item.Price}</td>
                <td>{item.GSTPercentage}%</td>
                <td>{gstAmount}</td>
                <td>{item.LineTotal}</td>
            </tr>";
            }

            // 🔁 Replace placeholders
            html = html.Replace("{{InvoiceNumber}}", $"INV-{order.OrderNumber}");
            html = html.Replace("{{Date}}", order.OrderDate.ToString("dd-MM-yyyy"));

            html = html.Replace("{{CustomerName}}", order.FullName);
            html = html.Replace("{{Address}}", order.Address);
            html = html.Replace("{{City}}", order.City);
            html = html.Replace("{{Pincode}}", order.Pincode);
            html = html.Replace("{{Email}}", order.Email);

            html = html.Replace("{{SubTotal}}", order.SubTotal.ToString("0.00"));
            html = html.Replace("{{GSTTotal}}", order.GST.ToString("0.00"));
            html = html.Replace("{{GrandTotal}}", order.GrandTotal.ToString("0.00"));

            html = html.Replace("{{Items}}", itemsHtml);

            return html;
        }
    }
}
