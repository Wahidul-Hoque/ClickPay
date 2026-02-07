const { supabase } = require('./db');

async function runDemo() {
  try {
    console.log('Starting Supabase Demo...\n');

    // ========================================
    // 1. USERS TABLE
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('1. USERS TABLE');
    console.log('='.repeat(70));

    // Insert Users
    const usersData = [
      { name: 'Alice Rahman', phone: '01711111111', nid: 'NID001', epin_hash: 'hash123', role: 'user', status: 'active' },
      { name: 'Bob Ahmed', phone: '01722222222', nid: 'NID002', epin_hash: 'hash456', role: 'user', status: 'active' },
      { name: 'Charlie Khan', phone: '01733333333', nid: 'NID003', epin_hash: 'hash789', role: 'agent', status: 'active' },
      { name: 'Diana Sultana', phone: '01744444444', nid: 'NID004', epin_hash: 'hash101', role: 'admin', status: 'active' },
      { name: 'Evan Hossain', phone: '01755555555', nid: 'NID005', epin_hash: 'hash102', role: 'user', status: 'active' }
    ];

    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .insert(usersData)
      .select();

    if (insertError) {
      console.error('❌ Error inserting users:', insertError);
    } else {
      console.log(`✅ Inserted ${insertedUsers.length} users`);
    }

    // Fetch Users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('user_id, name, phone, role, status');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
    } else {
      console.log('\n📋 Users:');
      console.log('-'.repeat(70));
      console.log('ID\tName\t\t\tPhone\t\t\tRole\tStatus');
      console.log('-'.repeat(70));
      users.forEach(user => {
        console.log(`${user.user_id}\t${user.name}\t\t${user.phone}\t\t${user.role}\t${user.status}`);
      });
    }

    // ========================================
    // 2. WALLETS TABLE
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('2. WALLETS TABLE');
    console.log('='.repeat(70));

    const walletsData = [
      { user_id: 1, wallet_type: 'user', system_purpose: null, balance: 5000.00, status: 'active' },
      { user_id: 2, wallet_type: 'user', system_purpose: null, balance: 10000.00, status: 'active' },
      { user_id: 3, wallet_type: 'agent', system_purpose: null, balance: 50000.00, status: 'active' },
      { user_id: 4, wallet_type: 'system', system_purpose: 'fee_revenue', balance: 100000.00, status: 'active' },
      { user_id: 4, wallet_type: 'system', system_purpose: 'loan_pool', balance: 500000.00, status: 'active' },
      { user_id: 5, wallet_type: 'user', system_purpose: null, balance: 2500.00, status: 'active' }
    ];

    const { data: insertedWallets, error: walletsInsertError } = await supabase
      .from('wallets')
      .insert(walletsData)
      .select();

    if (walletsInsertError) {
      console.error('❌ Error inserting wallets:', walletsInsertError);
    } else {
      console.log(`✅ Inserted ${insertedWallets.length} wallets`);
    }

    // Fetch Wallets
    const { data: wallets, error: walletsFetchError } = await supabase
      .from('wallets')
      .select('wallet_id, user_id, wallet_type, system_purpose, balance, status');

    if (walletsFetchError) {
      console.error('❌ Error fetching wallets:', walletsFetchError);
    } else {
      console.log('\n📋 Wallets:');
      console.log('-'.repeat(70));
      console.log('WalletID\tUserID\tType\t\tPurpose\t\t\tBalance\t\tStatus');
      console.log('-'.repeat(70));
      wallets.forEach(w => {
        console.log(`${w.wallet_id}\t\t${w.user_id}\t${w.wallet_type}\t\t${w.system_purpose || 'N/A'}\t\t\t${w.balance}\t\t${w.status}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ DEMO COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}

// Run the demo
runDemo();