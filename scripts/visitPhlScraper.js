// code was borrowed from this tutorial: https://medium.com/@joerosborne/intro-to-web-scraping-build-your-first-scraper-in-5-minutes-1c36b5c4b110
const cheerio = require('cheerio');

(async () => {
    const url = 'https://www.visitphilly.com/uwishunu/things-to-do-in-philadelphia-this-week-weekend/';
    const response = await fetch(url);

    const $ = cheerio.load(await response.text());

    const ARTICLE_SELECTOR = '.vp-article-section__content';

    const items = $(ARTICLE_SELECTOR).map((i, event) => {
        const $eventSection = $(event);

        let title = $eventSection.find('b').text()
            .replace(/\t/g, "")
            .split(':')   
            .filter(item => item !== "")                
            .map(str => str.trim())
            .filter(str => str.trim() !== "");  
            
        if (title.length === 0) {
            title = $eventSection.find('h2').text()
                .replace(/\t/g, "")
                .split('\n')
                .filter(item => item !== "")
                .filter(str => str.trim() !== "")
        }

        const date = $eventSection.find('.vp-body-subhead-2').text()
            .split('\n')
            .filter(item => item !== "")
            .filter(str => str.trim() !== "")
            .filter(item => !item.includes("Dates vary by"))
            .filter(item => !item.includes("Ongoing"));

        const description = [];

        const location = $eventSection.find('.vp-article-section__details').text()
            .replace(/\t/g, "")
            .replaceAll("Where: ", "")
            .split('\n')
            .filter(item => item !== "")
            .filter(str => str.trim() !== "")
            .filter(item => !item.includes("VIEW OTHER LOCATIONS"));
        return {title, date, description, location};
    }).get().flat();

    const description = $('.vp-article-section__body').text();

    console.log(items);
    //console.log(description);

})();
