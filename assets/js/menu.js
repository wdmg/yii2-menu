var DragMenu = new function() {

    var self = this;
    var dragObject = {};
    var dragMenu = document.getElementById('dragMenu');
    var menuItems = document.getElementById('menuItems');
    var menuSources = document.getElementById('menuSources');
    var panels = menuSources.querySelectorAll(".panel");
    var formTemplate = document.getElementById('itemFormTemplate');
    var itemTemplate = document.getElementById('menuItemTemplate');
    var addMenuItemForm = document.getElementById('addMenuItemForm');

    const removeElements = (elms) => elms.forEach(elem => elem.remove());

    const transformData = (list, json = true) => {
        let tree = [];

        /**
         * Наполнение дерева значениями
         *
         * @param {HTMLLIElement} e   LI-элемент с data-id
         * @param {Array}         ref Ссылка на дерево, куда добавлять свойства
         */
        function push(e, ref, node = 'UL') {

            let itemForm = e.querySelector('form[data-key]');
            let pointer = { // Берём атрибут id элемента
                id: itemForm.getAttribute('data-key') || null,
                type: itemForm.getAttribute('data-type') || null,
                name: itemForm.querySelector('input[name="MenuItems[name]"]').value || null,
                title: itemForm.querySelector('input[name="MenuItems[title]"]').value || null,
                url: itemForm.querySelector('input[name="MenuItems[url]"]').value || null,
                only_auth: itemForm.querySelector('input[name="MenuItems[only_auth]"]').value || null,
                target_blank: itemForm.querySelector('input[name="MenuItems[target_blank]"]').value || null,
            };

            if (e.childElementCount) { // Если есть потомки
                pointer.children = []; // Создаём свойство для них
                Array.from(e.children).forEach(i => { // Перебираем... хм... детей (по косточкам!)
                    if (i.nodeName === node.toUpperCase()) { // Если есть ещё один контейнер UL, перебираем его
                        Array.from(i.children).forEach(e => {
                            push(e, pointer.children); // Вызываем push на новых li, но ссылка на древо теперь - это массив children указателя
                        });
                    }
                });
            }

            ref.push(pointer);
        }

        // Проходимся по всем li переданного ul
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

            let content = fillTemplate(itemTemplate.innerHTML, data);

            if (parent) {

                let list = document.createElement('ul');
                list.classList.add('menu-items');
                list.setAttribute('role', "tablist");

                let listItem = htmlToElement(content);
                listItem.classList.add('sub-item');
                list.append(listItem);

                menuItems.querySelector('[data-id="' + parent + '"]').append(list);
            } else {
                menuItems.append(htmlToElement(content));
            }

            return self.onAddSuccess(dragObject, menuItems);

        }
        return self.onAddFailture(dragObject, menuItems);
    };

    if (addMenuItemForm.length) {
        let addButton = addMenuItemForm.querySelector('button[data-rel="add"]');
        addButton.addEventListener("click", (event) => {

            let collapseToggler = menuSources.querySelector('#source-link a[data-toggle="collapse"]');

            console.log(collapseToggler);

            let item = {
                'id': null,
                'source': collapseToggler.dataset.type || null,
                'source_name': collapseToggler.dataset.name || null,
                'name': addMenuItemForm.querySelector('input[name="MenuItems[name]"]').value || false,
                'title': addMenuItemForm.querySelector('input[name="MenuItems[title]"]').value || false,
                'url': addMenuItemForm.querySelector('input[name="MenuItems[url]"]').value || false,
                'only_auth': addMenuItemForm.querySelector('input[name="MenuItems[only_auth]"]').value || false,
                'target_blank': addMenuItemForm.querySelector('input[name="MenuItems[target_blank]"]').value || false,
            };

            if (addMenuItem(item))
                addMenuItemForm.reset();

        });
    }

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

            //console.log('target', target);

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

                //console.log('after');

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

                //console.log('before');

            }

            dragObject.avatar.style.width = droppable.offsetWidth + 'px';
            dragObject.avatar.style.height = droppable.offsetHeight + 'px';
        }
    }
    var createAvatar = (e) => {

        // запомнить старые свойства, чтобы вернуться к ним при отмене переноса
        var avatar = dragObject.elem;
        var old = {
            parent: avatar.parentNode,
            nextSibling: avatar.nextSibling,
            position: avatar.position || '',
            left: avatar.left || '',
            top: avatar.top || '',
            zIndex: avatar.zIndex || ''
        };

        // функция для отмены переноса
        avatar.rollback = () => {
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.position = old.position;
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex;
            //console.log('Drag cancel, rollback');
            /*setTimeout(function() {
                document.querySelector('.droppable.delete-area').classList.remove('show');
            }, 500);*/
        };

        return avatar;
    }
    var startDrag = (e) => {
        //console.log('startDrag');

        let avatar = dragObject.avatar;
        avatar.style.width = dragObject.avatar.offsetWidth + 'px';
        avatar.style.height = dragObject.avatar.offsetHeight + 'px';

        // инициировать начало переноса
        avatar.classList.add('drag-in');
        document.body.appendChild(avatar);

        let deleteArea = document.querySelector(".droppable.delete-area");
        if (deleteArea)
            deleteArea.classList.add('show');

    }
    var finishDrag = (e) => {
        //console.log('finishDrag');

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

        // selects all <ul> elements, then filters the collection
        let lists = menuItems.querySelectorAll('ul');
        // keep only those elements with no child-elements
        let emptyList = [...lists].filter(elem => {
            return elem.children.length === 0;
        });

        for (let empty of emptyList)
            empty.remove();

        //dragObject.data = transformData(menuItems.querySelector(".menu-items"));
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
        // спрячем переносимый элемент
        dragObject.avatar.hidden = true;

        let top = e.clientY || e.changedTouches[0].pageY;
        let left = e.clientX || e.changedTouches[0].pageX;

        // получить самый вложенный элемент под курсором мыши
        let elem = document.elementFromPoint(left, top);

        // показать переносимый элемент обратно
        dragObject.avatar.hidden = false;

        if (elem == null) // такое возможно, если курсор мыши "вылетел" за границу окна
            return null;

        return elem.closest('.droppable');
    }


    var onMouseDown = (e) => {

        if (e.type === "mousedown" && e.which != 1)
            return;

        var elem = e.target.closest('.draggable');
        if (!elem) return;

        dragObject.elem = elem;

        // запомним, что элемент нажат на текущих координатах pageX/pageY
        dragObject.downX = e.pageX || e.targetTouches[0].pageX;
        dragObject.downY = e.pageY || e.targetTouches[0].pageY;

        return false;
    }
    var onMouseMove = (e) => {
        if (!dragObject.elem) return; // элемент не зажат

        if (!dragObject.avatar) { // если перенос не начат...

            let moveX = 0;
            let moveY = 0;
            if (e.type === "touchmove") {
                moveX = e.targetTouches[0].pageX - dragObject.downX;
                moveY = e.targetTouches[0].pageY - dragObject.downY;
            } else {
                moveX = e.pageX - dragObject.downX;
                moveY = e.pageY - dragObject.downY;
            }

            // если мышь передвинулась в нажатом состоянии недостаточно далеко
            if (Math.abs(moveX) < 5 && Math.abs(moveY) < 5)
                return;

            // начинаем перенос
            dragObject.avatar = createAvatar(e); // создать аватар
            if (!dragObject.avatar) { // отмена переноса, нельзя "захватить" за эту часть элемента
                dragObject = {};
                return;
            }

            // аватар создан успешно
            // создать вспомогательные свойства shiftX/shiftY
            let coords = getCoords(dragObject.avatar);
            dragObject.shiftX = dragObject.downX - coords.left;
            dragObject.shiftY = dragObject.downY - coords.top;

            startDrag(e); // отобразить начало переноса
        }

        // отобразить перенос объекта при каждом движении мыши
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
        if (dragObject.avatar) // если перенос идет
            finishDrag(e);

        // перенос либо не начинался, либо завершился
        // в любом случае очистим "состояние переноса" dragObject
        dragObject = {};
    }

    this.getItemsData = function() {
        return transformData(menuItems);
    };

    this.buildMenuItems = function(data) {
        let items = [...data].filter(item => {
            if (typeof item == "object") {
                console.log(item);
                let parent_id = item.parent_id
                addMenuItem(item, parent_id);
            }
        });
    };

    this.onInit = function(menuItems) { };
    this.onDragEnd = function(dragObject, dropElem) {};
    this.onDragCancel = function(dragObject) {};

    this.onAddSuccess = function(dragObject, menuItems) {};
    this.onAddFailture = function(dragObject, menuItems) {};

    document.addEventListener("DOMContentLoaded", function(event) {
        if (dragMenu && menuItems) {
            console.log('dragMenu.onload');
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

DragMenu.onAddSuccess = function (dragObject, menuItems) {
    let form = document.getElementById('addMenuForm');
    form.querySelector('input#menu-items').value = this.getItemsData();
};

DragMenu.onInit = function () {
    let form = document.getElementById('addMenuForm');
    let data = JSON.parse(form.querySelector('input#menu-items').value);
    this.buildMenuItems(data);
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtZW51LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIERyYWdNZW51ID0gbmV3IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkcmFnT2JqZWN0ID0ge307XG4gICAgdmFyIGRyYWdNZW51ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RyYWdNZW51Jyk7XG4gICAgdmFyIG1lbnVJdGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51SXRlbXMnKTtcbiAgICB2YXIgbWVudVNvdXJjZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudVNvdXJjZXMnKTtcbiAgICB2YXIgcGFuZWxzID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvckFsbChcIi5wYW5lbFwiKTtcbiAgICB2YXIgZm9ybVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2l0ZW1Gb3JtVGVtcGxhdGUnKTtcbiAgICB2YXIgaXRlbVRlbXBsYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtVGVtcGxhdGUnKTtcbiAgICB2YXIgYWRkTWVudUl0ZW1Gb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVJdGVtRm9ybScpO1xuXG4gICAgY29uc3QgcmVtb3ZlRWxlbWVudHMgPSAoZWxtcykgPT4gZWxtcy5mb3JFYWNoKGVsZW0gPT4gZWxlbS5yZW1vdmUoKSk7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1EYXRhID0gKGxpc3QsIGpzb24gPSB0cnVlKSA9PiB7XG4gICAgICAgIGxldCB0cmVlID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqINCd0LDQv9C+0LvQvdC10L3QuNC1INC00LXRgNC10LLQsCDQt9C90LDRh9C10L3QuNGP0LzQuFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxMSUVsZW1lbnR9IGUgICBMSS3RjdC70LXQvNC10L3RgiDRgSBkYXRhLWlkXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgcmVmINCh0YHRi9C70LrQsCDQvdCwINC00LXRgNC10LLQviwg0LrRg9C00LAg0LTQvtCx0LDQstC70Y/RgtGMINGB0LLQvtC50YHRgtCy0LBcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHB1c2goZSwgcmVmLCBub2RlID0gJ1VMJykge1xuXG4gICAgICAgICAgICBsZXQgaXRlbUZvcm0gPSBlLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm1bZGF0YS1rZXldJyk7XG4gICAgICAgICAgICBsZXQgcG9pbnRlciA9IHsgLy8g0JHQtdGA0ZHQvCDQsNGC0YDQuNCx0YPRgiBpZCDRjdC70LXQvNC10L3RgtCwXG4gICAgICAgICAgICAgICAgaWQ6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS1rZXknKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW1Gb3JtLmdldEF0dHJpYnV0ZSgnZGF0YS10eXBlJykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBuYW1lOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW25hbWVdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB0aXRsZTogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t0aXRsZV1cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHVybDogaXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t1cmxdXCJdJykudmFsdWUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBvbmx5X2F1dGg6IGl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbb25seV9hdXRoXVwiXScpLnZhbHVlIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgdGFyZ2V0X2JsYW5rOiBpdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RhcmdldF9ibGFua11cIl0nKS52YWx1ZSB8fCBudWxsLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGUuY2hpbGRFbGVtZW50Q291bnQpIHsgLy8g0JXRgdC70Lgg0LXRgdGC0Ywg0L/QvtGC0L7QvNC60LhcbiAgICAgICAgICAgICAgICBwb2ludGVyLmNoaWxkcmVuID0gW107IC8vINCh0L7Qt9C00LDRkdC8INGB0LLQvtC50YHRgtCy0L4g0LTQu9GPINC90LjRhVxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20oZS5jaGlsZHJlbikuZm9yRWFjaChpID0+IHsgLy8g0J/QtdGA0LXQsdC40YDQsNC10LwuLi4g0YXQvC4uLiDQtNC10YLQtdC5ICjQv9C+INC60L7RgdGC0L7Rh9C60LDQvCEpXG4gICAgICAgICAgICAgICAgICAgIGlmIChpLm5vZGVOYW1lID09PSBub2RlLnRvVXBwZXJDYXNlKCkpIHsgLy8g0JXRgdC70Lgg0LXRgdGC0Ywg0LXRidGRINC+0LTQuNC9INC60L7QvdGC0LXQudC90LXRgCBVTCwg0L/QtdGA0LXQsdC40YDQsNC10Lwg0LXQs9C+XG4gICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGkuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaChlLCBwb2ludGVyLmNoaWxkcmVuKTsgLy8g0JLRi9C30YvQstCw0LXQvCBwdXNoINC90LAg0L3QvtCy0YvRhSBsaSwg0L3QviDRgdGB0YvQu9C60LAg0L3QsCDQtNGA0LXQstC+INGC0LXQv9C10YDRjCAtINGN0YLQviDQvNCw0YHRgdC40LIgY2hpbGRyZW4g0YPQutCw0LfQsNGC0LXQu9GPXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWYucHVzaChwb2ludGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vINCf0YDQvtGF0L7QtNC40LzRgdGPINC/0L4g0LLRgdC10LwgbGkg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviB1bFxuICAgICAgICBBcnJheS5mcm9tKGxpc3QuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICBwdXNoKGUsIHRyZWUsICdVTCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ganNvbiA/IEpTT04uc3RyaW5naWZ5KHRyZWUpIDogdHJlZTtcbiAgICB9XG5cbiAgICBjb25zdCB0b1dyYXAgPSAoZWxlbSwgd3JhcHBlcikgPT4ge1xuICAgICAgICB3cmFwcGVyID0gd3JhcHBlciB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuICAgICAgICByZXR1cm4gd3JhcHBlci5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGEgc2luZ2xlIGVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtFbGVtZW50fVxuICAgICAqL1xuICAgIGNvbnN0IGh0bWxUb0VsZW1lbnQgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICBodG1sID0gaHRtbC50cmltKCk7IC8vIE5ldmVyIHJldHVybiBhIHRleHQgbm9kZSBvZiB3aGl0ZXNwYWNlIGFzIHRoZSByZXN1bHRcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYW55IG51bWJlciBvZiBzaWJsaW5nIGVsZW1lbnRzXG4gICAgICogQHJldHVybiB7Tm9kZUxpc3R9XG4gICAgICovXG4gICAgY29uc3QgaHRtbFRvRWxlbWVudHMgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUuY29udGVudC5jaGlsZE5vZGVzO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGxUZW1wbGF0ZSA9IChzdHIsIG9iaikgPT4ge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgYmVmb3JlUmVwbGFjZSA9IHN0cjtcbiAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKC97e1xccyooW159XFxzXSspXFxzKn19L2csIGZ1bmN0aW9uKHdob2xlTWF0Y2gsIGtleSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWJzdGl0dXRpb24gPSBvYmpbJC50cmltKGtleSldO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3Vic3RpdHV0aW9uID09PSB1bmRlZmluZWQgPyB3aG9sZU1hdGNoIDogc3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGFmdGVyUmVwbGFjZSA9IHN0ciAhPT0gYmVmb3JlUmVwbGFjZTtcbiAgICAgICAgfSB3aGlsZSAoYWZ0ZXJSZXBsYWNlKTtcblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRDb29yZHMgPSAoZWxlbSkgPT4ge1xuICAgICAgICBsZXQgYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogYm94LnRvcCArIHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgICAgbGVmdDogYm94LmxlZnQgKyBwYWdlWE9mZnNldFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBhZGRNZW51SXRlbSA9IChpdGVtLCBwYXJlbnQgPSBudWxsKSA9PiB7XG4gICAgICAgIGlmIChtZW51SXRlbXMgJiYgaXRlbVRlbXBsYXRlICYmICdjb250ZW50JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpKSB7XG5cbiAgICAgICAgICAgIGlmIChtZW51SXRlbXMuY2xhc3NMaXN0LmNvbnRhaW5zKCduby1pdGVtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmNsYXNzTGlzdC5yZW1vdmUoJ25vLWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBkYXRhID0gaXRlbTtcbiAgICAgICAgICAgIGRhdGEuZm9ybSA9IGZpbGxUZW1wbGF0ZShmb3JtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBmaWxsVGVtcGxhdGUoaXRlbVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcblxuICAgICAgICAgICAgICAgIGxldCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgICAgICBsaXN0LmNsYXNzTGlzdC5hZGQoJ21lbnUtaXRlbXMnKTtcbiAgICAgICAgICAgICAgICBsaXN0LnNldEF0dHJpYnV0ZSgncm9sZScsIFwidGFibGlzdFwiKTtcblxuICAgICAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGh0bWxUb0VsZW1lbnQoY29udGVudCk7XG4gICAgICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgICAgICBsaXN0LmFwcGVuZChsaXN0SXRlbSk7XG5cbiAgICAgICAgICAgICAgICBtZW51SXRlbXMucXVlcnlTZWxlY3RvcignW2RhdGEtaWQ9XCInICsgcGFyZW50ICsgJ1wiXScpLmFwcGVuZChsaXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zLmFwcGVuZChodG1sVG9FbGVtZW50KGNvbnRlbnQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlbGYub25BZGRTdWNjZXNzKGRyYWdPYmplY3QsIG1lbnVJdGVtcyk7XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZi5vbkFkZEZhaWx0dXJlKGRyYWdPYmplY3QsIG1lbnVJdGVtcyk7XG4gICAgfTtcblxuICAgIGlmIChhZGRNZW51SXRlbUZvcm0ubGVuZ3RoKSB7XG4gICAgICAgIGxldCBhZGRCdXR0b24gPSBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignYnV0dG9uW2RhdGEtcmVsPVwiYWRkXCJdJyk7XG4gICAgICAgIGFkZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBjb2xsYXBzZVRvZ2dsZXIgPSBtZW51U291cmNlcy5xdWVyeVNlbGVjdG9yKCcjc291cmNlLWxpbmsgYVtkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJyk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbGxhcHNlVG9nZ2xlcik7XG5cbiAgICAgICAgICAgIGxldCBpdGVtID0ge1xuICAgICAgICAgICAgICAgICdpZCc6IG51bGwsXG4gICAgICAgICAgICAgICAgJ3NvdXJjZSc6IGNvbGxhcHNlVG9nZ2xlci5kYXRhc2V0LnR5cGUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAnc291cmNlX25hbWUnOiBjb2xsYXBzZVRvZ2dsZXIuZGF0YXNldC5uYW1lIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgJ25hbWUnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1tuYW1lXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICd0aXRsZSc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW3RpdGxlXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICd1cmwnOiBhZGRNZW51SXRlbUZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIk1lbnVJdGVtc1t1cmxdXCJdJykudmFsdWUgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgJ29ubHlfYXV0aCc6IGFkZE1lbnVJdGVtRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiTWVudUl0ZW1zW29ubHlfYXV0aF1cIl0nKS52YWx1ZSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAndGFyZ2V0X2JsYW5rJzogYWRkTWVudUl0ZW1Gb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJNZW51SXRlbXNbdGFyZ2V0X2JsYW5rXVwiXScpLnZhbHVlIHx8IGZhbHNlLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGFkZE1lbnVJdGVtKGl0ZW0pKVxuICAgICAgICAgICAgICAgIGFkZE1lbnVJdGVtRm9ybS5yZXNldCgpO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBzb3VyY2VzTGlzdCA9IFsuLi5wYW5lbHNdLmZpbHRlcihwYW5lbCA9PiB7XG4gICAgICAgIGlmIChwYW5lbC5jaGlsZHJlbi5sZW5ndGgpIHtcblxuICAgICAgICAgICAgbGV0IGFkZEJ1dHRvbiA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICAgICAgbGV0IHNlbGVjdEFsbCA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lPVwic2VsZWN0LWFsbFwiXScpO1xuICAgICAgICAgICAgbGV0IGl0ZW1zID0gcGFuZWwucXVlcnlTZWxlY3RvckFsbCgnLnNvdXJjZS1saXN0IGlucHV0W3R5cGU9XCJjaGVja2JveFwiXScpO1xuXG5cbiAgICAgICAgICAgIGlmIChhZGRCdXR0b24gJiYgaXRlbXMpIHtcblxuICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFuZWwucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOmNoZWNrZWQ6bm90KFtuYW1lPVwic2VsZWN0LWFsbFwiXSknKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRCdXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBhZGRCdXR0b24ub25jbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc291cmNlc0l0ZW1zID0gWy4uLml0ZW1zXS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbS5kYXRhc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChjaGVja2JveCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGVjdEFsbCAmJiBpdGVtcykge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFsbC5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5vbmNoYW5nZShldmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICB2YXIgY3JlYXRlRHJvcHBhYmxlID0gKGUpID0+IHtcbiAgICAgICAgbGV0IHRvcCA9IGUuY2xpZW50WSB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgbGV0IGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGxlZnQsIHRvcCk7XG4gICAgICAgIGxldCBkcm9wcGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5hZGQoJ2Ryb3BwYWJsZScpO1xuXG4gICAgICAgIGlmICgoZHJhZ09iamVjdC5hdmF0YXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCAtIGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCkgPj0gKGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoKjAuMSkpXG4gICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG5cbiAgICAgICAgbGV0IGl0ZW1UZXh0ID0gZHJhZ09iamVjdC5hdmF0YXIucXVlcnlTZWxlY3RvcignLnBhbmVsLXRpdGxlIGFbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScpLmRhdGFzZXRbJ25hbWUnXTtcbiAgICAgICAgbGV0IGRyb3BwYWJsZVRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShpdGVtVGV4dC50cmltKCkpO1xuICAgICAgICBkcm9wcGFibGUuYXBwZW5kQ2hpbGQoZHJvcHBhYmxlVGV4dCk7XG5cbiAgICAgICAgZHJvcHBhYmxlLnN0eWxlLndpZHRoID0gZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0V2lkdGggKyAncHgnO1xuICAgICAgICBkcm9wcGFibGUuc3R5bGUuaGVpZ2h0ID0gZHJhZ09iamVjdC5hdmF0YXIub2Zmc2V0SGVpZ2h0ICsgJ3B4JztcblxuICAgICAgICBpZiAoIWRyb3BwYWJsZS5pc0VxdWFsTm9kZShkcmFnT2JqZWN0LmRyb3BwYWJsZSkpIHtcbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyb3BwYWJsZTpub3QoLmRlbGV0ZS1hcmVhKVwiKSk7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZHJhZ09iamVjdC5kcm9wcGFibGUgPSBkcm9wcGFibGU7XG5cbiAgICAgICAgbGV0IHRhcmdldCA9IGVsZW0uY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuXG4gICAgICAgIGlmICh0YXJnZXQgJiYgdHlwZW9mIHRhcmdldCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd0YXJnZXQnLCB0YXJnZXQpO1xuXG4gICAgICAgICAgICByZW1vdmVFbGVtZW50cyhtZW51SXRlbXMucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGlmICh0b3AgPj0gKHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyAodGFyZ2V0Lm9mZnNldEhlaWdodC8xLjUpKSkge1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hZnRlcihkcm9wcGFibGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpXG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWZ0ZXInKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iZWZvcmUoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJykuZmlyc3RDaGlsZC5pc0VxdWFsTm9kZShkcm9wcGFibGUpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2JlZm9yZScpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLndpZHRoID0gZHJvcHBhYmxlLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyb3BwYWJsZS5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjcmVhdGVBdmF0YXIgPSAoZSkgPT4ge1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40YLRjCDRgdGC0LDRgNGL0LUg0YHQstC+0LnRgdGC0LLQsCwg0YfRgtC+0LHRiyDQstC10YDQvdGD0YLRjNGB0Y8g0Log0L3QuNC8INC/0YDQuCDQvtGC0LzQtdC90LUg0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB2YXIgYXZhdGFyID0gZHJhZ09iamVjdC5lbGVtO1xuICAgICAgICB2YXIgb2xkID0ge1xuICAgICAgICAgICAgcGFyZW50OiBhdmF0YXIucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIG5leHRTaWJsaW5nOiBhdmF0YXIubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwb3NpdGlvbjogYXZhdGFyLnBvc2l0aW9uIHx8ICcnLFxuICAgICAgICAgICAgbGVmdDogYXZhdGFyLmxlZnQgfHwgJycsXG4gICAgICAgICAgICB0b3A6IGF2YXRhci50b3AgfHwgJycsXG4gICAgICAgICAgICB6SW5kZXg6IGF2YXRhci56SW5kZXggfHwgJydcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDRhNGD0L3QutGG0LjRjyDQtNC70Y8g0L7RgtC80LXQvdGLINC/0LXRgNC10L3QvtGB0LBcbiAgICAgICAgYXZhdGFyLnJvbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgb2xkLnBhcmVudC5pbnNlcnRCZWZvcmUoYXZhdGFyLCBvbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnBvc2l0aW9uID0gb2xkLnBvc2l0aW9uO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLmxlZnQgPSBvbGQubGVmdDtcbiAgICAgICAgICAgIGF2YXRhci5zdHlsZS50b3AgPSBvbGQudG9wO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnpJbmRleCA9IG9sZC56SW5kZXg7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdEcmFnIGNhbmNlbCwgcm9sbGJhY2snKTtcbiAgICAgICAgICAgIC8qc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhJykuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgICAgICAgICAgfSwgNTAwKTsqL1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBhdmF0YXI7XG4gICAgfVxuICAgIHZhciBzdGFydERyYWcgPSAoZSkgPT4ge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdGFydERyYWcnKTtcblxuICAgICAgICBsZXQgYXZhdGFyID0gZHJhZ09iamVjdC5hdmF0YXI7XG4gICAgICAgIGF2YXRhci5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgLy8g0LjQvdC40YbQuNC40YDQvtCy0LDRgtGMINC90LDRh9Cw0LvQviDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QuYWRkKCdkcmFnLWluJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAgICAgICBsZXQgZGVsZXRlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlLmRlbGV0ZS1hcmVhXCIpO1xuICAgICAgICBpZiAoZGVsZXRlQXJlYSlcbiAgICAgICAgICAgIGRlbGV0ZUFyZWEuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZmluaXNoRHJhZycpO1xuXG4gICAgICAgIGxldCBhdmF0YXIgPSBkcmFnT2JqZWN0LmF2YXRhcjtcbiAgICAgICAgbGV0IGRyb3BFbGVtID0gZmluZERyb3BwYWJsZShlKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgYXZhdGFyLnJvbGxiYWNrKCk7XG5cbiAgICAgICAgYXZhdGFyLnN0eWxlID0gJyc7XG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnLWluJyk7XG5cbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IGRyYWdNZW51LnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcHBhYmxlXCIpO1xuICAgICAgICBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnZGVsZXRlLWFyZWEnKSkge1xuICAgICAgICAgICAgZHJhZ09iamVjdCA9IHt9O1xuICAgICAgICAgICAgYXZhdGFyLnJlbW92ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGRyb3BwYWJsZS5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpIHtcblxuICAgICAgICAgICAgbGV0IGxpc3QgPSBkcm9wcGFibGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKFwidWxcIik7XG4gICAgICAgICAgICBpZiAoIWxpc3QpIHtcbiAgICAgICAgICAgICAgICBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgICAgICAgICBsaXN0LmNsYXNzTGlzdC5hZGQoJ21lbnUtaXRlbXMnKTtcbiAgICAgICAgICAgICAgICBsaXN0LnNldEF0dHJpYnV0ZSgncm9sZScsIFwidGFibGlzdFwiKTtcbiAgICAgICAgICAgICAgICBkcm9wcGFibGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChsaXN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuICAgICAgICAgICAgZHJvcHBhYmxlLnJlcGxhY2VXaXRoKGF2YXRhcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZWxlY3RzIGFsbCA8dWw+IGVsZW1lbnRzLCB0aGVuIGZpbHRlcnMgdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgbGV0IGxpc3RzID0gbWVudUl0ZW1zLnF1ZXJ5U2VsZWN0b3JBbGwoJ3VsJyk7XG4gICAgICAgIC8vIGtlZXAgb25seSB0aG9zZSBlbGVtZW50cyB3aXRoIG5vIGNoaWxkLWVsZW1lbnRzXG4gICAgICAgIGxldCBlbXB0eUxpc3QgPSBbLi4ubGlzdHNdLmZpbHRlcihlbGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChsZXQgZW1wdHkgb2YgZW1wdHlMaXN0KVxuICAgICAgICAgICAgZW1wdHkucmVtb3ZlKCk7XG5cbiAgICAgICAgLy9kcmFnT2JqZWN0LmRhdGEgPSB0cmFuc2Zvcm1EYXRhKG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yKFwiLm1lbnUtaXRlbXNcIikpO1xuICAgICAgICBkcmFnT2JqZWN0LmRhdGEgPSB0cmFuc2Zvcm1EYXRhKG1lbnVJdGVtcyk7XG4gICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtcy5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyb3BwYWJsZTpub3QoLmRlbGV0ZS1hcmVhKVwiKSk7XG5cbiAgICAgICAgbGV0IGRlbGV0ZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRyb3BwYWJsZS5kZWxldGUtYXJlYVwiKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChkZWxldGVBcmVhKVxuICAgICAgICAgICAgICAgIGRlbGV0ZUFyZWEuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIGlmICghZHJvcEVsZW0pXG4gICAgICAgICAgICBzZWxmLm9uRHJhZ0NhbmNlbChkcmFnT2JqZWN0KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2VsZi5vbkRyYWdFbmQoZHJhZ09iamVjdCwgZHJvcEVsZW0pO1xuICAgIH1cbiAgICB2YXIgZmluZERyb3BwYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIC8vINGB0L/RgNGP0YfQtdC8INC/0LXRgNC10L3QvtGB0LjQvNGL0Lkg0Y3Qu9C10LzQtdC90YJcbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gdHJ1ZTtcblxuICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVg7XG5cbiAgICAgICAgLy8g0L/QvtC70YPRh9C40YLRjCDRgdCw0LzRi9C5INCy0LvQvtC20LXQvdC90YvQuSDRjdC70LXQvNC10L3RgiDQv9C+0LQg0LrRg9GA0YHQvtGA0L7QvCDQvNGL0YjQuFxuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcblxuICAgICAgICAvLyDQv9C+0LrQsNC30LDRgtGMINC/0LXRgNC10L3QvtGB0LjQvNGL0Lkg0Y3Qu9C10LzQtdC90YIg0L7QsdGA0LDRgtC90L5cbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGVsZW0gPT0gbnVsbCkgLy8g0YLQsNC60L7QtSDQstC+0LfQvNC+0LbQvdC+LCDQtdGB0LvQuCDQutGD0YDRgdC+0YAg0LzRi9GI0LggXCLQstGL0LvQtdGC0LXQu1wiINC30LAg0LPRgNCw0L3QuNGG0YMg0L7QutC90LBcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIHJldHVybiBlbGVtLmNsb3Nlc3QoJy5kcm9wcGFibGUnKTtcbiAgICB9XG5cblxuICAgIHZhciBvbk1vdXNlRG93biA9IChlKSA9PiB7XG5cbiAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJtb3VzZWRvd25cIiAmJiBlLndoaWNoICE9IDEpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGVsZW0gPSBlLnRhcmdldC5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG4gICAgICAgIGlmICghZWxlbSkgcmV0dXJuO1xuXG4gICAgICAgIGRyYWdPYmplY3QuZWxlbSA9IGVsZW07XG5cbiAgICAgICAgLy8g0LfQsNC/0L7QvNC90LjQvCwg0YfRgtC+INGN0LvQtdC80LXQvdGCINC90LDQttCw0YIg0L3QsCDRgtC10LrRg9GJ0LjRhSDQutC+0L7RgNC00LjQvdCw0YLQsNGFIHBhZ2VYL3BhZ2VZXG4gICAgICAgIGRyYWdPYmplY3QuZG93blggPSBlLnBhZ2VYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgZHJhZ09iamVjdC5kb3duWSA9IGUucGFnZVkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIG9uTW91c2VNb3ZlID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCFkcmFnT2JqZWN0LmVsZW0pIHJldHVybjsgLy8g0Y3Qu9C10LzQtdC90YIg0L3QtSDQt9Cw0LbQsNGCXG5cbiAgICAgICAgaWYgKCFkcmFnT2JqZWN0LmF2YXRhcikgeyAvLyDQtdGB0LvQuCDQv9C10YDQtdC90L7RgSDQvdC1INC90LDRh9Cw0YIuLi5cblxuICAgICAgICAgICAgbGV0IG1vdmVYID0gMDtcbiAgICAgICAgICAgIGxldCBtb3ZlWSA9IDA7XG4gICAgICAgICAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICAgICAgICAgICAgbW92ZVggPSBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVggLSBkcmFnT2JqZWN0LmRvd25YO1xuICAgICAgICAgICAgICAgIG1vdmVZID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZVggPSBlLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUucGFnZVkgLSBkcmFnT2JqZWN0LmRvd25ZO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDQtdGB0LvQuCDQvNGL0YjRjCDQv9C10YDQtdC00LLQuNC90YPQu9Cw0YHRjCDQsiDQvdCw0LbQsNGC0L7QvCDRgdC+0YHRgtC+0Y/QvdC40Lgg0L3QtdC00L7RgdGC0LDRgtC+0YfQvdC+INC00LDQu9C10LrQvlxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKG1vdmVYKSA8IDUgJiYgTWF0aC5hYnMobW92ZVkpIDwgNSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vINC90LDRh9C40L3QsNC10Lwg0L/QtdGA0LXQvdC+0YFcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyID0gY3JlYXRlQXZhdGFyKGUpOyAvLyDRgdC+0LfQtNCw0YLRjCDQsNCy0LDRgtCw0YBcbiAgICAgICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8g0L7RgtC80LXQvdCwINC/0LXRgNC10L3QvtGB0LAsINC90LXQu9GM0LfRjyBcItC30LDRhdCy0LDRgtC40YLRjFwiINC30LAg0Y3RgtGDINGH0LDRgdGC0Ywg0Y3Qu9C10LzQtdC90YLQsFxuICAgICAgICAgICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vINCw0LLQsNGC0LDRgCDRgdC+0LfQtNCw0L0g0YPRgdC/0LXRiNC90L5cbiAgICAgICAgICAgIC8vINGB0L7Qt9C00LDRgtGMINCy0YHQv9C+0LzQvtCz0LDRgtC10LvRjNC90YvQtSDRgdCy0L7QudGB0YLQstCwIHNoaWZ0WC9zaGlmdFlcbiAgICAgICAgICAgIGxldCBjb29yZHMgPSBnZXRDb29yZHMoZHJhZ09iamVjdC5hdmF0YXIpO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFggPSBkcmFnT2JqZWN0LmRvd25YIC0gY29vcmRzLmxlZnQ7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LnNoaWZ0WSA9IGRyYWdPYmplY3QuZG93blkgLSBjb29yZHMudG9wO1xuXG4gICAgICAgICAgICBzdGFydERyYWcoZSk7IC8vINC+0YLQvtCx0YDQsNC30LjRgtGMINC90LDRh9Cw0LvQviDQv9C10YDQtdC90L7RgdCwXG4gICAgICAgIH1cblxuICAgICAgICAvLyDQvtGC0L7QsdGA0LDQt9C40YLRjCDQv9C10YDQtdC90L7RgSDQvtCx0YrQtdC60YLQsCDQv9GA0Lgg0LrQsNC20LTQvtC8INC00LLQuNC20LXQvdC40Lgg0LzRi9GI0LhcbiAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUubGVmdCA9IChlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VYIC0gZHJhZ09iamVjdC5zaGlmdFgpICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLnRvcCA9IChlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZIC0gZHJhZ09iamVjdC5zaGlmdFkpICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH1cblxuICAgICAgICBjcmVhdGVEcm9wcGFibGUoZSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIG9uTW91c2VVcCA9IChlKSA9PiB7XG4gICAgICAgIGlmIChkcmFnT2JqZWN0LmF2YXRhcikgLy8g0LXRgdC70Lgg0L/QtdGA0LXQvdC+0YEg0LjQtNC10YJcbiAgICAgICAgICAgIGZpbmlzaERyYWcoZSk7XG5cbiAgICAgICAgLy8g0L/QtdGA0LXQvdC+0YEg0LvQuNCx0L4g0L3QtSDQvdCw0YfQuNC90LDQu9GB0Y8sINC70LjQsdC+INC30LDQstC10YDRiNC40LvRgdGPXG4gICAgICAgIC8vINCyINC70Y7QsdC+0Lwg0YHQu9GD0YfQsNC1INC+0YfQuNGB0YLQuNC8IFwi0YHQvtGB0YLQvtGP0L3QuNC1INC/0LXRgNC10L3QvtGB0LBcIiBkcmFnT2JqZWN0XG4gICAgICAgIGRyYWdPYmplY3QgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLmdldEl0ZW1zRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtRGF0YShtZW51SXRlbXMpO1xuICAgIH07XG5cbiAgICB0aGlzLmJ1aWxkTWVudUl0ZW1zID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBsZXQgaXRlbXMgPSBbLi4uZGF0YV0uZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50X2lkID0gaXRlbS5wYXJlbnRfaWRcbiAgICAgICAgICAgICAgICBhZGRNZW51SXRlbShpdGVtLCBwYXJlbnRfaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkluaXQgPSBmdW5jdGlvbihtZW51SXRlbXMpIHsgfTtcbiAgICB0aGlzLm9uRHJhZ0VuZCA9IGZ1bmN0aW9uKGRyYWdPYmplY3QsIGRyb3BFbGVtKSB7fTtcbiAgICB0aGlzLm9uRHJhZ0NhbmNlbCA9IGZ1bmN0aW9uKGRyYWdPYmplY3QpIHt9O1xuXG4gICAgdGhpcy5vbkFkZFN1Y2Nlc3MgPSBmdW5jdGlvbihkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHt9O1xuICAgIHRoaXMub25BZGRGYWlsdHVyZSA9IGZ1bmN0aW9uKGRyYWdPYmplY3QsIG1lbnVJdGVtcykge307XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZHJhZ01lbnUgJiYgbWVudUl0ZW1zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZHJhZ01lbnUub25sb2FkJyk7XG4gICAgICAgICAgICBkcmFnTWVudS5vbm1vdXNlZG93biA9IG9uTW91c2VEb3duO1xuICAgICAgICAgICAgZHJhZ01lbnUub250b3VjaHN0YXJ0ID0gb25Nb3VzZURvd247XG4gICAgICAgICAgICBkcmFnTWVudS5vbm1vdXNlbW92ZSA9IG9uTW91c2VNb3ZlO1xuICAgICAgICAgICAgZHJhZ01lbnUub250b3VjaG1vdmUgPSBvbk1vdXNlTW92ZTtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9ubW91c2V1cCA9IG9uTW91c2VVcDtcbiAgICAgICAgICAgIGRyYWdNZW51Lm9udG91Y2hlbmQgPSBvbk1vdXNlVXA7XG4gICAgICAgICAgICBzZWxmLm9uSW5pdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkRyYWdNZW51Lm9uRHJhZ0NhbmNlbCA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0KSB7XG4gICAgaWYgKGRyYWdPYmplY3QuZGF0YSkge1xuICAgICAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgICAgICBmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59O1xuXG5EcmFnTWVudS5vbkRyYWdFbmQgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgZHJvcEVsZW0pIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGxldCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE1lbnVGb3JtJyk7XG4gICAgICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gZHJhZ09iamVjdC5kYXRhO1xuICAgIH1cbn07XG5cbkRyYWdNZW51Lm9uQWRkU3VjY2VzcyA9IGZ1bmN0aW9uIChkcmFnT2JqZWN0LCBtZW51SXRlbXMpIHtcbiAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgIGZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXQjbWVudS1pdGVtcycpLnZhbHVlID0gdGhpcy5nZXRJdGVtc0RhdGEoKTtcbn07XG5cbkRyYWdNZW51Lm9uSW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGRNZW51Rm9ybScpO1xuICAgIGxldCBkYXRhID0gSlNPTi5wYXJzZShmb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0I21lbnUtaXRlbXMnKS52YWx1ZSk7XG4gICAgdGhpcy5idWlsZE1lbnVJdGVtcyhkYXRhKTtcbn07Il19
