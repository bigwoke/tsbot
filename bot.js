require('dotenv').config()
const TS3 = require('ts3-nodejs-library')
const fs = require('fs')
const watch = require('node-watch')
const path = require('path')

const actions = require('./actions.js')
const tools = require('./tools.js')
const cfg = require('./config.js')
const log = require('./log.js')
const db = !cfg.modules.db ? null : require('./db.js')

if (cfg.modules.db) {
  tools.verifyFile('./sgprot.json')
  tools.verifyFile('./autogroups.json')
}

const prefix = cfg.bot.prefix
const rootUsers = cfg.users.root
const modUsers = cfg.users.mod

const ts = new TS3({
  protocol: cfg.ts3.protocol,
  host: cfg.ts3.host,
  queryport: cfg.ts3.query,
  serverport: cfg.ts3.port,
  username: cfg.ts3.user,
  password: cfg.ts3.pass,
  nickname: cfg.bot.nick
})

module.exports = ts

if (cfg.modules.db) db.mount(ts)
ts.commands = new Map()
ts.setMaxListeners(50)
ts.version().then(res => {
  if (res.version > '3.8') {
    ts.charLimit = 8192
  } else {
    ts.charLimit = 1024
  }
})

tools.getFiles('./commands/').then(files => {
  files = tools.flatArray(files)
  let jsfiles = files.filter(f => f.split('.').pop() === 'js')

  let count = 0
  jsfiles.forEach(file => {
    try {
      let cmd = require(path.resolve(file))
      if (!cmd.info || !cmd.run) {
        return log.warn(`Issue with file ${file}, not loading.`)
      }
      if (cmd.info.module && cfg.modules[cmd.info.module] === false) {
        return log.debug(`Module '${cmd.info.module}' disabled, not loading ${cmd.info.name}.`)
      }
      count++

      let level = cmd.info.level === 0 ? '(root)' : cmd.info.level === 1 ? '(mod)' : ''
      log.verbose(`${count}: Loaded ${path.relative('./commands/', file)} ${level}`)
      ts.commands.set(cmd.info.name, cmd)
    } catch (err) {
      log.warn(`Issue loading command file ${file}:`, err.stack)
    }
  })
  log.info(`Loaded ${count} commands.`)
})

watch('./commands/', { filter: /\.js$/, recursive: true }, (evt, file) => {
  let fileName = path.basename(file)
  delRequireCache(file, fileName)

  if (fs.existsSync(path.resolve(file))) {
    try {
      let cmd = require(path.resolve(file))

      if (!cmd.info || !cmd.run) {
        return log.warn(`Issue with detected file: ${fileName}. Not loaded.`)
      }
      if (cfg.modules[cmd.info.module] === false) {
        return log.verbose(`Detected file ${fileName}, but its module is disabled. Not loaded.`)
      }

      let level = cmd.info.level === 0 ? '(root)' : cmd.info.level === 1 ? '(mod)' : ''
      log.info(`Detected and loaded command file ${fileName}. ${level}`)
      ts.commands.set(cmd.info.name, cmd)
    } catch (err) {
      log.warn(`Issue loading command file ${fileName}:`, err.stack)
    }
  } else {
    log.info(`Detected removal of command ${fileName}, unloading.`)
  }

  function delRequireCache (file, name) {
    let cmd = name.slice(0, -3)
    ts.commands.delete(cmd)
    delete require.cache[require.resolve(path.resolve(file))]
  }
})

ts.on('ready', async () => {
  ts.whoami()
    .then(bot => {
      log.info(`Authorization Successful! Logged in as ${bot.client_nickname}.`)
      if (cfg.bot.home) {
        let homeCID = cfg.bot.home
        ts.clientMove(bot.client_id, homeCID).catch(err => log.warn(err))
      }
    }).catch(err => log.error(err))

  await Promise.all([
    ts.registerEvent('server'),
    ts.registerEvent('channel', 0),
    ts.registerEvent('textserver'),
    ts.registerEvent('textchannel'),
    ts.registerEvent('textprivate')
  ]).then(() => {
    log.info('Subscribed to all events.')
  }).catch(err => log.error(err))

  ts.clientList({ client_type: 0 })
    .then(list => {
      list.forEach(client => {
        actions.sgCheck(client, ts)
      })
    }).catch(err => log.error(err))
})

ts.on('clientconnect', ev => {
  let client = ev.client
  let nick = client.nickname

  log.silly(`[+] Client "${nick}" connected.`)

  actions.welcome(client, ts)
  actions.sgCheck(client, ts)
  actions.autoGroups(client, ts)
})

ts.on('clientdisconnect', ev => {
  log.silly(`[-] Client "${ev.client.client_nickname}" disconnected.`)
})

ts.on('clientmoved', ev => {
  if (ev.client.type !== 0) return
  let nick = ev.client.nickname
  let cname = ev.channel.name
  log.silly(`[x] Client "${nick}" moved to channel "${cname}"`)
})

ts.on('textmessage', ev => {
  const message = ev.msg
  const client = ev.invoker
  const nick = client.nickname

  if (!client || client.isQuery()) return

  let uid = client.uniqueIdentifier
  let args = message.split(/\s+/g)
  let fullCommand = args[0]
  args = args.slice(1)

  client.level = rootUsers.includes(uid) ? 0 : modUsers.includes(uid) ? 1 : 2

  if (!fullCommand.startsWith(prefix)) return

  let cmd = ts.commands.get(fullCommand.slice(prefix.length))
  let noPerms = function (cmd) {
    ts.sendTextMessage(client.getID(), 1, `You do not have permission to use the ${cmd.info.name} command.`)
  }

  if (cmd) {
    if (cmd.info.level < client.level) {
      return noPerms(cmd)
    } else {
      cmd.run(ts, ev, client, args)
      log.debug(`Command '${cmd.info.name}' receieved from '${nick}'`)
      log.silly(`Full content of '${cmd.info.name}' (from '${nick}'): ${message}`)
    }
  }
})

ts.on('error', err => {
  if (err.id === 520) {
    log.error('Your serverquery password is either incorrect or not defined.')
  } else {
    log.error(err)
  }
})
ts.on('close', ev => log.info('Connection has been closed:', ev))
