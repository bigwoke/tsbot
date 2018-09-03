function epochToLocale(epochSecs, type) {
    let locale_date = new Date(0);
    locale_date.setUTCSeconds(epochSecs);

    if( type === 'time' ) {
        return locale_date.toLocaleTimeString('en-US');
    } else {
        return locale_date.toLocaleDateString('en-US');
    }
}

function reloadModule(moduleName) {
    delete require.cache[require.resolve(`./${moduleName}`)];
    return require(`./${moduleName}`);
}

module.exports = {
    convertEpoch: epochToLocale,
    reload: reloadModule
};