using System.Text;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Templates
{
    public static class SmsTemplateBuilder
    {
        public static string Build(OrderModel order, string status)
        {
            string statusMessage = status switch
            {
                "Placed" =>
                    "Your order has been placed successfully and is being processed.",

                "Packed" =>
                    "Your order has been packed and is ready for shipment.",

                "Shipped" =>
                    $"Your order has been shipped. Courier: {GetCourier(order)}. Tracking: {GetTracking(order)}.",

                "OutForDelivery" =>
                    "Your order is out for delivery and will reach you today.",

                "Delivered" =>
                    "Your order has been delivered successfully. Thank you for shopping with us.",

                "Cancelled" =>
                    "Your order has been cancelled. Please contact support if you need assistance.",

                "ReturnRequested" =>
                    "Your return request has been received and is under review.",

                "RefundInitiated" =>
                    "Your refund has been initiated.",

                "RefundCompleted" =>
                    "Your refund has been completed successfully.",

                _ =>
                    $"Your order status has been updated to {status}."
            };

            var sb = new StringBuilder();

            sb.AppendLine("Sunil Medical Products");
            sb.AppendLine($"Hi {order.UserAddress?.FullName},");
            sb.AppendLine();
            sb.AppendLine(statusMessage);
            sb.AppendLine();
            sb.AppendLine($"Order No : {order.OrderNumber}");
            sb.AppendLine($"Amount   : Rs. {order.GrandTotal:N2}");
            sb.AppendLine();
            sb.AppendLine($"Track: https://sunilmedicalproducts.online/my-orders");
            sb.AppendLine();
            sb.AppendLine("Support: +91 9014060858");

            return sb.ToString();
        }

        private static string GetCourier(OrderModel order)
        {
            return order.OrderItems?.FirstOrDefault()?.CourierPartner ?? "-";
        }

        private static string GetTracking(OrderModel order)
        {
            return order.OrderItems?.FirstOrDefault()?.TrackingNumber ?? "-";
        }
    }
}