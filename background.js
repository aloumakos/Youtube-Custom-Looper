browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "get") {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tab = (tabs[0].id).toString()

        let data = await browser.storage.session.get(tab);
        return data[tab];
    }
    else if (message.action === 'set') {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            browser.storage.session.set({[tabs[0].id]: message.data})
        });
    }
    else if (message.action === 'remove') {
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = (tabs[0].id).toString()
            browser.storage.session.remove(tab)
        });
    }
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    browser.storage.session.remove(tabId.toString())
})
  