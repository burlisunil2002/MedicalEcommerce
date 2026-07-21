using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VivekMedicalProducts.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOrderArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderStatus",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SellerId",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "ReturnStatus",
                table: "Orders",
                newName: "PaymentMethod");

            migrationBuilder.RenameColumn(
                name: "DeliveredDate",
                table: "Orders",
                newName: "PaymentDate");

            migrationBuilder.RenameColumn(
                name: "ItemStatus",
                table: "OrderItems",
                newName: "RefundStatus");

            migrationBuilder.AddColumn<string>(
                name: "CouponCode",
                table: "PaymentSessions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CouponDiscount",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "CouponId",
                table: "PaymentSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "PaymentSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "GSTAmount",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PaymentSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "PaymentSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRetryDate",
                table: "PaymentSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentGateway",
                table: "PaymentSessions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "PaymentSessions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ProductDiscount",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundAmount",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "RefundCompleted",
                table: "PaymentSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundDate",
                table: "PaymentSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RefundInitiated",
                table: "PaymentSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RefundTransactionId",
                table: "PaymentSessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RetryCount",
                table: "PaymentSessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingCharge",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SubTotal",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxableAmount",
                table: "PaymentSessions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDate",
                table: "PaymentSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Remarks",
                table: "OrderReturns",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "OrderReturns",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "AdminRemarks",
                table: "OrderReturns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "OrderReturns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderItemId",
                table: "OrderReturns",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupScheduledDate",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedDate",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundAmount",
                table: "OrderReturns",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundCompletedDate",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundInitiatedDate",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundTransactionId",
                table: "OrderReturns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedDate",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "OrderReturns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "OrderReturns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CourierPartner",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderItemStatus",
                table: "OrderItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "OutForDeliveryDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PackedDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ShippedDate",
                table: "OrderItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingNumber",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RazorpayPaymentId",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "AdminOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProductName",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OrderStatus",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "GrandTotal",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Customer",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CouponDiscountAmount",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CourierPartner",
                table: "AdminOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredDate",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FinalPaidAmount",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GSTAmount",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GSTPercentage",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsReturnEligible",
                table: "AdminOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "LineTotal",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "OrderNumber",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "OutForDeliveryDate",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PackedDate",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "AdminOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnEligibleTill",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnStatus",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ShippedDate",
                table: "AdminOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxableAmount",
                table: "AdminOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TrackingNumber",
                table: "AdminOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VariantName",
                table: "AdminOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_OrderReturns_OrderItemId",
                table: "OrderReturns",
                column: "OrderItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderReturns_OrderItems_OrderItemId",
                table: "OrderReturns",
                column: "OrderItemId",
                principalTable: "OrderItems",
                principalColumn: "OrderItemId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderReturns_OrderItems_OrderItemId",
                table: "OrderReturns");

            migrationBuilder.DropIndex(
                name: "IX_OrderReturns_OrderItemId",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "CouponCode",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "CouponDiscount",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "CouponId",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "GSTAmount",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "LastRetryDate",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "PaymentGateway",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "ProductDiscount",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "RefundAmount",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "RefundCompleted",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "RefundDate",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "RefundInitiated",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "RefundTransactionId",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "RetryCount",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "ShippingCharge",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "SubTotal",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "TaxableAmount",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "UpdatedDate",
                table: "PaymentSessions");

            migrationBuilder.DropColumn(
                name: "AdminRemarks",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "OrderItemId",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "PickupScheduledDate",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "ReceivedDate",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "RefundAmount",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "RefundCompletedDate",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "RefundInitiatedDate",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "RefundTransactionId",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "RejectedDate",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "OrderReturns");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "CourierPartner",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DeliveredDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "OrderItemStatus",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "OutForDeliveryDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "PackedDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ShippedDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "TrackingNumber",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "CouponDiscountAmount",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "CourierPartner",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "DeliveredDate",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "FinalPaidAmount",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "GSTAmount",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "GSTPercentage",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "IsReturnEligible",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "LineTotal",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "OutForDeliveryDate",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "PackedDate",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "ReturnEligibleTill",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "ReturnStatus",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "ShippedDate",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "TaxableAmount",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "TrackingNumber",
                table: "AdminOrders");

            migrationBuilder.DropColumn(
                name: "VariantName",
                table: "AdminOrders");

            migrationBuilder.RenameColumn(
                name: "PaymentMethod",
                table: "Orders",
                newName: "ReturnStatus");

            migrationBuilder.RenameColumn(
                name: "PaymentDate",
                table: "Orders",
                newName: "DeliveredDate");

            migrationBuilder.RenameColumn(
                name: "RefundStatus",
                table: "OrderItems",
                newName: "ItemStatus");

            migrationBuilder.AlterColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderStatus",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SellerId",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Remarks",
                table: "OrderReturns",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "OrderReturns",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "RazorpayPaymentId",
                table: "AdminOrders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "AdminOrders",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "ProductName",
                table: "AdminOrders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "AdminOrders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "OrderStatus",
                table: "AdminOrders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<decimal>(
                name: "GrandTotal",
                table: "AdminOrders",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Customer",
                table: "AdminOrders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
