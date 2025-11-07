// base code was borrowed from this tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

(async () => {
    const url = 'https://www.eventbrite.com/d/pa--philadelphia/events--this-weekend/';

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const RESULTS_SELECTOR = '.SearchResultPanelContentEventCardList-module__eventList___2wk-D';
    await page.waitForSelector(RESULTS_SELECTOR, { timeout: 30000 });

    const html = await page.content();
    const $ = cheerio.load(html);
   
    const events = $(RESULTS_SELECTOR).find('a[aria-label]').map((i, event) => {
        const $eventSection = $(event);
        const title = $eventSection.attr('aria-label').trim();
        const description = $eventSection.attr('href');

        const $eventCard = $eventSection.closest('li, div, article');
        const p = $eventCard.find('p').map((_, p) => $(p).text().trim()).get();

        const date = p[0];
        const location = p[1];

        return {title, date, description, location};
    }).get().flat();

    let formattedEvents = []

    for (let section of events) {
        let title = section.title;
        let date = section.date;
        let location = section.location;
        let description = section.description;

        let event = {title, date, location, description};
        formattedEvents.push(event);
    }

    console.log(formattedEvents);
    await browser.close();
    return formattedEvents;
})();