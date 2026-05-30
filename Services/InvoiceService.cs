using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Services
{
    public class InvoiceService
    {
        public string GenerateInvoiceHtml(
            OrderModel order)
        {
            var path = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "Order",
                "Invoice.html"
            );

            var html =
                File.ReadAllText(path);

            var address =
                order.UserAddress;

            string itemsHtml = "";

            int i = 1;

            decimal subtotal = 0;
            decimal gstTotal = 0;

            foreach (
                var item in
                order.OrderItems ??
                new List<OrderItemModel>())
            {
                decimal itemSubtotal =
                    item.Price *
                    item.Quantity;

                decimal gstAmount =
                    item.LineTotal *
                    item.GSTPercentage /
                    100m;

                subtotal +=
                    itemSubtotal;

                gstTotal +=
                    gstAmount;

                itemsHtml += $@"
                <tr>
                    <td>{i++}</td>
                    <td>{item.ProductName}</td>
                    <td>{item.Quantity}</td>
                    <td>{item.Price:0.00}</td>
                    <td>{item.GSTPercentage}%</td>
                    <td>{gstAmount:0.00}</td>
                    <td>{item.FinalPaidAmount:0.00}</td>
                </tr>";
            }

            html = html.Replace(
                "{{InvoiceNumber}}",
                $"INV-{order.OrderNumber}");

            html = html.Replace(
                "{{Date}}",
                order.OrderDate
                    .ToString("dd-MM-yyyy"));

            // CUSTOMER
            html = html.Replace(
                "{{CustomerName}}",
                address?.FullName ?? "");

            html = html.Replace(
                "{{Address}}",
                string.Join(", ",
                    new[]
                    {
                        address?.AddressLine1,
                        address?.AddressLine2
                    }
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x))
                ));

            html = html.Replace(
                "{{City}}",
                address?.City ?? "");

            html = html.Replace(
                "{{State}}",
                address?.State ?? "");

            html = html.Replace(
                "{{Pincode}}",
                address?.Pincode ?? "");

            html = html.Replace(
                "{{Phone}}",
                address?.MobileNumber ?? "");

            html = html.Replace(
                "{{Email}}",
                order.User?.Email ?? "");

            // TOTALS
            html = html.Replace(
                "{{SubTotal}}",
                subtotal.ToString("0.00"));

            html = html.Replace(
                "{{GSTTotal}}",
                gstTotal.ToString("0.00"));

            html = html.Replace(
                "{{GrandTotal}}",
                order.GrandTotal
                    .ToString("0.00"));

            html = html.Replace(
                "{{Items}}",
                itemsHtml);

            return html;
        }
    }
}
