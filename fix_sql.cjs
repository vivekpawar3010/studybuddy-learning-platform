const fs = require('fs');
let sql = fs.readFileSync('supabase_schema.sql', 'utf8');

// The goal is to make all CREATE POLICY statements idempotent.
// Avoid duplicating DROP POLICY IF EXISTS if it's already there.
if (!sql.includes('DROP POLICY IF EXISTS')) {
    sql = sql.replace(/CREATE POLICY "([^"]+)" ON ([a-zA-Z_]+) FOR/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2 FOR');
    fs.writeFileSync('supabase_schema.sql', sql);
    console.log('Successfully made all SQL policies idempotent.');
} else {
    console.log('SQL policies are already idempotent.');
}
