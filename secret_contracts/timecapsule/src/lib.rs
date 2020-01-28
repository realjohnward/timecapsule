#![no_std]

// Imports
extern crate eng_wasm;
extern crate eng_wasm_derive;
extern crate serde;
extern crate chrono;

use eng_wasm::*;
use eng_wasm_derive::pub_interface;
use serde::{Serialize, Deserialize};
use chrono::{Local, DateTime, Utc};
// Encrypted state keys
static OWNER: &str = "owner";
static SECRETS: &str = "secrets";

// Structs
#[derive(Serialize, Deserialize)]
pub struct Secret {
secret: String,
timestamp: i64,
}

// Public struct Contract which will consist of private and public-facing secret contract functions
pub struct Contract;

impl Contract {
fn get_secrets() -> Vec<Secret> {
match read_state!(SECRETS) {
    Some(vec) => vec,
    None => Vec::new(),
    }
}
}

#[pub_interface]
pub trait ContractInterface{
fn construct(owner: H160);
fn add_secret(sender: H160, secret: String, timestamp: i64);
fn reveal_expired_secrets(sender: H160) -> String;
}

// Private functions accessible only by the secret contract
impl ContractInterface for Contract {
fn construct(owner: H160) {
write_state!(OWNER => owner);
}


#[no_mangle]
fn add_secret(sender: H160, secret: String, timestamp: i64) {
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
let now: i64 = Utc::now().timestamp();
let mut revealed_secrets: String = String::new();
let separator = String::from("|");
let all_secrets = Self::get_secrets();
for one_secret in all_secrets {
	if now > one_secret.timestamp {
		revealed_secrets.push_str(&one_secret.secret);
		revealed_secrets.push_str(&separator);
	}
}
revealed_secrets.pop();
return revealed_secrets;
}
}
