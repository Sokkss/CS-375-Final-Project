// base code was borrowed from this tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Event = require('../models/Event');
const { getLatLong } = require('./geoEncoder');
const { parseDateString } = require('../utils/dateParser');

async function fetchEventbriteEvents() {
    const BASE_URL = 'https://www.eventbrite.com/d/pa--philadelphia/events--this-weekend/';

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-extensions', '--disable-plugins', '--single-process'] });
    const page = await browser.newPage();

    let formattedEvents = [];

    for (let currentPage = 1; currentPage <= 3; currentPage++) {
        const url = `${BASE_URL}?page=${currentPage}`;
        await page.goto(url, { timeout: 60000 });

        const RESULTS_SELECTOR = '.SearchResultPanelContentEventCardList-module__eventList___2wk-D';
        await page.waitForSelector(RESULTS_SELECTOR, { timeout: 30000 });

        const html = await page.content();
        const $ = cheerio.load(html);

        const events = $(RESULTS_SELECTOR).children('li, div, article').map((i, event) => {
            const $eventSection = $(event);
            const titleScrape = $eventSection.find('a').attr('aria-label');
            const title = titleScrape.trim().replace('View ', '');
            const description = $eventSection.find('a').attr('href');

            const pClassScrape = $eventSection.find('p');
            const pClass = pClassScrape ? pClassScrape.map((_, p) => $(p).text().trim()).get() : '';

            let date = '';
            let location = '';

            for (let i = 0; i < pClass.length; i++) {
                if (pClass[i].match(/\b(Today|Tomorrow|Sunday)\b/)) {
                    date = pClass[i].replace("• ", '');
                    location = pClass[i + 1].replace("· ", '');
                    break;
                }
            }

            return {title, date, description, location};
        }).get();

        for (let section of events) {
            let title = section.title;
            let date = section.date;
            let location = section.location;
            if (title.length === 0 || date.length === 0 || location.length === 0) {
                continue;
            }
            const coords = await getLatLong(location);
            let lat = coords.lat;
            let long = coords.long;
            let description = section.description;
            let event = {title, date, location, lat, long, description};
            formattedEvents.push(event);
        }
    }

    const mappedEvents = formattedEvents.map((item, index) => {
        const id = `eventbrite-event-${index}`;
        const title = item.title;
        const description = item.description; 
        const locationDescription = item.location;
        const lat = item.lat;
        const long = item.long;
        
        const time = parseDateString(item.date);

        if (!time) {
            return null;
        }
        
        const owner = 'Eventbrite';
        const image = null;
        const externalLink = item.description;
        
        return new Event(id, title, description, locationDescription, lat, long, time, owner, image, externalLink);
    }).filter(event => event !== null);

    await browser.close();
    return mappedEvents;
}

module.exports = fetchEventbriteEvents;
