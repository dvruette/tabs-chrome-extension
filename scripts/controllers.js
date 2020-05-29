

const dropZone = {
    draggingFrom: null,
    add(el) {
        el.addEventListener('dragover', this.onDragOver);
        el.addEventListener('dragleave', this.onDragLeave);
        el.addEventListener('drop', this.onDrop);
        el.classList.add('drop-zone');
    },
    remove(el) {
        el.removeEventListener('dragover', this.onDragOver);
        el.removeEventListener('dragleave', this.onDragLeave);
        el.removeEventListener('drop', this.onDrop);
        el.classList.remove('drop-zone');
    },
    onDragOver(event) {
        event.preventDefault();
        event.target.classList.add('drag-over');
    },
    onDragLeave(event) {
        event.target.classList.remove('drag-over');
    },
    onDrop(event) {
        event.target.classList.remove('drag-over');
    }
}

const preview = {
    displayDefault() {
        chrome.tabs.query({ active: true }, result => {
            const tab = result[0];
            this.setDisplay('[active] ' + tab.title, tab.url);
        })
    },
    setDisplay(title, subtitle) {
        const el = document.getElementById('preview');
        el.querySelector('.title').innerText = title;
        el.querySelector('.subtitle').innerText = subtitle;
    }
}

const tabGroups = {
    groups: [],
    currentWindow: null,
    add(group) {
        this.groups.push(group);
        group.onDrop = (event) => {
            const tab = JSON.parse(event.dataTransfer.getData('application/json'));
            tab.active = false;
            this.removeTab(new Tab(tab), dropZone.draggingFrom);
            group.addTab(tab);
            this.render();
            this.saveState();
        }
        this.render();
    },
    render() {
        const container = document.getElementById('group-container');
        while (container.lastChild) container.removeChild(container.lastChild);

        if (this.currentWindow) container.appendChild(this.currentWindow.element);

        for (let group of this.groups) {
            container.appendChild(group.element);
        }
    },
    update() {
        chrome.tabs.query({}, (tabs) => {
            console.log(tabs);
            if (this.currentWindow) {
                this.currentWindow.setTabs(tabs);
            } else {
                this.currentWindow = new TabGroup(tabs, 'Current window', false);
            }

            this.currentWindow.tabs.forEach(tab => {
                tab.onClick = event => {
                    if (event.altKey) {
                        this.removeTab(tab, this.currentWindow);
                        this.saveState();
                        return;
                    }
                    if (event.metaKey || event.shiftKey) {
                        tab.chromeTab.active = false;
                        if (!this.groups.length) {
                            this.add(new TabGroup([tab.chromeTab], 'New Group'));
                        } else {
                            this.groups[0].addTab(tab.chromeTab);
                            this.render();
                        }
                        this.saveState();
                        if (event.shiftKey) chrome.tabs.remove(tab.chromeTab.id);
                    } else {
                        chrome.tabs.update(tab.chromeTab.id, { active: true });
                    }
                };
            });

            this.currentWindow.onDrop = (event) => {
                console.log('dropped into current window:', event, this);
                const tab = JSON.parse(event.dataTransfer.getData('application/json'));
                this.removeTab(new Tab(tab), dropZone.draggingFrom);

                chrome.tabs.create({
                    url: tab.url,
                    active: false,
                })
                this.saveState();
            }

            this.render();
        });
    },

    /**
     * Removes the provided tab from the window / all groups / both
     * @param {*} tab 
     */
    removeTab(tab, group) {
        if (!group || group == this.currentWindow) {
            let index = this.currentWindow.tabs.findIndex(other => other.equals(tab));
            if (index >= 0) {
                console.log('closing tab in window')
                chrome.tabs.remove(tab.chromeTab.id);
                this.update();
            }
        }
        this.groups.forEach(gr => {
            if (group && group != gr) return;
            let index = gr.tabs.findIndex(other => other.equals(tab));
            if (index >= 0) {
                console.log('closing tab in group');
                gr.tabs.splice(index, 1);
                if (!gr.tabs.length) {
                    index = this.groups.indexOf(gr);
                    if (index >= 0) this.groups.splice(index, 1);
                } else {
                    gr.render();
                }
                this.render();
                return true;
            }
        });
    },

    loadState() {
        chrome.storage.local.get('groups', items => {
            if (items.groups) {
                console.log(items.groups)
                for (let group of items.groups) {
                    this.add(new TabGroup(group.tabs, group.title));
                }
            }
        })
    },
    saveState() {
        let groups = this.groups.map(group => {
            return {
                title: group.title,
                tabs: group.tabs.map(tab => tab.chromeTab)
            }
        });
        chrome.storage.local.set({ groups });
    }
}