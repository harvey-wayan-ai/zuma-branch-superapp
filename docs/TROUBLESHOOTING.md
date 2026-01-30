# Troubleshooting Guide

## Supabase Query Returns Incomplete Data

### Problem
Supabase JS client has a **default max of 1000 rows** per query, even if you set `limit(5000)`.

When trying to get distinct values from a large table (e.g., 2527 rows), only values from the first 1000 rows are returned.

### Symptoms
- `SELECT DISTINCT` equivalent returns partial results
- Missing data that exists later in the table
- Query shows no error but incomplete results

### Solution
**Paginate through all rows using `.range()`:**

```typescript
const allItems = new Set<string>();
let page = 0;
const pageSize = 1000;
let hasMore = true;

while (hasMore) {
  const { data, error } = await supabase
    .from('table_name')
    .select('"Column Name"')
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  if (!data || data.length === 0) {
    hasMore = false;
  } else {
    data.forEach((r: any) => {
      const val = r['Column Name'];
      if (val) allItems.add(val);
    });
    if (data.length < pageSize) hasMore = false;
    page++;
  }
}

const uniqueItems = Array.from(allItems).sort();
```

### Alternative Solutions
1. Create a PostgreSQL function/RPC with `SELECT DISTINCT`
2. Create a database VIEW with distinct values
3. Use raw SQL via `supabase.rpc()`

---

## Column Names with Spaces

### Problem
Supabase tables imported from CSV may have column names with spaces (e.g., "Store Name", "Article Mix").

### Solution
Use quotes in select: `.select('"Store Name"')`
Access with bracket notation: `row['Store Name']`

---

## Schema Permission Denied

### Problem
Custom schema (e.g., `branch_super_app_clawdbot`) returns "permission denied".

### Solution
Run in Supabase SQL editor:
```sql
GRANT USAGE ON SCHEMA schema_name TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA schema_name TO anon, authenticated, service_role;
```
