using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Razorpay.Api;
using VivekMedicalProducts.Data;
using VivekMedicalProducts.Models;

public class RazorPaymentController : Controller
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly IUserContextService _userContext;


    public RazorPaymentController(IConfiguration config, ApplicationDbContext context, IUserContextService userContext)
    {
        _config = config;
        _context = context;
        _userContext = userContext;
    }

    [HttpPost]
    [HttpPost]
    public IActionResult CreateOrder()
    {
        string userId = _userContext.GetUserId();

        var carts = _context.Carts
            .Include(c => c.Product)
            .Where(c => c.UserId == userId || c.SessionId == userId)
            .ToList();

        if (carts == null || !carts.Any())
            return BadRequest("Cart is empty");

        var total = carts.Sum(x => x.Product.Price * x.Quantity);

        // ✅ GET ADDRESS FROM SESSION
        var addressJson = HttpContext.Session.GetString("Address");

        if (string.IsNullOrEmpty(addressJson))
            return BadRequest("Address missing");

        var addressData = JsonConvert.DeserializeObject<OrderModel>(addressJson);

        // ✅ CREATE ORDER
        var order = new OrderModel
        {
            UserId = userId,
            FullName = addressData.FullName,
            Address = addressData.Address,
            City = addressData.City,
            Pincode = addressData.Pincode,
            PhoneNumber = addressData.PhoneNumber,

            OrderNumber = Guid.NewGuid().ToString(),
            GrandTotal = total,
            OrderStatus = "Pending",
            PaymentStatus = "Created"
        };

        _context.Orders.Add(order);
        _context.SaveChanges();

        // ✅ RAZORPAY
        var client = new RazorpayClient(
            _config["Razorpay:Key"],
            _config["Razorpay:Secret"]);

        var options = new Dictionary<string, object>
        {
            { "amount", (int)(total * 100) },
            { "currency", "INR" },
            { "receipt", order.OrderNumber }
        };

        var razorOrder = client.Order.Create(options);

        order.RazorpayOrderId = razorOrder["id"].ToString();
        _context.SaveChanges();

        return Json(new
        {
            orderId = order.OrderId,
            razorpayOrderId = order.RazorpayOrderId,
            amount = total * 100
        });
    }

    [HttpPost]
    public IActionResult VerifyPayment([FromBody] dynamic model)
    {
        var attributes = new Dictionary<string, string>
        {
            { "razorpay_payment_id", model.razorpay_payment_id },
            { "razorpay_order_id", model.razorpay_order_id },
            { "razorpay_signature", model.razorpay_signature }
        };

        try
        {
            Razorpay.Api.Utils.verifyPaymentSignature(attributes);

            var order = _context.Orders.Find((int)model.orderId);

            if (order == null)
                return Json(new { success = false });

            order.PaymentStatus = "Success";
            order.OrderStatus = "Confirmed";
            order.IsPaymentVerified = true;
            order.PaymentVerifiedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Json(new { success = true });
        }
        catch
        {
            return Json(new { success = false });
        }
    }
}