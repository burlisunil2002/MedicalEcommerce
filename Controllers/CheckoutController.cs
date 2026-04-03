using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;
using VivekMedicalProducts.ViewModels;

[Authorize]
public class CheckoutController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUserContextService _userContext;

    public CheckoutController(ApplicationDbContext context,
                              UserManager<ApplicationUser> userManager, IUserContextService userContext)
    {
        _context = context;
        _userManager = userManager;
        _userContext = userContext;

    }

    public async Task<IActionResult> Index()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var cartItems = await _context.Carts
            .Include(c => c.Product)
            .Where(c => c.UserId == userId)
            .ToListAsync();

        if (!cartItems.Any())
        {
            return RedirectToAction("Index", "Cart");
        }

        decimal subtotal = 0;
        decimal gstTotal = 0;

        foreach (var item in cartItems)
        {
            decimal itemTotal = item.Product.Price * item.Quantity;

            subtotal += itemTotal;

            decimal gstAmount = itemTotal * (item.Product.GSTPercentage / 100m);

            gstTotal += gstAmount;
        }

        CheckoutViewModel vm = new CheckoutViewModel
        {
            CartItems = cartItems,
            SubTotal = subtotal,
            GST = gstTotal,
            GrandTotal = subtotal + gstTotal
        };

        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ProceedToPayment(OrderModel model)
    {
        string userId = _userContext.GetUserId();

        var cartItems = await _context.Carts
            .Include(c => c.Product)
            .Where(c => c.UserId == userId)
            .ToListAsync();

        if (!cartItems.Any())
        {
            return RedirectToAction("Index", "Cart");
        }

        decimal subtotal = 0;
        decimal gstTotal = 0;

        foreach (var item in cartItems)
        {
            decimal itemTotal = item.Product.Price * item.Quantity;
            subtotal += itemTotal;

            decimal gstAmount = itemTotal * (item.Product.GSTPercentage / 100m);
            gstTotal += gstAmount;
        }

        // 1️⃣ CREATE ORDER
        var order = new OrderModel
        {
            UserId = userId,

            FullName = model.FullName,
            PhoneNumber = model.PhoneNumber,
            Address = model.Address,
            City = model.City,
            Pincode = model.Pincode,

            SubTotal = subtotal,
            GST = gstTotal,
            GrandTotal = subtotal + gstTotal,

            OrderStatus = "Pending",
            OrderDate = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();



        // 2️⃣ SAVE ORDER ITEMS
        foreach (var item in cartItems)
        {
            OrderItemModel orderItem = new OrderItemModel
            {
                OrderId = order.OrderId,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                Price = item.Product.Price
            };

            _context.OrderItems.Add(orderItem);
        }

        await _context.SaveChangesAsync();



        // 3️⃣ CLEAR CART
        _context.Carts.RemoveRange(cartItems);
        await _context.SaveChangesAsync();



        // 4️⃣ REDIRECT TO PAYMENT
        return RedirectToAction("Index", "Payment", new { orderId = order.OrderId });
    }
}