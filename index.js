/**
 * Get Unicom Publish IP and bind to Ali DNS Resolve Server automatic.
 *
 * check every half hour, if the Unicom Publish IP change, will Ali DNS API
 * to update dns resolve recorder
 *
 * Environment Variable Configure Before Run This Program:
 * 1. ACCESS_KEY, Ali Yun access key id
 * 2. ACCESS_SECRET, Ali Yun access secret
 * 3. DOMAIN, the domain used to bind,like pi.arui.me
 *
 * @author Chen Rui
 */
const fetch = require('node-fetch');
const fs = require('fs');
const process = require('process');
const crypto = require('crypto');
const alidns = require('./ali-dns-api')

const IP_CHECK_URL = 'http://1212.ip138.com/ic.asp';
const IP_PATTERN = /\b(\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3})\b/;

const ALI_DOMAIN = process.env.DOMAIN;

/**
 * Get Unicom Publish IP.
 *
 * @returns {*}
 */
const getUnicomPublishIP = function () {
    return fetch(IP_CHECK_URL).then(function (res) {
        return res.text();
    }).then(function (body) {
        const match = IP_PATTERN.exec(body);
        if (match) return match[0];
    });
}

/**
 * Bind Unicom IP to Ali DNS Resolve Server.
 *
 * @param ip
 */
const bindDnsResolve = function (ip) {
    return alidns.describeSubDomainRecords(ALI_DOMAIN, 'A').then(function (res) {
        if (res.DomainRecords && res.DomainRecords.Record && res.DomainRecords.Record.length > 0) {
            var record = res.DomainRecords.Record[0];
            return record;
        } else {
            return Promise.reject('mis dns record');
        }
    }).then(function (record) {
        console.log("begin binding " + ip + " to record " + record.RecordId);
        return alidns.updateDomainRecord(record.RecordId, record.RR, record.Type, ip);
    }).then(function (res) {
        console.log(res);
        console.log("bind " + ip + " successfully, ready to record ip!")
        fs.writeFile('./ip.txt', ip, 'utf8');
    })
}

const autoDnsBinding = function () {
    const localIp = fs.readFileSync('./ip.txt', 'utf-8');
    console.log("run auto dns binding at " + new Date().toISOString());
    getUnicomPublishIP()
        .then(function (ip) {
            if (ip === localIp) {
                console.log("get unicom ip : [" + ip + "] equals with last unicom ip!");
                return;
            }
            console.log("unicom ip change, new unicom ip : [" + ip + "]!");
            return bindDnsResolve(ip);
        }).then(undefined, function (error) {
            return error.text();
        }).then(function (body) {
            if(body) {
                console.error(body);
            }
        });
}

autoDnsBinding();
setInterval(autoDnsBinding, 3600000);