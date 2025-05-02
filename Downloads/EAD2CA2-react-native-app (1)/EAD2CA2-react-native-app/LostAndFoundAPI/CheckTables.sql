SELECT 
    t.name AS TableName,
    s.name AS SchemaName
FROM 
    sys.tables t
INNER JOIN 
    sys.schemas s ON t.schema_id = s.schema_id
ORDER BY 
    s.name, t.name; 