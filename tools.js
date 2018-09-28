function epochNumberToDate(epochSeconds, type) {
    let locale_date = new Date(0);
    locale_date.setUTCSeconds(epochSeconds);

    switch(type) {
    case 't': return locale_date.toLocaleTimeString('en-US');
    case 'd': return locale_date.toLocaleDateString('en-US');
    default: return `${locale_date.toLocaleDateString('en-US')} ${locale_date.toLocaleTimeString('en-US')}`;
    }
}

function refreshModule(modulePath) {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
}

module.exports = {
    toDate: epochNumberToDate,
    refresh: refreshModule
};