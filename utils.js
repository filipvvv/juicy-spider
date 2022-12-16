import { subgraph, sepana } from './constants.js'
import dotenv from 'dotenv'
dotenv.config()

export async function querySubgraphProjects(block) {
  let docs = []
  let remaining = true

  for(let i = 0; remaining; i+=1000){
    const query = `{
      projects(first: 1000, orderBy: createdAt, skip: ${i}${block? `, block: {number: ${block}}` : ''}){
        id
        projectId
        pv
        handle
        metadataUri
        currentBalance
        totalPaid
        createdAt
        trendingScore
        deployer
      }
    }`

    await fetch(subgraph, {
      body: JSON.stringify({ query }),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())
    .then(json => {
      json.data?.projects[0]
      ? docs = docs.concat(json.data.projects)
      : remaining = false
    }).catch(e => { throw new Error('Error querying Subgraph: ' + e) })
  } 

  return(docs)
}

export async function getLatestBlock() {
  const query = `{
    _meta{
      block {
        number
      }
    }
  }`

  const json = await fetch(subgraph, {
    body: JSON.stringify({ query }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())
  .catch(e => { throw new Error(e) })

  return(json.data._meta.block.number)
}

export async function getLastUpdated() {
  const results = await fetch(sepana + 'search',{
    headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ 
      engine_ids: [ process.env.SEPANA_ENGINE_ID ],  
      filter: {
        match_all: {},
      },
      sort: [
        {
          lastUpdated: {
            order: "desc",
          },
        },
      ],
      size: 1,
      page: 0,
    }),
  }).then(res => res.json())
  .catch(e => {throw new Error(e)})

  return(results.hits?.hits[0]?._source?.lastUpdated)
}

// Update this before we hit 10k projects
export async function querySepanaProjects() {
  return fetch(sepana + 'search',{
    headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ 
      engine_ids: [ process.env.SEPANA_ENGINE_ID ],
      query: {
        match_all: {},
      },
      size: 10000,
      page: 0,
    }),
  }).then(res => res.json())
}

export async function deleteSepanaIds(ids) {
  return fetch(sepana + 'engine/data/delete', {
    method: 'DELETE',
    headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      engine_id: process.env.SEPANA_ENGINE_ID,
      delete_query: {
        query: {
          terms: {
            id: ids,
          },
        },
      },
    }),
  }).then(res => res.json())
}

export async function writeSepanaDocs(docs) {
  while(docs[0]){
    fetch(sepana + 'engine/insert_data',{
      headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ engine_id: process.env.SEPANA_ENGINE_ID,  docs: docs.splice(0, 500) }),
    }).then(res => res.json())
    .then(json => console.log(JSON.stringify(json)))
    if(docs[0])
      await new Promise(r => setTimeout(r, 3000));
  }
}