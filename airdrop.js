const Web3 = require("web3");
const web3 = new Web3("");
const axios = require('axios')
const fs = require('fs');

function writeToLogFile(account, result) {
    const logFileName = `airdropAvail.txt`;

    // 写入日志内容
    fs.appendFile(logFileName, `${account}----${result}\r\n`, (err) => {
        if (err) {
            console.error(`写入日志文件"${logFileName}"出错：`, err);
        }
    });
}


async function checkAirdrop(address, privateKey) {
    let time = Math.floor(Date.now() / 1000);
    let signdata = "Greetings from Avail!\n\nSign this message to check your eligibility. This signature will not cost you any fees.\n\nTimestamp: ".concat(time)
    const signature = await web3.eth.accounts.sign(signdata, privateKey).signature;
    let header = {
        "Host": "claim-api.availproject.org",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "content-type": "application/json",

    }
    try {
        let url = 'https://claim-api.availproject.org/check-rewards'
        let data = { "account": address, "type": "ETHEREUM", "timestamp": time, "signedMessage": signature }

        let result = await axios.post(url, data, { headers: header })
        if (result.data.message === 'Claim') {
            console.log("\x1b[31m", address + "----" + result.data.message);  // 红色输出
            writeToLogFile(address + "----" + privateKey, result.data.message)
        } else {
            console.log("\x1b[37m", address + "----" + result.data.message);  // 白色输出

        }


    } catch (error) {
        let statusCode = error.response ? error.response.status : null;
        console.log(statusCode)
        if (statusCode === 429 || (statusCode >= 500 && statusCode <= 599)) {
            return checkAirdrop(address, privateKey); // 递归调用

        }


    }




}


async function main() {

    const fsData = fs.readFileSync(__dirname + '/avail.txt');
    const _data = fsData.toString().split(/[(\r\n)\r\n]+/).filter(d => d);
    const accounts = _data.map(data => {
        const info = data.split('----');
        return { "address": info[0], "privateKey": info[1] }
    });

    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const { address, privateKey } = account;

        checkAirdrop(address, privateKey)



    }


}
main()