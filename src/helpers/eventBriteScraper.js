// base code was borrowed from this tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110
const cheerio = require('cheerio');

(async () => {
    const url = 'https://www.eventbrite.com/d/pa--philadelphia/events--this-weekend/';
    const response = await fetch(url);

    const $ = cheerio.load(await response.text());
    
    const RESULTS_SELECTOR = '.SearchResultPanelContentEventCardList-module__eventList___2wk-D';
   
    const events = $(RESULTS_SELECTOR).map((i, event) => {
        const $eventSection = $(event);

        let $body = $eventSection.find('.event-card-details');

        const title = $body.find('a').attr('aria-label');
        const date = $body.find('p').text().trim();
        const description = $body.find('a').attr('href');
        const location = $body.find('p').text().trim();

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
    return formattedEvents;
})();
