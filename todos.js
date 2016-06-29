var todo_list = (function(){
  var todos = [];
  var last_id = 0;
  var currentSelection = { due_month: "all", completed: false };
  return {
    due_month_data: function(){
      var completed_due_month = {};
      var todo_due_month = {};
      todos.forEach(function(item){
        if (item.completed === true) {
          if (completed_due_month[item.due_month]) { completed_due_month[item.due_month] += 1; }
          else { completed_due_month[item.due_month] = 1; }
        }
        else {
          if (todo_due_month[item.due_month]) { todo_due_month[item.due_month] += 1; }
          else { todo_due_month[item.due_month] = 1; }
        }
      });
      return { completed_due_month: completed_due_month, todo_due_month: todo_due_month };
    },
    getTodos: function(){
      return todos;
    },
    getAllTodosCount: function(){
      var total = 0;
      var todo_due_month = this.due_month_data().todo_due_month;
      for (var prop in todo_due_month) {
        total += todo_due_month[prop];
      }
      return total;
    },
    getStorage: function(){
      todos = (function(){
        var local = localStorage.getItem("todos");
        if (local) { return JSON.parse(local); }
        return [];
      })();
    },
    setStorage: function(){
      localStorage.setItem("todos", JSON.stringify(todos));
    },
    getLastId: function(){
      var id = 0;
      if (todos.length === 0){ return 0; }
      todos.forEach(function(item){
        id = item.id > id ? +item.id : id;
      });
      return id;
    },
    setCurrentSelection: function(obj){
      currentSelection.due_month = obj.due_month;
      currentSelection.completed = obj.completed;
    },
    getCurrentSelection: function(){
      return currentSelection;
    },
    prepareToDoNavToDisplay: function(){
      var arr = [];
      var due_month_obj = this.due_month_data().todo_due_month || {};
      var keys = Object.keys(due_month_obj);
      var that = this;
      keys.forEach(function(key){
        var item = {
          due_month: key,
          display_name: that.trasferToDisplayName(key),
          count: due_month_obj[key],
          selected: (function(){
            if (currentSelection.completed === false && currentSelection.due_month === key) { return true; }
            return false;
          })()
        };
        arr.push(item);
        
      });
      arr.sort(this.sortByTime);
      return arr;
    },
    prepareCompletedNavToDisplay: function(){
      var arr = [];
      var due_month_obj = this.due_month_data().completed_due_month || {};
      var keys = Object.keys(due_month_obj);
      var that = this;
      keys.forEach(function(key){
        var item = {
          due_month: key,
          display_name: that.trasferToDisplayName(key),
          count: due_month_obj[key],
          selected: (function(){
            if (currentSelection.completed === true && currentSelection.due_month === key) { return true; }
            return false;
          })()
        };
        arr.push(item);
        
      });
      arr.sort(this.sortByTime);
      return arr;
    },
    trasferToDisplayName: function(key){
      if (key === "all") { return "All Todo List"; }
      if (key === "all_completed") { return "Completed"; }
      if (key === "no_due") { return "No Due Date"; }
      return key; 
    },
    sortByTime: function(a, b){
      var year_a = +a.due_month.slice(-2);
      var year_b = +b.due_month.slice(-2);
      var month_a = +a.due_month.slice(0,2);
      var month_b = +b.due_month.slice(0,2);
      if ( isNaN(year_a) || year_a < year_b || (year_a === year_b && month_a < month_b)) { return -1; }
      else { return 1; }
    },
    addNewToDoItem: function(item){
      item.id = last_id + 1;
      last_id += 1;
      todos.unshift(item);
    },
    deleteToDoItemById: function(id){
      todos = todos.filter(function(obj){
        if (obj.id === id) { 
          return false; 
        }
        else { return true; }
      });
    },
    updateToDoItem: function(item){
      var id = item.id;
      this.deleteToDoItemById(id);
      todos.unshift(item);
    },
    findItemById: function(id){
      var result;
      todos.forEach(function(obj){
        if (obj.id === +id){
          result = obj;
          return false;
        }
      });
      return result;
    },
    markCompletedById: function(id){
      todos.forEach(function(obj){
        if (obj.id === +id){
          obj.completed = true;
          return false;
        }
      });
    },
    getToDoItemsByDueMonth: function(due_month){
      var result;
      result = todos.filter(function(item){
        if (due_month === "all") { return true; }
        else if (item.completed === false && item.due_month === due_month) { return true; }
        else { return false; }
      });
      return result;
    },
    getCompletedItemsByDueMonth: function(due_month){
      var result;
      result = todos.filter(function(item){
        if (due_month === "all_completed" && item.completed === true){ return true; }
        else if (item.completed === true && item.due_month === due_month){ return true;}
        else {return false;}
      });
      return result;
    },
    
    appData: function(){
      var selectedItems;
      var currentSelectionCount = 0;
      var completed = currentSelection.completed;
      var due_month = currentSelection.due_month;
      if (completed === false) { selectedItems = this.getToDoItemsByDueMonth(due_month); }
      else { selectedItems = this.getCompletedItemsByDueMonth(due_month); }
      if ( currentSelection.due_month === "all") { currentSelectionCount = this.getAllTodosCount(); }
      else { currentSelectionCount = selectedItems.length; }
      return {
        nav: {
          allAreSelected: currentSelection.due_month === "all",
          allCompletedAreSelected: currentSelection.due_month === "all_completed",
          total: this.getAllTodosCount(),
          todo_nav: this.prepareToDoNavToDisplay(),
          completed_nav: this.prepareCompletedNavToDisplay()
        },
        currentSelection: { 
          due_month: this.trasferToDisplayName(currentSelection.due_month), 
          count: currentSelectionCount, 
          completed: currentSelection.completed
        },
        content: selectedItems
      };
    },
    init: function(){
      this.getStorage();
      last_id = this.getLastId();
    }
  };
})();

function View(){
  var view = {
    getTemplates: function(){
      var $templates = {};
      $("[type='text/x-handlebars-template']").each(function(idx, el){
        var source = $(el).html();
        var $template = Handlebars.compile(source);
        $templates[el.id] = $template;
      });
      return $templates;
    },
    createNewInput: function(){
      var $new_item = this.$templates.add_todo_item_template();
      return $new_item;
    },
    renderPage: function(app_data){
      $("main").empty();
      $("main").append(this.$templates.page_template(app_data));
    },
    init: function(){ 
      this.$templates = this.getTemplates();
    }
  };
  return view;
}


function Controller(){
  var controller = {
    todo_list: todo_list,
    view: Object.create(View()),
    addNewItem: function(e){
      var $e = $(e.target);
      var item = { 
        title: $e.val(), 
        completed: false,
        due_month: "no_due"
      };  
      this.todo_list.addNewToDoItem(item);
      this.updatePage();
    },
    deleteItem: function(e){
      e.preventDefault();
      var $e = $(e.target);
      var id = $e.data().id;
      this.todo_list.deleteToDoItemById(id);
      this.updatePage();
    },
    popupItem: function(e){
      if (e.target.checked){
        var $e = $(e.target);
        var id = +$e.data().id;
        var item = this.todo_list.findItemById(id);
        var $popup = $("#popup");
        var $f = $popup.find("form");
        $popup.show();
        $f.find("#title").val(item.title);
        $f.find("#day").val(item.day);
        $f.find("#month").val(item.month);
        $f.find("#year").val(item.year);
        $f.find("#description").val(item.description);
        $f.find("input:hidden").val(id);
        if ($e.closest("ul").attr("id") === "completed_list") {
          $f.find("button").prop("disabled", true);
        }
        else { $f.find("button").prop("disabled", false); }
      }
    },
    updateItem: function(e){
      e.preventDefault();
      var $f = $("form");
      var data = $f.serializeArray();
      var item = {};
      var due_date;
      var due_month;
      var due_date_string;
      data.forEach(function(obj){
        item[obj.name] = obj.value;
        if (obj.name === "id") { item.id = +obj.value; }
      }); 

      due_date = new Date(+item.year, item.month - 1, +item.day);
      due_date_string = due_date.toLocaleDateString();
      item.due_date = due_date_string;
      item.completed = false;

      due_month = this.getDueMonth({ year: item.year, month: item.month});
      item.due_month = due_month;

      this.todo_list.updateToDoItem(item);
      $f.get(0).reset();
      $("#popup").hide();
      this.updatePage();
    },
    markCompleted: function(){
      var $f = $("form");
      var id = +$f.find("input:hidden").val();
      $f.get(0).reset();
      $("#popup").hide();
      this.todo_list.markCompletedById(id);
      this.updatePage();
    },
    addNewInput: function(e){
      e.preventDefault();
      var $new_item = this.view.createNewInput();
      $("#todos").find("#todo_list").prepend($new_item);
    },
    didSelectedNav: function(e){
      e.preventDefault();
      var $e = $(e.target);
      var due_month = $e.attr("id");
      var completed = (function(){
        if ($e.closest("ul").attr("id") === "all_todos") { return false; }
        else { return true; }
      })();
      this.todo_list.setCurrentSelection({ due_month: due_month, completed: completed });
      this.updatePage();
    },
    clearPupup: function(){
      $("#popup").hide();
      $("#todos").find(":checkbox").prop("checked", false);
    },
    saveToLocalStorage: function(){
      this.todo_list.setStorage();
    },
    getDueMonth: function(time){
      var year = time.year.slice(-2);
      var month = time.month < 10 ? "0" + time.month : time.month;
      return month + "/" + year;
    },
    updatePage: function(){
      this.view.renderPage(this.todo_list.appData());
      this.bindEvents();
    },
    bindEvents: function(){
      var $todos = $("#todos");
      var $popup = $("#popup");
      var $nav = $("nav");
      $todos.on("click", "button", $.proxy(this.deleteItem, this));
      $todos.find("ul").on("change", "input[type='checkbox']", $.proxy(this.popupItem, this));
      $todos.on("blur", "input[type='text']", $.proxy(this.addNewItem, this));
      $todos.find("#add").on("click", $.proxy(this.addNewInput, this));
      $nav.on("click", "a", $.proxy(this.didSelectedNav, this));
      $popup.find("#black_blur").on("click", $.proxy(this.clearPupup, this));
    },
    init: function(){
      this.view.init();
      this.todo_list.init();
      this.updatePage();
      return this;
    },
  };
  return controller;
}
$(function(){
  var controller = Object.create(Controller());
  controller.init();
  $("form").on("submit", $.proxy(controller.updateItem, controller));
  $("#popup").find("#mark_completed").on("click", $.proxy(controller.markCompleted, controller));
  $(window).on("unload", $.proxy(controller.saveToLocalStorage, controller));
});




