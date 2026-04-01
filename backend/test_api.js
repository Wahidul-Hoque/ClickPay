async function runApiTest() {
  const SENDER_PHONE = '01813639241';
  const EPIN = '1234';
  const RECEIVER_PHONE = '01722222222';
  
  console.log('Logging in...');
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: SENDER_PHONE, epin: EPIN })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  
  const token = loginData.data.token;
  console.log('Token acquired:', token.slice(0, 10) + '...');
  
  console.log('Sending money...');
  const txnRes = await fetch('http://localhost:5000/api/v1/transactions/send', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      toPhone: RECEIVER_PHONE,
      amount: 100,
      epin: EPIN
    })
  });

  const status = txnRes.status;
  const text = await txnRes.text();
  console.log(`Status: ${status}`);
  console.log(`Response: ${text}`);

  process.exit();
}
runApiTest();
