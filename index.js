/**
 * Get Unicom Publish IP and bind to Ali DNS Resolve Server automatic.
 *
 * check every half hour, if the Unicom Publish IP change, will Ali DNS API
 * to update dns resolve recorder
 *
 * Environment Variable Configure Before Run This Program:
 * 1. ADB_ACCESS_KEY, Ali Yun access key id
 * 2. ADB_ACCESS_SECRET, Ali Yun access secret
 * 3. ADB_DOMAIN, the domain used to bind,like pi.arui.me
 * 4. ADB_INTERVAL_SECOND, the domain used to bind,like pi.arui.me
 *
 * @author Chen Rui
 */
const fetch = require('node-fetch');
const fs = require('fs');
const process = require('process');
const crypto = require('crypto');
const AliDnsAPI = require('./ali-dns-api')

const IP_CHECK_URL = 'http://www.net.cn/static/customercare/yourip.asp';
const IP_PATTERN = /\b(\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3})\b/;

const ALI_DOMAIN = process.env.ADB_DOMAIN;
const ALI_ACCESS_KEY = process.env.ADB_ACCESS_KEY;
const ALI_ACCESS_SECRET = process.env.ADB_ACCESS_SECRET + '&';
const INTERVAL_SECOND = process.env.ADB_INTERVAL_SECOND ? process.env.ADB_INTERVAL_SECOND : 60;

const alidns = AliDnsAPI(ALI_ACCESS_KEY, ALI_ACCESS_SECRET);

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
        console.log("begin binder " + ip + " to record " + record.RecordId);
        return alidns.updateDomainRecord(record.RecordId, record.RR, record.Type, ip);
    }).then(function (res) {
        console.log(res);
        console.log("bind " + ip + " successfully, ready to record ip!")
        fs.writeFile('./ip.txt', ip, 'utf8');
    })
}

const autoDnsBinder = function () {
    const localIp = fs.readFileSync('./ip.txt', 'utf-8');
    console.log("run auto dns binder at " + new Date().toISOString());
    getUnicomPublishIP()
        .then(function (ip) {
            if (ip === localIp) {
                console.log("get unicom ip : [" + ip + "] equals with last unicom ip!");
                return;
            }
            console.log("unicom ip change, new unicom ip : [" + ip + "]!");
            return bindDnsResolve(ip);
        }).then(undefined, function (error) {
            if(error.text) {
                return error.text();
            } else {
                return error;
            }
        }).then(function (body) {
            if(body) {
                console.error(body);
            }
        });
}

setInterval(autoDnsBinder, INTERVAL_SECOND * 1000);