
class Tab {
    constructor(tab) {
        let item = document.createElement('div');
        let image = document.createElement('img');

        this.chromeTab = tab;
        this.element = item;

        image.setAttribute('src', tab.favIconUrl);
        image.setAttribute('draggable', false);
        item.appendChild(image);

        if (tab.active) {
            item.classList.add('active')
        }
        item.classList.add('border');
        item.setAttribute('draggable', true);

        this.element.addEventListener('click', (event) => {
            console.log('clicking on tab')
            if (typeof this.onClick == 'function') this.onClick(event);
        });
        this.element.addEventListener('mouseover', () => {
            if (this.chromeTab.active) preview.displayDefault();
            else preview.setDisplay(this.chromeTab.title, this.chromeTab.url);
        });

        this.element.addEventListener('dragstart', event => {
            item.classList.add('dragging');
            event.dataTransfer.setData('application/json', JSON.stringify(this.chromeTab));
            if (typeof this.onDragStart == 'function') this.onDragStart();
        })
        this.element.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            if (typeof this.onDragEnd == 'function') this.onDragEnd()
        })

    }

    equals(tab) {
        if (!tab) return false;
        if (this == tab || this.chromeTab == tab.chromeTab) return true;
        if (this.chromeTab.url == tab.chromeTab.url) return true;
        else return false;
    }
}