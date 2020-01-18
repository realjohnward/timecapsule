// Built-In Attributes
#![no_std]

// Imports
extern crate eng_wasm;
extern crate eng_wasm_derive;
extern crate serde;

use eng_wasm::*;
use eng_wasm_derive::pub_interface;
use serde::{Serialize, Deserialize};
use std::time::SystemTime;

// Encrypted state keys
static SECRETS: &Bytes32 = "secrets";

// Structs
#[derive(Serialize, Deserialize)]
pub struct Secret {
    address: H160,
    secret: str,
    timestamp: U256
}

// Public struct Contract which will consist of private and public-facing secret contract functions
pub struct Contract;

// Private functions accessible only by the secret contract
impl Contract {
    fn get_secrets() -> Vec<Secret> {
        read_state!(SECRETS).unwrap_or_default()
    }
}

// Public trait defining public-facing secret contract functions
#[pub_interface]
pub trait ContractInterface{
    fn add_secret(address: H160, secret: str, timestamp: U256);
    fn get_secret(index: u8) -> Bytes32;
}

// Implementation of the public-facing secret contract functions defined in the ContractInterface
// trait implementation for the Contract struct above
impl ContractInterface for Contract {
    #[no_mangle]
    fn add_secret(address: H160, secret: str, timestamp: U256) {
        let mut secrets = Self::get_secrets();
        secrets.push(Secret {
            address,
            secret,
            timestamp,
        });
        write_state!(SECRETS => secrets);
    }
    #[no_mangle]
    fn get_secret(index: u8) -> (str, U256) {
        let now = SystemTime::now();
        let secret = Self::get_secrets()[index as usize];
        let _secret = secret.secret;
        let _timestamp = secret.timestamp;
        (now, _secret, _timestamp)
    }
}
