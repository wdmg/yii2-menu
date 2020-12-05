var DragMenu = new function() {
    let menuSources = document.getElementById('menuSources');
    let panels = menuSources.querySelectorAll(".panel .panel-body");
    let sourcesList = [...panels].filter(elem => {
        if (elem.children.length) {

            let items = elem.querySelectorAll('.source-list input[type="checkbox"]');
            let addButton = elem.querySelector('button[data-rel="add"]');
            if (addButton) {

                if (items) {
                    addButton.onclick = (event) => {
                        event.preventDefault();
                        let sourcesItems = [...items].filter(item => {
                            if (item.checked) {
                                addMenuItem(item);
                            }
                        });
                    }
                }
            }

            let selectAll = elem.querySelector('input[type="checkbox"][name="select-all"]');
            if (selectAll) {
                selectAll.onchange = (event) => {
                    event.preventDefault();
                    if (event.target.checked) {
                        items.forEach(checkbox => {
                            checkbox.checked = true;
                        });
                    } else {
                        items.forEach(checkbox => {
                            checkbox.checked = false;
                        });
                    }
                }
            }
        }
    });

    /**
     * @param {String} HTML representing a single element
     * @return {Element}
     */
    let htmlToElement = (html) => {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    /**
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     */
    let htmlToElements = (html) => {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    let fillTemplate = (str, obj) => {
        do {
            var beforeReplace = str;
            str = str.replace(/{{\s*([^}\s]+)\s*}}/g, function(wholeMatch, key) {
                var substitution = obj[$.trim(key)];
                return (substitution === undefined ? wholeMatch : substitution);
            });
            var afterReplace = str !== beforeReplace;
        } while (afterReplace);

        return str;
    };

    let menuItemsList = document.getElementById('menuItems');
    let formTemplate = document.getElementById('itemFormTemplate');
    let itemTemplate = document.getElementById('menuItemTemplate');
    let addMenuItem = (item) => {
        if (menuItemsList && itemTemplate && 'content' in document.createElement('template')) {

            if (menuItemsList.classList.contains('no-items')) {
                menuItemsList.classList.remove('no-items');
                menuItemsList.innerHTML = "";
            }

            let data = item.dataset;
            data.form = fillTemplate(formTemplate.innerHTML, data);

            let content = fillTemplate(itemTemplate.innerHTML, data);
            menuItemsList.append(htmlToElement(content));

        }
    };
}