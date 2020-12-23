var DragMenu = new function() {

    var self = this;
    var tolerance = 5;
    var dragObject = {};
    var dragMenu = document.getElementById('dragMenu');
    var menuItems = document.getElementById('menuItems');
    var menuSources = document.getElementById('menuSources');
    var formTemplate = document.getElementById('itemFormTemplate');
    var itemTemplate = document.getElementById('menuItemTemplate');
    var addMenuItemForm = document.getElementById('addMenuItemForm');

    const removeElements = (elms) => elms.forEach(elem => elem.remove());

    const transformData = (list, json = true) => {
        let tree = [];

        /**
         * Filling the tree with values
         *
         * @param {HTMLLIElement} e   LI-элемент с data-id
         * @param {Array}         ref Link to the tree where to add properties
         */
        function push(e, ref, node = 'UL') {

            let itemForm = e.querySelector('form[data-key]');
            let pointer = { // Take the id attribute of the element
                id: itemForm.getAttribute('data-key') || null,
                //source_type: itemForm.getAttribute('data-type') || null,
                name: itemForm.querySelector('input[name="MenuItems[name]"]').value || null,
                title: itemForm.querySelector('input[name="MenuItems[title]"]').value || null,
                source_id: itemForm.querySelector('input[name="MenuItems[source_id]"]').value || null,
                source_type: itemForm.querySelector('input[name="MenuItems[source_type]"]').value || null,
                source_url: itemForm.querySelector('input[name="MenuItems[source_url]"]').value || null,
                only_auth: itemForm.querySelector('input[name="MenuItems[only_auth]"]').value || null,
                target_blank: itemForm.querySelector('input[name="MenuItems[target_blank]"]').value || null,
            };

            if (e.childElementCount) { // If there are descendants
                pointer.children = []; // Create a property for them
                Array.from(e.children).forEach(i => { // We sort out children (bone by bone!)
                    if (i.nodeName === node.toUpperCase()) { // If there is another UL container, iterate over it
                        Array.from(i.children).forEach(e => {
                            push(e, pointer.children); // We call push on new li, but the tree reference is now the children array of the pointer
                        });
                    }
                });
            }

            ref.push(pointer);
        }

        // Loop through all the li of the passed ul
        Array.from(list.children).forEach(e => {
            push(e, tree, 'UL');
        });

        return json ? JSON.stringify(tree) : tree;
    }

    const toWrap = (elem, wrapper) => {
        wrapper = wrapper || document.createElement('div');
        elem.parentNode.appendChild(wrapper);
        return wrapper.appendChild(elem);
    };

    /**
     * @param {String} HTML representing a single element
     * @return {Element}
     */
    const htmlToElement = (html) => {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    /**
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     */
    const htmlToElements = (html) => {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    const fillTemplate = (str, obj) => {
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

    const getCoords = (elem) => {
        let box = elem.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }

    var addMenuItem = (item, parent = null) => {
        if (menuItems && itemTemplate && 'content' in document.createElement('template')) {

            if (menuItems.classList.contains('no-items')) {
                menuItems.classList.remove('no-items');
                menuItems.innerHTML = "";
            }

            let data = item;
            data.form = fillTemplate(formTemplate.innerHTML, data);

            let html = fillTemplate(itemTemplate.innerHTML, data);
            if (html) {
                if (parent) {

                    let list = document.createElement('ul');
                    list.classList.add('menu-items');
                    list.setAttribute('role', "tablist");

                    let listItem = htmlToElement(html);
                    listItem.classList.add('sub-item');
                    list.append(listItem);

                    menuItems.querySelector('[data-id="' + parent + '"]').append(list);
                } else {
                    menuItems.append(htmlToElement(html));
                }
            }

            let forms = menuItems.querySelectorAll('.panel form');
            var sourcesList = [...forms].filter(form => {
                if (form.children.length) {

                    form.addEventListener('change', function(event) {
                        return self.onChange(dragObject, menuItems);
                    });

                    let outOfBtn = form.querySelector('.toolbar a[data-rel="out-of"]');
                    outOfBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            elem.classList.remove('sub-item');
                            menuItems.append(elem);
                        }
                    }

                    let upOneBtn = form.querySelector('.toolbar a[data-rel="up-one"]');
                    upOneBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            let prev = elem.previousSibling;
                            if (prev) {
                                elem.parentNode.insertBefore(elem, prev);
                            }
                        }
                    }

                    let downOneBtn = form.querySelector('.toolbar a[data-rel="down-one"]');
                    downOneBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            let next = elem.nextSibling;
                            if (next) {
                                elem.parentNode.insertBefore(elem, next.nextSibling);
                            }
                        }
                    }

                    let removeBtn = form.querySelector('.toolbar a[data-rel="remove"]');
                    removeBtn.onclick = function (event) {
                        event.preventDefault();
                        let elem = form.closest('.draggable');
                        if (elem) {
                            elem.remove();
                        }
                    }

                }
            });

            return self.onAddSuccess(dragObject, menuItems);

        }
        return self.onAddFailture(dragObject, menuItems);
    };

    if (addMenuItemForm) {
        let addButton = addMenuItemForm.querySelector('button[data-rel="add"]');
        addButton.addEventListener("click", (event) => {

            let collapseToggler = menuSources.querySelector('#source-link a[data-toggle="collapse"]');
            let item = {
                'id': null,
                'source': collapseToggler.dataset.type || null,
                'source_name': collapseToggler.dataset.name || null,
                'name': addMenuItemForm.querySelector('input[name="MenuItems[name]"]').value || false,
                'title': addMenuItemForm.querySelector('input[name="MenuItems[title]"]').value || false,
                'source_id': null,
                'source_type': addMenuItemForm.querySelector('input[name="MenuItems[source_type]"]').value || false,
                'source_url': addMenuItemForm.querySelector('input[name="MenuItems[source_url]"]').value || false,
                'only_auth': addMenuItemForm.querySelector('input[name="MenuItems[only_auth]"]').value || false,
                'target_blank': addMenuItemForm.querySelector('input[name="MenuItems[target_blank]"]').value || false,
            };

            if (addMenuItem(item))
                addMenuItemForm.reset();

        });
    }

    if (menuSources) {
        var panels = menuSources.querySelectorAll(".panel");
        var sourcesList = [...panels].filter(panel => {
            if (panel.children.length) {

                let addButton = panel.querySelector('button[data-rel="add"]');
                let selectAll = panel.querySelector('input[type="checkbox"][name="select-all"]');
                let items = panel.querySelectorAll('.source-list input[type="checkbox"]');


                if (addButton && items) {

                    items.forEach(item => {
                        item.onchange = (event) => {
                            event.preventDefault();
                            if (panel.querySelectorAll('input[type="checkbox"]:checked:not([name="select-all"])').length)
                                addButton.removeAttribute('disabled');
                            else
                                addButton.setAttribute('disabled', true);
                        }
                    });

                    addButton.onclick = (event) => {
                        event.preventDefault();
                        let sourcesItems = [...items].filter(item => {
                            if (item.checked) {
                                addMenuItem(item.dataset);
                            }
                        });

                        items.forEach(checkbox => {
                            checkbox.checked = false;
                        });
                    }
                }

                if (selectAll && items) {
                    selectAll.onchange = (event) => {
                        event.preventDefault();
                        let target = event.target.checked;
                        items.forEach(checkbox => {
                            if (target) {
                                checkbox.checked = true;
                            } else {
                                checkbox.checked = false;
                            }
                            checkbox.onchange(event);
                        });
                    }
                }
            }
        });
    }

    var createDroppable = (e) => {
        let top = e.clientY || e.targetTouches[0].pageY;
        let left = e.clientX || e.targetTouches[0].pageX;
        let elem = document.elementFromPoint(left, top);
        let droppable = document.createElement('div');
        droppable.classList.add('droppable');

        if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
            droppable.classList.add('sub-item');
        else
            droppable.classList.remove('sub-item');

        let itemText = dragObject.avatar.querySelector('.panel-title a[data-toggle="collapse"]').dataset['name'];
        let droppableText = document.createTextNode(itemText.trim());
        droppable.appendChild(droppableText);

        droppable.style.width = dragObject.avatar.offsetWidth + 'px';
        droppable.style.height = dragObject.avatar.offsetHeight + 'px';

        if (!droppable.isEqualNode(dragObject.droppable)) {
            removeElements(menuItems.querySelectorAll(".droppable:not(.delete-area)"));
            dragObject.droppable = null;
        }
        dragObject.droppable = droppable;

        let target = elem.closest('.draggable');

        if (target && typeof target !== "undefined") {

            removeElements(menuItems.querySelectorAll(".droppable:not(.delete-area)"));

            let top = e.clientY || e.targetTouches[0].pageY;
            let left = e.clientX || e.targetTouches[0].pageX;
            if (top >= (target.getBoundingClientRect().top + (target.offsetHeight/1.5))) {


                if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
                    target.querySelector('.collapse').after(droppable);
                else
                    target.after(droppable);

                if (target.classList.contains('sub-item'))
                    droppable.classList.add('sub-item');

            } else if (top < (target.getBoundingClientRect().top + (target.offsetHeight/1.5))) {

                if ((dragObject.avatar.getBoundingClientRect().left - elem.getBoundingClientRect().left) >= (dragObject.avatar.offsetWidth*0.1))
                    target.querySelector('.collapse').after(droppable);
                else
                    target.before(droppable);

                if (document.getElementById('menuItems').firstChild.isEqualNode(droppable))
                    droppable.classList.remove('sub-item');

                if (target.classList.contains('sub-item')) {
                    droppable.remove();
                    return false;
                }

            }

            dragObject.avatar.style.width = droppable.offsetWidth + 'px';
            dragObject.avatar.style.height = droppable.offsetHeight + 'px';
        }
    }
    var createAvatar = (e) => {

        // Remember old properties to return to them when canceling the transfer
        var avatar = dragObject.elem;
        var old = {
            parent: avatar.parentNode,
            nextSibling: avatar.nextSibling,
            position: avatar.position || '',
            left: avatar.left || '',
            top: avatar.top || '',
            zIndex: avatar.zIndex || ''
        };

        // Function to cancel transfer
        avatar.rollback = () => {
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.position = old.position;
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex;
        };

        return avatar;
    }
    var startDrag = (e) => {

        let avatar = dragObject.avatar;
        avatar.style.width = dragObject.avatar.offsetWidth + 'px';
        avatar.style.height = dragObject.avatar.offsetHeight + 'px';

        // Initiate start dragging
        avatar.classList.add('drag-in');
        document.body.appendChild(avatar);

        let deleteArea = document.querySelector(".droppable.delete-area");
        if (deleteArea)
            deleteArea.classList.add('show');

    }
    var finishDrag = (e) => {

        let avatar = dragObject.avatar;
        let dropElem = findDroppable(e);

        if (!dropElem)
            avatar.rollback();

        avatar.style = '';
        avatar.classList.remove('drag-in');

        let droppable = dragMenu.querySelector(".droppable");
        if (droppable.classList.contains('delete-area')) {
            dragObject = {};
            avatar.remove();
        } else if (droppable.classList.contains('sub-item')) {

            let list = droppable.parentNode.querySelector("ul");
            if (!list) {
                list = document.createElement('ul');
                list.classList.add('menu-items');
                list.setAttribute('role', "tablist");
                droppable.parentNode.appendChild(list);
            }

            avatar.classList.add('sub-item');
            droppable.replaceWith(avatar);
            list.appendChild(avatar);
        } else {
            avatar.classList.remove('sub-item');
            droppable.replaceWith(avatar);
        }

        // Selects all <ul> elements, then filters the collection
        let lists = menuItems.querySelectorAll('ul');
        // Keep only those elements with no child-elements
        let emptyList = [...lists].filter(elem => {
            return elem.children.length === 0;
        });

        for (let empty of emptyList)
            empty.remove();

        dragObject.data = transformData(menuItems);
        removeElements(menuItems.querySelectorAll(".droppable:not(.delete-area)"));

        let deleteArea = document.querySelector(".droppable.delete-area");
        setTimeout(function() {
            if (deleteArea)
                deleteArea.classList.remove('show');
        }, 500);

        if (!dropElem)
            self.onDragCancel(dragObject);
        else
            self.onDragEnd(dragObject, dropElem);
    }
    var findDroppable = (e) => {
        // Hide the transferred element
        dragObject.avatar.hidden = true;

        let top = e.clientY || e.changedTouches[0].pageY;
        let left = e.clientX || e.changedTouches[0].pageX;

        // Get the most nested element under the mouse cursor
        let elem = document.elementFromPoint(left, top);

        // Show the transferred item back
        dragObject.avatar.hidden = false;

        if (elem == null) // Possible if the mouse cursor "fly" outside the window border
            return null;

        return elem.closest('.droppable');
    }


    var onMouseDown = (e) => {

        if (e.type === "mousedown" && e.which != 1)
            return;

        var elem = e.target.closest('.draggable');
        if (elem) {
            dragObject.elem = elem;
            // Remember that the element is clicked at the current coordinates pageX / pageY
            dragObject.downX = e.pageX || e.targetTouches[0].pageX;
            dragObject.downY = e.pageY || e.targetTouches[0].pageY;
        }
        return;
    }
    var onMouseMove = (e) => {
        if (!dragObject.elem) return; // Element is not move

        if (!dragObject.avatar) { // If transfer has not started ...

            let moveX = 0;
            let moveY = 0;
            if (e.type === "touchmove") {
                moveX = e.targetTouches[0].pageX - dragObject.downX;
                moveY = e.targetTouches[0].pageY - dragObject.downY;
            } else {
                moveX = e.pageX - dragObject.downX;
                moveY = e.pageY - dragObject.downY;
            }

            // If the mouse has not moved far enough when pressed
            if (Math.abs(moveX) < tolerance && Math.abs(moveY) < tolerance)
                return;

            // Starting drag and create avatar
            dragObject.avatar = createAvatar(e);
            if (!dragObject.avatar) { // Cancellation of dragging, it is impossible to "capture" this part of the element
                dragObject = {};
                return;
            }

            // Avatar created, create helper properties shiftX / shiftY
            let coords = getCoords(dragObject.avatar);
            dragObject.shiftX = dragObject.downX - coords.left;
            dragObject.shiftY = dragObject.downY - coords.top;

            startDrag(e); // Show start of drag
        }

        // Display moving object on every mouse movement
        if (e.type === "touchmove") {
            dragObject.avatar.style.left = (e.changedTouches[0].pageX - dragObject.shiftX) + 'px';
            dragObject.avatar.style.top = (e.changedTouches[0].pageY - dragObject.shiftY) + 'px';
        } else {
            dragObject.avatar.style.left = (e.pageX - dragObject.shiftX) + 'px';
            dragObject.avatar.style.top = (e.pageY - dragObject.shiftY) + 'px';
        }

        createDroppable(e);
        return false;
    }
    var onMouseUp = (e) => {
        if (dragObject.avatar) // If the drag is in progress
            finishDrag(e);

        // Drag either did not start or ended. In any case, clear the "transfer state" of the dragObject
        dragObject = {};
    }

    this.getItemsData = function() {
        return transformData(menuItems);
    };

    this.buildMenuItems = function(data) {
        let items = [...data].filter(item => {
            if (typeof item == "object") {

                let parent_id = item.parent_id
                if (item.source_type && !item.source_name)
                    item.source_name = menuSources.querySelector('.panel .panel-heading a[data-id="'+item.source_type+'"]').dataset.name;

                addMenuItem(item, parent_id);
            }
        });
    };

    this.onInit = function(menuItems) { };
    this.onDragEnd = function(dragObject, dropElem) {};
    this.onDragCancel = function(dragObject) {};

    this.onChange = function(dragObject, menuItems) {};
    this.onAddSuccess = function(dragObject, menuItems) {};
    this.onAddFailture = function(dragObject, menuItems) {};

    document.addEventListener("DOMContentLoaded", function(event) {
        if (dragMenu && menuItems) {
            dragMenu.onmousedown = onMouseDown;
            dragMenu.ontouchstart = onMouseDown;
            dragMenu.onmousemove = onMouseMove;
            dragMenu.ontouchmove = onMouseMove;
            dragMenu.onmouseup = onMouseUp;
            dragMenu.ontouchend = onMouseUp;
            self.onInit();
        }
    });
}

DragMenu.onDragCancel = function (dragObject) {
    if (dragObject.data) {
        let form = document.getElementById('addMenuForm');
        form.querySelector('input#menu-items').value = dragObject.data;
    }
};

DragMenu.onDragEnd = function (dragObject, dropElem) {
    if (dragObject.data) {
        let form = document.getElementById('addMenuForm');
        form.querySelector('input#menu-items').value = dragObject.data;
    }
};

DragMenu.onChange = function (dragObject, menuItems) {
    let form = document.getElementById('addMenuForm');
    form.querySelector('input#menu-items').value = this.getItemsData();
};

DragMenu.onAddSuccess = function (dragObject, menuItems) {
    let form = document.getElementById('addMenuForm');
    form.querySelector('input#menu-items').value = this.getItemsData();
};

DragMenu.onInit = function () {
    let form = document.getElementById('addMenuForm');
    let data = JSON.parse(form.querySelector('input#menu-items').value);
    this.buildMenuItems(data);
};
