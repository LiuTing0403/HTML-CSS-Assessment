$(function(){
  var $nav = $("nav");
  var $todos = $("#todos");
  var $popup = $("#popup");
  var $todo_list = $todos.find("#todo_list");
  var $all_todos_nav = $nav.find("#all_todos");
  var $completed_nav = $nav.find("#completed");
  var todos = (function(){
    var local = localStorage.getItem("todos");
    if (local) { return JSON.parse(local); }
    return [];
  })();

  var todo_due_time = (function(){
    var local = localStorage.getItem("todo_due_time");
    if (local) { return JSON.parse(local); }
    return { };
  })();
  var completed_due_time = (function(){
    var local = localStorage.getItem("completed_due_time");
    if (local) { return JSON.parse(local); }
    return { };
  })();

  var last_id = +localStorage.getItem("last_id") || 0;
  var all_todos_count = +localStorage.getItem("all_todos_count") || 0;
  var currentNav = "all";
  var $templates = {};


  //get all templates
  $("[type='text/x-handlebars-template']").each(function(idx, el){
    var source = $(el).html();
    var $template = Handlebars.compile(source);
    $templates[el.id] = $template;
  });

  var todo_list = {
    addNewItem: function(e){
      var $e = $(e.target);
      var item = { 
        title: $e.val(), 
        id: last_id,
        completed: false,
        due_month: "no_due"
      };
      last_id += 1;
      todos.unshift(item);
      
      $e.parent("li").remove();
      $todo_list.prepend($templates.todo_item_template(item));

      this.addToDoDueMonth("no_due");
      this.displayNav();
    },
    deleteItem: function(e){
      e.preventDefault();

      var $e = $(e.target);
      var id = $e.data().id;
      var completed = todos[this.findItemIndexByID(id)].completed;
      var due_month = todos[this.findItemIndexByID(id)].due_month;


      $todos.find("#item_" + id).remove();
      todos = todos.filter(function(obj){
        if (obj.id === id) { return false; }
        else { return true; }
      });

      if (completed === true) { this.deleteCompleteDueMonth(due_month); } 
      else { this.deleteToDoDueMonth(due_month); }
      this.displayNav();
    },

    findItemIndexByID: function(id){
      var result;

      todos.forEach(function(obj, i){
        if (obj.id === +id){
          result = i;
          return false;
        }
      });
      return result;
    },
    compareDueDate: function(a, b){
      var year_a = +a.slice(-2);
      var year_b = +b.slice(-2);
      var month_a = +a.slice(0,2);
      var month_b = +b.slice(0,2);
      if ( isNaN(year_a) || year_a < year_b || (year_a === year_b && month_a < month_b)) { return -1; }
      else { return 1; }
    },

    displayItem: function(items){
      items.forEach(function(obj){
        if (obj.completed === true) {
          $todos.find("#completed_list").append($templates.todo_item_template(obj));
        }
        else {
          $todos.find("#todo_list").append($templates.todo_item_template(obj));
        }
      });
    },
    displayNav: function(){
      var todo_keys = Object.keys(todo_due_time);
      var completed_keys = Object.keys(completed_due_time);

      
      var $todo_header = $all_todos_nav.find("li").eq(0);
      var $completed_header = $completed_nav.find("li").eq(0);
      var $currentSelection = $nav.find(".selected").find("a");
      var selectedClass = $currentSelection.attr("class");
      var selectedId = currentNav;
      
      todo_keys = todo_keys.sort(this.compareDueDate);
      completed_keys = completed_keys.sort(this.compareDueDate);
      $all_todos_nav.empty();
      $completed_nav.empty();
      $all_todos_nav.append($todo_header);
      $completed_nav.append($completed_header);

      todo_keys.forEach(this.displayToDoNavItem);
      completed_keys.forEach(this.displayCompletedNavItem);

      $all_todos_nav.find("span").eq(0).text(all_todos_count);
      $nav.find("." + selectedClass).filter("[id='" + selectedId + "']").closest("li").addClass("selected");
      if ($nav.find(".selected").length === 0) { $all_todos_nav.find(".list_header").find("a").trigger("click"); return; }
      $todos.find("#date").html($nav.find(".selected").find("a").html());  
    },
    displayToDoNavItem: function(item) {
      var count = todo_due_time[item];
      var html = "<li><a href='#'' class='todo' id='" + item + "''>" + item + "<span class='tag'>" + count + "</span></a></li>";
      if (item === "no_due") {
        html = "<li><a href='#'' class='todo' id='no_due'>No Due Date<span class='tag'>" + count + "</span></a></li>";
      }
      $all_todos_nav.append(html);
    },
    displayCompletedNavItem: function(item) {
      var html = "<li><a href='#'' class='completed' id='" + item + "''>" + item + "</a></li>";
      if (item === "no_due") {
        html = "<li><a href='#'' class='completed' id='no_due'>No Due Date</a></li>";
      }
      $completed_nav.append(html);
    },
    

    popupItem: function(e) {
      if (e.target.checked){
        var $e = $(e.target);
        var id = +$e.data().id;
        var idx = this.findItemIndexByID(id);
        var item = todos[idx];
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
      var $f = $popup.find("form");
      var data = $f.serializeArray();
      var id = +$f.find("input:hidden").val();
      var idx = this.findItemIndexByID(id);
      var $el = $todos.find("#item_" + id);

      var item;
      var due_date;
      var due_month;
      var prev_due_month;
      var due_date_string;

      data.forEach(function(obj){
        todos[idx][obj.name] = obj.value;
        if (obj.name === "id") { todos[idx].id = +obj.value; }
      }); 
      item = todos[idx];

      
      due_date = new Date(+item.year, item.month - 1, +item.day);
      due_date_string = due_date.toLocaleDateString();
      $el.find("p").text(due_date_string);
      todos[idx].due_date = due_date_string;

      prev_due_month = item.due_month;
      due_month = this.getDueMonth({ year: item.year, month: item.month});
      this.addToDoDueMonth(due_month);
      this.deleteToDoDueMonth(prev_due_month);
      this.displayNav();
      if (currentNav != "all" && currentNav != due_month) { $el.hide(); }

      todos[idx].due_month = due_month;
      $el.attr("data-due", due_month);
      $f.get(0).reset();
      $popup.hide();
      $el.find("label").html("<input type='checkbox' data-id='" + id + "'>" + item.title);
    },

    getDueMonth: function(time){
      var year = time.year.slice(-2);
      var month = time.month < 10 ? "0" + time.month : time.month;
      return month + "/" + year;
    },
    addToDoDueMonth: function(due_month){
      all_todos_count += 1;
      todo_due_time[due_month] =  todo_due_time[due_month] + 1 || 1;
    },
    addCompleteDueMonth: function(due_month) {
      completed_due_time[due_month] = completed_due_time[due_month] + 1 ||  1;
    },
    deleteToDoDueMonth: function(due_month) {
      all_todos_count -= 1;
      todo_due_time[due_month] -=  1;
      if (todo_due_time[due_month] === 0) { delete todo_due_time[due_month]; }
    },
    deleteCompleteDueMonth: function(due_month) {
      completed_due_time[due_month] -=  1;
      if (completed_due_time[due_month] === 0) { delete completed_due_time[due_month]; }
    },

    markCompleted: function(){
      var $f = $popup.find("form");
      var id = +$f.find("input:hidden").val();
      var idx = this.findItemIndexByID(id);
      var $el = $todos.find("#item_" + id);
      var due_month = todos[idx].due_month;

      $f.get(0).reset();
      $popup.hide();
      $el.remove();
      $el.find(":checkbox").prop("checked", false);
      $todos.find("#completed_list").prepend($el);

      if (currentNav !== "all") { $el.hide(); }
      todos[idx].completed = true;

      this.addCompleteDueMonth(due_month);
      this.deleteToDoDueMonth(due_month);
      this.displayNav();
    },
    bindEvent: function(){
      $todos.on("click", "button", $.proxy(this.deleteItem, this));
      $todos.find("ul").on("change", "input[type='checkbox']", $.proxy(this.popupItem, this));
      $todos.on("blur", "input[type='text']", $.proxy(this.addNewItem, this));
      $popup.find("form").on("submit", $.proxy(this.updateItem, this));
      $popup.find("#mark_completed").on("click", $.proxy(this.markCompleted, this));
    },
    init: function(){
      this.displayItem(todos);
      this.displayNav();
      this.bindEvent();
    }
  };
  $todos.find("#add").on("click", function(e) {
    e.preventDefault();
    var $new_item = $templates.add_todo_item_template();
    $todos.find("#todo_list").prepend($new_item);
  });

  $nav.on("click", "a", function(e){
    e.preventDefault();

    var $e = $(e.target);
    var $a = $e.closest("li").find("a");
    var $add = $todos.find("#add");
    var due_month = $e.attr("id");
    var class_name = $e.attr("class");

    if (class_name === "todo" && due_month === "all") { 
      $todos.find("li").show();
      $add.show();
    }
    else {
      $add.hide();
      $todos.find("li").hide();
      if (class_name === "todo") { $("#todo_list").find("[data-due='" + due_month + "']").show(); }
      else if ( due_month === "all_completed" ) { $("#completed_list").find("li").show(); }
      else { $("#completed_list").find("[data-due='" + due_month + "']").show(); }
    }

    $todos.find("#date").html($a.html());  
    $nav.find(".selected").removeClass("selected");
    $e.closest("li").addClass("selected");

    currentNav = due_month;
  });
  $("#black_blur").on("click", function(){
    $popup.hide();
    $todos.find(":checkbox").prop("checked", false);
  });
  $(window).on("unload", function(){
    localStorage.setItem("todos", JSON.stringify(todos));
    localStorage.setItem("last_id", last_id);
    localStorage.setItem("todo_due_time", JSON.stringify(todo_due_time));
    localStorage.setItem("completed_due_time", JSON.stringify(completed_due_time));
    localStorage.setItem("all_todos_count", all_todos_count);
  });
  todo_list.init();
});


