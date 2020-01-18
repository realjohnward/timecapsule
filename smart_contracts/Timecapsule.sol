pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


contract Timecapsule {
       uint public numSecrets;
       // Stores Secret structs (defined below)
       Secret[] public secrets;

       address public owner;
       address public enigma;

       // Millionaire struct which holds encrypted address and net worth
       struct Secret {
               bytes myAddress;
               bytes mySecret;
               bytes myTimestamp;
       }

       // Event emitted upon callback completion; watched from front end
       event CallbackFinished();

       // Modifier to ensure only enigma contract can call function
       modifier onlyEnigma() {
               require(msg.sender == enigma);
               _;
       }

       // Constructor called when new contract is deployed
       constructor(address _enigmaAddress, address _owner) public {
               owner = _owner;
               enigma = _enigmaAddress;
       }

       // Add a new millionaire with encrypted address and net worth arguments
       function addSecret(bytes memory _encryptedAddress, bytes memory _encryptedSecret, bytes memory _encryptedTimestamp) public {
               Secret memory secret = Secret({
                       myAddress: _encryptedAddress,
                       mySecret: _encryptedSecret,
                       myTimestamp: _encryptedTimestamp
               });
               secrets.push(secret);
               numSecrets++;
       }

       function getInfoForSecret(uint index)
               public
               view
               returns (bytes memory, bytes memory, bytes memory)
       {
               Secret memory secret = secrets[index];
               bytes memory encryptedAddress = secret.myAddress;
               bytes memory encryptedSecret = secret.mySecret;
               bytes memory encryptedTimestamp = secret.myTimestamp;
               return (encryptedAddress, encryptedSecret, encryptedTimestamp);
       }

       /*
       CALLABLE FUNCTION run in SGX to retrieve secret 
       */
       function getSecret(uint256 nowTs, string memory _secret, uint256 _timestamp)
               public
               pure
               returns (string memory)
       {
               if(_timestamp < nowTs){
                       return _secret;
               } else {
                       return "N/A";
               }
       }

        function emitCallback() public onlyEnigma() {
                emit CallbackFinished();
        }
}