import React, { Component } from "react";
import Web3 from "web3";
import Token from "../abis/Token.json";
import EthSwap from "../abis/EthSwap.json";
import Navbar from "./Navbar";
import Main from "./Main";
import "./App.css";

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const web3 = window.web3;

    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ ethBalance });

    // Load Token
    const networkId = await web3.eth.net.getId();
    const tokenData = Token.networks[networkId];
    if (tokenData) {
      const token = new web3.eth.Contract(Token.abi, tokenData.address);
      this.setState({ token });
      let tokenBalance = await token.methods
        .balanceOf(this.state.account)
        .call();
      this.setState({ tokenBalance: tokenBalance.toString() });
    } else {
      window.alert("Token contract not deployed to detected network.");
    }

    // Load EthSwap
    const ethSwapData = EthSwap.networks[networkId];
    if (ethSwapData) {
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address);
      this.setState({ ethSwap });
    } else {
      window.alert("EthSwap contract not deployed to detected network.");
    }
    //this.mapEvents();
    this.setState({ loading: false });
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async updateBalance() {
    const web3 = window.web3;
    // Load Token
    const networkId = await web3.eth.net.getId();
    const tokenData = Token.networks[networkId];
    if (tokenData) {
      const token = new web3.eth.Contract(Token.abi, tokenData.address);
      this.setState({ token });
      let tokenBalance = await token.methods
        .balanceOf(this.state.account)
        .call();
      this.setState({ tokenBalance: tokenBalance.toString() });
    } else {
      window.alert("Token contract not deployed to detected network.");
    }

    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ ethBalance });
  }

  async mapEvents() {
    console.log("this.state.token.events=>", this.state.token.events);
    this.state.token.once("Transfer", {}, function(error, event) {
      console.log(event);
    });

    // this.state.token.events
    //   .Transfer(
    //     {
    //       filter: {
    //         myIndexedParam: [20, 23],
    //         myOtherIndexedParam: "0x123456789...",
    //       }, // Using an array means OR: e.g. 20 or 23
    //       fromBlock: 0,
    //     },
    //     function(error, event) {
    //       console.log(event);
    //     }
    //   )
    //   .on("connected", function(subscriptionId) {
    //     console.log(subscriptionId);
    //   })
    //   .on("data", function(event) {
    //     console.log(event); // same results as the optional callback above
    //   })
    //   .on("changed", function(event) {
    //     // remove event from local database
    //   })
    //   .on("error", function(error, receipt) {
    //     // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    //   });
  }

  buyTokens = async (etherAmount) => {
    const web3 = window.web3;
    this.setState({ loading: true });
    this.state.ethSwap.methods
      .buyTokens()
      .send({ value: etherAmount, from: this.state.account })
      .on("transactionHash", async (hash) => {
        this.setState({
          loading: false,
        });
      })
      .on("confirmation", async (confNumber, receipt, latestBlockHash) => {
        //console.log("After confirmation=>", confNumber);
        let tokenBalance = await this.state.token.methods
          .balanceOf(this.state.account)
          .call();
        const ethBalance = await web3.eth.getBalance(this.state.account);
        this.setState({ ethBalance });

        //console.log("tokenBalance.toString()=>", tokenBalance.toString());
        this.setState({
          tokenBalance: tokenBalance.toString(),
          ethBalance,
        });
      });
  };

  sellTokens = async (tokenAmount) => {
    console.log("sellTokens");
    this.setState({ loading: true });

    // await this.state.token.methods
    //   .approve(this.state.ethSwap.address, tokenAmount)
    //   .send({ from: this.state.account });

    // console.log("approve");
    // await this.state.ethSwap.methods
    //   .sellTokens(tokenAmount)
    //   .send({ from: this.state.account });

    console.log("sellTokens");
    this.setState({ loading: false });

    this.state.token.methods
      .approve(this.state.ethSwap.address, tokenAmount)
      .send({ from: this.state.account })
      .on("transactionHash", (hash) => {
        this.delayedSellTokens(tokenAmount);
        // this.state.ethSwap.methods
        //   .sellTokens(tokenAmount)
        //   .send({ from: this.state.account })
        //   .on("transactionHash", (hash) => {
        //     this.setState({ loading: false });
        //   });
      });
  };

  delayedSellTokens = (tokenAmount) => {
    const web3 = window.web3;
    window.setTimeout(() => {
      console.log("delayedSellTokens");
      this.state.ethSwap.methods
        .sellTokens(tokenAmount)
        .send({ from: this.state.account })
        .on("transactionHash", (hash) => {
          this.setState({ loading: false });
        })
        .on("confirmation", async (confNumber, receipt, latestBlockHash) => {
          let tokenBalance = await this.state.token.methods
            .balanceOf(this.state.account)
            .call();
          const ethBalance = await web3.eth.getBalance(this.state.account);
          this.setState({ ethBalance });

          //console.log("tokenBalance.toString()=>", tokenBalance.toString());
          this.setState({
            tokenBalance: tokenBalance.toString(),
            ethBalance,
          });
        });
    }, 1000);
  };

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      token: {},
      ethSwap: {},
      ethBalance: "0",
      tokenBalance: "0",
      loading: true,
    };
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...
        </p>
      );
    } else {
      content = (
        <Main
          ethBalance={this.state.ethBalance}
          tokenBalance={this.state.tokenBalance}
          buyTokens={this.buyTokens}
          sellTokens={this.sellTokens}
        />
      );
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 ml-auto mr-auto"
              style={{ maxWidth: "600px" }}
            >
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>

                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
