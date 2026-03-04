// simple Node script demonstrating POSTing a complex DolphinDB query
// usage: DOLPHINDB_API_URL=http://localhost:3000/api/dolphindb/quotes node scripts/test-dolphindb-query.js

const fetch = require('node-fetch');

async function run() {
  const url = process.env.DOLPHINDB_API_URL || 'http://localhost:3000/api/dolphindb/quotes';
  const body = {
    // example body structure the DolphinDB server might expect
    query: 'select * from futures where price > 0',
    symbols: ['CL=F', 'NG=F'],
    span: '1d'
  };

  console.log('POSTing to', url);
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await resp.text();
  console.log('Status', resp.status);
  console.log('Response:', text.substring(0, 2000));
}

run().catch(e=>{
  console.error('Error', e);
  process.exit(1);
});