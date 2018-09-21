function epochToLocale(epochSecs, type) {
    let locale_date = new Date(0);
    locale_date.setUTCSeconds(epochSecs);

    if( type === 'time' ) {
        return locale_date.toLocaleTimeString('en-US');
    } else {
        return locale_date.toLocaleDateString('en-US');
    }
}

function refreshModule(modulePath) {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
}

module.exports = {
    convertEpoch: epochToLocale,
    refresh: refreshModule
};