// required modules
const fs = require('fs');
const Discord = require('discord.js');
const puppeteer = require('puppeteer-extra');
const C = require('./constants');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// import config file for discord
const { Client, MessageEmbed } = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();

// login using secret discord token
client.login(token);

// compare arrays
// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

// time interval
var seconds = 5, the_interval = seconds * 1000;

// selectors for username field, password field, and login button
const USERNAME_SELECTOR = '#login > input[type=text]:nth-child(3)';
const PASSWORD_SELECTOR = '#login > input.am-pass-reveal';
const CTA_SELECTOR = '#login > input.button.is-primary.btn.btn-primary';

// starts up new browser and page
async function startBrowser(url) {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 500
    });
    
    const page = await browser.newPage()
    try {
        await page.goto(url);
        await page.click(USERNAME_SELECTOR);
        await page.keyboard.type(C.username);
        await page.click(PASSWORD_SELECTOR);
        await page.keyboard.type(C.password);
        await page.click(CTA_SELECTOR);
        await page.waitForNavigation();
    } catch (error) {
        console.log("Already logged in or element didn't appear");
    }

    return page;
}

// stores previous flow
var flowArray = [];
var goldenArray = [];
var unusualArray = [];
var alphaArray = [];

// webscrape
async function playTest(client, page) {
    // date stuff
    var today = new Date();

    // webscraping
    // obtain basic data for flow
    let basicData = await page.evaluate(() => {
        let normflow = document.querySelector('#optionflow > div.component-body.ps.ps--theme_default.ps--active-y > div.data-body > div:nth-child(1)').innerText; 
        var newFlowArray = normflow.split('\n');
        return newFlowArray;
    });
    // obtain adv data for flow
    let advancedData = await page.evaluate(() => {
        let advflow = document.querySelector('div.data-body > div:nth-child(1)').attributes;
        let modified = Array.from(advflow).map(attribute => ({
            name: attribute.localName,
          value: attribute.nodeValue
        }));
        return modified
    })
    // obtain data for alpha ai
    let alphaAi = await page.evaluate(() => {
        let alpha = document.querySelector('#fa_aai > div.alpha-ai-signals.animated.fadeIn > div:nth-child(1)').innerText;
        var modifiedAlpha = alpha.split('\n');
        return modifiedAlpha;
    })

    // stores flowalgo channels
    const flowChannel = client.channels.cache.get('684294155920343059');
    const goldenChannel = client.channels.cache.get('735328449220313160');
    const unusualChannel = client.channels.cache.get('739586438810566756');
    const alphaChannel = client.channels.cache.get('739586472822177814');

    // data processing for flow
    var data = basicData;
    var advData = Object.entries(advancedData);
    var dataScore = (Object.values(advData[7][1]));
    var goldenSweep = (Object.values(advData[12][1]));
    var unusualActivity = (Object.values(advData[11][1]))
    data.push(dataScore[1]);
    data.push(goldenSweep[1]);
    data.push(unusualActivity[1]);
    if (data[4] === 'C')
    {
        data[4] = "Calls";
    }
    else {
        data[4] = "Puts";
    }
    var roundedScore = parseInt(data[10]);
    data[10] = roundedScore.toFixed(1);

    console.log(data);

    // send as embed
    // embed for flow
    if (data[11] == 'true') {
        if (!(goldenArray.equals(data)) || (goldenArray == null)) {
            goldenArray = data;
            const embed = new MessageEmbed()
            .setTitle(`Golden Sweep: ${today}`)
            .setColor(0x8cd9be)
            .setDescription(`Ticker & Type: **${goldenArray[1]}, ${goldenArray[4]}\n**Strike & Expiration: **${goldenArray[3]}, ${goldenArray[2]}**\nQuantity & Contract Price: **${goldenArray[6]}**\nFlowAlgo Score: **${goldenArray[10]}**\nSector & Type: **${goldenArray[9]}, ${goldenArray[7]}**\nTotal Premium: **${goldenArray[8]}**`);
            goldenChannel.send(embed);
        }
    } else if (data[12] == 'true') {
        if (!(unusualArray.equals(data)) || (unusualArray == null)) {
            unusualArray = data;
            const embed = new MessageEmbed()
            .setTitle(`Unusual Option Flow: ${today}`)
            .setColor(0x8cd9be)
            .setDescription(`Ticker & Type: **${unusualArray[1]}, ${unusualArray[4]}\n**Strike & Expiration: **${unusualArray[3]}, ${unusualArray[2]}**\nQuantity & Contract Price: **${unusualArray[6]}**\nFlowAlgo Score: **${unusualArray[10]}**\nSector & Type: **${unusualArray[9]}, ${unusualArray[7]}**\nTotal Premium: **${unusualArray[8]}**`);
            unusualChannel.send(embed);
        }
    } else {
        if (!(flowArray.equals(data)) || (flowArray == null)) {
            flowArray = data;
            const embed = new MessageEmbed()
            .setTitle(`Normal Option Flow: ${today}`)
            .setColor(0x8cd9be)
            .setDescription(`Ticker & Type: **${flowArray[1]}, ${flowArray[4]}\n**Strike & Expiration: **${flowArray[3]}, ${flowArray[2]}**\nQuantity & Contract Price: **${flowArray[6]}**\nFlowAlgo Score: **${flowArray[10]}**\nSector & Type: **${flowArray[9]}, ${flowArray[7]}**\nTotal Premium: **${flowArray[8]}**`);
            flowChannel.send(embed);
        }
    }
    // embed for alphaAI
    if (!(alphaArray.equals(alphaAi)) || (alphaArray == null)) {
        alphaArray = alphaAi
        const embed = new MessageEmbed()
        .setTitle(`Alpha AI: ${today}`)
        .setColor(0x8cd9be)
        .setDescription(`Data: **${alphaAi[0]}**\nSymbol: **${alphaAi[1]}**\nRef: **${alphaAi[2]}**\nSignal: **${alphaAi[3]}**`);
        alphaChannel.send(embed);
    }
}

// Listening for bot ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    (async () => {
        const page = await startBrowser("https://app.flowalgo.com/users/login");
        setInterval(function() {
            (async () => {
                await playTest(client, page).catch();
            })();
        }, the_interval);
    })();
});

