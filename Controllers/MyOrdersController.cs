using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.ViewModels;


namespace VivekMedicalProducts.Controllers
{
    public class MyOrdersController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContextService _userContext;


        public MyOrdersController(ApplicationDbContext context, IUserContextService userContext)
        {
            _context = context;
            _userContext = userContext;
        }

        public async Task<IActionResult> Index()
        {
            string userId = _userContext.GetUserId();

            var orders = await (from o in _context.Orders
                                join i in _context.OrderItems on o.OrderId equals i.OrderId
                                join pd in _context.Products on i.ProductId equals pd.Id
                                where o.UserId == userId
                                orderby o.OrderDate descending
                                select new MyOrderViewModel
                                {
                                    OrderId = o.OrderId,
                                    OrderDate = o.OrderDate,
                                    ProductName = pd.Name ?? "",
                                    ProductImage = pd.ImagePath ?? "",
                                    Quantity = i.Quantity,
                                    Total = o.GrandTotal, // 🔥 FIX
                                    ItemStatus = i.ItemStatus ?? "Pending",
                                    PaymentStatus = o.PaymentStatus ?? "Pending" // 🔥 FIX
                                }).ToListAsync();

            return View(orders);
        }


    }
}