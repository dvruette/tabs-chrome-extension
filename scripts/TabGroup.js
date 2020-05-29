
class TabGroup {
    constructor(tabs, title, editable) {
        this.title = title || 'Group';
        this.element = null;
        this.tabs = [];
        this.editable = editable === false ? false : true;

        this.setTabs(tabs);
    }

    setTabs(tabs) {
        this.tabs = tabs ? tabs.map(tab => this.prepareTab(tab)) : [];
        this.render();
    }

    prepareTab(tab) {
        tab = new Tab(tab);
        tab.onClick = (event) => {
            if (event.altKey) {
                tabGroups.removeTab(tab, this);
                tabGroups.saveState();
                return;
            }
            if (event.shiftKey) {
                let index = this.tabs.indexOf(tab);
                if (index >= 0) this.tabs.splice(index, 1);
                this.render();
                tabGroups.saveState();
            }
            console.log('creating new tab');
            chrome.tabs.create({
                url: tab.chromeTab.url,
                active: !event.metaKey
            })
        }
        return tab;
    }

    addTab(tab) {
        tab = this.prepareTab(tab);
        if (!this.tabs.find(t => tab.equals(t))) {
            this.tabs.push(tab);
            this.render();
        }
    }

    render() {
        this.element = document.createElement('div');
        this.element.classList.add('tab-group');
        this.element.classList.add('mb-3');
        this.element.addEventListener('drop', event => {
            this.onDrop(event);
        });

        if (this.editable) {
            const form = document.createElement('form');
            const input = document.createElement('input');
            input.value = this.title;
            input.oninput = () => {
                this.title = input.value;
            }
            form.classList.add('hidden');
            form.classList.add('edit-title');
            form.appendChild(input);
            this.element.appendChild(form);
    
            function saveTitle(event) {
                event.preventDefault();
                input.blur();
                tabGroups.saveState();
            }
            input.onblur = saveTitle;
            form.onsubmit = saveTitle;
        } else {
            const title = document.createElement('h2');
            title.innerText = this.title;
            title.classList.add('mt-0');
            this.element.appendChild(title);
        }



        const list = document.createElement('div');
        list.classList.add('tab-list');
        for (let tab of this.tabs) {
            list.appendChild(tab.element);
        }
        this.element.appendChild(list);

        dropZone.add(this.element);
        for (let tab of this.tabs) {
            tab.onDragStart = (event) => {
                dropZone.draggingFrom = this;
                dropZone.remove(this.element);
            };
            tab.onDragEnd = () => {
                dropZone.add(this.element);
            };
        }
    }

    onDrop(event) {
        console.log('unhandled drop event:', event, this);
    }
}