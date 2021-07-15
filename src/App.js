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

  window.ethersProvider = new ethers.providers.EtherscanProvider(
    chainIds.rinkeby
  );

  const [inputParams, setInputParams] = useState({
    walletName: "",
    tokenAmt: "",
    addressTo: "",
  });
  const [addressList, setAddressList] = useState(
    JSON.parse(localStorage.getItem("addressList")) || []
  );
  const [selectedAddress, setSelectedAddress] = useState({});
  const [isLoading, setisLoading] = useState(false);

  useEffect(() => {
    updateMultipleBalances();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    let randomWallet = ethers.Wallet.createRandom();
    const { privateKey, publicKey, mnemonic, address } = randomWallet;

    let wallet = new ethers.Wallet(privateKey, window.ethersProvider);
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

  const getWalletBalanceByAddress = (address, chainId = chainIds.rinkeby) =>
    window.ethersProvider
      .getBalance(address)
      .then((balance) => ethers.utils.formatEther(balance._hex));

  const updateBalance = async (addresses) => {
    let list = addressList;

    for (let i = 0; i < addresses.length; i++) {
      let address = addresses[i];
      let balance = await getWalletBalanceByAddress(address);

      list = list?.map((item) => {
        if (item.address.trim() === address.trim()) {
          return {
            ...item,
            balance,
          };
        }
        return item;
      });
    }

    localStorage.setItem("addressList", JSON.stringify(list));
    setAddressList(list);
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

  const updateMultipleBalances = () =>
    addressList.map((address) => updateBalance([address.address]));

  const { walletName, addressTo, tokenAmt } = inputParams;

  const sendToken = async (e) => {
    e.preventDefault();
    try {
      let wallet = new ethers.Wallet(selectedAddress.privateKey);
      let walletSigner = wallet.connect(window.ethersProvider);
      let gasPrice = await window.ethersProvider.getGasPrice();
      let currentGasPrice = await ethers.utils.hexlify(parseInt(gasPrice));

      const tx = {
        from: selectedAddress.address,
        to: addressTo.trim(),
        value: ethers.utils.parseEther(tokenAmt.toString().trim()),
        nonce: window.ethersProvider.getTransactionCount(
          selectedAddress.address,
          "latest"
        ),
        gasLimit: ethers.utils.hexlify(100000),
        gasPrice: currentGasPrice,
      };

      try {
        const transaction = await walletSigner.sendTransaction(tx);
        await setisLoading(true);
        const txReceipt = await transaction.wait();
        let txAdresses = [txReceipt.from, txReceipt.to];
        await updateBalance(txAdresses);
        setisLoading(false);
        alert(
          `The token has been sent successfully! Gas price is ${ethers.utils.formatEther(
            txReceipt.gasUsed._hex
          )} ETH`
        );
      } catch (err) {
        console.log(err);
        alert("Failed to send token!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed!");
    }
  };

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
            <legend>
              <h2>SEND ETH</h2>
            </legend>
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
            {isLoading && <h3>PENDING...</h3>}
          </fieldset>
        </form>
      </div>
    </>
  );
};

export default App;
