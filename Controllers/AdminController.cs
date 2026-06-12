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

        [HttpGet("admin-dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var totalProducts =
                await _context.Products.CountAsync();

            var totalOrders =
                await _context.Orders.CountAsync();

            var totalUsers =
                await _context.Users.CountAsync();

            var revenue =
                await _context.Orders
                    .Where(x =>
                        x.PaymentStatus == "Completed")
                    .SumAsync(x =>
                        (decimal?)x.GrandTotal) ?? 0;

            return Ok(new
            {
                totalProducts,
                totalOrders,
                totalUsers,
                revenue
            });
        }
    }
}