//@ts-nocheck

import { Box, Button, Center, Flex, Heading, Image, Input, SimpleGrid, Text } from '@chakra-ui/react'
import { Alchemy, Network, Utils } from 'alchemy-sdk'
import { providers, utils } from 'ethers'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

const config = {
  apiKey: import.meta.env.VITE_TESTNET_SEPOLIA_ALCHEMY_KEY,
  network: Network.ETH_MAINNET
}

const provider = new providers.Web3Provider(window.ethereum)
const alchemy = new Alchemy(config)

function App() {
  const [userAddress, setUserAddress] = useState('')
  const [results, setResults] = useState([])
  const [hasQueried, setHasQueried] = useState(false)
  const [tokenDataObjects, setTokenDataObjects] = useState([])
  const [inputAddress, setInputAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const connectwalletHandler = () => {
    if (window.ethereum) {
      provider.send('eth_requestAccounts', []).then(async () => {
        const signer = await provider.getSigner().getAddress()
        setUserAddress(signer)
        getTokenBalance(signer)
      })
    } else {
      setErrorMessage('Please Install Metamask!!!')
    }
  }

  const handleSearchAddress = async () => {
    if (!inputAddress) return toast.error('Please enter an address!')
    const ensAddress = await provider.resolveName('vitalik.eth')
    if (ensAddress) {
      setUserAddress(ensAddress)
      return getTokenBalance(inputAddress)
    }

    const inputIsHex = utils.isHexString(inputAddress)
    if (!inputIsHex) return toast.error("That's not a valid address!")
    setUserAddress(inputAddress)
    getTokenBalance(inputAddress)
  }

  async function getTokenBalance(address) {
    if (!address) return
    setIsLoading(true)

    const data = await alchemy.core.getTokenBalances(address)

    setResults(data)

    const tokenDataPromises = []

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(data.tokenBalances[i].contractAddress)
      tokenDataPromises.push(tokenData)
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises))
    setHasQueried(true)
    setIsLoading(false)
  }

  const handleReset = () => {
    setInputAddress('')
    setUserAddress('')
    setHasQueried(false)
  }

  return (
    <Box w='100vw'>
      <Center>
        <Flex alignItems={'center'} justifyContent='center' flexDirection={'column'}>
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>Plug in an address and this website will return all of its ERC-20 token balances!</Text>
        </Flex>
      </Center>
      <Flex w='100%' flexDirection='column' alignItems='center' justifyContent={'center'}>
        <Heading mt={42}>Get all the ERC-20 token balances of this address:</Heading>
        {userAddress ? (
          userAddress
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearchAddress()
            }}
          >
            <Input
              onChange={(e) => setInputAddress(e.target.value)}
              color='black'
              w='600px'
              textAlign='center'
              p={4}
              bgColor='white'
              fontSize={24}
              value={inputAddress}
            />
          </form>
        )}
        {userAddress ? (
          <>
            <Flex gap={20}>
              <Button
                fontSize={20}
                onClick={() => {
                  getTokenBalance(userAddress)
                }}
                mt={36}
                bgColor={'blue'}
                isLoading={isLoading}
                loadingText='Is fetching...'
              >
                Check ERC-20 Token Balances
              </Button>
              <Button fontSize={20} onClick={handleReset} mt={36} bgColor='blue'>
                New Address
              </Button>
            </Flex>

            <Heading my={36}>ERC-20 token balances:</Heading>

            {hasQueried ? (
              <SimpleGrid w={'90vw'} columns={4} spacing={24}>
                {results.tokenBalances.map((e, i) => {
                  const balance = Number(Utils.formatUnits(e.tokenBalance, tokenDataObjects[i].decimals))
                  if (!balance) return null
                  return (
                    <Flex
                      flexDir={'column'}
                      color='white'
                      bg={'blue'}
                      w={'20vw'}
                      key={e.tokenBalance + i}
                      gap={10}
                      padding={10}
                    >
                      <Box>
                        <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                      </Box>
                      <Box>
                        <b>Balance:</b>&nbsp;
                        {balance.toFixed(6)}
                      </Box>
                      <Image src={tokenDataObjects[i].logo} />
                    </Flex>
                  )
                })}
              </SimpleGrid>
            ) : (
              'Please make a query! This may take a few seconds...'
            )}
          </>
        ) : (
          <Flex gap={20}>
            <Button fontSize={20} onClick={handleSearchAddress} mt={36} bgColor='blue'>
              Search this address
            </Button>
            <Button fontSize={20} onClick={connectwalletHandler} mt={36} bgColor='blue'>
              Connect my wallet
            </Button>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}

export default App
