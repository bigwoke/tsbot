# tsbot
Well would you look at that, I rewrote this one too. I like TS3 better than discord, so it only felt natural to update the teamspeak bot to something better as well. This bot was built with my own TeamSpeak server in mind, with some inspiration taken from [JTS3ServerMod](https://www.stefan1200.de/forum/index.php?topic=2.0). I felt JTS3ServerMod was useful, but I wanted to make something that was more tailored to my own purposes and without much fluff. I also was interested in starting another project anyway, and this seemed like a good fit.

## Features

All that being said, the features with this bot are somewhat light. There are currently two what I call "passive" features:

- Welcome messaging - pretty straightforward, sends a message to clients upon joining the server with some cool information attached (connections, first connection, etc).
- Server group protection - essentially a server group whitelist, where only users with certain unique IDs can be added to specified server groups.

There are also an ever-increasing amount of neat commands:

- broadcast - Sends a message to the current virtual server
- clientinfo - Dumps standard information about a client
- coinflip - Flips a coin, 50/50 RNG
- diceroll - Rolls a die with the given amount of sides
- help - Displays all commands the user has access to
- playercount - Returns the player count of the given Steam game
- seen - Shows the last time any users with the specified username were online
- turbopoke - Pokes the target user up to 60 times twice per second
- welcome - Manually invokes the welcome message function

Along with some useful maintenence-based 'root' commands: 

- disable - Disables the given command if it's enabled and non-root
- enable - Enables the given command if it's disabled
- gm - Sends the given message to all virtual servers (this seems buggy, I have a workaround but chances are it won't work for you)
- reload - Reloads the given command

Everything that isn't considered a root command can be toggled, including the passive functions.

## Installing

The bot requires [Node.js](https://nodejs.org/).

Clone the repo into its own directory, and set up the following:

### Configuration

Two things need to be done to configure the bot to the fullest extent. Most of the configurable options can be put in a `.env` file. However, due to the nature of the server group protection feature, its configuration must be done in `config.js`. Of course, you could change all the values in `config.js`, but I would suggest keeping as much as possible in `.env`. I'll cover that first.

#### 1) .ENV

Create a file in the root directory that you cloned the repo to earlier, and name it simply `.env`. Below are all the possible configuration options you can put in this file. Only the `TS_PASS` option is technically required for the bot to function, but you will need to add yourself to `ROOT_USERS` to fully control the bot. Connection options are highly recommended for the sake of completeness, everything else has a default value of some kind if necessary, and are therefore not required to be in this file if you want to leave them out. Defaults can be found in `config.js`.

```INI
##################################
# TS3 Server Connection Settings #
##################################

# Server address
TS_HOST='localhost'
# Serverquery port
TS_QUERY=10011
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

###########
# Logging #
###########

# Console log level. I don't recommend changing this but it's an option.
# Note that output.log will always be at debug level regardless.
LOGLEVEL='info'
```

#### 2) config.js

One feature of this bot is server group protection, as you can read about above. If you choose to use this feature, it must be configured to work properly. At the top of `config.js`, you'll see the following object:

```JS
const sgProtGroups = {
    6: ['SjfiejahkjNbeyuaikdONDKlemM='],
    7: ['SjfiejahkjNbeyuaikdONDKlemM=', 'wkykjPweaf5tJFMLIloko5MIgrY=']
};
```

This is the configuration for server group protection. If you have any knowledge of JavaScript, this should be relatively straightforward and you probably know what to do from here, but in case you don't I'll try to make it as clear as possible. Each entry (row) represents a group and the users that belong in said group. Each group should have a comma at the end, except for the last one. The number at the beginning is the server group ID, and the array (brackets) contains a comma delimited list of strings containing users' unique IDs. If you plan on using server group protection, you should change the example entries to suit your server groups and users. Follow the example, and if it works you did it, if not come back to this example and see if you have any inconsistencies.

I hope to eventually come up with a better way to configure this option that makes sense and is easily readable, but for now this is what we have.

### Running the bot

Once you've configured everything above, starting and running the bot should be as simple as running `node bot.js` in the bot's root directory. If something goes wrong, follow the error thrown in the command prompt window you started the bot from. If that's not helpful, check that there are no syntax errors in the config file if you edited it, and all information required is present in `.env`.