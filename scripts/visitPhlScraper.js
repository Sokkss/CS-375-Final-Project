const cheerio = require('cheerio');

(async () => {
    const url = 'https://www.visitphilly.com/uwishunu/things-to-do-in-philadelphia-this-week-weekend/';
    const response = await fetch(url);

    const $ = cheerio.load(await response.text());

    const ARTICLE_SELECTOR = '.vp-article-section__content';

    const items = $(ARTICLE_SELECTOR).map((i, event) => {
        const $eventSection = $(event);

        const location = $eventSection.find('.vp-article-section__details').text()
            .replace(/\t/g, "")
            .replaceAll("Where: ", "")
            .split('\n')
            .filter(item => item !== "")
            .filter(str => str.trim() !== "")
            .filter(item => !item.includes("VIEW OTHER LOCATIONS"));
        return {location};
    }).get().flat();

    // turn following into arrays
    const title = $('b').text();
    const dates = $('.vp-body-subhead-2').text();
    const body = $('.vp-article-section__body').text();
    // title and description need to be broken apart

    //console.log(title);
    console.log(items);
    //console.log(body);
    //console.log(location);
})();

// tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110

// mapping dates and locations to several events under one big event: loop through big event, and query for each date, location, etc