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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBEcmFnTWVudSA9IG5ldyBmdW5jdGlvbigpIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdG9sZXJhbmNlID0gNTtcbiAgICB2YXIgZHJhZ09iamVjdCA9IHt9O1xuICAgIHZhciBkcmFnTWVudSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkcmFnTWVudScpO1xuICAgIHZhciBtZW51SXRlbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJyk7XG4gICAgdmFyIG1lbnVTb3VyY2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVTb3VyY2VzJyk7XG4gICAgdmFyIGZvcm1UZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpdGVtRm9ybVRlbXBsYXRlJyk7XG4gICAgdmFyIGl0ZW1UZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbVRlbXBsYXRlJyk7XG4gICAgdmFyIGFkZE1lbnVJdGVtRm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51SXRlbUZvcm0nKTtcblxuICAgIGNvbnN0IHJlbW92ZUVsZW1lbnRzID0gKGVsbXMpID0+IGVsbXMuZm9yRWFjaChlbGVtID0+IGVsZW0ucmVtb3ZlKCkpO1xuXG4gICAgY29uc3QgdHJhbnNmb3JtRGF0YSA9IChsaXN0LCBqc29uID0gdHJ1ZSkgPT4ge1xuICAgICAgICBsZXQgdHJlZSA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaWxsaW5nIHRoZSB0cmVlIHdpdGggdmFsdWVzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTExJRWxlbWVudH0gZSAgIExJLdGN0LvQtdC80LXQvdGCINGBIGRhdGEtaWRcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gICAgICAgICByZWYgTGluayB0byB0aGUgdHJlZSB3aGVyZSB0byBhZGQgcHJvcGVydGllc1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gcHVzaChlLCByZWYsIG5vZGUgPSAnVUwnKSB7XG5cbiAgICAgICAgICAgIGxldCBpdGVtRm9ybSA9IGUucXVlcnlTZWxlY3RvcignZm9ybVtkYXRhLWtleV0nKTtcbiAgICAgICAgICAgIGxldCBwb2ludGVyID0geyAvLyBUYWtlIHRoZSBpZCBhdHRyaWJ1dGUgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBpZDogaXRlbUZvcm0uZ2V0QXR0cmlidXRlKCdkYXRhLWtleScpIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgLy9zb3VyY2VfdHlwZTogaXRlbUZvcm0uZ2V0QXR0cmlidXRlKCdkYXRhLXR5cGUnKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIG5hbWU6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbbmFtZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RpdGxlXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgc291cmNlX2lkOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3NvdXJjZV9pZF1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHNvdXJjZV90eXBlOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3NvdXJjZV90eXBlXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgc291cmNlX3VybDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfdXJsXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgb25seV9hdXRoOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW29ubHlfYXV0aF1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHRhcmdldF9ibGFuazogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0YXJnZXRfYmxhbmtdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChlLmNoaWxkRWxlbWVudENvdW50KSB7IC8vIElmIHRoZXJlIGFyZSBkZXNjZW5kYW50c1xuICAgICAgICAgICAgICAgIHBvaW50ZXIuY2hpbGRyZW4gPSBbXTsgLy8gQ3JlYXRlIGEgcHJvcGVydHkgZm9yIHRoZW1cbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGUuY2hpbGRyZW4pLmZvckVhY2goaSA9PiB7IC8vIFdlIHNvcnQgb3V0IGNoaWxkcmVuIChib25lIGJ5IGJvbmUhKVxuICAgICAgICAgICAgICAgICAgICBpZiAoaS5ub2RlTmFtZSA9PT0gbm9kZS50b1VwcGVyQ2FzZSgpKSB7IC8vIElmIHRoZXJlIGlzIGFub3RoZXIgVUwgY29udGFpbmVyLCBpdGVyYXRlIG92ZXIgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oaS5jaGlsZHJlbikuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoKGUsIHBvaW50ZXIuY2hpbGRyZW4pOyAvLyBXZSBjYWxsIHB1c2ggb24gbmV3IGxpLCBidXQgdGhlIHRyZWUgcmVmZXJlbmNlIGlzIG5vdyB0aGUgY2hpbGRyZW4gYXJyYXkgb2YgdGhlIHBvaW50ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlZi5wdXNoKHBvaW50ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgbGkgb2YgdGhlIHBhc3NlZCB1bFxuICAgICAgICBBcnJheS5mcm9tKGxpc3QuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICBwdXNoKGUsIHRyZWUsICdVTCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ganNvbiA/IEpTT04uc3RyaW5naWZ5KHRyZWUpIDogdHJlZTtcbiAgICB9XG5cbiAgICBjb25zdCB0b1dyYXAgPSAoZWxlbSwgd3JhcHBlcikgPT4ge1xuICAgICAgICB3cmFwcGVyID0gd3JhcHBlciB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuICAgICAgICByZXR1cm4gd3JhcHBlci5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGEgc2luZ2xlIGVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtFbGVtZW50fVxuICAgICAqL1xuICAgIGNvbnN0IGh0bWxUb0VsZW1lbnQgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICBodG1sID0gaHRtbC50cmltKCk7IC8vIE5ldmVyIHJldHVybiBhIHRleHQgbm9kZSBvZiB3aGl0ZXNwYWNlIGFzIHRoZSByZXN1bHRcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYW55IG51bWJlciBvZiBzaWJsaW5nIGVsZW1lbnRzXG4gICAgICogQHJldHVybiB7Tm9kZUxpc3R9XG4gICAgICovXG4gICAgY29uc3QgaHRtbFRvRWxlbWVudHMgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUuY29udGVudC5jaGlsZE5vZGVzO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGxUZW1wbGF0ZSA9IChzdHIsIG9iaikgPT4ge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgYmVmb3JlUmVwbGFjZSA9IHN0cjtcbiAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC97e1xccyooW159XFxzXSspXFxzKn19L2csIGZ1bmN0aW9uKHdob2xlTWF0Y2gsIGtleSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWJzdGl0dXRpb24gPSBvYmpbJC50cmltKGtleSldO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3Vic3RpdHV0aW9uID09PSB1bmRlZmluZWQgPyB3aG9sZU1hdGNoIDogc3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGFmdGVyUmVwbGFjZSA9IHN0ciAhPT0gYmVmb3JlUmVwbGFjZTtcbiAgICAgICAgfSB3aGlsZSAoYWZ0ZXJSZXBsYWNlKTtcblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRDb29yZHMgPSAoZWxlbSkgPT4ge1xuICAgICAgICBsZXQgYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogYm94LnRvcCArIHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgICAgbGVmdDogYm94LmxlZnQgKyBwYWdlWE9mZnNldFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBhZGRNZW51SXRlbSA9IChpdGVtLCBwYXJlbnQgPSBudWxsKSA9PiB7XG4gICAgICAgIGlmIChtZW51SXRlbXMgJiYgaXRlbVRlbXBsYXRlICYmICdjb250ZW50JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpKSB7XG5cbiAgICAgICAgICAgIGlmIChtZW51SXRlbXMuY2xhc3NMaXN0LmNvbnRhaW5zKCduby1pdGVtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmNsYXNzTGlzdC5yZW1vdmUoJ25vLWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBkYXRhID0gaXRlbTtcbiAgICAgICAgICAgIGRhdGEuZm9ybSA9IGZpbGxUZW1wbGF0ZShmb3JtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbGV0IGh0bWwgPSBmaWxsVGVtcGxhdGUoaXRlbVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG4gICAgICAgICAgICBpZiAoaHRtbCkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QuY2xhc3NMaXN0LmFkZCgnbWVudS1pdGVtcycpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LnNldEF0dHJpYnV0ZSgncm9sZScsIFwidGFibGlzdFwiKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdEl0ZW0gPSBodG1sVG9FbGVtZW50KGh0bWwpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0SXRlbS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0LmFwcGVuZChsaXN0SXRlbSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLWlkPVwiJyArIHBhcmVudCArICdcIl0nKS5hcHBlbmQobGlzdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zLmFwcGVuZChodG1sVG9FbGVtZW50KGh0bWwpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBmb3JtcyA9IG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yQWxsKCcucGFuZWwgZm9ybScpO1xuICAgICAgICAgICAgdmFyIHNvdXJjZXNMaXN0ID0gWy4uLmZvcm1zXS5maWx0ZXIoZm9ybSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm0uY2hpbGRyZW4ubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYub25DaGFuZ2UoZHJhZ09iamVjdCwgbWVudUl0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IG91dE9mQnRuID0gZm9ybS5xdWVyeVNlbGVjdG9yKCcudG9vbGJhciBhW2RhdGEtcmVsPVwib3V0LW9mXCJdJyk7XG4gICAgICAgICAgICAgICAgICAgIG91dE9mQnRuLm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbSA9IGZvcm0uY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zLmFwcGVuZChlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCB1cE9uZUJ0biA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnRvb2xiYXIgYVtkYXRhLXJlbD1cInVwLW9uZVwiXScpO1xuICAgICAgICAgICAgICAgICAgICB1cE9uZUJ0bi5vbmNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW0gPSBmb3JtLmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByZXYgPSBlbGVtLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsZW0sIHByZXYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCBkb3duT25lQnRuID0gZm9ybS5xdWVyeVNlbGVjdG9yKCcudG9vbGJhciBhW2RhdGEtcmVsPVwiZG93bi1vbmVcIl0nKTtcbiAgICAgICAgICAgICAgICAgICAgZG93bk9uZUJ0bi5vbmNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW0gPSBmb3JtLmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5leHQgPSBlbGVtLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWxlbSwgbmV4dC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbW92ZUJ0biA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnRvb2xiYXIgYVtkYXRhLXJlbD1cInJlbW92ZVwiXScpO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVCdG4ub25jbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtID0gZm9ybS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gc2VsZi5vbkFkZFN1Y2Nlc3MoZHJhZ09iamVjdCwgbWVudUl0ZW1zKTtcblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxmLm9uQWRkRmFpbHR1cmUoZHJhZ09iamVjdCwgbWVudUl0ZW1zKTtcbiAgICB9O1xuXG4gICAgaWYgKGFkZE1lbnVJdGVtRm9ybSkge1xuICAgICAgICBsZXQgYWRkQnV0dG9uID0gYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICBhZGRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgY29sbGFwc2VUb2dnbGVyID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvcignI3NvdXJjZS1saW5rIGFbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScpO1xuICAgICAgICAgICAgbGV0IGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgJ2lkJzogbnVsbCxcbiAgICAgICAgICAgICAgICAnc291cmNlJzogY29sbGFwc2VUb2dnbGVyLmRhdGFzZXQudHlwZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgICdzb3VyY2VfbmFtZSc6IGNvbGxhcHNlVG9nZ2xlci5kYXRhc2V0Lm5hbWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAnbmFtZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGl0bGVdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV9pZCc6IG51bGwsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV90eXBlJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbc291cmNlX3R5cGVdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZV91cmwnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tzb3VyY2VfdXJsXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICdvbmx5X2F1dGgnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tvbmx5X2F1dGhdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ3RhcmdldF9ibGFuayc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RhcmdldF9ibGFua11cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChhZGRNZW51SXRlbShpdGVtKSlcbiAgICAgICAgICAgICAgICBhZGRNZW51SXRlbUZvcm0ucmVzZXQoKTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobWVudVNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHBhbmVscyA9IG1lbnVTb3VyY2VzLnF1ZXJ5U2VsZWN0b3JBbGwoXCIucGFuZWxcIik7XG4gICAgICAgIHZhciBzb3VyY2VzTGlzdCA9IFsuLi5wYW5lbHNdLmZpbHRlcihwYW5lbCA9PiB7XG4gICAgICAgICAgICBpZiAocGFuZWwuY2hpbGRyZW4ubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgYWRkQnV0dG9uID0gcGFuZWwucXVlcnlTZWxlY3RvcignYnV0dG9uW2RhdGEtcmVsPVwiYWRkXCJdJyk7XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdEFsbCA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lPVwic2VsZWN0LWFsbFwiXScpO1xuICAgICAgICAgICAgICAgIGxldCBpdGVtcyA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3VyY2UtbGlzdCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcblxuXG4gICAgICAgICAgICAgICAgaWYgKGFkZEJ1dHRvbiAmJiBpdGVtcykge1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFuZWwucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOmNoZWNrZWQ6bm90KFtuYW1lPVwic2VsZWN0LWFsbFwiXSknKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24ub25jbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzb3VyY2VzSXRlbXMgPSBbLi4uaXRlbXNdLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZE1lbnVJdGVtKGl0ZW0uZGF0YXNldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdEFsbCAmJiBpdGVtcykge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RBbGwub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3gub25jaGFuZ2UoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBjcmVhdGVEcm9wcGFibGUgPSAoZSkgPT4ge1xuICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnZHJvcHBhYmxlJyk7XG5cbiAgICAgICAgaWYgKChkcmFnT2JqZWN0LmF2YXRhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSA+PSAoZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGgqMC4xKSlcbiAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICBsZXQgaXRlbVRleHQgPSBkcmFnT2JqZWN0LmF2YXRhci5xdWVyeVNlbGVjdG9yKCcucGFuZWwtdGl0bGUgYVtkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJykuZGF0YXNldFsnbmFtZSddO1xuICAgICAgICBsZXQgZHJvcHBhYmxlVGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGl0ZW1UZXh0LnRyaW0oKSk7XG4gICAgICAgIGRyb3BwYWJsZS5hcHBlbmRDaGlsZChkcm9wcGFibGVUZXh0KTtcblxuICAgICAgICBkcm9wcGFibGUuc3R5bGUud2lkdGggPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCArICdweCc7XG4gICAgICAgIGRyb3BwYWJsZS5zdHlsZS5oZWlnaHQgPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRIZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIGlmICghZHJvcHBhYmxlLmlzRXF1YWxOb2RlKGRyYWdPYmplY3QuZHJvcHBhYmxlKSkge1xuICAgICAgICAgICAgcmVtb3ZlRWxlbWVudHMobWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZHJvcHBhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IGRyb3BwYWJsZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gZWxlbS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyb3BwYWJsZTpub3QoLmRlbGV0ZS1hcmVhKVwiKSk7XG5cbiAgICAgICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICAgICAgbGV0IGxlZnQgPSBlLmNsaWVudFggfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgaWYgKHRvcCA+PSAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cblxuICAgICAgICAgICAgICAgIGlmICgoZHJhZ09iamVjdC5hdmF0YXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCAtIGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCkgPj0gKGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoKjAuMSkpXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5xdWVyeVNlbGVjdG9yKCcuY29sbGFwc2UnKS5hZnRlcihkcm9wcGFibGUpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LmFmdGVyKGRyb3BwYWJsZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnc3ViLWl0ZW0nKSlcbiAgICAgICAgICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodG9wIDwgKHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyAodGFyZ2V0Lm9mZnNldEhlaWdodC8xLjUpKSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKChkcmFnT2JqZWN0LmF2YXRhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSA+PSAoZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGgqMC4xKSlcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYXBzZScpLmFmdGVyKGRyb3BwYWJsZSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuYmVmb3JlKGRyb3BwYWJsZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtcycpLmZpcnN0Q2hpbGQuaXNFcXVhbE5vZGUoZHJvcHBhYmxlKSlcbiAgICAgICAgICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnc3ViLWl0ZW0nKSkge1xuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUud2lkdGggPSBkcm9wcGFibGUub2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUuaGVpZ2h0ID0gZHJvcHBhYmxlLm9mZnNldEhlaWdodCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNyZWF0ZUF2YXRhciA9IChlKSA9PiB7XG5cbiAgICAgICAgLy8gUmVtZW1iZXIgb2xkIHByb3BlcnRpZXMgdG8gcmV0dXJuIHRvIHRoZW0gd2hlbiBjYW5jZWxpbmcgdGhlIHRyYW5zZmVyXG4gICAgICAgIHZhciBhdmF0YXIgPSBkcmFnT2JqZWN0LmVsZW07XG4gICAgICAgIHZhciBvbGQgPSB7XG4gICAgICAgICAgICBwYXJlbnQ6IGF2YXRhci5wYXJlbnROb2RlLFxuICAgICAgICAgICAgbmV4dFNpYmxpbmc6IGF2YXRhci5uZXh0U2libGluZyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBhdmF0YXIucG9zaXRpb24gfHwgJycsXG4gICAgICAgICAgICBsZWZ0OiBhdmF0YXIubGVmdCB8fCAnJyxcbiAgICAgICAgICAgIHRvcDogYXZhdGFyLnRvcCB8fCAnJyxcbiAgICAgICAgICAgIHpJbmRleDogYXZhdGFyLnpJbmRleCB8fCAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEZ1bmN0aW9uIHRvIGNhbmNlbCB0cmFuc2ZlclxuICAgICAgICBhdmF0YXIucm9sbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBvbGQucGFyZW50Lmluc2VydEJlZm9yZShhdmF0YXIsIG9sZC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUucG9zaXRpb24gPSBvbGQucG9zaXRpb247XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUubGVmdCA9IG9sZC5sZWZ0O1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnRvcCA9IG9sZC50b3A7XG4gICAgICAgICAgICBhdmF0YXIuc3R5bGUuekluZGV4ID0gb2xkLnpJbmRleDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYXZhdGFyO1xuICAgIH1cbiAgICB2YXIgc3RhcnREcmFnID0gKGUpID0+IHtcblxuICAgICAgICBsZXQgYXZhdGFyID0gZHJhZ09iamVjdC5hdmF0YXI7XG4gICAgICAgIGF2YXRhci5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgLy8gSW5pdGlhdGUgc3RhcnQgZHJhZ2dpbmdcbiAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5hZGQoJ2RyYWctaW4nKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhdmF0YXIpO1xuXG4gICAgICAgIGxldCBkZWxldGVBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGUuZGVsZXRlLWFyZWFcIik7XG4gICAgICAgIGlmIChkZWxldGVBcmVhKVxuICAgICAgICAgICAgZGVsZXRlQXJlYS5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG5cbiAgICB9XG4gICAgdmFyIGZpbmlzaERyYWcgPSAoZSkgPT4ge1xuXG4gICAgICAgIGxldCBhdmF0YXIgPSBkcmFnT2JqZWN0LmF2YXRhcjtcbiAgICAgICAgbGV0IGRyb3BFbGVtID0gZmluZERyb3BwYWJsZShlKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgYXZhdGFyLnJvbGxiYWNrKCk7XG5cbiAgICAgICAgYXZhdGFyLnN0eWxlID0gJyc7XG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnLWluJyk7XG5cbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IGRyYWdNZW51LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlXCIpO1xuICAgICAgICBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnZGVsZXRlLWFyZWEnKSkge1xuICAgICAgICAgICAgZHJhZ09iamVjdCA9IHt9O1xuICAgICAgICAgICAgYXZhdGFyLnJlbW92ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGRyb3BwYWJsZS5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpIHtcblxuICAgICAgICAgICAgbGV0IGxpc3QgPSBkcm9wcGFibGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKFwidWxcIik7XG4gICAgICAgICAgICBpZiAoIWxpc3QpIHtcbiAgICAgICAgICAgICAgICBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgICAgICBsaXN0LmNsYXNzTGlzdC5hZGQoJ21lbnUtaXRlbXMnKTtcbiAgICAgICAgICAgICAgICBsaXN0LnNldEF0dHJpYnV0ZSgncm9sZScsIFwidGFibGlzdFwiKTtcbiAgICAgICAgICAgICAgICBkcm9wcGFibGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgZHJvcHBhYmxlLnJlcGxhY2VXaXRoKGF2YXRhcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWxlY3RzIGFsbCA8dWw+IGVsZW1lbnRzLCB0aGVuIGZpbHRlcnMgdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGxpc3RzID0gbWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoJ3VsJyk7XG4gICAgICAgIC8vIEtlZXAgb25seSB0aG9zZSBlbGVtZW50cyB3aXRoIG5vIGNoaWxkLWVsZW1lbnRzXG4gICAgICAgIGxldCBlbXB0eUxpc3QgPSBbLi4ubGlzdHNdLmZpbHRlcihlbGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChsZXQgZW1wdHkgb2YgZW1wdHlMaXN0KVxuICAgICAgICAgICAgZW1wdHkucmVtb3ZlKCk7XG5cbiAgICAgICAgZHJhZ09iamVjdC5kYXRhID0gdHJhbnNmb3JtRGF0YShtZW51SXRlbXMpO1xuICAgICAgICByZW1vdmVFbGVtZW50cyhtZW51SXRlbXMucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgIGxldCBkZWxldGVBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGUuZGVsZXRlLWFyZWFcIik7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgICAgICBkZWxldGVBcmVhLmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgc2VsZi5vbkRyYWdDYW5jZWwoZHJhZ09iamVjdCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNlbGYub25EcmFnRW5kKGRyYWdPYmplY3QsIGRyb3BFbGVtKTtcbiAgICB9XG4gICAgdmFyIGZpbmREcm9wcGFibGUgPSAoZSkgPT4ge1xuICAgICAgICAvLyBIaWRlIHRoZSB0cmFuc2ZlcnJlZCBlbGVtZW50XG4gICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLmhpZGRlbiA9IHRydWU7XG5cbiAgICAgICAgbGV0IHRvcCA9IGUuY2xpZW50WSB8fCBlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VYO1xuXG4gICAgICAgIC8vIEdldCB0aGUgbW9zdCBuZXN0ZWQgZWxlbWVudCB1bmRlciB0aGUgbW91c2UgY3Vyc29yXG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChsZWZ0LCB0b3ApO1xuXG4gICAgICAgIC8vIFNob3cgdGhlIHRyYW5zZmVycmVkIGl0ZW0gYmFja1xuICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5oaWRkZW4gPSBmYWxzZTtcblxuICAgICAgICBpZiAoZWxlbSA9PSBudWxsKSAvLyBQb3NzaWJsZSBpZiB0aGUgbW91c2UgY3Vyc29yIFwiZmx5XCIgb3V0c2lkZSB0aGUgd2luZG93IGJvcmRlclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIGVsZW0uY2xvc2VzdCgnLmRyb3BwYWJsZScpO1xuICAgIH1cblxuXG4gICAgdmFyIG9uTW91c2VEb3duID0gKGUpID0+IHtcblxuICAgICAgICBpZiAoZS50eXBlID09PSBcIm1vdXNlZG93blwiICYmIGUud2hpY2ggIT0gMSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgZWxlbSA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5kcmFnZ2FibGUnKTtcbiAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZWxlbSA9IGVsZW07XG4gICAgICAgICAgICAvLyBSZW1lbWJlciB0aGF0IHRoZSBlbGVtZW50IGlzIGNsaWNrZWQgYXQgdGhlIGN1cnJlbnQgY29vcmRpbmF0ZXMgcGFnZVggLyBwYWdlWVxuICAgICAgICAgICAgZHJhZ09iamVjdC5kb3duWCA9IGUucGFnZVggfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5kb3duWSA9IGUucGFnZVkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9uTW91c2VNb3ZlID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCFkcmFnT2JqZWN0LmVsZW0pIHJldHVybjsgLy8gRWxlbWVudCBpcyBub3QgbW92ZVxuXG4gICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8gSWYgdHJhbnNmZXIgaGFzIG5vdCBzdGFydGVkIC4uLlxuXG4gICAgICAgICAgICBsZXQgbW92ZVggPSAwO1xuICAgICAgICAgICAgbGV0IG1vdmVZID0gMDtcbiAgICAgICAgICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgICAgICAgICAgICBtb3ZlWCA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWCAtIGRyYWdPYmplY3QuZG93blg7XG4gICAgICAgICAgICAgICAgbW92ZVkgPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVkgLSBkcmFnT2JqZWN0LmRvd25ZO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlWCA9IGUucGFnZVggLSBkcmFnT2JqZWN0LmRvd25YO1xuICAgICAgICAgICAgICAgIG1vdmVZID0gZS5wYWdlWSAtIGRyYWdPYmplY3QuZG93blk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBtb3VzZSBoYXMgbm90IG1vdmVkIGZhciBlbm91Z2ggd2hlbiBwcmVzc2VkXG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMobW92ZVgpIDwgdG9sZXJhbmNlICYmIE1hdGguYWJzKG1vdmVZKSA8IHRvbGVyYW5jZSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIFN0YXJ0aW5nIGRyYWcgYW5kIGNyZWF0ZSBhdmF0YXJcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyID0gY3JlYXRlQXZhdGFyKGUpO1xuICAgICAgICAgICAgaWYgKCFkcmFnT2JqZWN0LmF2YXRhcikgeyAvLyBDYW5jZWxsYXRpb24gb2YgZHJhZ2dpbmcsIGl0IGlzIGltcG9zc2libGUgdG8gXCJjYXB0dXJlXCIgdGhpcyBwYXJ0IG9mIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAgICAgZHJhZ09iamVjdCA9IHt9O1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXZhdGFyIGNyZWF0ZWQsIGNyZWF0ZSBoZWxwZXIgcHJvcGVydGllcyBzaGlmdFggLyBzaGlmdFlcbiAgICAgICAgICAgIGxldCBjb29yZHMgPSBnZXRDb29yZHMoZHJhZ09iamVjdC5hdmF0YXIpO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFggPSBkcmFnT2JqZWN0LmRvd25YIC0gY29vcmRzLmxlZnQ7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LnNoaWZ0WSA9IGRyYWdPYmplY3QuZG93blkgLSBjb29yZHMudG9wO1xuXG4gICAgICAgICAgICBzdGFydERyYWcoZSk7IC8vIFNob3cgc3RhcnQgb2YgZHJhZ1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGlzcGxheSBtb3Zpbmcgb2JqZWN0IG9uIGV2ZXJ5IG1vdXNlIG1vdmVtZW50XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS5sZWZ0ID0gKGUucGFnZVggLSBkcmFnT2JqZWN0LnNoaWZ0WCkgKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUudG9wID0gKGUucGFnZVkgLSBkcmFnT2JqZWN0LnNoaWZ0WSkgKyAncHgnO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRHJvcHBhYmxlKGUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlVXAgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoZHJhZ09iamVjdC5hdmF0YXIpIC8vIElmIHRoZSBkcmFnIGlzIGluIHByb2dyZXNzXG4gICAgICAgICAgICBmaW5pc2hEcmFnKGUpO1xuXG4gICAgICAgIC8vIERyYWcgZWl0aGVyIGRpZCBub3Qgc3RhcnQgb3IgZW5kZWQuIEluIGFueSBjYXNlLCBjbGVhciB0aGUgXCJ0cmFuc2ZlciBzdGF0ZVwiIG9mIHRoZSBkcmFnT2JqZWN0XG4gICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLmdldEl0ZW1zRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtRGF0YShtZW51SXRlbXMpO1xuICAgIH07XG5cbiAgICB0aGlzLmJ1aWxkTWVudUl0ZW1zID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBsZXQgaXRlbXMgPSBbLi4uZGF0YV0uZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09IFwib2JqZWN0XCIpIHtcblxuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRfaWQgPSBpdGVtLnBhcmVudF9pZFxuICAgICAgICAgICAgICAgIGlmIChpdGVtLnNvdXJjZV90eXBlICYmICFpdGVtLnNvdXJjZV9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNvdXJjZV9uYW1lID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvcignLnBhbmVsIC5wYW5lbC1oZWFkaW5nIGFbZGF0YS1pZD1cIicraXRlbS5zb3VyY2VfdHlwZSsnXCJdJykuZGF0YXNldC5uYW1lO1xuXG4gICAgICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbSwgcGFyZW50X2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMub25Jbml0ID0gZnVuY3Rpb24obWVudUl0ZW1zKSB7IH07XG4gICAgdGhpcy5vbkRyYWdFbmQgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBkcm9wRWxlbSkge307XG4gICAgdGhpcy5vbkRyYWdDYW5jZWwgPSBmdW5jdGlvbihkcmFnT2JqZWN0KSB7fTtcblxuICAgIHRoaXMub25DaGFuZ2UgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHt9O1xuICAgIHRoaXMub25BZGRTdWNjZXNzID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgbWVudUl0ZW1zKSB7fTtcbiAgICB0aGlzLm9uQWRkRmFpbHR1cmUgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHt9O1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGRyYWdNZW51ICYmIG1lbnVJdGVtcykge1xuICAgICAgICAgICAgZHJhZ01lbnUub25tb3VzZWRvd24gPSBvbk1vdXNlRG93bjtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9udG91Y2hzdGFydCA9IG9uTW91c2VEb3duO1xuICAgICAgICAgICAgZHJhZ01lbnUub25tb3VzZW1vdmUgPSBvbk1vdXNlTW92ZTtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9udG91Y2htb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgICAgICAgICBkcmFnTWVudS5vbm1vdXNldXAgPSBvbk1vdXNlVXA7XG4gICAgICAgICAgICBkcmFnTWVudS5vbnRvdWNoZW5kID0gb25Nb3VzZVVwO1xuICAgICAgICAgICAgc2VsZi5vbkluaXQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5EcmFnTWVudS5vbkRyYWdDYW5jZWwgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCkge1xuICAgIGlmIChkcmFnT2JqZWN0LmRhdGEpIHtcbiAgICAgICAgbGV0IGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkTWVudUZvcm0nKTtcbiAgICAgICAgZm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dCNtZW51LWl0ZW1zJykudmFsdWUgPSBkcmFnT2JqZWN0LmRhdGE7XG4gICAgfVxufTtcblxuRHJhZ01lbnUub25EcmFnRW5kID0gZnVuY3Rpb24gKGRyYWdPYmplY3QsIGRyb3BFbGVtKSB7XG4gICAgaWYgKGRyYWdPYmplY3QuZGF0YSkge1xuICAgICAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgICAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59O1xuXG5EcmFnTWVudS5vbkNoYW5nZSA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHtcbiAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gdGhpcy5nZXRJdGVtc0RhdGEoKTtcbn07XG5cbkRyYWdNZW51Lm9uQWRkU3VjY2VzcyA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHtcbiAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gdGhpcy5nZXRJdGVtc0RhdGEoKTtcbn07XG5cbkRyYWdNZW51Lm9uSW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgIGxldCBkYXRhID0gSlNPTi5wYXJzZShmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSk7XG4gICAgdGhpcy5idWlsZE1lbnVJdGVtcyhkYXRhKTtcbn07XG4iXX0=
