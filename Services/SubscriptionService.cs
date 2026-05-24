namespace VivekMedicalProducts.Services
{
    public class SubscriptionService
    {
        public (int years, decimal amount) CalculatePrice(string plan, string range)
        {
            var pricing = new Dictionary<string, Dictionary<string, decimal>>
            {
                ["1-5"] = new() { { "basic", 10 }, { "pro", 19 }, { "ent", 27 } },
                ["6-10"] = new() { { "basic", 15 }, { "pro", 28 }, { "ent", 40 } },
                ["11-15"] = new() { { "basic", 20 }, { "pro", 37 }, { "ent", 52 } },
                ["16-20"] = new() { { "basic", 25 }, { "pro", 46 }, { "ent", 65 } },
                ["20+"] = new() { { "basic", 30 }, { "pro", 55 }, { "ent", 78 } }
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
