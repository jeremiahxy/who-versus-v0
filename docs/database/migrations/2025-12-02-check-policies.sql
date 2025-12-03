-- Quick check: What policies are actually on the versus table?
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'versus'
ORDER BY cmd, policyname;

