using System.Security.Claims;

public interface IUserContextService
{
    string GetUserId();
}

    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextService(
            IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? GetUserId()
        {
            var context = _httpContextAccessor.HttpContext;

            if (context?.User?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            return context.User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );
        }
    }