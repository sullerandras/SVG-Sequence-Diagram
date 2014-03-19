angular.module('myApp').controller('AppController',
['$scope', '$window', 'rnd', 'default_definition', 'post_script_functions',
function(scope, $window, rnd, default_definition, post_script_functions){
  scope.margin = 10
  scope.user_width = 100
  scope.user_height = 50
  scope.note_width = 100
  scope.note_height = 30
  scope.height = 0
  scope.width = 0
  scope.lines = []
  scope.users = []
  scope.arrows = []
  scope.notes = []
  scope.wantHandDraw = false
  scope.paperSizes = {
    A0: {width: 2384, height: 3370},
    A1: {width: 1684, height: 2384},
    A2: {width: 1191, height: 1684},
    A3: {width:  842, height: 1191},
    A4: {width:  595, height: 842},
  }
  scope.pageSizes = Object.keys(scope.paperSizes)
  scope.pageSize = 'A4'
  scope.definition = default_definition
  scope.$watch('definition', function(){
    scope.draw()
  })
  scope.log = function(data){
    console && console.log && console.log(data)
    return data
  }
  scope.Math = Math
  scope.download = function(text) {
    $window.location.href =
      'data:application/x-download;charset=utf-8,' +
      encodeURIComponent(text)
  }
  scope.draw = function(){
    scope.height = scope.user_height + scope.margin
    scope.width = -100
    scope.users = []
    scope.lines = []
    scope.arrows = []
    scope.notes = []
    var lines = scope.definition.split('\n')
    for (var i in lines) {
      var line = lines[i].trim()
      if (/^([^-]*(-+[^-]+)*)(-->|->)(.*):(.*)$/.exec(line) != null) {
        var from = RegExp.$1.trim()
        var arrow = RegExp.$3.trim()
        var to = RegExp.$4.trim()
        var text = RegExp.$5.trim()
        // console.log(line+' => from: '+from+', to: '+to+', text: '+text)
        var ufrom = scope.getUser(from)
        var uto = scope.getUser(to)
        scope.arrows.push({
          x: ufrom.x + scope.user_width / 2,
          y: scope.height + scope.user_height / 2,
          length: Math.abs(ufrom.x - uto.x),
          direction: uto.x > ufrom.x ? 1 : -1,
          text: text,
          dashed: (arrow == '-->')
        })
        scope.height += 50
      } else if (/^participant:(.*) as (.*)$/.exec(line) != null) {
        var who = RegExp.$1.trim()
        var alias = RegExp.$2.trim()
        scope.getUser(who, alias)
      } else if (/^participant:(.*)$/.exec(line) != null) {
        var who = RegExp.$1.trim()
        scope.getUser(who)
      } else if (/^note (left of|right of|over) (.*):(.*)$/.exec(line) != null) {
        var position = RegExp.$1.trim()
        var who = RegExp.$2.trim()
        var text = RegExp.$3.trim()
        var user = scope.getUser(who)
        var dx
        if (position == 'right of') dx = scope.margin
        else if (position == 'left of') dx = -scope.margin - scope.note_width
        else if (position == 'over') dx = -scope.note_width / 2
        scope.notes.push({
          x: user.x + scope.user_width / 2 + dx,
          y: scope.height,
          text: text
        })
        scope.height += scope.note_height
      }
    }
    //add height for margin and height for bottom user boxes
    scope.height += scope.margin + scope.user_height
    //add vertical lines
    for (var i in scope.users) {
      var user = scope.users[i]
      scope.lines.push({
        x: user.x + scope.user_width / 2, y: scope.user_height,
        dx: 0, dy: scope.height - 2 * scope.user_height
      })
    }
    //add bottom user boxes
    for (var i in scope.users) {
      var user = scope.users[i]
      scope.users.push({
        x: user.x,
        y: scope.height - scope.user_height,
        name: user.name
      })
    }
    // console.log(scope.users, scope.lines, scope.arrows)
  }
  scope.getUser = function(name, alias){
    for (var i = 0; i < scope.users.length; i++) {
      var user = scope.users[i]
      if (user.name == name || user.alias == name) {
        return user
      }
    }
    scope.width += 200
    var user = {
      x: scope.width - scope.user_width,
      y: 0,
      name: name,
      alias: alias
    }
    scope.users.push(user)
    return user
  }
  scope.byHand = function(x1, y1, x2, y2) {
    var points = x1+','+y1
    if (scope.wantHandDraw) {
      rnd.reset()
      //number of segments (one segment for every 10 pixels)
      var seg = Math.ceil(Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2))/10)
      var inaccuracy = 2
      function mod(x){
        return x + rnd.next() * inaccuracy - inaccuracy / 2
      }
      var x = x1
      var y = y1
      var dx = (x2 - x1) / seg
      var dy = (y2 - y1) / seg
      for (var i = 1; i < seg; i++) {
        x += dx
        y += dy
        points += ' '+mod(x)+','+mod(y)
      }
    }
    return points+' '+x2+','+y2
  }
  scope.rectByHand = function(x1, y1, x2, y2) {
    return [
      scope.byHand(x1,y1, x2,y1),
      scope.byHand(x2,y1, x2,y2),
      scope.byHand(x2,y2, x1, y2),
      scope.byHand(x1,y2, x1, y1)
      ].join(" ")
  }
  scope.print = function(){
    // PostScript reference: http://www.ugrad.math.ubc.ca/Flat/
    var page = scope.paperSizes[scope.pageSize]
    var sw = (page.width - 2 * scope.margin) / scope.width
    var sh = (page.height - 2 * scope.margin) / scope.height
    var rotate = false
    var scale = Math.min(sw, sh)
    if (sw < sh) {
      rotate = true
      sw = (page.height - 2 * scope.margin) / scope.width
      sh = (page.width - 2 * scope.margin) / scope.height
      scale = Math.min(sw, sh)
    }
    var ps = '%!PS\n'+
      '/PageSize '+scope.pageSize+'\n'+
      (rotate ? page.width+' 0 translate 90 rotate' : '')+'\n'+
      scope.margin+' '+scope.margin+' translate\n'+
      scale+' '+scale+' scale\n'+
      '/UW '+scope.user_width+' def %user_width\n'+
      '/UH '+scope.user_height+' def %user_height\n'+
      '/NW '+scope.note_width+' def %note_width\n'+
      '/NH '+scope.note_height+' def %note_height\n'+
      '/wantHandDraw '+(scope.wantHandDraw ? 1 : 0)+' def\n'+
      post_script_functions
    for (var i in scope.users) {
      var user = scope.users[i]
      ps += '('+user.name+') '+user.x+' '+(scope.height-user.y)+' USER\n'
    }
    for (var i in scope.lines) {
      var line = scope.lines[i]
      ps += line.x+' '+(scope.height-line.y)+' '+line.dx+' '+(-line.dy)+' LINE\n'
    }
    for (var i in scope.arrows) {
      var arrow = scope.arrows[i]
      ps += '('+arrow.text+') '+arrow.x+' '+(scope.height-arrow.y)+' '+
        arrow.direction+' '+arrow.length+' '+(arrow.dashed ? 'DASHED' : '')+'ARROW\n'
    }
    for (var i in scope.notes) {
      var note = scope.notes[i]
      ps += '('+note.text+') '+note.x+' '+(scope.height-note.y)+' NOTE\n'
    }
    ps += 'showpage\n'
    // console.log(ps)
    scope.download(ps)
  }
}])
