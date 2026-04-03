using System.Security.Claims;

public interface IUserContextService
{
    string GetUserId();
}

public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetUserId()
    {
        var context = _httpContextAccessor.HttpContext;

        if (context == null)
            return null;

        // ✅ Logged-in user
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            return context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // ✅ Guest user (session)
        if (string.IsNullOrEmpty(context.Session.Id))
        {
            context.Session.SetString("Init", "1"); // ensure session created
        }

        return context.Session.Id;
    }
}