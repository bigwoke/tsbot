require('dotenv').config()
const TS3 = require('ts3-nodejs-library')
const fs = require('fs')
const tools = require('./tools.js')

tools.verifyFile('./sgprot.json')

const log = require('./log.js')
const actions = require('./actions.js')
const cfg = require('./config.js')

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

ts.commands = new Map()
ts.setMaxListeners(50)

fs.readdir('./commands/', (err, files) => {
  if (err) log.error(err.stack)

  let jsfiles = files.filter(file => file.split('.').pop() === 'js')
  let count = 0
  jsfiles.forEach(file => {
    let command = require(`./commands/${file}`)
    if (!command.info || !command.run) {
      return log.warn(`Issue with file ${file}, not loading.`)
    }
    if (command.info.module && cfg.modules[command.info.module] === false) {
      return log.debug(`Module '${command.info.module}' disabled, not loading ${command.info.name}.js`)
    }
    count++

    let level = command.info.level
    log.verbose(`${count}: Loaded ${file} ${level === 0 ? '(root)' : level === 1 ? '(mod)' : ''}`)
    ts.commands.set(command.info.name, command)
  })
  log.info(`Loaded ${count} commands.`)
})

fs.watch('./commands/', (eventType, filename) => {
  if (filename.split('.').pop() !== 'js') return
  if (eventType !== 'rename') return

  if (fs.existsSync(`./commands/${filename}`)) {
    let command = require(`./commands/${filename}`)
    if (!command.info || !command.run) return log.warn(`Issue with detected file ${filename}, not loading.`)
    if (cfg.modules[command.info.module] === false) return

    let level = command.info.level === 0 ? '(root)' : command.info.level === 1 ? '(mod)' : ''
    log.info(`Detected and loaded new command file ${filename} ${level}`)
    ts.commands.set(command.info.name, command)
  } else {
    let command = filename.slice(0, -3)
    if (!ts.commands.has(command)) return

    log.info(`Detected removal of command file ${filename}, unloading.`)
    ts.commands.delete(command)
    delete require.cache[require.resolve(`./commands/${command}.js`)]
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

  // Register for all events within view of SQ client
  await Promise.all([
    ts.registerEvent('server'),
    ts.registerEvent('channel', 0),
    ts.registerEvent('textserver'),
    ts.registerEvent('textchannel'),
    ts.registerEvent('textprivate')
  ]).then(() => {
    log.info('Subscribed to all events.')
  }).catch(err => log.error(err.stack))

  ts.clientList({ client_type: 0 })
    .then(list => {
      list.forEach(client => {
        actions.sgCheck(client, ts)
      })
    }).catch(err => log.error(err))
})

ts.on('clientconnect', ev => {
  let client = ev.client
  let nick = client.getCache().client_nickname

  log.silly(`[+] Client "${nick}" connected.`)

  actions.welcome(client, ts)
  actions.sgCheck(client, ts)
  actions.ipGroups(client, ts)
})

ts.on('clientdisconnect', ev => {
  log.silly(`[-] Client "${ev.client.client_nickname}" disconnected.`)
})

ts.on('clientmoved', ev => {
  if (ev.client.getCache().client_type !== 0) return
  let nick = ev.client.getCache().client_nickname
  let cname = ev.channel.getCache().channel_name
  log.silly(`[x] Client "${nick}" moved to channel "${cname}"`)
})

ts.on('textmessage', ev => {
  const message = ev.msg
  const client = ev.invoker
  const nick = client.getCache().client_nickname

  if (!client || client.isQuery()) return

  let uid = client.getCache().client_unique_identifier
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
    if (cmd.info.level === 0 && !client.level === 0) {
      return noPerms(cmd)
    } else if (cmd.info.level === 1 && !(client.level === 1 || client.level === 0)) {
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
