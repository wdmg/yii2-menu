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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1lbnUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBEcmFnTWVudSA9IG5ldyBmdW5jdGlvbigpIHtcbiAgICB2YXIgbWVudVNvdXJjZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudVNvdXJjZXMnKTtcbiAgICB2YXIgcGFuZWxzID0gbWVudVNvdXJjZXMucXVlcnlTZWxlY3RvckFsbChcIi5wYW5lbCAucGFuZWwtYm9keVwiKTtcbiAgICB2YXIgc291cmNlc0xpc3QgPSBbLi4ucGFuZWxzXS5maWx0ZXIoZWxlbSA9PiB7XG4gICAgICAgIGlmIChlbGVtLmNoaWxkcmVuLmxlbmd0aCkge1xuXG4gICAgICAgICAgICBsZXQgaXRlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zb3VyY2UtbGlzdCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKTtcbiAgICAgICAgICAgIGxldCBhZGRCdXR0b24gPSBlbGVtLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbltkYXRhLXJlbD1cImFkZFwiXScpO1xuICAgICAgICAgICAgaWYgKGFkZEJ1dHRvbiAmJiBpdGVtcykge1xuICAgICAgICAgICAgICAgIGFkZEJ1dHRvbi5vbmNsaWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzb3VyY2VzSXRlbXMgPSBbLi4uaXRlbXNdLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRNZW51SXRlbShpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChjaGVja2JveCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNlbGVjdEFsbCA9IGVsZW0ucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdW25hbWU9XCJzZWxlY3QtYWxsXCJdJyk7XG4gICAgICAgICAgICBpZiAoc2VsZWN0QWxsICYmIGl0ZW1zKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0QWxsLm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChjaGVja2JveCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goY2hlY2tib3ggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYSBzaW5nbGUgZWxlbWVudFxuICAgICAqIEByZXR1cm4ge0VsZW1lbnR9XG4gICAgICovXG4gICAgdmFyIGh0bWxUb0VsZW1lbnQgPSAoaHRtbCkgPT4ge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICBodG1sID0gaHRtbC50cmltKCk7IC8vIE5ldmVyIHJldHVybiBhIHRleHQgbm9kZSBvZiB3aGl0ZXNwYWNlIGFzIHRoZSByZXN1bHRcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gSFRNTCByZXByZXNlbnRpbmcgYW55IG51bWJlciBvZiBzaWJsaW5nIGVsZW1lbnRzXG4gICAgICogQHJldHVybiB7Tm9kZUxpc3R9XG4gICAgICovXG4gICAgdmFyIGh0bWxUb0VsZW1lbnRzID0gKGh0bWwpID0+IHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuY2hpbGROb2RlcztcbiAgICB9XG5cbiAgICB2YXIgZmlsbFRlbXBsYXRlID0gKHN0ciwgb2JqKSA9PiB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciBiZWZvcmVSZXBsYWNlID0gc3RyO1xuICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL3t7XFxzKihbXn1cXHNdKylcXHMqfX0vZywgZnVuY3Rpb24od2hvbGVNYXRjaCwga2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YnN0aXR1dGlvbiA9IG9ialskLnRyaW0oa2V5KV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWJzdGl0dXRpb24gPT09IHVuZGVmaW5lZCA/IHdob2xlTWF0Y2ggOiBzdWJzdGl0dXRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgYWZ0ZXJSZXBsYWNlID0gc3RyICE9PSBiZWZvcmVSZXBsYWNlO1xuICAgICAgICB9IHdoaWxlIChhZnRlclJlcGxhY2UpO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIHZhciBtZW51SXRlbXNMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnVJdGVtcycpO1xuICAgIHZhciBmb3JtVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaXRlbUZvcm1UZW1wbGF0ZScpO1xuICAgIHZhciBpdGVtVGVtcGxhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudUl0ZW1UZW1wbGF0ZScpO1xuICAgIHZhciBhZGRNZW51SXRlbSA9IChpdGVtKSA9PiB7XG4gICAgICAgIGlmIChtZW51SXRlbXNMaXN0ICYmIGl0ZW1UZW1wbGF0ZSAmJiAnY29udGVudCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKSkge1xuXG4gICAgICAgICAgICBpZiAobWVudUl0ZW1zTGlzdC5jbGFzc0xpc3QuY29udGFpbnMoJ25vLWl0ZW1zJykpIHtcbiAgICAgICAgICAgICAgICBtZW51SXRlbXNMaXN0LmNsYXNzTGlzdC5yZW1vdmUoJ25vLWl0ZW1zJyk7XG4gICAgICAgICAgICAgICAgbWVudUl0ZW1zTGlzdC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZGF0YSA9IGl0ZW0uZGF0YXNldDtcbiAgICAgICAgICAgIGRhdGEuZm9ybSA9IGZpbGxUZW1wbGF0ZShmb3JtVGVtcGxhdGUuaW5uZXJIVE1MLCBkYXRhKTtcblxuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBmaWxsVGVtcGxhdGUoaXRlbVRlbXBsYXRlLmlubmVySFRNTCwgZGF0YSk7XG4gICAgICAgICAgICBtZW51SXRlbXNMaXN0LmFwcGVuZChodG1sVG9FbGVtZW50KGNvbnRlbnQpKTtcbiAgICAgICAgfVxuICAgIH07XG59Il19
