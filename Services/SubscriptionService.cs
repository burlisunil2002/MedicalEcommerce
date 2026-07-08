namespace VivekMedicalProducts.Services
{
    public class SubscriptionService
    {
        public (int years, decimal amount) CalculatePrice(string plan, string range)
        {
            var pricing = new Dictionary<string, Dictionary<string, decimal>>
            {
                ["1-5"] = new() { { "basic", 2999 }, { "pro", 3999 }, { "ent", 4999 } },
                ["6-10"] = new() { { "basic", 3999 }, { "pro", 5499 }, { "ent", 6999 } },
                ["11-15"] = new() { { "basic", 4999 }, { "pro", 7999 }, { "ent", 8999 } },
                ["16-20"] = new() { { "basic", 5999 }, { "pro", 9499 }, { "ent", 10999 } },
                ["20+"] = new() { { "basic", 6999 }, { "pro", 9999 }, { "ent", 12999 } }
            };

            int years = plan switch
            {
                "basic" => 1,
                "pro" => 2,
                "ent" => 3,
                _ => 1
            };

            var amount = pricing.ContainsKey(range) && pricing[range].ContainsKey(plan)
                ? pricing[range][plan]
                : 0;

            return (years, amount);
        }
    }
}
