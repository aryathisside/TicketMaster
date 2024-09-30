import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation'
import Sort from './components/Sort'
import Card from './components/Card'
import SeatChart from './components/SeatChart'

// ABIs
import TokenMaster from './abis/TokenMaster.json'
// import TokenMasterABI from '../artifacts/contracts/TokenMaster.sol/TokenMaster.json';

// Config
import config from './config.json'


function App() {

  const [currentAccount, setCurrentAccount] = useState(null)
  const [provider, setProvider] = useState(null)

  const [ticketMasterContract, setTicketMasterContract] = useState(null)
  const [occasions, setOccasions] = useState([])

  const [occasion, setOccasion] = useState({})
  const [toggle, setToggle] = useState(false)

  const localBlockchainData = async () => {
    try {
      if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults");
        const provider = ethers.getDefaultProvider();
        setProvider(provider);
      } else {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signerAcc = await provider.getSigner();

        // console.log("signer", signerAcc)
        setProvider(provider);

        // Get the network
        const network = await provider.getNetwork();
        const chainIdString = network.chainId.toString();
        // console.log("chainIdString", chainIdString)
        // console.log("network-chainId", network.chainId)
        // console.log("network", network)

        //Contract Deployment
        const tokenMasterContract = new ethers.Contract(config[chainIdString].TokenMaster.address, TokenMaster, provider)
        const tokenMasterContractAddress = await tokenMasterContract.getAddress()
        console.log(`config[chainIdString].TokenMaster.address: ${config[chainIdString].TokenMaster.address}`)
        setTicketMasterContract(tokenMasterContract)
        // console.log(`tokenMasterContract: ${tokenMasterContract} tokenMasterContractAddress: ${tokenMasterContractAddress}`)

        const totalOccasions = await tokenMasterContract.totalOccasions()
        // console.log(`totalOccasions: ${totalOccasions}`)

        const occasions = []

        for (var i = 1; i <= totalOccasions; i++) {
          const occasion = await tokenMasterContract.getOccasion(i)
          occasions.push(occasion)
        }

        setOccasions(occasions)


        window.ethereum.on("accountsChanged", async () => {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const account = ethers.getAddress(accounts[0]);
          setCurrentAccount(account);
        });
      }
    } catch (error) {
      console.log("Error", error)
    }

  }

  useEffect(() => {
    localBlockchainData();
  }, []);

  return (
    <div>
      <header>
        <Navigation currentAccount={currentAccount} setCurrentAccount={setCurrentAccount} />
        {/* <h2 className="header__title"><strong>Welcome to TicketMaster</strong></h2> */}
      </header>

      <Sort />
      <div className='cards'>
        {occasions.map((occasion, index) => (
          <Card
            occasion={occasion}
            id={index + 1}
            ticketMasterContract={ticketMasterContract}
            provider={provider}
            account={currentAccount}
            toggle={toggle}
            setToggle={setToggle}
            setOccasion={setOccasion}
            key={index}
          />
        ))}
      </div>

      {toggle && (
        <SeatChart
          occasion={occasion}
          ticketMasterContract={ticketMasterContract}
          provider={provider}
          setToggle={setToggle}
        />
      )}
    </div>
  );
}

export default App;
