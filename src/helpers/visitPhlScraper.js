// base code was borrowed from this tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110
const cheerio = require('cheerio');
const Event = require('../models/Event');
const axios = require('axios');
const { getLatLong } = require('./geoEncoder');

(async () => {
    const url = 'https://www.visitphilly.com/uwishunu/things-to-do-in-philadelphia-this-week-weekend/';
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    const ARTICLE_SELECTOR = '.vp-article-section__content';
    const ITEM_SELECTOR = 'ul';

    const events = $(ARTICLE_SELECTOR).map((i, event) => {
        const $eventSection = $(event);

        let items = $eventSection.find(ITEM_SELECTOR).map((j, item) => {
            const $itemSection = $(item);

            let title = $itemSection.find('b').text()
                .replace(/\s+$/, '')
                .replace(/:$/, '');

            let description = $itemSection.text()
                .replace(title, "")
                .replace(/\s+/, '')
                .replace(/: /, '')
                .replaceAll('\n', ' ')
                .replaceAll('\t', ' ');

            return {title, description};
        }).get();

        if (items.length === 0) {
            let title = $eventSection.find('.vp-article-section__heading').text().trim();

            let $body = $eventSection.find('.vp-article-section__body').clone();
            $body.find('.vp-body-subhead-2').remove();

            let description = $body.text()
                .replace(/\s+/g, ' ')
                .replaceAll('\n', ' ')
                .replaceAll('\t', ' ')
                .trim();

            let item = {title, description};

            items.push(item);
        }

        let date = $eventSection.find('.vp-body-subhead-2').text()
            .replaceAll('\n', '')
            .replaceAll('\t', '')
            .trim();

        if (date.length === 0) {
            date = $eventSection.find('.vp-article-section__date-time').text()
                .replace(/\s\|.*/, '')
                .trim();
        }

        const locations = $eventSection.find('.vp-article-section__details').text()
            .replace(/\t/g, "")
            .replaceAll("Where: ", "")
            .split('\n')
            .filter(item => item !== "")
            .filter(str => str.trim() !== "")
            .filter(item => !item.includes("VIEW OTHER LOCATIONS"));

        if (date.length === 0 || locations.length === 0 || items.length === 0) {
            return null;
        }

        return {items, date, locations};
    }).get().flat();

    let formattedEvents = []

    for (let section of events) {
        let items = section.items;
        let date = section.date;
        let locations = section.locations;

        if (items.length !== locations.length) {
            continue;
        }

        let i = 0;
        for (let item of items) {
            let title = item.title;
            let description = item.description;
            let location = locations[i];
            const coords = await getLatLong(location);
            let lat = coords.lat;
            let long = coords.long;

            let event = {title, date, location, lat, long, description};

            formattedEvents.push(event);

            i++;
        }
    }

    const mappedEvents  = formattedEvents.map((item, index) => {
        const id = `visitphilly-event-${index}`;
        const title = item.title;
        const description = item.description; 
        const locationDescription = item.location;
        const lat = item.lat;
        const long = item.long;
        const time = item.date;
        const owner = 'Visit Philadelphia';
        const image = null;
        const externalLink = null;
        
        return new Event(id, title, description, locationDescription, lat, long, time, owner, image, externalLink);
    });

    //console.log(mappedEvents);
    return mappedEvents;
})();
