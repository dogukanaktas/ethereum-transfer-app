import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const App = () => {
  const [inputParams, setInputParams] = useState({
    walletName: "",
  });

  const [addressList, setAddressList] = useState(
    JSON.parse(localStorage.getItem("addressList")) || []
  );

  const [isTokenSent, setIsTokenSent] = useState(false);

  // useEffect(() => {
  //   updateBalance();
  // }, [isTokenSent]);

  const onSubmit = async (e) => {
    e.preventDefault();
    // let provider = ethers.getDefaultProvider("rinkeby");
    let provider = new ethers.providers.EtherscanProvider(4);
    let randomWallet = ethers.Wallet.createRandom();
    let wallet = new ethers.Wallet(randomWallet.privateKey, provider);
    console.log(randomWallet);

    let list = [];
    let balance = await wallet
      .getBalance()
      .then((item) => ethers.utils.formatEther(item._hex));

    await console.log(balance);

    list = [
      ...(JSON.parse(localStorage.getItem("addressList")) || []),
      {
        ...randomWallet,
        id: addressList.length === 0 ? 0 : addressList.length,
        name: inputParams.walletName,
        balance,
      },
    ];

    setAddressList(list);
    localStorage.setItem("addressList", JSON.stringify(list));

    setInputParams({
      walletName: "",
    });
  };
  // `0xd18408acf628bb30737e08f7861981b197f895245cb2e5785f797e3163ecbba3`

  const getWalletBalanceByAddress = async (
    address,
    providerName = "rinkeby"
  ) => {
    window.provider = new ethers.providers.EtherscanProvider(providerName);
    let balance = await window.provider
      .getBalance(address)
      .then((balance) => ethers.utils.formatEther(balance._hex));
    console.log(`balance`, balance);
    return balance;
  };

  const updateBalance = async (address) => {
    let balance = await getWalletBalanceByAddress(address);
    const list = addressList.map((item) => {
      if (item.address.trim() === address.trim()) {
        return {
          ...item,
          balance,
        };
      }
      return item;
    });
    setAddressList(list);
    localStorage.setItem("addressList", JSON.stringify(list));
  };

  const handleInputChange = (e) => {
    const { value, name } = e.target;

    setInputParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }));
  };

  // const makeTransaction = () => {
  //   window.provider = new ethers.providers.EtherscanProvider(4);
  //   let wallet = new ethers.Wallet(private_key);
  // };
  window.ethersProvider = new ethers.providers.EtherscanProvider(4);

  const sendToken = async (
    e,
    contract_address,
    send_account,
    to_address,
    send_token_amount,
    private_key
  ) => {
    e.preventDefault();
    try {
      let wallet = new ethers.Wallet(
        "0xd18408acf628bb30737e08f7861981b197f895245cb2e5785f797e3163ecbba3"
      );
      let walletSigner = wallet.connect(window.ethersProvider);
      let gasPrice = await window.ethersProvider.getGasPrice();
      let currentGasPrice = await ethers.utils.hexlify(
        parseInt(gasPrice.currentGasPrice)
      );

      // if (contract_address) {
      //   // general token send
      //   let contract = new ethers.Contract(
      //     contract_address,
      //     send_abi,
      //     walletSigner
      //   );

      //   // How many tokens?
      //   let numberOfTokens = ethers.utils.parseUnits(send_token_amount, 18);
      //   console.log(`numberOfTokens: ${numberOfTokens}`);

      //   // Send tokens
      //   contract.transfer(to_address, numberOfTokens).then((transferResult) => {
      //     console.dir(transferResult);
      //     alert("sent token");
      //   });
      // } // ether send
      // else {
      const tx = {
        from: "0x5166Cf5B71d40103390055108A58471e3c6C2f0a",
        to: "0xE912D2277ac802523AEA3b59c1364692F6c92922",
        value: ethers.utils.parseEther("0.01"),
        nonce: window.ethersProvider.getTransactionCount(
          "0x5166Cf5B71d40103390055108A58471e3c6C2f0a",
          "latest"
        ),
        gasLimit: ethers.utils.hexlify(100000), // 100000
        gasPrice: currentGasPrice,
      };

      walletSigner
        .sendTransaction(tx)
        .then((transaction) => {
          console.dir(transaction);
          transaction.wait().then((item) => {
            console.log("item", item);
            updateBalance(item.from);
            updateBalance(item.to);
          });
        })
        .catch((err) => {
          console.log(err);
          alert("failed to send!!");
        });

      // try {
      //   const transaction = await walletSigner.sendTransaction(tx);
      //   console.log(transaction);
      //   const txReceipt = await transaction.wait();
      //   updateBalance(txReceipt.from);
      //   updateBalance(txReceipt.to);
      // } catch (err) {
      //   console.log(err);
      //   // alert("failed to send!!");
      // }
    } catch (err) {
      console.error(err);
      alert("Failed to send! Please check your information again.");
    }
  };

  // let transactionCountPromise = wallet.getTransactionCount();

  // transactionCountPromise.then((transactionCount) => {
  //   console.log(transactionCount);
  // });

  return (
    <div>
      <div style={{ textAlign: `center`, width: `50%`, margin: `auto` }}>
        <form onSubmit={onSubmit}>
          <h1>WALLETS</h1>
          <label htmlFor="walletName">Wallet Name:</label>
          <input
            id="walletName"
            type="text"
            name="walletName"
            value={inputParams.walletName}
            onChange={handleInputChange}
          />
          <button>CREATE</button>
        </form>
        {addressList?.map(({ balance, name, address, id }) => (
          <div key={id}>
            <ul>
              <li>{`${name} - ${address} - ${balance}`}</li>
            </ul>
            <button onClick={() => updateBalance(address)}>
              refresh this line
            </button>
          </div>
        ))}
      </div>
      <div>
        <form onSubmit={sendToken}>
          <button>send token</button>
        </form>
      </div>
    </div>
  );
};

export default App;
