using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

namespace VivekMedicalProducts.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(ApplicationDbContext context,
                               UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public IActionResult AdminHome()
        {
            return View();
        }

        // =========================
        // ADMIN DASHBOARD
        // =========================

        public async Task<IActionResult> AdminOrders()
        {
            var orders = await _context.AdminOrders
                .FromSqlRaw("EXEC GetAdminOrderDashboard")
                .AsNoTracking()
                .ToListAsync();

            return View(orders);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateOrder([FromBody] AdminOrderModel model)
        {
            try
            {
                var parameters = new[]
                {
            new SqlParameter("@OrderId", model.OrderId),
            new SqlParameter("@OrderItemId", model.OrderItemId),
            new SqlParameter("@OrderStatus", model.ItemStatus),
            new SqlParameter("@PaymentStatus", model.PaymentStatus)
        };

                await _context.Database.ExecuteSqlRawAsync(
                    "EXEC UpdateAdminOrder @OrderId,@OrderItemId,@OrderStatus,@PaymentStatus",
                    parameters);

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetOrderDetails(int id)
        {
            var order = await (
                from o in _context.Orders
                join oi in _context.OrderItems
                    on o.OrderId equals oi.OrderId into orderItems
                from oi in orderItems.DefaultIfEmpty()   // LEFT JOIN

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
            ).FirstOrDefaultAsync();   // IMPORTANT (single record)

            if (order == null)
            {
                return Json(new { success = false });
            }

            return Json(order);
        }
    }
}
