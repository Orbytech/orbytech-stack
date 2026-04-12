use soroban_sdk::{contract, contractimpl, Address, Env, String, Map};

#[contract]
pub struct StreamingContract;

#[contractimpl]
impl StreamingContract {
    /// Create a new streaming contract
    pub fn init(
        env: Env,
        sender: Address,
        recipient: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
    ) {
        let stream_data = StreamData {
            sender,
            recipient,
            token,
            total_amount,
            start_time,
            end_time,
            withdrawn_amount: 0,
        };

        env.storage().instance().set(&"stream_data", stream_data);
    }

    /// Get stream data
    pub fn get_stream_data(env: Env) -> StreamData {
        env.storage()
            .instance()
            .get(&"stream_data")
            .unwrap_or_else(|| panic!("Stream not initialized"))
    }

    /// Withdraw available funds
    pub fn withdraw(env: Env, withdrawer: Address) -> i128 {
        let mut stream_data = Self::get_stream_data(env.clone());
        
        // Only recipient can withdraw
        if stream_data.recipient != withdrawer {
            panic!("Only recipient can withdraw");
        }

        let current_time = env.ledger().timestamp();
        let available_amount = Self::calculate_available_amount(
            stream_data.total_amount,
            stream_data.start_time,
            stream_data.end_time,
            current_time,
        );

        let withdrawable_amount = available_amount - stream_data.withdrawn_amount;

        if withdrawable_amount <= 0 {
            return 0;
        }

        // Update withdrawn amount
        stream_data.withdrawn_amount += withdrawable_amount;
        env.storage().instance().set(&"stream_data", stream_data);

        // In a real implementation, this would transfer tokens
        // For now, we'll just return the amount
        
        withdrawable_amount
    }

    /// Cancel the stream (only sender can cancel)
    pub fn cancel_stream(env: Env, canceller: Address) -> bool {
        let mut stream_data = Self::get_stream_data(env.clone());
        
        // Only sender can cancel
        if stream_data.sender != canceller {
            panic!("Only sender can cancel");
        }

        let current_time = env.ledger().timestamp();
        let available_amount = Self::calculate_available_amount(
            stream_data.total_amount,
            stream_data.start_time,
            stream_data.end_time,
            current_time,
        );

        let refund_amount = stream_data.total_amount - available_amount;

        // In a real implementation, this would refund tokens to sender
        // and withdraw available amount to recipient
        
        // Mark stream as cancelled
        stream_data.end_time = current_time;
        env.storage().instance().set(&"stream_data", stream_data);

        true
    }

    /// Calculate available amount based on time
    fn calculate_available_amount(
        total_amount: i128,
        start_time: u64,
        end_time: u64,
        current_time: u64,
    ) -> i128 {
        if current_time <= start_time {
            return 0;
        }

        if current_time >= end_time {
            return total_amount;
        }

        let elapsed = current_time - start_time;
        let duration = end_time - start_time;
        
        (total_amount * elapsed as i128) / duration as i128
    }
}

#[derive(Clone, Debug, soroban_sdk::contracttype)]
pub struct StreamData {
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn_amount: i128,
}
