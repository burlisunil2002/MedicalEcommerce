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
        public async Task<IActionResult> AdminOrders()
        {
            var orders = await (
                from i in _context.OrderItems
                join o in _context.Orders on i.OrderId equals o.OrderId
                join u in _context.Users on o.UserId equals u.Id
                join p in _context.Payments on o.OrderId equals p.OrderId into payments
                from p in payments.DefaultIfEmpty()
                join pd in _context.Products on i.ProductId equals pd.Id

                orderby o.OrderDate descending

                select new AdminOrderModel
                {
                    OrderId = o.OrderId,
                    OrderItemId = i.OrderItemId,
                    OrderDate = o.OrderDate,
                    Customer = u.CustomerName,

                    ProductName = pd.Name,
                    Quantity = i.Quantity,
                    Total = p != null ? p.Amount : 0,

                    PaymentStatus = p != null ? p.PaymentStatus : "Pending",
                    PaymentVerifiedDate = p != null ? p.VerifiedDate : null,

                    ItemStatus = i.ItemStatus,
                    ItemOrderModifiedDate = i.ItemOrderModifiedDate
                }
            )
            .AsNoTracking() // ✅ performance improvement
            .ToListAsync();

            return View(orders);
        }

        // =========================
        // UPDATE ORDER
        // =========================
        [HttpPost]
        public async Task<IActionResult> UpdateOrder([FromBody] AdminOrderModel model)
        {
            if (model == null)
                return Json(new { success = false, message = "Invalid data" });

            try
            {
                // 🔍 Get Order Item
                var orderItem = await _context.OrderItems
                    .FirstOrDefaultAsync(x => x.OrderItemId == model.OrderItemId);

                if (orderItem == null)
                    return Json(new { success = false, message = "Order item not found" });

                // ✅ Update item status
                orderItem.ItemStatus = model.ItemStatus ?? "Pending";
                orderItem.ItemOrderModifiedDate = DateTime.UtcNow;

                // 🔍 Update payment
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(x => x.OrderId == model.OrderId);

                if (payment != null)
                {
                    payment.PaymentStatus = model.PaymentStatus ?? "Pending";
                    payment.VerifiedDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // =========================
                // CHECK IF ALL ITEMS DELIVERED
                // =========================
                var allDelivered = await _context.OrderItems
                    .Where(x => x.OrderId == model.OrderId)
                    .AllAsync(x => x.ItemStatus == "Delivered");

                if (allDelivered)
                {
                    var order = await _context.Orders
                        .Include(o => o.OrderItems)
                        .FirstOrDefaultAsync(o => o.OrderId == model.OrderId);

                    if (order != null)
                    {
                        // ✅ Avoid duplicate email sending
                        if (order.OrderStatus != "Confirmed")
                        {
                            order.OrderStatus = "Confirmed";
                            order.PaymentStatus = "Completed";

                            await _context.SaveChangesAsync();

                            // 🔥 Generate invoice
                            var html = _invoiceService.GenerateInvoiceHtml(order);

                            // 🔥 Send email
                            await _emailService.SendInvoiceEmailAsync(
                                order.Email,
                                html
                            );
                        }
                    }
                }

                return Json(new { success = true });
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