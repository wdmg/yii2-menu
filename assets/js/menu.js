var DragMenu = new function() {

    var self = this;
    var dragObject = {};
    var menuItemsList = document.getElementById('menuItems');
    var menuSources = document.getElementById('menuSources');
    var panels = menuSources.querySelectorAll(".panel .panel-body");
    var menuItemsList = document.getElementById('menuItems');
    var formTemplate = document.getElementById('itemFormTemplate');
    var itemTemplate = document.getElementById('menuItemTemplate');

    const removeElements = (elms) => elms.forEach(elem => elem.remove());

    const transformData = (ul, json = true) => {
        let tree = [];

        /**
         * Наполнение дерева значениями
         *
         * @param {HTMLLIElement} e   LI-элемент с data-id
         * @param {Array}         ref Ссылка на дерево, куда добавлять свойства
         */
        function push(e, ref) {

            let pointer = { // Берём атрибут id элемента
                itemId: e.id
            };

            if (e.childElementCount) { // Если есть потомки
                pointer.children = []; // Создаём свойство для них
                Array.from(e.children).forEach(i => { // Перебираем... хм... детей (по косточкам!)
                    if (i.nodeName === 'UL') { // Если есть ещё один контейнер UL, перебираем его
                        Array.from(i.children).forEach(e => {
                            push(e, pointer.children); // Вызываем push на новых li, но ссылка на древо теперь - это массив children указателя
                        });
                    }
                });
            }

            ref.push(pointer);
        }

        // Проходимся по всем li переданного ul
        Array.from(ul.children).forEach(e => {
            push(e, tree);
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
            removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));
            dragObject.droppable = null;
        }
        dragObject.droppable = droppable;

        let target = elem.closest('.draggable');

        if (target && typeof target !== "undefined") {

            //console.log('target', target);

            removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));

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
            deleteArea.hidden = false;

    }
    var finishDrag = (e) => {
        //console.log('finishDrag');

        let avatar = dragObject.avatar;
        let dropElem = findDroppable(e);

        if (!dropElem)
            avatar.rollback();

        avatar.style = '';
        avatar.classList.remove('drag-in');

        let droppable = menuItemsList.querySelector(".droppable");
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
        let lists = menuItemsList.querySelectorAll('ul');
        // keep only those elements with no child-elements
        let emptyList = [...lists].filter(elem => {
            return elem.children.length === 0;
        });

        for (let empty of emptyList)
            empty.remove();

        dragObject.data = transformData(menuItemsList.querySelector(".menu-items"));
        removeElements(menuItemsList.querySelectorAll(".droppable:not(.delete-area)"));

        let deleteArea = document.querySelector(".droppable.delete-area");
        if (deleteArea)
            deleteArea.hidden = true;

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


    menuItemsList.onmousedown = onMouseDown;
    menuItemsList.ontouchstart = onMouseDown;
    menuItemsList.onmousemove = onMouseMove;
    menuItemsList.ontouchmove = onMouseMove;
    menuItemsList.onmouseup = onMouseUp;
    menuItemsList.ontouchend = onMouseUp;

    this.onDragEnd = function(dragObject, dropElem) {};
    this.onDragCancel = function(dragObject) {};

}

DragMenu.onDragCancel = function (dragObject) {
    if (dragObject.data) {
        document.getElementById('menuOptions').innerText = dragObject.data;
    }
};

DragMenu.onDragEnd = function (dragObject, dropElem) {
    if (dragObject.data) {
        document.getElementById('menuOptions').innerText = dragObject.data;
    }
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBEcmFnTWVudSA9IG5ldyBmdW5jdGlvbigpIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZHJhZ09iamVjdCA9IHt9O1xuICAgIHZhciBtZW51SXRlbXNMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtcycpO1xuICAgIHZhciBtZW51U291cmNlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51U291cmNlcycpO1xuICAgIHZhciBwYW5lbHMgPSBtZW51U291cmNlcy5xdWVyeVNlbGVjdG9yQWxsKFwiLnBhbmVsIC5wYW5lbC1ib2R5XCIpO1xuICAgIHZhciBtZW51SXRlbXNMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtcycpO1xuICAgIHZhciBmb3JtVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaXRlbUZvcm1UZW1wbGF0ZScpO1xuICAgIHZhciBpdGVtVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1UZW1wbGF0ZScpO1xuXG4gICAgY29uc3QgcmVtb3ZlRWxlbWVudHMgPSAoZWxtcykgPT4gZWxtcy5mb3JFYWNoKGVsZW0gPT4gZWxlbS5yZW1vdmUoKSk7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1EYXRhID0gKHVsLCBqc29uID0gdHJ1ZSkgPT4ge1xuICAgICAgICBsZXQgdHJlZSA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDQndCw0L/QvtC70L3QtdC90LjQtSDQtNC10YDQtdCy0LAg0LfQvdCw0YfQtdC90LjRj9C80LhcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtIVE1MTElFbGVtZW50fSBlICAgTEkt0Y3Qu9C10LzQtdC90YIg0YEgZGF0YS1pZFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSAgICAgICAgIHJlZiDQodGB0YvQu9C60LAg0L3QsCDQtNC10YDQtdCy0L4sINC60YPQtNCwINC00L7QsdCw0LLQu9GP0YLRjCDRgdCy0L7QudGB0YLQstCwXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBwdXNoKGUsIHJlZikge1xuXG4gICAgICAgICAgICBsZXQgcG9pbnRlciA9IHsgLy8g0JHQtdGA0ZHQvCDQsNGC0YDQuNCx0YPRgiBpZCDRjdC70LXQvNC10L3RgtCwXG4gICAgICAgICAgICAgICAgaXRlbUlkOiBlLmlkXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZS5jaGlsZEVsZW1lbnRDb3VudCkgeyAvLyDQldGB0LvQuCDQtdGB0YLRjCDQv9C+0YLQvtC80LrQuFxuICAgICAgICAgICAgICAgIHBvaW50ZXIuY2hpbGRyZW4gPSBbXTsgLy8g0KHQvtC30LTQsNGR0Lwg0YHQstC+0LnRgdGC0LLQviDQtNC70Y8g0L3QuNGFXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShlLmNoaWxkcmVuKS5mb3JFYWNoKGkgPT4geyAvLyDQn9C10YDQtdCx0LjRgNCw0LXQvC4uLiDRhdC8Li4uINC00LXRgtC10LkgKNC/0L4g0LrQvtGB0YLQvtGH0LrQsNC8ISlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkubm9kZU5hbWUgPT09ICdVTCcpIHsgLy8g0JXRgdC70Lgg0LXRgdGC0Ywg0LXRidGRINC+0LTQuNC9INC60L7QvdGC0LXQudC90LXRgCBVTCwg0L/QtdGA0LXQsdC40YDQsNC10Lwg0LXQs9C+XG4gICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKGkuY2hpbGRyZW4pLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaChlLCBwb2ludGVyLmNoaWxkcmVuKTsgLy8g0JLRi9C30YvQstCw0LXQvCBwdXNoINC90LAg0L3QvtCy0YvRhSBsaSwg0L3QviDRgdGB0YvQu9C60LAg0L3QsCDQtNGA0LXQstC+INGC0LXQv9C10YDRjCAtINGN0YLQviDQvNCw0YHRgdC40LIgY2hpbGRyZW4g0YPQutCw0LfQsNGC0LXQu9GPXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWYucHVzaChwb2ludGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vINCf0YDQvtGF0L7QtNC40LzRgdGPINC/0L4g0LLRgdC10LwgbGkg0L/QtdGA0LXQtNCw0L3QvdC+0LPQviB1bFxuICAgICAgICBBcnJheS5mcm9tKHVsLmNoaWxkcmVuKS5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgcHVzaChlLCB0cmVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGpzb24gPyBKU09OLnN0cmluZ2lmeSh0cmVlKSA6IHRyZWU7XG4gICAgfVxuXG4gICAgY29uc3QgdG9XcmFwID0gKGVsZW0sIHdyYXBwZXIpID0+IHtcbiAgICAgICAgd3JhcHBlciA9IHdyYXBwZXIgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBIVE1MIHJlcHJlc2VudGluZyBhIHNpbmdsZSBlbGVtZW50XG4gICAgICogQHJldHVybiB7RWxlbWVudH1cbiAgICAgKi9cbiAgICBjb25zdCBodG1sVG9FbGVtZW50ID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgaHRtbCA9IGh0bWwudHJpbSgpOyAvLyBOZXZlciByZXR1cm4gYSB0ZXh0IG5vZGUgb2Ygd2hpdGVzcGFjZSBhcyB0aGUgcmVzdWx0XG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5jb250ZW50LmZpcnN0Q2hpbGQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IEhUTUwgcmVwcmVzZW50aW5nIGFueSBudW1iZXIgb2Ygc2libGluZyBlbGVtZW50c1xuICAgICAqIEByZXR1cm4ge05vZGVMaXN0fVxuICAgICAqL1xuICAgIGNvbnN0IGh0bWxUb0VsZW1lbnRzID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuY2hpbGROb2RlcztcbiAgICB9XG5cbiAgICBjb25zdCBmaWxsVGVtcGxhdGUgPSAoc3RyLCBvYmopID0+IHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIGJlZm9yZVJlcGxhY2UgPSBzdHI7XG4gICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgve3tcXHMqKFtefVxcc10rKVxccyp9fS9nLCBmdW5jdGlvbih3aG9sZU1hdGNoLCBrZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3Vic3RpdHV0aW9uID0gb2JqWyQudHJpbShrZXkpXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1YnN0aXR1dGlvbiA9PT0gdW5kZWZpbmVkID8gd2hvbGVNYXRjaCA6IHN1YnN0aXR1dGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBhZnRlclJlcGxhY2UgPSBzdHIgIT09IGJlZm9yZVJlcGxhY2U7XG4gICAgICAgIH0gd2hpbGUgKGFmdGVyUmVwbGFjZSk7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9O1xuXG4gICAgY29uc3QgZ2V0Q29vcmRzID0gKGVsZW0pID0+IHtcbiAgICAgICAgbGV0IGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IGJveC50b3AgKyBwYWdlWU9mZnNldCxcbiAgICAgICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgcGFnZVhPZmZzZXRcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgXG4gICAgdmFyIHNvdXJjZXNMaXN0ID0gWy4uLnBhbmVsc10uZmlsdGVyKGVsZW0gPT4ge1xuICAgICAgICBpZiAoZWxlbS5jaGlsZHJlbi5sZW5ndGgpIHtcblxuICAgICAgICAgICAgbGV0IGl0ZW1zID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCcuc291cmNlLWxpc3QgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJyk7XG4gICAgICAgICAgICBsZXQgYWRkQnV0dG9uID0gZWxlbS5xdWVyeVNlbGVjdG9yKCdidXR0b25bZGF0YS1yZWw9XCJhZGRcIl0nKTtcbiAgICAgICAgICAgIGlmIChhZGRCdXR0b24gJiYgaXRlbXMpIHtcbiAgICAgICAgICAgICAgICBhZGRCdXR0b24ub25jbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc291cmNlc0l0ZW1zID0gWy4uLml0ZW1zXS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkTWVudUl0ZW0oaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzZWxlY3RBbGwgPSBlbGVtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lPVwic2VsZWN0LWFsbFwiXScpO1xuICAgICAgICAgICAgaWYgKHNlbGVjdEFsbCAmJiBpdGVtcykge1xuICAgICAgICAgICAgICAgIHNlbGVjdEFsbC5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGNoZWNrYm94ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBhZGRNZW51SXRlbSA9IChpdGVtKSA9PiB7XG4gICAgICAgIGlmIChtZW51SXRlbXNMaXN0ICYmIGl0ZW1UZW1wbGF0ZSAmJiAnY29udGVudCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKSkge1xuXG4gICAgICAgICAgICBpZiAobWVudUl0ZW1zTGlzdC5jbGFzc0xpc3QuY29udGFpbnMoJ25vLWl0ZW1zJykpIHtcbiAgICAgICAgICAgICAgICBtZW51SXRlbXNMaXN0LmNsYXNzTGlzdC5yZW1vdmUoJ25vLWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZGF0YSA9IGl0ZW0uZGF0YXNldDtcbiAgICAgICAgICAgIGRhdGEuZm9ybSA9IGZpbGxUZW1wbGF0ZShmb3JtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBmaWxsVGVtcGxhdGUoaXRlbVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG4gICAgICAgICAgICBtZW51SXRlbXNMaXN0LmFwcGVuZChodG1sVG9FbGVtZW50KGNvbnRlbnQpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgdmFyIGNyZWF0ZURyb3BwYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIGxldCB0b3AgPSBlLmNsaWVudFkgfHwgZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICBsZXQgbGVmdCA9IGUuY2xpZW50WCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChsZWZ0LCB0b3ApO1xuICAgICAgICBsZXQgZHJvcHBhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdkcm9wcGFibGUnKTtcblxuICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgZHJvcHBhYmxlLmNsYXNzTGlzdC5hZGQoJ3N1Yi1pdGVtJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdzdWItaXRlbScpO1xuXG4gICAgICAgIGxldCBpdGVtVGV4dCA9IGRyYWdPYmplY3QuYXZhdGFyLnF1ZXJ5U2VsZWN0b3IoJy5wYW5lbC10aXRsZSBhW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nKS5kYXRhc2V0WyduYW1lJ107XG4gICAgICAgIGxldCBkcm9wcGFibGVUZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaXRlbVRleHQudHJpbSgpKTtcbiAgICAgICAgZHJvcHBhYmxlLmFwcGVuZENoaWxkKGRyb3BwYWJsZVRleHQpO1xuXG4gICAgICAgIGRyb3BwYWJsZS5zdHlsZS53aWR0aCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgZHJvcHBhYmxlLnN0eWxlLmhlaWdodCA9IGRyYWdPYmplY3QuYXZhdGFyLm9mZnNldEhlaWdodCArICdweCc7XG5cbiAgICAgICAgaWYgKCFkcm9wcGFibGUuaXNFcXVhbE5vZGUoZHJhZ09iamVjdC5kcm9wcGFibGUpKSB7XG4gICAgICAgICAgICByZW1vdmVFbGVtZW50cyhtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuZHJvcHBhYmxlOm5vdCguZGVsZXRlLWFyZWEpXCIpKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuZHJvcHBhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnT2JqZWN0LmRyb3BwYWJsZSA9IGRyb3BwYWJsZTtcblxuICAgICAgICBsZXQgdGFyZ2V0ID0gZWxlbS5jbG9zZXN0KCcuZHJhZ2dhYmxlJyk7XG5cbiAgICAgICAgaWYgKHRhcmdldCAmJiB0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3RhcmdldCcsIHRhcmdldCk7XG5cbiAgICAgICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIGlmICh0b3AgPj0gKHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyAodGFyZ2V0Lm9mZnNldEhlaWdodC8xLjUpKSkge1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hZnRlcihkcm9wcGFibGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3N1Yi1pdGVtJykpXG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5jbGFzc0xpc3QuYWRkKCdzdWItaXRlbScpO1xuXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWZ0ZXInKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCAodGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICh0YXJnZXQub2Zmc2V0SGVpZ2h0LzEuNSkpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoKGRyYWdPYmplY3QuYXZhdGFyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpID49IChkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCowLjEpKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucXVlcnlTZWxlY3RvcignLmNvbGxhcHNlJykuYWZ0ZXIoZHJvcHBhYmxlKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iZWZvcmUoZHJvcHBhYmxlKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1zJykuZmlyc3RDaGlsZC5pc0VxdWFsTm9kZShkcm9wcGFibGUpKVxuICAgICAgICAgICAgICAgICAgICBkcm9wcGFibGUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLWl0ZW0nKTtcblxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItaXRlbScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2JlZm9yZScpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLndpZHRoID0gZHJvcHBhYmxlLm9mZnNldFdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmhlaWdodCA9IGRyb3BwYWJsZS5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjcmVhdGVBdmF0YXIgPSAoZSkgPT4ge1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40YLRjCDRgdGC0LDRgNGL0LUg0YHQstC+0LnRgdGC0LLQsCwg0YfRgtC+0LHRiyDQstC10YDQvdGD0YLRjNGB0Y8g0Log0L3QuNC8INC/0YDQuCDQvtGC0LzQtdC90LUg0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB2YXIgYXZhdGFyID0gZHJhZ09iamVjdC5lbGVtO1xuICAgICAgICB2YXIgb2xkID0ge1xuICAgICAgICAgICAgcGFyZW50OiBhdmF0YXIucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIG5leHRTaWJsaW5nOiBhdmF0YXIubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwb3NpdGlvbjogYXZhdGFyLnBvc2l0aW9uIHx8ICcnLFxuICAgICAgICAgICAgbGVmdDogYXZhdGFyLmxlZnQgfHwgJycsXG4gICAgICAgICAgICB0b3A6IGF2YXRhci50b3AgfHwgJycsXG4gICAgICAgICAgICB6SW5kZXg6IGF2YXRhci56SW5kZXggfHwgJydcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDRhNGD0L3QutGG0LjRjyDQtNC70Y8g0L7RgtC80LXQvdGLINC/0LXRgNC10L3QvtGB0LBcbiAgICAgICAgYXZhdGFyLnJvbGxiYWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgb2xkLnBhcmVudC5pbnNlcnRCZWZvcmUoYXZhdGFyLCBvbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnBvc2l0aW9uID0gb2xkLnBvc2l0aW9uO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLmxlZnQgPSBvbGQubGVmdDtcbiAgICAgICAgICAgIGF2YXRhci5zdHlsZS50b3AgPSBvbGQudG9wO1xuICAgICAgICAgICAgYXZhdGFyLnN0eWxlLnpJbmRleCA9IG9sZC56SW5kZXg7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdEcmFnIGNhbmNlbCwgcm9sbGJhY2snKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYXZhdGFyO1xuICAgIH1cbiAgICB2YXIgc3RhcnREcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3RhcnREcmFnJyk7XG5cbiAgICAgICAgbGV0IGF2YXRhciA9IGRyYWdPYmplY3QuYXZhdGFyO1xuICAgICAgICBhdmF0YXIuc3R5bGUud2lkdGggPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRXaWR0aCArICdweCc7XG4gICAgICAgIGF2YXRhci5zdHlsZS5oZWlnaHQgPSBkcmFnT2JqZWN0LmF2YXRhci5vZmZzZXRIZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIC8vINC40L3QuNGG0LjQuNGA0L7QstCw0YLRjCDQvdCw0YfQsNC70L4g0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LmFkZCgnZHJhZy1pbicpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGF2YXRhcik7XG5cbiAgICAgICAgbGV0IGRlbGV0ZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRyb3BwYWJsZS5kZWxldGUtYXJlYVwiKTtcbiAgICAgICAgaWYgKGRlbGV0ZUFyZWEpXG4gICAgICAgICAgICBkZWxldGVBcmVhLmhpZGRlbiA9IGZhbHNlO1xuXG4gICAgfVxuICAgIHZhciBmaW5pc2hEcmFnID0gKGUpID0+IHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZmluaXNoRHJhZycpO1xuXG4gICAgICAgIGxldCBhdmF0YXIgPSBkcmFnT2JqZWN0LmF2YXRhcjtcbiAgICAgICAgbGV0IGRyb3BFbGVtID0gZmluZERyb3BwYWJsZShlKTtcblxuICAgICAgICBpZiAoIWRyb3BFbGVtKVxuICAgICAgICAgICAgYXZhdGFyLnJvbGxiYWNrKCk7XG5cbiAgICAgICAgYXZhdGFyLnN0eWxlID0gJyc7XG4gICAgICAgIGF2YXRhci5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnLWluJyk7XG5cbiAgICAgICAgbGV0IGRyb3BwYWJsZSA9IG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGVcIik7XG4gICAgICAgIGlmIChkcm9wcGFibGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdkZWxldGUtYXJlYScpKSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICBhdmF0YXIucmVtb3ZlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJvcHBhYmxlLmNsYXNzTGlzdC5jb250YWlucygnc3ViLWl0ZW0nKSkge1xuXG4gICAgICAgICAgICBsZXQgbGlzdCA9IGRyb3BwYWJsZS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoXCJ1bFwiKTtcbiAgICAgICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgICAgICAgIGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICAgICAgICAgIGxpc3QuY2xhc3NMaXN0LmFkZCgnbWVudS1pdGVtcycpO1xuICAgICAgICAgICAgICAgIGxpc3Quc2V0QXR0cmlidXRlKCdyb2xlJywgXCJ0YWJsaXN0XCIpO1xuICAgICAgICAgICAgICAgIGRyb3BwYWJsZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGxpc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdmF0YXIuY2xhc3NMaXN0LmFkZCgnc3ViLWl0ZW0nKTtcbiAgICAgICAgICAgIGRyb3BwYWJsZS5yZXBsYWNlV2l0aChhdmF0YXIpO1xuICAgICAgICAgICAgbGlzdC5hcHBlbmRDaGlsZChhdmF0YXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXZhdGFyLmNsYXNzTGlzdC5yZW1vdmUoJ3N1Yi1pdGVtJyk7XG4gICAgICAgICAgICBkcm9wcGFibGUucmVwbGFjZVdpdGgoYXZhdGFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNlbGVjdHMgYWxsIDx1bD4gZWxlbWVudHMsIHRoZW4gZmlsdGVycyB0aGUgY29sbGVjdGlvblxuICAgICAgICBsZXQgbGlzdHMgPSBtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3VsJyk7XG4gICAgICAgIC8vIGtlZXAgb25seSB0aG9zZSBlbGVtZW50cyB3aXRoIG5vIGNoaWxkLWVsZW1lbnRzXG4gICAgICAgIGxldCBlbXB0eUxpc3QgPSBbLi4ubGlzdHNdLmZpbHRlcihlbGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChsZXQgZW1wdHkgb2YgZW1wdHlMaXN0KVxuICAgICAgICAgICAgZW1wdHkucmVtb3ZlKCk7XG5cbiAgICAgICAgZHJhZ09iamVjdC5kYXRhID0gdHJhbnNmb3JtRGF0YShtZW51SXRlbXNMaXN0LnF1ZXJ5U2VsZWN0b3IoXCIubWVudS1pdGVtc1wiKSk7XG4gICAgICAgIHJlbW92ZUVsZW1lbnRzKG1lbnVJdGVtc0xpc3QucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wcGFibGU6bm90KC5kZWxldGUtYXJlYSlcIikpO1xuXG4gICAgICAgIGxldCBkZWxldGVBcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kcm9wcGFibGUuZGVsZXRlLWFyZWFcIik7XG4gICAgICAgIGlmIChkZWxldGVBcmVhKVxuICAgICAgICAgICAgZGVsZXRlQXJlYS5oaWRkZW4gPSB0cnVlO1xuXG4gICAgICAgIGlmICghZHJvcEVsZW0pXG4gICAgICAgICAgICBzZWxmLm9uRHJhZ0NhbmNlbChkcmFnT2JqZWN0KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2VsZi5vbkRyYWdFbmQoZHJhZ09iamVjdCwgZHJvcEVsZW0pO1xuICAgIH1cbiAgICB2YXIgZmluZERyb3BwYWJsZSA9IChlKSA9PiB7XG4gICAgICAgIC8vINGB0L/RgNGP0YfQtdC8INC/0LXRgNC10L3QvtGB0LjQvNGL0Lkg0Y3Qu9C10LzQtdC90YJcbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gdHJ1ZTtcblxuICAgICAgICBsZXQgdG9wID0gZS5jbGllbnRZIHx8IGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIGxldCBsZWZ0ID0gZS5jbGllbnRYIHx8IGUuY2hhbmdlZFRvdWNoZXNbMF0ucGFnZVg7XG5cbiAgICAgICAgLy8g0L/QvtC70YPRh9C40YLRjCDRgdCw0LzRi9C5INCy0LvQvtC20LXQvdC90YvQuSDRjdC70LXQvNC10L3RgiDQv9C+0LQg0LrRg9GA0YHQvtGA0L7QvCDQvNGL0YjQuFxuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQobGVmdCwgdG9wKTtcblxuICAgICAgICAvLyDQv9C+0LrQsNC30LDRgtGMINC/0LXRgNC10L3QvtGB0LjQvNGL0Lkg0Y3Qu9C10LzQtdC90YIg0L7QsdGA0LDRgtC90L5cbiAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuaGlkZGVuID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGVsZW0gPT0gbnVsbCkgLy8g0YLQsNC60L7QtSDQstC+0LfQvNC+0LbQvdC+LCDQtdGB0LvQuCDQutGD0YDRgdC+0YAg0LzRi9GI0LggXCLQstGL0LvQtdGC0LXQu1wiINC30LAg0LPRgNCw0L3QuNGG0YMg0L7QutC90LBcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIHJldHVybiBlbGVtLmNsb3Nlc3QoJy5kcm9wcGFibGUnKTtcbiAgICB9XG5cbiAgICBcbiAgICB2YXIgb25Nb3VzZURvd24gPSAoZSkgPT4ge1xuXG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwibW91c2Vkb3duXCIgJiYgZS53aGljaCAhPSAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBlbGVtID0gZS50YXJnZXQuY2xvc2VzdCgnLmRyYWdnYWJsZScpO1xuICAgICAgICBpZiAoIWVsZW0pIHJldHVybjtcblxuICAgICAgICBkcmFnT2JqZWN0LmVsZW0gPSBlbGVtO1xuXG4gICAgICAgIC8vINC30LDQv9C+0LzQvdC40LwsINGH0YLQviDRjdC70LXQvNC10L3RgiDQvdCw0LbQsNGCINC90LAg0YLQtdC60YPRidC40YUg0LrQvtC+0YDQtNC40L3QsNGC0LDRhSBwYWdlWC9wYWdlWVxuICAgICAgICBkcmFnT2JqZWN0LmRvd25YID0gZS5wYWdlWCB8fCBlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIGRyYWdPYmplY3QuZG93blkgPSBlLnBhZ2VZIHx8IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlTW92ZSA9IChlKSA9PiB7XG4gICAgICAgIGlmICghZHJhZ09iamVjdC5lbGVtKSByZXR1cm47IC8vINGN0LvQtdC80LXQvdGCINC90LUg0LfQsNC20LDRglxuXG4gICAgICAgIGlmICghZHJhZ09iamVjdC5hdmF0YXIpIHsgLy8g0LXRgdC70Lgg0L/QtdGA0LXQvdC+0YEg0L3QtSDQvdCw0YfQsNGCLi4uXG5cbiAgICAgICAgICAgIGxldCBtb3ZlWCA9IDA7XG4gICAgICAgICAgICBsZXQgbW92ZVkgPSAwO1xuICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VYIC0gZHJhZ09iamVjdC5kb3duWDtcbiAgICAgICAgICAgICAgICBtb3ZlWSA9IGUudGFyZ2V0VG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3QuZG93blk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVYID0gZS5wYWdlWCAtIGRyYWdPYmplY3QuZG93blg7XG4gICAgICAgICAgICAgICAgbW92ZVkgPSBlLnBhZ2VZIC0gZHJhZ09iamVjdC5kb3duWTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g0LXRgdC70Lgg0LzRi9GI0Ywg0L/QtdGA0LXQtNCy0LjQvdGD0LvQsNGB0Ywg0LIg0L3QsNC20LDRgtC+0Lwg0YHQvtGB0YLQvtGP0L3QuNC4INC90LXQtNC+0YHRgtCw0YLQvtGH0L3QviDQtNCw0LvQtdC60L5cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhtb3ZlWCkgPCA1ICYmIE1hdGguYWJzKG1vdmVZKSA8IDUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyDQvdCw0YfQuNC90LDQtdC8INC/0LXRgNC10L3QvtGBXG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhciA9IGNyZWF0ZUF2YXRhcihlKTsgLy8g0YHQvtC30LTQsNGC0Ywg0LDQstCw0YLQsNGAXG4gICAgICAgICAgICBpZiAoIWRyYWdPYmplY3QuYXZhdGFyKSB7IC8vINC+0YLQvNC10L3QsCDQv9C10YDQtdC90L7RgdCwLCDQvdC10LvRjNC30Y8gXCLQt9Cw0YXQstCw0YLQuNGC0YxcIiDQt9CwINGN0YLRgyDRh9Cw0YHRgtGMINGN0LvQtdC80LXQvdGC0LBcbiAgICAgICAgICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDQsNCy0LDRgtCw0YAg0YHQvtC30LTQsNC9INGD0YHQv9C10YjQvdC+XG4gICAgICAgICAgICAvLyDRgdC+0LfQtNCw0YLRjCDQstGB0L/QvtC80L7Qs9Cw0YLQtdC70YzQvdGL0LUg0YHQstC+0LnRgdGC0LLQsCBzaGlmdFgvc2hpZnRZXG4gICAgICAgICAgICBsZXQgY29vcmRzID0gZ2V0Q29vcmRzKGRyYWdPYmplY3QuYXZhdGFyKTtcbiAgICAgICAgICAgIGRyYWdPYmplY3Quc2hpZnRYID0gZHJhZ09iamVjdC5kb3duWCAtIGNvb3Jkcy5sZWZ0O1xuICAgICAgICAgICAgZHJhZ09iamVjdC5zaGlmdFkgPSBkcmFnT2JqZWN0LmRvd25ZIC0gY29vcmRzLnRvcDtcblxuICAgICAgICAgICAgc3RhcnREcmFnKGUpOyAvLyDQvtGC0L7QsdGA0LDQt9C40YLRjCDQvdCw0YfQsNC70L4g0L/QtdGA0LXQvdC+0YHQsFxuICAgICAgICB9XG5cbiAgICAgICAgLy8g0L7RgtC+0LHRgNCw0LfQuNGC0Ywg0L/QtdGA0LXQvdC+0YEg0L7QsdGK0LXQutGC0LAg0L/RgNC4INC60LDQttC00L7QvCDQtNCy0LjQttC10L3QuNC4INC80YvRiNC4XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgICAgICAgIGRyYWdPYmplY3QuYXZhdGFyLnN0eWxlLmxlZnQgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCAtIGRyYWdPYmplY3Quc2hpZnRYKSArICdweCc7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS50b3AgPSAoZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSAtIGRyYWdPYmplY3Quc2hpZnRZKSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcmFnT2JqZWN0LmF2YXRhci5zdHlsZS5sZWZ0ID0gKGUucGFnZVggLSBkcmFnT2JqZWN0LnNoaWZ0WCkgKyAncHgnO1xuICAgICAgICAgICAgZHJhZ09iamVjdC5hdmF0YXIuc3R5bGUudG9wID0gKGUucGFnZVkgLSBkcmFnT2JqZWN0LnNoaWZ0WSkgKyAncHgnO1xuICAgICAgICB9XG5cbiAgICAgICAgY3JlYXRlRHJvcHBhYmxlKGUpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBvbk1vdXNlVXAgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoZHJhZ09iamVjdC5hdmF0YXIpIC8vINC10YHQu9C4INC/0LXRgNC10L3QvtGBINC40LTQtdGCXG4gICAgICAgICAgICBmaW5pc2hEcmFnKGUpO1xuXG4gICAgICAgIC8vINC/0LXRgNC10L3QvtGBINC70LjQsdC+INC90LUg0L3QsNGH0LjQvdCw0LvRgdGPLCDQu9C40LHQviDQt9Cw0LLQtdGA0YjQuNC70YHRj1xuICAgICAgICAvLyDQsiDQu9GO0LHQvtC8INGB0LvRg9GH0LDQtSDQvtGH0LjRgdGC0LjQvCBcItGB0L7RgdGC0L7Rj9C90LjQtSDQv9C10YDQtdC90L7RgdCwXCIgZHJhZ09iamVjdFxuICAgICAgICBkcmFnT2JqZWN0ID0ge307XG4gICAgfVxuXG5cbiAgICBtZW51SXRlbXNMaXN0Lm9ubW91c2Vkb3duID0gb25Nb3VzZURvd247XG4gICAgbWVudUl0ZW1zTGlzdC5vbnRvdWNoc3RhcnQgPSBvbk1vdXNlRG93bjtcbiAgICBtZW51SXRlbXNMaXN0Lm9ubW91c2Vtb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgbWVudUl0ZW1zTGlzdC5vbnRvdWNobW92ZSA9IG9uTW91c2VNb3ZlO1xuICAgIG1lbnVJdGVtc0xpc3Qub25tb3VzZXVwID0gb25Nb3VzZVVwO1xuICAgIG1lbnVJdGVtc0xpc3Qub250b3VjaGVuZCA9IG9uTW91c2VVcDtcblxuICAgIHRoaXMub25EcmFnRW5kID0gZnVuY3Rpb24oZHJhZ09iamVjdCwgZHJvcEVsZW0pIHt9O1xuICAgIHRoaXMub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24oZHJhZ09iamVjdCkge307XG5cbn1cblxuRHJhZ01lbnUub25EcmFnQ2FuY2VsID0gZnVuY3Rpb24gKGRyYWdPYmplY3QpIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51T3B0aW9ucycpLmlubmVyVGV4dCA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59O1xuXG5EcmFnTWVudS5vbkRyYWdFbmQgPSBmdW5jdGlvbiAoZHJhZ09iamVjdCwgZHJvcEVsZW0pIHtcbiAgICBpZiAoZHJhZ09iamVjdC5kYXRhKSB7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51T3B0aW9ucycpLmlubmVyVGV4dCA9IGRyYWdPYmplY3QuZGF0YTtcbiAgICB9XG59OyJdfQ==
