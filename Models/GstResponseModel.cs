namespace VivekMedicalProducts.Models
{
    public class GstResponseModel
    {
            public int Id { get; set; }   // Primary Key

            public string gstin { get; set; }
            public string lgnm { get; set; }
            public string tradeNam { get; set; }
            public string sts { get; set; }
            public string rgdt { get; set; }
            public string ctb { get; set; }
            public string stj { get; set; }
        public bool flag { get; set; }
        public string message { get; set; }
        public GstResponseModel data { get; set; }

    }
}
