const externalEventService = require('../services/externalEventService');

async function collectExternalEvents(req, res, pool) {
    try {
        const result = await externalEventService.collectAndStoreExternalEvents(pool);
        return res.status(200).json({
            message: 'External events collected',
            ...result
        });
    } catch (error) {
        console.error('Error in collectExternalEvents controller:', error);
        return res.status(500).json({ 
            error: 'Failed to collect external events',
        });
    }
}

module.exports = {
    collectExternalEvents
};
