import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const App = () => {
  const chainIds = {
    mainet: 1,
    ropsten: 3,
    rinkeby: 4,
    goerli: 5,
    kovan: 42,
  };

  const [inputParams, setInputParams] = useState({
    walletName: "",
    tokenAmt: "",
    addressTo: "",
  });

  const [addressList, setAddressList] = useState([]);

  const [selectedAddress, setSelectedAddress] = useState({});

  const [ethersProvider, setEthersProvider] = useState(
    new ethers.providers.EtherscanProvider(chainIds.rinkeby)
  );

  useEffect(() => {
    // updateMultipleBalances();
    setAddressList(JSON.parse(localStorage.getItem("addressList")));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    let randomWallet = ethers.Wallet.createRandom();
    const { privateKey, publicKey, mnemonic, address } = randomWallet;

    let wallet = new ethers.Wallet(privateKey, ethersProvider);
    console.log(randomWallet);

    let list = [];
    let balance = await wallet
      .getBalance()
      .then((item) => ethers.utils.formatEther(item._hex));

    list = [
      ...(JSON.parse(localStorage.getItem("addressList")) || []),
      {
        name: inputParams.walletName,
        privateKey,
        balance,
        publicKey,
        mnemonic,
        address,
      },
    ];

    setAddressList(list);
    localStorage.setItem("addressList", JSON.stringify(list));

    setInputParams({
      walletName: "",
      addressTo: "",
      tokenAmt: "",
    });
  };
  // 0x5166Cf5B71d40103390055108A58471e3c6C2f0a
  // `0xd18408acf628bb30737e08f7861981b197f895245cb2e5785f797e3163ecbba3`

  const getWalletBalanceByAddress = (address, chainId = chainIds.rinkeby) =>
    ethersProvider
      .getBalance(address)
      .then((balance) => ethers.utils.formatEther(balance._hex));

  const getWalletBalanceByAddressConsoleLog = (
    address,
    chainId = chainIds.rinkeby
  ) =>
    console.log(
      ethersProvider
        .getBalance(address)
        .then((balance) => ethers.utils.formatEther(balance._hex))
    );

  const updateBalance = async (address) => {
    let balance = await getWalletBalanceByAddress(address);
    console.log(balance);
    // const list = await addressList.map((item,idx) => {
    //   if (item.address.trim() === address.trim()) {
    //     console.log(true, item.address, address);
    //     return {
    //       ...JSON.parse(localStorage.getItem("addressList"))[idx],
    //       balance,
    //     };
    //   } else {
    //     console.log(false, item.address, address);
    //   }
    //   return item;
    // });

    let arr = [];

    addressList.forEach((v) => {
      if (v.address.trim() === address.trim()) {
        arr.push({
          ...v,
          balance
        });
      }
    });

    console.log(arr)


    // console.log(list);
    // await localStorage.setItem("addressList ", JSON.stringify(list));
    // await setAddressList(list);
  };

  const handleInputChange = (e) => {
    const { value, name } = e.target;

    setInputParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }));
  };

  const handleSelectChange = (e) => {
    const index = e.target.selectedIndex;
    setSelectedAddress(addressList[index - 1]);
  };

  const setEtherscanProvider = (providerStr) => {
    setEthersProvider(new ethers.providers.EtherscanProvider(providerStr));
  };

  // const updateMultipleBalances = () => {
  //   let arr = JSON.parse(localStorage.getItem("addressList"));
  //   arr.map((address) => updateBalance(address.address));
  //   addressList.map((address) => console.log(address.address));
  // };

  const { walletName, addressTo, tokenAmt } = inputParams;

  const sendToken = async (e) => {
    e.preventDefault();
    try {
      let wallet = new ethers.Wallet(
        // "0xd18408acf628bb30737e08f7861981b197f895245cb2e5785f797e3163ecbba3"
        selectedAddress.privateKey
      );
      let walletSigner = wallet.connect(ethersProvider);
      let gasPrice = await ethersProvider.getGasPrice();
      let currentGasPrice = await ethers.utils.hexlify(parseInt(gasPrice));

      const tx = {
        // from: "0x5166Cf5B71d40103390055108A58471e3c6C2f0a",
        from: selectedAddress.address,
        // to: "0x8Bc2564ee3473B7DEb8348517bd4dDBb6a2187D6",
        to: addressTo.trim(),
        value: ethers.utils.parseEther(tokenAmt.toString().trim()),
        nonce: ethersProvider.getTransactionCount(
          selectedAddress.address,
          "latest"
        ),
        gasLimit: ethers.utils.hexlify(100000), // 100000
        gasPrice: currentGasPrice,
      };

      console.log(tx);

      try {
        const transaction = await walletSigner.sendTransaction(tx);
        console.log("transaction", transaction);
        const txReceipt = await transaction.wait();
        console.log("txReceipt", txReceipt);
        // (await txReceipt.status) === 1 && updateMultipleBalances();
        await updateBalance(txReceipt.from);
        await updateBalance(txReceipt.to);
      } catch (err) {
        console.log(err);
        alert("Failed! Please check your information again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed!");
    }
  };

  console.log("RENDERED!!");

  return (
    <>
      <div>
        <form onSubmit={onSubmit}>
          <h1>WALLETS</h1>
          <label htmlFor="walletName">Wallet Name:</label>
          <input
            id="walletName"
            type="text"
            name="walletName"
            value={walletName}
            onChange={handleInputChange}
          />
          <button>CREATE</button>
        </form>
        {addressList?.map(({ balance, name, address }, idx) => (
          <div key={idx}>
            <ul>
              <li>{`${name} - ${address} - ${balance}`}</li>
            </ul>
          </div>
        ))}
      </div>
      <div>
        <form onSubmit={sendToken}>
          <fieldset>
            <legend>SEND ETH</legend>
            <label htmlFor="addressFrom">Wallets: </label>
            <select
              id="addressFrom"
              name="addressFrom"
              onChange={handleSelectChange}
            >
              <option value="wallets">Please choose a wallet</option>
              {addressList?.map(({ balance, name, address }, idx) => (
                <option
                  value={name}
                  data-address={address}
                  key={idx}
                >{`${name} - ${address} - ${balance}`}</option>
              ))}
            </select>
            <label htmlFor="addressTo">Recipient: </label>
            <input
              type="text"
              id="addressTo"
              name="addressTo"
              value={addressTo}
              onChange={handleInputChange}
            />
            <label htmlFor="tokenAmt">Amount: </label>
            <input
              type="text"
              id="tokenAmt"
              name="tokenAmt"
              value={tokenAmt}
              onChange={handleInputChange}
            />
            <button>SEND</button>
          </fieldset>
        </form>
        {/* <button onClick={updateMultipleBalances}>update multiple</button> */}
        <button
          onClick={() =>
            getWalletBalanceByAddressConsoleLog(
              "0x825a46c80bA179992c216D1803Ca103CDa35C853"
            )
          }
        >
          apple balance
        </button>
        <button
          onClick={() =>
            getWalletBalanceByAddressConsoleLog(
              "0xfcc6d853E394CE6dBc383D3A8ff89D1e579b10BA"
            )
          }
        >
          dogukan balance
        </button>
      </div>
    </>
  );
};

export default App;
