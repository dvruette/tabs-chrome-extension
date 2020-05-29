


function initTabListeners() {
    chrome.tabs.onCreated.addListener(onTabsChanged);
    chrome.tabs.onUpdated.addListener(onTabsChanged);
    chrome.tabs.onMoved.addListener(onTabsChanged);
    chrome.tabs.onActivated.addListener(onTabsChanged);
    chrome.tabs.onDetached.addListener(onTabsChanged);
    chrome.tabs.onAttached.addListener(onTabsChanged);
    chrome.tabs.onRemoved.addListener(onTabsChanged);
    chrome.tabs.onReplaced.addListener(onTabsChanged);
}

function onTabsChanged() {
    tabGroups.update();
}


(function() {
    const start = Date.now();
    console.log("Starting script");
    tabGroups.loadState();

    tabGroups.update();
    initTabListeners();

    preview.displayDefault();

    document.querySelectorAll('[drop-zone]').forEach(el => {
        dropZone.add(el);
    });

    const trash = document.getElementById('trash');
    trash.addEventListener('drop', event => {
        const tab = JSON.parse(event.dataTransfer.getData('application/json'));
        tabGroups.removeTab(new Tab(tab), dropZone.draggingFrom);
        tabGroups.saveState();
    });

    const create = document.getElementById('create-group');
    create.addEventListener('drop', event => {
        const tab = JSON.parse(event.dataTransfer.getData('application/json'));
        tabGroups.removeTab(new Tab(tab), dropZone.draggingFrom);
        tab.active = false;

        const group = new TabGroup([tab], 'New Group');
        tabGroups.add(group);
        tabGroups.saveState();
    })

    console.log("Took " + ((Date.now() - start)/1000).toFixed(2) + " seconds to start.");
})()