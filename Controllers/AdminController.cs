using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.Services;

namespace VivekMedicalProducts.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly InvoiceService _invoiceService;
        private readonly EmailService _emailService;

        public AdminController(
            ApplicationDbContext context,
            InvoiceService invoiceService,
            EmailService emailService)
        {
            _context = context;
            _invoiceService = invoiceService;
            _emailService = emailService;
        }

        // =========================
        // ADMIN HOME
        // =========================
        public IActionResult AdminHome()
        {
            return View();
        }

        // =========================
        // ADMIN ORDERS (NO SP)
        // =========================
        public async Task<IActionResult> AdminOrders(int page=1)
        {
            int pageSize = 20;
            try
            {
                var sql = @"
            SELECT
                o.""OrderId"",
                i.""OrderItemId"",
                o.""OrderDate"",
                a.""UserName"" AS ""Customer"",
                pd.""Name"" AS ""ProductName"",
                i.""Quantity"",
                o.""GrandTotal"",
                COALESCE(o.""RazorpayPaymentId"", '-') AS ""RazorpayPaymentId"",
                COALESCE(o.""PaymentStatus"", 'Pending') AS ""PaymentStatus"",
                o.""OrderStatus"" AS ""OrderStatus""
            FROM ""OrderItems"" i
            LEFT JOIN ""Orders"" o ON i.""OrderId"" = o.""OrderId""
            LEFT JOIN ""AspNetUsers"" a ON o.""UserId"" = a.""Id""
            LEFT JOIN ""Products"" pd ON i.""ProductId"" = pd.""Id""
            LEFT JOIN ""Payments"" p ON o.""OrderId"" = p.""OrderId""
            ORDER BY o.""OrderDate"" DESC
        ";

                var orders = await _context.Set<AdminOrderModel>()
    .FromSqlRaw(sql)
    .AsNoTracking()
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();

                return View(orders);
            }
            catch (Exception ex)
            {
                // log error if needed
                return View("Error", ex);
            }
        }

        // =========================
        // UPDATE ORDER
        // =========================

        [HttpPost]
        public async Task<IActionResult> UpdateOrder([FromBody] OrderModel model)
        {
            if (model == null || model.OrderId == 0)
                return Json(new { success = false, message = "Invalid request" });

            try
            {
                var order = await _context.Orders
                    .FirstOrDefaultAsync(x => x.OrderId == model.OrderId);

                if (order == null)
                    return Json(new { success = false, message = "Order not found" });

                // ✅ No change
                if (order.OrderStatus == model.OrderStatus)
                {
                    return Json(new { success = true, message = "No changes" });
                }

                // ✅ Update ORDER STATUS
                order.OrderStatus = model.OrderStatus;
                order.OrderModifiedDate = DateTime.UtcNow;

                _context.Orders.Update(order);

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Order status updated successfully"
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // =========================
        // ORDER DETAILS (MODAL)
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetOrderDetails(int id)
        {
            var order = await (
                from o in _context.Orders
                join oi in _context.OrderItems
                    on o.OrderId equals oi.OrderId into orderItems
                from oi in orderItems.DefaultIfEmpty()

                where o.OrderId == id

                select new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.FullName,
                    o.PhoneNumber,
                    o.Address,
                    o.City,
                    o.Pincode,

                    Quantity = oi != null ? oi.Quantity : 0,
                    ItemStatus = oi != null ? oi.ItemStatus : "Pending"
                }
            ).FirstOrDefaultAsync();

            if (order == null)
                return Json(new { success = false });

            return Json(new { success = true, data = order });
        }
    }
}