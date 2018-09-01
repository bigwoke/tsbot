require('dotenv').config()
const TS3 = require('ts3-nodejs-library')
const log = require('winston')
const https = require('https')
const env = process.env.NODE_ENV || 'production'
const cfg = (env === 'development') ? require('./config_dev.json') : require('./config.json')

log.configure({
    transports: [
        new (log.transports.File)({
            filename: 'output.log',
            timestamp: true,
            level: 'debug',
            json: false
        }),
        new (log.transports.Console)({
            colorize: true,
            humanReadableUnhandledException: true,
            level: process.env.LOGLEVEL
        })
    ]
})

/* TODO:        + Additions  ! Fixes  - Removals  * Changes
    + Add quote keeping functionality
    + Add steam account sync/wishlist info
    + Add searching by steam game name instead of appid
    - Get rid of some of these ifs, maybe use returns (???)
    * Fix the autoafk move function, _DISABLED FOR NOW_
    * idea: make settings changeable via command
    * Change the way the .commands cmd works
    * Look into better modularity
*/

const ts = new TS3({
    host: process.env.TS_HOST,
    queryport: process.env.TS_QUERY,
    serverport: process.env.TS_PORT,
    username: process.env.TS_USER,
    password: process.env.TS_PASS,
    nickname: cfg.nickname
})

ts.on('ready', () => {
    log.info("Authorization Successful!")
    
    ts.whoami() //Move bot to channel indicated in config on startup
        .then( bot => {
            ts.clientMove(bot.client_id, cfg.homechannelid).catch( err => log.error(err) )
            log.info(`Moving self to home channel: cid ${cfg.homechannelid}.`)
        }).catch( err => log.error(err) )
    
    Promise.all([ //Register for all events within view of SQ client
        ts.registerEvent('server'),
        ts.registerEvent('channel', 0),
        ts.registerEvent('textserver'),
        ts.registerEvent('textchannel'),
        ts.registerEvent('textprivate')
    ]).then( () => {
        log.info("Subscribed to all events.")
    }).catch( err => log.error(err) )

    ts.setMaxListeners(50) //FIXME: Is this working properly? Doubt

    ts.clientList({client_type: 0})
        .then( list => {
            list.forEach( client => {          
                // idleClientCheck(client)
                sgProtCheck(client)
            })
        }).catch( err => log.error(err) )
})

ts.on('clientconnect', ev => {
    let client = ev.client
    let nick = client.getCache().client_nickname
    let country = client.getCache().client_country
    if( country === undefined ) country = "undetermined country"

    log.silly(`[+] Client "${nick}" connected from ${country}.`)

    sendWelcomeMessage(client)
    // idleClientCheck(client)
    sgProtCheck(client)
})

ts.on('clientdisconnect', client => {
    log.silly(`[-] Client "${client.client.client_nickname}" disconnected.`)
})

ts.on('clientmoved', ev => {
    let nick = ev.client.getCache().client_nickname
    let client_type = ev.client.getCache().client_type
    let channel_name = ev.channel.getCache().channel_name
    if( client_type === 0 ) log.silly(`[x] Client "${nick}" moved to channel "${channel_name}"`)
})

ts.on('textmessage', ev => {
    var msg = ev.msg
    var client = ev.invoker

    //Ignore messages not starting with prefix or sent by SQ
    if( !cfg.cmdprefix.includes(msg.charAt()) ) return
    if( !client || client.isQuery() ) return

    const args = msg.substring(1).split(' ')
    const cmd = args[0].toLowerCase();

    var valid_cmds = ['turbopoke', 'seen', 'last', 'gm', 'broadcast', 'rawclientinfo', 'commands', 'welcome', 'playercount', 'diceroll', 'roll', 'coinflip', 'flip', 'swear']
    let nick = client.getCache().client_nickname
    let uid = client.getCache().client_unique_identifier

    if( valid_cmds.includes(cmd) ) { //If a message contains a valid command, log the type of msg
        if( ev.targetmode === 1 ) {
            log.info(`[CMD] Private message from "${nick}" with cmd '${cmd}'`)
            log.silly(`[CMD] Full message contents included: ${msg}`)
        } else if( ev.targetmode === 2 ) {
            log.info(`[CMD] Channel message from "${nick}" with cmd '${cmd}'`)
            log.silly(`[CMD] Full message contents included: ${msg}`)
        } else {
            log.info(`[CMD] Global message from "${nick}" with cmd '${cmd}'`)
            log.silly(`[CMD] Full message contents included: ${msg}`)
        }
    }

    var authlevel = (cfg.moderatorids.includes(uid)) ? 1 : (cfg.fulladminids.includes(uid)) ? 2 : 0
        //Auth levels: {0: user, 1: moderator, 2: full admin}

    switch(cmd) {
        case 'turbopoke':
            //Syntax: !turbopoke {#pokes} {name}
            if( authlevel >= 1 ) {
                var syntax = "Syntax: ![b]turbopoke[/b] {[i]pokes[/i]} {[i]nickname[/i]}"
                if( args[1] && args[2] ) {
                    if( Number.isInteger(parseInt( args[1] )) ) {
                        let user_search = args.slice(2).join(' ')
                        ts.getClientByName(user_search)
                            .then( target => {
                                if( target !== undefined ) {
                                    if( args[1] <= 50 ) {
                                        let target_nick = target.getCache().client_nickname
                                        let target_id = target.getCache().clid
                                        let pokes = parseInt(args[1])
                                        
                                        ts.sendTextMessage(client.getID(), 1, `Poking "${target.getCache().client_nickname}" ${pokes} times.`)
                                        log.info(`[POKE] Poking "${target.getCache().client_nickname}" ${pokes} times.`)
                                        let count = 1
                                        let pokeInterval = setInterval( () => {
                                            target.poke('')
                                            if( count === pokes ) clearInterval(pokeInterval)
                                            count++
                                        }, 500)
                                    } else {
                                        ts.sendTextMessage(client.getID(), 1, `This command accepts a maximum of 50 pokes.`)
                                    }
                                } else {
                                    log.debug(`[POKE] Command '${cmd}' could not find client ${user_search}.`)
                                    ts.sendTextMessage(client.getID(), 1, `Command '${cmd}' could not find client ${user_search}.`)
                                }
                            }).catch( err => log.error(err) )
                    } else {
                        log.debug(`[POKE] Issue with '${cmd}' argument 1: NaN.`)
                        ts.sendTextMessage(client.getID(), 1, `The first argument given is not a number! ${syntax}`)
                    }
                } else {
                    log.debug(`[POKE] Command '${cmd}' is missing an argument.`)
                    ts.sendTextMessage(client.getID(), 1, `Command is missing arguments! ${syntax}`)
                }
            }
        break;

        case 'last':
        case 'seen':
            //Syntax: !{seen|last} {name}
            var syntax = "Syntax: !{[b]seen[/b] | [b]last[/b]} {[i]nickname[/i]}"
            if( args[1] ) {
                let user_search = args.slice(1).join(' ')
                ts.clientDBFind(user_search, false)
                    .then( results => {
                        if( Array.isArray(results) ) { //If the search returns an array of multiple results
                            let dbidArray = results.map(key => key.cldbid)
                            var resp = `Found ${dbidArray.length} matching clients in the database:\n`
                            let count = 0
                            dbidArray.forEach( element => { //For each element in the array of DBIDs
                                ts.clientDBInfo(element)
                                    .then( user => {
                                        let last_d = epochToLocale(user.client_lastconnected)
                                        let last_t = epochToLocale(user.client_lastconnected, 'time')
                                        let user_nick = user.client_nickname
                                        count++
                                        resp += `\n[B]${user_nick}[/B]: Last seen on ${last_d} at ${last_t}`
                                        if( count === dbidArray.length ) ts.sendTextMessage(client.getID(), 1, resp)
                                    }).catch( err => log.error(err) )
                            })
                        } else {
                            let cldbid = results.cldbid
                            ts.clientDBInfo(cldbid)
                                .then( user => {
                                    let last_d = epochToLocale(user.client_lastconnected)
                                    let last_t = epochToLocale(user.client_lastconnected, 'time')
                                    let user_nick = user.client_nickname
                                    let resp = "Found 1 matching client in the database:"                   
                                    resp += `\n[B]${user_nick}[/B]: Last seen on ${last_d} at ${last_t} Eastern Time`
                                    
                                    ts.sendTextMessage(client.getID(), 1, resp)
                                }).catch( err => log.error(err) )
                        }
                        log.verbose(`Returning matching clients in database for '${cmd}' command from "${nick}".`)
                    })
                    .catch( err => {
                        if( err.id === 1281 ) {
                            log.debug(`Command '${cmd}' couldn't find any results for "${user_search}."`)
                            ts.sendTextMessage(client.getID(), 1, "No matching clients found in the database!")
                        } else if( err.id = 1542 ) {
                            log.debug(`Command '${cmd}' caught TS3 error: "missing required parameter."`)
                            ts.sendTextMessage(client.getID(), 1, `Command is missing required parameter! ${syntax}`)
                        } else {
                            log.error(err)
                        }
                    })
            } else {
                log.debug(`Command '${cmd}' missing argument.`)
                ts.sendTextMessage(client.getID(), 1, `Command is missing a required argument! ${syntax}`)
            }
        break;

        case 'rawclientinfo':
            //Syntax !rawclientinfo {client uid} [log | logfull]
            if( authlevel >= 1 ) {
                var syntax = "Syntax: ![b]rawclientinfo[/b] {[i]client uid[/i]} [log | logfull]"
                if( args[1] ) {
                    let target_uid = args[1]
                    ts.getClientByUID(target_uid)
                        .then( target => {
                            if( target !== undefined ) {
                                if( args[2] === "log" ) {
                                    console.log(target.getCache())
                                    ts.sendTextMessage(client.getID(), 1, `Cached client info sent to logs.`)
                                } else if( args[2] === "logfull" ) {
                                    console.log(target)
                                    ts.sendTextMessage(client.getID(), 1, `Complete client info sent to logs.`)
                                } else {
                                    let resp = `Info for client ${target.getCache().client_nickname}:\n${JSON.stringify(target.getCache(), null, 4)}`
                                    ts.sendTextMessage(client.getID(), 1, resp)
                                    log.debug(`Responded with info for client with UID '${target_uid}'.`)
                                }
                            } else {
                                log.debug(`Command '${cmd}' cannot find specified client.`)
                                ts.sendTextMessage(client.getID(), 1, `Cannot find the client specified!`)
                            }
                        }).catch( err => log.error(err) )
                } else {
                    log.debug(`Command '${cmd}' missing argument.`)
                    ts.sendTextMessage(client.getID(), 1, `Command is missing a required argument! ${syntax}`)
                }
            }
        break;

        case 'commands':
            //Syntax !commands [auth level]
            if ( authlevel === 1 ) {
                if( ['0', '1'].includes(args[1]) ) {
                    listCommands(authlevel, client, args[1])
                } else if( args[1] !== undefined ) {
                    ts.sendTextMessage(client.getID(), 1, `Error with argument in command syntax.\n`)
                } else {
                    listCommands(authlevel, client)
                }
            } else if( authlevel === 2 ) {
                if( ['0', '1', '2'].includes(args[1]) ) {
                    listCommands(authlevel, client, args[1])
                } else if( args[1] !== undefined ) {
                    ts.sendTextMessage(client.getID(), 1, `Error with argument in command syntax.\n`)
                } else {
                    listCommands(authlevel, client)
                }
            } else {
                listCommands(authlevel, client)
            }
        break;

        case 'gm': //ts.gm() is buggy, code works but throws a TypeError
            //Syntax !gm {message}
            if( authlevel === 2 ){
                var syntax = "Syntax: ![b]gm[/b] {[i]message[/i]}"
                if( args[1] ) {
                    let resp = msg.substr(cmd.length+2)    
                    log.info(`Sending gm "${resp}"`)
                    ts.gm(resp)
                } else {
                    log.debug(`Command '${cmd}' missing argument.`)
                    ts.sendTextMessage(client.getID(), 1, `Command is missing a required argument! ${syntax}`)
                }
            }
        break;

        case 'broadcast':
            //Syntax !broadcast {message}
            if( authlevel === 2 ){
                var syntax = "Syntax: ![b]broadcast[/b] {[i]message[/i]}"
                if( args[1] ) {
                    let resp = msg.substr(cmd.length+2)    
                    log.info(`Sending broadcast "${resp}"`)
                    ts.sendTextMessage('', 3, resp)
                } else {
                    log.debug(`Command '${cmd}' missing argument.`)
                    ts.sendTextMessage(client.getID(), 1, `Command is missing a required argument! ${syntax}`)
                }
            }
        break

        case 'welcome':
            //Syntax !welcome
            sendWelcomeMessage(client)
        break;

        case 'playercount':
            //Syntax !playercount {appid}
            let appid = args[1]
            appid = (appid.toLowerCase() == "lawbreakers") ? 350280 : args[1]
            var syntax = `![color=#00825a][b]playercount[/b][/color] {[i]appid[/i]} - Displays number of players on the game with the specified ID. Accepts appids or "lawbreakers."`
            if( appid != undefined && Number.isInteger(parseInt(appid)) ){
                getPlayerCount(client, appid, (count, appname) => {
                    if( ev.targetmode === 3 ) {
                        ts.sendTextMessage('', 3, `Current ${appname} player count: [b]${count}[/b]`)
                    } else if( ev.targetmode === 2 ) {
                        ts.sendTextMessage(client.getCache().cid, 2, `Current ${appname} player count: [b]${count}[/b]`)
                    } else {
                        ts.sendTextMessage(client.getID(), 1, `Current ${appname} player count: [b]${count}[/b]`)
                    }
                })
            } else {
                log.debug(`Command '${cmd}' missing argument or argument is NaN.`)
                ts.sendTextMessage(client.getID(), 1, `Command is missing a required argument or the argument is not a number! ${syntax}`)
            }
        break;

        case 'roll':
        case 'diceroll':
            //Syntax !diceroll [upper #]
            let upper_limit = 6, roll_result = null

            if( args[1] && Number.isInteger(parseInt(args[1])) && args[1] > 0 ) {
                upper_limit = args[1]
            }
            
            roll_result = Math.floor( Math.random() * Math.floor(upper_limit) ) + 1

            log.verbose(`[RNG] Diceroll (1-${upper_limit}) resulted in "${roll_result}"`)
            if( ev.targetmode === 3 ) {
                ts.sendTextMessage('', 3, `On a die labeled 1 to ${upper_limit}, you rolled a [u]${roll_result}[/u]`)
            } else if( ev.targetmode === 2 ) {
                ts.sendTextMessage(client.getCache().cid, 2, `On a die labeled 1 to ${upper_limit}, you rolled a [u]${roll_result}[/u]`)
            } else {
                ts.sendTextMessage(client.getID(), 1, `On a die labeled 1 to ${upper_limit}, you rolled a [u]${roll_result}[/u]`)
            }
        break;

        case 'flip':
        case 'coinflip':
            //Syntax !coinflip
            let flip_result = null
            flip_result = Math.floor( Math.random() * 2 )
            flip_result = (flip_result === 0) ? "tails" : "heads"

            log.verbose(`[RNG] Coinflip resulted in "${flip_result}"`)
            if( ev.targetmode === 3 ) {
                ts.sendTextMessage('', 3, `Coin flipped! You landed on [u]${flip_result}[/u].`)
            } else if( ev.targetmode === 2 ) {
                ts.sendTextMessage(client.getCache().cid, 2, `Coin flipped! You landed on [u]${flip_result}[/u].`)
            } else {
                ts.sendTextMessage(client.getID(), 1, `Coin flipped! You landed on [u]${flip_result}[/u].`)
            }
        break;            
    }
})

ts.on('error', err => log.error(err))
ts.on('close', ev => log.info("Connection has been closed:", ev))

// Command functions
function listCommands(authlevel, client, viewlevel) { //TODO: Further streamline all this text
    var command_list = "", command_list_mod = "", command_list_full = ""
    let commands_syntax_lv0 = "![color=#00825a][b]commands[/b][/color] - Returns this information you're reading now.\n"
    let commands_syntax_lv1 = "![color=#d58500][b]commands[/b][/color] [[i]auth level[/i]] - Returns this information you're reading now. - [u]Note:[/u] Auth levels: 0=user, 1=moderator\n"
    let commands_syntax_lv2 = "![color=#ff3300][b]commands[/b][/color] [[i]auth level[/i]] - Returns this information you're reading now. - [u]Note:[/u] Auth levels: 0=user, 1=moderator, 2=fulladmin\n"

    var setCMDLists = function() {
        command_list += `![color=#00825a][b]welcome[/b][/color] - Displays the welcome message.\n`
        command_list += `!{[color=#00825a][b]seen[/b][/color] | [color=#00825a][b]last[/b][/color]} {[i]nickname[/i]} - Returns last time the indicated client was online.\n`
        command_list += `![color=#00825a][b]playercount[/b][/color] {[i]appid[/i]} - Displays number of players on the game with the specified ID. Accepts appids or "lawbreakers."\n`
        command_list += `!{[color=#00825a][b]diceroll[/b][/color] | [color=#00825a][b]roll[/b][/color]} [[i]upper value[/i]] - Returns a pseudo-random number between 1 and the [u]positive whole number[/u] specified. Default upper value is 6.\n`
        command_list += `!{[color=#00825a][b]coinflip[/b][/color] | [color=#00825a][b]flip[/b][/color]} - Emulates a coinflip and returns "heads" or "tails."`
        
        command_list_mod += `![color=#d58500][b]turbopoke[/b][/color] {[i]pokes[/i]} {[i]nickname[/i]} - Pokes the indicated client a given amount of times. Max 50.\n`
        command_list_mod += `![color=#d58500][b]rawclientinfo[/b][/color] {[i]client uid[/i]} [log | logfull] - Dumps client information using the given client unique identifier, optionally logging it.\n`
        
        command_list_full += `![color=#ff3300][b]broadcast[/b][/color] {[i]message[/i]} - Sends the given message as a broadcast from the bot to the current server.\n`
        command_list_full += `![color=#ff3300][b]gm[/b][/color] {[i]message[/i]} - Sends the given message as a global message to all virtual servers.\n`
        command_list_full += commands_syntax_lv2
    }

    var catchOverCharLimit = function(err) {
        if( err.id === 1541 ) {
            log.warn("[COMMANDS] Too many characters in message:", err)
        } else {
            log.error(err)
        }
    }

    if( viewlevel !== undefined ) {
        command_list = `The following bot commands are available to you (auth level ${authlevel}, viewing level ${viewlevel}):\n`
        command_list_mod = `The following mod commands are also available (auth level ${authlevel}, viewing level ${viewlevel}):\n`
        command_list_full = `You also have access to full admin commands (auth level ${authlevel}, viewing level ${viewlevel}):\n`

        setCMDLists()

        if( viewlevel == 0 ) command_list += commands_syntax_lv0
        if( viewlevel == 1 ) command_list_mod += commands_syntax_lv1
        
        if( viewlevel >= 0 ) {
            ts.sendTextMessage( client.getID(), 1, command_list ).catch( err => catchOverCharLimit(err) )
        }
        if( viewlevel >= 1 ) {
            ts.sendTextMessage( client.getID(), 1, command_list_mod ).catch( err => catchOverCharLimit(err) )
        }
        if( viewlevel == 2 ) {
            ts.sendTextMessage( client.getID(), 1, command_list_full ).catch( err => catchOverCharLimit(err) )
        }

    } else {
        command_list = `The following bot commands are available to you:\n`
        command_list_mod = `The following mod commands are also available:\n`
        command_list_full = `You also have access to full admin commands:\n`

        setCMDLists()

        if( authlevel == 0 ) command_list += commands_syntax_lv0
        if( authlevel == 1 ) command_list_mod += commands_syntax_lv1

        if( authlevel >= 0 ) {
            ts.sendTextMessage( client.getID(), 1, command_list ).catch( err => catchOverCharLimit(err) )
        }
        if( authlevel >= 1 ) {
            ts.sendTextMessage( client.getID(), 1, command_list_mod ).catch( err => catchOverCharLimit(err) )
        }
        if( authlevel == 2 ) {
            ts.sendTextMessage( client.getID(), 1, command_list_full ).catch( err => catchOverCharLimit(err) )
        }
    }
}

function getPlayerCount(client, appid, callback) { //TODO: Could use optimization, pretty solid for now though so low priority
    var playercount_url = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?format=json&appid=' + appid
    var appinfo_url_store = 'https://store.steampowered.com/api/appdetails/?appids=' + appid
    var appinfo_url_full = 'https://api.steampowered.com/ISteamApps/GetAppList/v0001/'
    var count = null, appname = null

    https.get(playercount_url, resp => {
        var data = ''

        resp.on('data', chunk => {
            data += chunk
        })

        resp.on('end', () => {
            if( JSON.parse(data).response.result == 1 ) {
                count = JSON.parse(data).response.player_count

                https.get(appinfo_url_store, resp => { //First get name from the store details page
                    var data = ''
            
                    resp.on('data', chunk => {
                        data += chunk
                    })
            
                    resp.on('end', () => {
                        if( JSON.parse(data)[parseInt(appid)].success === true ) {
                            appname = JSON.parse(data)[parseInt(appid)].data.name

                            log.info(`[STEAM] Returning data for ${appname}, appid ${appid}`)
                            callback(count, appname)
                        } else {
                            log.debug(`[STEAM] Steam store api missing name for appid ${appid}`)
                            https.get(appinfo_url_full, resp => { //Finally resort to the full list from ISteamApps
                                var data = ''

                                resp.on('data', chunk => {
                                    data += chunk
                                })

                                resp.on('end', () => {
                                    let game = JSON.parse(data).applist.apps.app.filter( obj => 
                                        obj.appid === parseInt(appid)
                                    )[0]
                                    appname = game.name

                                    log.info(`[STEAM] Returning data for ${appname}, appid ${appid}`)
                                    callback(count, appname)
                                })
                            })
                        }
                    })
                }).on("error", err => log.error("[STEAM] Error fetching game name:", err) )
            } else {
                ts.sendTextMessage(client.getID(), 1, "No Steam game exists with that AppID.")
            }
        })
    }).on("error", err => log.error("[STEAM] Error fetching game player count:", err) )
}

// Passive teamspeak functions
function sendWelcomeMessage(client) {
    if( !client || client.isQuery() ) return
    let nick = client.getCache().client_nickname
    ts.clientDBInfo(client.getCache().client_database_id) //Welcome message handling
        .then( cl => {
            let created_date = epochToLocale(cl.client_created)
            let created_time = epochToLocale(cl.client_created, "time")
            let visit_count = cl.client_totalconnections.toString()

            let end = visit_count.slice(-1)
            let num_suffix = (end == 1) ? "st" : (end == 2) ? "nd" : (end == 3) ? "rd" : "th"

            let welcome = `Hello [b]${nick}[/b], this is your ${visit_count + num_suffix} visit!\n`
            welcome += `Your first was on ${created_date} at ${created_time} EST.\n`
            welcome += `Commands for this bot are always prefixed with [b]'.' or '!'[/b] - you can use the command 'commands' to see what functions are available to you.`

            log.info(`[WELCOME] Sending welcome message to "${nick}".`)
            ts.sendTextMessage(client.getID(), 1, welcome)
        }).catch( err => log.error("[WELCOME] Welcome handling error:", err) )
}

/*

function idleClientCheck(client) { //FIXME: Doesn't work on linux VPS?
    var prev_channelid = null, idleInterval

    client.on('clientdisconnect', () => {
        clearInterval(idleInterval)
    })

    idleInterval = setInterval( () => {
        if( client ) {
            client.getInfo()
                .then( cl => {
                    var isAFK = false
                    let idletime = cl.client_idle_time
                    let inputmute = cl.client_input_muted
                    let outputmute = cl.client_output_muted
                    let away = cl.client_away

                    isAFK = ( away == 1 || inputmute == 1 || outputmute == 1 ) ? true : false

                    if( isAFK && idletime >= 1200000 ) {
                        if( cl.cid !== cfg.idlechannelid && !cfg.idlesafechannelids.includes(cl.cid) ) {
                            prev_channelid = cl.cid
                            let notify = "You were moved because your client is muted. You will be moved back to your last channel when you unmute."
                            log.info(`[IDLE] Moving client "${cl.client_nickname}" to idle channel id ${cfg.idlechannelid}.`)

                            client.move(cfg.idlechannelid).catch( err => log.error("[IDLE] Client move error:", err) )
                            ts.sendTextMessage(client.getID(), 1, notify).catch( err => log.error("[IDLE] Client message error:", err) )
                        }
                    }

                    if( !isAFK ) {
                        if( cl.cid == cfg.idlechannelid && prev_channelid ) {
                            log.info(`[IDLE] Returning client "${cl.client_nickname}" to channel id ${prev_channelid}.`)

                            client.move(prev_channelid).catch( err => log.error("[IDLE] Client return error:", err) )
                            prev_channelid = null
                        }
                    }

                }).catch( err => log.error("[IDLE] Info retrieval error:", err) )
        } else return
    }, 1000)
}

*/

function sgProtCheck(client) {
    let nick = client.getCache().client_nickname
    let uid = client.getCache().client_unique_identifier

    var sgProtInterval = setInterval( () => { //Server group protection handling
        client.getInfo()
            .then( cl => {
                cl.client_servergroups.forEach( sgid => {
                    if( cfg.sgprotids.includes(sgid) && !cfg.sgprotclients[sgid.toString()].includes(uid) ) {
                        ts.getServerGroupByID(sgid)
                            .then( group => {
                                client.serverGroupDel(sgid)
                                client.poke(`The server group [B]${group.getCache().name}[/B] is protected!`)

                                log.info(`[SGPROT] Removing client "${nick}" from server group "${group.getCache().name}" with id ${sgid}.`)
                            }).catch( err => log.error("[SGPROT] Group removal error:", err) )
                    }
                })
            }).catch( err => log.error("[SGPROT] Info retrieval error:", err) )
    }, 2000)

    client.on('clientdisconnect', () => {
        clearInterval(sgProtInterval)
    })
}

// Utility functions
function epochToLocale(epochSecs, type) {
    let locale_date = new Date(0)
    locale_date.setUTCSeconds(epochSecs)
    if( type === 'time' ) {
        return locale_date.toLocaleTimeString('en-US')
    } else {
        return locale_date.toLocaleDateString('en-US')
    }
}