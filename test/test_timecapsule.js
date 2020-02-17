const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const TimecapsuleContract = artifacts.require("Timecapsule");
const { Enigma, utils, eeConstants } = require('enigma-js/node');

var EnigmaContract;
if (typeof process.env.SGX_MODE === 'undefined' || (process.env.SGX_MODE != 'SW' && process.env.SGX_MODE != 'HW')) {
    console.log(`Error reading ".env" file, aborting....`);
    process.exit();
} else if (process.env.SGX_MODE == 'SW') {
    EnigmaContract = require('../build/enigma_contracts/EnigmaSimulation.json');
} else {
    EnigmaContract = require('../build/enigma_contracts/Enigma.json');
}
const EnigmaTokenContract = require('../build/enigma_contracts/EnigmaToken.json');


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const splitSecrets = decryptedOutput => {
  const decodedParameters = web3.eth.abi.decodeParameters(
    [
      {
        type: 'string',
        name: 'concatenatedMessages',
      },
    ],
    decryptedOutput
  )
  const concatenatedMessages = decodedParameters.concatenatedMessages
  // Return empty array of messages if decrypted output string is empty.
  if (concatenatedMessages === '') {
    return []
  }
  // Otherwise return messages.
  const separator = '|'
  return decodedParameters.concatenatedMessages.split(separator)
}

let enigma = null;

contract("Timecapsule", accounts => {
    let owner1 = accounts[0];
    let task;

    before(function() {
        enigma = new Enigma(
            web3,
            EnigmaContract.networks['4447'].address,
            EnigmaTokenContract.networks['4447'].address,
            'http://localhost:3333', {
                gas: 4712388,
                gasPrice: 100000000000,
                from: accounts[0],
            },
        );
        enigma.admin();
        enigma.setTaskKeyPair('cupcake');
        contractAddr = fs.readFileSync('test/timecapsule.txt', 'utf-8');
    })

    it('should execute compute task to add secret #1', async() => {
        let taskFn = 'add_secret(address,string,uint64)';
        let taskArgs = [
            [owner1, 'address'],
            ["Hello world 1", 'string'],
	    [1579378831, 'uint64'],
        ];
        let taskGasLimit = 500000;
        let taskGasPx = utils.toGrains(1);
        task = await new Promise((resolve, reject) => {
            enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, accounts[0], contractAddr)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error))
        });
    });

    it('should get the pending task', async () => {
      task = await enigma.getTaskRecordStatus(task);
      expect(task.ethStatus).to.equal(1);
    });

    it('should get the confirmed task', async () => {
      do {
        await sleep(1000);
        task = await enigma.getTaskRecordStatus(task);
        process.stdout.write('Waiting. Current Task Status is '+task.ethStatus+'\r');
      } while (task.ethStatus !== 2);
      expect(task.ethStatus).to.equal(2);
      process.stdout.write('Completed. Final Task Status is '+task.ethStatus+'\n');
    }, 10000);

    it('should execute compute task to add secret #2', async () => {
        let taskFn = 'add_secret(address,string,uint64)';
        let taskArgs = [
            [owner1, 'address'],
            ["Hello world 2", 'string'],
	    [1579378831, 'uint64'],
        ];
        let taskGasLimit = 500000;
        let taskGasPx = utils.toGrains(1);
        task = await new Promise((resolve, reject) => {
            enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, accounts[0], contractAddr)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error))
        });
    });

    it('should get the pending task', async () => {
      task = await enigma.getTaskRecordStatus(task);
      expect(task.ethStatus).to.equal(1);
    });

    it('should get the confirmed task', async () => {
      do {
          await sleep(1000);
          task = await enigma.getTaskRecordStatus(task);
          process.stdout.write('Waiting. Current Task Status is '+task.ethStatus+'\r');
      } while (task.ethStatus !== 2);
      expect(task.ethStatus).to.equal(2);
      process.stdout.write('Completed. Final Task Status is '+task.ethStatus+'\n');
    }, 10000);

    it('should execute compute task to get secret', async () => {
        let taskFn = 'reveal_expired_secrets(address)';
        let taskArgs = [
	    [owner1, 'address'],
	];
        let taskGasLimit = 500000;
        let taskGasPx = utils.toGrains(1);
        task = await new Promise((resolve, reject) => {
            enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, accounts[0], contractAddr)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => reject(error))
        });
    });

    it('should get the pending task', async () => {
	task = await enigma.getTaskRecordStatus(task);
	expect(task.ethStatus).to.equal(1);
    });

    it('should get the confirmed task', async () => {
	do {
	    await sleep(1000);
	    task = await enigma.getTaskRecordStatus(task);
          process.stdout.write('Waiting. Current Task Status is '+task.ethStatus+'\r');
      } while (task.ethStatus !== 2);
      expect(task.ethStatus).to.equal(2);
      process.stdout.write('Completed. Final Task Status is '+task.ethStatus+'\n');
    }, 10000);

    it('should get the result and verify the computation is correct', async () => {
      task = await new Promise((resolve, reject) => {
      enigma.getTaskResult(task)
        .on(eeConstants.GET_TASK_RESULT_RESULT, (result) => resolve(result))
        .on(eeConstants.ERROR, (error) => reject(error))
    });
    expect(task.engStatus).to.equal('SUCCESS');
    task = await enigma.decryptTaskResult(task);
    const _secrets = splitSecrets(task.decryptedOutput);
    expect(_secrets).to.deep.equal(["Hello world 1", "Hello world 2"]);
   });
});
