// Built-In Attributes
#![no_std]

// Imports
extern crate eng_wasm;
extern crate eng_wasm_derive;
extern crate serde;

use eng_wasm::*;
use eng_wasm_derive::pub_interface;
use eng_wasm_derive::eth_contract;
use serde::{Serialize, Deserialize};

// Encrypted state keys
static OWNER: &str = "owner";
static SECRETS: &str = "secrets";
static TIMECAPSULE_ETH_ADDR: &str = "timecapsule_eth_addr";

// Structs
#[derive(Serialize, Deserialize)]
pub struct Secret {
    secret: String,
    timestamp: u64,
}

// Timecapsule contract abi
#[eth_contract("Timecapsule.json")]
struct Timecapsule;

// Public struct Contract which will consist of private and public-facing secret contract functions
pub struct Contract; 

impl Contract {
    fn get_secrets() -> Vec<Secret> {
	read_state!(SECRETS).unwrap_or_default()
    }

    // Read address of Timecapsule contract
    fn get_timecapsule_eth_addr() -> String {
        read_state!(TIMECAPSULE_ETH_ADDR).unwrap_or_default()
    }

}

#[pub_interface]
pub trait ContractInterface{
    fn construct(owner: H160);
    fn add_secret(sender: H160, secret: String, timestamp: u64);
    fn reveal_expired_secrets(sender: H160) -> String;
}

// Private functions accessible only by the secret contract
impl ContractInterface for Contract {
    fn construct(owner: H160, timecapsule_eth_addr: H160) {
        write_state!(OWNER => owner);
        let timecapsule_eth_addr_str: String = timecapsule_eth_addr.to_hex();
        write_state!(TIMECAPSULE_ETH_ADDR => timecapsule_eth_addr_str);    
    }

    #[no_mangle]
    fn add_secret(sender: H160, secret: String, timestamp: u64) {
        let owner: H160 = read_state!(OWNER).unwrap();
        assert_eq!(sender, owner);
        let mut _secrets = Self::get_secrets();
        _secrets.push(Secret {
	    secret,
            timestamp,
        });
        write_state!(SECRETS => _secrets);
    }

    #[no_mangle]
    fn reveal_expired_secrets(sender: H160) -> String {
        let owner: H160 = read_state!(OWNER).unwrap();
        assert_eq!(sender, owner);
        let c = EthContract::new(&timestamp_eth_addr);
        let _now: u64 = c.getTimestamp();
        let mut revealed_secrets: String = String::new();
        let separator = String::from("|");
        let all_secrets = Self::get_secrets();
        for one_secret in all_secrets {
            if _now > one_secret.timestamp {
                revealed_secrets.push_str(&one_secret.secret);
                revealed_secrets.push_str(&separator);
            }
        }
        revealed_secrets.pop();
        return revealed_secrets;
    }
}
