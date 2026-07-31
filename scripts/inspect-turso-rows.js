import { createClient } from '@libsql/client';

const dbUrl = 'https://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const dbToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

const client = createClient({
  url: dbUrl,
  authToken: dbToken
});

async function main() {
  const tables = [
    'users',
    'fertilizers',
    'suppliers',
    'drivers',
    'kas_angkutan',
    'kas_umum'
  ];

  for (const table of tables) {
    console.log(`=== TABLE: ${table} ===`);
    const res = await client.execute(`SELECT * FROM ${table} LIMIT 10`);
    console.dir(res.rows, { depth: null });
  }
}

main();
