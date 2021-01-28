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
    let data = form.querySelector('input#menu-items').value;
    if (data) {
        this.buildMenuItems(JSON.parse(data));
    }
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1lbnUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgRHJhZ01lbnUgPSBuZXcgZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHRvbGVyYW5jZSA9IDU7XG4gICAgdmFyIGRyYWdPYmplY3QgPSB7fTtcbiAgICB2YXIgZHJhZ01lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZHJhZ01lbnUnKTtcbiAgICB2YXIgbWVudUl0ZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtcycpO1xuICAgIHZhciBtZW51U291cmNlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51U291cmNlcycpO1xuICAgIHZhciBmb3JtVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaXRlbUZvcm1UZW1wbGF0ZScpO1xuICAgIHZhciBpdGVtVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1UZW1wbGF0ZScpO1xuICAgIHZhciBhZGRNZW51SXRlbUZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUl0ZW1Gb3JtJyk7XG5cbiAgICBjb25zdCByZW1vdmVFbGVtZW50cyA9IChlbG1zKSA9PiBlbG1zLmZvckVhY2goZWxlbSA9PiBlbGVtLnJlbW92ZSgpKTtcblxuICAgIGNvbnN0IHRyYW5zZm9ybURhdGEgPSAobGlzdCwganNvbiA9IHRydWUpID0+IHtcbiAgICAgICAgbGV0IHRyZWUgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmlsbGluZyB0aGUgdHJlZSB3aXRoIHZhbHVlc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxMSUVsZW1lbnR9IGUgICBMSS3RjdC70LXQvNC10L3RgiDRgSBkYXRhLWlkXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgcmVmIExpbmsgdG8gdGhlIHRyZWUgd2hlcmUgdG8gYWRkIHByb3BlcnRpZXNcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHB1c2goZSwgcmVmLCBub2RlID0gJ1VMJykge1xuXG4gICAgICAgICAgICBsZXQgaXRlbUZvcm0gPSBlLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm1bZGF0YS1rZXldJyk7XG4gICAgICAgICAgICBsZXQgcG9pbnRlciA9IHsgLy8gVGFrZSB0aGUgaWQgYXR0cmlidXRlIG9mIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAgICAgaWQ6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS1rZXknKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIC8vc291cmNlX3R5cGU6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB0aXRsZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0aXRsZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHNvdXJjZV9pZDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfaWRdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdHlwZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfdHlwZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3VybF1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIG9ubHlfYXV0aDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tvbmx5X2F1dGhdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB0YXJnZXRfYmxhbms6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGFyZ2V0X2JsYW5rXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZS5jaGlsZEVsZW1lbnRDb3VudCkgeyAvLyBJZiB0aGVyZSBhcmUgZGVzY2VuZGFudHNcbiAgICAgICAgICAgICAgICBwb2ludGVyLmNoaWxkcmVuID0gW107IC8vIENyZWF0ZSBhIHByb3BlcnR5IGZvciB0aGVtXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShlLmNoaWxkcmVuKS5mb3JFYWNoKGkgPT4geyAvLyBXZSBzb3J0IG91dCBjaGlsZHJlbiAoYm9uZSBieSBib25lISlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkubm9kZU5hbWUgPT09IG5vZGUudG9VcHBlckNhc2UoKSkgeyAvLyBJZiB0aGVyZSBpcyBhbm90aGVyIFVMIGNvbnRhaW5lciwgaXRlcmF0ZSBvdmVyIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGkuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaChlLCBwb2ludGVyLmNoaWxkcmVuKTsgLy8gV2UgY2FsbCBwdXNoIG9uIG5ldyBsaSwgYnV0IHRoZSB0cmVlIHJlZmVyZW5jZSBpcyBub3cgdGhlIGNoaWxkcmVuIGFycmF5IG9mIHRoZSBwb2ludGVyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWYucHVzaChwb2ludGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIGxpIG9mIHRoZSBwYXNzZWQgdWxcbiAgICAgICAgQXJyYXkuZnJvbShsaXN0LmNoaWxkcmVuKS5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgcHVzaChlLCB0cmVlLCAnVUwnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGpzb24gPyBKU09OLnN0cmluZ2lmeSh0cmVlKSA6IHRyZWU7XG4gICAgfVxuXG4gICAgY29uc3QgdG9XcmFwID0gKGVsZW0sIHdyYXBwZXIpID0+IHtcbiAgICAgICAgd3JhcHBlciA9IHdyYXBwZXIgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBIVE1MIHJlcHJlc2VudGluZyBhIHNpbmdsZSBlbGVtZW50XG4gICAgICogQHJldHVybiB7RWxlbWVudH1cbiAgICAgKi9cbiAgICBjb25zdCBodG1sVG9FbGVtZW50ID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgaHRtbCA9IGh0bWwudHJpbSgpOyAvLyBOZXZlciByZXR1cm4gYSB0ZXh0IG5vZGUgb2Ygd2hpdGVzcGFjZSBhcyB0aGUgcmVzdWx0XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmZpcnN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGFueSBudW1iZXIgb2Ygc2libGluZyBlbGVtZW50c1xuICAgICAqIEByZXR1cm4ge05vZGVMaXN0fVxuICAgICAqL1xuICAgIGNvbnN0IGh0bWxUb0VsZW1lbnRzID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuY2hpbGROb2RlcztcbiAgICB9XG5cbiAgICBjb25zdCBmaWxsVGVtcGxhdGUgPSAoc3RyLCBvYmopID0+IHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIGJlZm9yZVJlcGxhY2UgPSBzdHI7XG4gICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgve3tcXHMqKFtefVxcc10rKVxccyp9fS9nLCBmdW5jdGlvbih3aG9sZU1hdGNoLCBrZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vic3RpdHV0aW9uID0gb2JqWyQudHJpbShrZXkpXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1YnN0aXR1dGlvbiA9PT0gdW5kZWZpbmVkID8gd2hvbGVNYXRjaCA6IHN1YnN0aXR1dGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBhZnRlclJlcGxhY2UgPSBzdHIgIT09IGJlZm9yZVJlcGxhY2U7XG4gICAgICAgIH0gd2hpbGUgKGFmdGVyUmVwbGFjZSk7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9O1xuXG4gICAgY29uc3QgZ2V0Q29vcmRzID0gKGVsZW0pID0+IHtcbiAgICAgICAgbGV0IGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IGJveC50b3AgKyBwYWdlWU9mZnNldCxcbiAgICAgICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgcGFnZVhPZmZzZXRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgYWRkTWVudUl0ZW0gPSAoaXRlbSwgcGFyZW50ID0gbnVsbCkgPT4ge1xuICAgICAgICBpZiAobWVudUl0ZW1zICYmIGl0ZW1UZW1wbGF0ZSAmJiAnY29udGVudCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKSkge1xuXG4gICAgICAgICAgICBpZiAobWVudUl0ZW1zLmNsYXNzTGlzdC5jb250YWlucygnbm8taXRlbXMnKSkge1xuICAgICAgICAgICAgICAgIG1lbnVJdGVtcy5jbGFzc0xpc3QucmVtb3ZlKCduby1pdGVtcycpO1xuICAgICAgICAgICAgICAgIG1lbnVJdGVtcy5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZGF0YSA9IGl0ZW07XG4gICAgICAgICAgICBkYXRhLmZvcm0gPSBmaWxsVGVtcGxhdGUoZm9ybVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG5cbiAgICAgICAgICAgIGxldCBodG1sID0gZmlsbFRlbXBsYXRlKGl0ZW1UZW1wbGF0ZS5pbm5lckhUTUwsIGRhdGEpO1xuICAgICAgICAgICAgaWYgKGh0bWwpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LmNsYXNzTGlzdC5hZGQoJ21lbnUtaXRlbXMnKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCBcInRhYmxpc3RcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3RJdGVtID0gaHRtbFRvRWxlbWVudChodG1sKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5hcHBlbmQobGlzdEl0ZW0pO1xuXG4gICAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yKCdbZGF0YS1pZD1cIicgKyBwYXJlbnQgKyAnXCJdJykuYXBwZW5kKGxpc3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcy5hcHBlbmQoaHRtbFRvRWxlbWVudChodG1sKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZm9ybXMgPSBtZW51SXRlbXMucXVlcnlTZWxlY3RvckFsbCgnLnBhbmVsIGZvcm0nKTtcbiAgICAgICAgICAgIHZhciBzb3VyY2VzTGlzdCA9IFsuLi5mb3Jtc10uZmlsdGVyKGZvcm0gPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoaWxkcmVuLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLm9uQ2hhbmdlKGRyYWdPYmplY3QsIG1lbnVJdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBvdXRPZkJ0biA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnRvb2xiYXIgYVtkYXRhLXJlbD1cIm91dC1vZlwiXScpO1xuICAgICAgICAgICAgICAgICAgICBvdXRPZkJ0bi5vbmNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW0gPSBmb3JtLmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcy5hcHBlbmQoZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgdXBPbmVCdG4gPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy50b29sYmFyIGFbZGF0YS1yZWw9XCJ1cC1vbmVcIl0nKTtcbiAgICAgICAgICAgICAgICAgICAgdXBPbmVCdG4ub25jbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtID0gZm9ybS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcmV2ID0gZWxlbS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbGVtLCBwcmV2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgZG93bk9uZUJ0biA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnRvb2xiYXIgYVtkYXRhLXJlbD1cImRvd24tb25lXCJdJyk7XG4gICAgICAgICAgICAgICAgICAgIGRvd25PbmVCdG4ub25jbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtID0gZm9ybS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gZWxlbS5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsZW0sIG5leHQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZW1vdmVCdG4gPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy50b29sYmFyIGFbZGF0YS1yZWw9XCJyZW1vdmVcIl0nKTtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQnRuLm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbSA9IGZvcm0uY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHNlbGYub25BZGRTdWNjZXNzKGRyYWdPYmplY3QsIG1lbnVJdGVtcyk7XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZi5vbkFkZEZhaWx0dXJlKGRyYWdPYmplY3QsIG1lbnVJdGVtcyk7XG4gICAgfTtcblxuICAgIGlmIChhZGRNZW51SXRlbUZvcm0pIHtcbiAgICAgICAgbGV0IGFkZEJ1dHRvbiA9IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdidXR0b25bZGF0YS1yZWw9XCJhZGRcIl0nKTtcbiAgICAgICAgYWRkQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcblxuICAgICAgICAgICAgbGV0IGNvbGxhcHNlVG9nZ2xlciA9IG1lbnVTb3VyY2VzLnF1ZXJ5U2VsZWN0b3IoJyNzb3VyY2UtbGluayBhW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nKTtcbiAgICAgICAgICAgIGxldCBpdGVtID0ge1xuICAgICAgICAgICAgICAgICdpZCc6IG51bGwsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZSc6IGNvbGxhcHNlVG9nZ2xlci5kYXRhc2V0LnR5cGUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAnc291cmNlX25hbWUnOiBjb2xsYXBzZVRvZ2dsZXIuZGF0YXNldC5uYW1lIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgJ25hbWUnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tuYW1lXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICd0aXRsZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RpdGxlXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfaWQnOiBudWxsLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfdHlwZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3NvdXJjZV90eXBlXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfdXJsJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3VybF1cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAnb25seV9hdXRoJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbb25seV9hdXRoXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICd0YXJnZXRfYmxhbmsnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0YXJnZXRfYmxhbmtdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoYWRkTWVudUl0ZW0oaXRlbSkpXG4gICAgICAgICAgICAgICAgYWRkTWVudUl0ZW1Gb3JtLnJlc2V0KCk7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG1lbnVTb3VyY2VzKSB7XG4gICAgICAgIHZhciBwYW5lbHMgPSBtZW51U291cmNlcy5xdWVyeVNlbGVjdG9yQWxsKFwiLnBhbmVsXCIpO1xuICAgICAgICB2YXIgc291cmNlc0xpc3QgPSBbLi4ucGFuZWxzXS5maWx0ZXIocGFuZWwgPT4ge1xuICAgICAgICAgICAgaWYgKHBhbmVsLmNoaWxkcmVuLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IGFkZEJ1dHRvbiA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICAgICAgICAgIGxldCBzZWxlY3RBbGwgPSBwYW5lbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZT1cInNlbGVjdC1hbGxcIl0nKTtcbiAgICAgICAgICAgICAgICBsZXQgaXRlbXMgPSBwYW5lbC5xdWVyeVNlbGVjdG9yQWxsKCcuc291cmNlLWxpc3QgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJyk7XG5cblxuICAgICAgICAgICAgICAgIGlmIChhZGRCdXR0b24gJiYgaXRlbXMpIHtcblxuICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXTpjaGVja2VkOm5vdChbbmFtZT1cInNlbGVjdC1hbGxcIl0pJykubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uLm9uY2xpY2sgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc291cmNlc0l0ZW1zID0gWy4uLml0ZW1zXS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRNZW51SXRlbShpdGVtLmRhdGFzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RBbGwgJiYgaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0QWxsLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChjaGVja2JveCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94Lm9uY2hhbmdlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgY3JlYXRlRHJvcHBhYmxlID0gKGUpID0+IHtcbiAgICAgICAgbGV0IHRvcCA9IGUuY2xpZW50WSB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgbGV0IGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGxlZnQsIHRvcCk7XG4gICAgICAgIGxldCBkcm9wcGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5hZGQoJ2Ryb3BwYWJsZScpO1xuXG4gICAgICAgIGlmICgoZHJhZ09iamVjdC5hdmF0YXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCAtIGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCkgPj0gKGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoKjAuMSkpXG4gICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG5cbiAgICAgICAgbGV0IGl0ZW1UZXh0ID0gZHJhZ09iamVjdC5hdmF0YXIucXVlcnlTZWxlY3RvcignLnBhbmVsLXRpdGxlIGFbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScpLmRhdGFzZXRbJ25hbWUnXTtcbiAgICAgICAgbGV0IGRyb3BwYWJsZVRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShpdGVtVGV4dC50cmltKCkpO1xuICAgICAgICBkcm9wcGFibGUuYXBwZW5kQ2hpbGQoZHJvcHBhYmxlVGV4dCk7XG5cbiAgICAgICAgZHJvcHBhYmxlLnN0eWxlLndpZHRoID0gZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICBkcm9wcGFibGUuc3R5bGUuaGVpZ2h0ID0gZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0SGVpZ2h0ICsgJ3B4JztcblxuICAgICAgICBpZiAoIWRyb3BwYWJsZS5pc0VxdWFsTm9kZShkcmFnT2JqZWN0LmRyb3BwYWJsZSkpIHtcbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyb3BwYWJsZTpub3QoLmRlbGV0ZS1hcmVhKVwiKSk7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZHJhZ09iamVjdC5kcm9wcGFibGUgPSBkcm9wcGFibGU7XG5cbiAgICAgICAgbGV0IHRhcmdldCA9IGVsZW0uY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuXG4gICAgICAgIGlmICh0YXJnZXQgJiYgdHlwZW9mIHRhcmdldCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgICByZW1vdmVFbGVtZW50cyhtZW51SXRlbXMucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGlmICh0b3AgPj0gKHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyAodGFyZ2V0Lm9mZnNldEhlaWdodC8xLjUpKSkge1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hZnRlcihkcm9wcGFibGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpXG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRvcCA8ICh0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgKHRhcmdldC5vZmZzZXRIZWlnaHQvMS41KSkpIHtcblxuICAgICAgICAgICAgICAgIGlmICgoZHJhZ09iamVjdC5hdmF0YXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCAtIGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCkgPj0gKGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoKjAuMSkpXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5xdWVyeVNlbGVjdG9yKCcuY29sbGFwc2UnKS5hZnRlcihkcm9wcGFibGUpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LmJlZm9yZShkcm9wcGFibGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbXMnKS5maXJzdENoaWxkLmlzRXF1YWxOb2RlKGRyb3BwYWJsZSkpXG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpIHtcbiAgICAgICAgICAgICAgICAgICAgZHJvcHBhYmxlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLndpZHRoID0gZHJvcHBhYmxlLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyb3BwYWJsZS5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjcmVhdGVBdmF0YXIgPSAoZSkgPT4ge1xuXG4gICAgICAgIC8vIFJlbWVtYmVyIG9sZCBwcm9wZXJ0aWVzIHRvIHJldHVybiB0byB0aGVtIHdoZW4gY2FuY2VsaW5nIHRoZSB0cmFuc2ZlclxuICAgICAgICB2YXIgYXZhdGFyID0gZHJhZ09iamVjdC5lbGVtO1xuICAgICAgICB2YXIgb2xkID0ge1xuICAgICAgICAgICAgcGFyZW50OiBhdmF0YXIucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIG5leHRTaWJsaW5nOiBhdmF0YXIubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwb3NpdGlvbjogYXZhdGFyLnBvc2l0aW9uIHx8ICcnLFxuICAgICAgICAgICAgbGVmdDogYXZhdGFyLmxlZnQgfHwgJycsXG4gICAgICAgICAgICB0b3A6IGF2YXRhci50b3AgfHwgJycsXG4gICAgICAgICAgICB6SW5kZXg6IGF2YXRhci56SW5kZXggfHwgJydcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBGdW5jdGlvbiB0byBjYW5jZWwgdHJhbnNmZXJcbiAgICAgICAgYXZhdGFyLnJvbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgb2xkLnBhcmVudC5pbnNlcnRCZWZvcmUoYXZhdGFyLCBvbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnBvc2l0aW9uID0gb2xkLnBvc2l0aW9uO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLmxlZnQgPSBvbGQubGVmdDtcbiAgICAgICAgICAgIGF2YXRhci5zdHlsZS50b3AgPSBvbGQudG9wO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnpJbmRleCA9IG9sZC56SW5kZXg7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGF2YXRhcjtcbiAgICB9XG4gICAgdmFyIHN0YXJ0RHJhZyA9IChlKSA9PiB7XG5cbiAgICAgICAgbGV0IGF2YXRhciA9IGRyYWdPYmplY3QuYXZhdGFyO1xuICAgICAgICBhdmF0YXIuc3R5bGUud2lkdGggPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCArICdweCc7XG4gICAgICAgIGF2YXRhci5zdHlsZS5oZWlnaHQgPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRIZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIC8vIEluaXRpYXRlIHN0YXJ0IGRyYWdnaW5nXG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QuYWRkKCdkcmFnLWluJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgIGRlbGV0ZUFyZWEuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcblxuICAgICAgICBsZXQgYXZhdGFyID0gZHJhZ09iamVjdC5hdmF0YXI7XG4gICAgICAgIGxldCBkcm9wRWxlbSA9IGZpbmREcm9wcGFibGUoZSk7XG5cbiAgICAgICAgaWYgKCFkcm9wRWxlbSlcbiAgICAgICAgICAgIGF2YXRhci5yb2xsYmFjaygpO1xuXG4gICAgICAgIGF2YXRhci5zdHlsZSA9ICcnO1xuICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LnJlbW92ZSgnZHJhZy1pbicpO1xuXG4gICAgICAgIGxldCBkcm9wcGFibGUgPSBkcmFnTWVudS5xdWVyeVNlbGVjdG9yKFwiLmRyb3BwYWJsZVwiKTtcbiAgICAgICAgaWYgKGRyb3BwYWJsZS5jbGFzc0xpc3QuY29udGFpbnMoJ2RlbGV0ZS1hcmVhJykpIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIGF2YXRhci5yZW1vdmUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChkcm9wcGFibGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG5cbiAgICAgICAgICAgIGxldCBsaXN0ID0gZHJvcHBhYmxlLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvcihcInVsXCIpO1xuICAgICAgICAgICAgaWYgKCFsaXN0KSB7XG4gICAgICAgICAgICAgICAgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICAgICAgICAgICAgbGlzdC5jbGFzc0xpc3QuYWRkKCdtZW51LWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgbGlzdC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCBcInRhYmxpc3RcIik7XG4gICAgICAgICAgICAgICAgZHJvcHBhYmxlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobGlzdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF2YXRhci5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgZHJvcHBhYmxlLnJlcGxhY2VXaXRoKGF2YXRhcik7XG4gICAgICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGF2YXRhcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgIGRyb3BwYWJsZS5yZXBsYWNlV2l0aChhdmF0YXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2VsZWN0cyBhbGwgPHVsPiBlbGVtZW50cywgdGhlbiBmaWx0ZXJzIHRoZSBjb2xsZWN0aW9uXG4gICAgICAgIGxldCBsaXN0cyA9IG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yQWxsKCd1bCcpO1xuICAgICAgICAvLyBLZWVwIG9ubHkgdGhvc2UgZWxlbWVudHMgd2l0aCBubyBjaGlsZC1lbGVtZW50c1xuICAgICAgICBsZXQgZW1wdHlMaXN0ID0gWy4uLmxpc3RzXS5maWx0ZXIoZWxlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbS5jaGlsZHJlbi5sZW5ndGggPT09IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGVtcHR5IG9mIGVtcHR5TGlzdClcbiAgICAgICAgICAgIGVtcHR5LnJlbW92ZSgpO1xuXG4gICAgICAgIGRyYWdPYmplY3QuZGF0YSA9IHRyYW5zZm9ybURhdGEobWVudUl0ZW1zKTtcbiAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGRlbGV0ZUFyZWEpXG4gICAgICAgICAgICAgICAgZGVsZXRlQXJlYS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgICAgaWYgKCFkcm9wRWxlbSlcbiAgICAgICAgICAgIHNlbGYub25EcmFnQ2FuY2VsKGRyYWdPYmplY3QpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxmLm9uRHJhZ0VuZChkcmFnT2JqZWN0LCBkcm9wRWxlbSk7XG4gICAgfVxuICAgIHZhciBmaW5kRHJvcHBhYmxlID0gKGUpID0+IHtcbiAgICAgICAgLy8gSGlkZSB0aGUgdHJhbnNmZXJyZWQgZWxlbWVudFxuICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5oaWRkZW4gPSB0cnVlO1xuXG4gICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWDtcblxuICAgICAgICAvLyBHZXQgdGhlIG1vc3QgbmVzdGVkIGVsZW1lbnQgdW5kZXIgdGhlIG1vdXNlIGN1cnNvclxuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcblxuICAgICAgICAvLyBTaG93IHRoZSB0cmFuc2ZlcnJlZCBpdGVtIGJhY2tcbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGVsZW0gPT0gbnVsbCkgLy8gUG9zc2libGUgaWYgdGhlIG1vdXNlIGN1cnNvciBcImZseVwiIG91dHNpZGUgdGhlIHdpbmRvdyBib3JkZXJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIHJldHVybiBlbGVtLmNsb3Nlc3QoJy5kcm9wcGFibGUnKTtcbiAgICB9XG5cblxuICAgIHZhciBvbk1vdXNlRG93biA9IChlKSA9PiB7XG5cbiAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJtb3VzZWRvd25cIiAmJiBlLndoaWNoICE9IDEpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGVsZW0gPSBlLnRhcmdldC5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG4gICAgICAgIGlmIChlbGVtKSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmVsZW0gPSBlbGVtO1xuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhhdCB0aGUgZWxlbWVudCBpcyBjbGlja2VkIGF0IHRoZSBjdXJyZW50IGNvb3JkaW5hdGVzIHBhZ2VYIC8gcGFnZVlcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZG93blggPSBlLnBhZ2VYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZG93blkgPSBlLnBhZ2VZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBvbk1vdXNlTW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGlmICghZHJhZ09iamVjdC5lbGVtKSByZXR1cm47IC8vIEVsZW1lbnQgaXMgbm90IG1vdmVcblxuICAgICAgICBpZiAoIWRyYWdPYmplY3QuYXZhdGFyKSB7IC8vIElmIHRyYW5zZmVyIGhhcyBub3Qgc3RhcnRlZCAuLi5cblxuICAgICAgICAgICAgbGV0IG1vdmVYID0gMDtcbiAgICAgICAgICAgIGxldCBtb3ZlWSA9IDA7XG4gICAgICAgICAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICAgICAgICAgICAgbW92ZVggPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVggLSBkcmFnT2JqZWN0LmRvd25YO1xuICAgICAgICAgICAgICAgIG1vdmVZID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZVggPSBlLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUucGFnZVkgLSBkcmFnT2JqZWN0LmRvd25ZO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGUgbW91c2UgaGFzIG5vdCBtb3ZlZCBmYXIgZW5vdWdoIHdoZW4gcHJlc3NlZFxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKG1vdmVYKSA8IHRvbGVyYW5jZSAmJiBNYXRoLmFicyhtb3ZlWSkgPCB0b2xlcmFuY2UpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBTdGFydGluZyBkcmFnIGFuZCBjcmVhdGUgYXZhdGFyXG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhciA9IGNyZWF0ZUF2YXRhcihlKTtcbiAgICAgICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8gQ2FuY2VsbGF0aW9uIG9mIGRyYWdnaW5nLCBpdCBpcyBpbXBvc3NpYmxlIHRvIFwiY2FwdHVyZVwiIHRoaXMgcGFydCBvZiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEF2YXRhciBjcmVhdGVkLCBjcmVhdGUgaGVscGVyIHByb3BlcnRpZXMgc2hpZnRYIC8gc2hpZnRZXG4gICAgICAgICAgICBsZXQgY29vcmRzID0gZ2V0Q29vcmRzKGRyYWdPYmplY3QuYXZhdGFyKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3Quc2hpZnRYID0gZHJhZ09iamVjdC5kb3duWCAtIGNvb3Jkcy5sZWZ0O1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFkgPSBkcmFnT2JqZWN0LmRvd25ZIC0gY29vcmRzLnRvcDtcblxuICAgICAgICAgICAgc3RhcnREcmFnKGUpOyAvLyBTaG93IHN0YXJ0IG9mIGRyYWdcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpc3BsYXkgbW92aW5nIG9iamVjdCBvbiBldmVyeSBtb3VzZSBtb3ZlbWVudFxuICAgICAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS5sZWZ0ID0gKGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVggLSBkcmFnT2JqZWN0LnNoaWZ0WCkgKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUudG9wID0gKGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVkgLSBkcmFnT2JqZWN0LnNoaWZ0WSkgKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUubGVmdCA9IChlLnBhZ2VYIC0gZHJhZ09iamVjdC5zaGlmdFgpICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLnRvcCA9IChlLnBhZ2VZIC0gZHJhZ09iamVjdC5zaGlmdFkpICsgJ3B4JztcbiAgICAgICAgfVxuXG4gICAgICAgIGNyZWF0ZURyb3BwYWJsZShlKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgb25Nb3VzZVVwID0gKGUpID0+IHtcbiAgICAgICAgaWYgKGRyYWdPYmplY3QuYXZhdGFyKSAvLyBJZiB0aGUgZHJhZyBpcyBpbiBwcm9ncmVzc1xuICAgICAgICAgICAgZmluaXNoRHJhZyhlKTtcblxuICAgICAgICAvLyBEcmFnIGVpdGhlciBkaWQgbm90IHN0YXJ0IG9yIGVuZGVkLiBJbiBhbnkgY2FzZSwgY2xlYXIgdGhlIFwidHJhbnNmZXIgc3RhdGVcIiBvZiB0aGUgZHJhZ09iamVjdFxuICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgfVxuXG4gICAgdGhpcy5nZXRJdGVtc0RhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybURhdGEobWVudUl0ZW1zKTtcbiAgICB9O1xuXG4gICAgdGhpcy5idWlsZE1lbnVJdGVtcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgbGV0IGl0ZW1zID0gWy4uLmRhdGFdLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PSBcIm9iamVjdFwiKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50X2lkID0gaXRlbS5wYXJlbnRfaWRcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5zb3VyY2VfdHlwZSAmJiAhaXRlbS5zb3VyY2VfbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zb3VyY2VfbmFtZSA9IG1lbnVTb3VyY2VzLnF1ZXJ5U2VsZWN0b3IoJy5wYW5lbCAucGFuZWwtaGVhZGluZyBhW2RhdGEtaWQ9XCInK2l0ZW0uc291cmNlX3R5cGUrJ1wiXScpLmRhdGFzZXQubmFtZTtcblxuICAgICAgICAgICAgICAgIGFkZE1lbnVJdGVtKGl0ZW0sIHBhcmVudF9pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLm9uSW5pdCA9IGZ1bmN0aW9uKG1lbnVJdGVtcykgeyB9O1xuICAgIHRoaXMub25EcmFnRW5kID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgZHJvcEVsZW0pIHt9O1xuICAgIHRoaXMub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24oZHJhZ09iamVjdCkge307XG5cbiAgICB0aGlzLm9uQ2hhbmdlID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgbWVudUl0ZW1zKSB7fTtcbiAgICB0aGlzLm9uQWRkU3VjY2VzcyA9IGZ1bmN0aW9uKGRyYWdPYmplY3QsIG1lbnVJdGVtcykge307XG4gICAgdGhpcy5vbkFkZEZhaWx0dXJlID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgbWVudUl0ZW1zKSB7fTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChkcmFnTWVudSAmJiBtZW51SXRlbXMpIHtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9ubW91c2Vkb3duID0gb25Nb3VzZURvd247XG4gICAgICAgICAgICBkcmFnTWVudS5vbnRvdWNoc3RhcnQgPSBvbk1vdXNlRG93bjtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9ubW91c2Vtb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgICAgICAgICBkcmFnTWVudS5vbnRvdWNobW92ZSA9IG9uTW91c2VNb3ZlO1xuICAgICAgICAgICAgZHJhZ01lbnUub25tb3VzZXVwID0gb25Nb3VzZVVwO1xuICAgICAgICAgICAgZHJhZ01lbnUub250b3VjaGVuZCA9IG9uTW91c2VVcDtcbiAgICAgICAgICAgIHNlbGYub25Jbml0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuRHJhZ01lbnUub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24gKGRyYWdPYmplY3QpIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gZHJhZ09iamVjdC5kYXRhO1xuICAgIH1cbn07XG5cbkRyYWdNZW51Lm9uRHJhZ0VuZCA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0LCBkcm9wRWxlbSkge1xuICAgIGlmIChkcmFnT2JqZWN0LmRhdGEpIHtcbiAgICAgICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICAgICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSBkcmFnT2JqZWN0LmRhdGE7XG4gICAgfVxufTtcblxuRHJhZ01lbnUub25DaGFuZ2UgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgbWVudUl0ZW1zKSB7XG4gICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSA9IHRoaXMuZ2V0SXRlbXNEYXRhKCk7XG59O1xuXG5EcmFnTWVudS5vbkFkZFN1Y2Nlc3MgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgbWVudUl0ZW1zKSB7XG4gICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSA9IHRoaXMuZ2V0SXRlbXNEYXRhKCk7XG59O1xuXG5EcmFnTWVudS5vbkluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICBsZXQgZGF0YSA9IGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHRoaXMuYnVpbGRNZW51SXRlbXMoSlNPTi5wYXJzZShkYXRhKSk7XG4gICAgfVxufTtcbiJdfQ==
