const cfg = require('./config.js')
const tools = require('./tools.js')
const log = require('./log.js')

if (cfg.modules.welcome) log.info('Welcome messages are enabled.')
if (cfg.modules.sgprot) log.info('Server group protection is enabled.')
if (cfg.modules.groupbyip) log.info('Client auto group membership by IP is enabled.')

async function sendWelcomeMessage (client, ts) {
  if (!cfg.modules.welcome) return
  if (!client || client.isQuery()) return
  let nick = client.getCache().client_nickname

  let cl = await ts.clientDBInfo(client.getCache().client_database_id)
  let dateCreated = tools.toDate(cl.client_created, 'd')
  let timeCreated = tools.toDate(cl.client_created, 't')

  let visitCount = cl.client_totalconnections.toString()

  let end = visitCount.slice(-1)
  let numSuffix = (end === 1) ? 'st' : (end === 2) ? 'nd' : (end === 3) ? 'rd' : 'th'

  let welcome = `Hello [b]${nick}[/b], this is your ${visitCount + numSuffix} visit! `
  welcome += `We first saw you on ${dateCreated} at ${timeCreated}.\n`
  welcome += `You can use the command [I]${cfg.bot.prefix}help[/I] to see what you can do.`

  ts.sendTextMessage(client.getID(), 1, welcome)
}

async function groupProtectionCheck (client, ts) {
  if (!cfg.modules.sgprot) return
  let uid = client.getCache().client_unique_identifier

  let sgProtInterval = setInterval(async () => {
    let cl = await client.getInfo()

    cl.client_servergroups.forEach(async sgid => {
      for (let key in cfg.sgprot) {
        if (parseInt(key) === sgid && !cfg.sgprot[key].includes(uid)) {
          let group = await ts.getServerGroupByID(sgid)

          client.serverGroupDel(sgid)
          client.poke(`The server group [B]${group.getCache().name}[/B] is protected!`)
        }
      }
    })
  }, 2000)

  client.on('clientdisconnect', () => {
    clearInterval(sgProtInterval)
  })
}

async function assignGroupByIPAddress (client, ts) {
  if (!cfg.modules.ipgroups) return

  let clinfo = await client.getInfo()
  let clAddr = clinfo.connection_client_ip
  let clGroups = clinfo.client_servergroups

  for (let key in cfg.ipgroups) {
    if (key === clAddr) {
      for (let value in cfg.ipgroups[key]) {
        if (!clGroups.includes(value)) {
          client.serverGroupAdd(cfg.ipgroups[key][value].toString())
        }
      }
    }
  }
}

module.exports = {
  welcome: sendWelcomeMessage,
  sgCheck: groupProtectionCheck,
  ipGroups: assignGroupByIPAddress
}
