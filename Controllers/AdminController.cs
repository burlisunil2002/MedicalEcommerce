using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;

namespace VivekMedicalProducts.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var totalProducts =
                await _context.Products.CountAsync();

            var totalOrders =
                await _context.Orders.CountAsync();

            var totalUsers =
                await _context.Users.CountAsync();

            var completedOrderItemsQuery =
    _context.OrderItems
        .Where(item =>
            item.Order.PaymentStatus == "Completed" &&
            item.OrderItemStatus == "Delivered");

            var completedItems =
                await completedOrderItemsQuery.CountAsync();

            var totalOrderItems =
                await _context.OrderItems.CountAsync();

            var pendingItems =
                totalOrderItems - completedItems;

            var revenue =
                await completedOrderItemsQuery
                    .SumAsync(item =>
                        (decimal?)item.FinalPaidAmount) ?? 0;

            var completedPayments =
                await _context.OrderItems
                    .CountAsync(item =>
                        item.Order.PaymentStatus == "Completed");

            var failedPayments =
                await _context.OrderItems
                    .CountAsync(item =>
                        item.Order.PaymentStatus == "Failed");

            var refundedPayments =
                await _context.OrderItems
                    .CountAsync(item =>
                        item.Order.PaymentStatus == "Refunded");

            var deliveredItems =
                await _context.OrderItems
                    .CountAsync(item =>
                        item.OrderItemStatus == "Delivered");

            var shippedItems =
                await _context.OrderItems
                    .CountAsync(item =>
                        item.OrderItemStatus == "Shipped");

            var outForDeliveryItems =
                await _context.OrderItems
                    .CountAsync(item =>
                        item.OrderItemStatus == "OutForDelivery");

            return Ok(new
            {
                totalProducts,
                totalOrders,
                totalUsers,

                revenue,

                totalOrderItems,
                completedItems,
                pendingItems,

                completedPayments,
                failedPayments,
                refundedPayments,

                deliveredItems,
                shippedItems,
                outForDeliveryItems
            });
        }
    }
}