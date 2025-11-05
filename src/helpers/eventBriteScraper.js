// base code was borrowed from this tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110
const cheerio = require('cheerio');

(async () => {
    const url = 'https://www.eventbrite.com/d/pa--philadelphia/events--this-weekend/';
    const response = await fetch(url);

    const $ = cheerio.load(await response.text());
    
    const RESULTS_SELECTOR = '.search-results-panel-content_events';
    const ITEM_SELECTOR = 'ul';

    const events = $(RESULTS_SELECTOR).map((i, event) => {
        const $eventSection = $(event);

        const title = $eventSection.find('a').attr('aria-label').text().trim();

        let $body = $eventSection.find('.vp-article-section__body').clone();
        $body.find('.vp-body-subhead-2').remove();

        const description = $body.text()
            .replace(/\s+/g, ' ')
            .replaceAll('\n', ' ')
            .replaceAll('\t', ' ')
            .trim();
    
        const date = $eventSection.find('.vp-article-section__date-time').text()
            .replace(/\s\|.*/, '')
            .trim();

        const location = $eventSection.find('.vp-article-section__details').text()
            .replace(/\t/g, "")
            .split('\n')
            .filter(item => item !== "")
            .filter(str => str.trim() !== "")

        if (date.length === 0 || locations.length === 0 || descriptions.length === 0) {
            return null;
        }

        return {title, date, location, description};
    }).get().flat();

    let formattedEvents = []

    for (let section of events) {
        let title = section.title;
        let date = section.date;
        let locations = section.locations;
        let description = section.description;

        if (items.length !== locations.length) {
            continue;
        }

        let event = {title, date, location, description};
        formattedEvents.push(event);
    }

    console.log(formattedEvents);
    return formattedEvents;
})();
