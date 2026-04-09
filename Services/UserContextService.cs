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

        // ✅ ONLY return userId if logged in
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            return context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // 🔥 IMPORTANT: Guest must return NULL
        return null;
    }
}