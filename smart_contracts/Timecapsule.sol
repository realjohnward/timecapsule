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

       // Add a new millionaire with encrypted address and net worth arguments
       //function addSecret(bytes memory _encryptedAddress, bytes memory _encryptedSecret, bytes memory _encryptedTimestamp) public onlyOwner() {
        //       Secret memory secret = Secret({
        //               myAddress: _encryptedAddress,
        //               mySecret: _encryptedSecret,
        //               myTimestamp: _encryptedTimestamp
        //       });
        //       secrets.push(secret);
        //       numSecrets++;
       //}

       //function getInfoForSecret(uint index)
       //        public
       //        view
       //        returns (bytes memory, bytes memory, bytes memory)
       //{
       //        Secret memory secret = secrets[index];
       //        bytes memory encryptedAddress = secret.myAddress;
       //        bytes memory encryptedSecret = secret.mySecret;
       //        bytes memory encryptedTimestamp = secret.myTimestamp;
       //        return (encryptedAddress, encryptedSecret, encryptedTimestamp);
       //}

       /*
       CALLABLE FUNCTION run in SGX to retrieve secret
       */
       //function getSecret(int64 nowTs, string memory _secret, int64 _timestamp)
       //        public
       //        pure
       //        returns (string memory)
       //{
       //        if(_timestamp < nowTs){
       //                return _secret;
       //        } else {
       //                return "N/A";
       //        }
       //}

       function revealSecret(address owner, string memory title, string memory secret) public onlyOwner() {
                revealedSecrets[owner][title] = secret;
                emit CallbackFinished();
        }
}
