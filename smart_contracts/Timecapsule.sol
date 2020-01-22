pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;


contract Timecapsule {
       //uint public numSecrets;
       // Stores Secret structs (defined below)
       //Secret[] public secrets;

       mapping(address => mapping(string => string)) public revealedSecrets;

       address private scAuthorized;
       address private owner;

       // Millionaire struct which holds encrypted address and net worth
       //struct Secret {
       //        bytes myAddress;
       //        bytes mySecret;
       //        bytes myTimestamp;
       //}

       // Event emitted upon callback completion; watched from front end
       event CallbackFinished();

       // Modifier to ensure only enigma contract can call function
       modifier onlyEnigma() {
               require(msg.sender == scAuthorized, "only Enigma is authorized");
               _;
       }

       // Modifier to ensure only contract owner can call function
       modifier onlyOwner() {
               require(msg.sender == scAuthorized, "only contract owner is authorized");
               _;
       }

       // Constructor called when new contract is deployed
       constructor() public {
               owner = msg.sender;
       }

        // Get timestamp 
        function getTimestamp() public returns (uint) {
                return now;
        }

       function revealSecret(address owner, string memory title, string memory secret) public onlyOwner() {
                revealedSecrets[owner][title] = secret;
                emit CallbackFinished();
        }
}
