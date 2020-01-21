// Imports - React
import React, { Component } from 'react';
// Imports - Redux
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
// Imports - Frameworks (Semantic-UI and Material-UI)
import { Message } from "semantic-ui-react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import FormControl from "@material-ui/core/FormControl/FormControl";
import InputLabel from "@material-ui/core/InputLabel/InputLabel";
import Select from "@material-ui/core/Select/Select";
import TextField from "@material-ui/core/TextField/TextField";
// Imports - Components
import Notifier, {openSnackbar} from "./Notifier";
// Imports - Reducers (Redux)
// Imports - enigma-js client library utility packages
import { utils, eeConstants } from 'enigma-js';
import { GetSecret } from "../actions";


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Timecapsule extends Component {
    constructor(props) {
        super(props);
        this.onAddSecret = this.onAddSecret.bind(this);
        this.onGetSecret = this.onGetSecret.bind(this);
    }

    // Redux form/material-ui render address select component
    static renderAddressInput({label, input, meta: { touched, invalid, error }, ...custom }) {
        return (
            <TextField
                label={label}
                type="text"
                placeholder={label}
                error={touched && invalid}
                helperText={touched && error}
                {...input}
                {...custom}
                fullWidth
            />
        )
    }

    // Redux form/material-ui render secret text field component
    static renderSecretInput({label, input, meta: { touched, invalid, error }, ...custom }) {
        return (
            <TextField
                label={label}
                type="text"
                placeholder={label}
                error={touched && invalid}
                helperText={touched && error}
                {...input}
                {...custom}
                fullWidth
            />
        )
    }

    // Redux form/material-ui render net worth text field component
    static renderTimestampInput({label, input, meta: { touched, invalid, error }, ...custom }) {
        return (
            <TextField
                label={label}
                type="number"
                placeholder={label}
                error={touched && invalid}
                helperText={touched && error}
                {...input}
                {...custom}
                fullWidth
            />
        )
    }

    static renderSecretsIndexInput({label, input, meta: { touched, invalid, error }, ...custom }) {
        return (
            <TextField
                label={label}
                type="number"
                placeholder={label}
                error={touched && invalid}
                helperText={touched && error}
                {...input}
                {...custom}
                fullWidth
            />
        )
    }

    // Redux form callback when add millionaire info is submitted
    async onAddSecret({ myAddress, mySecret, myTimestamp } ) {
        // Create compute task metadata
        // computeTask(
        //      fn - the signature of the function we are calling (Solidity-types, no spaces)
        //      args - the args passed into our method w/ format [[arg_1, type_1], [arg_2, type_2], …, [arg_n, type_n]]
        //      gasLimit - ENG gas units to be used for the computation task
        //      gasPx - ENG gas price to be used for the computation task in grains format (10⁸)
        //      sender - Ethereum address deploying the contract
        //      scAddr - the secret contract address for which this computation task belongs to
        // )
        const taskFn = 'add_secret(address,string,int64)';
        const taskArgs = [
            [myAddress, 'address'],
            [mySecret, 'string'],
            [myTimestamp, 'int64']
        ];
        const taskGasLimit = 10000000;
        const taskGasPx = utils.toGrains(1e-7);
        let task = await new Promise((resolve, reject) => {
            this.props.enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, myAddress,
                this.props.deployedTimecapsule)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => {
                   console.log(`ERROR: ${error}`); 
		   if (error.hasOwnProperty('message')){
                        openSnackbar({ message: error.message});
                    } else {
                        openSnackbar({ message: 'Failed to add secret'});
                    }
                    reject(error);
                });
        });
        openSnackbar({ message: 'Task pending: adding secret' });
        while (task.ethStatus === 1) {
            // Poll for task record status and finality on Ethereum after worker has finished computation
            task = await this.props.enigma.getTaskRecordStatus(task);
            await sleep(1000);
        }
        // ethStatus === 2 means task has successfully been computed and committed on Ethereum
        task.ethStatus === 2 ?
            openSnackbar({ message: 'Task succeeded: added secret' })
            :
            openSnackbar({ message: 'Task failed: did not add secret' })
        ;
        this.props.reset('AddSecret');
    }

    // Callback when compute richest button is clicked
    async onGetSecret(_index) {
        // Create compute task metadata
        const taskFn = 'get_secret(uint)';
        const taskArgs = [_index];
        const taskGasLimit = 10000000;
        const taskGasPx = utils.toGrains(1e-7);
        let task = await new Promise((resolve, reject) => {
            this.props.enigma.computeTask(taskFn, taskArgs, taskGasLimit, taskGasPx, this.props.accounts[0],
                this.props.deployedTimecapsule)
                .on(eeConstants.SEND_TASK_INPUT_RESULT, (result) => resolve(result))
                .on(eeConstants.ERROR, (error) => {
                    if (error.hasOwnProperty('message')){
                        openSnackbar({ message: error.message});
                    } else {
                        openSnackbar({ message: 'Failed to retrieve secret.'});
                    }
                    reject(error);
                });
        });
        openSnackbar({ message: 'Task pending: retrieve secret.' });
        while (task.ethStatus === 1) {
            task = await this.props.enigma.getTaskRecordStatus(task);
            await sleep(1000);
        }
        if (task.ethStatus === 2) {
            openSnackbar({ message: 'Task succeeded: retrieved secret.' });
            // Get task result by passing in existing task - obtains the encrypted, abi-encoded output
            task = await new Promise((resolve, reject) => {
                this.props.enigma.getTaskResult(task)
                    .on(eeConstants.GET_TASK_RESULT_RESULT, (result) => resolve(result))
                    .on(eeConstants.ERROR, (error) => reject(error));
            });
            // Decrypt the task result - obtains the decrypted, abi-encoded output
            task = await this.props.enigma.decryptTaskResult(task);
            console.log(`decrypted output: ${task.decryptedOutput}`);
        } else {
            openSnackbar({ message: 'Task failed: could not retrieve secret.' });
        }
    }

    render() {
        if (this.props.deployedTimecapsule === null) {
            return (
                <div>
                    <Message color="red">Timecapsule secret contract not yet deployed...</Message>
                </div>
            )
        }
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <h3>Timecapsule Contract Address: {this.props.deployedTimecapsule}</h3>
                    </Grid>
                    <Grid item xs={6}>
                        <div>
                            <Notifier />
                            <h4>Enter Secret Details</h4>
                            <form>
                                <div>
                                    <InputLabel htmlFor="my-address">Address</InputLabel>
                                    <Field
                                        name="myAddress"
                                        component={Timecapsule.renderAddressInput}
                                    >
                                        <option value="" />
                                        {this.props.accounts.map((account, i) => {
                                            return (
                                                <option key={i} value={account}>{account}</option>
                                            );
                                        })}
                                    </Field>
                                </div>
                                <div>
                                    <Field
                                        name="mySecret"
                                        component={Timecapsule.renderSecretInput}
                                        label="Secret"
                                    />
                                </div>
                                <div>
                                    <Field
                                        name="myTimestamp"
                                        component={Timecapsule.renderTimestampInput}
                                        label="Timestamp"
                                    />
                                </div>
                                <br />
                                <div>
                                    <Button
                                        onClick={this.props.handleSubmit(this.onAddSecret)}
                                        variant='outlined'
                                        color='secondary'>
                                        Submit
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Grid>
                    <Grid item xs={6}>
                        <div>
                            <h4>Retrieved Secret</h4>
                            <p>
                                {
                                    this.props.secret !== null ?
                                        this.props.secret
                                        :
                                        "TBD"
                                }
                            </p>
                            <form>
                            <div>
                                    <Field
                                        name="secretsIndex"
                                        component={Timecapsule.renderSecretsIndexInput}
                                        label="Secrets Index"
                                    />
                                </div>
                            <div>
                            <Button
                                onClick={this.props.handleSubmit(this.onGetSecret)}
                                variant='contained'
                                color='primary'>
                                Get Secret
                            </Button>
                            </div>
                            </form>
                        </div>
                    </Grid>
                </Grid>
            </div>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        enigma: state.enigma,
        accounts: state.accounts,
        deployedTimecapsule: state.deployedTimecapsule
    }
};
export default connect(mapStateToProps, { GetSecret })(reduxForm({
    form: 'AddSecret',
})(Timecapsule));
