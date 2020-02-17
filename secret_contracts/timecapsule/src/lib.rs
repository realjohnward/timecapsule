#![no_std]

// Imports
extern crate eng_wasm;
extern crate eng_wasm_derive;
extern crate serde;

use eng_wasm::*;
use eng_wasm_derive::pub_interface;
use eng_wasm_derive::eth_contract;
use histogram::Histogram;
use serde::{Serialize, Deserialize};

// Timecapsule contract abi
#[eth_contract("Timecapsule.json")]
struct EthContract;


// Encrypted state keys
static OWNER: &str = "owner";
static SECRET: &str = "secret";
static SECURITY_DEPOSIT: &str = "security_deposit";
static REVEAL_TIMESTAMP: &str = "reveal_timestamp";
static BIDDERS: &str = "bidders";
static MIN_BIDDERS: &str = "min_bidders";
static LAST_REPORTED_TIME: &str = "last_reported_time";
static TIMECAPSULE_ETH_ADDR: &str = "timecapsule_eth_addr";

// Structs
#[derive(Serialize, Deserialize)]
pub struct Bidder {
  address: H160,
  stake: U256,
  security_deposit: U256,
  timestamp: i64,
}

// Public struct Contract which will consist of private and public-facing secret contract functions
pub struct Contract;

impl Contract {
fn get_bidders() -> Vec<Bidder> {
match read_state!(BIDDERS) {
    Some(vec) => vec,
    None => Vec::new(),
    }
}

fn get_owner() -> H160 {
    read_state!(OWNER).unwrap_or_default()
}

fn get_min_bidders() -> i64 {
    read_state!(MIN_BIDDERS).unwrap_or_default()
}

fn get_timecapsule_eth_addr() -> String {
    read_state!(TIMECAPSULE_ETH_ADDR).unwrap_or_default()
}

}

#[pub_interface]
pub trait ContractInterface{
fn construct(owner: H160, security_deposit: U256,
	 secret: String, reveal_timestamp: i64, min_bidders: i64);
fn bid(sender: H160, security_deposit: U256, stake: U256, timestamp: i64);
fn set_time(sender: H160, security_deposit: U256) -> String;
}

// Private functions accessible only by the secret contract
impl ContractInterface for Contract {
fn construct(owner: H160, security_deposit: U256, secret: String, 
		reveal_timestamp: i64, min_bidders: i64) {
write_state!(OWNER => owner);
write_state!(SECURITY_DEPOSIT => security_deposit);
write_state!(SECRET => secret);
write_state!(REVEAL_TIMESTAMP => reveal_timestamp);
write_state!(MIN_BIDDERS => min_bidders);
}

#[no_mangle]
fn set_time(sender: H160, security_deposit: U256, stake: U256, timestamp: i64) -> String {
    let mut _bidders = Self::get_bidders();
    _bidders.push(Bidder{address: sender, security_deposit: security_deposit,
			stake: stake, timestamp: timestamp});
    write_state!(BIDDERS => _bidders);

let bidders: Self::get_bidders();
let min_bidders: Self::get_min_bidders();
let bidders_len: usize = bidders.len();

//assert_gt!(bidders_len as i64, min_bidders);
if (bidders_len as i64 > min_bidders){

// from bidders vector, get all bidders 33.33 & 66.66th percentile
let mut timestamps = Vec::new();
let mut histogram = Histogram::new();

for bidder in bidders {
    histogram.increment(bidder.timestamp);
    timestamps.push(bidder.timestamp);
}

let ts_ceiling = histogram.percentile(66.66).unwrap();
let ts_floor = histogram.percentile(33.33).unwrap();

let mut best = Vec::new();
let mut worst = Vec::new();

for bidder in bidders {
    if(bidder.timestamp >= ts_floor && bidder.timestamp <= ts_ceiling){
	best.push(bidder);
    } else {
	worst.push(bidder);
    }
}

let best_histogram = Histogram::new();
for bidder in best {
    best_histogram.increment(bidder.timestamp);
}

let best_timestamp = best_histogram.mean().unwrap();  
write_state!(LAST_REPORTED_TIME => best_timestamp);
remove_from_state!(BIDDERS);

let winning_index = Rand::gen() % best.len();
let winner = best[winning_index].address;

let separator = String::from("|");
let comma = String::from(",");
let mut response = String::new();

response.push_str(&winner);
response.push_str(&separator);

for bidder in best {
    response.push_str(&winner.address);
    response.push_str(&comma);
}

response.pop();
response.push_str(&separator);

for bidder in worst {
    response.push_str(&worst.address);
    response.push_str(&comma);
}

response.pop();

let timecapsule_eth_addr: String = Self::get_timecapsule_eth_addr();
let c = EthContract::new(&timecapsule_eth_addr);
c.end_game(response);
}
}
}
