/**
 * Ali Yun DNS Resolve Server API.
 *
 * Created by chenrui on 2017/9/24.
 */
const fetch = require('node-fetch');
const process = require('process');
const crypto = require('crypto');
const normalizeUrl = require('normalize-url');


const ALI_DNS_ENDPOINT = 'https://alidns.aliyuncs.com/?';

module.exports = function (accessKey, accessSecret) {
    var module = {};

    module.describeDomainRecords = function (domain, rrKeyWord, typeKeyWord, valueKeyWord) {
        const queryString = 'Action=DescribeDomainRecords&DomainName=' + domain + '&PageNumber=1&PageSize=20' + '&RRKeyWord=' + rrKeyWord + '&TypeKeyWord=' + typeKeyWord + '&ValueKeyWord=' +valueKeyWord;
        return request('GET', queryString);
    }

    module.describeSubDomainRecords = function (subDomain, type) {
        const queryString = 'Action=DescribeSubDomainRecords&SubDomain=' + subDomain + '&PageNumber=1&PageSize=20&Type=' + type;
        return request('GET', queryString);
    }

    module.updateDomainRecord = function (recordId, rr, type, value) {
        const queryString = 'Action=UpdateDomainRecord&RecordId=' + recordId + '&RR=' + rr + '&Type=' + type + '&Value=' + value;
        return request('GET', queryString);
    }

    const request = function(httpMethod, queryString) {
        var date = new Date();
        const fulQueryString = queryString + '&Format=JSON&Version=2015-01-09&AccessKeyId=' + encodeURIComponent(accessKey) + '&SignatureMethod=HMAC-SHA1'
            + '&Timestamp=' + encodeURIComponent(encodeURIComponent(date.toISOString().replace(/\.\d{3}/, ''))) + '&SignatureVersion=1.0&SignatureNonce='+Math.floor(date/1000);
        const canonicalizedQueryString = normalizeUrl(ALI_DNS_ENDPOINT + fulQueryString).replace(ALI_DNS_ENDPOINT, '');
        const strToSign = getStrToSign(httpMethod, canonicalizedQueryString);
        const signature = sign(strToSign, accessSecret);
        const url = ALI_DNS_ENDPOINT + canonicalizedQueryString + '&Signature=' + encodeURIComponent(signature);
        return fetch(url, {
            method: httpMethod
        }).then(function (res) {
            if(res.ok) {
                return res.json();
            } else {
                return Promise.reject(res);
            }
        });
    }

    const getStrToSign = function(httpMethod, canonicalizedQueryString) {
        const strToSign = httpMethod + '&' + encodeURIComponent('/') + '&' + encodeURIComponent(canonicalizedQueryString);
        return strToSign;
    }

    const sign = function(strToSign, accessSecret) {
        const hash = crypto.createHmac('sha1', accessSecret)
            .update(strToSign)
            .digest().toString('base64');
        return hash;
    }

    return module;

}


