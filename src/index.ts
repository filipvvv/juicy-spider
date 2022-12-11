require('dotenv').config()

const etherscan = 'https://api.etherscan.io/api?'
const ipfs = 'https://gold-binding-angelfish-816.mypinata.cloud/ipfs/'
const subgraph = 'https://api.studio.thegraph.com/query/30654/mainnet-dev/0.7.0'
const sepana = 'https://api.sepana.io/v1/engine/'

async function main() {
  let remaining = true
  let handles = []

  for(let i = 0; remaining; i+=1000){
    const query = `{
      projects(first: 1000, skip: ${i}, where: {pv: "2"}, orderBy: projectId){
        handle
      }
    }`

    await fetch(subgraph, {
      body: JSON.stringify({ query }),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())
    .then(json => {
      json.data.projects[0]
      ? handles = handles.concat(json.data.projects.map(el => el.handle))
      : remaining = false
    }).catch(e => { throw new Error('Error querying Subgraph: ' + e) })
  } 

  const docs = []
  const ipfsPromises = []
  await fetch(etherscan + new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    address: '0xD8B4359143eda5B2d763E127Ed27c77addBc47d3', //JBProjects
    topic0: '0xa1c6fd563bcbc3222f6031d7c26ff58cd6c701abff0bfffe652d055ce40629d4', //Create
    fromBlock: '14730693',
    page: '1',
    apikey: process.env.ETHERSCAN_API_KEY,
  })).then(res => res.json())
  .then(json => json.result.map(el => {
    ipfsPromises.push(fetch(ipfs + Buffer.from(el.data.substring(322), 'hex').toString().replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, ""), {
      method: 'GET',
      headers: { 'x-pinata-gateway-token': process.env.PINATA_GATEWAY_TOKEN },
    })
      .then(res => res.ok ? res.json() : null)
      .then(metadata => {
        const projectId = parseInt(el.topics[1].substring(2), 16)
        docs.push({
          projectId: projectId,
          name: metadata?.name,
          description: metadata?.description,
          logo: metadata?.logo,
          handle: handles[projectId - 1],
        })
      })
      .catch(e => console.log(`Error handling CID ${Buffer.from(el.data.substring(322), 'hex').toString().replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, "")}: ${e}`)))
    }))
  .catch(e => { throw new Error('Error querying Etherscan: ' + e) })
  
  Promise.all(ipfsPromises).then(() => {
    while(docs[0]){
      fetch(sepana + 'insert_data',{
        headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ engine_id: process.env.SEPANA_ENGINE_ID,  docs: docs.splice(0, 500) }),
      })
    }
  })
}

main()