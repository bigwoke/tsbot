const cfg = require('./config.js')
const tools = require('./tools.js')
const log = require('./log.js')

if (cfg.modules.welcome) log.info('Welcome messages are enabled.')
if (cfg.modules.sgprot) log.info('Server group protection is enabled.')
if (cfg.modules.autogroups) log.info('Client auto group assignment is enabled.')
if (cfg.modules.db) log.info('Database-reliant features are enabled.')

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
  let cl = await client.getInfo()

  let sgProtInterval = setInterval(() => {
    cl.client_servergroups.forEach(async sgid => {
      if (cfg.modules.db) {
        let user = await ts.data.collection('users').findOne({ uid: uid })
        let group = await ts.data.collection('groups').findOne({ _id: sgid })
        if (!user || !group || !group.prot) return

        let authorized
        for (let i = 0; i < group.auth_users.length; i++) {
          authorized = group.auth_users[i] !== user._id
        }

        if (!authorized) {
          client.serverGroupDel(sgid)
          client.poke(`The server group [B]${group.name}[/B] is protected!`)
          log.info(`User ${client.getCache().client_nickname} was removed from protected group ${group.name}`)
        }
      } else {
        for (let key in cfg.sgprot) {
          if (parseInt(key) === sgid && !cfg.sgprot[key].includes(uid)) {
            let group = await ts.getServerGroupByID(sgid)

            client.serverGroupDel(sgid)
            client.poke(`The server group [B]${group.getCache().name}[/B] is protected!`)
            log.info(`User ${client.getCache().client_nickname} was removed from protected group ${group.getCache().name}`)
          }
        }
      }
    })
  }, 2000)

  client.on('clientdisconnect', () => {
    clearInterval(sgProtInterval)
  })
}

async function autoGroupAssign (client, ts) {
  if (!cfg.modules.autogroups) return

  let clinfo = await client.getInfo()
  let clAddr = clinfo.connection_client_ip
  let clGroups = clinfo.client_servergroups

  if (cfg.modules.db) {
    let user = await ts.data.collection('users').findOne({ ip: clAddr })
    let groups = await ts.data.collection('groups').find({ auto_users: { $ne: [] } }).toArray()
    if (!user || groups.length === 0) return

    for (let i = 0; i < groups.length; i++) {
      let group = groups[i]
      if (!clGroups.includes(group._id)) {
        client.serverGroupAdd(group._id)
        log.info(`User ${user.name} was auto-assigned to the group ${group.name}.`)
      }
    }
  } else {
    for (let key in cfg.ipgroups) {
      if (key === clAddr) {
        for (let value in cfg.ipgroups[key]) {
          if (!clGroups.includes(value)) {
            let group = await ts.getServerGroupByID(cfg.ipgroups[key][value])
            client.serverGroupAdd(cfg.ipgroups[key][value].toString())
            log.info(`User ${client.getCache().client_nickname} was added to the group ${group.getCache().name} assigned to their IP address.`)
          }
        }
      }
    }
  }
}

module.exports = {
  welcome: sendWelcomeMessage,
  sgCheck: groupProtectionCheck,
  autoGroups: autoGroupAssign
}
