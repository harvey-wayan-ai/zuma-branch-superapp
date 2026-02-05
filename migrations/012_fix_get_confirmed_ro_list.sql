CREATE OR REPLACE FUNCTION public.get_confirmed_ro_list()
RETURNS TABLE(
    ro_id character varying, 
    store_name character varying, 
    dnpb_number character varying, 
    article_code character varying, 
    article_name text, 
    total_items bigint, 
    total_selisih bigint, 
    confirmed_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT 
    r.ro_id,
    r.store_name,
    r.dnpb_number,
    MAX(r.article_code) as article_code,
    MAX(r.article_name) as article_name,
    COUNT(*) as total_items,
    SUM(r.selisih) as total_selisih,
    MAX(r.received_at) as confirmed_at
  FROM branch_super_app_clawdbot.ro_receipt r
  WHERE r.received_at IS NOT NULL
  GROUP BY r.ro_id, r.store_name, r.dnpb_number
  ORDER BY MAX(r.received_at) DESC;
$function$;
