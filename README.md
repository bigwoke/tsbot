# tsbot
This bot was built with my own TeamSpeak server in mind, with some inspiration taken from [JTS3ServerMod](https://www.stefan1200.de/forum/index.php?topic=2.0). I felt JTS3ServerMod was useful, but I wanted to make something that was more tailored to my own purposes and without much fluff. I also was interested in starting another project anyway, and this seemed like a good fit.

## Features

That being said, the features with this bot are (arguably) somewhat light, and mostly modular. There are currently three what I call "passive" features:

- Welcome messaging - pretty straightforward, sends a message to clients upon joining the server with some cool information attached (connections, first connection, etc).
- Server group protection - essentially a server group whitelist, where only users with certain unique IDs can be added to specified server groups.
- Automatic server group assignment - sets a client to a specified server group on connection based on IP address.
- Quote keeping - moderator-status users defined in `.env` can add quotes, their respective users, and optionally the time at which they were spoken (defaults to current time).

There plenty of neat general commands for everyone:

- 8ball - Theoretical magic 8 ball with a pool of 20 typical responses
- coinflip - Flips a coin, 50/50 RNG
- define - Finds the definition for the given word
- diceroll - Rolls a die with the given amount of sides
- help - Displays all commands the user has access to
- playercount - Returns the player count of the given Steam game
- quote - Returns a quote, optionally from a specific user or a chosen quote
- seen - Shows the last time any users with the specified username were online
- urban - Gets the top entries for a search term from Urban Dictionary
- welcome - Manually invokes the welcome message function
- whois - Returns basic information about any client based on unique ID

Some tools for moderators or trusted users with elevated permissions:

- adduser - Adds a user to the database
- autolist - Lists the server groups assigned to their respective IP addresses
- addquote - Adds a quote, the user who said* it, and optionally a date to the database
- broadcast - Sends a message to the current virtual server
- clientinfo - Dumps standard information about a client
- grouplist - Lists all groups and their protected and auto-assigned users
- msggroup - Sends a message to online members of a given server group
- msguser - Sends a message to the given online user
- turbopoke - Pokes the target user up to 60 times twice per second
- userlist - Lists all users in the database
- protlist - Lists server groups with users auto-assigned to them

Along with some useful, typically maintenence-based 'root' commands: 

- addauto - Assigns a server group to an IP address
- addgroup - Adds an existing servergroup to the database
- adduid - Adds a unique ID to an existing user
- addprot - Adds the given user to the protected list for the given server group
- delauto - Removes a server group assignment from an IP address
- delgroup - Deletes a group from the database
- delprot - Removes the given user from a group's protected list
- delquote - Deletes a quote from the database
- deluid - Removes a unique ID from a user
- deluser - Deletes a user from the database
- disable - Disables the given command if it's enabled and non-root
- enable - Enables the given command if it's disabled
- gm - Sends the given message to all virtual servers
- protgroup - Toggles group protection for an existing servergroup
- reload - Reloads the given command

Everything that isn't considered a root command can be toggled via `disable` command or by removing the corresponding JS file from the `./commands` directory. All passive functions listed above can also be toggled.

## Installation and Configuration

The bot requires [Node.js](https://nodejs.org/). Clone the repo into its own directory, and run `node bot.js` after configuration.

Most of the configurable options can be put in a `.env` file. Server group protection and automatic group assignment can themselves be configured in two ways: either via file (`sgprot.json` and `autogroups.json` respectively), or using a MongoDB database.

### 1) .ENV

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

###############################
# Database Connection Settings#
###############################

# Database address
DB_HOST='localhost'
# Access port
DB_PORT=27017
# Database name
DB_NAME='db'
# If both of these credentials are set, they will be used
# The bot can be run on an insecure db (not recommended)
# Database login username
DB_USER=''
# Database login password
DB_PASS=''
# Custom MongoDB connection URI string.
# If specified, all other connection info is ignored.
DB_URI=''

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

# Do you have a database to use with the bot?
DB='false'
# Should welcome messages be enabled?
WELCOME='true'
# Should server group protection be enabled?
SGPROT='false'
# Should automatic group membership be enabled?
AUTOGROUPS='false'
# Should quote keeping be enabled?
QUOTES='false'

###########
# Logging #
###########

# Console log level. I don't recommend changing this but it's an option.
# Valid log levels are the same as those used by NPM.
# Note that output.log will always be at debug level regardless.
LOGLEVEL='info'
```

### 2) MongoDB Database

A large, though optional, feature of this bot is its utilization of a MongoDB database. If proper credentials are given in the config and its module is enabled, the following commands will be available for use. All of them can be located in `./commands/db/`. All names are case sensitive, and **all deletions are final. There is no warning or confirmation.** You must be a root user to do any command that modifies user or group data (except for `adduser`, which works for mod users).

#### __Database management commands__

##### User management:

- Adding users: `adduser <name> [unique ID]`
  - Providing a unique id is optional, but necessary if the user is to be part of a protected group.

- Removing users: `deluser <name>`
  - Removes an entire user document from the database.

- List all users: `userlist`
  - Will list users by name, giving their Mongo ObjectId and unique IDs.

- Adding unique IDs to existing users: `adduid <name> <unique ID>`
  - Adds the given unique ID to a specified user.

- Removing unique IDs from existing users: `deluid <name> <unique ID>`
  - The argument `*` can be passed as a unique ID to remove all unique IDs from a user.

##### Group management:

- Adding groups: `addgroup <group id>`
  - The group document with the given group ID will use the same name as the server group itself.

- Removing groups: `delgroup <group id>`
  - Removes an entire group document from the database. This is non-reversible.

- List all users: `grouplist`
  - Lists all groups by ID, shows their name, authorized users, and automatically assigned users.

- Toggle group protection: `groupprot <group id>`
  - Toggles the group's protection status. Groups are unprotected by default on creation.

### 3) Database-based passive modules (sgprot, autogroups)

The above mentioned passive modules are best used with a database, but can be used without. If you do not plan on using a database, the next section will be of more interest to you.
All configuration for these modules is done via commands in view of the serverquery client, and there is no need to edit manual files. You must be a root user for all configuration.
If there's any confusion or need for more information, using the `help` command may be of use to you. Usernames are case sensitive, and must exactly match an existing user in the database.

#### __Configuration commands and their respective functionality__

##### Server group protection:

- Adding protected users: `addprot <group id> <username>`
  - Authorizes the given user to be a member of the given group.

- Removing protected users: `delprot <group id> <username>`
  - Deauthorizes the given user from the given group.

- List all protected users: `protlist`
  - Note: this command is inferior to `grouplist`, and only exists for non-db implementations.

##### Auto group assignment:

- Adding auto-assigned users: `addauto <group id> <username>`
  - Sets the given user to be added to the given group on connection, if they are not already a member.

- Removing auto-assigned users: `delauto <group id> <username>`
  - Removes auto-assignment from the given user, they will no longer be given the group on connection.

- List all auto-assigned users: `autolist`
  - Note: like `protlist`, this command is also inferior to `grouplist`, and is here for file-based configurations.

### 4) File-based passive modules (sgprot, autogroups)

Assuming you are not using a database, these two passive features are still usable. Setting them up follows a similar method as if you were using a database (except `<username>` takes a unique ID, see `help` with the appropriate modules enabled/disabled for more info). The only difference being the information will be stored in their respective files instead. Technically you can manually edit `sgprot.json` and `autogroups.json` in the root directory to configure this portion, but I recommend using the command method from above.

**Important:**

It is very important that you keep a list of users and their respective server groups *before* you start setting this up. The first time you add a user to a protected server group, if there are any other users online in the server when this happens, their groups will be revoked, and you will need to re-add them after using `sgpadd` on those users. This portion is specifically for the file version of this implementation, because with the database implementation, groups default to unprotected. For this reason, I also highly recommend you add yourself to the appropriate group you want protected to avoid inadvertently removing your own admin. If this does happen, don't worry, you can fix it using ssh/telnet serverquery and the credentials you're using for the bot. However, that's a lot of work for a simple mistake, so it's obviously best to make sure you don't get to that point in the first place.

Note: the file `sgprot.json` must be able to be edited, which shouldn't be a problem on Windows, but Linux users should be wary about giving this file the correct permissions.

### Running the bot

Once you've configured everything above, starting and running the bot should be as simple as running `node bot.js` in the bot's root directory. If something goes wrong, follow the error in the command prompt window you started the bot from. If that's not helpful, check that there are no syntax errors in the config file if you edited it, and all information required is present in `.env`.

## Known Issues

1. Using the `enable` command will crash/restart the bot, thereby enabling all commands (assuming its module is enabled) and forcing the user to reopen a chat dialog with the bot.
2. The `gm` command will function properly, but it will come with a TypeError. I think the issue is with the `ts3-nodejs-library` dependency, but I need to look into it.