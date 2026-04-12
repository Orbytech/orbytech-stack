use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, Env, Map, String, Symbol,
    Vec,
};

#[cfg(test)]
mod tests;

/// Data structure for storing payment information
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub id: Bytes,
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub token: Address,
    pub memo: Option<String>,
    pub timestamp: u64,
    pub status: PaymentStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
    Refunded,
}

/// Data structure for storing account balances
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Balance {
    pub address: Address,
    pub token: Address,
    pub amount: i128,
    pub last_updated: u64,
}

/// Data structure for storing contract configuration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractConfig {
    pub admin: Address,
    pub fee_recipient: Address,
    pub fee_rate: u32, // basis points (100 = 1%)
    pub minimum_deposit: i128,
    pub is_paused: bool,
}

/// Contract storage keys
const ADMIN: Symbol = Symbol::short("ADMIN");
const CONFIG: Symbol = Symbol::short("CONFIG");
const BALANCES: Symbol = Symbol::short("BALANCES");
const PAYMENTS: Symbol = Symbol::short("PAYMENTS");
const PAYMENT_COUNTER: Symbol = Symbol::short("PAY_CNT");

#[contract]
pub struct PaymentContract;

#[contractimpl]
impl PaymentContract {
    /// Initialize the payment contract
    pub fn initialize(
        env: Env,
        admin: Address,
        fee_recipient: Address,
        fee_rate: u32,
        minimum_deposit: i128,
    ) {
        // Ensure contract hasn't been initialized
        if env.storage().instance().has(&ADMIN) {
            panic!("Contract already initialized");
        }

        // Validate inputs
        if fee_rate > 10000 {
            panic!("Fee rate cannot exceed 100%");
        }
        if minimum_deposit < 0 {
            panic!("Minimum deposit cannot be negative");
        }

        // Store admin
        env.storage().instance().set(&ADMIN, &admin);

        // Store configuration
        let config = ContractConfig {
            admin: admin.clone(),
            fee_recipient,
            fee_rate,
            minimum_deposit,
            is_paused: false,
        };
        env.storage().instance().set(&CONFIG, &config);

        // Initialize payment counter
        env.storage().instance().set(&PAYMENT_COUNTER, &0u64);
    }

    /// Deposit tokens into the contract
    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) -> u64 {
        // Check if contract is paused
        let config = Self::get_config(env.clone());
        if config.is_paused {
            panic!("Contract is paused");
        }

        // Validate minimum deposit
        if amount < config.minimum_deposit {
            panic!("Amount below minimum deposit");
        }

        // Calculate fee
        let fee = Self::calculate_fee(amount, config.fee_rate);
        let net_amount = amount - fee;

        // Update balances
        Self::update_balance(env.clone(), from.clone(), token.clone(), net_amount);
        if fee > 0 {
            Self::update_balance(env.clone(), config.fee_recipient.clone(), token.clone(), fee);
        }

        // Create payment record
        let payment_id = Self::create_payment_record(
            env.clone(),
            from.clone(),
            Address::from_contract_id(&env.current_contract_address()),
            amount,
            token.clone(),
            None,
        );

        // In a real implementation, you would transfer tokens from the user to the contract
        // This would require token contract integration

        payment_id
    }

    /// Transfer tokens between addresses
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token: Address,
        amount: i128,
        memo: Option<String>,
    ) -> u64 {
        // Check if contract is paused
        let config = Self::get_config(env.clone());
        if config.is_paused {
            panic!("Contract is paused");
        }

        // Validate amount
        if amount <= 0 {
            panic!("Transfer amount must be positive");
        }

        // Check sender's balance
        let sender_balance = Self::get_balance(env.clone(), from.clone(), token.clone());
        if sender_balance < amount {
            panic!("Insufficient balance");
        }

        // Calculate fee
        let fee = Self::calculate_fee(amount, config.fee_rate);
        let net_amount = amount - fee;

        // Update balances
        Self::update_balance(env.clone(), from.clone(), token.clone(), -(amount));
        Self::update_balance(env.clone(), to.clone(), token.clone(), net_amount);
        if fee > 0 {
            Self::update_balance(env.clone(), config.fee_recipient.clone(), token.clone(), fee);
        }

        // Create payment record
        let payment_id = Self::create_payment_record(
            env.clone(),
            from.clone(),
            to.clone(),
            amount,
            token.clone(),
            memo,
        );

        payment_id
    }

    /// Withdraw tokens from the contract
    pub fn withdraw(env: Env, to: Address, token: Address, amount: i128) -> u64 {
        // Check if contract is paused
        let config = Self::get_config(env.clone());
        if config.is_paused {
            panic!("Contract is paused");
        }

        // Validate amount
        if amount <= 0 {
            panic!("Withdrawal amount must be positive");
        }

        // Check balance
        let balance = Self::get_balance(env.clone(), to.clone(), token.clone());
        if balance < amount {
            panic!("Insufficient balance");
        }

        // Calculate fee
        let fee = Self::calculate_fee(amount, config.fee_rate);
        let net_amount = amount - fee;

        // Update balance
        Self::update_balance(env.clone(), to.clone(), token.clone(), -(amount));
        if fee > 0 {
            Self::update_balance(env.clone(), config.fee_recipient.clone(), token.clone(), fee);
        }

        // Create payment record
        let payment_id = Self::create_payment_record(
            env.clone(),
            Address::from_contract_id(&env.current_contract_address()),
            to.clone(),
            amount,
            token.clone(),
            Some(String::from_str(&env, "Withdrawal")),
        );

        // In a real implementation, you would transfer tokens from the contract to the user
        // This would require token contract integration

        payment_id
    }

    /// Get balance for a specific address and token
    pub fn get_balance(env: Env, address: Address, token: Address) -> i128 {
        let balances: Map<(Address, Address), i128> = env
            .storage()
            .instance()
            .get(&BALANCES)
            .unwrap_or_else(|| Map::new(&env));

        balances.get((address, token)).unwrap_or(0)
    }

    /// Get payment details by ID
    pub fn get_payment(env: Env, payment_id: u64) -> Payment {
        let payments: Map<u64, Payment> = env
            .storage()
            .instance()
            .get(&PAYMENTS)
            .unwrap_or_else(|| Map::new(&env));

        payments
            .get(payment_id)
            .unwrap_or_else(|| panic!("Payment not found"))
    }

    /// Get all payments for an address
    pub fn get_payments_by_address(env: Env, address: Address) -> Vec<Payment> {
        let payments: Map<u64, Payment> = env
            .storage()
            .instance()
            .get(&PAYMENTS)
            .unwrap_or_else(|| Map::new(&env));

        let mut result = Vec::new(&env);
        for (_, payment) in payments {
            if payment.from == address || payment.to == address {
                result.push_back(payment);
            }
        }
        result
    }

    /// Get contract configuration
    pub fn get_config(env: Env) -> ContractConfig {
        env.storage()
            .instance()
            .get(&CONFIG)
            .unwrap_or_else(|| panic!("Contract not initialized"))
    }

    /// Update contract configuration (admin only)
    pub fn update_config(
        env: Env,
        admin: Address,
        new_fee_recipient: Option<Address>,
        new_fee_rate: Option<u32>,
        new_minimum_deposit: Option<i128>,
        pause_status: Option<bool>,
    ) {
        // Verify admin
        let config = Self::get_config(env.clone());
        if config.admin != admin {
            panic!("Only admin can update configuration");
        }

        // Update configuration
        let mut updated_config = config;
        if let Some(recipient) = new_fee_recipient {
            updated_config.fee_recipient = recipient;
        }
        if let Some(rate) = new_fee_rate {
            if rate > 10000 {
                panic!("Fee rate cannot exceed 100%");
            }
            updated_config.fee_rate = rate;
        }
        if let Some(minimum) = new_minimum_deposit {
            if minimum < 0 {
                panic!("Minimum deposit cannot be negative");
            }
            updated_config.minimum_deposit = minimum;
        }
        if let Some(pause) = pause_status {
            updated_config.is_paused = pause;
        }

        env.storage().instance().set(&CONFIG, &updated_config);
    }

    /// Emergency pause contract (admin only)
    pub fn emergency_pause(env: Env, admin: Address) {
        let config = Self::get_config(env.clone());
        if config.admin != admin {
            panic!("Only admin can pause contract");
        }

        let mut updated_config = config;
        updated_config.is_paused = true;
        env.storage().instance().set(&CONFIG, &updated_config);
    }

    /// Emergency unpause contract (admin only)
    pub fn emergency_unpause(env: Env, admin: Address) {
        let config = Self::get_config(env.clone());
        if config.admin != admin {
            panic!("Only admin can unpause contract");
        }

        let mut updated_config = config;
        updated_config.is_paused = false;
        env.storage().instance().set(&CONFIG, &updated_config);
    }

    // Helper functions

    fn calculate_fee(amount: i128, fee_rate: u32) -> i128 {
        (amount * fee_rate as i128) / 10000
    }

    fn update_balance(env: Env, address: Address, token: Address, amount_delta: i128) {
        let mut balances: Map<(Address, Address), i128> = env
            .storage()
            .instance()
            .get(&BALANCES)
            .unwrap_or_else(|| Map::new(&env));

        let current_balance = balances.get((address.clone(), token.clone())).unwrap_or(0);
        let new_balance = current_balance + amount_delta;

        if new_balance < 0 {
            panic!("Balance cannot be negative");
        }

        balances.set((address, token), new_balance);
        env.storage().instance().set(&BALANCES, &balances);
    }

    fn create_payment_record(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
        token: Address,
        memo: Option<String>,
    ) -> u64 {
        let mut payment_counter: u64 = env
            .storage()
            .instance()
            .get(&PAYMENT_COUNTER)
            .unwrap_or(0);

        payment_counter += 1;

        let payment = Payment {
            id: payment_counter.to_be_bytes().into_val(&env),
            from,
            to,
            amount,
            token,
            memo,
            timestamp: env.ledger().timestamp(),
            status: PaymentStatus::Completed,
        };

        let mut payments: Map<u64, Payment> = env
            .storage()
            .instance()
            .get(&PAYMENTS)
            .unwrap_or_else(|| Map::new(&env));

        payments.set(payment_counter, payment);
        env.storage().instance().set(&PAYMENTS, &payments);
        env.storage().instance().set(&PAYMENT_COUNTER, &payment_counter);

        payment_counter
    }

    fn get_balance(env: Env, address: Address, token: Address) -> i128 {
        let balances: Map<(Address, Address), i128> = env
            .storage()
            .instance()
            .get(&BALANCES)
            .unwrap_or_else(|| Map::new(&env));

        balances.get((address, token)).unwrap_or(0)
    }
}
