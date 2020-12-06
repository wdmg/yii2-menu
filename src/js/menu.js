var DragMenu = new function() {
    var menuSources = document.getElementById('menuSources');
    var panels = menuSources.querySelectorAll(".panel .panel-body");
    var sourcesList = [...panels].filter(elem => {
        if (elem.children.length) {

            let items = elem.querySelectorAll('.source-list input[type="checkbox"]');
            let addButton = elem.querySelector('button[data-rel="add"]');
            if (addButton && items) {
                addButton.onclick = (event) => {
                    event.preventDefault();
                    let sourcesItems = [...items].filter(item => {
                        if (item.checked) {
                            addMenuItem(item);
                        }
                    });

                    items.forEach(checkbox => {
                        checkbox.checked = false;
                    });
                }
            }

            let selectAll = elem.querySelector('input[type="checkbox"][name="select-all"]');
            if (selectAll && items) {
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
    var htmlToElement = (html) => {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    /**
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     */
    var htmlToElements = (html) => {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    var fillTemplate = (str, obj) => {
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

    var menuItemsList = document.getElementById('menuItems');
    var formTemplate = document.getElementById('itemFormTemplate');
    var itemTemplate = document.getElementById('menuItemTemplate');
    var addMenuItem = (item) => {
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