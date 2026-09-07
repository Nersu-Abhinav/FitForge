import mysql from 'mysql2/promise';

const host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
const port = 4000;
const user = '4AeoCQnaMsbV7mf.root';

const passwordVariants = [
  'PN7Wk1oaBtT71Von',
  'PN7Wk1oaBtT7lVon',
  'PN7Wk1oaBtT7IVon',
  'PN7Wk1oaBtT7LVon',
  'PN7WkloaBtT7lVon',
  'PN7WkloaBtT71Von'
];

async function test() {
  for (const pwd of passwordVariants) {
    console.log(`Trying password variant: ${pwd}`);
    try {
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password: pwd,
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: false
        }
      });
      console.log(`🎉 SUCCESS with password: ${pwd}`);
      await conn.end();
      return pwd;
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
    }
  }
}

test();
