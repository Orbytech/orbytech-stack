use soroban_sdk::{Address, Env, String};
use crate::{PaymentContract, PaymentStatus};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let config = client.get_config();
    assert_eq!(config.admin, admin);
    assert_eq!(config.fee_recipient, fee_recipient);
    assert_eq!(config.fee_rate, fee_rate);
    assert_eq!(config.minimum_deposit, minimum_deposit);
    assert_eq!(config.is_paused, false);
}

#[test]
fn test_deposit() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let user = Address::random(&env);
    let token = Address::random(&env);
    let amount = 10000i128;

    let payment_id = client.deposit(&user, &token, &amount);

    // Check user balance (should be amount - fee)
    let user_balance = client.get_balance(&user, &token);
    assert_eq!(user_balance, 9900i128); // 10000 - 100 (1% fee)

    // Check fee recipient balance
    let fee_balance = client.get_balance(&fee_recipient, &token);
    assert_eq!(fee_balance, 100i128); // 1% fee

    // Check payment record
    let payment = client.get_payment(&payment_id);
    assert_eq!(payment.from, user);
    assert_eq!(payment.to, contract_id);
    assert_eq!(payment.amount, amount);
    assert_eq!(payment.token, token);
    assert_eq!(payment.status, PaymentStatus::Completed);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let sender = Address::random(&env);
    let recipient = Address::random(&env);
    let token = Address::random(&env);
    let amount = 10000i128;

    // First deposit to give sender some balance
    client.deposit(&sender, &token, &20000i128);

    // Transfer from sender to recipient
    let payment_id = client.transfer(
        &sender,
        &recipient,
        &token,
        &amount,
        &Some(String::from_str(&env, "Test transfer")),
    );

    // Check balances
    let sender_balance = client.get_balance(&sender, &token);
    assert_eq!(sender_balance, 9900i128); // 20000 - 10000 - 100 (fee)

    let recipient_balance = client.get_balance(&recipient, &token);
    assert_eq!(recipient_balance, 9900i128); // 10000 - 100 (fee)

    let fee_balance = client.get_balance(&fee_recipient, &token);
    assert_eq!(fee_balance, 200i128); // 100 from deposit + 100 from transfer

    // Check payment record
    let payment = client.get_payment(&payment_id);
    assert_eq!(payment.from, sender);
    assert_eq!(payment.to, recipient);
    assert_eq!(payment.amount, amount);
    assert_eq!(payment.token, token);
    assert_eq!(payment.memo, Some(String::from_str(&env, "Test transfer")));
    assert_eq!(payment.status, PaymentStatus::Completed);
}

#[test]
fn test_withdraw() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let user = Address::random(&env);
    let token = Address::random(&env);
    let deposit_amount = 20000i128;
    let withdraw_amount = 10000i128;

    // Deposit first
    client.deposit(&user, &token, &deposit_amount);

    // Withdraw
    let payment_id = client.withdraw(&user, &token, &withdraw_amount);

    // Check final balance
    let user_balance = client.get_balance(&user, &token);
    assert_eq!(user_balance, 9800i128); // 19800 - 10000 - 100 (withdrawal fee)

    let fee_balance = client.get_balance(&fee_recipient, &token);
    assert_eq!(fee_balance, 200i128); // 100 from deposit + 100 from withdrawal

    // Check payment record
    let payment = client.get_payment(&payment_id);
    assert_eq!(payment.from, contract_id);
    assert_eq!(payment.to, user);
    assert_eq!(payment.amount, withdraw_amount);
    assert_eq!(payment.token, token);
    assert_eq!(payment.memo, Some(String::from_str(&env, "Withdrawal")));
    assert_eq!(payment.status, PaymentStatus::Completed);
}

#[test]
#[should_panic(expected = "Insufficient balance")]
fn test_transfer_insufficient_balance() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let sender = Address::random(&env);
    let recipient = Address::random(&env);
    let token = Address::random(&env);
    let amount = 10000i128;

    // Try to transfer without sufficient balance
    client.transfer(&sender, &recipient, &token, &amount, &None::<String>);
}

#[test]
#[should_panic(expected = "Amount below minimum deposit")]
fn test_deposit_below_minimum() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let user = Address::random(&env);
    let token = Address::random(&env);
    let amount = 500i128; // Below minimum

    client.deposit(&user, &token, &amount);
}

#[test]
fn test_pause_functionality() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    // Pause contract
    client.emergency_pause(&admin);

    let config = client.get_config();
    assert_eq!(config.is_paused, true);

    // Try to deposit while paused (should fail)
    let user = Address::random(&env);
    let token = Address::random(&env);
    let amount = 10000i128;

    // This should panic with "Contract is paused"
    let result = std::panic::catch_unwind(|| {
        client.deposit(&user, &token, &amount);
    });
    assert!(result.is_err());

    // Unpause contract
    client.emergency_unpause(&admin);

    let config = client.get_config();
    assert_eq!(config.is_paused, false);

    // Now deposit should work
    client.deposit(&user, &token, &amount);
}

#[test]
fn test_config_update() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    // Update configuration
    let new_fee_recipient = Address::random(&env);
    let new_fee_rate = 200u32; // 2%
    let new_minimum_deposit = 2000i128;

    client.update_config(
        &admin,
        &Some(new_fee_recipient),
        &Some(new_fee_rate),
        &Some(new_minimum_deposit),
        &None::<bool>,
    );

    let config = client.get_config();
    assert_eq!(config.fee_recipient, new_fee_recipient);
    assert_eq!(config.fee_rate, new_fee_rate);
    assert_eq!(config.minimum_deposit, new_minimum_deposit);
    assert_eq!(config.is_paused, false); // Should remain unchanged
}

#[test]
#[should_panic(expected = "Only admin can update configuration")]
fn test_config_update_unauthorized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    // Try to update config with non-admin address
    let unauthorized = Address::random(&env);
    client.update_config(
        &unauthorized,
        &None::<Address>,
        &Some(200u32),
        &None::<i128>,
        &None::<bool>,
    );
}

#[test]
fn test_get_payments_by_address() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    let admin = Address::random(&env);
    let fee_recipient = Address::random(&env);
    let fee_rate = 100u32; // 1%
    let minimum_deposit = 1000i128;

    client.initialize(&admin, &fee_recipient, &fee_rate, &minimum_deposit);

    let user1 = Address::random(&env);
    let user2 = Address::random(&env);
    let token = Address::random(&env);

    // Create multiple payments
    client.deposit(&user1, &token, &10000i128);
    client.deposit(&user2, &token, &5000i128);
    client.transfer(&user1, &user2, &token, &2000i128, &None::<String>);

    // Get payments for user1
    let user1_payments = client.get_payments_by_address(&user1);
    assert_eq!(user1_payments.len(), 2); // deposit + transfer

    // Get payments for user2
    let user2_payments = client.get_payments_by_address(&user2);
    assert_eq!(user2_payments.len(), 2); // deposit + received transfer
}
