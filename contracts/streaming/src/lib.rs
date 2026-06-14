use soroban_sdk::{contract, contractimpl, Address, Env};

#[derive(Clone, Debug, PartialEq, soroban_sdk::contracttype)]
pub enum StreamStatus {
    Active,
    Paused,
    Cancelled,
    Completed,
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
    pub status: StreamStatus,
    /// Accumulated paused duration in seconds
    pub paused_duration: u64,
    /// Timestamp when stream was last paused (0 if not paused)
    pub paused_at: u64,
}

#[contract]
pub struct StreamingContract;

#[contractimpl]
impl StreamingContract {
    pub fn init(
        env: Env,
        sender: Address,
        recipient: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
    ) {
        let stream = StreamData {
            sender,
            recipient,
            token,
            total_amount,
            start_time,
            end_time,
            withdrawn_amount: 0,
            status: StreamStatus::Active,
            paused_duration: 0,
            paused_at: 0,
        };
        env.storage().instance().set(&"stream", stream);
    }

    pub fn get_stream(env: Env) -> StreamData {
        env.storage().instance().get(&"stream").unwrap_or_else(|| panic!("Not initialized"))
    }

    /// Pause the stream — only sender can pause
    pub fn pause(env: Env, caller: Address) {
        let mut stream = Self::get_stream(env.clone());
        if stream.sender != caller { panic!("Only sender can pause"); }
        if stream.status != StreamStatus::Active { panic!("Stream is not active"); }
        stream.status = StreamStatus::Paused;
        stream.paused_at = env.ledger().timestamp();
        env.storage().instance().set(&"stream", stream);
    }

    /// Resume a paused stream — only sender can resume
    pub fn resume(env: Env, caller: Address) {
        let mut stream = Self::get_stream(env.clone());
        if stream.sender != caller { panic!("Only sender can resume"); }
        if stream.status != StreamStatus::Paused { panic!("Stream is not paused"); }
        let now = env.ledger().timestamp();
        stream.paused_duration += now - stream.paused_at;
        stream.paused_at = 0;
        stream.status = StreamStatus::Active;
        env.storage().instance().set(&"stream", stream);
    }

    /// Withdraw vested funds — only recipient
    pub fn withdraw(env: Env, caller: Address) -> i128 {
        let mut stream = Self::get_stream(env.clone());
        if stream.recipient != caller { panic!("Only recipient can withdraw"); }
        if stream.status == StreamStatus::Cancelled { panic!("Stream cancelled"); }

        let now = env.ledger().timestamp();
        let available = Self::vested(&stream, now);
        let withdrawable = available - stream.withdrawn_amount;
        if withdrawable <= 0 { return 0; }

        stream.withdrawn_amount += withdrawable;
        if stream.withdrawn_amount >= stream.total_amount {
            stream.status = StreamStatus::Completed;
        }
        env.storage().instance().set(&"stream", stream);
        withdrawable
    }

    /// Cancel the stream — only sender
    pub fn cancel(env: Env, caller: Address) {
        let mut stream = Self::get_stream(env.clone());
        if stream.sender != caller { panic!("Only sender can cancel"); }
        if stream.status == StreamStatus::Cancelled { panic!("Already cancelled"); }
        stream.status = StreamStatus::Cancelled;
        stream.end_time = env.ledger().timestamp();
        env.storage().instance().set(&"stream", stream);
    }

    /// How much has vested so far (accounts for paused time)
    pub fn get_vested(env: Env) -> i128 {
        let stream = Self::get_stream(env.clone());
        Self::vested(&stream, env.ledger().timestamp())
    }

    fn vested(stream: &StreamData, now: u64) -> i128 {
        if now <= stream.start_time { return 0; }
        let paused = if stream.paused_at > 0 { now - stream.paused_at } else { 0 };
        let effective_now = now.saturating_sub(stream.paused_duration + paused);
        if effective_now >= stream.end_time { return stream.total_amount; }
        let elapsed = effective_now.saturating_sub(stream.start_time);
        let duration = stream.end_time - stream.start_time;
        (stream.total_amount * elapsed as i128) / duration as i128
    }
}
