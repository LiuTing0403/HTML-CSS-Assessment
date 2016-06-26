var Todo_list = function(){
  this.todos = [];
  this.todo_due_month = {};
  this.completed_due_month = {};
  this.init = function(){
    this.getStorage();
    this.getDueMonthData();
    this.last_id = this.getLastId();
  };
};
Todo_list.prototype.getLastId = function(){
  var id = 0;
  this.todos.forEach(function(item){
    id = item.id > id ? +item.id : id;
  });
  return id;
}
Todo_list.prototype.addNewToDoItem = function(item){
  item.id = this.last_id + 1;
  this.last_id += 1;
  this.todos.unshift(item);
  this.getDueMonthData();
};
Todo_list.prototype.deleteToDoItemById = function(id){

  this.todos = this.todos.filter(function(obj){
    if (obj.id === id) { 
      return false; 
    }
    else { return true; }
  });
  this.getDueMonthData();
  
};
Todo_list.prototype.updateToDoItem = function(item){
  var id = item.id;
  this.deleteToDoItemById(id);
  this.todos.unshift(item);
  this.getDueMonthData();
};
Todo_list.prototype.findItemById = function(id){
  var result;

  this.todos.forEach(function(obj){
    if (obj.id === +id){
      result = obj;
      return false;
    }
  });
  return result;
};
Todo_list.prototype.markCompletedById = function(id){
  this.todos.forEach(function(obj){
    if (obj.id === +id){
      obj.completed = true;
      return false;
    }
  });
  this.getDueMonthData();
};

Todo_list.prototype.getStorage = function(){
  this.todos = (function(){
    var local = localStorage.getItem("todos");
    if (local) { return JSON.parse(local); }
    return [];
  })();
};
Todo_list.prototype.setStorage = function(){
  localStorage.setItem("todos", JSON.stringify(this.todos));
}

Todo_list.prototype.getDueMonthData = function(){
  var completed_due_month = {};
  var todo_due_month = {};
  this.todos.forEach(function(item){
    
    if (item.completed === true) {
      if (completed_due_month[item.due_month]) { completed_due_month[item.due_month] += 1; }
      else { completed_due_month[item.due_month] = 1; }
    }
    else {
      if (todo_due_month[item.due_month]) { todo_due_month[item.due_month] += 1; }
      else { todo_due_month[item.due_month] = 1; }
    }
  });

  return { completed_due_month: completed_due_month, todo_due_month: todo_due_month; }
};
Todo_list.prototype.getToDoItemsByDueMonth = function(due_month){
  var result;
  result = this.todos.filter(function(item){
    if (due_month === "all") {
      return true;
    }
    else if (item.completed === false && item.due_month === due_month) {
      return true;
    }
    else {
      return false;
    }
  });

  return result;
};
Todo_list.prototype.getCompletedItemsByDueMonth = function(due_month){
  var result;
  result = this.todos.filter(function(item){
    if (due_month === "all_completed" && item.completed === true){
      return true;
    }
    else if (item.completed === true && item.due_month === due_month){
      return true;
    }
    else {
      return false;
    }
  });
  return result;
};

var View = function(todo_list){
  this.todo_list = todo_list;
  this.$nav = $("nav");
  this.$todos = $("#todos");
  this.$popup = $("#popup");
  this.$todo_list = this.$todos.find("#todo_list");
  this.$all_todos_nav = this.$nav.find("#all_todos");
  this.$completed_nav = this.$nav.find("#completed");
  this.$form = this.$popup.find("form");
  this.$templates = this.getTemplates();
  this.currentSelection = {
    due_month: "all",
    completed: false
  };
};
View.prototype.getTemplates = function(){
  var $templates = {};
  $("[type='text/x-handlebars-template']").each(function(idx, el){
    var source = $(el).html();
    var $template = Handlebars.compile(source);
    $templates[el.id] = $template;
  });
  return $templates;
};
View.prototype.renderPage = function(obj){
  var selectedItem;
  var completed = this.currentSelection.completed;
  var due_month = this.currentSelection.due_month;

  if (completed === false) { selectedItem = obj.getToDoItemsByDueMonth(due_month); }
  else { selectedItem = obj.getCompletedItemsByDueMonth(due_month); }

  this.updateToDoListHeader({due_month:due_month, count:selectedItem.length, uncompleted:!completed})  
  this.renderToDoNav(obj.todo_due_month);
  this.renderCompletedNav(obj.completed_due_month);
  this.renderToDoList(selectedItem);
};

View.prototype.renderToDoNav = function(obj){
  var keys = Object.keys(obj);
  var arr = [];
  var $nav_header = this.$all_todos_nav.find(".list_header");
  var $prevSelection = this.$nav.find(".selected");
  $nav_header.find("span").text(this.getAllToDosCount(obj));
  this.$all_todos_nav.empty();
  this.$all_todos_nav.append($nav_header);
  keys.forEach(function(key){
    var item = {
      key: key,
      display_name: key,
      count: obj[key]
    };
    if (key === "no_due"){
      item.display_name = "No Due Date";
    }
    arr.push(item);
  });
  
  arr.sort(this.sortByTime);
  this.$all_todos_nav.append(this.$templates.nav_todo_item_template({item:arr}));
  if (this.currentSelection.completed === false) {
    $prevSelection.removeClass("selected");
    this.$all_todos_nav.find("[id='" + this.currentSelection.due_month + "']").closest("li").addClass("selected");
  }
};
View.prototype.renderCompletedNav = function(obj){
  var keys = Object.keys(obj);
  var arr = [];
  var $nav_header = this.$completed_nav.find(".list_header");
  var $prevSelection = this.$nav.find(".selected");
  this.$completed_nav.empty();
  this.$completed_nav.append($nav_header);
  keys.forEach(function(key){
    var item = {
      key: key,
      display_name: key
    };
    if (key === "no_due"){
      item.display_name = "No Due Date";
    }
    arr.push(item);
  });
  arr.sort(this.sortByTime);
  
  this.$completed_nav.append(this.$templates.nav_completed_item_template({item:arr}));
  if (this.currentSelection.completed === true) {
    $prevSelection.removeClass("selected");
    this.$completed_nav.find("[id='" + this.currentSelection.due_month + "']").closest("li").addClass("selected");
  }
};
View.prototype.renderToDoList = function(arr){
  var $todos = this.$todos;
  var $templates = this.$templates;
  this.$todos.find("ul").empty();


  arr.forEach(function(item){
    if (item.completed === true) {
      $todos.find("#completed_list").append($templates.todo_item_template(item));
    }
    else {
      $todos.find("#todo_list").append($templates.todo_item_template(item));
    }
  });
};
View.prototype.addNewInput = function(){
  var $new_item = this.$templates.add_todo_item_template();
  this.$todos.find("#todo_list").prepend($new_item);
};
View.prototype.sortByTime = function(a, b){
  var year_a = +a.key.slice(-2);
  var year_b = +b.key.slice(-2);
  var month_a = +a.key.slice(0,2);
  var month_b = +b.key.slice(0,2);
  if ( isNaN(year_a) || year_a < year_b || (year_a === year_b && month_a < month_b)) { return -1; }
  else { return 1; }
};
View.prototype.getAllToDosCount = function(obj){
  var total = 0;
  for (var prop in obj) {
    total += obj[prop];
  }
  return total;
};
View.prototype.updateToDoListHeader = function(obj){
  if (obj.due_month === "no_due"){
    obj.due_month = "No Due Date";
  }
  else if (obj.due_month === "all"){
    obj.due_month = "All";
  }
  else if (obj.due_month === "all_completed"){
    obj.due_month = "All Completed";
  }
  this.$todos.find("h3").remove();
  this.$todos.prepend(this.$templates.todos_header_template(obj));

  if (obj.due_month === "All") { this.$todos.find("#add").show(); }
  else { this.$todos.find("#add").hide(); }
};
View.prototype.selectItem = function(item){
  this.currentSelection = item;
}


var Controller = function(){
  this.todo_list = new Todo_list();
  this.view = new View();
  this.init = function(){
    this.bindEvents();
    this.todo_list.init();
    this.view.renderPage(this.todo_list);
  };
};

Controller.prototype.addNewItem = function(e){
  var $e = $(e.target);
  var item = { 
    title: $e.val(), 
    completed: false,
    due_month: "no_due"
  };  
  this.todo_list.addNewToDoItem(item);
  this.view.renderPage(this.todo_list);
};
Controller.prototype.deleteItem = function(e){
  e.preventDefault();
  var $e = $(e.target);
  var id = $e.data().id;
  this.todo_list.deleteToDoItemById(id);
  this.view.renderPage(this.todo_list);
};

Controller.prototype.popupItem = function(e){
  if (e.target.checked){
    var $e = $(e.target);
    var id = +$e.data().id;
    var item = this.todo_list.findItemById(id);
    var $f = this.view.$form;
    this.view.$popup.show();
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
};
Controller.prototype.updateItem = function(e){
  e.preventDefault();
  var $f = this.view.$form;
  var data = $f.serializeArray();
  var id = +$f.find("input:hidden").val();
  var $el = this.view.$todos.find("#item_" + id);

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
  $el.find("p").text(due_date_string);
  item.due_date = due_date_string;
  item.completed = false;

  due_month = this.getDueMonth({ year: item.year, month: item.month});
  item.due_month = due_month;

  this.todo_list.updateToDoItem(item);
  $f.get(0).reset();
  this.view.$popup.hide();
  $el.find(":checkbox").prop("checked", false);
  this.view.renderPage(this.todo_list);
};
Controller.prototype.markCompleted = function(){
  var $f = this.view.$form;
  var id = +$f.find("input:hidden").val();

  $f.get(0).reset();
  this.view.$popup.hide();
  this.todo_list.markCompletedById(id);

  this.view.renderPage(this.todo_list);
};
Controller.prototype.addNewInput = function(e){
  e.preventDefault();
  this.view.addNewInput();
};
Controller.prototype.didSelectedNav = function(e){
  e.preventDefault();
  var $e = $(e.target);
  var due_month = $e.attr("id");
  var completed = (function(){
    if ($e.closest("ul").attr("id") === "all_todos") { return false; }
    else { return true; }
  })();
  var selectedItem;
  var selectedToDoList = this.todo_list;

  this.view.currentSelection = { due_month: due_month, completed: completed }
  this.view.renderPage(this.todo_list);
};
Controller.prototype.clearPupup = function(){
  this.view.$popup.hide();
  this.view.$todos.find(":checkbox").prop("checked", false);
};
Controller.prototype.saveToLocalStorage = function(){
  this.todo_list.setStorage();
};

Controller.prototype.getDueMonth = function(time){
  var year = time.year.slice(-2);
  var month = time.month < 10 ? "0" + time.month : time.month;
  return month + "/" + year;
};
Controller.prototype.bindEvents = function(){
  this.view.$todos.on("click", "button", $.proxy(this.deleteItem, this));
  this.view.$todos.find("ul").on("change", "input[type='checkbox']", $.proxy(this.popupItem, this));
  this.view.$todos.on("blur", "input[type='text']", $.proxy(this.addNewItem, this));
  this.view.$form.on("submit", $.proxy(this.updateItem, this));
  this.view.$popup.find("#mark_completed").on("click", $.proxy(this.markCompleted, this));
  this.view.$todos.find("#add").on("click", $.proxy(this.addNewInput, this));
  this.view.$nav.on("click", "a", $.proxy(this.didSelectedNav, this));
  this.view.$popup.find("#black_blur").on("click", $.proxy(this.clearPupup, this));
  $(window).on("click", $.proxy(this.saveToLocalStorage, this));
  
};
$(function(){
  var controller = new Controller();
  controller.init();
});




