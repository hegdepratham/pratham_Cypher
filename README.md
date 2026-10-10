# Challenge 01 – The Spare Parts Desk
**Kaveri Spares & Hydraulics**  ·  Data snapshot: morning of 2026-11-16 (stock); history up to 2026-11-15

## Files

### `inventory.csv`  (1,008 rows)

`sku`, `location`, `stock`

### `products.csv`  (126 rows)

`sku`, `product_name`, `machine_model`, `category`

### `purchase_orders.csv`  (43 rows)

`po`, `supplier`, `sku`, `qty`, `expected_date`, `status`

### `sales.csv`  (12,777 rows)

`date`, `sku`, `location`, `qty_sold`

### `suppliers.csv`  (205 rows)

`supplier`, `sku`, `price`, `lead_time_days`, `moq`

## Notes

- `sales.csv` only lists days with at least one sale; a missing day means zero sales.
- `location` includes six stores and two warehouses (Belgaum WH, Hubli WH).
- Prices are in ₹ per unit.

At hour 14 an updated version of one of these files will be released. Same columns, same format.
