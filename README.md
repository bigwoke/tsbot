# tsbot
Well would you look at that, I rewrote this one too. I like TS3 better than discord, so it only felt natural to update the teamspeak bot to something better as well. This bot was built with my own TeamSpeak server in mind, with some inspiration taken from [JTS3ServerMod](https://www.stefan1200.de/forum/index.php?topic=2.0). I felt JTS3ServerMod was useful, but I wanted to make something that was more tailored to my own purposes and without much fluff. I also was interested in starting another project anyway, and this seemed like a good fit.

## Features

All that being said, the features with this bot are somewhat light. There are currently two what I call "passive" features:

- Welcome messaging - pretty straightforward, sends a message to clients upon joining the server with some cool information attached (connections, first connection, etc).
- Server group protection - essentially a server group whitelist, where only users with certain unique IDs can be added to specified server groups.
- Automatic server group membership based on IP - sets a client to a specified server group on connection if their IP address matches.

There are also an ever-increasing amount of neat commands:

- 8ball - Theoretical magic 8 ball with a pool of 20 typical responses
- broadcast - Sends a message to the current virtual server
- clientinfo - Dumps standard information about a client
- coinflip - Flips a coin, 50/50 RNG
- define - Finds the definition for the given word
- diceroll - Rolls a die with the given amount of sides
- help - Displays all commands the user has access to
- msggroup - Sends a message to online members of a given server group
- msguser - Sends a message to the given online user
- playercount - Returns the player count of the given Steam game
- seen - Shows the last time any users with the specified username were online
- sgplist - Lists currently protected server groups
- turbopoke - Pokes the target user up to 60 times twice per second
- urban - Gets the top entries for a search term from Urban Dictionary
- welcome - Manually invokes the welcome message function
- whois - Returns basic information about any client based on unique ID

Along with some useful, typically maintenence-based 'root' commands: 

- disable - Disables the given command if it's enabled and non-root
- enable - Enables the given command if it's disabled
- gm - Sends the given message to all virtual servers
- reload - Reloads the given command
- sgpadd - Adds the given user to the protected list for the given server group
- sgprm - Removes the given user from a group's protected list
- ipgadd - Assigns a server group to an IP address
- ipgrm - Removes a server group assignment from an IP address
- ipglist - Lists the server groups assigned to their respective IP addresses.

Everything that isn't considered a root command can be toggled, including the passive functions.

## Installing

The bot requires [Node.js](https://nodejs.org/).

Clone the repo into its own directory, and set up the following:

### Configuration

Two things need to be done to configure the bot to the fullest extent. Most of the configurable options can be put in a `.env` file. However, due to the nature of the server group protection feature, its configuration must be done in `sgprot.json`. Of course, you could change all the values in `sgprot.json`, but there is a preferred (and supported) way to configure this instead. I'll cover the ENV file first.

#### 1) .ENV

Create a file in the root directory that you cloned the repo to earlier, and name it simply `.env`. Below are all the possible configuration options you can put in this file. Only the `TS_PASS` option is technically required for the bot to function, but you will need to add yourself to `ROOT_USERS` to fully control the bot. Connection options are highly recommended for the sake of completeness, everything else has a default value of some kind if necessary, and are therefore not required to be in this file if you want to leave them out. Defaults can be found in `config.js`.

```INI
##################################
# TS3 Server Connection Settings #
##################################

# Serverquery protocol (ssh or raw)
TS_PROTO='ssh'
# Server address
TS_HOST='localhost'
# Serverquery port (defaults: ssh=10022, raw=10011)
TS_QUERY=10022
# Virtual server port (the one you use when joining the server)
TS_PORT=9987
# Serverquery admin username
TS_USER='serveradmin'
# [REQUIRED] Serverquery admin password
TS_PASS=''

#####################
# Bot User Settings #
#####################

# The bot's nickname in TS
NICKNAME='tsbot'
# The ID of the channel in which you want the bot to reside
HOMECID=
# The prefix entered before commands
PREFIX='!'
# Users with full access to every feature of the bot.
# Correct values are unique IDs of teamspeak clients. Comma delimited.
ROOT_USERS='AbCdEfGhIjKlMnOpQrStUvWxYzA=, AzYwXvUtSrQpOnMlKjIhGfEdCbA='
# Users with access to "more responsible" bot features. Comma delimited.
MOD_USERS=''

###########
# Modules #
###########

# Should welcome messages be enabled?
WELCOME='true'
# Should server group protection be enabled?
SGPROT='false'
# Should automatic group membership be enabled?
IPGROUPS='false'

###########
# Logging #
###########

# Console log level. I don't recommend changing this but it's an option.
# Valid log levels are the same as those used by NPM.
# Note that output.log will always be at debug level regardless.
LOGLEVEL='info'
```

#### 2) Server group protection

One feature of this bot is server group protection, as you can read about above. If you choose to use this feature, it must be configured to work properly. Technically you can manually edit `sgprot.json` in the root directory, but there is an easier way to do this:

**Important:**

It is very important that you keep a list of users and their respective server groups *before* you start setting this up, and I'll tell you why. The first time you add a user to a protected server group, if there are any other users online in the server when this happens, their groups will be revoked, and you will need to re-add them after using `sgpadd` on those users. For this reason, I also highly recommend you add yourself to the appropriate group you want protected to avoid inadvertently removing your own admin. If this does happen, don't worry, you can fix it using ssh/telnet serverquery and the credentials you're using for the bot. However, that's a lot of work for a simple mistake, so it's obviously best to make sure you don't get to that point in the first place.

That being said, let's move on.

To configure server group protection, you must be a root user, then you can use `sgpadd` to add protected users to server groups, and in doing so, protecting those server groups. Use `help` for information about the commands related to group protection. Note: the file `sgprot.json` must be able to be edited, which shouldn't be a problem on Windows, but Linux users should be wary about giving this file the correct permissions.

### Running the bot

Once you've configured everything above, starting and running the bot should be as simple as running `node bot.js` in the bot's root directory. If something goes wrong, follow the error thrown in the command prompt window you started the bot from. If that's not helpful, check that there are no syntax errors in the config file if you edited it, and all information required is present in `.env`.

## Known Issues

1. Using the `enable` command will crash/restart the bot, thereby enabling all commands (assuming its module is enabled) and forcing the user to reopen a chat dialog with the bot.
2. The `gm` command will function properly, but it will come with a TypeError. I think the issue is with the `ts3-nodejs-library` dependency, but I need to look into it.